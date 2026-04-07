"""
Test suite for B2B Catalog Order API with PDF Upload (Multipart Form)
Tests POST /api/catalog/order (multipart form) and GET /api/catalog/orders
Updated for new PDF upload feature - replaces old JSON-based endpoint
"""
import pytest
import requests
import os
import uuid
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Create a minimal valid PDF content for testing
def create_test_pdf_content():
    """Create minimal valid PDF bytes for testing"""
    return b"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>
endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer
<< /Size 4 /Root 1 0 R >>
startxref
193
%%EOF"""


class TestCatalogPDFUploadAPI:
    """Tests for catalog order creation with PDF upload (multipart form)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.test_prefix = f"TEST_{uuid.uuid4().hex[:8]}"
        self.pdf_content = create_test_pdf_content()
    
    # ============ POST /api/catalog/order Tests (Multipart Form) ============
    
    def test_create_catalog_order_with_pdf(self):
        """Test creating a catalog order with PDF file upload"""
        files = {
            'pdf_file': ('test_catalog.pdf', io.BytesIO(self.pdf_content), 'application/pdf')
        }
        data = {
            'company_name': f'{self.test_prefix}_Company AB',
            'contact_person': 'Test Person',
            'email': 'test@example.se',
            'phone': '070-1234567',
            'address': 'Testgatan 1',
            'postal_code': '123 45',
            'city': 'Stockholm',
            'quantity': '2',
            'message': 'Test message'
        }
        
        response = requests.post(f"{BASE_URL}/api/catalog/order", files=files, data=data)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        result = response.json()
        assert result["message"] == "Beställning mottagen"
        assert "order_id" in result
        assert isinstance(result["order_id"], str)
        assert len(result["order_id"]) > 0
    
    def test_create_order_minimal_required_fields(self):
        """Test creating order with only required fields"""
        files = {
            'pdf_file': ('minimal.pdf', io.BytesIO(self.pdf_content), 'application/pdf')
        }
        data = {
            'company_name': f'{self.test_prefix}_Minimal AB',
            'contact_person': 'Minimal Person',
            'email': 'minimal@test.se',
            'phone': '070-1111111'
        }
        
        response = requests.post(f"{BASE_URL}/api/catalog/order", files=files, data=data)
        
        assert response.status_code == 200
        result = response.json()
        assert "order_id" in result
    
    def test_reject_non_pdf_file(self):
        """Test that non-PDF files are rejected"""
        files = {
            'pdf_file': ('test.txt', io.BytesIO(b'This is not a PDF'), 'text/plain')
        }
        data = {
            'company_name': 'Test Company',
            'contact_person': 'Test Person',
            'email': 'test@test.se',
            'phone': '070-1234567'
        }
        
        response = requests.post(f"{BASE_URL}/api/catalog/order", files=files, data=data)
        
        assert response.status_code == 400, f"Expected 400 for non-PDF, got {response.status_code}"
        assert "Bara PDF-filer tillåtna" in response.json().get("detail", "")
    
    def test_reject_missing_pdf_file(self):
        """Test that missing PDF file returns error"""
        data = {
            'company_name': 'Test Company',
            'contact_person': 'Test Person',
            'email': 'test@test.se',
            'phone': '070-1234567'
        }
        
        response = requests.post(f"{BASE_URL}/api/catalog/order", data=data)
        
        assert response.status_code == 422, f"Expected 422 for missing PDF, got {response.status_code}"
    
    def test_reject_missing_required_field_company_name(self):
        """Test that missing company_name returns validation error"""
        files = {
            'pdf_file': ('test.pdf', io.BytesIO(self.pdf_content), 'application/pdf')
        }
        data = {
            'contact_person': 'Test Person',
            'email': 'test@test.se',
            'phone': '070-1234567'
        }
        
        response = requests.post(f"{BASE_URL}/api/catalog/order", files=files, data=data)
        
        assert response.status_code == 422, f"Expected 422 for missing company_name, got {response.status_code}"
    
    def test_reject_missing_required_field_email(self):
        """Test that missing email returns validation error"""
        files = {
            'pdf_file': ('test.pdf', io.BytesIO(self.pdf_content), 'application/pdf')
        }
        data = {
            'company_name': 'Test Company',
            'contact_person': 'Test Person',
            'phone': '070-1234567'
        }
        
        response = requests.post(f"{BASE_URL}/api/catalog/order", files=files, data=data)
        
        assert response.status_code == 422, f"Expected 422 for missing email, got {response.status_code}"
    
    def test_default_quantity_is_one(self):
        """Test that quantity defaults to 1 when not provided"""
        files = {
            'pdf_file': ('default_qty.pdf', io.BytesIO(self.pdf_content), 'application/pdf')
        }
        data = {
            'company_name': f'{self.test_prefix}_DefaultQty AB',
            'contact_person': 'Test Person',
            'email': 'defaultqty@test.se',
            'phone': '070-2222222',
            'address': 'Testgatan 1',
            'postal_code': '111 11',
            'city': 'Teststad'
        }
        
        response = requests.post(f"{BASE_URL}/api/catalog/order", files=files, data=data)
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
    
    def test_get_orders_contains_pdf_url_and_original_filename(self):
        """Test that orders contain pdf_url and original_filename fields"""
        # Create an order first
        files = {
            'pdf_file': ('my_catalog.pdf', io.BytesIO(self.pdf_content), 'application/pdf')
        }
        data = {
            'company_name': f'{self.test_prefix}_PDFFields AB',
            'contact_person': 'PDF Person',
            'email': 'pdffields@test.se',
            'phone': '070-3333333',
            'address': 'Testgatan 1',
            'postal_code': '111 11',
            'city': 'Teststad'
        }
        
        create_response = requests.post(f"{BASE_URL}/api/catalog/order", files=files, data=data)
        order_id = create_response.json()["order_id"]
        
        # Get orders and find our order
        orders_response = requests.get(f"{BASE_URL}/api/catalog/orders")
        orders = orders_response.json()
        created_order = next((o for o in orders if o["order_id"] == order_id), None)
        
        assert created_order is not None, "Created order should be in the list"
        assert "pdf_url" in created_order, "Order should have pdf_url field"
        assert "original_filename" in created_order, "Order should have original_filename field"
        assert created_order["original_filename"] == "my_catalog.pdf"
        assert created_order["pdf_url"].startswith("/api/uploads/")
    
    def test_pdf_file_is_accessible_at_pdf_url(self):
        """Test that uploaded PDF is accessible at the pdf_url path"""
        # Create an order
        files = {
            'pdf_file': ('accessible.pdf', io.BytesIO(self.pdf_content), 'application/pdf')
        }
        data = {
            'company_name': f'{self.test_prefix}_Accessible AB',
            'contact_person': 'Access Person',
            'email': 'accessible@test.se',
            'phone': '070-4444444',
            'address': 'Testgatan 1',
            'postal_code': '111 11',
            'city': 'Teststad'
        }
        
        create_response = requests.post(f"{BASE_URL}/api/catalog/order", files=files, data=data)
        order_id = create_response.json()["order_id"]
        
        # Get the order to find pdf_url
        orders_response = requests.get(f"{BASE_URL}/api/catalog/orders")
        orders = orders_response.json()
        created_order = next((o for o in orders if o["order_id"] == order_id), None)
        
        assert created_order is not None
        pdf_url = created_order["pdf_url"]
        
        # Access the PDF file
        pdf_response = requests.get(f"{BASE_URL}{pdf_url}")
        assert pdf_response.status_code == 200, f"PDF should be accessible at {pdf_url}"
        assert b"%PDF" in pdf_response.content, "Response should contain PDF content"
    
    def test_get_orders_sorted_by_newest_first(self):
        """Test that orders are sorted by created_at descending (newest first)"""
        # Create two orders
        files1 = {
            'pdf_file': ('first.pdf', io.BytesIO(self.pdf_content), 'application/pdf')
        }
        data1 = {
            'company_name': f'{self.test_prefix}_First AB',
            'contact_person': 'First Person',
            'email': 'first@test.se',
            'phone': '070-1111111',
            'address': 'Testgatan 1',
            'postal_code': '111 11',
            'city': 'Teststad'
        }
        response1 = requests.post(f"{BASE_URL}/api/catalog/order", files=files1, data=data1)
        order_id_1 = response1.json()["order_id"]
        
        files2 = {
            'pdf_file': ('second.pdf', io.BytesIO(self.pdf_content), 'application/pdf')
        }
        data2 = {
            'company_name': f'{self.test_prefix}_Second AB',
            'contact_person': 'Second Person',
            'email': 'second@test.se',
            'phone': '070-2222222',
            'address': 'Testgatan 2',
            'postal_code': '222 22',
            'city': 'Teststad'
        }
        response2 = requests.post(f"{BASE_URL}/api/catalog/order", files=files2, data=data2)
        order_id_2 = response2.json()["order_id"]
        
        # Get orders and verify sorting
        orders_response = requests.get(f"{BASE_URL}/api/catalog/orders")
        orders = orders_response.json()
        
        order_ids = [o["order_id"] for o in orders]
        
        if order_id_1 in order_ids and order_id_2 in order_ids:
            pos_1 = order_ids.index(order_id_1)
            pos_2 = order_ids.index(order_id_2)
            # Second order (newer) should appear before first order (older)
            assert pos_2 < pos_1, "Orders should be sorted by newest first"
    
    def test_get_orders_excludes_mongodb_id(self):
        """Test that _id field from MongoDB is excluded from response"""
        response = requests.get(f"{BASE_URL}/api/catalog/orders")
        orders = response.json()
        
        if len(orders) > 0:
            for order in orders:
                assert "_id" not in order, "MongoDB _id should be excluded from response"
    
    def test_order_contains_all_submitted_fields(self):
        """Test that created order contains all submitted fields"""
        files = {
            'pdf_file': ('full_fields.pdf', io.BytesIO(self.pdf_content), 'application/pdf')
        }
        data = {
            'company_name': f'{self.test_prefix}_FullFields AB',
            'contact_person': 'Full Person',
            'email': 'fullfields@test.se',
            'phone': '070-5555555',
            'address': 'Fullgatan 123',
            'postal_code': '555 55',
            'city': 'Fullstad',
            'quantity': '5',
            'message': 'Full test message with special chars: åäö'
        }
        
        create_response = requests.post(f"{BASE_URL}/api/catalog/order", files=files, data=data)
        order_id = create_response.json()["order_id"]
        
        # Get orders and find our order
        orders_response = requests.get(f"{BASE_URL}/api/catalog/orders")
        orders = orders_response.json()
        created_order = next((o for o in orders if o["order_id"] == order_id), None)
        
        assert created_order is not None
        assert created_order["company_name"] == data["company_name"]
        assert created_order["contact_person"] == data["contact_person"]
        assert created_order["email"] == data["email"]
        assert created_order["phone"] == data["phone"]
        assert created_order["address"] == data["address"]
        assert created_order["postal_code"] == data["postal_code"]
        assert created_order["city"] == data["city"]
        assert created_order["quantity"] == 5
        assert created_order["message"] == data["message"]
        assert created_order["status"] == "pending"
        assert "created_at" in created_order
