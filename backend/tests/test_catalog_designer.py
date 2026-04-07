"""
Test Catalog Designer Feature - Cart API Integration
Tests for the custom catalog design feature (print-catalog-custom virtual product)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestCatalogDesignerCartIntegration:
    """Tests for adding custom catalog designs to cart"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session_id = f"test-catalog-designer-{uuid.uuid4().hex[:8]}"
        yield
        # Cleanup: clear cart after tests
        try:
            requests.delete(f"{BASE_URL}/api/cart/{self.session_id}")
        except:
            pass
    
    def test_add_catalog_design_to_cart(self):
        """Test adding a custom catalog design to cart"""
        payload = {
            "product_id": "print-catalog-custom",
            "name": "Katalogdesign: Test Företag AB",
            "price": 89,
            "quantity": 1,
            "image": None,
            "customization": {
                "type": "catalog_design",
                "company_name": "Test Företag AB",
                "logo_url": None,
                "template": "classic",
                "theme": {"primaryColor": "#2a9d8f", "font": "Inter"},
                "pages": [
                    {"type": "cover", "title": "Test Företag AB", "subtitle": "Produktkatalog 2026", "bgImage": None},
                    {"type": "product", "items": [{"image": None, "name": "Produkt 1", "desc": "Beskrivning", "price": "199"}]},
                    {"type": "backcover", "companyName": "Test Företag AB", "phone": "08-123 45 67", "email": "info@test.se", "website": "", "address": ""}
                ],
                "page_count": 3
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/cart/{self.session_id}/items", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "items" in data
        assert len(data["items"]) == 1
        
        item = data["items"][0]
        assert item["product_id"] == "print-catalog-custom"
        assert item["name"] == "Katalogdesign: Test Företag AB"
        assert item["price"] == 89
        assert item["customization"]["type"] == "catalog_design"
        assert item["customization"]["company_name"] == "Test Företag AB"
        assert item["customization"]["template"] == "classic"
        assert item["customization"]["page_count"] == 3
        print("✓ Catalog design added to cart successfully")
    
    def test_catalog_design_with_multiple_pages(self):
        """Test catalog design with 8 pages (default)"""
        pages = [
            {"type": "cover", "title": "Multi Page Test", "subtitle": "Katalog 2026", "bgImage": None},
            {"type": "product", "items": [{"image": None, "name": "P1", "desc": "", "price": "100"}]},
            {"type": "product", "items": [{"image": None, "name": "P2", "desc": "", "price": "200"}]},
            {"type": "gallery", "title": "Galleri", "images": [None, None, None, None], "captions": ["", "", "", ""]},
            {"type": "product", "items": [{"image": None, "name": "P3", "desc": "", "price": "300"}]},
            {"type": "text", "title": "Om oss", "body": "Vi är ett företag."},
            {"type": "product", "items": [{"image": None, "name": "P4", "desc": "", "price": "400"}]},
            {"type": "backcover", "companyName": "Multi Page Test", "phone": "", "email": "", "website": "", "address": ""}
        ]
        
        payload = {
            "product_id": "print-catalog-custom",
            "name": "Katalogdesign: Multi Page Test",
            "price": 89,
            "quantity": 5,
            "image": None,
            "customization": {
                "type": "catalog_design",
                "company_name": "Multi Page Test",
                "logo_url": None,
                "template": "modern",
                "theme": {"primaryColor": "#e76f51", "font": "Georgia"},
                "pages": pages,
                "page_count": 8
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/cart/{self.session_id}/items", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        item = data["items"][0]
        assert item["customization"]["page_count"] == 8
        assert item["customization"]["template"] == "modern"
        assert item["quantity"] == 5
        print("✓ Multi-page catalog design added successfully")
    
    def test_catalog_design_quantity_pricing(self):
        """Test that quantity affects pricing correctly"""
        # Add with quantity 10 (should be 69 kr/ex tier)
        payload = {
            "product_id": "print-catalog-custom",
            "name": "Katalogdesign: Pricing Test",
            "price": 69,  # 10+ tier price
            "quantity": 10,
            "image": None,
            "customization": {
                "type": "catalog_design",
                "company_name": "Pricing Test",
                "logo_url": None,
                "template": "minimal",
                "theme": {"primaryColor": "#000000", "font": "Montserrat"},
                "pages": [
                    {"type": "cover", "title": "Pricing Test", "subtitle": "", "bgImage": None},
                    {"type": "backcover", "companyName": "Pricing Test", "phone": "", "email": "", "website": "", "address": ""}
                ],
                "page_count": 2
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/cart/{self.session_id}/items", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        item = data["items"][0]
        assert item["price"] == 69
        assert item["quantity"] == 10
        # Total should be 69 * 10 = 690 kr
        print("✓ Quantity pricing stored correctly")
    
    def test_get_cart_with_catalog_design(self):
        """Test retrieving cart with catalog design item"""
        # First add an item
        payload = {
            "product_id": "print-catalog-custom",
            "name": "Katalogdesign: Retrieve Test",
            "price": 89,
            "quantity": 1,
            "image": None,
            "customization": {
                "type": "catalog_design",
                "company_name": "Retrieve Test",
                "logo_url": None,
                "template": "classic",
                "theme": {"primaryColor": "#2a9d8f", "font": "Inter"},
                "pages": [],
                "page_count": 4
            }
        }
        
        requests.post(f"{BASE_URL}/api/cart/{self.session_id}/items", json=payload)
        
        # Now retrieve cart
        response = requests.get(f"{BASE_URL}/api/cart/{self.session_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["items"]) >= 1
        
        # Find our catalog design item
        catalog_items = [i for i in data["items"] if i["product_id"] == "print-catalog-custom"]
        assert len(catalog_items) >= 1
        print("✓ Cart retrieval with catalog design works")
    
    def test_update_catalog_design_quantity(self):
        """Test updating quantity of catalog design item"""
        # Add item
        payload = {
            "product_id": "print-catalog-custom",
            "name": "Katalogdesign: Update Test",
            "price": 89,
            "quantity": 1,
            "image": None,
            "customization": {
                "type": "catalog_design",
                "company_name": "Update Test",
                "logo_url": None,
                "template": "classic",
                "theme": {},
                "pages": [],
                "page_count": 4
            }
        }
        
        add_response = requests.post(f"{BASE_URL}/api/cart/{self.session_id}/items", json=payload)
        cart_item_id = add_response.json()["items"][0]["cart_item_id"]
        
        # Update quantity
        update_response = requests.put(
            f"{BASE_URL}/api/cart/{self.session_id}/items/{cart_item_id}",
            params={"quantity": 5}
        )
        assert update_response.status_code == 200
        
        data = update_response.json()
        updated_item = next((i for i in data["items"] if i["cart_item_id"] == cart_item_id), None)
        assert updated_item is not None
        assert updated_item["quantity"] == 5
        print("✓ Catalog design quantity update works")
    
    def test_delete_catalog_design_from_cart(self):
        """Test removing catalog design item from cart"""
        # Add item
        payload = {
            "product_id": "print-catalog-custom",
            "name": "Katalogdesign: Delete Test",
            "price": 89,
            "quantity": 1,
            "image": None,
            "customization": {
                "type": "catalog_design",
                "company_name": "Delete Test",
                "logo_url": None,
                "template": "classic",
                "theme": {},
                "pages": [],
                "page_count": 4
            }
        }
        
        add_response = requests.post(f"{BASE_URL}/api/cart/{self.session_id}/items", json=payload)
        cart_item_id = add_response.json()["items"][0]["cart_item_id"]
        
        # Delete item
        delete_response = requests.delete(f"{BASE_URL}/api/cart/{self.session_id}/items/{cart_item_id}")
        assert delete_response.status_code == 200
        
        data = delete_response.json()
        remaining_items = [i for i in data["items"] if i["cart_item_id"] == cart_item_id]
        assert len(remaining_items) == 0
        print("✓ Catalog design deletion works")


class TestCatalogDesignerWithOtherProducts:
    """Test catalog design items alongside other cart items"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session_id = f"test-mixed-cart-{uuid.uuid4().hex[:8]}"
        yield
        try:
            requests.delete(f"{BASE_URL}/api/cart/{self.session_id}")
        except:
            pass
    
    def test_mixed_cart_catalog_and_regular(self):
        """Test cart with both catalog design and regular products"""
        # Add catalog design
        catalog_payload = {
            "product_id": "print-catalog-custom",
            "name": "Katalogdesign: Mixed Cart Test",
            "price": 89,
            "quantity": 2,
            "image": None,
            "customization": {
                "type": "catalog_design",
                "company_name": "Mixed Cart Test",
                "logo_url": None,
                "template": "classic",
                "theme": {},
                "pages": [],
                "page_count": 4
            }
        }
        
        response1 = requests.post(f"{BASE_URL}/api/cart/{self.session_id}/items", json=catalog_payload)
        assert response1.status_code == 200
        
        # Add business card (another B2B product)
        card_payload = {
            "product_id": "print-businesscard",
            "name": "Visitkort: Test Person",
            "price": 3.90,
            "quantity": 100,
            "image": None,
            "customization": {
                "type": "businesscard",
                "source": "editor",
                "card_details": {"name": "Test Person", "title": "CEO"},
                "template": "classic",
                "color": "#2a9d8f"
            }
        }
        
        response2 = requests.post(f"{BASE_URL}/api/cart/{self.session_id}/items", json=card_payload)
        assert response2.status_code == 200
        
        # Get cart and verify both items
        cart_response = requests.get(f"{BASE_URL}/api/cart/{self.session_id}")
        assert cart_response.status_code == 200
        
        data = cart_response.json()
        assert len(data["items"]) == 2
        
        product_ids = [i["product_id"] for i in data["items"]]
        assert "print-catalog-custom" in product_ids
        assert "print-businesscard" in product_ids
        print("✓ Mixed cart with catalog design and business card works")
    
    def test_multiple_catalog_designs_in_cart(self):
        """Test adding multiple different catalog designs to cart"""
        # Add first catalog
        catalog1 = {
            "product_id": "print-catalog-custom",
            "name": "Katalogdesign: Företag A",
            "price": 89,
            "quantity": 1,
            "image": None,
            "customization": {
                "type": "catalog_design",
                "company_name": "Företag A",
                "template": "classic",
                "theme": {"primaryColor": "#2a9d8f"},
                "pages": [],
                "page_count": 4
            }
        }
        
        catalog2 = {
            "product_id": "print-catalog-custom",
            "name": "Katalogdesign: Företag B",
            "price": 69,
            "quantity": 10,
            "image": None,
            "customization": {
                "type": "catalog_design",
                "company_name": "Företag B",
                "template": "modern",
                "theme": {"primaryColor": "#e76f51"},
                "pages": [],
                "page_count": 8
            }
        }
        
        requests.post(f"{BASE_URL}/api/cart/{self.session_id}/items", json=catalog1)
        requests.post(f"{BASE_URL}/api/cart/{self.session_id}/items", json=catalog2)
        
        cart_response = requests.get(f"{BASE_URL}/api/cart/{self.session_id}")
        data = cart_response.json()
        
        catalog_items = [i for i in data["items"] if i["product_id"] == "print-catalog-custom"]
        assert len(catalog_items) == 2
        
        company_names = [i["customization"]["company_name"] for i in catalog_items]
        assert "Företag A" in company_names
        assert "Företag B" in company_names
        print("✓ Multiple catalog designs in cart works")


class TestCatalogDesignerEdgeCases:
    """Edge case tests for catalog designer"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session_id = f"test-edge-{uuid.uuid4().hex[:8]}"
        yield
        try:
            requests.delete(f"{BASE_URL}/api/cart/{self.session_id}")
        except:
            pass
    
    def test_catalog_with_special_characters_in_name(self):
        """Test catalog with special characters in company name"""
        payload = {
            "product_id": "print-catalog-custom",
            "name": "Katalogdesign: Åäö & Co AB",
            "price": 89,
            "quantity": 1,
            "image": None,
            "customization": {
                "type": "catalog_design",
                "company_name": "Åäö & Co AB",
                "template": "classic",
                "theme": {},
                "pages": [],
                "page_count": 4
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/cart/{self.session_id}/items", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["items"][0]["customization"]["company_name"] == "Åäö & Co AB"
        print("✓ Special characters in company name handled correctly")
    
    def test_catalog_with_12_pages(self):
        """Test catalog with maximum default pages (12)"""
        pages = [{"type": "cover", "title": "12 Page Test", "subtitle": "", "bgImage": None}]
        for i in range(10):
            pages.append({"type": "product", "items": [{"image": None, "name": f"Product {i+1}", "desc": "", "price": ""}]})
        pages.append({"type": "backcover", "companyName": "12 Page Test", "phone": "", "email": "", "website": "", "address": ""})
        
        payload = {
            "product_id": "print-catalog-custom",
            "name": "Katalogdesign: 12 Page Test",
            "price": 89,
            "quantity": 1,
            "image": None,
            "customization": {
                "type": "catalog_design",
                "company_name": "12 Page Test",
                "template": "classic",
                "theme": {},
                "pages": pages,
                "page_count": 12
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/cart/{self.session_id}/items", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["items"][0]["customization"]["page_count"] == 12
        assert len(data["items"][0]["customization"]["pages"]) == 12
        print("✓ 12-page catalog handled correctly")
