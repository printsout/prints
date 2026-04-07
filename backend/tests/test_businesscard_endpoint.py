"""
Test suite for Business Card ordering endpoint
POST /api/catalog/order/businesscard - multipart form with card details
Tests: editor mode, pdf mode, validation, file uploads
"""
import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestBusinessCardEditorMode:
    """Tests for business card orders from editor (source=editor)"""

    def test_create_businesscard_order_editor_mode(self):
        """Create business card order with editor source and card details"""
        form_data = {
            'company_name': 'TEST_EditorCard AB',
            'contact_person': 'Anna Svensson',
            'email': 'anna@editorcard.se',
            'phone': '070-123 45 67',
            'address': 'Storgatan 1',
            'postal_code': '111 22',
            'city': 'Stockholm',
            'quantity': '100',
            'message': 'Test editor order',
            'source': 'editor',
            'card_name': 'Anna Svensson',
            'card_title': 'VD',
            'card_company': 'EditorCard AB',
            'card_phone': '070-123 45 67',
            'card_email': 'anna@editorcard.se',
            'card_website': 'www.editorcard.se',
            'card_address': 'Storgatan 1, Stockholm',
            'card_template': 'modern',
            'card_color': '#e76f51',
        }
        response = requests.post(f'{BASE_URL}/api/catalog/order/businesscard', data=form_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert 'order_id' in data
        assert data['message'] == 'Visitkortsbeställning mottagen'
        print(f"✓ Created editor mode business card order: {data['order_id']}")

    def test_create_businesscard_minimal_fields(self):
        """Create business card with only required fields"""
        form_data = {
            'company_name': 'TEST_MinimalCard AB',
            'contact_person': 'Erik Eriksson',
            'email': 'erik@minimal.se',
            'phone': '070-111 22 33',
            'source': 'editor',
            'card_name': 'Erik Eriksson',
        }
        response = requests.post(f'{BASE_URL}/api/catalog/order/businesscard', data=form_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert 'order_id' in data
        print(f"✓ Created minimal business card order: {data['order_id']}")

    def test_businesscard_with_logo_upload(self):
        """Create business card with logo file upload"""
        form_data = {
            'company_name': 'TEST_LogoCard AB',
            'contact_person': 'Lisa Larsson',
            'email': 'lisa@logocard.se',
            'phone': '070-222 33 44',
            'source': 'editor',
            'card_name': 'Lisa Larsson',
            'card_title': 'Designer',
        }
        # Create a simple PNG file (1x1 pixel)
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82'
        files = {
            'logo_file': ('logo.png', io.BytesIO(png_data), 'image/png')
        }
        response = requests.post(f'{BASE_URL}/api/catalog/order/businesscard', data=form_data, files=files)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert 'order_id' in data
        print(f"✓ Created business card with logo: {data['order_id']}")

    def test_businesscard_all_templates(self):
        """Test all three templates: classic, modern, minimal"""
        templates = ['classic', 'modern', 'minimal']
        for template in templates:
            form_data = {
                'company_name': f'TEST_Template_{template} AB',
                'contact_person': 'Test Person',
                'email': f'test@{template}.se',
                'phone': '070-000 00 00',
                'source': 'editor',
                'card_name': 'Test Person',
                'card_template': template,
            }
            response = requests.post(f'{BASE_URL}/api/catalog/order/businesscard', data=form_data)
            assert response.status_code == 200, f"Template {template} failed: {response.text}"
            print(f"✓ Template '{template}' accepted")

    def test_businesscard_all_colors(self):
        """Test various accent colors"""
        colors = ['#2a9d8f', '#264653', '#e76f51', '#e63946', '#457b9d', '#6d6875', '#1d3557', '#000000']
        for color in colors:
            form_data = {
                'company_name': f'TEST_Color_{color.replace("#", "")} AB',
                'contact_person': 'Color Test',
                'email': f'color@test.se',
                'phone': '070-000 00 00',
                'source': 'editor',
                'card_name': 'Color Test',
                'card_color': color,
            }
            response = requests.post(f'{BASE_URL}/api/catalog/order/businesscard', data=form_data)
            assert response.status_code == 200, f"Color {color} failed: {response.text}"
        print(f"✓ All {len(colors)} colors accepted")


class TestBusinessCardPdfMode:
    """Tests for business card orders from PDF upload (source=pdf)"""

    def test_create_businesscard_pdf_mode_with_file(self):
        """Create business card order with PDF source and PDF file"""
        form_data = {
            'company_name': 'TEST_PdfCard AB',
            'contact_person': 'Peter Pettersson',
            'email': 'peter@pdfcard.se',
            'phone': '070-333 44 55',
            'address': 'Kungsgatan 10',
            'postal_code': '222 33',
            'city': 'Göteborg',
            'quantity': '250',
            'source': 'pdf',
        }
        # Create a minimal valid PDF
        pdf_content = b'%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF'
        files = {
            'pdf_file': ('visitkort.pdf', io.BytesIO(pdf_content), 'application/pdf')
        }
        response = requests.post(f'{BASE_URL}/api/catalog/order/businesscard', data=form_data, files=files)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert 'order_id' in data
        print(f"✓ Created PDF mode business card order: {data['order_id']}")

    def test_pdf_mode_requires_pdf_file(self):
        """PDF mode without PDF file should fail"""
        form_data = {
            'company_name': 'TEST_NoPdf AB',
            'contact_person': 'No Pdf',
            'email': 'no@pdf.se',
            'phone': '070-444 55 66',
            'source': 'pdf',
        }
        response = requests.post(f'{BASE_URL}/api/catalog/order/businesscard', data=form_data)
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert 'PDF-fil krävs' in data.get('detail', ''), f"Expected 'PDF-fil krävs' error, got: {data}"
        print("✓ PDF mode correctly requires PDF file")

    def test_pdf_mode_rejects_non_pdf(self):
        """PDF mode should reject non-PDF files"""
        form_data = {
            'company_name': 'TEST_WrongFile AB',
            'contact_person': 'Wrong File',
            'email': 'wrong@file.se',
            'phone': '070-555 66 77',
            'source': 'pdf',
        }
        files = {
            'pdf_file': ('visitkort.txt', io.BytesIO(b'This is not a PDF'), 'text/plain')
        }
        response = requests.post(f'{BASE_URL}/api/catalog/order/businesscard', data=form_data, files=files)
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert 'PDF-filer' in data.get('detail', ''), f"Expected PDF error, got: {data}"
        print("✓ PDF mode correctly rejects non-PDF files")


class TestBusinessCardValidation:
    """Tests for validation and required fields"""

    def test_missing_company_name(self):
        """Missing company_name should fail"""
        form_data = {
            'contact_person': 'Test Person',
            'email': 'test@test.se',
            'phone': '070-000 00 00',
            'source': 'editor',
            'card_name': 'Test',
        }
        response = requests.post(f'{BASE_URL}/api/catalog/order/businesscard', data=form_data)
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
        print("✓ Missing company_name correctly rejected")

    def test_missing_email(self):
        """Missing email should fail"""
        form_data = {
            'company_name': 'TEST_NoEmail AB',
            'contact_person': 'Test Person',
            'phone': '070-000 00 00',
            'source': 'editor',
            'card_name': 'Test',
        }
        response = requests.post(f'{BASE_URL}/api/catalog/order/businesscard', data=form_data)
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
        print("✓ Missing email correctly rejected")

    def test_default_values(self):
        """Test default values for optional fields"""
        form_data = {
            'company_name': 'TEST_Defaults AB',
            'contact_person': 'Default Test',
            'email': 'default@test.se',
            'phone': '070-000 00 00',
            'source': 'editor',
            'card_name': 'Default Test',
        }
        response = requests.post(f'{BASE_URL}/api/catalog/order/businesscard', data=form_data)
        assert response.status_code == 200
        # Verify defaults by checking the order
        orders_response = requests.get(f'{BASE_URL}/api/catalog/orders')
        orders = orders_response.json()
        order = next((o for o in orders if o.get('company_name') == 'TEST_Defaults AB'), None)
        assert order is not None, "Order not found"
        assert order.get('quantity') == 1, f"Expected default quantity 1, got {order.get('quantity')}"
        assert order.get('card_details', {}).get('template') == 'classic', "Expected default template 'classic'"
        assert order.get('card_details', {}).get('color') == '#2a9d8f', "Expected default color '#2a9d8f'"
        print("✓ Default values correctly applied")


class TestBusinessCardOrderRetrieval:
    """Tests for retrieving business card orders"""

    def test_businesscard_orders_in_list(self):
        """Business card orders should appear in GET /api/catalog/orders"""
        response = requests.get(f'{BASE_URL}/api/catalog/orders')
        assert response.status_code == 200
        orders = response.json()
        businesscard_orders = [o for o in orders if o.get('order_type') == 'businesscard']
        assert len(businesscard_orders) > 0, "No business card orders found"
        print(f"✓ Found {len(businesscard_orders)} business card orders")

    def test_businesscard_order_has_card_details(self):
        """Business card orders should have card_details field"""
        response = requests.get(f'{BASE_URL}/api/catalog/orders')
        orders = response.json()
        businesscard_orders = [o for o in orders if o.get('order_type') == 'businesscard']
        for order in businesscard_orders[:3]:  # Check first 3
            assert 'card_details' in order, f"Order {order.get('order_id')} missing card_details"
            card_details = order['card_details']
            assert 'name' in card_details, "card_details missing 'name'"
            assert 'template' in card_details, "card_details missing 'template'"
            assert 'color' in card_details, "card_details missing 'color'"
        print("✓ Business card orders have card_details with name, template, color")

    def test_businesscard_order_has_source_field(self):
        """Business card orders should have source field (editor or pdf)"""
        response = requests.get(f'{BASE_URL}/api/catalog/orders')
        orders = response.json()
        businesscard_orders = [o for o in orders if o.get('order_type') == 'businesscard']
        for order in businesscard_orders[:3]:
            assert 'source' in order, f"Order {order.get('order_id')} missing source"
            assert order['source'] in ['editor', 'pdf'], f"Invalid source: {order['source']}"
        print("✓ Business card orders have valid source field")

    def test_pdf_businesscard_has_pdf_url(self):
        """PDF mode business card orders should have pdf_url"""
        response = requests.get(f'{BASE_URL}/api/catalog/orders')
        orders = response.json()
        pdf_businesscard_orders = [o for o in orders if o.get('order_type') == 'businesscard' and o.get('source') == 'pdf']
        if pdf_businesscard_orders:
            for order in pdf_businesscard_orders[:2]:
                assert order.get('pdf_url'), f"PDF order {order.get('order_id')} missing pdf_url"
            print(f"✓ PDF business card orders have pdf_url")
        else:
            print("⚠ No PDF mode business card orders found to verify")


class TestAllThreeEndpoints:
    """Verify all 3 catalog endpoints still work"""

    def test_our_catalog_endpoint_works(self):
        """POST /api/catalog/order/our-catalog should work"""
        data = {
            'company_name': 'TEST_OurCatalog AB',
            'contact_person': 'Test Person',
            'email': 'test@ourcatalog.se',
            'phone': '070-000 00 00',
            'catalog_type': 'digital',
        }
        response = requests.post(f'{BASE_URL}/api/catalog/order/our-catalog', json=data)
        assert response.status_code == 200, f"our-catalog failed: {response.text}"
        print("✓ POST /api/catalog/order/our-catalog works")

    def test_print_endpoint_works(self):
        """POST /api/catalog/order/print should work"""
        form_data = {
            'company_name': 'TEST_Print AB',
            'contact_person': 'Test Person',
            'email': 'test@print.se',
            'phone': '070-000 00 00',
        }
        pdf_content = b'%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF'
        files = {
            'pdf_file': ('catalog.pdf', io.BytesIO(pdf_content), 'application/pdf')
        }
        response = requests.post(f'{BASE_URL}/api/catalog/order/print', data=form_data, files=files)
        assert response.status_code == 200, f"print failed: {response.text}"
        print("✓ POST /api/catalog/order/print works")

    def test_businesscard_endpoint_works(self):
        """POST /api/catalog/order/businesscard should work"""
        form_data = {
            'company_name': 'TEST_Businesscard AB',
            'contact_person': 'Test Person',
            'email': 'test@businesscard.se',
            'phone': '070-000 00 00',
            'source': 'editor',
            'card_name': 'Test Person',
        }
        response = requests.post(f'{BASE_URL}/api/catalog/order/businesscard', data=form_data)
        assert response.status_code == 200, f"businesscard failed: {response.text}"
        print("✓ POST /api/catalog/order/businesscard works")

    def test_get_orders_returns_all_types(self):
        """GET /api/catalog/orders should return all order types"""
        response = requests.get(f'{BASE_URL}/api/catalog/orders')
        assert response.status_code == 200
        orders = response.json()
        order_types = set(o.get('order_type') for o in orders)
        assert 'our_catalog' in order_types, "Missing our_catalog orders"
        assert 'print' in order_types, "Missing print orders"
        assert 'businesscard' in order_types, "Missing businesscard orders"
        print(f"✓ GET /api/catalog/orders returns all 3 types: {order_types}")
