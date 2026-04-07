"""
Test suite for the two-tab B2B Catalog ordering feature:
- Tab 1: "Vår produktkatalog" - POST /api/catalog/order/our-catalog (JSON)
- Tab 2: "Skriv ut er katalog" - POST /api/catalog/order/print (multipart with PDF)
- GET /api/catalog/orders - returns all orders with order_type field
"""
import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestOurCatalogEndpoint:
    """Tests for POST /api/catalog/order/our-catalog (JSON body)"""
    
    def test_create_digital_catalog_order(self):
        """Digital catalog order with minimal required fields"""
        response = requests.post(f"{BASE_URL}/api/catalog/order/our-catalog", json={
            "company_name": "TEST_Digital AB",
            "contact_person": "Anna Andersson",
            "email": "anna@digital.se",
            "phone": "070-1111111",
            "catalog_type": "digital"
        })
        assert response.status_code == 200
        data = response.json()
        assert "order_id" in data
        assert data["message"] == "Beställning mottagen"
    
    def test_create_physical_catalog_order_with_address(self):
        """Physical catalog order requires address fields"""
        response = requests.post(f"{BASE_URL}/api/catalog/order/our-catalog", json={
            "company_name": "TEST_Physical AB",
            "contact_person": "Erik Eriksson",
            "email": "erik@physical.se",
            "phone": "070-2222222",
            "catalog_type": "physical",
            "address": "Storgatan 1",
            "postal_code": "123 45",
            "city": "Stockholm",
            "quantity": 3,
            "message": "Please send quickly"
        })
        assert response.status_code == 200
        data = response.json()
        assert "order_id" in data
    
    def test_invalid_catalog_type_rejected(self):
        """Invalid catalog_type should return 400"""
        response = requests.post(f"{BASE_URL}/api/catalog/order/our-catalog", json={
            "company_name": "TEST_Invalid",
            "contact_person": "Test",
            "email": "test@test.se",
            "phone": "070-0000000",
            "catalog_type": "invalid_type"
        })
        assert response.status_code == 400
        assert "Ogiltig katalogtyp" in response.json().get("detail", "")
    
    def test_missing_required_field_company_name(self):
        """Missing company_name should return 422"""
        response = requests.post(f"{BASE_URL}/api/catalog/order/our-catalog", json={
            "contact_person": "Test",
            "email": "test@test.se",
            "phone": "070-0000000",
            "catalog_type": "digital"
        })
        assert response.status_code == 422
    
    def test_missing_required_field_email(self):
        """Missing email should return 422"""
        response = requests.post(f"{BASE_URL}/api/catalog/order/our-catalog", json={
            "company_name": "TEST_NoEmail",
            "contact_person": "Test",
            "phone": "070-0000000",
            "catalog_type": "digital"
        })
        assert response.status_code == 422
    
    def test_invalid_email_format(self):
        """Invalid email format should return 422"""
        response = requests.post(f"{BASE_URL}/api/catalog/order/our-catalog", json={
            "company_name": "TEST_BadEmail",
            "contact_person": "Test",
            "email": "not-an-email",
            "phone": "070-0000000",
            "catalog_type": "digital"
        })
        assert response.status_code == 422
    
    def test_default_quantity_is_one(self):
        """Quantity defaults to 1 when not provided"""
        response = requests.post(f"{BASE_URL}/api/catalog/order/our-catalog", json={
            "company_name": "TEST_DefaultQty",
            "contact_person": "Test",
            "email": "qty@test.se",
            "phone": "070-0000000",
            "catalog_type": "digital"
        })
        assert response.status_code == 200
        order_id = response.json()["order_id"]
        
        # Verify in orders list
        orders_response = requests.get(f"{BASE_URL}/api/catalog/orders")
        orders = orders_response.json()
        order = next((o for o in orders if o.get("order_id") == order_id), None)
        assert order is not None
        assert order.get("quantity") == 1


