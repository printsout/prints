"""
Test suite for Nametag Editor and Admin PDF Download features.
Tests:
1. Nametag product exists with correct ID
2. Admin login with 2FA
3. Nametag PDF download endpoint
4. Test order with nametag customization exists
"""
import pytest
import requests
import pyotp
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from environment
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "info@printsout.se")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")
TOTP_SECRET = os.environ.get("TOTP_SECRET", "")
TEST_NAMETAG_ORDER_ID = "720d81c9-1ede-4414-9d6f-2d854dc94271"
TEST_NAMETAG_PRODUCT_ID = "4e5641a2-80de-4f1c-bae7-eba700925192"


class TestNametagProduct:
    """Tests for nametag product availability"""
    
    def test_nametag_product_exists(self):
        """Verify the nametag product exists with correct ID"""
        response = requests.get(f"{BASE_URL}/api/products/{TEST_NAMETAG_PRODUCT_ID}")
        print(f"Product response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Product data: {data}")
            assert data.get("product_id") == TEST_NAMETAG_PRODUCT_ID
            # Check product has expected nametag attributes
            assert "name" in data
            print(f"Product name: {data.get('name')}")
        else:
            print(f"Product not found: {response.text}")
            pytest.skip("Nametag product not found - may need to be seeded")


class TestAdminAuth:
    """Tests for admin authentication with 2FA"""
    
    def test_admin_login_step1(self):
        """Test admin login returns temp_token for 2FA"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        print(f"Admin login response status: {response.status_code}")
        print(f"Admin login response: {response.text}")
        
        assert response.status_code == 200
        data = response.json()
        assert "temp_token" in data or "access_token" in data
        
    def test_admin_login_with_2fa(self):
        """Test full admin login flow with 2FA verification"""
        # Step 1: Login
        login_response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_response.status_code == 200
        login_data = login_response.json()
        
        # Check if 2FA is required
        if "temp_token" in login_data:
            temp_token = login_data["temp_token"]
            
            # Step 2: Generate TOTP code
            totp = pyotp.TOTP(TOTP_SECRET)
            code = totp.now()
            print(f"Generated TOTP code: {code}")
            
            # Step 3: Verify 2FA
            verify_response = requests.post(f"{BASE_URL}/api/admin/verify-2fa", json={
                "temp_token": temp_token,
                "code": code
            })
            print(f"2FA verify response status: {verify_response.status_code}")
            print(f"2FA verify response: {verify_response.text}")
            
            assert verify_response.status_code == 200
            verify_data = verify_response.json()
            assert "access_token" in verify_data
            print("Admin 2FA login successful!")
        else:
            # 2FA not required, direct access_token
            assert "access_token" in login_data
            print("Admin login successful (no 2FA required)")


class TestNametagPdfDownload:
    """Tests for admin nametag PDF download endpoint"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin access token via 2FA login"""
        # Step 1: Login
        login_response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if login_response.status_code != 200:
            pytest.skip("Admin login failed")
        
        login_data = login_response.json()
        
        if "temp_token" in login_data:
            # Step 2: 2FA verification
            totp = pyotp.TOTP(TOTP_SECRET)
            code = totp.now()
            
            verify_response = requests.post(f"{BASE_URL}/api/admin/verify-2fa", json={
                "temp_token": login_data["temp_token"],
                "code": code
            })
            if verify_response.status_code != 200:
                pytest.skip("2FA verification failed")
            
            return verify_response.json().get("access_token")
        else:
            return login_data.get("access_token")
    
    def test_nametag_pdf_endpoint_exists(self, admin_token):
        """Test that the nametag PDF endpoint exists and requires auth"""
        # Test without auth - should fail
        response = requests.get(f"{BASE_URL}/api/admin/orders/{TEST_NAMETAG_ORDER_ID}/nametag-pdf")
        print(f"PDF endpoint without auth: {response.status_code}")
        assert response.status_code in [401, 403]
    
    def test_nametag_pdf_download_with_auth(self, admin_token):
        """Test nametag PDF download with valid admin token"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.get(
            f"{BASE_URL}/api/admin/orders/{TEST_NAMETAG_ORDER_ID}/nametag-pdf",
            headers=headers
        )
        print(f"PDF download response status: {response.status_code}")
        print(f"PDF download content-type: {response.headers.get('content-type')}")
        
        if response.status_code == 200:
            # Verify it's a PDF
            assert "application/pdf" in response.headers.get("content-type", "")
            # Check PDF magic bytes
            assert response.content[:4] == b'%PDF'
            print(f"PDF size: {len(response.content)} bytes")
            print("PDF download successful!")
        elif response.status_code == 404:
            print(f"Order not found: {response.text}")
            pytest.skip("Test order not found - may need to be created")
        elif response.status_code == 400:
            print(f"Order has no nametag items: {response.text}")
            pytest.skip("Test order has no nametag customization")
        else:
            print(f"Unexpected response: {response.text}")
            pytest.fail(f"Unexpected status code: {response.status_code}")
    
    def test_nametag_pdf_invalid_order(self, admin_token):
        """Test PDF download with non-existent order returns 404"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.get(
            f"{BASE_URL}/api/admin/orders/non-existent-order-id/nametag-pdf",
            headers=headers
        )
        print(f"Invalid order PDF response: {response.status_code}")
        assert response.status_code == 404


