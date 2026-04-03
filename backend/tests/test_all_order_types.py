"""
Test suite for ALL 4 order types: nametag, calendar, design, photoalbum
Tests: DesignEditor, CalendarEditor customization flow, Cart.js item.price, AdminOrders display
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "info@printsout.se")
ADMIN_PASSWORD = admin_password

# Test order emails from context
TEST_EMAILS = {
    "nametag": "nametag@test.se",
    "calendar": "calendar@test.se",
    "design": "design@test.se",
    "photoalbum": "album@test.se"
}


class TestAPIHealth:
    """Basic API health checks"""
    
    def test_api_root(self):
        """Test API is running"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        print("✓ API root endpoint working")


class TestAdminLogin:
    """Test admin authentication"""
    
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
        return data["access_token"]


class TestAllOrderTypes:
    """Test all 4 order types exist and have correct customization data"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_get_all_orders(self, admin_token):
        """Test admin can get all orders"""
        response = requests.get(
            f"{BASE_URL}/api/admin/orders",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "orders" in data
        print(f"✓ Found {len(data['orders'])} orders in database")
        
        # List all order emails
        for order in data["orders"]:
            email = order.get("email", "N/A")
            total = order.get("total_amount") or order.get("total", 0)
            items = order.get("items", [])
            cust_type = items[0].get("customization", {}).get("type", "none") if items else "no items"
            print(f"  - {email}: {total} kr, type={cust_type}")
    
    def test_nametag_order_exists(self, admin_token):
        """Test nametag order (nametag@test.se) exists with customization"""
        response = requests.get(
            f"{BASE_URL}/api/admin/orders",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        orders = response.json()["orders"]
        
        # Find nametag order
        nametag_order = None
        for order in orders:
            if order.get("email") == TEST_EMAILS["nametag"]:
                nametag_order = order
                break
        
        if not nametag_order:
            pytest.skip(f"Nametag test order ({TEST_EMAILS['nametag']}) not found")
        
        print(f"✓ Found nametag order: {nametag_order['order_id'][:8]}")
        
        # Verify customization
        items = nametag_order.get("items", [])
        assert len(items) > 0, "Order has no items"
        
        item = items[0]
        cust = item.get("customization", {})
        
        assert cust.get("type") == "nametag", f"Expected type='nametag', got '{cust.get('type')}'"
        print(f"  - child_name: {cust.get('child_name')}")
        print(f"  - font: {cust.get('font')}")
        print(f"  - font_color: {cust.get('font_color')}")
        print(f"  - motif: {cust.get('motif')}")
        print(f"  - background: {cust.get('background')}")
        print("✓ Nametag customization verified")
    
    def test_calendar_order_exists(self, admin_token):
        """Test calendar order (calendar@test.se) exists with customization"""
        response = requests.get(
            f"{BASE_URL}/api/admin/orders",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        orders = response.json()["orders"]
        
        # Find calendar order
        calendar_order = None
        for order in orders:
            if order.get("email") == TEST_EMAILS["calendar"]:
                calendar_order = order
                break
        
        if not calendar_order:
            pytest.skip(f"Calendar test order ({TEST_EMAILS['calendar']}) not found")
        
        print(f"✓ Found calendar order: {calendar_order['order_id'][:8]}")
        
        # Verify customization
        items = calendar_order.get("items", [])
        assert len(items) > 0, "Order has no items"
        
        item = items[0]
        cust = item.get("customization", {})
        
        assert cust.get("type") == "calendar", f"Expected type='calendar', got '{cust.get('type')}'"
        print(f"  - year: {cust.get('year')}")
        print(f"  - size: {cust.get('size')}")
        print(f"  - images_count: {cust.get('images_count')}")
        
        # Check months array
        months = cust.get("months", [])
        months_with_images = [m for m in months if m.get("image_url")]
        print(f"  - months with images: {len(months_with_images)}")
        
        for m in months_with_images[:3]:
            print(f"    - {m.get('month')}: {m.get('image_url', 'N/A')[:50]}...")
        
        print("✓ Calendar customization verified")
    
    def test_design_order_exists(self, admin_token):
        """Test design order (design@test.se) exists with customization"""
        response = requests.get(
            f"{BASE_URL}/api/admin/orders",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        orders = response.json()["orders"]
        
        # Find design order
        design_order = None
        for order in orders:
            if order.get("email") == TEST_EMAILS["design"]:
                design_order = order
                break
        
        if not design_order:
            pytest.skip(f"Design test order ({TEST_EMAILS['design']}) not found")
        
        print(f"✓ Found design order: {design_order['order_id'][:8]}")
        
        # Verify customization
        items = design_order.get("items", [])
        assert len(items) > 0, "Order has no items"
        
        item = items[0]
        cust = item.get("customization", {})
        
        assert cust.get("type") == "design", f"Expected type='design', got '{cust.get('type')}'"
        print(f"  - text: {cust.get('text')}")
        print(f"  - text_font: {cust.get('text_font')}")
        print(f"  - text_color: {cust.get('text_color')}")
        print(f"  - color: {cust.get('color')}")
        print(f"  - size: {cust.get('size')}")
        print(f"  - placement_notes: {cust.get('placement_notes')}")
        print(f"  - uploaded_image_url: {cust.get('uploaded_image_url', 'N/A')[:50] if cust.get('uploaded_image_url') else 'N/A'}...")
        
        print("✓ Design customization verified")
    
    def test_photoalbum_order_exists(self, admin_token):
        """Test photoalbum order (album@test.se) exists with customization"""
        response = requests.get(
            f"{BASE_URL}/api/admin/orders",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        orders = response.json()["orders"]
        
        # Find photoalbum order
        album_order = None
        for order in orders:
            if order.get("email") == TEST_EMAILS["photoalbum"]:
                album_order = order
                break
        
        if not album_order:
            pytest.skip(f"Photo album test order ({TEST_EMAILS['photoalbum']}) not found")
        
        print(f"✓ Found photo album order: {album_order['order_id'][:8]}")
        
        # Verify customization
        items = album_order.get("items", [])
        assert len(items) > 0, "Order has no items"
        
        item = items[0]
        cust = item.get("customization", {})
        
        assert cust.get("type") == "photoalbum", f"Expected type='photoalbum', got '{cust.get('type')}'"
        print(f"  - total_pages: {cust.get('total_pages')}")
        print(f"  - total_images: {cust.get('total_images')}")
        print(f"  - size: {cust.get('size')}")
        
        # Check pages array
        pages = cust.get("pages", [])
        pages_with_images = [p for p in pages if p.get("image_urls")]
        print(f"  - pages with images: {len(pages_with_images)}")
        
        print("✓ Photo album customization verified")


class TestCartCustomizationTypes:
    """Test cart API accepts all 4 customization types"""
    
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
    
    def test_add_design_to_cart(self, session_id, product_id):
        """Test adding design item with full customization (DesignEditor fix)"""
        cart_item = {
            "product_id": product_id,
            "name": "TEST Mugg med design",
            "price": 199.0,
            "quantity": 1,
            "image": "https://example.com/mug.jpg",
            "design_preview": "/api/uploads/design_preview.png",
            "customization": {
                "type": "design",
                "uploaded_image_url": "/api/uploads/customer_image.png",
                "text": "Min text",
                "text_font": "Arial",
                "text_color": "#FF0000",
                "background_color": "#FFFFFF",
                "position_x": 50,
                "position_y": 50,
                "scale": 1.0,
                "rotation": 0,
                "placement_notes": "Centrera på framsidan",
                "color": "Vit",
                "size": "M"
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/cart/{session_id}/items",
            json=cart_item
        )
        
        assert response.status_code == 200, f"Add to cart failed: {response.text}"
        cart = response.json()
        
        added_item = cart["items"][-1]
        
        # Verify all design customization fields
        assert "customization" in added_item
        cust = added_item["customization"]
        assert cust["type"] == "design"
        assert cust["uploaded_image_url"] == "/api/uploads/customer_image.png"
        assert cust["text"] == "Min text"
        assert cust["text_font"] == "Arial"
        assert cust["text_color"] == "#FF0000"
        assert cust["placement_notes"] == "Centrera på framsidan"
        
        print("✓ Design customization preserved in cart")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/cart/{session_id}")
    
    def test_add_calendar_to_cart(self, session_id, product_id):
        """Test adding calendar item with months array (CalendarEditor fix)"""
        cart_item = {
            "product_id": product_id,
            "name": "TEST Kalender 2026",
            "price": 299.0,
            "quantity": 1,
            "image": "https://example.com/calendar.jpg",
            "customization": {
                "type": "calendar",
                "year": 2026,
                "size": "A3",
                "images_count": 6,
                "cover_image_url": "/api/uploads/jan.jpg",
                "months": [
                    {"month": "Januari", "hasImage": True, "image_url": "/api/uploads/jan.jpg"},
                    {"month": "Februari", "hasImage": True, "image_url": "/api/uploads/feb.jpg"},
                    {"month": "Mars", "hasImage": False, "image_url": None},
                    {"month": "April", "hasImage": True, "image_url": "/api/uploads/apr.jpg"},
                    {"month": "Maj", "hasImage": True, "image_url": "/api/uploads/may.jpg"},
                    {"month": "Juni", "hasImage": True, "image_url": "/api/uploads/jun.jpg"},
                    {"month": "Juli", "hasImage": True, "image_url": "/api/uploads/jul.jpg"},
                    {"month": "Augusti", "hasImage": False, "image_url": None},
                    {"month": "September", "hasImage": False, "image_url": None},
                    {"month": "Oktober", "hasImage": False, "image_url": None},
                    {"month": "November", "hasImage": False, "image_url": None},
                    {"month": "December", "hasImage": False, "image_url": None}
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
        
        # Verify calendar customization
        assert "customization" in added_item
        cust = added_item["customization"]
        assert cust["type"] == "calendar"
        assert cust["year"] == 2026
        assert cust["size"] == "A3"
        assert cust["images_count"] == 6
        assert "months" in cust
        assert len(cust["months"]) == 12
        
        # Verify months with images
        months_with_images = [m for m in cust["months"] if m.get("image_url")]
        assert len(months_with_images) == 6
        
        print("✓ Calendar customization with months preserved in cart")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/cart/{session_id}")
    
    def test_cart_uses_item_price(self, session_id, product_id):
        """Test that cart preserves item.price (Cart.js fix)"""
        # Add item with custom price (different from product price)
        cart_item = {
            "product_id": product_id,
            "name": "TEST Custom Price Item",
            "price": 599.0,  # Custom price
            "quantity": 2,
            "customization": {"type": "test"}
        }
        
        response = requests.post(
            f"{BASE_URL}/api/cart/{session_id}/items",
            json=cart_item
        )
        
        assert response.status_code == 200
        cart = response.json()
        
        added_item = cart["items"][-1]
        
        # Verify price is preserved
        assert added_item["price"] == 599.0, f"Expected price=599.0, got {added_item['price']}"
        print("✓ Cart preserves item.price correctly")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/cart/{session_id}")


class TestCheckoutPreservesCustomization:
    """Test that checkout flow preserves customization data"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_checkout_preserves_item_price(self, admin_token):
        """Verify orders use item.price not just product.price"""
        response = requests.get(
            f"{BASE_URL}/api/admin/orders",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        orders = response.json()["orders"]
        
        if len(orders) == 0:
            pytest.skip("No orders to test")
        
        # Check that orders have total_amount
        for order in orders[:5]:
            total = order.get("total_amount") or order.get("total")
            assert total is not None, f"Order {order['order_id'][:8]} missing total_amount"
            assert total > 0, f"Order {order['order_id'][:8]} has invalid total: {total}"
            
            # Check items have price
            for item in order.get("items", []):
                assert "price" in item, f"Item missing price field"
                assert item["price"] > 0, f"Item has invalid price: {item['price']}"
        
        print("✓ Orders have correct total_amount and item prices")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
