"""Catalog order routes for B2B catalog print requests."""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from database import db
from typing import Optional
from datetime import datetime, timezone
from config import UPLOADS_DIR
import uuid

router = APIRouter(prefix="/catalog", tags=["Catalog"])


@router.post("/order")
async def create_catalog_order(
    company_name: str = Form(...),
    contact_person: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    address: str = Form(""),
    postal_code: str = Form(""),
    city: str = Form(""),
    quantity: int = Form(1),
    message: str = Form(""),
    pdf_file: UploadFile = File(...),
):
    # Validate PDF
    if pdf_file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Bara PDF-filer tillåtna")

    contents = await pdf_file.read()
    max_size = 50 * 1024 * 1024  # 50MB
    if len(contents) > max_size:
        raise HTTPException(status_code=400, detail="Max filstorlek: 50MB")

    # Save file
    filename = f"catalog_{uuid.uuid4()}.pdf"
    filepath = UPLOADS_DIR / filename
    with open(filepath, "wb") as f:
        f.write(contents)

    order_data = {
        "order_id": str(uuid.uuid4()),
        "company_name": company_name,
        "contact_person": contact_person,
        "email": email,
        "phone": phone,
        "address": address,
        "postal_code": postal_code,
        "city": city,
        "quantity": quantity,
        "message": message,
        "pdf_filename": filename,
        "pdf_url": f"/api/uploads/{filename}",
        "original_filename": pdf_file.filename,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    await db.catalog_orders.insert_one(order_data)
    order_data.pop("_id", None)
    return {"message": "Beställning mottagen", "order_id": order_data["order_id"]}


@router.get("/orders")
async def get_catalog_orders():
    orders = await db.catalog_orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return orders
