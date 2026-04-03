"""
Test Suite for MANDATORY 2FA Admin Login
=========================================
Tests the new mandatory 2FA flow where:
1. POST /api/admin/login ALWAYS returns requires_2fa: true (never access_token directly)
2. If 2FA not set up: returns needs_setup: true, qr_code, and secret
3. If 2FA already set up: returns needs_setup: false, no qr_code
4. POST /api/admin/verify-2fa with valid temp_token and TOTP code returns access_token AND activates 2FA if first time
5. After first successful verify-2fa, subsequent logins return needs_setup: false
"""

import pytest
import requests
import pyotp
import os
from pymongo import MongoClient

# Configuration
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://printout-lab.preview.emergentagent.com')
ADMIN_EMAIL = admin_email
ADMIN_PASSWORD = admin_password

# MongoDB connection for cleanup
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')


@pytest.fixture(scope="module")
def mongo_client():
    """MongoDB client for test setup/cleanup"""
    client = MongoClient(MONGO_URL)
    yield client[DB_NAME]
    client.close()


@pytest.fixture(scope="module")
def api_session():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="function")
def reset_2fa_state(mongo_client):
    """Reset 2FA state before each test to ensure clean state"""
    # Delete 2FA settings to simulate first-time setup
    mongo_client.admin_settings_2fa.delete_many({"admin_email": ADMIN_EMAIL})
    yield
    # Cleanup after test - leave 2FA disabled for next tests
    mongo_client.admin_settings_2fa.delete_many({"admin_email": ADMIN_EMAIL})


class TestMandatory2FALogin:
    """Test that admin login ALWAYS requires 2FA"""

    def test_login_with_correct_credentials_always_requires_2fa(self, api_session, reset_2fa_state):
        """
        Test: POST /api/admin/login with correct credentials should ALWAYS return requires_2fa: true
        It should NEVER return access_token directly
        """
        response = api_session.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # CRITICAL: Must always require 2FA
        assert data.get("requires_2fa") == True, "Login should ALWAYS require 2FA"
        
        # CRITICAL: Should NOT return access_token directly
        assert "access_token" not in data, "Login should NOT return access_token directly - 2FA is mandatory"
        
        # Should return temp_token for 2FA verification
        assert "temp_token" in data, "Login should return temp_token for 2FA verification"
        
        print(f"✓ Login correctly requires 2FA, temp_token received")

    def test_login_first_time_returns_qr_code_for_setup(self, api_session, reset_2fa_state):
        """
        Test: First-time login (2FA not set up) should return needs_setup: true with QR code
        """
        response = api_session.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # First time setup
        assert data.get("requires_2fa") == True
        assert data.get("needs_setup") == True, "First-time login should require 2FA setup"
        assert "qr_code" in data, "First-time login should return QR code"
        assert "secret" in data, "First-time login should return TOTP secret"
        assert data["qr_code"].startswith("data:image/png;base64,"), "QR code should be base64 PNG"
        assert len(data["secret"]) >= 16, "Secret should be valid base32 string"
        
        print(f"✓ First-time login returns QR code and secret for setup")

    def test_login_wrong_password_returns_401(self, api_session):
        """Test: Wrong password should return 401"""
        response = api_session.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": "WrongPassword123!"
        })
        
        assert response.status_code == 401
        print(f"✓ Wrong password correctly returns 401")

    def test_login_wrong_email_returns_401(self, api_session):
        """Test: Wrong email should return 401"""
        response = api_session.post(f"{BASE_URL}/api/admin/login", json={
            "email": "wrong@email.com",
            "password": ADMIN_PASSWORD
        })
        
        assert response.status_code == 401
        print(f"✓ Wrong email correctly returns 401")


