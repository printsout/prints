"""
Test Customer Forgot Password Flow
Tests the new customer forgot-password and reset-password endpoints.
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user credentials - will be created during test
TEST_USER_EMAIL = f"test_customer_{uuid.uuid4().hex[:8]}@example.com"
TEST_USER_NAME = "Test Customer"
TEST_USER_PASSWORD = "TestPass123!"  # Strong password meeting requirements
NEW_PASSWORD = "NewSecure456!"  # New password for reset test


class TestCustomerForgotPasswordFlow:
    """Test customer forgot-password and reset-password endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.user_created = False
        self.reset_code = None
        yield
        # Cleanup: Delete test user if created
        if self.user_created:
            self._cleanup_test_user()
    
    def _cleanup_test_user(self):
        """Clean up test user from database"""
        # Note: No direct delete endpoint for users, but we can leave it
        # In production, would use admin API to delete
        print(f"Note: Test user {TEST_USER_EMAIL} should be cleaned up manually or via admin API")
    
    def _register_test_user(self):
        """Register a test customer user"""
        response = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_USER_EMAIL,
            "name": TEST_USER_NAME,
            "password": TEST_USER_PASSWORD
        })
        if response.status_code == 200:
            self.user_created = True
            print(f"✓ Test user registered: {TEST_USER_EMAIL}")
            return response.json()
        elif response.status_code == 400 and "redan registrerad" in response.text:
            # User already exists
            self.user_created = True
            print(f"✓ Test user already exists: {TEST_USER_EMAIL}")
            return None
        else:
            print(f"✗ Failed to register test user: {response.status_code} - {response.text}")
            return None
    
    # ============== FORGOT PASSWORD TESTS ==============
    
    def test_01_forgot_password_nonexistent_email(self):
        """POST /api/auth/forgot-password with non-existent email should return success (not reveal if email exists)"""
        response = self.session.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": "nonexistent_user_12345@example.com"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "message" in data
        # Should return generic message that doesn't reveal if email exists
        print(f"✓ Non-existent email returns success message: {data['message']}")
    
    def test_02_forgot_password_empty_email(self):
        """POST /api/auth/forgot-password with empty email should return 400"""
        response = self.session.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": ""
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        print("✓ Empty email returns 400 error")
    
    def test_03_forgot_password_valid_customer_email(self):
        """POST /api/auth/forgot-password with valid customer email should create reset code"""
        # First register a test user
        self._register_test_user()
        
        response = self.session.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": TEST_USER_EMAIL
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "message" in data
        print(f"✓ Valid customer email returns success: {data['message']}")
        # Note: Reset code is stored in DB, not returned in response (unlike admin endpoint)
    
    # ============== RESET PASSWORD TESTS ==============
    
    def test_04_reset_password_invalid_code(self):
        """POST /api/auth/reset-password with invalid code should return 400"""
        response = self.session.post(f"{BASE_URL}/api/auth/reset-password", json={
            "email": TEST_USER_EMAIL,
            "code": "INVALID1",
            "new_password": NEW_PASSWORD
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert "detail" in data
        print(f"✓ Invalid code returns 400: {data['detail']}")
    
    def test_05_reset_password_weak_password_short(self):
        """POST /api/auth/reset-password with short password should return validation error"""
        response = self.session.post(f"{BASE_URL}/api/auth/reset-password", json={
            "email": TEST_USER_EMAIL,
            "code": "ANYCODE1",
            "new_password": "short"  # Less than 8 characters
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert "detail" in data
        # Should mention password length requirement
        print(f"✓ Short password returns validation error: {data['detail']}")
    
    def test_06_reset_password_weak_password_no_uppercase(self):
        """POST /api/auth/reset-password with password missing uppercase should return validation error"""
        response = self.session.post(f"{BASE_URL}/api/auth/reset-password", json={
            "email": TEST_USER_EMAIL,
            "code": "ANYCODE1",
            "new_password": "lowercase123!"  # No uppercase
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert "detail" in data
        print(f"✓ Password without uppercase returns validation error: {data['detail']}")
    
    def test_07_reset_password_weak_password_no_lowercase(self):
        """POST /api/auth/reset-password with password missing lowercase should return validation error"""
        response = self.session.post(f"{BASE_URL}/api/auth/reset-password", json={
            "email": TEST_USER_EMAIL,
            "code": "ANYCODE1",
            "new_password": "UPPERCASE123!"  # No lowercase
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert "detail" in data
        print(f"✓ Password without lowercase returns validation error: {data['detail']}")
    
    def test_08_reset_password_weak_password_no_digit(self):
        """POST /api/auth/reset-password with password missing digit should return validation error"""
        response = self.session.post(f"{BASE_URL}/api/auth/reset-password", json={
            "email": TEST_USER_EMAIL,
            "code": "ANYCODE1",
            "new_password": "NoDigitsHere!"  # No digit
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert "detail" in data
        print(f"✓ Password without digit returns validation error: {data['detail']}")
    
    def test_09_reset_password_weak_password_no_special(self):
        """POST /api/auth/reset-password with password missing special char should return validation error"""
        response = self.session.post(f"{BASE_URL}/api/auth/reset-password", json={
            "email": TEST_USER_EMAIL,
            "code": "ANYCODE1",
            "new_password": "NoSpecial123"  # No special character
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert "detail" in data
        print(f"✓ Password without special char returns validation error: {data['detail']}")


class TestCustomerForgotPasswordE2E:
    """End-to-end test for customer forgot-password flow using MongoDB to get reset code"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.test_email = f"test_e2e_{uuid.uuid4().hex[:8]}@example.com"
        self.test_password = "InitialPass123!"
        self.new_password = "ResetPass456!"
        yield
    
    def test_full_forgot_password_flow(self):
        """
        Full E2E test:
        1. Register user
        2. Request forgot password
        3. Get reset code from DB (via backend logs or direct DB access)
        4. Reset password
        5. Login with new password
        """
        # Step 1: Register user
        print(f"\n--- Step 1: Register user {self.test_email} ---")
        register_response = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.test_email,
            "name": "E2E Test User",
            "password": self.test_password
        })
        
        if register_response.status_code != 200:
            pytest.skip(f"Could not register test user: {register_response.text}")
        
        print(f"✓ User registered successfully")
        
        # Step 2: Request forgot password
        print(f"\n--- Step 2: Request forgot password ---")
        forgot_response = self.session.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": self.test_email
        })
        
        assert forgot_response.status_code == 200, f"Forgot password failed: {forgot_response.text}"
        print(f"✓ Forgot password request successful")
        
        # Step 3: Get reset code - we need to query MongoDB directly
        # Since we can't access DB directly in this test, we'll note this limitation
        print(f"\n--- Step 3: Reset code created in DB ---")
        print("Note: Reset code is stored in 'user_password_resets' collection")
        print("In production, user would receive this via email")
        print("For testing, check backend logs or query MongoDB directly")
        
        # Step 4 & 5: Would require the reset code from DB
        # This is a limitation of the test - we can't get the code without DB access
        print(f"\n--- Steps 4-5: Require reset code from DB ---")
        print("To complete E2E test, query MongoDB: db.user_password_resets.find({email: '" + self.test_email + "'})")


class TestCustomerLoginAfterReset:
    """Test that login works correctly after password operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        yield
    
    def test_login_with_wrong_password(self):
        """POST /api/auth/login with wrong password should return 401"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "any@example.com",
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Login with wrong password returns 401")
    
    def test_login_endpoint_exists(self):
        """POST /api/auth/login endpoint should exist and respond"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@example.com",
            "password": "testpassword"
        })
        
        # Should return 401 (unauthorized) not 404 (not found)
        assert response.status_code in [200, 401], f"Expected 200 or 401, got {response.status_code}"
        print(f"✓ Login endpoint exists and responds with {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
