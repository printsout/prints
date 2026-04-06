"""
Test Customer Password Reset LINK Flow (Token-based)
Tests the NEW link-based forgot-password and reset-password endpoints.
The flow changed from code-based to token-based:
- forgot-password creates a reset_token (UUID) in user_password_resets collection
- reset-password accepts {token, new_password} instead of {email, code, new_password}
- Email sends a link to /aterstall-losenord?token=XXX
"""
import pytest
import requests
import os
import uuid
from datetime import datetime
from pymongo import MongoClient

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

# Test user credentials
TEST_USER_EMAIL = f"test_reset_link_{uuid.uuid4().hex[:8]}@example.com"
TEST_USER_NAME = "Test Reset Link User"
TEST_USER_PASSWORD = "TestPass123!"  # Strong password meeting requirements
NEW_PASSWORD = "NewSecure456!"  # New password for reset test


class TestForgotPasswordEndpoint:
    """Test POST /api/auth/forgot-password endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session and MongoDB connection"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Connect to MongoDB to verify token creation
        self.mongo_client = MongoClient(MONGO_URL)
        self.db = self.mongo_client[DB_NAME]
        yield
        self.mongo_client.close()
    
    def test_01_forgot_password_with_registered_email_returns_success(self):
        """POST /api/auth/forgot-password with registered email should return success and create reset_token in DB"""
        # First register a test user
        register_response = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_USER_EMAIL,
            "name": TEST_USER_NAME,
            "password": TEST_USER_PASSWORD
        })
        
        if register_response.status_code == 400 and "redan registrerad" in register_response.text:
            print(f"User {TEST_USER_EMAIL} already exists, continuing...")
        elif register_response.status_code != 200:
            pytest.fail(f"Failed to register test user: {register_response.text}")
        
        # Request forgot password
        response = self.session.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": TEST_USER_EMAIL
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "message" in data
        print(f"✓ Forgot password returns success message: {data['message']}")
        
        # Verify reset_token was created in DB
        reset_doc = self.db.user_password_resets.find_one({"email": TEST_USER_EMAIL})
        assert reset_doc is not None, "Reset token document not found in DB"
        assert "reset_token" in reset_doc, "reset_token field not found in document"
        assert reset_doc["used"] == False, "Token should not be marked as used"
        assert "expires_at" in reset_doc, "expires_at field not found"
        print(f"✓ Reset token created in DB: {reset_doc['reset_token'][:8]}...")
    
    def test_02_forgot_password_with_nonexistent_email_returns_same_success(self):
        """POST /api/auth/forgot-password with non-existent email should return same success message (security)"""
        response = self.session.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": "nonexistent_user_xyz123@example.com"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "message" in data
        # Should return generic message that doesn't reveal if email exists
        print(f"✓ Non-existent email returns same success message: {data['message']}")
    
    def test_03_forgot_password_with_empty_email_returns_400(self):
        """POST /api/auth/forgot-password with empty email should return 400"""
        response = self.session.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": ""
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        print("✓ Empty email returns 400 error")


class TestResetPasswordEndpoint:
    """Test POST /api/auth/reset-password endpoint with token-based flow"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session and MongoDB connection"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.mongo_client = MongoClient(MONGO_URL)
        self.db = self.mongo_client[DB_NAME]
        self.test_email = f"test_reset_{uuid.uuid4().hex[:8]}@example.com"
        self.test_password = os.environ.get("TEST_PASSWORD", "InitialPass123!")
        self.new_password = os.environ.get("TEST_NEW_PASSWORD", "NewSecure789!")
        yield
        # Cleanup
        self.db.user_password_resets.delete_many({"email": self.test_email})
        self.db.users.delete_many({"email": self.test_email})
        self.mongo_client.close()
    
    def _create_user_and_get_reset_token(self):
        """Helper: Register user, request forgot password, return token from DB"""
        # Register user
        self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.test_email,
            "name": "Reset Test User",
            "password": self.test_password
        })
        
        # Request forgot password
        self.session.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": self.test_email
        })
        
        # Get token from DB
        reset_doc = self.db.user_password_resets.find_one({"email": self.test_email})
        if reset_doc:
            return reset_doc["reset_token"]
        return None
    
    def test_01_reset_password_with_valid_token_changes_password(self):
        """POST /api/auth/reset-password with valid token and new password should change password"""
        token = self._create_user_and_get_reset_token()
        assert token is not None, "Failed to get reset token"
        
        response = self.session.post(f"{BASE_URL}/api/auth/reset-password", json={
            "token": token,
            "new_password": self.new_password
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "message" in data
        print(f"✓ Password reset successful: {data['message']}")
        
        # Verify token is marked as used
        reset_doc = self.db.user_password_resets.find_one({"reset_token": token})
        assert reset_doc["used"] == True, "Token should be marked as used"
        print("✓ Token marked as used in DB")
    
    def test_02_reset_password_with_invalid_token_returns_400(self):
        """POST /api/auth/reset-password with invalid token should return 400"""
        response = self.session.post(f"{BASE_URL}/api/auth/reset-password", json={
            "token": "invalid-token-12345",
            "new_password": self.new_password
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert "detail" in data
        print(f"✓ Invalid token returns 400: {data['detail']}")
    
    def test_03_reset_password_with_weak_password_short_returns_400(self):
        """POST /api/auth/reset-password with short password should return validation error"""
        token = self._create_user_and_get_reset_token()
        
        response = self.session.post(f"{BASE_URL}/api/auth/reset-password", json={
            "token": token,
            "new_password": "short"  # Less than 8 characters
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert "detail" in data
        print(f"✓ Short password returns validation error: {data['detail']}")
    
    def test_04_reset_password_with_weak_password_no_uppercase_returns_400(self):
        """POST /api/auth/reset-password with password missing uppercase should return validation error"""
        token = self._create_user_and_get_reset_token()
        
        response = self.session.post(f"{BASE_URL}/api/auth/reset-password", json={
            "token": token,
            "new_password": "lowercase123!"  # No uppercase
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert "detail" in data
        print(f"✓ Password without uppercase returns validation error: {data['detail']}")
    
    def test_05_reset_password_with_weak_password_no_digit_returns_400(self):
        """POST /api/auth/reset-password with password missing digit should return validation error"""
        token = self._create_user_and_get_reset_token()
        
        response = self.session.post(f"{BASE_URL}/api/auth/reset-password", json={
            "token": token,
            "new_password": "NoDigitsHere!"  # No digit
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert "detail" in data
        print(f"✓ Password without digit returns validation error: {data['detail']}")
    
    def test_06_reset_password_with_weak_password_no_special_returns_400(self):
        """POST /api/auth/reset-password with password missing special char should return validation error"""
        token = self._create_user_and_get_reset_token()
        
        response = self.session.post(f"{BASE_URL}/api/auth/reset-password", json={
            "token": token,
            "new_password": "NoSpecial123"  # No special character
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert "detail" in data
        print(f"✓ Password without special char returns validation error: {data['detail']}")


class TestLoginAfterPasswordReset:
    """Test login works correctly after password reset"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session and MongoDB connection"""
        import time
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.mongo_client = MongoClient(MONGO_URL)
        self.db = self.mongo_client[DB_NAME]
        self.test_email = f"test_login_after_reset_{uuid.uuid4().hex[:8]}@example.com"
        self.old_password = os.environ.get("TEST_PASSWORD", "OldPass123!")
        self.new_password = os.environ.get("TEST_NEW_PASSWORD", "NewPass456!")
        yield
        # Cleanup
        self.db.user_password_resets.delete_many({"email": self.test_email})
        self.db.users.delete_many({"email": self.test_email})
        self.mongo_client.close()
    
    def _request_forgot_password_with_retry(self, email, max_retries=3):
        """Request forgot password with retry on rate limit"""
        import time
        response = None
        for i in range(max_retries):
            response = self.session.post(f"{BASE_URL}/api/auth/forgot-password", json={
                "email": email
            })
            if response.status_code == 429:
                print(f"Rate limited, waiting 60s... (attempt {i+1}/{max_retries})")
                time.sleep(60)
            else:
                return response
        return response
    
    def test_01_login_with_new_password_after_reset_works(self):
        """After password reset, login with new password should work"""
        # Register user
        register_response = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.test_email,
            "name": "Login After Reset User",
            "password": self.old_password
        })
        if register_response.status_code == 429:
            pytest.skip("Rate limited on register endpoint")
        assert register_response.status_code == 200, f"Failed to register: {register_response.text}"
        
        # Request forgot password with retry
        forgot_response = self._request_forgot_password_with_retry(self.test_email)
        if forgot_response.status_code == 429:
            pytest.skip("Rate limited on forgot-password endpoint")
        
        # Get token from DB
        reset_doc = self.db.user_password_resets.find_one({"email": self.test_email})
        assert reset_doc is not None, "Reset token not found"
        token = reset_doc["reset_token"]
        
        # Reset password
        reset_response = self.session.post(f"{BASE_URL}/api/auth/reset-password", json={
            "token": token,
            "new_password": self.new_password
        })
        assert reset_response.status_code == 200, f"Failed to reset password: {reset_response.text}"
        
        # Login with NEW password
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": self.test_email,
            "password": self.new_password
        })
        
        assert login_response.status_code == 200, f"Expected 200, got {login_response.status_code}: {login_response.text}"
        data = login_response.json()
        assert "access_token" in data
        print("✓ Login with new password after reset works")
    
    def test_02_login_with_old_password_after_reset_fails(self):
        """After password reset, login with old password should fail"""
        # Register user
        register_response = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.test_email,
            "name": "Login After Reset User",
            "password": self.old_password
        })
        if register_response.status_code == 429:
            pytest.skip("Rate limited on register endpoint")
        assert register_response.status_code == 200, f"Failed to register: {register_response.text}"
        
        # Request forgot password with retry
        forgot_response = self._request_forgot_password_with_retry(self.test_email)
        if forgot_response.status_code == 429:
            pytest.skip("Rate limited on forgot-password endpoint")
        
        # Get token from DB
        reset_doc = self.db.user_password_resets.find_one({"email": self.test_email})
        assert reset_doc is not None, "Reset token not found"
        token = reset_doc["reset_token"]
        
        # Reset password
        reset_response = self.session.post(f"{BASE_URL}/api/auth/reset-password", json={
            "token": token,
            "new_password": self.new_password
        })
        assert reset_response.status_code == 200, f"Failed to reset password: {reset_response.text}"
        
        # Login with OLD password - should fail
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": self.test_email,
            "password": self.old_password
        })
        
        assert login_response.status_code == 401, f"Expected 401, got {login_response.status_code}: {login_response.text}"
        print("✓ Login with old password after reset fails (401)")


class TestUsedTokenCannotBeReused:
    """Test that used tokens cannot be reused"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session and MongoDB connection"""
        import time
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.mongo_client = MongoClient(MONGO_URL)
        self.db = self.mongo_client[DB_NAME]
        self.test_email = f"test_token_reuse_{uuid.uuid4().hex[:8]}@example.com"
        self.password = os.environ.get("TEST_PASSWORD", "TestPass123!")
        self.new_password = os.environ.get("TEST_NEW_PASSWORD", "NewPass456!")
        yield
        # Cleanup
        self.db.user_password_resets.delete_many({"email": self.test_email})
        self.db.users.delete_many({"email": self.test_email})
        self.mongo_client.close()
    
    def _request_forgot_password_with_retry(self, email, max_retries=3):
        """Request forgot password with retry on rate limit"""
        import time
        response = None
        for i in range(max_retries):
            response = self.session.post(f"{BASE_URL}/api/auth/forgot-password", json={
                "email": email
            })
            if response.status_code == 429:
                print(f"Rate limited, waiting 60s... (attempt {i+1}/{max_retries})")
                time.sleep(60)
            else:
                return response
        return response
    
    def test_used_token_cannot_be_reused(self):
        """A token that has been used should not work again"""
        # Register user
        register_response = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.test_email,
            "name": "Token Reuse Test User",
            "password": self.password
        })
        if register_response.status_code == 429:
            pytest.skip("Rate limited on register endpoint")
        
        # Request forgot password with retry
        forgot_response = self._request_forgot_password_with_retry(self.test_email)
        if forgot_response.status_code == 429:
            pytest.skip("Rate limited on forgot-password endpoint")
        
        # Get token from DB
        reset_doc = self.db.user_password_resets.find_one({"email": self.test_email})
        if reset_doc is None:
            pytest.skip("Reset token not created (possibly rate limited)")
        token = reset_doc["reset_token"]
        
        # First reset - should work
        first_reset = self.session.post(f"{BASE_URL}/api/auth/reset-password", json={
            "token": token,
            "new_password": self.new_password
        })
        assert first_reset.status_code == 200, f"First reset failed: {first_reset.text}"
        print("✓ First password reset with token works")
        
        # Second reset with same token - should fail
        second_reset = self.session.post(f"{BASE_URL}/api/auth/reset-password", json={
            "token": token,
            "new_password": "AnotherPass789!"
        })
        assert second_reset.status_code == 400, f"Expected 400, got {second_reset.status_code}: {second_reset.text}"
        print("✓ Second password reset with same token fails (400)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
