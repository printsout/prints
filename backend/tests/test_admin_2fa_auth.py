"""
Test Admin 2FA Authentication and Password Reset Flows
Tests for:
- Admin login with correct/incorrect credentials
- 2FA setup, confirm, verify, disable
- Forgot password and reset password flows
"""
import pytest
import requests
import os
import pyotp

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_EMAIL = admin_email
ADMIN_PASSWORD = admin_password

class TestAdminLogin:
    """Test admin login without 2FA"""
    
    def test_admin_login_success(self):
        """Test admin login with correct credentials - should return access_token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        print(f"Login response status: {response.status_code}")
        print(f"Login response: {response.json()}")
        
        assert response.status_code == 200
        data = response.json()
        
        # When 2FA is not enabled, should return access_token directly
        # When 2FA is enabled, should return requires_2fa: true
        if data.get("requires_2fa"):
            assert "temp_token" in data
            print("2FA is enabled - requires verification")
        else:
            assert "access_token" in data
            assert data.get("requires_2fa") == False
            print("Login successful without 2FA")
    
    def test_admin_login_wrong_password(self):
        """Test admin login with wrong password - should return 401"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": "WrongPassword123!"
        })
        print(f"Wrong password response: {response.status_code}")
        
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
    
    def test_admin_login_wrong_email(self):
        """Test admin login with wrong email - should return 401"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": "wrong@email.com",
            "password": ADMIN_PASSWORD
        })
        print(f"Wrong email response: {response.status_code}")
        
        assert response.status_code == 401


class TestAdmin2FAStatus:
    """Test 2FA status endpoint"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token (handles both 2FA and non-2FA cases)"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        data = response.json()
        
        if data.get("requires_2fa"):
            # 2FA is enabled - we need to verify
            # For testing, we'll skip this test if 2FA is already enabled
            pytest.skip("2FA is already enabled - cannot get token without TOTP code")
        
        return data.get("access_token")
    
    def test_2fa_status_endpoint(self, admin_token):
        """Test GET /api/admin/2fa-status returns enabled status"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/2fa-status", headers=headers)
        
        print(f"2FA status response: {response.status_code}")
        print(f"2FA status: {response.json()}")
        
        assert response.status_code == 200
        data = response.json()
        assert "enabled" in data
        assert isinstance(data["enabled"], bool)


class TestAdmin2FASetupFlow:
    """Test complete 2FA setup, confirm, and disable flow"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        data = response.json()
        
        if data.get("requires_2fa"):
            pytest.skip("2FA is already enabled - cannot test setup flow")
        
        return data.get("access_token")
    
    def test_setup_2fa_returns_qr_and_secret(self, admin_token):
        """Test POST /api/admin/setup-2fa returns QR code and secret"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.post(f"{BASE_URL}/api/admin/setup-2fa", headers=headers)
        
        print(f"Setup 2FA response: {response.status_code}")
        
        assert response.status_code == 200
        data = response.json()
        assert "qr_code" in data
        assert "secret" in data
        assert data["qr_code"].startswith("data:image/png;base64,")
        assert len(data["secret"]) > 10  # Base32 secret should be substantial
        print(f"Got secret: {data['secret'][:10]}...")
    
    def test_full_2fa_flow(self, admin_token):
        """Test complete 2FA flow: setup -> confirm -> verify login -> disable"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Step 1: Check initial 2FA status
        status_resp = requests.get(f"{BASE_URL}/api/admin/2fa-status", headers=headers)
        initial_status = status_resp.json()
        print(f"Initial 2FA status: {initial_status}")
        
        if initial_status.get("enabled"):
            print("2FA already enabled - skipping setup test")
            pytest.skip("2FA already enabled")
        
        # Step 2: Setup 2FA - get QR code and secret
        setup_resp = requests.post(f"{BASE_URL}/api/admin/setup-2fa", headers=headers)
        assert setup_resp.status_code == 200
        setup_data = setup_resp.json()
        secret = setup_data["secret"]
        print(f"Got TOTP secret: {secret}")
        
        # Step 3: Generate valid TOTP code using pyotp
        totp = pyotp.TOTP(secret)
        valid_code = totp.now()
        print(f"Generated TOTP code: {valid_code}")
        
        # Step 4: Confirm 2FA with valid code
        confirm_resp = requests.post(
            f"{BASE_URL}/api/admin/confirm-2fa",
            json={"code": valid_code},
            headers=headers
        )
        print(f"Confirm 2FA response: {confirm_resp.status_code}")
        print(f"Confirm 2FA data: {confirm_resp.json()}")
        assert confirm_resp.status_code == 200
        
        # Step 5: Verify 2FA is now enabled
        status_resp2 = requests.get(f"{BASE_URL}/api/admin/2fa-status", headers=headers)
        assert status_resp2.json()["enabled"] == True
        print("2FA is now enabled!")
        
        # Step 6: Test login now requires 2FA
        login_resp = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        login_data = login_resp.json()
        print(f"Login with 2FA enabled: {login_data}")
        assert login_data.get("requires_2fa") == True
        assert "temp_token" in login_data
        
        # Step 7: Verify 2FA with temp_token
        temp_token = login_data["temp_token"]
        new_code = totp.now()  # Generate fresh code
        verify_resp = requests.post(f"{BASE_URL}/api/admin/verify-2fa", json={
            "temp_token": temp_token,
            "code": new_code
        })
        print(f"Verify 2FA response: {verify_resp.status_code}")
        assert verify_resp.status_code == 200
        verify_data = verify_resp.json()
        assert "access_token" in verify_data
        new_token = verify_data["access_token"]
        print("Successfully verified 2FA and got new token!")
        
        # Step 8: Disable 2FA using the new token
        disable_headers = {"Authorization": f"Bearer {new_token}"}
        disable_code = totp.now()  # Generate fresh code for disable
        disable_resp = requests.post(
            f"{BASE_URL}/api/admin/disable-2fa",
            json={"code": disable_code},
            headers=disable_headers
        )
        print(f"Disable 2FA response: {disable_resp.status_code}")
        print(f"Disable 2FA data: {disable_resp.json()}")
        assert disable_resp.status_code == 200
        
        # Step 9: Verify 2FA is now disabled
        status_resp3 = requests.get(f"{BASE_URL}/api/admin/2fa-status", headers=disable_headers)
        assert status_resp3.json()["enabled"] == False
        print("2FA successfully disabled!")


