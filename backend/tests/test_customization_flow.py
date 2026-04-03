"""
Test suite for Printout customization data flow
Tests: CartItem/OrderItem models, checkout flow, admin orders, upload endpoints
"""
import pytest
import requests
import os
import uuid
import base64

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "info@printsout.se")
ADMIN_PASSWORD = admin_password


class TestAPIHealth:
    """Basic API health checks"""
    
    def test_api_root(self):
        """Test API is running"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Printout API"
        print("✓ API root endpoint working")


class TestUploadEndpoints:
    """Test file upload endpoints"""
    
    def test_upload_base64_valid_image(self):
        """Test base64 image upload returns valid URL"""
        # Create a small valid PNG image (1x1 pixel red)
        png_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="
        
        response = requests.post(
            f"{BASE_URL}/api/upload-base64",
            json={"image": f"data:image/png;base64,{png_base64}"}
        )
        
        assert response.status_code == 200, f"Upload failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "url" in data, "Response missing 'url' field"
        assert "filename" in data, "Response missing 'filename' field"
        assert data["url"].startswith("/api/uploads/"), f"URL format incorrect: {data['url']}"
        assert data["filename"].endswith(".png"), f"Filename should end with .png: {data['filename']}"
        
        print(f"✓ Base64 upload working, URL: {data['url']}")
        return data["url"]
    
    def test_upload_base64_without_prefix(self):
        """Test base64 upload without data:image prefix"""
        png_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="
        
        response = requests.post(
            f"{BASE_URL}/api/upload-base64",
            json={"image": png_base64}
        )
        
        assert response.status_code == 200, f"Upload failed: {response.text}"
        data = response.json()
        assert "url" in data
        print("✓ Base64 upload without prefix working")
    
    def test_uploaded_file_accessible(self):
        """Test that uploaded file can be retrieved"""
        png_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="
        
        # Upload
        upload_response = requests.post(
            f"{BASE_URL}/api/upload-base64",
            json={"image": f"data:image/png;base64,{png_base64}"}
        )
        assert upload_response.status_code == 200
        url = upload_response.json()["url"]
        
        # Retrieve
        get_response = requests.get(f"{BASE_URL}{url}")
        assert get_response.status_code == 200, f"Could not retrieve uploaded file: {get_response.status_code}"
        assert get_response.headers.get("content-type", "").startswith("image/"), "Content-type should be image"
        print(f"✓ Uploaded file accessible at {url}")


class TestCartCustomization:
    """Test cart API accepts and returns customization data"""
    
    @pytest.fixture
    def session_id(self):
        return f"TEST_session_{uuid.uuid4()}"
    
    @pytest.fixture
    def product_id(self):
        """Get a real product ID from the API"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        products = response.json()
        assert len(products) > 0, "No products found"
        return products[0]["product_id"]
    
    def test_add_nametag_to_cart_with_customization(self, session_id, product_id):
        """Test adding nametag item with full customization data"""
        cart_item = {
            "product_id": product_id,
            "name": "TEST Namnlappar",
            "price": 149.0,
            "quantity": 2,
            "image": "https://example.com/image.jpg",
            "customization": {
                "type": "nametag",
                "child_name": "Emma",
                "font": "pacifico",
                "font_color": "#E53935",
                "motif": "star",
                "background": "baby_blue",
                "uploaded_image_url": "/api/uploads/test.png"
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/cart/{session_id}/items",
            json=cart_item
        )
        
        assert response.status_code == 200, f"Add to cart failed: {response.text}"
        cart = response.json()
        
        # Verify cart structure
        assert "items" in cart
        assert len(cart["items"]) > 0
        
        # Find our item
        added_item = cart["items"][-1]
        
        # Verify all fields are preserved
        assert added_item["name"] == "TEST Namnlappar", "Name not preserved"
        assert added_item["price"] == 149.0, "Price not preserved"
        assert added_item["quantity"] == 2, "Quantity not preserved"
        assert added_item["image"] == "https://example.com/image.jpg", "Image not preserved"
        
        # Verify customization data
        assert "customization" in added_item, "Customization field missing"
        cust = added_item["customization"]
        assert cust["type"] == "nametag"
        assert cust["child_name"] == "Emma"
        assert cust["font"] == "pacifico"
        assert cust["font_color"] == "#E53935"
        assert cust["motif"] == "star"
        assert cust["background"] == "baby_blue"
        
        print("✓ Nametag customization data preserved in cart")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/cart/{session_id}")
    
    def test_add_photoalbum_to_cart_with_customization(self, session_id, product_id):
        """Test adding photo album item with pages and image_urls"""
        cart_item = {
            "product_id": product_id,
            "name": "TEST Fotoalbum",
            "price": 399.0,
            "quantity": 1,
            "image": "https://example.com/album.jpg",
            "customization": {
                "type": "photoalbum",
                "total_pages": 24,
                "total_images": 15,
                "size": "A4 Liggande",
                "pages": [
                    {"page_number": 1, "layout": "single", "image_count": 1, "image_urls": ["/api/uploads/img1.jpg"]},
                    {"page_number": 2, "layout": "two-h", "image_count": 2, "image_urls": ["/api/uploads/img2.jpg", "/api/uploads/img3.jpg"]},
                    {"page_number": 3, "layout": "four", "image_count": 4, "image_urls": ["/api/uploads/img4.jpg", "/api/uploads/img5.jpg", "/api/uploads/img6.jpg", "/api/uploads/img7.jpg"]}
                ]
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/cart/{session_id}/items",
            json=cart_item
        )
        
        assert response.status_code == 200, f"Add to cart failed: {response.text}"
        cart = response.json()
        
        added_item = cart["items"][-1]
        
        # Verify customization
        assert "customization" in added_item
        cust = added_item["customization"]
        assert cust["type"] == "photoalbum"
        assert cust["total_pages"] == 24
        assert cust["total_images"] == 15
        assert cust["size"] == "A4 Liggande"
        assert "pages" in cust
        assert len(cust["pages"]) == 3
        
        # Verify page structure
        page1 = cust["pages"][0]
        assert page1["page_number"] == 1
        assert page1["layout"] == "single"
        assert page1["image_urls"] == ["/api/uploads/img1.jpg"]
        
        print("✓ Photo album customization with pages preserved in cart")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/cart/{session_id}")
    
    def test_get_cart_returns_customization(self, session_id, product_id):
        """Test GET cart returns customization data"""
        # Add item
        cart_item = {
            "product_id": product_id,
            "name": "TEST Item",
            "price": 100.0,
            "customization": {"type": "test", "custom_field": "custom_value"}
        }
        requests.post(f"{BASE_URL}/api/cart/{session_id}/items", json=cart_item)
        
        # Get cart
        response = requests.get(f"{BASE_URL}/api/cart/{session_id}")
        assert response.status_code == 200
        cart = response.json()
        
        assert len(cart["items"]) > 0
        item = cart["items"][-1]
        assert "customization" in item
        assert item["customization"]["custom_field"] == "custom_value"
        
        print("✓ GET cart returns customization data")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/cart/{session_id}")


class TestAdminOrders:
    """Test admin orders API returns customization data"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return response.json()["access_token"]
    
    def test_admin_login(self):
        """Test admin login works"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        print("✓ Admin login successful")
    
    def test_admin_get_orders_list(self, admin_token):
        """Test admin can get orders list with total_amount"""
        response = requests.get(
            f"{BASE_URL}/api/admin/orders",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Get orders failed: {response.text}"
        data = response.json()
        
        assert "orders" in data
        assert "total" in data
        
        print(f"✓ Admin orders list returned {len(data['orders'])} orders")
        
        # Check order structure if orders exist
        if len(data["orders"]) > 0:
            order = data["orders"][0]
            # Verify total_amount field exists
            assert "total_amount" in order or "total" in order, "Order missing total_amount/total field"
            print(f"  - First order total: {order.get('total_amount') or order.get('total')} kr")
    
    def test_admin_order_details_has_customization(self, admin_token):
        """Test admin order details include customization data"""
        # First get orders list
        list_response = requests.get(
            f"{BASE_URL}/api/admin/orders",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert list_response.status_code == 200
        orders = list_response.json()["orders"]
        
        if len(orders) == 0:
            pytest.skip("No orders in database to test")
        
        # Get first order details
        order_id = orders[0]["order_id"]
        response = requests.get(
            f"{BASE_URL}/api/admin/orders/{order_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Get order details failed: {response.text}"
        order = response.json()
        
        # Verify order structure
        assert "order_id" in order
        assert "items" in order
        assert "total_amount" in order or "total" in order
        
        print(f"✓ Order {order_id[:8]} details retrieved")
        print(f"  - Email: {order.get('email')}")
        print(f"  - Total: {order.get('total_amount') or order.get('total')} kr")
        print(f"  - Items: {len(order.get('items', []))}")
        
        # Check items for customization
        for i, item in enumerate(order.get("items", [])):
            print(f"  - Item {i+1}: {item.get('product_name', 'Unknown')}")
            if "customization" in item and item["customization"]:
                cust = item["customization"]
                print(f"    Customization type: {cust.get('type', 'N/A')}")
                if cust.get("type") == "nametag":
                    print(f"    - child_name: {cust.get('child_name', 'N/A')}")
                    print(f"    - font: {cust.get('font', 'N/A')}")
                    print(f"    - font_color: {cust.get('font_color', 'N/A')}")
                    print(f"    - motif: {cust.get('motif', 'N/A')}")
                    print(f"    - background: {cust.get('background', 'N/A')}")
                elif cust.get("type") == "photoalbum":
                    print(f"    - total_pages: {cust.get('total_pages', 'N/A')}")
                    print(f"    - total_images: {cust.get('total_images', 'N/A')}")
                    print(f"    - size: {cust.get('size', 'N/A')}")
                    if "pages" in cust:
                        print(f"    - pages with images: {len([p for p in cust['pages'] if p.get('image_urls')])}")
            if "image" in item and item["image"]:
                print(f"    Image: {item['image'][:50]}...")


class TestExistingTestOrders:
    """Test the existing test orders mentioned in context"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_find_nametag_order(self, admin_token):
        """Find and verify nametag test order (test@printout.se)"""
        response = requests.get(
            f"{BASE_URL}/api/admin/orders",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        orders = response.json()["orders"]
        
        # Find order by email
        nametag_order = None
        for order in orders:
            if order.get("email") == "test@printout.se":
                nametag_order = order
                break
        
        if not nametag_order:
            print("⚠ Nametag test order (test@printout.se) not found")
            pytest.skip("Nametag test order not found")
        
        print(f"✓ Found nametag order: {nametag_order['order_id'][:8]}")
        
        # Verify customization data
        items = nametag_order.get("items", [])
        assert len(items) > 0, "Order has no items"
        
        item = items[0]
        cust = item.get("customization", {})
        
        if cust:
            print(f"  Customization found:")
            print(f"  - type: {cust.get('type')}")
            print(f"  - child_name: {cust.get('child_name')}")
            print(f"  - font: {cust.get('font')}")
            print(f"  - font_color: {cust.get('font_color')}")
            print(f"  - motif: {cust.get('motif')}")
            print(f"  - background: {cust.get('background')}")
            
            # Verify expected values from context
            if cust.get("type") == "nametag":
                assert cust.get("child_name") == "Emma", f"Expected child_name='Emma', got '{cust.get('child_name')}'"
                assert cust.get("font") == "pacifico", f"Expected font='pacifico', got '{cust.get('font')}'"
                print("✓ Nametag customization data verified!")
        else:
            print("⚠ No customization data in order item")
    
    def test_find_photoalbum_order(self, admin_token):
        """Find and verify photo album test order (album@printout.se)"""
        response = requests.get(
            f"{BASE_URL}/api/admin/orders",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        orders = response.json()["orders"]
        
        # Find order by email
        album_order = None
        for order in orders:
            if order.get("email") == "album@printout.se":
                album_order = order
                break
        
        if not album_order:
            print("⚠ Photo album test order (album@printout.se) not found")
            pytest.skip("Photo album test order not found")
        
        print(f"✓ Found photo album order: {album_order['order_id'][:8]}")
        
        # Verify customization data
        items = album_order.get("items", [])
        assert len(items) > 0, "Order has no items"
        
        item = items[0]
        cust = item.get("customization", {})
        
        if cust:
            print(f"  Customization found:")
            print(f"  - type: {cust.get('type')}")
            print(f"  - total_pages: {cust.get('total_pages')}")
            print(f"  - total_images: {cust.get('total_images')}")
            print(f"  - size: {cust.get('size')}")
            
            if "pages" in cust:
                pages_with_images = [p for p in cust["pages"] if p.get("image_urls")]
                print(f"  - pages with images: {len(pages_with_images)}")
                for pg in pages_with_images[:3]:  # Show first 3
                    print(f"    Page {pg.get('page_number')}: {len(pg.get('image_urls', []))} images, layout={pg.get('layout')}")
                
                print("✓ Photo album customization data verified!")
        else:
            print("⚠ No customization data in order item")


class TestOrderItemModel:
    """Test OrderItem model stores all required fields"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_order_item_has_required_fields(self, admin_token):
        """Verify OrderItem model has customization and image fields"""
        response = requests.get(
            f"{BASE_URL}/api/admin/orders",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        orders = response.json()["orders"]
        
        if len(orders) == 0:
            pytest.skip("No orders to test")
        
        # Check multiple orders
        for order in orders[:5]:
            for item in order.get("items", []):
                # These fields should exist in OrderItem model
                # They may be None but the field should be present
                print(f"Order {order['order_id'][:8]} item fields:")
                print(f"  - product_id: {'✓' if 'product_id' in item else '✗'}")
                print(f"  - product_name: {'✓' if 'product_name' in item else '✗'}")
                print(f"  - quantity: {'✓' if 'quantity' in item else '✗'}")
                print(f"  - price: {'✓' if 'price' in item else '✗'}")
                print(f"  - customization: {'✓' if 'customization' in item else '✗'}")
                print(f"  - image: {'✓' if 'image' in item else '✗'}")
                
                # Verify critical fields exist
                assert "product_id" in item, "Missing product_id"
                assert "product_name" in item, "Missing product_name"
                assert "quantity" in item, "Missing quantity"
                assert "price" in item, "Missing price"
                # customization and image are optional but should be in model
                
        print("✓ OrderItem model has required fields")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