class TestVerify2FA:
    """Test 2FA verification endpoint"""

    def test_verify_2fa_with_valid_code_returns_access_token(self, api_session, reset_2fa_state):
        """
        Test: POST /api/admin/verify-2fa with valid temp_token and TOTP code should return access_token
        """
        # Step 1: Login to get temp_token and secret
        login_response = api_session.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        assert login_response.status_code == 200
        login_data = login_response.json()
        temp_token = login_data["temp_token"]
        secret = login_data["secret"]
        
        # Step 2: Generate valid TOTP code
        totp = pyotp.TOTP(secret)
        valid_code = totp.now()
        
        # Step 3: Verify 2FA
        verify_response = api_session.post(f"{BASE_URL}/api/admin/verify-2fa", json={
            "temp_token": temp_token,
            "code": valid_code
        })
        
        assert verify_response.status_code == 200, f"Expected 200, got {verify_response.status_code}: {verify_response.text}"
        verify_data = verify_response.json()
        
        # Should return access_token
        assert "access_token" in verify_data, "verify-2fa should return access_token"
        assert verify_data.get("token_type") == "bearer"
        
        print(f"✓ verify-2fa with valid code returns access_token")

    def test_verify_2fa_activates_2fa_on_first_use(self, api_session, reset_2fa_state, mongo_client):
        """
        Test: First successful verify-2fa should activate 2FA (set totp_enabled: true)
        """
        # Step 1: Login to get temp_token and secret
        login_response = api_session.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        login_data = login_response.json()
        temp_token = login_data["temp_token"]
        secret = login_data["secret"]
        
        # Verify 2FA is not enabled yet
        admin_2fa = mongo_client.admin_settings_2fa.find_one({"admin_email": ADMIN_EMAIL})
        assert admin_2fa is None or admin_2fa.get("totp_enabled") == False, "2FA should not be enabled before verification"
        
        # Step 2: Verify with valid code
        totp = pyotp.TOTP(secret)
        valid_code = totp.now()
        
        verify_response = api_session.post(f"{BASE_URL}/api/admin/verify-2fa", json={
            "temp_token": temp_token,
            "code": valid_code
        })
        
        assert verify_response.status_code == 200
        
        # Step 3: Check that 2FA is now enabled in database
        admin_2fa = mongo_client.admin_settings_2fa.find_one({"admin_email": ADMIN_EMAIL})
        assert admin_2fa is not None, "2FA settings should exist after verification"
        assert admin_2fa.get("totp_enabled") == True, "2FA should be enabled after first verification"
        
        print(f"✓ First verify-2fa activates 2FA (totp_enabled: true)")

    def test_verify_2fa_with_invalid_code_returns_401(self, api_session, reset_2fa_state):
        """Test: Invalid TOTP code should return 401"""
        # Login to get temp_token
        login_response = api_session.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        login_data = login_response.json()
        temp_token = login_data["temp_token"]
        
        # Try with invalid code
        verify_response = api_session.post(f"{BASE_URL}/api/admin/verify-2fa", json={
            "temp_token": temp_token,
            "code": "000000"  # Invalid code
        })
        
        assert verify_response.status_code == 401, f"Expected 401, got {verify_response.status_code}"
        print(f"✓ Invalid TOTP code correctly returns 401")

    def test_verify_2fa_with_invalid_temp_token_returns_401(self, api_session):
        """Test: Invalid temp_token should return 401"""
        verify_response = api_session.post(f"{BASE_URL}/api/admin/verify-2fa", json={
            "temp_token": "invalid_token_here",
            "code": "123456"
        })
        
        assert verify_response.status_code == 401
        print(f"✓ Invalid temp_token correctly returns 401")


class TestSubsequentLogins:
    """Test that subsequent logins after 2FA setup work correctly"""

    def test_subsequent_login_returns_needs_setup_false(self, api_session, mongo_client):
        """
        Test: After 2FA is set up and activated, subsequent logins should return needs_setup: false
        """
        # First, clean up and do initial setup
        mongo_client.admin_settings_2fa.delete_many({"admin_email": ADMIN_EMAIL})
        
        # Step 1: First login (setup)
        login1 = api_session.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        data1 = login1.json()
        assert data1.get("needs_setup") == True, "First login should need setup"
        
        # Step 2: Complete 2FA setup
        totp = pyotp.TOTP(data1["secret"])
        verify_response = api_session.post(f"{BASE_URL}/api/admin/verify-2fa", json={
            "temp_token": data1["temp_token"],
            "code": totp.now()
        })
        assert verify_response.status_code == 200
        
        # Step 3: Second login (should not need setup)
        login2 = api_session.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        data2 = login2.json()
        assert data2.get("requires_2fa") == True, "Second login should still require 2FA"
        assert data2.get("needs_setup") == False, "Second login should NOT need setup"
        assert "qr_code" not in data2, "Second login should NOT return QR code"
        assert "secret" not in data2, "Second login should NOT return secret"
        assert "temp_token" in data2, "Second login should return temp_token"
        
        print(f"✓ Subsequent login correctly returns needs_setup: false without QR code")
        
        # Cleanup
        mongo_client.admin_settings_2fa.delete_many({"admin_email": ADMIN_EMAIL})

    def test_full_2fa_flow_returning_user(self, api_session, mongo_client):
        """
        Test: Full flow for returning user (2FA already set up)
        1. Login -> get temp_token (no QR code)
        2. Verify with code -> get access_token
        """
        # Setup: Create 2FA settings with enabled state
        secret = pyotp.random_base32()
        mongo_client.admin_settings_2fa.update_one(
            {"admin_email": ADMIN_EMAIL},
            {"$set": {
                "admin_email": ADMIN_EMAIL,
                "totp_secret": secret,
                "totp_enabled": True
            }},
            upsert=True
        )
        
        # Step 1: Login
        login_response = api_session.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        assert login_response.status_code == 200
        login_data = login_response.json()
        
        assert login_data.get("requires_2fa") == True
        assert login_data.get("needs_setup") == False
        assert "qr_code" not in login_data
        assert "temp_token" in login_data
        
        # Step 2: Verify with code
        totp = pyotp.TOTP(secret)
        verify_response = api_session.post(f"{BASE_URL}/api/admin/verify-2fa", json={
            "temp_token": login_data["temp_token"],
            "code": totp.now()
        })
        
        assert verify_response.status_code == 200
        verify_data = verify_response.json()
        assert "access_token" in verify_data
        
        print(f"✓ Full returning user flow works correctly")
        
        # Cleanup
        mongo_client.admin_settings_2fa.delete_many({"admin_email": ADMIN_EMAIL})


class TestForgotPasswordFromLogin:
    """Test forgot password link from login step"""

    def test_forgot_password_endpoint_works(self, api_session):
        """Test: Forgot password endpoint should work"""
        response = api_session.post(f"{BASE_URL}/api/admin/forgot-password", json={
            "email": ADMIN_EMAIL
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        # In dev mode, reset_code is returned
        if "reset_code" in data:
            assert len(data["reset_code"]) == 8
        
        print(f"✓ Forgot password endpoint works")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
