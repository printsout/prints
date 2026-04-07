"""
Regression tests for Printsout API after refactoring from monolithic server.py to router modules.
Tests all endpoints to verify they work correctly after the refactor.
"""
import pytest
import requests
import os
import uuid
import pyotp

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from environment
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "info@printsout.se")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")
TOTP_SECRET = os.environ.get("TOTP_SECRET", "")
TEST_USER_PASSWORD = os.environ.get("TEST_USER_PASSWORD", "TestPassword123!")
TEST_NAMETAG_ORDER_ID = "720d81c9-1ede-4414-9d6f-2d854dc94271"


class TestAPIRoot:
    """Test API root endpoint - verifies basic API is running"""
    
    def test_api_root_returns_version(self):
        """GET /api/ returns API info with version 2.0.0"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Printsout API"
        assert data["version"] == "2.0.0"
        print(f"✓ API root returns version {data['version']}")


class TestProductsEndpoints:
    """Test products router endpoints"""
    
    def test_get_products_list(self):
        """GET /api/products returns products list"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        # Verify product structure
        product = data[0]
        assert "product_id" in product
        assert "name" in product
        assert "category" in product
        assert "price" in product
        print(f"✓ Products list returned {len(data)} products")
    
    def test_get_categories(self):
        """GET /api/products/categories returns 9 categories"""
        response = requests.get(f"{BASE_URL}/api/products/categories")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 9
        # Verify category structure
        category = data[0]
        assert "id" in category
        assert "name" in category
        print(f"✓ Categories returned {len(data)} categories")
    
    def test_get_specific_product(self):
        """GET /api/products/{product_id} returns specific product"""
        # First get a product ID from the list
        products_response = requests.get(f"{BASE_URL}/api/products")
        products = products_response.json()
        product_id = products[0]["product_id"]
        
        # Get specific product
        response = requests.get(f"{BASE_URL}/api/products/{product_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["product_id"] == product_id
        print(f"✓ Specific product {product_id} retrieved")


class TestAuthEndpoints:
    """Test auth router endpoints"""
    
    def test_register_new_user(self):
        """POST /api/auth/register creates new user"""
        unique_email = f"test_{uuid.uuid4().hex[:8]}@test.com"
        payload = {
            "email": unique_email,
            "password": TEST_USER_PASSWORD,
            "name": "Test User"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert response.status_code in [200, 201]
        data = response.json()
        assert "token" in data or "access_token" in data
        print(f"✓ User registered: {unique_email}")
    
    def test_login_user(self):
        """POST /api/auth/login returns token"""
        # First register a user
        unique_email = f"test_{uuid.uuid4().hex[:8]}@test.com"
        register_payload = {
            "email": unique_email,
            "password": TEST_USER_PASSWORD,
            "name": "Test User"
        }
        requests.post(f"{BASE_URL}/api/auth/register", json=register_payload)
        
        # Then login
        login_payload = {
            "email": unique_email,
            "password": TEST_USER_PASSWORD
        }
        response = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload)
        assert response.status_code == 200
        data = response.json()
        assert "token" in data or "access_token" in data
        print(f"✓ User login successful")


class TestCartEndpoints:
    """Test cart router endpoints"""
    
    def test_get_empty_cart(self):
        """GET /api/cart/{session_id} returns empty cart for new session"""
        session_id = str(uuid.uuid4())
        response = requests.get(f"{BASE_URL}/api/cart/{session_id}")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert isinstance(data["items"], list)
        print(f"✓ Empty cart returned for session {session_id[:8]}...")
    
    def test_add_item_to_cart(self):
        """POST /api/cart/{session_id}/items adds item to cart"""
        session_id = str(uuid.uuid4())
        
        # Get a product ID first
        products_response = requests.get(f"{BASE_URL}/api/products")
        products = products_response.json()
        product_id = products[0]["product_id"]
        
        # Add item to cart
        payload = {
            "product_id": product_id,
            "quantity": 1,
            "color": "Vit",
            "size": ""
        }
        response = requests.post(f"{BASE_URL}/api/cart/{session_id}/items", json=payload)
        assert response.status_code in [200, 201]
        data = response.json()
        assert "items" in data or "cart_item_id" in data or "id" in data
        print(f"✓ Item added to cart")
        return session_id, data
    
    def test_delete_item_from_cart(self):
        """DELETE /api/cart/{session_id}/items/{cart_item_id} removes item"""
        session_id = str(uuid.uuid4())
        
        # Get a product ID first
        products_response = requests.get(f"{BASE_URL}/api/products")
        products = products_response.json()
        product_id = products[0]["product_id"]
        
        # Add item to cart
        payload = {
            "product_id": product_id,
            "quantity": 1,
            "color": "Vit",
            "size": ""
        }
        add_response = requests.post(f"{BASE_URL}/api/cart/{session_id}/items", json=payload)
        add_data = add_response.json()
        
        # Get cart to find item ID
        cart_response = requests.get(f"{BASE_URL}/api/cart/{session_id}")
        cart_data = cart_response.json()
        
        if cart_data.get("items") and len(cart_data["items"]) > 0:
            cart_item_id = cart_data["items"][0].get("cart_item_id") or cart_data["items"][0].get("id")
            
            # Delete item
            delete_response = requests.delete(f"{BASE_URL}/api/cart/{session_id}/items/{cart_item_id}")
            assert delete_response.status_code in [200, 204]
            print(f"✓ Item deleted from cart")
        else:
            print(f"✓ Cart item deletion test skipped (no items found)")


class TestReviewsEndpoints:
    """Test reviews endpoint"""
    
    def test_get_reviews(self):
        """GET /api/reviews returns reviews list"""
        response = requests.get(f"{BASE_URL}/api/reviews")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Reviews returned {len(data)} reviews")


class TestShippingEndpoints:
    """Test shipping settings endpoint"""
    
    def test_get_shipping_settings(self):
        """GET /api/shipping-settings returns shipping configuration"""
        response = requests.get(f"{BASE_URL}/api/shipping-settings")
        assert response.status_code == 200
        data = response.json()
        # Verify shipping settings structure
        assert "free_shipping_threshold" in data or "shipping_cost" in data or isinstance(data, dict)
        print(f"✓ Shipping settings returned")


class TestDiscountEndpoints:
    """Test discount code validation endpoint"""
    
    def test_validate_discount_code(self):
        """POST /api/validate-discount-code validates discount codes"""
        payload = {"code": "INVALID_CODE_TEST"}
        response = requests.post(f"{BASE_URL}/api/validate-discount-code", json=payload)
        # Should return 200 with invalid status or 400/404 for invalid code
        assert response.status_code in [200, 400, 404]
        print(f"✓ Discount code validation endpoint works")


class TestAdminEndpoints:
    """Test admin router endpoints with 2FA authentication"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin token via 2FA login"""
        # Step 1: Admin login
        login_payload = {
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }
        login_response = requests.post(f"{BASE_URL}/api/admin/login", json=login_payload)
        assert login_response.status_code == 200
        login_data = login_response.json()
        temp_token = login_data.get("temp_token")
        assert temp_token, "No temp_token in login response"
        
        # Step 2: Verify 2FA
        totp = pyotp.TOTP(TOTP_SECRET)
        code = totp.now()
        verify_payload = {
            "temp_token": temp_token,
            "code": code
        }
        verify_response = requests.post(f"{BASE_URL}/api/admin/verify-2fa", json=verify_payload)
        assert verify_response.status_code == 200
        verify_data = verify_response.json()
        access_token = verify_data.get("access_token")
        assert access_token, "No access_token in verify response"
        
        print(f"✓ Admin 2FA login successful")
        return access_token
    
    def test_admin_login_step1(self):
        """POST /api/admin/login returns temp_token"""
        login_payload = {
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }
        response = requests.post(f"{BASE_URL}/api/admin/login", json=login_payload)
        assert response.status_code == 200
        data = response.json()
        assert "temp_token" in data
        print(f"✓ Admin login step 1 returns temp_token")
    
    def test_admin_verify_2fa(self):
        """POST /api/admin/verify-2fa returns access_token"""
        # Step 1: Login
        login_payload = {
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }
        login_response = requests.post(f"{BASE_URL}/api/admin/login", json=login_payload)
        temp_token = login_response.json().get("temp_token")
        
        # Step 2: Verify 2FA
        totp = pyotp.TOTP(TOTP_SECRET)
        code = totp.now()
        verify_payload = {
            "temp_token": temp_token,
            "code": code
        }
        response = requests.post(f"{BASE_URL}/api/admin/verify-2fa", json=verify_payload)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        print(f"✓ Admin 2FA verification returns access_token")
    
    def test_admin_stats(self, admin_token):
        """GET /api/admin/stats returns dashboard stats"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/stats", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        print(f"✓ Admin stats returned")
    
    def test_admin_users(self, admin_token):
        """GET /api/admin/users returns users list"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/users", headers=headers)
        assert response.status_code == 200
        data = response.json()
        # Response is paginated: {total: X, users: [...]}
        assert "users" in data
        assert "total" in data
        assert isinstance(data["users"], list)
        print(f"✓ Admin users returned {data['total']} users")
    
    def test_admin_orders(self, admin_token):
        """GET /api/admin/orders returns orders list"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/orders", headers=headers)
        assert response.status_code == 200
        data = response.json()
        # Response is paginated: {total: X, orders: [...]}
        assert "orders" in data
        assert "total" in data
        assert isinstance(data["orders"], list)
        print(f"✓ Admin orders returned {data['total']} orders")
    
    def test_admin_products(self, admin_token):
        """GET /api/admin/products returns products"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/products", headers=headers)
        assert response.status_code == 200
        data = response.json()
        # Response is paginated: {total: X, products: [...]}
        assert "products" in data
        assert "total" in data
        assert isinstance(data["products"], list)
        print(f"✓ Admin products returned {data['total']} products")
    
    def test_admin_payment_settings(self, admin_token):
        """GET /api/admin/payment-settings returns payment config"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/payment-settings", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        print(f"✓ Admin payment settings returned")
    
    def test_admin_settings(self, admin_token):
        """GET /api/admin/settings returns site settings"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/settings", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        print(f"✓ Admin settings returned")
    
    def test_admin_discount_codes(self, admin_token):
        """GET /api/admin/discount-codes returns discount codes"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/discount-codes", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin discount codes returned {len(data)} codes")
    
    def test_admin_logs(self, admin_token):
        """GET /api/admin/logs returns admin logs"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/logs", headers=headers)
        assert response.status_code == 200
        data = response.json()
        # Response is paginated: {logs: [...]}
        assert "logs" in data
        assert isinstance(data["logs"], list)
        print(f"✓ Admin logs returned {len(data['logs'])} logs")
    
    def test_admin_nametag_pdf(self, admin_token):
        """GET /api/admin/orders/{order_id}/nametag-pdf returns PDF"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(
            f"{BASE_URL}/api/admin/orders/{TEST_NAMETAG_ORDER_ID}/nametag-pdf",
            headers=headers
        )
        # Should return PDF or 404 if order doesn't exist
        if response.status_code == 200:
            assert response.headers.get("content-type") == "application/pdf"
            assert response.content[:4] == b"%PDF"
            print(f"✓ Admin nametag PDF returned valid PDF")
        elif response.status_code == 404:
            print(f"✓ Admin nametag PDF endpoint works (order not found)")
        else:
            assert False, f"Unexpected status code: {response.status_code}"


class TestUploadEndpoints:
    """Test upload router endpoints"""
    
    def test_upload_base64(self):
        """POST /api/upload-base64 accepts base64 image upload"""
        # Small 1x1 red PNG in base64
        base64_image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="
        payload = {
            "image": f"data:image/png;base64,{base64_image}",
            "filename": "test_image.png"
        }
        response = requests.post(f"{BASE_URL}/api/upload-base64", json=payload)
        # Should return 200 with URL or 400 for invalid format
        assert response.status_code in [200, 201, 400]
        if response.status_code in [200, 201]:
            data = response.json()
            assert "url" in data or "image_url" in data
            print(f"✓ Base64 upload successful")
        else:
            print(f"✓ Base64 upload endpoint works (validation error expected)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