class TestPrintCatalogEndpoint:
    """Tests for POST /api/catalog/order/print (multipart form with PDF)"""
    
    def test_create_print_order_with_pdf(self):
        """Print order with PDF file upload"""
        pdf_content = b"%PDF-1.4 test content"
        files = {"pdf_file": ("test_catalog.pdf", io.BytesIO(pdf_content), "application/pdf")}
        data = {
            "company_name": "TEST_Print AB",
            "contact_person": "Lisa Larsson",
            "email": "lisa@print.se",
            "phone": "070-3333333",
            "address": "Printvägen 5",
            "postal_code": "543 21",
            "city": "Göteborg",
            "quantity": "10",
            "message": "Print my catalog"
        }
        response = requests.post(f"{BASE_URL}/api/catalog/order/print", files=files, data=data)
        assert response.status_code == 200
        result = response.json()
        assert "order_id" in result
        assert result["message"] == "Beställning mottagen"
    
    def test_print_order_minimal_fields(self):
        """Print order with only required fields"""
        pdf_content = b"%PDF-1.4 minimal"
        files = {"pdf_file": ("minimal.pdf", io.BytesIO(pdf_content), "application/pdf")}
        data = {
            "company_name": "TEST_Minimal Print",
            "contact_person": "Min Person",
            "email": "min@print.se",
            "phone": "070-4444444"
        }
        response = requests.post(f"{BASE_URL}/api/catalog/order/print", files=files, data=data)
        assert response.status_code == 200
    
    def test_reject_non_pdf_file(self):
        """Non-PDF file should be rejected with 400"""
        txt_content = b"This is not a PDF"
        files = {"pdf_file": ("test.txt", io.BytesIO(txt_content), "text/plain")}
        data = {
            "company_name": "TEST_NonPDF",
            "contact_person": "Test",
            "email": "test@test.se",
            "phone": "070-0000000"
        }
        response = requests.post(f"{BASE_URL}/api/catalog/order/print", files=files, data=data)
        assert response.status_code == 400
        assert "PDF" in response.json().get("detail", "")
    
    def test_reject_missing_pdf_file(self):
        """Missing PDF file should return 422"""
        data = {
            "company_name": "TEST_NoPDF",
            "contact_person": "Test",
            "email": "test@test.se",
            "phone": "070-0000000"
        }
        response = requests.post(f"{BASE_URL}/api/catalog/order/print", data=data)
        assert response.status_code == 422
    
    def test_reject_missing_company_name(self):
        """Missing company_name should return 422"""
        pdf_content = b"%PDF-1.4 test"
        files = {"pdf_file": ("test.pdf", io.BytesIO(pdf_content), "application/pdf")}
        data = {
            "contact_person": "Test",
            "email": "test@test.se",
            "phone": "070-0000000"
        }
        response = requests.post(f"{BASE_URL}/api/catalog/order/print", files=files, data=data)
        assert response.status_code == 422


class TestGetCatalogOrders:
    """Tests for GET /api/catalog/orders"""
    
    def test_get_orders_returns_list(self):
        """GET /api/catalog/orders returns a list"""
        response = requests.get(f"{BASE_URL}/api/catalog/orders")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_orders_have_order_type_field(self):
        """All orders should have order_type field (our_catalog or print)"""
        response = requests.get(f"{BASE_URL}/api/catalog/orders")
        orders = response.json()
        for order in orders[:10]:  # Check first 10
            assert "order_type" in order
            assert order["order_type"] in ("our_catalog", "print")
    
    def test_our_catalog_orders_have_catalog_type(self):
        """our_catalog orders should have catalog_type (physical/digital)"""
        response = requests.get(f"{BASE_URL}/api/catalog/orders")
        orders = response.json()
        our_catalog_orders = [o for o in orders if o.get("order_type") == "our_catalog"]
        for order in our_catalog_orders[:5]:
            assert "catalog_type" in order
            assert order["catalog_type"] in ("physical", "digital")
    
    def test_print_orders_have_pdf_url(self):
        """print orders should have pdf_url and original_filename"""
        response = requests.get(f"{BASE_URL}/api/catalog/orders")
        orders = response.json()
        print_orders = [o for o in orders if o.get("order_type") == "print"]
        for order in print_orders[:5]:
            assert "pdf_url" in order
            assert "original_filename" in order
    
    def test_orders_sorted_by_newest_first(self):
        """Orders should be sorted by created_at descending"""
        response = requests.get(f"{BASE_URL}/api/catalog/orders")
        orders = response.json()
        if len(orders) >= 2:
            for i in range(len(orders) - 1):
                assert orders[i]["created_at"] >= orders[i + 1]["created_at"]
    
    def test_orders_exclude_mongodb_id(self):
        """Orders should not contain MongoDB _id field"""
        response = requests.get(f"{BASE_URL}/api/catalog/orders")
        orders = response.json()
        for order in orders[:10]:
            assert "_id" not in order
    
    def test_pdf_file_accessible(self):
        """PDF files should be accessible at pdf_url"""
        response = requests.get(f"{BASE_URL}/api/catalog/orders")
        orders = response.json()
        print_orders = [o for o in orders if o.get("pdf_url")]
        if print_orders:
            pdf_url = print_orders[0]["pdf_url"]
            pdf_response = requests.get(f"{BASE_URL}{pdf_url}")
            assert pdf_response.status_code == 200


