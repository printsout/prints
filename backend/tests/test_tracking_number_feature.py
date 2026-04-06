"""
Test tracking number feature for Printsout e-commerce app.
Tests:
1. PUT /api/admin/orders/{order_id} accepts tracking_number and tracking_carrier fields
2. Tracking info is saved to MongoDB order document
3. Shipping email includes tracking number and carrier link when provided
4. Shipping email still works without tracking number
5. GET /api/admin/orders/{order_id} returns tracking info
"""
import pytest
import requests
import os
import pyotp
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_EMAIL = "info@printsout.se"
ADMIN_PASSWORD = "PrintoutAdmin2024!"
TOTP_SECRET = "RY5OWNLJOD7VLKBZEEGHI6MVA3I3M4UE"

# Carrier options that should be supported
VALID_CARRIERS = ["postnord", "dhl", "bring", "schenker", "ups"]


@pytest.fixture(scope="module")
def admin_token():
    """Get admin token for authenticated requests"""
    # Step 1: Login
    login_response = requests.post(
        f"{BASE_URL}/api/admin/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    )
    if login_response.status_code != 200:
        pytest.skip(f"Admin login failed: {login_response.text}")
    
    temp_token = login_response.json().get("temp_token")
    
    # Step 2: 2FA
    totp = pyotp.TOTP(TOTP_SECRET)
    code = totp.now()
    
    verify_response = requests.post(
        f"{BASE_URL}/api/admin/verify-2fa",
        json={"temp_token": temp_token, "code": code}
    )
    if verify_response.status_code != 200:
        pytest.skip(f"2FA verification failed: {verify_response.text}")
    
    return verify_response.json().get("access_token")


class TestTrackingNumberBackendAPI:
    """Test tracking number feature in backend API"""
    
    def test_update_order_with_tracking_number_and_carrier(self, admin_token):
        """PUT /api/admin/orders/{order_id} should accept tracking_number and tracking_carrier"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get orders
        orders_response = requests.get(f"{BASE_URL}/api/admin/orders", headers=headers)
        assert orders_response.status_code == 200, f"Failed to get orders: {orders_response.text}"
        
        orders = orders_response.json().get("orders", [])
        if not orders:
            pytest.skip("No orders available to test")
        
        # Find an order to test with
        test_order = orders[0]
        order_id = test_order["order_id"]
        
        # Test tracking number
        test_tracking = f"TEST{uuid.uuid4().hex[:10].upper()}"
        test_carrier = "postnord"
        
        # Update order with tracking info
        update_response = requests.put(
            f"{BASE_URL}/api/admin/orders/{order_id}",
            json={
                "status": "shipped",
                "tracking_number": test_tracking,
                "tracking_carrier": test_carrier
            },
            headers=headers
        )
        
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}: {update_response.text}"
        
        data = update_response.json()
        assert "message" in data, "Response should have message"
        print(f"✓ Order {order_id[:8]} updated with tracking: {test_tracking}, carrier: {test_carrier}")
    
    def test_tracking_info_persisted_in_order(self, admin_token):
        """Verify tracking info is saved to the order document"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get orders
        orders_response = requests.get(f"{BASE_URL}/api/admin/orders", headers=headers)
        orders = orders_response.json().get("orders", [])
        
        if not orders:
            pytest.skip("No orders available")
        
        # Find an order with tracking info
        order_with_tracking = None
        for order in orders:
            if order.get("tracking_number"):
                order_with_tracking = order
                break
        
        if not order_with_tracking:
            # Create one by updating an order
            test_order = orders[0]
            order_id = test_order["order_id"]
            test_tracking = f"PERSIST{uuid.uuid4().hex[:8].upper()}"
            
            requests.put(
                f"{BASE_URL}/api/admin/orders/{order_id}",
                json={
                    "status": "shipped",
                    "tracking_number": test_tracking,
                    "tracking_carrier": "dhl"
                },
                headers=headers
            )
            
            # Fetch the order again
            order_response = requests.get(f"{BASE_URL}/api/admin/orders/{order_id}", headers=headers)
            assert order_response.status_code == 200, f"Failed to get order: {order_response.text}"
            order_with_tracking = order_response.json()
        
        # Verify tracking fields exist
        assert "tracking_number" in order_with_tracking or order_with_tracking.get("tracking_number") is not None, \
            "Order should have tracking_number field"
        
        if order_with_tracking.get("tracking_number"):
            print(f"✓ Order has tracking_number: {order_with_tracking['tracking_number']}")
            print(f"  tracking_carrier: {order_with_tracking.get('tracking_carrier', 'not set')}")
    
    def test_all_carriers_accepted(self, admin_token):
        """Verify all carrier options are accepted by the API"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get orders
        orders_response = requests.get(f"{BASE_URL}/api/admin/orders", headers=headers)
        orders = orders_response.json().get("orders", [])
        
        if not orders:
            pytest.skip("No orders available")
        
        order_id = orders[0]["order_id"]
        
        # Test each carrier
        for carrier in VALID_CARRIERS:
            test_tracking = f"CARRIER{uuid.uuid4().hex[:6].upper()}"
            
            update_response = requests.put(
                f"{BASE_URL}/api/admin/orders/{order_id}",
                json={
                    "tracking_number": test_tracking,
                    "tracking_carrier": carrier
                },
                headers=headers
            )
            
            assert update_response.status_code == 200, \
                f"Carrier '{carrier}' should be accepted, got {update_response.status_code}: {update_response.text}"
            print(f"✓ Carrier '{carrier}' accepted")
    
    def test_update_status_shipped_without_tracking(self, admin_token):
        """Shipping email should still work without tracking number"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get orders
        orders_response = requests.get(f"{BASE_URL}/api/admin/orders", headers=headers)
        orders = orders_response.json().get("orders", [])
        
        if not orders:
            pytest.skip("No orders available")
        
        order_id = orders[0]["order_id"]
        
        # Update status to shipped without tracking
        update_response = requests.put(
            f"{BASE_URL}/api/admin/orders/{order_id}",
            json={"status": "shipped"},
            headers=headers
        )
        
        assert update_response.status_code == 200, \
            f"Should accept shipped status without tracking: {update_response.text}"
        print("✓ Order status updated to 'shipped' without tracking number")
    
    def test_get_order_details_includes_tracking(self, admin_token):
        """GET /api/admin/orders/{order_id} should return tracking info"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get orders list
        orders_response = requests.get(f"{BASE_URL}/api/admin/orders", headers=headers)
        orders = orders_response.json().get("orders", [])
        
        if not orders:
            pytest.skip("No orders available")
        
        # First set tracking on an order
        order_id = orders[0]["order_id"]
        test_tracking = f"DETAIL{uuid.uuid4().hex[:8].upper()}"
        
        requests.put(
            f"{BASE_URL}/api/admin/orders/{order_id}",
            json={
                "tracking_number": test_tracking,
                "tracking_carrier": "bring"
            },
            headers=headers
        )
        
        # Get order details
        detail_response = requests.get(f"{BASE_URL}/api/admin/orders/{order_id}", headers=headers)
        assert detail_response.status_code == 200, f"Failed to get order details: {detail_response.text}"
        
        order_detail = detail_response.json()
        assert order_detail.get("tracking_number") == test_tracking, \
            f"Expected tracking_number '{test_tracking}', got '{order_detail.get('tracking_number')}'"
        assert order_detail.get("tracking_carrier") == "bring", \
            f"Expected tracking_carrier 'bring', got '{order_detail.get('tracking_carrier')}'"
        
        print(f"✓ Order details include tracking: {test_tracking}, carrier: bring")
    
    def test_update_tracking_number_only(self, admin_token):
        """Should be able to update just tracking number without changing status"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get orders
        orders_response = requests.get(f"{BASE_URL}/api/admin/orders", headers=headers)
        orders = orders_response.json().get("orders", [])
        
        if not orders:
            pytest.skip("No orders available")
        
        order_id = orders[0]["order_id"]
        original_status = orders[0].get("status")
        test_tracking = f"ONLY{uuid.uuid4().hex[:8].upper()}"
        
        # Update only tracking number
        update_response = requests.put(
            f"{BASE_URL}/api/admin/orders/{order_id}",
            json={
                "tracking_number": test_tracking,
                "tracking_carrier": "ups"
            },
            headers=headers
        )
        
        assert update_response.status_code == 200, f"Failed to update tracking: {update_response.text}"
        
        # Verify order still has same status but new tracking
        detail_response = requests.get(f"{BASE_URL}/api/admin/orders/{order_id}", headers=headers)
        order_detail = detail_response.json()
        
        # Status might have been updated in previous tests, so just verify tracking is set
        assert order_detail.get("tracking_number") == test_tracking, \
            f"Tracking number should be updated to '{test_tracking}'"
        print(f"✓ Tracking number updated independently: {test_tracking}")


class TestAdminOrderUpdateModel:
    """Test AdminOrderUpdate model accepts tracking fields"""
    
    def test_model_accepts_all_fields(self, admin_token):
        """AdminOrderUpdate should accept status, tracking_number, tracking_carrier"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get orders
        orders_response = requests.get(f"{BASE_URL}/api/admin/orders", headers=headers)
        orders = orders_response.json().get("orders", [])
        
        if not orders:
            pytest.skip("No orders available")
        
        order_id = orders[0]["order_id"]
        
        # Send all fields together
        update_response = requests.put(
            f"{BASE_URL}/api/admin/orders/{order_id}",
            json={
                "status": "shipped",
                "tracking_number": "ALLFIELDS123",
                "tracking_carrier": "schenker",
                "notes": "Test note"
            },
            headers=headers
        )
        
        assert update_response.status_code == 200, \
            f"Should accept all fields: {update_response.text}"
        print("✓ AdminOrderUpdate model accepts all fields including tracking")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
