"""
Test B2B Virtual Products in Cart
Tests for: print-businesscard, print-catalog, our-catalog-physical, our-catalog-digital
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture(scope="module")
def test_session_id():
    """Generate unique session ID for test isolation"""
    return f"test-b2b-cart-{uuid.uuid4()}"

@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture(scope="module", autouse=True)
def cleanup_cart(api_client, test_session_id):
    """Cleanup cart after all tests"""
    yield
    # Teardown: Clear the test cart
    try:
        api_client.delete(f"{BASE_URL}/api/cart/{test_session_id}")
    except:
        pass


class TestB2BVirtualProductsInCart:
    """Test adding B2B virtual products to cart"""
    
    def test_add_print_businesscard_to_cart(self, api_client, test_session_id):
        """Test adding print-businesscard virtual product to cart"""
        payload = {
            "product_id": "print-businesscard",
            "name": "Visitkort - Klassisk design",
            "price": 299,
            "quantity": 100,
            "customization": {
                "type": "businesscard",
                "source": "editor",
                "card_details": {
                    "name": "Test Person",
                    "title": "Developer",
                    "company": "TEST_Company AB",
                    "template": "classic",
                    "color": "#2a9d8f"
                }
            }
        }
        response = api_client.post(f"{BASE_URL}/api/cart/{test_session_id}/items", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "items" in data
        assert len(data["items"]) >= 1
        
        # Find the added item
        added_item = next((i for i in data["items"] if i["product_id"] == "print-businesscard"), None)
        assert added_item is not None, "print-businesscard item not found in cart"
        assert added_item["name"] == "Visitkort - Klassisk design"
        assert added_item["price"] == 299
        assert added_item["quantity"] == 100
        assert added_item["customization"]["type"] == "businesscard"
        print(f"✓ print-businesscard added to cart with cart_item_id: {added_item['cart_item_id']}")
    
    def test_add_print_catalog_to_cart(self, api_client, test_session_id):
        """Test adding print-catalog virtual product to cart"""
        payload = {
            "product_id": "print-catalog",
            "name": "Katalogutskrift - TEST_Catalog.pdf",
            "price": 499,
            "quantity": 50,
            "customization": {
                "type": "print_catalog",
                "original_filename": "TEST_Catalog.pdf",
                "page_count": 24
            }
        }
        response = api_client.post(f"{BASE_URL}/api/cart/{test_session_id}/items", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        added_item = next((i for i in data["items"] if i["product_id"] == "print-catalog"), None)
        assert added_item is not None, "print-catalog item not found in cart"
        assert added_item["name"] == "Katalogutskrift - TEST_Catalog.pdf"
        assert added_item["price"] == 499
        assert added_item["customization"]["type"] == "print_catalog"
        print(f"✓ print-catalog added to cart with cart_item_id: {added_item['cart_item_id']}")
    
    def test_add_our_catalog_physical_to_cart(self, api_client, test_session_id):
        """Test adding our-catalog-physical virtual product to cart"""
        payload = {
            "product_id": "our-catalog-physical",
            "name": "Printsout Katalog (Fysisk)",
            "price": 0,
            "quantity": 1,
            "customization": {
                "type": "our_catalog",
                "catalog_type": "physical"
            }
        }
        response = api_client.post(f"{BASE_URL}/api/cart/{test_session_id}/items", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        added_item = next((i for i in data["items"] if i["product_id"] == "our-catalog-physical"), None)
        assert added_item is not None, "our-catalog-physical item not found in cart"
        assert added_item["customization"]["type"] == "our_catalog"
        assert added_item["customization"]["catalog_type"] == "physical"
        print(f"✓ our-catalog-physical added to cart")
    
    def test_add_our_catalog_digital_to_cart(self, api_client, test_session_id):
        """Test adding our-catalog-digital virtual product to cart"""
        payload = {
            "product_id": "our-catalog-digital",
            "name": "Printsout Katalog (Digital PDF)",
            "price": 0,
            "quantity": 1,
            "customization": {
                "type": "our_catalog",
                "catalog_type": "digital"
            }
        }
        response = api_client.post(f"{BASE_URL}/api/cart/{test_session_id}/items", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        added_item = next((i for i in data["items"] if i["product_id"] == "our-catalog-digital"), None)
        assert added_item is not None, "our-catalog-digital item not found in cart"
        print(f"✓ our-catalog-digital added to cart")


class TestCartRetrieval:
    """Test fetching cart with B2B items"""
    
    def test_get_cart_returns_all_b2b_items(self, api_client, test_session_id):
        """Verify GET cart returns all B2B virtual products"""
        response = api_client.get(f"{BASE_URL}/api/cart/{test_session_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "items" in data
        assert len(data["items"]) >= 4, f"Expected at least 4 items, got {len(data['items'])}"
        
        # Verify all B2B product IDs are present
        product_ids = [item["product_id"] for item in data["items"]]
        assert "print-businesscard" in product_ids, "print-businesscard missing from cart"
        assert "print-catalog" in product_ids, "print-catalog missing from cart"
        assert "our-catalog-physical" in product_ids, "our-catalog-physical missing from cart"
        assert "our-catalog-digital" in product_ids, "our-catalog-digital missing from cart"
        
        print(f"✓ Cart contains all 4 B2B virtual products")


class TestCartQuantityOperations:
    """Test quantity update operations for B2B items"""
    
    def test_update_quantity_for_b2b_item(self, api_client, test_session_id):
        """Test updating quantity for a B2B virtual product"""
        # First get the cart to find the cart_item_id
        cart_response = api_client.get(f"{BASE_URL}/api/cart/{test_session_id}")
        cart = cart_response.json()
        
        # Find print-businesscard item
        bc_item = next((i for i in cart["items"] if i["product_id"] == "print-businesscard"), None)
        assert bc_item is not None, "print-businesscard not found in cart"
        
        cart_item_id = bc_item["cart_item_id"]
        original_qty = bc_item["quantity"]
        new_qty = original_qty + 50
        
        # Update quantity
        response = api_client.put(f"{BASE_URL}/api/cart/{test_session_id}/items/{cart_item_id}?quantity={new_qty}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        updated_item = next((i for i in data["items"] if i["cart_item_id"] == cart_item_id), None)
        assert updated_item is not None
        assert updated_item["quantity"] == new_qty, f"Expected quantity {new_qty}, got {updated_item['quantity']}"
        
        print(f"✓ Updated print-businesscard quantity from {original_qty} to {new_qty}")
    
    def test_decrease_quantity_for_b2b_item(self, api_client, test_session_id):
        """Test decreasing quantity for a B2B virtual product"""
        cart_response = api_client.get(f"{BASE_URL}/api/cart/{test_session_id}")
        cart = cart_response.json()
        
        # Find print-catalog item
        catalog_item = next((i for i in cart["items"] if i["product_id"] == "print-catalog"), None)
        assert catalog_item is not None
        
        cart_item_id = catalog_item["cart_item_id"]
        new_qty = 25
        
        response = api_client.put(f"{BASE_URL}/api/cart/{test_session_id}/items/{cart_item_id}?quantity={new_qty}")
        
        assert response.status_code == 200
        data = response.json()
        updated_item = next((i for i in data["items"] if i["cart_item_id"] == cart_item_id), None)
        assert updated_item["quantity"] == new_qty
        
        print(f"✓ Decreased print-catalog quantity to {new_qty}")


class TestCartDeleteOperations:
    """Test delete operations for B2B items"""
    
    def test_delete_b2b_item_from_cart(self, api_client, test_session_id):
        """Test removing a B2B virtual product from cart"""
        cart_response = api_client.get(f"{BASE_URL}/api/cart/{test_session_id}")
        cart = cart_response.json()
        
        # Find our-catalog-digital item to delete
        digital_item = next((i for i in cart["items"] if i["product_id"] == "our-catalog-digital"), None)
        assert digital_item is not None
        
        cart_item_id = digital_item["cart_item_id"]
        initial_count = len(cart["items"])
        
        # Delete the item
        response = api_client.delete(f"{BASE_URL}/api/cart/{test_session_id}/items/{cart_item_id}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert len(data["items"]) == initial_count - 1, "Item count should decrease by 1"
        
        # Verify item is gone
        deleted_item = next((i for i in data["items"] if i["cart_item_id"] == cart_item_id), None)
        assert deleted_item is None, "Deleted item should not be in cart"
        
        print(f"✓ Deleted our-catalog-digital from cart")


class TestRegularProductsNoRegression:
    """Test that regular products still work (no regression)"""
    
    def test_add_regular_product_to_cart(self, api_client, test_session_id):
        """Test adding a regular product alongside B2B items"""
        payload = {
            "product_id": "regular-product-123",
            "name": "TEST_Regular Photo Print",
            "price": 99,
            "quantity": 2
        }
        response = api_client.post(f"{BASE_URL}/api/cart/{test_session_id}/items", json=payload)
        
        assert response.status_code == 200
        
        data = response.json()
        regular_item = next((i for i in data["items"] if i["product_id"] == "regular-product-123"), None)
        assert regular_item is not None
        assert regular_item["name"] == "TEST_Regular Photo Print"
        assert regular_item["price"] == 99
        
        print(f"✓ Regular product added to cart alongside B2B items")
    
    def test_cart_contains_mixed_products(self, api_client, test_session_id):
        """Verify cart can contain both B2B and regular products"""
        response = api_client.get(f"{BASE_URL}/api/cart/{test_session_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        product_ids = [item["product_id"] for item in data["items"]]
        
        # Should have B2B items
        b2b_items = [pid for pid in product_ids if pid.startswith("print-") or pid.startswith("our-catalog")]
        assert len(b2b_items) >= 2, f"Expected at least 2 B2B items, got {len(b2b_items)}"
        
        # Should have regular item
        assert "regular-product-123" in product_ids, "Regular product missing"
        
        print(f"✓ Cart contains {len(b2b_items)} B2B items and regular products")


class TestCartTotalsCalculation:
    """Test that cart totals are calculated correctly"""
    
    def test_cart_items_have_prices(self, api_client, test_session_id):
        """Verify all cart items have price information for total calculation"""
        response = api_client.get(f"{BASE_URL}/api/cart/{test_session_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        total = 0
        for item in data["items"]:
            price = item.get("price", 0)
            qty = item.get("quantity", 1)
            item_total = price * qty
            total += item_total
            print(f"  - {item['product_id']}: {price} kr x {qty} = {item_total} kr")
        
        print(f"✓ Cart subtotal: {total} kr")
        assert total > 0, "Cart total should be greater than 0"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
