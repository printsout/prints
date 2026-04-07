"""Payment and checkout routes."""
from fastapi import APIRouter, HTTPException, Depends, Request
from database import db
from models import Order, OrderItem, PaymentTransaction, PaymentSettings, CheckoutRequest
from auth import get_current_user
from config import STRIPE_API_KEY
from email_service import send_order_confirmation, send_admin_order_notification
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["Payments"])


async def _build_order_items(cart: dict):
    total_amount = 0.0
    order_items = []
    for cart_item in cart["items"]:
        pid = cart_item["product_id"]
        product = await db.products.find_one({"product_id": pid}, {"_id": 0})
        # Virtual/B2B products (print-*, our-catalog-*) don't exist in DB
        item_price = cart_item.get("price") or (product["price"] if product else 0)
        item_name = cart_item.get("name") or (product["name"] if product else pid)
        if item_price <= 0 and not product:
            continue
        total_amount += item_price * cart_item["quantity"]
        order_items.append(OrderItem(
            product_id=pid,
            product_name=item_name,
            quantity=cart_item["quantity"],
            price=item_price,
            color=cart_item.get("color"),
            size=cart_item.get("size"),
            image=cart_item.get("image"),
            design_preview=cart_item.get("design_preview"),
            customization=cart_item.get("customization"),
        ))
    return total_amount, order_items


async def _create_stripe_session(request: Request, order: Order, checkout_data: CheckoutRequest, user: dict, total_amount: float):
    origin_url = request.headers.get("origin", str(request.base_url).rstrip("/"))
    host_url = str(request.base_url).rstrip("/")
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=f"{host_url}/api/webhook/stripe")

    # Map frontend payment method to Stripe payment method types
    method = checkout_data.payment_method
    if method == "klarna":
        payment_methods = ["klarna"]
    else:
        payment_methods = ["card"]

    checkout_request = CheckoutSessionRequest(
        amount=float(total_amount),
        currency="sek",
        success_url=f"{origin_url}/order-confirmation?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{origin_url}/kassa",
        payment_methods=payment_methods,
        metadata={
            "order_id": order.order_id,
            "email": checkout_data.email,
            "user_id": user["user_id"] if user else "guest"
        }
    )

    try:
        session = await stripe_checkout.create_checkout_session(checkout_request)
        order.stripe_session_id = session.session_id
        await db.orders.insert_one(order.model_dump())

        transaction = PaymentTransaction(
            session_id=session.session_id,
            user_id=user["user_id"] if user else None,
            email=checkout_data.email,
            amount=total_amount,
            currency="sek",
            status="pending",
            payment_status="initiated",
            metadata={"order_id": order.order_id}
        )
        await db.payment_transactions.insert_one(transaction.model_dump())

        return {"checkout_url": session.url, "session_id": session.session_id, "order_id": order.order_id}
    except Exception as e:
        logger.error(f"Stripe checkout error: {str(e)}")
        raise HTTPException(status_code=500, detail="Kunde inte skapa betalningssession")


@router.post("/checkout")
async def create_checkout(request: Request, checkout_data: CheckoutRequest, user: dict = Depends(get_current_user)):
    cart = await db.carts.find_one({"session_id": checkout_data.cart_session_id}, {"_id": 0})
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=400, detail="Varukorgen är tom")

    total_amount, order_items = await _build_order_items(cart)
    if total_amount <= 0:
        raise HTTPException(status_code=400, detail="Ogiltig totalsumma")

    order = Order(
        user_id=user["user_id"] if user else None,
        email=checkout_data.email,
        items=[item.model_dump() for item in order_items],
        total_amount=total_amount,
        shipping_address=checkout_data.shipping_address
    )

    return await _create_stripe_session(request, order, checkout_data, user, total_amount)


@router.get("/status/{session_id}")
async def get_payment_status(session_id: str, request: Request):
    host_url = str(request.base_url).rstrip("/")
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=f"{host_url}/api/webhook/stripe")

    try:
        status = await stripe_checkout.get_checkout_status(session_id)
        new_status = "completed" if status.payment_status == "paid" else status.payment_status

        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"status": new_status, "payment_status": status.payment_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )

        if status.payment_status == "paid":
            order = await db.orders.find_one({"stripe_session_id": session_id}, {"_id": 0})
            if order and order["payment_status"] != "paid":
                await db.orders.update_one(
                    {"stripe_session_id": session_id},
                    {"$set": {"status": "confirmed", "payment_status": "paid"}}
                )
                await send_order_confirmation(order)
                await send_admin_order_notification(order)

        return {"status": status.status, "payment_status": status.payment_status, "amount_total": status.amount_total, "currency": status.currency}
    except Exception as e:
        logger.error(f"Payment status error: {str(e)}")
        raise HTTPException(status_code=500, detail="Kunde inte hämta betalningsstatus")


async def handle_stripe_webhook(request: Request):
    """Handle Stripe webhook - called from server.py"""
    body = await request.body()
    signature = request.headers.get("Stripe-Signature", "")
    host_url = str(request.base_url).rstrip("/")
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=f"{host_url}/api/webhook/stripe")

    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        if webhook_response.payment_status == "paid":
            await db.orders.update_one(
                {"stripe_session_id": webhook_response.session_id},
                {"$set": {"status": "confirmed", "payment_status": "paid"}}
            )
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {"$set": {"status": "completed", "payment_status": "paid"}}
            )
            order = await db.orders.find_one({"stripe_session_id": webhook_response.session_id}, {"_id": 0})
            if order:
                await send_order_confirmation(order)
                await send_admin_order_notification(order)
        return {"received": True}
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        return {"received": True, "error": str(e)}


async def get_public_shipping_settings():
    """Public endpoint for shipping configuration."""
    settings = await db.settings.find_one({"type": "payment_settings"}, {"_id": 0})
    if not settings:
        defaults = PaymentSettings()
        return {
            "shipping_enabled": defaults.shipping_enabled, "shipping_cost": defaults.shipping_cost,
            "free_shipping_threshold": defaults.free_shipping_threshold,
            "discount_enabled": defaults.discount_enabled, "discount_percent": defaults.discount_percent,
            "tax_enabled": defaults.tax_enabled, "tax_rate": defaults.tax_rate,
        }
    return {
        "shipping_enabled": settings.get("shipping_enabled", True),
        "shipping_cost": settings.get("shipping_cost", 49),
        "free_shipping_threshold": settings.get("free_shipping_threshold", 500),
        "discount_enabled": settings.get("discount_enabled", False),
        "discount_percent": settings.get("discount_percent", 0),
        "tax_enabled": settings.get("tax_enabled", True),
        "tax_rate": settings.get("tax_rate", 25),
    }
