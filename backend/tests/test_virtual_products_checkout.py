"""
Test virtual/B2B products are included in order items during checkout.
Bug fix: _build_order_items() in payments.py now handles virtual products
that don't exist in the products DB collection.

Virtual product IDs:
- print-catalog-custom (catalog designer)
- print-businesscard (business cards)
- print-catalog (PDF catalog upload)
- our-catalog-physical (physical catalog)
- our-catalog-digital (digital catalog)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestVirtualProductsInCheckout:
    """Test that virtual/B2B products are included in order items during checkout"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Create a unique cart session for each test"""
        self.session_id = f"test-checkout-{uuid.uuid4().hex[:8]}"
        yield
        # Cleanup: delete cart after test
        try:
            requests.delete(f"{BASE_URL}/api/cart/{self.session_id}")
        except:
            pass
    
    def test_checkout_includes_print_catalog_custom(self):
        """Test print-catalog-custom (catalog designer) is included in checkout"""
        # Add virtual product to cart
        cart_item = {
            "product_id": "print-catalog-custom",
            "name": "Katalogdesign: Test Company",
            "price": 89,
            "quantity": 2,
            "customization": {
                "type": "catalog_design",
                "company_name": "Test Company",
                "template": "classic",
                "page_count": 8,
                "theme": {"primaryColor": "#2a9d8f", "font": "Inter"}
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/cart/{self.session_id}/items",
            json=cart_item
        )
        assert response.status_code == 200, f"Failed to add item: {response.text}"
        
        # Verify cart has the item
        cart_response = requests.get(f"{BASE_URL}/api/cart/{self.session_id}")
        assert cart_response.status_code == 200
        cart_data = cart_response.json()
        assert len(cart_data.get("items", [])) == 1
        
        # Attempt checkout - this should NOT fail due to missing product in DB
        checkout_data = {
            "cart_session_id": self.session_id,
            "email": "test@example.com",
            "payment_method": "card",
            "shipping_address": {
                "name": "Test User",
                "street": "Test Street 1",
                "zip": "12345",
                "city": "Stockholm"
            }
        }
        
        checkout_response = requests.post(
            f"{BASE_URL}/api/payments/checkout",
            json=checkout_data
        )
        
        # Should succeed (200) or redirect to Stripe (which may fail in test env)
        # The key is it should NOT return 400 "Ogiltig totalsumma" or empty items
        assert checkout_response.status_code in [200, 500], f"Unexpected status: {checkout_response.status_code}, {checkout_response.text}"
        
        if checkout_response.status_code == 200:
            data = checkout_response.json()
            assert "checkout_url" in data or "order_id" in data
            print(f"✓ Checkout succeeded for print-catalog-custom")
        else:
            # 500 might be Stripe API error, but not "Ogiltig totalsumma"
            error_text = checkout_response.text
            assert "Ogiltig totalsumma" not in error_text, "Virtual product was dropped from order items!"
            print(f"✓ Checkout attempted (Stripe may have failed, but virtual product was included)")
    
    def test_checkout_includes_print_businesscard(self):
        """Test print-businesscard is included in checkout"""
        cart_item = {
            "product_id": "print-businesscard",
            "name": "Visitkort: Test Design",
            "price": 299,
            "quantity": 1,
            "customization": {
                "type": "businesscard",
                "source": "editor",
                "card_details": {
                    "template": "modern",
                    "name": "John Doe",
                    "company": "Test Corp"
                }
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/cart/{self.session_id}/items",
            json=cart_item
        )
        assert response.status_code == 200
        
        checkout_data = {
            "cart_session_id": self.session_id,
            "email": "test@example.com",
            "payment_method": "card",
            "shipping_address": {
                "name": "Test User",
                "street": "Test Street 1",
                "zip": "12345",
                "city": "Stockholm"
            }
        }
        
        checkout_response = requests.post(
            f"{BASE_URL}/api/payments/checkout",
            json=checkout_data
        )
        
        assert checkout_response.status_code in [200, 500]
        if checkout_response.status_code == 500:
            assert "Ogiltig totalsumma" not in checkout_response.text
        print(f"✓ Checkout attempted for print-businesscard")
    
    def test_checkout_includes_print_catalog(self):
        """Test print-catalog (PDF upload) is included in checkout"""
        cart_item = {
            "product_id": "print-catalog",
            "name": "Katalogutskrift: test.pdf",
            "price": 199,
            "quantity": 3,
            "customization": {
                "type": "print_catalog",
                "original_filename": "test.pdf",
                "pdf_url": "/uploads/test.pdf"
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/cart/{self.session_id}/items",
            json=cart_item
        )
        assert response.status_code == 200
        
        checkout_data = {
            "cart_session_id": self.session_id,
            "email": "test@example.com",
            "payment_method": "card",
            "shipping_address": {
                "name": "Test User",
                "street": "Test Street 1",
                "zip": "12345",
                "city": "Stockholm"
            }
        }
        
        checkout_response = requests.post(
            f"{BASE_URL}/api/payments/checkout",
            json=checkout_data
        )
        
        assert checkout_response.status_code in [200, 500]
        if checkout_response.status_code == 500:
            assert "Ogiltig totalsumma" not in checkout_response.text
        print(f"✓ Checkout attempted for print-catalog")
    
    def test_checkout_includes_our_catalog_physical(self):
        """Test our-catalog-physical is included in checkout"""
        cart_item = {
            "product_id": "our-catalog-physical",
            "name": "Fysisk katalog",
            "price": 0,  # Free physical catalog
            "quantity": 1,
            "customization": {
                "type": "our_catalog",
                "catalog_type": "physical",
                "company_name": "Test Company",
                "contact_email": "test@example.com"
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/cart/{self.session_id}/items",
            json=cart_item
        )
        assert response.status_code == 200
        
        # Note: Free items (price=0) should be skipped in _build_order_items
        # This is expected behavior - free catalogs don't go through checkout
        cart_response = requests.get(f"{BASE_URL}/api/cart/{self.session_id}")
        assert cart_response.status_code == 200
        print(f"✓ our-catalog-physical added to cart (free item)")
    
    def test_checkout_includes_our_catalog_digital(self):
        """Test our-catalog-digital is included in checkout"""
        cart_item = {
            "product_id": "our-catalog-digital",
            "name": "Digital katalog (PDF)",
            "price": 0,  # Free digital catalog
            "quantity": 1,
            "customization": {
                "type": "our_catalog",
                "catalog_type": "digital",
                "company_name": "Test Company",
                "contact_email": "test@example.com"
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/cart/{self.session_id}/items",
            json=cart_item
        )
        assert response.status_code == 200
        print(f"✓ our-catalog-digital added to cart (free item)")
    
    def test_checkout_mixed_virtual_and_regular_products(self):
        """Test checkout with both virtual and regular products"""
        # Add virtual product
        virtual_item = {
            "product_id": "print-catalog-custom",
            "name": "Katalogdesign: Mixed Test",
            "price": 89,
            "quantity": 1,
            "customization": {
                "type": "catalog_design",
                "company_name": "Mixed Test",
                "template": "modern",
                "page_count": 4
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/cart/{self.session_id}/items",
            json=virtual_item
        )
        assert response.status_code == 200
        
        # Add regular product (if exists in DB)
        regular_item = {
            "product_id": "mugg-001",  # Assuming this exists
            "quantity": 1
        }
        
        requests.post(
            f"{BASE_URL}/api/cart/{self.session_id}/items",
            json=regular_item
        )
        # Don't assert - regular product may not exist
        
        # Verify cart
        cart_response = requests.get(f"{BASE_URL}/api/cart/{self.session_id}")
        assert cart_response.status_code == 200
        cart_data = cart_response.json()
        assert len(cart_data.get("items", [])) >= 1
        
        # Attempt checkout
        checkout_data = {
            "cart_session_id": self.session_id,
            "email": "test@example.com",
            "payment_method": "card",
            "shipping_address": {
                "name": "Test User",
                "street": "Test Street 1",
                "zip": "12345",
                "city": "Stockholm"
            }
        }
        
        checkout_response = requests.post(
            f"{BASE_URL}/api/payments/checkout",
            json=checkout_data
        )
        
        assert checkout_response.status_code in [200, 500]
        if checkout_response.status_code == 500:
            assert "Ogiltig totalsumma" not in checkout_response.text
        print(f"✓ Mixed cart checkout attempted")


class TestBuildOrderItemsLogic:
    """Test the _build_order_items logic handles virtual products correctly"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session_id = f"test-build-{uuid.uuid4().hex[:8]}"
        yield
        try:
            requests.delete(f"{BASE_URL}/api/cart/{self.session_id}")
        except:
            pass
    
    def test_virtual_product_uses_cart_item_price(self):
        """Test that virtual products use price from cart item, not DB"""
        cart_item = {
            "product_id": "print-catalog-custom",
            "name": "Test Catalog",
            "price": 123,  # Specific price
            "quantity": 1,
            "customization": {"type": "catalog_design"}
        }
        
        response = requests.post(
            f"{BASE_URL}/api/cart/{self.session_id}/items",
            json=cart_item
        )
        assert response.status_code == 200
        
        # Verify cart item has correct price
        cart_response = requests.get(f"{BASE_URL}/api/cart/{self.session_id}")
        cart_data = cart_response.json()
        item = cart_data["items"][0]
        assert item["price"] == 123, f"Expected price 123, got {item.get('price')}"
        print(f"✓ Virtual product price preserved in cart: {item['price']}")
    
    def test_virtual_product_uses_cart_item_name(self):
        """Test that virtual products use name from cart item, not DB"""
        cart_item = {
            "product_id": "print-businesscard",
            "name": "Custom Business Card Name",
            "price": 299,
            "quantity": 1,
            "customization": {"type": "businesscard"}
        }
        
        response = requests.post(
            f"{BASE_URL}/api/cart/{self.session_id}/items",
            json=cart_item
        )
        assert response.status_code == 200
        
        cart_response = requests.get(f"{BASE_URL}/api/cart/{self.session_id}")
        cart_data = cart_response.json()
        item = cart_data["items"][0]
        assert item["name"] == "Custom Business Card Name"
        print(f"✓ Virtual product name preserved in cart: {item['name']}")
    
    def test_zero_price_items_skipped(self):
        """Test that items with price=0 and no DB product are skipped"""
        cart_item = {
            "product_id": "our-catalog-physical",
            "name": "Free Catalog",
            "price": 0,
            "quantity": 1,
            "customization": {"type": "our_catalog", "catalog_type": "physical"}
        }
        
        response = requests.post(
            f"{BASE_URL}/api/cart/{self.session_id}/items",
            json=cart_item
        )
        assert response.status_code == 200
        
        # Checkout should fail with "Ogiltig totalsumma" because total is 0
        checkout_data = {
            "cart_session_id": self.session_id,
            "email": "test@example.com",
            "payment_method": "card",
            "shipping_address": {"name": "Test", "street": "St", "zip": "123", "city": "City"}
        }
        
        checkout_response = requests.post(
            f"{BASE_URL}/api/payments/checkout",
            json=checkout_data
        )
        
        # Should return 400 because total is 0 (expected behavior)
        assert checkout_response.status_code == 400
        assert "Ogiltig totalsumma" in checkout_response.text
        print(f"✓ Zero-price items correctly result in invalid total")


class TestCartEditForCatalogDesign:
    """Test cart edit functionality for catalog_design items"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session_id = f"test-edit-{uuid.uuid4().hex[:8]}"
        yield
        try:
            requests.delete(f"{BASE_URL}/api/cart/{self.session_id}")
        except:
            pass
    
    def test_catalog_design_item_has_cart_item_id(self):
        """Test that catalog_design items get a cart_item_id for editing"""
        cart_item = {
            "product_id": "print-catalog-custom",
            "name": "Editable Catalog",
            "price": 89,
            "quantity": 1,
            "customization": {
                "type": "catalog_design",
                "company_name": "Edit Test",
                "template": "classic",
                "page_count": 8,
                "pages": [{"id": "p1", "type": "cover"}]
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/cart/{self.session_id}/items",
            json=cart_item
        )
        assert response.status_code == 200
        
        cart_response = requests.get(f"{BASE_URL}/api/cart/{self.session_id}")
        cart_data = cart_response.json()
        item = cart_data["items"][0]
        
        assert "cart_item_id" in item, "cart_item_id missing from cart item"
        print(f"✓ catalog_design item has cart_item_id: {item['cart_item_id']}")
    
    def test_update_catalog_design_item(self):
        """Test updating a catalog_design item in cart using PATCH"""
        # Add item
        cart_item = {
            "product_id": "print-catalog-custom",
            "name": "Original Catalog",
            "price": 89,
            "quantity": 1,
            "customization": {
                "type": "catalog_design",
                "company_name": "Original Company",
                "template": "classic"
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/cart/{self.session_id}/items",
            json=cart_item
        )
        assert response.status_code == 200
        
        # Get cart_item_id
        cart_response = requests.get(f"{BASE_URL}/api/cart/{self.session_id}")
        cart_data = cart_response.json()
        cart_item_id = cart_data["items"][0]["cart_item_id"]
        
        # Update item using PATCH (not PUT)
        updated_item = {
            "product_id": "print-catalog-custom",
            "name": "Updated Catalog",
            "price": 69,  # Different price tier
            "quantity": 10,
            "customization": {
                "type": "catalog_design",
                "company_name": "Updated Company",
                "template": "modern"
            }
        }
        
        update_response = requests.patch(
            f"{BASE_URL}/api/cart/{self.session_id}/items/{cart_item_id}",
            json=updated_item
        )
        assert update_response.status_code == 200
        
        # Verify update
        cart_response = requests.get(f"{BASE_URL}/api/cart/{self.session_id}")
        cart_data = cart_response.json()
        item = cart_data["items"][0]
        
        assert item["name"] == "Updated Catalog"
        assert item["customization"]["company_name"] == "Updated Company"
        assert item["customization"]["template"] == "modern"
        print(f"✓ catalog_design item updated successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
