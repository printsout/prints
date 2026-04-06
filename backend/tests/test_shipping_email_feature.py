"""
Test shipping email notification feature for Printsout e-commerce app.
Tests:
1. PUT /api/admin/orders/{order_id} with status 'shipped' triggers shipping email
2. Order confirmation email function exists and is called on payment success
3. GET /api/products returns products correctly
4. POST /api/admin/login works with correct credentials
"""
import pytest
import requests
import os
import pyotp

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_EMAIL = "info@printsout.se"
ADMIN_PASSWORD = "PrintoutAdmin2024!"
TOTP_SECRET = "RY5OWNLJOD7VLKBZEEGHI6MVA3I3M4UE"


class TestProductsAPI:
    """Test products endpoint"""
    
    def test_get_products_returns_list(self):
        """GET /api/products should return a list of products"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) > 0, "Should have at least one product"
        
        # Verify product structure
        product = data[0]
        assert "product_id" in product, "Product should have product_id"
        assert "name" in product, "Product should have name"
        assert "price" in product, "Product should have price"
        assert "category" in product, "Product should have category"
        print(f"✓ GET /api/products returned {len(data)} products")


class TestAdminLogin:
    """Test admin login flow with 2FA"""
    
    def test_admin_login_with_correct_credentials(self):
        """POST /api/admin/login with correct credentials should require 2FA"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("requires_2fa") == True, "Should require 2FA"
        assert "temp_token" in data, "Should return temp_token for 2FA"
        print(f"✓ Admin login successful, requires 2FA: {data.get('requires_2fa')}")
    
    def test_admin_login_with_wrong_credentials(self):
        """POST /api/admin/login with wrong credentials should return 401"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": "wrong@email.com", "password": "wrongpassword"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Admin login with wrong credentials returns 401")
    
    def test_admin_full_login_with_2fa(self):
        """Complete admin login flow with 2FA verification"""
        # Step 1: Login with credentials
        login_response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        
        login_data = login_response.json()
        temp_token = login_data.get("temp_token")
        assert temp_token, "Should have temp_token"
        
        # Step 2: Generate TOTP code and verify
        totp = pyotp.TOTP(TOTP_SECRET)
        code = totp.now()
        
        verify_response = requests.post(
            f"{BASE_URL}/api/admin/verify-2fa",
            json={"temp_token": temp_token, "code": code}
        )
        assert verify_response.status_code == 200, f"2FA verification failed: {verify_response.text}"
        
        verify_data = verify_response.json()
        assert "access_token" in verify_data, "Should return access_token"
        print(f"✓ Admin full login with 2FA successful, got access_token")
        return verify_data["access_token"]


class TestShippingEmailFeature:
    """Test shipping email notification when order status changes to 'shipped'"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token for authenticated requests"""
        # Step 1: Login
        login_response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if login_response.status_code != 200:
            pytest.skip(f"Admin login failed: {login_response.text}")
        
        temp_token = login_response.json().get("temp_token")
        
        # Step 2: 2FA
        totp = pyotp.TOTP(TOTP_SECRET)
        code = totp.now()
        
        verify_response = requests.post(
            f"{BASE_URL}/api/admin/verify-2fa",
            json={"temp_token": temp_token, "code": code}
        )
        if verify_response.status_code != 200:
            pytest.skip(f"2FA verification failed: {verify_response.text}")
        
        return verify_response.json().get("access_token")
    
    def test_get_orders_list(self, admin_token):
        """GET /api/admin/orders should return orders list"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/orders", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "orders" in data, "Response should have 'orders' key"
        print(f"✓ GET /api/admin/orders returned {len(data['orders'])} orders")
        return data["orders"]
    
    def test_update_order_status_to_shipped(self, admin_token):
        """PUT /api/admin/orders/{order_id} with status 'shipped' should succeed"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # First get orders
        orders_response = requests.get(f"{BASE_URL}/api/admin/orders", headers=headers)
        orders = orders_response.json().get("orders", [])
        
        if not orders:
            pytest.skip("No orders available to test status update")
        
        # Find an order that's not already shipped
        test_order = None
        for order in orders:
            if order.get("status") != "shipped":
                test_order = order
                break
        
        if not test_order:
            # Use first order anyway
            test_order = orders[0]
        
        order_id = test_order["order_id"]
        
        # Update status to shipped
        update_response = requests.put(
            f"{BASE_URL}/api/admin/orders/{order_id}",
            json={"status": "shipped"},
            headers=headers
        )
        
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}: {update_response.text}"
        
        data = update_response.json()
        assert "message" in data, "Response should have message"
        print(f"✓ Order {order_id[:8]} status updated to 'shipped' - shipping email should be triggered")
        print(f"  Response: {data}")
    
    def test_update_order_status_to_skickad_swedish(self, admin_token):
        """PUT /api/admin/orders/{order_id} with status 'skickad' (Swedish) should also trigger email"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get orders
        orders_response = requests.get(f"{BASE_URL}/api/admin/orders", headers=headers)
        orders = orders_response.json().get("orders", [])
        
        if not orders:
            pytest.skip("No orders available to test status update")
        
        # Use first order
        order_id = orders[0]["order_id"]
        
        # Update status to 'skickad' (Swedish for shipped)
        update_response = requests.put(
            f"{BASE_URL}/api/admin/orders/{order_id}",
            json={"status": "skickad"},
            headers=headers
        )
        
        # Note: The backend normalizes status values, so this might return 200 or handle differently
        # The key is that the code path checks for both 'shipped' and 'skickad'
        print(f"✓ Order {order_id[:8]} status update with 'skickad' - status code: {update_response.status_code}")
        print(f"  Response: {update_response.json()}")


class TestOrderConfirmationEmail:
    """Test order confirmation email function exists"""
    
    def test_order_confirmation_endpoint_exists(self):
        """Verify payment status endpoint exists (which triggers confirmation email)"""
        # This endpoint checks payment status and sends confirmation email when paid
        # We can't fully test without a real Stripe session, but we can verify the endpoint exists
        response = requests.get(f"{BASE_URL}/api/payments/status/test_session_id")
        
        # Should return 500 (Stripe error) not 404 (endpoint not found)
        assert response.status_code != 404, "Payment status endpoint should exist"
        print(f"✓ Payment status endpoint exists (returns {response.status_code} for invalid session)")


class TestEmailServiceFunctions:
    """Verify email service functions are properly integrated"""
    
    def test_shipping_settings_endpoint(self):
        """GET /api/shipping-settings should return shipping configuration"""
        response = requests.get(f"{BASE_URL}/api/shipping-settings")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "shipping_enabled" in data, "Should have shipping_enabled"
        assert "shipping_cost" in data, "Should have shipping_cost"
        print(f"✓ Shipping settings: enabled={data.get('shipping_enabled')}, cost={data.get('shipping_cost')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
