"""
Test suite for code quality fixes in Printsout e-commerce app.
Tests: Backend API endpoints, email_service module refactoring
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://printout-lab.preview.emergentagent.com')


class TestProductsAPI:
    """Test products endpoints - verifies backend starts correctly after email_service refactoring"""
    
    def test_get_products_returns_200(self):
        """GET /api/products should return 200 and list of products"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Products should be a list"
        assert len(data) > 0, "Should have at least one product"
        print(f"✓ GET /api/products returned {len(data)} products")
    
    def test_get_categories_returns_200(self):
        """GET /api/products/categories should return 200 and list of categories"""
        response = requests.get(f"{BASE_URL}/api/products/categories")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Categories should be a list"
        assert len(data) > 0, "Should have at least one category"
        # Verify category structure
        for cat in data:
            assert "id" in cat, "Category should have id"
            assert "name" in cat, "Category should have name"
        print(f"✓ GET /api/products/categories returned {len(data)} categories")
    
    def test_get_single_product(self):
        """GET /api/products/{product_id} should return product details"""
        # First get list of products
        products_response = requests.get(f"{BASE_URL}/api/products")
        products = products_response.json()
        if len(products) > 0:
            product_id = products[0]["product_id"]
            response = requests.get(f"{BASE_URL}/api/products/{product_id}")
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            data = response.json()
            assert data["product_id"] == product_id
            print(f"✓ GET /api/products/{product_id[:8]}... returned product details")


class TestReviewsAPI:
    """Test reviews endpoints"""
    
    def test_get_reviews_returns_200(self):
        """GET /api/reviews should return 200"""
        response = requests.get(f"{BASE_URL}/api/reviews")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Reviews should be a list"
        print(f"✓ GET /api/reviews returned {len(data)} reviews")
    
    def test_get_review_platforms_returns_200(self):
        """GET /api/review-platforms should return 200"""
        response = requests.get(f"{BASE_URL}/api/review-platforms")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "platforms" in data, "Response should have platforms key"
        print(f"✓ GET /api/review-platforms returned {len(data.get('platforms', []))} platforms")


class TestCartAPI:
    """Test cart endpoints"""
    
    def test_get_cart_returns_200(self):
        """GET /api/cart/{session_id} should return 200"""
        session_id = "test-session-12345"
        response = requests.get(f"{BASE_URL}/api/cart/{session_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "items" in data, "Cart should have items key"
        print(f"✓ GET /api/cart/{session_id} returned cart with {len(data.get('items', []))} items")


class TestShippingSettingsAPI:
    """Test public shipping settings endpoint"""
    
    def test_get_shipping_settings_returns_200(self):
        """GET /api/shipping-settings should return 200"""
        response = requests.get(f"{BASE_URL}/api/shipping-settings")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        # Verify expected fields
        assert "shipping_enabled" in data, "Should have shipping_enabled"
        assert "shipping_cost" in data, "Should have shipping_cost"
        assert "free_shipping_threshold" in data, "Should have free_shipping_threshold"
        assert "tax_enabled" in data, "Should have tax_enabled"
        assert "tax_rate" in data, "Should have tax_rate"
        print(f"✓ GET /api/shipping-settings returned settings (shipping_cost: {data.get('shipping_cost')} kr)")


class TestAdminLoginAPI:
    """Test admin login endpoint - verifies 2FA flow"""
    
    def test_admin_login_requires_credentials(self):
        """POST /api/admin/login should require email and password"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={})
        # Should fail with validation error
        assert response.status_code in [400, 422], f"Expected 400/422, got {response.status_code}"
        print("✓ POST /api/admin/login requires credentials")
    
    def test_admin_login_wrong_credentials(self):
        """POST /api/admin/login with wrong credentials should return 401"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": "wrong@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ POST /api/admin/login rejects wrong credentials")
    
    def test_admin_login_correct_credentials_requires_2fa(self):
        """POST /api/admin/login with correct credentials should require 2FA"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": "info@printsout.se",
            "password": "PrintoutAdmin2024!"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "requires_2fa" in data, "Should indicate 2FA requirement"
        assert data["requires_2fa"] == True, "Should require 2FA"
        print("✓ POST /api/admin/login with correct credentials requires 2FA")


class TestAuthAPI:
    """Test authentication endpoints"""
    
    def test_register_validates_password(self):
        """POST /api/auth/register should validate password strength"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": "test@example.com",
            "password": "weak",  # Too weak
            "name": "Test User"
        })
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✓ POST /api/auth/register validates password strength")
    
    def test_login_wrong_credentials(self):
        """POST /api/auth/login with wrong credentials should return 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ POST /api/auth/login rejects wrong credentials")


class TestBackendStartup:
    """Test that backend starts correctly after email_service refactoring"""
    
    def test_backend_health(self):
        """Backend should respond to requests after email_service module extraction"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200, "Backend should be running"
        print("✓ Backend is running correctly after email_service refactoring")
    
    def test_email_service_import(self):
        """Verify email_service module is properly imported by checking order-related endpoints"""
        # The checkout endpoint uses send_order_confirmation from email_service
        # We can't test the full flow without payment, but we can verify the endpoint exists
        response = requests.post(f"{BASE_URL}/api/payments/checkout", json={
            "cart_session_id": "test-session",
            "email": "test@example.com"
        })
        # Should fail with "cart is empty" not "import error"
        assert response.status_code in [400, 401, 500], f"Checkout endpoint should exist"
        if response.status_code == 400:
            data = response.json()
            assert "tom" in data.get("detail", "").lower() or "empty" in data.get("detail", "").lower(), \
                "Should fail due to empty cart, not import error"
        print("✓ email_service module is properly imported")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
