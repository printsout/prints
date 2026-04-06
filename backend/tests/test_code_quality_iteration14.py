"""
Test suite for Code Quality Fixes - Iteration 14
Tests all refactored components and API endpoints after code quality improvements
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestProductsAPI:
    """Test products endpoints"""
    
    def test_get_products_returns_list(self):
        """GET /api/products should return list of products"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 14, f"Expected at least 14 products, got {len(data)}"
        print(f"✓ GET /api/products returned {len(data)} products")
    
    def test_get_categories(self):
        """GET /api/products/categories should return 9 categories"""
        response = requests.get(f"{BASE_URL}/api/products/categories")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 9, f"Expected 9 categories, got {len(data)}"
        print(f"✓ GET /api/products/categories returned {len(data)} categories")
    
    def test_get_single_product(self):
        """GET /api/products/{id} should return product details"""
        # First get a product ID
        products_response = requests.get(f"{BASE_URL}/api/products")
        products = products_response.json()
        if products:
            product_id = products[0]['product_id']
            response = requests.get(f"{BASE_URL}/api/products/{product_id}")
            assert response.status_code == 200
            data = response.json()
            assert 'product_id' in data
            assert 'name' in data
            assert 'price' in data
            print(f"✓ GET /api/products/{product_id[:8]}... returned product: {data['name']}")


class TestCartAPI:
    """Test cart endpoints"""
    
    def test_get_cart_empty_session(self):
        """GET /api/cart/{session_id} should return empty cart for new session"""
        session_id = "test-session-iteration14"
        response = requests.get(f"{BASE_URL}/api/cart/{session_id}")
        assert response.status_code == 200
        data = response.json()
        assert 'items' in data
        assert isinstance(data['items'], list)
        print(f"✓ GET /api/cart/{session_id} returned cart with {len(data['items'])} items")


class TestShippingSettingsAPI:
    """Test shipping settings endpoint"""
    
    def test_get_shipping_settings(self):
        """GET /api/shipping-settings should return shipping config"""
        response = requests.get(f"{BASE_URL}/api/shipping-settings")
        assert response.status_code == 200
        data = response.json()
        assert 'shipping_enabled' in data
        assert 'shipping_cost' in data
        assert 'free_shipping_threshold' in data
        assert 'tax_enabled' in data
        assert 'tax_rate' in data
        print(f"✓ GET /api/shipping-settings returned config: shipping={data['shipping_cost']}kr, tax={data['tax_rate']}%")


class TestReviewsAPI:
    """Test reviews endpoints"""
    
    def test_get_reviews(self):
        """GET /api/reviews should return list of reviews"""
        response = requests.get(f"{BASE_URL}/api/reviews")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/reviews returned {len(data)} reviews")
    
    def test_get_review_platforms(self):
        """GET /api/review-platforms should return platforms config"""
        response = requests.get(f"{BASE_URL}/api/review-platforms")
        assert response.status_code == 200
        data = response.json()
        assert 'platforms' in data
        print(f"✓ GET /api/review-platforms returned {len(data['platforms'])} platforms")


class TestAuthAPI:
    """Test authentication endpoints"""
    
    def test_register_weak_password(self):
        """POST /api/auth/register with weak password should fail"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": "test_weak@example.com",
            "password": "weak",
            "name": "Test User"
        })
        assert response.status_code == 400
        print("✓ POST /api/auth/register with weak password correctly rejected")
    
    def test_login_wrong_credentials(self):
        """POST /api/auth/login with wrong credentials should fail"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ POST /api/auth/login with wrong credentials correctly rejected")


class TestAdminAPI:
    """Test admin authentication endpoints"""
    
    def test_admin_login_no_credentials(self):
        """POST /api/admin/login without credentials should fail"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={})
        assert response.status_code in [400, 422]
        print("✓ POST /api/admin/login without credentials correctly rejected")
    
    def test_admin_login_wrong_credentials(self):
        """POST /api/admin/login with wrong credentials should fail"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": "wrong@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ POST /api/admin/login with wrong credentials correctly rejected")
    
    def test_admin_login_correct_credentials_requires_2fa(self):
        """POST /api/admin/login with correct credentials should require 2FA"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": "info@printsout.se",
            "password": "PrintoutAdmin2024!"
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get('requires_2fa') == True
        assert 'temp_token' in data
        print("✓ POST /api/admin/login with correct credentials requires 2FA")


class TestDiscountCodeAPI:
    """Test discount code validation endpoint"""
    
    def test_validate_invalid_discount_code(self):
        """POST /api/validate-discount-code with invalid code should fail"""
        response = requests.post(f"{BASE_URL}/api/validate-discount-code", json={
            "code": "INVALID_CODE_12345"
        })
        assert response.status_code in [400, 404]
        print("✓ POST /api/validate-discount-code with invalid code correctly rejected")


class TestPaymentsAPI:
    """Test payments endpoints"""
    
    def test_checkout_empty_cart(self):
        """POST /api/payments/checkout with empty cart should fail"""
        response = requests.post(f"{BASE_URL}/api/payments/checkout", json={
            "cart_session_id": "empty-cart-session-test",
            "email": "test@example.com"
        })
        assert response.status_code == 400
        print("✓ POST /api/payments/checkout with empty cart correctly rejected")


class TestInitDataEndpoint:
    """Test init-data endpoint (idempotent seeding)"""
    
    def test_init_data_idempotent(self):
        """POST /api/init-data should be idempotent"""
        response = requests.post(f"{BASE_URL}/api/init-data")
        assert response.status_code == 200
        data = response.json()
        # Should return "already initialized" message since data exists
        assert 'message' in data
        print(f"✓ POST /api/init-data returned: {data['message']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
