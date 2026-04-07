"""
Test suite for B2B Catalog Order API endpoints
Tests POST /api/catalog/order and GET /api/catalog/orders
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestCatalogOrderAPI:
    """Tests for catalog order creation and retrieval"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.test_prefix = f"TEST_{uuid.uuid4().hex[:8]}"
    
    # ============ POST /api/catalog/order Tests ============
    
    def test_create_digital_catalog_order(self):
        """Test creating a digital catalog order (minimal required fields)"""
        payload = {
            "company_name": f"{self.test_prefix}_Digital AB",
            "contact_person": "Test Person",
            "email": "digital@test.se",
            "phone": "070-1234567",
            "catalog_type": "digital"
        }
        response = requests.post(f"{BASE_URL}/api/catalog/order", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "message" in data
        assert data["message"] == "Beställning mottagen"
        assert "order_id" in data
        assert isinstance(data["order_id"], str)
        assert len(data["order_id"]) > 0
    
    def test_create_physical_catalog_order_with_address(self):
        """Test creating a physical catalog order with full address"""
        payload = {
            "company_name": f"{self.test_prefix}_Physical AB",
            "contact_person": "Anna Andersson",
            "email": "physical@test.se",
            "phone": "070-9876543",
            "catalog_type": "physical",
            "address": "Storgatan 123",
            "postal_code": "123 45",
            "city": "Stockholm",
            "quantity": 3,
            "message": "Leverera till receptionen"
        }
        response = requests.post(f"{BASE_URL}/api/catalog/order", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["message"] == "Beställning mottagen"
        assert "order_id" in data
    
    def test_create_order_with_optional_message(self):
        """Test creating order with optional message field"""
        payload = {
            "company_name": f"{self.test_prefix}_Message AB",
            "contact_person": "Test Person",
            "email": "message@test.se",
            "phone": "070-1111111",
            "catalog_type": "digital",
            "message": "Speciella önskemål här"
        }
        response = requests.post(f"{BASE_URL}/api/catalog/order", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert "order_id" in data
    
    def test_create_order_missing_required_field_company_name(self):
        """Test that missing company_name returns validation error"""
        payload = {
            "contact_person": "Test Person",
            "email": "test@test.se",
            "phone": "070-1234567",
            "catalog_type": "digital"
        }
        response = requests.post(f"{BASE_URL}/api/catalog/order", json=payload)
        
        assert response.status_code == 422, f"Expected 422 for missing required field, got {response.status_code}"
    
    def test_create_order_missing_required_field_email(self):
        """Test that missing email returns validation error"""
        payload = {
            "company_name": "Test AB",
            "contact_person": "Test Person",
            "phone": "070-1234567",
            "catalog_type": "digital"
        }
        response = requests.post(f"{BASE_URL}/api/catalog/order", json=payload)
        
        assert response.status_code == 422, f"Expected 422 for missing email, got {response.status_code}"
    
    def test_create_order_invalid_email_format(self):
        """Test that invalid email format returns validation error"""
        payload = {
            "company_name": "Test AB",
            "contact_person": "Test Person",
            "email": "invalid-email",
            "phone": "070-1234567",
            "catalog_type": "digital"
        }
        response = requests.post(f"{BASE_URL}/api/catalog/order", json=payload)
        
        assert response.status_code == 422, f"Expected 422 for invalid email, got {response.status_code}"
    
    def test_create_order_default_quantity(self):
        """Test that quantity defaults to 1 when not provided"""
        payload = {
            "company_name": f"{self.test_prefix}_DefaultQty AB",
            "contact_person": "Test Person",
            "email": "defaultqty@test.se",
            "phone": "070-2222222",
            "catalog_type": "physical"
        }
        response = requests.post(f"{BASE_URL}/api/catalog/order", json=payload)
        
        assert response.status_code == 200
        order_id = response.json()["order_id"]
        
        # Verify the order was created with default quantity
        orders_response = requests.get(f"{BASE_URL}/api/catalog/orders")
        orders = orders_response.json()
        created_order = next((o for o in orders if o["order_id"] == order_id), None)
        
        assert created_order is not None
        assert created_order["quantity"] == 1
    
    # ============ GET /api/catalog/orders Tests ============
    
    def test_get_catalog_orders_returns_list(self):
        """Test that GET /api/catalog/orders returns a list"""
        response = requests.get(f"{BASE_URL}/api/catalog/orders")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_catalog_orders_sorted_by_newest_first(self):
        """Test that orders are sorted by created_at descending (newest first)"""
        # Create two orders with slight delay
        payload1 = {
            "company_name": f"{self.test_prefix}_First AB",
            "contact_person": "First Person",
            "email": "first@test.se",
            "phone": "070-1111111",
            "catalog_type": "digital"
        }
        response1 = requests.post(f"{BASE_URL}/api/catalog/order", json=payload1)
        order_id_1 = response1.json()["order_id"]
        
        payload2 = {
            "company_name": f"{self.test_prefix}_Second AB",
            "contact_person": "Second Person",
            "email": "second@test.se",
            "phone": "070-2222222",
            "catalog_type": "digital"
        }
        response2 = requests.post(f"{BASE_URL}/api/catalog/order", json=payload2)
        order_id_2 = response2.json()["order_id"]
        
        # Get orders and verify sorting
        orders_response = requests.get(f"{BASE_URL}/api/catalog/orders")
        orders = orders_response.json()
        
        # Find positions of our test orders
        order_ids = [o["order_id"] for o in orders]
        
        if order_id_1 in order_ids and order_id_2 in order_ids:
            pos_1 = order_ids.index(order_id_1)
            pos_2 = order_ids.index(order_id_2)
            # Second order (newer) should appear before first order (older)
            assert pos_2 < pos_1, "Orders should be sorted by newest first"
    
    def test_get_catalog_orders_contains_required_fields(self):
        """Test that returned orders contain all required fields"""
        # Create an order first
        payload = {
            "company_name": f"{self.test_prefix}_Fields AB",
            "contact_person": "Fields Person",
            "email": "fields@test.se",
            "phone": "070-3333333",
            "catalog_type": "physical",
            "address": "Testgatan 1",
            "postal_code": "111 11",
            "city": "Teststad",
            "quantity": 2,
            "message": "Test message"
        }
        create_response = requests.post(f"{BASE_URL}/api/catalog/order", json=payload)
        order_id = create_response.json()["order_id"]
        
        # Get orders and find our order
        orders_response = requests.get(f"{BASE_URL}/api/catalog/orders")
        orders = orders_response.json()
        created_order = next((o for o in orders if o["order_id"] == order_id), None)
        
        assert created_order is not None, "Created order should be in the list"
        
        # Verify all fields are present
        required_fields = [
            "company_name", "contact_person", "email", "phone",
            "catalog_type", "quantity", "order_id", "status", "created_at"
        ]
        for field in required_fields:
            assert field in created_order, f"Field '{field}' should be present in order"
        
        # Verify field values
        assert created_order["company_name"] == payload["company_name"]
        assert created_order["contact_person"] == payload["contact_person"]
        assert created_order["email"] == payload["email"]
        assert created_order["phone"] == payload["phone"]
        assert created_order["catalog_type"] == payload["catalog_type"]
        assert created_order["address"] == payload["address"]
        assert created_order["postal_code"] == payload["postal_code"]
        assert created_order["city"] == payload["city"]
        assert created_order["quantity"] == payload["quantity"]
        assert created_order["message"] == payload["message"]
        assert created_order["status"] == "pending"
    
    def test_get_catalog_orders_excludes_mongodb_id(self):
        """Test that _id field from MongoDB is excluded from response"""
        response = requests.get(f"{BASE_URL}/api/catalog/orders")
        orders = response.json()
        
        if len(orders) > 0:
            for order in orders:
                assert "_id" not in order, "MongoDB _id should be excluded from response"


class TestCatalogOrderEdgeCases:
    """Edge case tests for catalog orders"""
    
    def test_create_order_with_empty_optional_fields(self):
        """Test creating order with empty optional fields"""
        payload = {
            "company_name": "Empty Fields AB",
            "contact_person": "Test Person",
            "email": "empty@test.se",
            "phone": "070-4444444",
            "catalog_type": "digital",
            "address": None,
            "postal_code": None,
            "city": None,
            "message": None
        }
        response = requests.post(f"{BASE_URL}/api/catalog/order", json=payload)
        
        assert response.status_code == 200
    
    def test_create_order_with_special_characters_in_company_name(self):
        """Test creating order with special characters in company name"""
        payload = {
            "company_name": "Företag & Co AB (Test)",
            "contact_person": "Åsa Öberg",
            "email": "special@test.se",
            "phone": "070-5555555",
            "catalog_type": "digital"
        }
        response = requests.post(f"{BASE_URL}/api/catalog/order", json=payload)
        
        assert response.status_code == 200
        order_id = response.json()["order_id"]
        
        # Verify the special characters are preserved
        orders_response = requests.get(f"{BASE_URL}/api/catalog/orders")
        orders = orders_response.json()
        created_order = next((o for o in orders if o["order_id"] == order_id), None)
        
        assert created_order is not None
        assert created_order["company_name"] == "Företag & Co AB (Test)"
        assert created_order["contact_person"] == "Åsa Öberg"
