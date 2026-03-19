"""
Printout E-commerce API Tests
Tests for: Authentication, Products, Cart, and Reviews endpoints
"""
import pytest
import requests
import os
import uuid

# Get base URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndBase:
    """Basic health check and root endpoint tests"""
    
    def test_api_root_returns_version(self):
        """Verify API root endpoint returns correct version info"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Printout API"
        assert "version" in data
        print(f"API Root: {data}")

    def test_init_data_endpoint(self):
        """Verify init-data endpoint works"""
        response = requests.post(f"{BASE_URL}/api/init-data")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"Init Data: {data}")


class TestProducts:
    """Product listing and detail tests"""
    
    def test_get_all_products(self):
        """Get all products - should return 9 seeded products"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 9, f"Expected 9 products, got {len(data)}"
        print(f"Total products: {len(data)}")
        
    def test_get_products_with_trailing_slash(self):
        """Get products with trailing slash - should also work"""
        response = requests.get(f"{BASE_URL}/api/products/")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Products (with slash): {len(data)}")

    def test_get_product_categories(self):
        """Get product categories - should return 6 categories"""
        response = requests.get(f"{BASE_URL}/api/products/categories")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 6, f"Expected 6 categories, got {len(data)}"
        
        # Verify category structure
        expected_ids = ["mugg", "tshirt", "hoodie", "poster", "mobilskal", "tygkasse"]
        actual_ids = [cat["id"] for cat in data]
        for exp_id in expected_ids:
            assert exp_id in actual_ids, f"Missing category: {exp_id}"
        print(f"Categories: {actual_ids}")

    def test_filter_products_by_category(self):
        """Filter products by category"""
        response = requests.get(f"{BASE_URL}/api/products/?category=mugg")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All returned products should be in mugg category
        for product in data:
            assert product["category"] == "mugg"
        print(f"Mugg products: {len(data)}")

    def test_get_single_product(self):
        """Get a single product by ID"""
        # First get all products to get a valid product_id
        list_response = requests.get(f"{BASE_URL}/api/products")
        products = list_response.json()
        assert len(products) > 0
        
        product_id = products[0]["product_id"]
        response = requests.get(f"{BASE_URL}/api/products/{product_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["product_id"] == product_id
        assert "name" in data
        assert "price" in data
        assert "images" in data
        assert "model_type" in data
        print(f"Product: {data['name']} - {data['price']} kr")

    def test_get_nonexistent_product_returns_404(self):
        """Non-existent product should return 404"""
        response = requests.get(f"{BASE_URL}/api/products/nonexistent-product-id-12345")
        assert response.status_code == 404


class TestReviews:
    """Review endpoint tests"""
    
    def test_get_reviews(self):
        """Get reviews - should return seeded reviews"""
        response = requests.get(f"{BASE_URL}/api/reviews")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 3, f"Expected at least 3 reviews, got {len(data)}"
        
        # Verify review structure
        if len(data) > 0:
            review = data[0]
            assert "review_id" in review
            assert "user_name" in review
            assert "rating" in review
            assert "text" in review
        print(f"Total reviews: {len(data)}")


class TestAuthentication:
    """User registration and login tests"""
    
    def test_register_new_user(self):
        """Register a new user"""
        test_email = f"TEST_user_{uuid.uuid4().hex[:8]}@test.com"
        test_password = "TestPassword123!"
        test_name = "Test User"
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": test_password,
            "name": test_name
        })
        
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "access_token" in data
        assert "token_type" in data
        assert "user" in data
        assert data["user"]["email"] == test_email
        assert data["user"]["name"] == test_name
        assert "user_id" in data["user"]
        print(f"Registered user: {data['user']['email']}")
        
        return data["access_token"], test_email, test_password

    def test_register_duplicate_email_fails(self):
        """Registering with same email should fail"""
        test_email = f"TEST_duplicate_{uuid.uuid4().hex[:8]}@test.com"
        
        # First registration
        response1 = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "Password123!",
            "name": "First User"
        })
        assert response1.status_code == 200
        
        # Second registration with same email
        response2 = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "Password456!",
            "name": "Second User"
        })
        assert response2.status_code == 400
        print("Duplicate email correctly rejected")

    def test_login_with_valid_credentials(self):
        """Login with valid credentials"""
        # First register a user
        test_email = f"TEST_login_{uuid.uuid4().hex[:8]}@test.com"
        test_password = "LoginTestPass123!"
        
        # Register
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": test_password,
            "name": "Login Test User"
        })
        assert reg_response.status_code == 200
        
        # Login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_email,
            "password": test_password
        })
        
        assert login_response.status_code == 200
        data = login_response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == test_email
        print(f"Login successful for: {test_email}")

    def test_login_with_invalid_credentials(self):
        """Login with wrong credentials should fail"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("Invalid login correctly rejected")

    def test_get_profile_with_valid_token(self):
        """Get user profile with valid token"""
        # Register and get token
        test_email = f"TEST_profile_{uuid.uuid4().hex[:8]}@test.com"
        
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "ProfileTestPass123!",
            "name": "Profile Test User"
        })
        assert reg_response.status_code == 200
        token = reg_response.json()["access_token"]
        
        # Get profile
        profile_response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert profile_response.status_code == 200
        data = profile_response.json()
        assert data["email"] == test_email
        print(f"Profile retrieved for: {data['email']}")


class TestCart:
    """Cart CRUD operations tests"""
    
    def test_get_cart_creates_empty_cart(self):
        """Getting cart with new session_id creates empty cart"""
        session_id = str(uuid.uuid4())
        response = requests.get(f"{BASE_URL}/api/cart/{session_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert "session_id" in data or "cart_id" in data
        assert data.get("items", []) == []
        print(f"Empty cart created for session: {session_id[:8]}...")

    def test_add_item_to_cart(self):
        """Add item to cart"""
        # Get a product first
        products_response = requests.get(f"{BASE_URL}/api/products")
        products = products_response.json()
        product = products[0]
        
        session_id = str(uuid.uuid4())
        
        # Add to cart
        response = requests.post(f"{BASE_URL}/api/cart/{session_id}/items", json={
            "product_id": product["product_id"],
            "quantity": 2,
            "color": product.get("colors", [None])[0] if product.get("colors") else None,
            "size": product.get("sizes", [None])[0] if product.get("sizes") else None
        })
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["product_id"] == product["product_id"]
        assert data["items"][0]["quantity"] == 2
        print(f"Added {product['name']} to cart (qty: 2)")
        
        return session_id, data["items"][0]["cart_item_id"]

    def test_cart_persistence_after_navigation(self):
        """Verify cart persists between API calls"""
        # Get a product
        products = requests.get(f"{BASE_URL}/api/products").json()
        product = products[0]
        
        session_id = str(uuid.uuid4())
        
        # Add to cart
        add_response = requests.post(f"{BASE_URL}/api/cart/{session_id}/items", json={
            "product_id": product["product_id"],
            "quantity": 1
        })
        assert add_response.status_code == 200
        
        # Fetch cart again (simulating page navigation)
        get_response = requests.get(f"{BASE_URL}/api/cart/{session_id}")
        assert get_response.status_code == 200
        
        data = get_response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["product_id"] == product["product_id"]
        print("Cart persistence verified")

    def test_update_cart_item_quantity(self):
        """Update cart item quantity"""
        # Get a product and add to cart
        products = requests.get(f"{BASE_URL}/api/products").json()
        product = products[0]
        session_id = str(uuid.uuid4())
        
        add_response = requests.post(f"{BASE_URL}/api/cart/{session_id}/items", json={
            "product_id": product["product_id"],
            "quantity": 1
        })
        cart_item_id = add_response.json()["items"][0]["cart_item_id"]
        
        # Update quantity
        update_response = requests.put(
            f"{BASE_URL}/api/cart/{session_id}/items/{cart_item_id}?quantity=5"
        )
        
        assert update_response.status_code == 200
        data = update_response.json()
        assert data["items"][0]["quantity"] == 5
        print(f"Cart item quantity updated to 5")

    def test_remove_item_from_cart(self):
        """Remove item from cart"""
        # Setup: Add item to cart
        products = requests.get(f"{BASE_URL}/api/products").json()
        product = products[0]
        session_id = str(uuid.uuid4())
        
        add_response = requests.post(f"{BASE_URL}/api/cart/{session_id}/items", json={
            "product_id": product["product_id"],
            "quantity": 1
        })
        cart_item_id = add_response.json()["items"][0]["cart_item_id"]
        
        # Remove from cart
        delete_response = requests.delete(
            f"{BASE_URL}/api/cart/{session_id}/items/{cart_item_id}"
        )
        
        assert delete_response.status_code == 200
        data = delete_response.json()
        assert len(data["items"]) == 0
        print("Item removed from cart")

    def test_clear_cart(self):
        """Clear entire cart"""
        # Setup: Add item to cart
        products = requests.get(f"{BASE_URL}/api/products").json()
        session_id = str(uuid.uuid4())
        
        requests.post(f"{BASE_URL}/api/cart/{session_id}/items", json={
            "product_id": products[0]["product_id"],
            "quantity": 1
        })
        
        # Clear cart
        clear_response = requests.delete(f"{BASE_URL}/api/cart/{session_id}")
        assert clear_response.status_code == 200
        
        # Verify empty
        get_response = requests.get(f"{BASE_URL}/api/cart/{session_id}")
        data = get_response.json()
        assert data.get("items", []) == []
        print("Cart cleared successfully")


class TestDesigns:
    """Design CRUD operations (requires authentication)"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        test_email = f"TEST_design_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "DesignTestPass123!",
            "name": "Design Test User"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Could not get auth token")

    def test_create_design_without_auth(self):
        """Create design without auth - should work but without user_id"""
        products = requests.get(f"{BASE_URL}/api/products").json()
        product = products[0]
        
        response = requests.post(f"{BASE_URL}/api/designs/", json={
            "product_id": product["product_id"],
            "name": "Test Design",
            "config": {
                "position_x": 50,
                "position_y": 50,
                "scale": 1.0,
                "rotation": 0
            }
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "design_id" in data
        assert data["product_id"] == product["product_id"]
        print(f"Design created: {data['design_id'][:8]}...")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