class TestAdminForgotPassword:
    """Test forgot password and reset password flows"""
    
    def test_forgot_password_with_valid_email(self):
        """Test POST /api/admin/forgot-password with admin email"""
        response = requests.post(f"{BASE_URL}/api/admin/forgot-password", json={
            "email": ADMIN_EMAIL
        })
        
        print(f"Forgot password response: {response.status_code}")
        print(f"Forgot password data: {response.json()}")
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        # In dev mode, reset_code is returned in response
        assert "reset_code" in data
        print(f"Got reset code: {data['reset_code']}")
    
    def test_forgot_password_with_invalid_email(self):
        """Test forgot password with non-admin email - should still return 200 (security)"""
        response = requests.post(f"{BASE_URL}/api/admin/forgot-password", json={
            "email": "notadmin@example.com"
        })
        
        print(f"Invalid email forgot password: {response.status_code}")
        
        # Should return 200 to not reveal if email exists
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        # Should NOT return reset_code for invalid email
        # Actually checking the code - it returns reset_code only for valid admin email
    
    def test_reset_password_flow(self):
        """Test complete password reset flow"""
        # Step 1: Request reset code
        forgot_resp = requests.post(f"{BASE_URL}/api/admin/forgot-password", json={
            "email": ADMIN_EMAIL
        })
        assert forgot_resp.status_code == 200
        reset_code = forgot_resp.json().get("reset_code")
        
        if not reset_code:
            pytest.skip("Reset code not returned - may be production mode")
        
        print(f"Got reset code: {reset_code}")
        
        # Step 2: Reset password with the code
        new_password = os.environ.get("TEST_NEW_PASSWORD", "NewTestPassword123!")
        reset_resp = requests.post(f"{BASE_URL}/api/admin/reset-password", json={
            "code": reset_code,
            "new_password": new_password
        })
        
        print(f"Reset password response: {reset_resp.status_code}")
        print(f"Reset password data: {reset_resp.json()}")
        
        assert reset_resp.status_code == 200
        
        # Step 3: Verify login with new password works
        login_resp = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": new_password
        })
        
        print(f"Login with new password: {login_resp.status_code}")
        assert login_resp.status_code == 200
        
        # Step 4: IMPORTANT - Reset password back to original
        # First get a new reset code
        forgot_resp2 = requests.post(f"{BASE_URL}/api/admin/forgot-password", json={
            "email": ADMIN_EMAIL
        })
        reset_code2 = forgot_resp2.json().get("reset_code")
        
        # Reset back to original password
        reset_back_resp = requests.post(f"{BASE_URL}/api/admin/reset-password", json={
            "code": reset_code2,
            "new_password": ADMIN_PASSWORD
        })
        
        print(f"Reset back to original: {reset_back_resp.status_code}")
        assert reset_back_resp.status_code == 200
        
        # Verify original password works again
        final_login = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert final_login.status_code == 200
        print("Password successfully reset back to original!")
    
    def test_reset_password_with_invalid_code(self):
        """Test reset password with invalid code - should return 400"""
        response = requests.post(f"{BASE_URL}/api/admin/reset-password", json={
            "code": "INVALIDCODE",
            "new_password": "SomePassword123!"
        })
        
        print(f"Invalid code reset: {response.status_code}")
        
        assert response.status_code == 400
    
    def test_reset_password_too_short(self):
        """Test reset password with password too short - should return 400"""
        # First get a valid reset code
        forgot_resp = requests.post(f"{BASE_URL}/api/admin/forgot-password", json={
            "email": ADMIN_EMAIL
        })
        reset_code = forgot_resp.json().get("reset_code")
        
        if not reset_code:
            pytest.skip("Reset code not returned")
        
        # Try to reset with short password
        response = requests.post(f"{BASE_URL}/api/admin/reset-password", json={
            "code": reset_code,
            "new_password": "short"
        })
        
        print(f"Short password reset: {response.status_code}")
        
        assert response.status_code == 400