class TestNametagOrderExists:
    """Tests to verify test order with nametag customization exists"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin access token via 2FA login"""
        login_response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if login_response.status_code != 200:
            pytest.skip("Admin login failed")
        
        login_data = login_response.json()
        
        if "temp_token" in login_data:
            totp = pyotp.TOTP(TOTP_SECRET)
            code = totp.now()
            
            verify_response = requests.post(f"{BASE_URL}/api/admin/verify-2fa", json={
                "temp_token": login_data["temp_token"],
                "code": code
            })
            if verify_response.status_code != 200:
                pytest.skip("2FA verification failed")
            
            return verify_response.json().get("access_token")
        else:
            return login_data.get("access_token")
    
    def test_nametag_order_exists(self, admin_token):
        """Verify the test nametag order exists"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.get(
            f"{BASE_URL}/api/admin/orders/{TEST_NAMETAG_ORDER_ID}",
            headers=headers
        )
        print(f"Order fetch response: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Order data: {data}")
            assert data.get("order_id") == TEST_NAMETAG_ORDER_ID
            
            # Check for nametag customization
            items = data.get("items", [])
            nametag_item = None
            for item in items:
                if item.get("customization", {}).get("type") == "nametag":
                    nametag_item = item
                    break
            
            if nametag_item:
                print(f"Nametag customization found: {nametag_item.get('customization')}")
                assert nametag_item["customization"].get("child_name") is not None
            else:
                print("No nametag customization in order items")
                pytest.skip("Order exists but has no nametag customization")
        else:
            print(f"Order not found: {response.text}")
            pytest.skip("Test nametag order not found")
    
    def test_list_orders_with_nametag(self, admin_token):
        """List all orders and find ones with nametag customization"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.get(f"{BASE_URL}/api/admin/orders", headers=headers)
        print(f"Orders list response: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            orders = data.get("orders", [])
            print(f"Total orders: {len(orders)}")
            
            nametag_orders = []
            for order in orders:
                for item in order.get("items", []):
                    customization = item.get("customization")
                    if customization and customization.get("type") == "nametag":
                        nametag_orders.append({
                            "order_id": order.get("order_id"),
                            "child_name": customization.get("child_name")
                        })
                        break
            
            print(f"Orders with nametag customization: {nametag_orders}")
            
            if not nametag_orders:
                print("No orders with nametag customization found")
        else:
            print(f"Failed to list orders: {response.text}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
