"""
Test Cart Edit Feature - PATCH endpoint and cart item update functionality
Tests the new edit cart item feature for nametag, calendar, and photoalbum products
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data
NAMETAG_PRODUCT_ID = "4e5641a2-80de-4f1c-bae7-eba700925192"


class TestCartPatchEndpoint:
    """Test the new PATCH /api/cart/{session_id}/items/{cart_item_id} endpoint"""
    
    @pytest.fixture
    def session_id(self):
        """Generate a unique session ID for testing"""
        return f"test-edit-{uuid.uuid4()}"
    
    @pytest.fixture
    def api_client(self):
        """Shared requests session"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        return session
    
    def test_api_health(self, api_client):
        """Test API is accessible"""
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "version" in data
        print(f"✓ API health check passed - version {data['version']}")
    
    def test_nametag_product_exists(self, api_client):
        """Verify nametag product exists for testing"""
        response = api_client.get(f"{BASE_URL}/api/products/{NAMETAG_PRODUCT_ID}")
        assert response.status_code == 200
        data = response.json()
        assert data["product_id"] == NAMETAG_PRODUCT_ID
        assert data["model_type"] == "nametag" or data["category"] == "namnskylt"
        print(f"✓ Nametag product exists: {data['name']}")
    
    def test_add_nametag_to_cart(self, api_client, session_id):
        """Test adding a nametag item to cart"""
        item_data = {
            "product_id": NAMETAG_PRODUCT_ID,
            "name": "Namnlappar - 140 st Självhäftande",
            "price": 179.0,
            "quantity": 1,
            "image": "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600",
            "customization": {
                "type": "nametag",
                "child_name": "TestChild",
                "last_name": "TestLastName",
                "phone_number": "070-1234567",
                "font": "pacifico",
                "font_color": "#000000",
                "motif": "star",
                "background": "white"
            }
        }
        
        response = api_client.post(f"{BASE_URL}/api/cart/{session_id}/items", json=item_data)
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert len(data["items"]) == 1
        assert "cart_item_id" in data["items"][0]
        print(f"✓ Added nametag to cart with cart_item_id: {data['items'][0]['cart_item_id']}")
        return data["items"][0]["cart_item_id"]
    
    def test_patch_cart_item_updates_data(self, api_client, session_id):
        """Test PATCH endpoint updates cart item data while preserving cart_item_id"""
        # First add an item
        original_item = {
            "product_id": NAMETAG_PRODUCT_ID,
            "name": "Namnlappar - 140 st Självhäftande",
            "price": 179.0,
            "quantity": 1,
            "customization": {
                "type": "nametag",
                "child_name": "OriginalName",
                "font": "pacifico",
                "font_color": "#000000",
                "motif": "star",
                "background": "white"
            }
        }
        
        add_response = api_client.post(f"{BASE_URL}/api/cart/{session_id}/items", json=original_item)
        assert add_response.status_code == 200
        cart_item_id = add_response.json()["items"][0]["cart_item_id"]
        print(f"✓ Created cart item with ID: {cart_item_id}")
        
        # Now PATCH the item with updated data
        updated_item = {
            "product_id": NAMETAG_PRODUCT_ID,
            "name": "Namnlappar - 140 st Självhäftande",
            "price": 179.0,
            "quantity": 2,  # Changed quantity
            "customization": {
                "type": "nametag",
                "child_name": "UpdatedName",  # Changed name
                "last_name": "NewLastName",  # Added last name
                "font": "roboto",  # Changed font
                "font_color": "#FF0000",  # Changed color
                "motif": "heart",  # Changed motif
                "background": "teal"  # Changed background
            }
        }
        
        patch_response = api_client.patch(
            f"{BASE_URL}/api/cart/{session_id}/items/{cart_item_id}",
            json=updated_item
        )
        assert patch_response.status_code == 200
        data = patch_response.json()
        
        # Verify the cart_item_id is preserved
        updated_cart_item = data["items"][0]
        assert updated_cart_item["cart_item_id"] == cart_item_id
        print(f"✓ cart_item_id preserved after PATCH: {cart_item_id}")
        
        # Verify the data was updated
        assert updated_cart_item["quantity"] == 2
        assert updated_cart_item["customization"]["child_name"] == "UpdatedName"
        assert updated_cart_item["customization"]["last_name"] == "NewLastName"
        assert updated_cart_item["customization"]["font"] == "roboto"
        assert updated_cart_item["customization"]["font_color"] == "#FF0000"
        assert updated_cart_item["customization"]["motif"] == "heart"
        assert updated_cart_item["customization"]["background"] == "teal"
        print("✓ All customization data updated correctly")
    
    def test_patch_nonexistent_cart_returns_404(self, api_client):
        """Test PATCH on non-existent cart returns 404"""
        fake_session = f"nonexistent-{uuid.uuid4()}"
        fake_cart_item_id = str(uuid.uuid4())
        
        item_data = {
            "product_id": NAMETAG_PRODUCT_ID,
            "name": "Test",
            "price": 179.0,
            "quantity": 1
        }
        
        response = api_client.patch(
            f"{BASE_URL}/api/cart/{fake_session}/items/{fake_cart_item_id}",
            json=item_data
        )
        assert response.status_code == 404
        print("✓ PATCH on non-existent cart returns 404")
    
    def test_patch_nonexistent_item_returns_404(self, api_client, session_id):
        """Test PATCH on non-existent cart item returns 404"""
        # First create a cart with an item
        original_item = {
            "product_id": NAMETAG_PRODUCT_ID,
            "name": "Test",
            "price": 179.0,
            "quantity": 1
        }
        
        add_response = api_client.post(f"{BASE_URL}/api/cart/{session_id}/items", json=original_item)
        assert add_response.status_code == 200
        
        # Try to PATCH a non-existent item
        fake_cart_item_id = str(uuid.uuid4())
        response = api_client.patch(
            f"{BASE_URL}/api/cart/{session_id}/items/{fake_cart_item_id}",
            json=original_item
        )
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        print(f"✓ PATCH on non-existent item returns 404: {data['detail']}")
    
    def test_patch_does_not_create_duplicate(self, api_client, session_id):
        """Test that PATCH updates existing item instead of creating duplicate"""
        # Add first item
        item_data = {
            "product_id": NAMETAG_PRODUCT_ID,
            "name": "Test Item",
            "price": 179.0,
            "quantity": 1,
            "customization": {
                "type": "nametag",
                "child_name": "FirstName"
            }
        }
        
        add_response = api_client.post(f"{BASE_URL}/api/cart/{session_id}/items", json=item_data)
        assert add_response.status_code == 200
        cart_item_id = add_response.json()["items"][0]["cart_item_id"]
        initial_count = len(add_response.json()["items"])
        
        # PATCH the item
        updated_item = {
            "product_id": NAMETAG_PRODUCT_ID,
            "name": "Test Item",
            "price": 179.0,
            "quantity": 1,
            "customization": {
                "type": "nametag",
                "child_name": "UpdatedName"
            }
        }
        
        patch_response = api_client.patch(
            f"{BASE_URL}/api/cart/{session_id}/items/{cart_item_id}",
            json=updated_item
        )
        assert patch_response.status_code == 200
        
        # Verify item count is the same (no duplicate created)
        final_count = len(patch_response.json()["items"])
        assert final_count == initial_count
        print(f"✓ PATCH did not create duplicate - item count: {final_count}")
    
    def test_get_cart_returns_editable_items(self, api_client, session_id):
        """Test that GET cart returns items with customization data for editing"""
        # Add item with customization
        item_data = {
            "product_id": NAMETAG_PRODUCT_ID,
            "name": "Namnlappar",
            "price": 179.0,
            "quantity": 1,
            "customization": {
                "type": "nametag",
                "child_name": "TestChild",
                "font": "pacifico",
                "font_color": "#000000",
                "motif": "star",
                "background": "white"
            }
        }
        
        api_client.post(f"{BASE_URL}/api/cart/{session_id}/items", json=item_data)
        
        # GET the cart
        get_response = api_client.get(f"{BASE_URL}/api/cart/{session_id}")
        assert get_response.status_code == 200
        data = get_response.json()
        
        # Verify customization data is returned for editing
        cart_item = data["items"][0]
        assert "cart_item_id" in cart_item
        assert "customization" in cart_item
        assert cart_item["customization"]["type"] == "nametag"
        assert cart_item["customization"]["child_name"] == "TestChild"
        print("✓ GET cart returns customization data for editing")