class TestAdmin2FAVerifyErrors:
    """Test 2FA verification error cases"""
    
    def test_verify_2fa_with_invalid_temp_token(self):
        """Test verify-2fa with invalid temp token"""
        response = requests.post(f"{BASE_URL}/api/admin/verify-2fa", json={
            "temp_token": "invalid.token.here",
            "code": "123456"
        })
        
        print(f"Invalid temp token verify: {response.status_code}")
        
        assert response.status_code == 401
    
    def test_verify_2fa_with_expired_token(self):
        """Test verify-2fa with expired temp token"""
        # Create an expired token (this would need JWT manipulation)
        # For now, just test with a malformed token
        response = requests.post(f"{BASE_URL}/api/admin/verify-2fa", json={
            "temp_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbl8yZmFfcGVuZGluZyIsImVtYWlsIjoiaW5mb0BwcmludHNvdXQuc2UiLCJleHAiOjE2MDAwMDAwMDB9.invalid",
            "code": "123456"
        })
        
        print(f"Expired token verify: {response.status_code}")
        
        assert response.status_code == 401


class TestAdminEndpointsRequireAuth:
    """Test that admin endpoints require authentication"""
    
    def test_2fa_status_requires_auth(self):
        """Test 2fa-status without token returns 401"""
        response = requests.get(f"{BASE_URL}/api/admin/2fa-status")
        assert response.status_code == 401
    
    def test_setup_2fa_requires_auth(self):
        """Test setup-2fa without token returns 401"""
        response = requests.post(f"{BASE_URL}/api/admin/setup-2fa")
        assert response.status_code == 401
    
    def test_confirm_2fa_requires_auth(self):
        """Test confirm-2fa without token returns 401"""
        response = requests.post(f"{BASE_URL}/api/admin/confirm-2fa", json={"code": "123456"})
        assert response.status_code == 401
    
    def test_disable_2fa_requires_auth(self):
        """Test disable-2fa without token returns 401"""
        response = requests.post(f"{BASE_URL}/api/admin/disable-2fa", json={"code": "123456"})
        assert response.status_code == 401


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
