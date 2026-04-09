"""Admin routes: auth, CRUD, settings, content, discounts, reviews."""
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import FileResponse
from starlette.responses import StreamingResponse
from database import db
from models import (
    AdminLogin, AdminUserUpdate, AdminProductCreate, AdminOrderUpdate,
    Product, SiteSettings, PaymentSettings, Review, DiscountCode, ContentPage,
)
from auth import verify_admin_token, verify_password, sanitize_html
from config import ADMIN_EMAIL, ADMIN_PASSWORD_HASH, JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRATION_HOURS, SENDER_EMAIL
from email_service import send_shipping_notification, send_discount_emails
import jwt
import bcrypt
import pyotp
import qrcode
import io
import os
import base64
import uuid
import bleach
import logging
from pathlib import Path
from datetime import datetime, timezone, timedelta

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Admin"])

# Mutable admin password hash (can be updated at runtime)
_admin_password_hash = ADMIN_PASSWORD_HASH

def get_admin_password_hash():
    return _admin_password_hash

def set_admin_password_hash(new_hash: str):
    global _admin_password_hash
    _admin_password_hash = new_hash


# ─── Admin Auth ─────────────────────────────────────

@router.post("/login")
async def admin_login(request: Request, login_data: AdminLogin):
    if login_data.email != ADMIN_EMAIL or not verify_password(login_data.password, get_admin_password_hash()):
        raise HTTPException(status_code=401, detail="Felaktiga inloggningsuppgifter")

    admin_2fa = await db.admin_settings_2fa.find_one({"admin_email": ADMIN_EMAIL}, {"_id": 0})

    # If 2FA is enabled and set up, require it
    if admin_2fa and admin_2fa.get("totp_enabled") and admin_2fa.get("totp_secret"):
        temp_token = jwt.encode({
            "sub": "admin_2fa_pending", "email": ADMIN_EMAIL,
            "exp": datetime.now(timezone.utc) + timedelta(minutes=10)
        }, JWT_SECRET, algorithm=JWT_ALGORITHM)
        return {"requires_2fa": True, "needs_setup": False, "temp_token": temp_token}

    # No 2FA configured — log in directly
    token = jwt.encode({
        "sub": "admin", "email": ADMIN_EMAIL, "is_admin": True,
        "exp": datetime.now(timezone.utc) + timedelta(hours=8)
    }, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return {"token": token, "requires_2fa": False}

@router.post("/verify-2fa")
async def admin_verify_2fa(request: Request, data: dict):
    temp_token = data.get("temp_token")
    code = data.get("code", "")

    try:
        payload = jwt.decode(temp_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("sub") != "admin_2fa_pending":
            raise HTTPException(status_code=401, detail="Ogiltig token")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Koden har gått ut, logga in igen")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Ogiltig token")

    admin_2fa = await db.admin_settings_2fa.find_one({"admin_email": ADMIN_EMAIL}, {"_id": 0})
    if not admin_2fa or not admin_2fa.get("totp_secret"):
        raise HTTPException(status_code=400, detail="2FA är inte konfigurerat")

    totp = pyotp.TOTP(admin_2fa["totp_secret"])
    if not totp.verify(code, valid_window=2):
        raise HTTPException(status_code=401, detail="Felaktig verifieringskod")

    if not admin_2fa.get("totp_enabled"):
        await db.admin_settings_2fa.update_one({"admin_email": ADMIN_EMAIL}, {"$set": {"totp_enabled": True}})

    token = jwt.encode({
        "sub": "admin", "email": ADMIN_EMAIL, "is_admin": True,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }, JWT_SECRET, algorithm=JWT_ALGORITHM)

    await db.admin_logs.insert_one({"action": "login_2fa", "admin_email": ADMIN_EMAIL, "timestamp": datetime.now(timezone.utc).isoformat(), "ip": "system"})
    return {"access_token": token, "token_type": "bearer"}

@router.post("/setup-2fa")
async def admin_setup_2fa(admin=Depends(verify_admin_token)):
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    uri = totp.provisioning_uri(name=ADMIN_EMAIL, issuer_name="Printsout Admin")
    qr = qrcode.make(uri)
    buffer = io.BytesIO()
    qr.save(buffer, format="PNG")
    qr_base64 = base64.b64encode(buffer.getvalue()).decode()
    await db.admin_settings_2fa.update_one(
        {"admin_email": ADMIN_EMAIL},
        {"$set": {"admin_email": ADMIN_EMAIL, "totp_secret": secret, "totp_enabled": False}},
        upsert=True
    )
    return {"qr_code": f"data:image/png;base64,{qr_base64}", "secret": secret}

@router.post("/confirm-2fa")
async def admin_confirm_2fa(data: dict, admin=Depends(verify_admin_token)):
    code = data.get("code", "")
    admin_2fa = await db.admin_settings_2fa.find_one({"admin_email": ADMIN_EMAIL}, {"_id": 0})
    if not admin_2fa or not admin_2fa.get("totp_secret"):
        raise HTTPException(status_code=400, detail="Starta 2FA-installationen först")
    totp = pyotp.TOTP(admin_2fa["totp_secret"])
    if not totp.verify(code, valid_window=2):
        raise HTTPException(status_code=400, detail="Felaktig kod. Försök igen.")
    await db.admin_settings_2fa.update_one({"admin_email": ADMIN_EMAIL}, {"$set": {"totp_enabled": True}})
    return {"message": "2FA aktiverat"}

@router.post("/disable-2fa")
async def admin_disable_2fa(data: dict, admin=Depends(verify_admin_token)):
    code = data.get("code", "")
    admin_2fa = await db.admin_settings_2fa.find_one({"admin_email": ADMIN_EMAIL}, {"_id": 0})
    if not admin_2fa or not admin_2fa.get("totp_secret"):
        raise HTTPException(status_code=400, detail="2FA är inte aktiverat")
    totp = pyotp.TOTP(admin_2fa["totp_secret"])
    if not totp.verify(code, valid_window=2):
        raise HTTPException(status_code=400, detail="Felaktig kod")
    await db.admin_settings_2fa.update_one({"admin_email": ADMIN_EMAIL}, {"$set": {"totp_enabled": False, "totp_secret": None}})
    return {"message": "2FA inaktiverat"}

@router.get("/2fa-status")
async def admin_2fa_status(admin=Depends(verify_admin_token)):
    admin_2fa = await db.admin_settings_2fa.find_one({"admin_email": ADMIN_EMAIL}, {"_id": 0})
    return {"enabled": bool(admin_2fa and admin_2fa.get("totp_enabled"))}

@router.post("/forgot-password")
async def admin_forgot_password(request: Request, data: dict):
    email = data.get("email", "")
    if email != ADMIN_EMAIL:
        return {"message": "Om e-postadressen finns skickas en återställningskod"}
    reset_code = str(uuid.uuid4())[:8].upper()
    await db.admin_password_resets.delete_many({"admin_email": ADMIN_EMAIL})
    await db.admin_password_resets.insert_one({
        "admin_email": ADMIN_EMAIL, "reset_code": reset_code,
        "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat(), "used": False
    })
    logger.info(f"Admin password reset code: {reset_code}")
    return {"message": "Om e-postadressen finns skickas en återställningskod", "reset_code": reset_code}

@router.post("/reset-password")
async def admin_reset_password(request: Request, data: dict):
    code = data.get("code", "")
    new_password = data.get("new_password", "")
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Lösenordet måste vara minst 8 tecken")
    reset = await db.admin_password_resets.find_one({"admin_email": ADMIN_EMAIL, "reset_code": code, "used": False}, {"_id": 0})
    if not reset:
        raise HTTPException(status_code=400, detail="Ogiltig eller utgången kod")
    if datetime.now(timezone.utc).isoformat() > reset["expires_at"]:
        raise HTTPException(status_code=400, detail="Koden har gått ut")
    new_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    set_admin_password_hash(new_hash)
    await db.admin_settings_2fa.update_one({"admin_email": ADMIN_EMAIL}, {"$set": {"password_hash": new_hash}}, upsert=True)
    await db.admin_password_resets.update_one({"reset_code": code}, {"$set": {"used": True}})
    return {"message": "Lösenordet har ändrats"}


# ─── Dashboard ──────────────────────────────────────

@router.get("/stats")
async def get_admin_stats(admin=Depends(verify_admin_token)):
    total_users = await db.users.count_documents({})
    total_orders = await db.orders.count_documents({})
    total_products = await db.products.count_documents({})
    pipeline = [{"$match": {"payment_status": "completed"}}, {"$group": {"_id": None, "total_revenue": {"$sum": "$total_amount"}}}]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total_revenue"] if revenue_result else 0
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    recent_orders = await db.orders.count_documents({"created_at": {"$gte": week_ago}})
    pending_orders = await db.orders.count_documents({"status": {"$in": ["pending", "processing"]}})
    return {"total_users": total_users, "total_orders": total_orders, "total_products": total_products, "total_revenue": total_revenue, "recent_orders": recent_orders, "pending_orders": pending_orders}


# ─── Users ──────────────────────────────────────────

@router.get("/users")
async def get_all_users(admin=Depends(verify_admin_token), skip: int = 0, limit: int = 50):
    users = await db.users.find({}, {"password_hash": 0, "_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents({})
    return {"users": users, "total": total}

@router.get("/users/{user_id}")
async def get_user_details(user_id: str, admin=Depends(verify_admin_token)):
    user = await db.users.find_one({"user_id": user_id}, {"password_hash": 0, "_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Användare hittades inte")
    orders = await db.orders.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)
    designs = await db.designs.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)
    return {"user": user, "orders": orders, "designs": designs}

@router.put("/users/{user_id}")
async def update_user(user_id: str, update_data: AdminUserUpdate, admin=Depends(verify_admin_token)):
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="Inga uppdateringar angivna")
    result = await db.users.update_one({"user_id": user_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Användare hittades inte")
    await db.admin_logs.insert_one({"action": "update_user", "target_user_id": user_id, "changes": update_dict, "admin_email": admin.get("email"), "timestamp": datetime.now(timezone.utc).isoformat()})
    return {"message": "Användare uppdaterad"}

@router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin=Depends(verify_admin_token)):
    result = await db.users.delete_one({"user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Användare hittades inte")
    await db.admin_logs.insert_one({"action": "delete_user", "target_user_id": user_id, "admin_email": admin.get("email"), "timestamp": datetime.now(timezone.utc).isoformat()})
    return {"message": "Användare raderad"}


# ─── Orders ─────────────────────────────────────────

@router.get("/orders")
async def get_all_orders(admin=Depends(verify_admin_token), skip: int = 0, limit: int = 50, status: str = None):
    query = {}
    if status:
        query["status"] = status
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.orders.count_documents(query)
    return {"orders": orders, "total": total}

@router.get("/orders/{order_id}")
async def get_order_details(order_id: str, admin=Depends(verify_admin_token)):
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order hittades inte")
    return order

@router.put("/orders/{order_id}")
async def update_order(order_id: str, update_data: AdminOrderUpdate, admin=Depends(verify_admin_token)):
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.orders.update_one({"order_id": order_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order hittades inte")
    if update_data.status and update_data.status.lower() in ("skickad", "shipped"):
        order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
        if order and order.get("email"):
            await send_shipping_notification(order)
    await db.admin_logs.insert_one({"action": "update_order", "order_id": order_id, "changes": update_dict, "admin_email": admin.get("email"), "timestamp": datetime.now(timezone.utc).isoformat()})
    return {"message": "Order uppdaterad"}

@router.patch("/orders/{order_id}/mark")
async def toggle_order_marked(order_id: str, admin=Depends(verify_admin_token)):
    order = await db.orders.find_one({"order_id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order hittades inte")
    new_val = not order.get("marked", False)
    await db.orders.update_one({"order_id": order_id}, {"$set": {"marked": new_val}})
    return {"marked": new_val}


@router.delete("/orders/{order_id}")
async def delete_order(order_id: str, admin=Depends(verify_admin_token)):
    result = await db.orders.delete_one({"order_id": order_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Order hittades inte")
    await db.admin_logs.insert_one({"action": "delete_order", "order_id": order_id, "admin_email": admin.get("email"), "timestamp": datetime.now(timezone.utc).isoformat()})
    return {"message": "Order raderad"}

@router.get("/orders/{order_id}/nametag-pdf")
async def download_nametag_pdf(order_id: str, admin=Depends(verify_admin_token)):
    from nametag_pdf import generate_nametag_pdf
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order hittades inte")
    nametag_item = None
    for item in order.get("items", []):
        if item.get("customization", {}).get("type") == "nametag":
            nametag_item = item
            break
    if not nametag_item:
        raise HTTPException(status_code=400, detail="Ordern innehåller inga namnlappar")
    customization = nametag_item["customization"]
    output_dir = Path("/tmp/nametag_pdfs")
    output_dir.mkdir(exist_ok=True)
    output_path = str(output_dir / f"namnlappar_{order_id[:8]}.pdf")
    generate_nametag_pdf(customization, output_path)
    child_name = customization.get("child_name", "namnlapp")
    filename = f"namnlappar_{child_name}_{order_id[:8]}.pdf"
    return FileResponse(output_path, media_type="application/pdf", filename=filename, headers={"Content-Disposition": f'attachment; filename="{filename}"'})

@router.get("/orders/{order_id}/calendar-images")
async def download_calendar_images(order_id: str, admin=Depends(verify_admin_token)):
    """Download all calendar images as a ZIP file."""
    import zipfile
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order hittades inte")
    calendar_item = None
    for item in order.get("items", []):
        if item.get("customization", {}).get("type") == "calendar":
            calendar_item = item
            break
    if not calendar_item:
        raise HTTPException(status_code=400, detail="Ordern innehåller ingen kalender")

    customization = calendar_item["customization"]
    months = customization.get("months", [])
    uploads_dir = Path(os.path.dirname(__file__)).parent / "uploads"

    zip_path = Path("/tmp") / f"kalender_{order_id[:8]}.zip"
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        for m in months:
            img_url = m.get("image_url")
            if not img_url:
                continue
            filename = img_url.split("/")[-1]
            filepath = uploads_dir / filename
            if filepath.exists():
                month_name = m.get("month", "bild")
                ext = filename.rsplit(".", 1)[-1] if "." in filename else "jpg"
                zf.write(filepath, f"{month_name}.{ext}")

    if not zip_path.exists() or zip_path.stat().st_size < 22:
        raise HTTPException(status_code=404, detail="Inga kalenderbilder hittades på servern")

    return FileResponse(
        zip_path, media_type="application/zip",
        filename=f"kalenderbilder_{order_id[:8]}.zip",
        headers={"Content-Disposition": f'attachment; filename="kalenderbilder_{order_id[:8]}.zip"'}
    )


@router.get("/orders/{order_id}/catalog-pdf")
async def download_catalog_pdf(order_id: str, admin=Depends(verify_admin_token)):
    """Generate and download a PDF from a catalog design order."""
    from catalog_pdf import generate_catalog_pdf
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order hittades inte")
    catalog_item = None
    for item in order.get("items", []):
        if item.get("customization", {}).get("type") == "catalog_design":
            catalog_item = item
            break
    if not catalog_item:
        raise HTTPException(status_code=400, detail="Ordern innehåller ingen katalogdesign")
    customization = catalog_item["customization"]
    output_dir = Path("/tmp/catalog_pdfs")
    output_dir.mkdir(exist_ok=True)
    company = customization.get("company_name", "katalog")
    output_path = str(output_dir / f"katalog_{order_id[:8]}.pdf")
    generate_catalog_pdf(customization, output_path)
    filename = f"katalog_{company}_{order_id[:8]}.pdf"
    return FileResponse(output_path, media_type="application/pdf", filename=filename,
                        headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@router.get("/b2b-orders/{order_id}/pdf")
async def download_b2b_catalog_pdf(order_id: str, admin=Depends(verify_admin_token)):
    """Download the uploaded PDF from a B2B catalog order."""
    order = await db.catalog_orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="B2B-order hittades inte")
    pdf_url = order.get("pdf_url")
    if not pdf_url:
        raise HTTPException(status_code=404, detail="Ingen PDF kopplad till denna beställning")
    filename = pdf_url.split("/")[-1]
    filepath = Path(os.path.dirname(__file__)).parent / "uploads" / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="PDF-filen hittades inte på servern")
    original = order.get("original_filename", filename)
    return FileResponse(str(filepath), media_type="application/pdf", filename=original,
                        headers={"Content-Disposition": f'attachment; filename="{original}"'})



@router.get("/orders/{order_id}/catalog-design")
async def get_catalog_design(order_id: str, admin=Depends(verify_admin_token)):
    """Get catalog design data from an order for admin editing."""
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order hittades inte")
    for item in order.get("items", []):
        if item.get("customization", {}).get("type") == "catalog_design":
            return item["customization"]
    raise HTTPException(status_code=404, detail="Ingen katalogdesign i denna order")


@router.put("/orders/{order_id}/catalog-design")
async def update_catalog_design(order_id: str, body: dict, admin=Depends(verify_admin_token)):
    """Update catalog design data in an order."""
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order hittades inte")
    items = order.get("items", [])
    updated = False
    for i, item in enumerate(items):
        if item.get("customization", {}).get("type") == "catalog_design":
            items[i]["customization"] = {**item["customization"], **body}
            updated = True
            break
    if not updated:
        raise HTTPException(status_code=404, detail="Ingen katalogdesign i denna order")
    await db.orders.update_one({"order_id": order_id}, {"$set": {"items": items}})
    return {"message": "Katalogdesign uppdaterad"}



# ─── Products ───────────────────────────────────────

@router.get("/products")
async def admin_get_products(admin=Depends(verify_admin_token)):
    products = await db.products.find({}, {"_id": 0}).to_list(100)
    return {"products": products, "total": len(products)}

@router.post("/products")
async def create_product(product_data: AdminProductCreate, admin=Depends(verify_admin_token)):
    product = Product(**product_data.model_dump())
    await db.products.insert_one(product.model_dump())
    await db.admin_logs.insert_one({"action": "create_product", "product_id": product.product_id, "admin_email": admin.get("email"), "timestamp": datetime.now(timezone.utc).isoformat()})
    return {"message": "Produkt skapad", "product_id": product.product_id}

@router.put("/products/{product_id}")
async def update_product(product_id: str, product_data: AdminProductCreate, admin=Depends(verify_admin_token)):
    result = await db.products.update_one({"product_id": product_id}, {"$set": product_data.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Produkt hittades inte")
    await db.admin_logs.insert_one({"action": "update_product", "product_id": product_id, "admin_email": admin.get("email"), "timestamp": datetime.now(timezone.utc).isoformat()})
    return {"message": "Produkt uppdaterad"}

@router.delete("/products/{product_id}")
async def delete_product(product_id: str, admin=Depends(verify_admin_token)):
    result = await db.products.delete_one({"product_id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Produkt hittades inte")
    await db.admin_logs.insert_one({"action": "delete_product", "product_id": product_id, "admin_email": admin.get("email"), "timestamp": datetime.now(timezone.utc).isoformat()})
    return {"message": "Produkt raderad"}


# ─── Settings ───────────────────────────────────────

@router.get("/settings")
async def get_settings(admin=Depends(verify_admin_token)):
    settings = await db.settings.find_one({"type": "site_settings"}, {"_id": 0})
    if not settings:
        return SiteSettings().model_dump()
    return settings

@router.put("/settings")
async def update_settings(settings: SiteSettings, admin=Depends(verify_admin_token)):
    await db.settings.update_one({"type": "site_settings"}, {"$set": {**settings.model_dump(), "type": "site_settings"}}, upsert=True)
    await db.admin_logs.insert_one({"action": "update_settings", "admin_email": admin.get("email"), "timestamp": datetime.now(timezone.utc).isoformat()})
    return {"message": "Inställningar uppdaterade"}

@router.get("/logs")
async def get_admin_logs(admin=Depends(verify_admin_token), skip: int = 0, limit: int = 100):
    logs = await db.admin_logs.find({}, {"_id": 0}).sort("timestamp", -1).skip(skip).limit(limit).to_list(limit)
    return {"logs": logs}

@router.delete("/logs")
async def clear_admin_logs(admin=Depends(verify_admin_token)):
    result = await db.admin_logs.delete_many({})
    await db.admin_logs.insert_one({"action": "clear_logs", "admin_email": ADMIN_EMAIL, "timestamp": datetime.now(timezone.utc).isoformat(), "details": f"{result.deleted_count} poster raderade"})
    return {"message": f"{result.deleted_count} loggposter raderade"}

@router.get("/payment-settings")
async def get_payment_settings(admin=Depends(verify_admin_token)):
    settings = await db.settings.find_one({"type": "payment_settings"}, {"_id": 0})
    if not settings:
        return PaymentSettings().model_dump()
    settings.pop("type", None)
    return settings

@router.put("/payment-settings")
async def update_payment_settings(settings: PaymentSettings, admin=Depends(verify_admin_token)):
    await db.settings.update_one({"type": "payment_settings"}, {"$set": {**settings.model_dump(), "type": "payment_settings"}}, upsert=True)
    await db.admin_logs.insert_one({"action": "update_payment_settings", "admin_email": admin.get("email"), "timestamp": datetime.now(timezone.utc).isoformat()})
    return {"message": "Betalningsinställningar uppdaterade"}


# ─── Reviews ────────────────────────────────────────

@router.get("/reviews")
async def admin_get_reviews(admin=Depends(verify_admin_token)):
    reviews = await db.reviews.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return reviews

@router.post("/reviews")
async def admin_create_review(review: Review, admin=Depends(verify_admin_token)):
    await db.reviews.insert_one(review.model_dump())
    return {"message": "Recension skapad", "review_id": review.review_id}

@router.put("/reviews/{review_id}")
async def admin_update_review(review_id: str, data: dict, admin=Depends(verify_admin_token)):
    update_data = {k: v for k, v in data.items() if k not in ["review_id", "_id"]}
    result = await db.reviews.update_one({"review_id": review_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Recension hittades inte")
    return {"message": "Recension uppdaterad"}

@router.delete("/reviews/{review_id}")
async def admin_delete_review(review_id: str, admin=Depends(verify_admin_token)):
    result = await db.reviews.delete_one({"review_id": review_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Recension hittades inte")
    return {"message": "Recension raderad"}

@router.get("/review-platforms")
async def admin_get_review_platforms(admin=Depends(verify_admin_token)):
    settings = await db.review_settings.find_one({"type": "platforms"}, {"_id": 0})
    if not settings:
        return {"platforms": []}
    return {"platforms": settings.get("platforms", [])}

@router.put("/review-platforms")
async def admin_update_review_platforms(data: dict, admin=Depends(verify_admin_token)):
    platforms = data.get("platforms", [])
    await db.review_settings.update_one({"type": "platforms"}, {"$set": {"type": "platforms", "platforms": platforms}}, upsert=True)
    return {"message": "Recensionsplattformar uppdaterade"}


# ─── Content Pages ──────────────────────────────────

@router.get("/content")
async def get_content_pages(admin=Depends(verify_admin_token)):
    pages = await db.content_pages.find({}, {"_id": 0}).to_list(100)
    return {"pages": pages}

@router.post("/content")
async def create_content_page(page: ContentPage, admin=Depends(verify_admin_token)):
    page_data = page.model_dump()
    page_data["content"] = sanitize_html(page_data["content"])
    page_data["title"] = bleach.clean(page_data["title"], tags=[], strip=True)
    page_data["page_id"] = str(uuid.uuid4())
    page_data["created_at"] = datetime.now(timezone.utc).isoformat()
    page_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    slug = page_data["slug"].strip("/")
    if not slug.startswith("/"):
        page_data["slug"] = f"/{slug}"
    await db.content_pages.insert_one(page_data)
    return {"message": "Sida skapad", "page_id": page_data["page_id"]}

@router.put("/content/{page_id}")
async def update_content_page(page_id: str, page: ContentPage, admin=Depends(verify_admin_token)):
    page_data = page.model_dump()
    page_data["content"] = sanitize_html(page_data["content"])
    page_data["title"] = bleach.clean(page_data["title"], tags=[], strip=True)
    page_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    slug = page_data["slug"].strip("/")
    if not slug.startswith("/"):
        page_data["slug"] = f"/{slug}"
    result = await db.content_pages.update_one({"page_id": page_id}, {"$set": page_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Sida hittades inte")
    return {"message": "Sida uppdaterad"}

@router.delete("/content/{page_id}")
async def delete_content_page(page_id: str, admin=Depends(verify_admin_token)):
    result = await db.content_pages.delete_one({"page_id": page_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Sida hittades inte")
    return {"message": "Sida raderad"}


# ─── Discount Codes ─────────────────────────────────

@router.get("/discount-codes")
async def get_discount_codes(admin=Depends(verify_admin_token)):
    codes = await db.discount_codes.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return codes

@router.post("/discount-codes")
async def create_discount_code(code_data: DiscountCode, admin=Depends(verify_admin_token)):
    existing = await db.discount_codes.find_one({"code": code_data.code.upper()})
    if existing:
        raise HTTPException(status_code=400, detail="Koden finns redan")
    code_dict = code_data.model_dump()
    code_dict["code"] = code_dict["code"].upper()
    await db.discount_codes.insert_one(code_dict)
    return {"message": "Rabattkod skapad", "code": code_dict["code"]}

@router.put("/discount-codes/{code}")
async def update_discount_code(code: str, code_data: dict, admin=Depends(verify_admin_token)):
    update_fields = {k: v for k, v in code_data.items() if k in ("discount_percent", "active", "max_uses", "expires_at")}
    if not update_fields:
        raise HTTPException(status_code=400, detail="Inga fält att uppdatera")
    result = await db.discount_codes.update_one({"code": code.upper()}, {"$set": update_fields})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Kod hittades inte")
    return {"message": "Rabattkod uppdaterad"}

@router.delete("/discount-codes/{code}")
async def delete_discount_code(code: str, admin=Depends(verify_admin_token)):
    result = await db.discount_codes.delete_one({"code": code.upper()})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Kod hittades inte")
    return {"message": "Rabattkod raderad"}

@router.post("/send-discount-email")
async def send_discount_email(data: dict, admin=Depends(verify_admin_token)):
    discount_code = data.get("code", "").strip().upper()
    custom_message = data.get("message", "")
    if not discount_code:
        raise HTTPException(status_code=400, detail="Ange en rabattkod")
    code_doc = await db.discount_codes.find_one({"code": discount_code}, {"_id": 0})
    if not code_doc:
        raise HTTPException(status_code=404, detail="Rabattkoden finns inte")
    users = await db.users.find({"role": {"$ne": "admin"}}, {"_id": 0, "email": 1}).to_list(1000)
    order_emails = await db.orders.distinct("email")
    all_emails = {u["email"] for u in users if u.get("email")}
    all_emails.update(e for e in order_emails if e)
    if not all_emails:
        raise HTTPException(status_code=400, detail="Inga kunder hittade")
    site_url = os.environ.get('SITE_URL', '')
    sent_count, failed_emails = await send_discount_emails(discount_code, code_doc, custom_message, all_emails, site_url)
    await db.admin_logs.insert_one({"action": "send_discount_email", "code": discount_code, "sent_count": sent_count, "failed_count": len(failed_emails), "admin_email": admin.get("email"), "timestamp": datetime.now(timezone.utc).isoformat()})
    return {"message": f"E-post skickad till {sent_count} kunder", "sent_count": sent_count, "failed_count": len(failed_emails), "failed_emails": failed_emails}


# ─── Tax Report ─────────────────────────────────────

@router.get("/tax-report")
async def get_tax_report(admin=Depends(verify_admin_token)):
    TAX_RATE = 0.25
    pipeline = [
        {"$addFields": {"month": {"$substr": ["$created_at", 0, 7]}}},
        {"$group": {"_id": "$month", "total_sales": {"$sum": "$total_amount"}, "order_count": {"$sum": 1}}},
        {"$sort": {"_id": -1}},
    ]
    monthly = await db.orders.aggregate(pipeline).to_list(100)
    months = []
    grand_total = grand_vat = grand_net = 0
    for m in monthly:
        total = m["total_sales"] or 0
        vat = round(total * TAX_RATE / (1 + TAX_RATE), 2)
        net = round(total - vat, 2)
        grand_total += total
        grand_vat += vat
        grand_net += net
        months.append({"month": m["_id"], "order_count": m["order_count"], "total_sales": round(total, 2), "vat_amount": vat, "net_amount": net})
    return {"tax_rate": TAX_RATE * 100, "months": months, "summary": {"total_sales": round(grand_total, 2), "total_vat": round(grand_vat, 2), "total_net": round(grand_net, 2), "total_orders": sum(month["order_count"] for month in months)}}