class TestCalendarEditSupport:
    """Test calendar editor edit mode support"""
    
    @pytest.fixture
    def api_client(self):
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        return session
    
    def test_get_calendar_products(self, api_client):
        """Find calendar products for testing"""
        response = api_client.get(f"{BASE_URL}/api/products?category=kalender")
        assert response.status_code == 200
        data = response.json()
        if len(data) > 0:
            print(f"✓ Found {len(data)} calendar products")
            return data[0]["product_id"]
        else:
            # Try model_type
            response = api_client.get(f"{BASE_URL}/api/products")
            all_products = response.json()
            calendars = [p for p in all_products if p.get("model_type") == "calendar" or p.get("category") == "kalender"]
            if calendars:
                print(f"✓ Found calendar product: {calendars[0]['name']}")
                return calendars[0]["product_id"]
            pytest.skip("No calendar products found")


class TestPhotoAlbumEditSupport:
    """Test photo album editor edit mode support"""
    
    @pytest.fixture
    def api_client(self):
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        return session
    
    def test_get_photoalbum_products(self, api_client):
        """Find photo album products for testing"""
        response = api_client.get(f"{BASE_URL}/api/products?category=fotoalbum")
        assert response.status_code == 200
        data = response.json()
        if len(data) > 0:
            print(f"✓ Found {len(data)} photo album products")
            return data[0]["product_id"]
        else:
            response = api_client.get(f"{BASE_URL}/api/products")
            all_products = response.json()
            albums = [p for p in all_products if p.get("category") == "fotoalbum"]
            if albums:
                print(f"✓ Found photo album product: {albums[0]['name']}")
                return albums[0]["product_id"]
            pytest.skip("No photo album products found")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