class TestOrderDataIntegrity:
    """Tests to verify data is correctly persisted"""
    
    def test_our_catalog_order_data_persisted(self):
        """Verify our_catalog order data is correctly saved and retrievable"""
        test_data = {
            "company_name": "TEST_Verify OurCatalog",
            "contact_person": "Verify Person",
            "email": "verify@ourcatalog.se",
            "phone": "070-5555555",
            "catalog_type": "physical",
            "address": "Verifyvägen 1",
            "postal_code": "111 11",
            "city": "Verifystad",
            "quantity": 2,
            "message": "Verify message"
        }
        
        # Create order
        create_response = requests.post(f"{BASE_URL}/api/catalog/order/our-catalog", json=test_data)
        assert create_response.status_code == 200
        order_id = create_response.json()["order_id"]
        
        # Verify in orders list
        orders_response = requests.get(f"{BASE_URL}/api/catalog/orders")
        orders = orders_response.json()
        order = next((o for o in orders if o.get("order_id") == order_id), None)
        
        assert order is not None
        assert order["company_name"] == test_data["company_name"]
        assert order["contact_person"] == test_data["contact_person"]
        assert order["email"] == test_data["email"]
        assert order["phone"] == test_data["phone"]
        assert order["catalog_type"] == test_data["catalog_type"]
        assert order["address"] == test_data["address"]
        assert order["postal_code"] == test_data["postal_code"]
        assert order["city"] == test_data["city"]
        assert order["quantity"] == test_data["quantity"]
        assert order["message"] == test_data["message"]
        assert order["order_type"] == "our_catalog"
        assert order["status"] == "pending"
    
    def test_print_order_data_persisted(self):
        """Verify print order data is correctly saved and retrievable"""
        pdf_content = b"%PDF-1.4 verify content"
        files = {"pdf_file": ("verify_catalog.pdf", io.BytesIO(pdf_content), "application/pdf")}
        test_data = {
            "company_name": "TEST_Verify Print",
            "contact_person": "Print Verify",
            "email": "verify@print.se",
            "phone": "070-6666666",
            "address": "Printverify 5",
            "postal_code": "222 22",
            "city": "Printstad",
            "quantity": "5",
            "message": "Verify print message"
        }
        
        # Create order
        create_response = requests.post(f"{BASE_URL}/api/catalog/order/print", files=files, data=test_data)
        assert create_response.status_code == 200
        order_id = create_response.json()["order_id"]
        
        # Verify in orders list
        orders_response = requests.get(f"{BASE_URL}/api/catalog/orders")
        orders = orders_response.json()
        order = next((o for o in orders if o.get("order_id") == order_id), None)
        
        assert order is not None
        assert order["company_name"] == test_data["company_name"]
        assert order["contact_person"] == test_data["contact_person"]
        assert order["email"] == test_data["email"]
        assert order["phone"] == test_data["phone"]
        assert order["address"] == test_data["address"]
        assert order["postal_code"] == test_data["postal_code"]
        assert order["city"] == test_data["city"]
        assert order["quantity"] == int(test_data["quantity"])
        assert order["message"] == test_data["message"]
        assert order["order_type"] == "print"
        assert order["status"] == "pending"
        assert order["original_filename"] == "verify_catalog.pdf"
        assert "pdf_url" in order
