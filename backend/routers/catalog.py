"""Catalog order routes for B2B catalog requests."""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, EmailStr
from typing import Optional
from database import db
from datetime import datetime, timezone
from config import UPLOADS_DIR
import uuid

router = APIRouter(prefix="/catalog", tags=["Catalog"])


class OurCatalogRequest(BaseModel):
    company_name: str
    contact_person: str
    email: EmailStr
    phone: str
    address: Optional[str] = ""
    postal_code: Optional[str] = ""
    city: Optional[str] = ""
    catalog_type: str  # "physical" or "digital"
    quantity: int = 1
    message: Optional[str] = ""


@router.post("/order/our-catalog")
async def order_our_catalog(order: OurCatalogRequest):
    """Order our pre-made product catalog (physical or digital)."""
    if order.catalog_type not in ("physical", "digital"):
        raise HTTPException(status_code=400, detail="Ogiltig katalogtyp")

    order_data = order.model_dump()
    order_data["order_id"] = str(uuid.uuid4())
    order_data["order_type"] = "our_catalog"
    order_data["status"] = "pending"
    order_data["created_at"] = datetime.now(timezone.utc).isoformat()

    await db.catalog_orders.insert_one(order_data)
    order_data.pop("_id", None)
    return {"message": "Beställning mottagen", "order_id": order_data["order_id"]}


@router.post("/order/print")
async def order_print_catalog(
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
    """Upload own PDF catalog for printing."""
    if pdf_file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Bara PDF-filer tillåtna")

    contents = await pdf_file.read()
    max_size = 50 * 1024 * 1024
    if len(contents) > max_size:
        raise HTTPException(status_code=400, detail="Max filstorlek: 50MB")

    filename = f"catalog_{uuid.uuid4()}.pdf"
    filepath = UPLOADS_DIR / filename
    with open(filepath, "wb") as f:
        f.write(contents)

    order_data = {
        "order_id": str(uuid.uuid4()),
        "order_type": "print",
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


async def _save_upload(file: UploadFile, prefix: str, max_mb: int) -> tuple:
    """Save an uploaded file, return (url, original_filename). Raises HTTPException on error."""
    contents = await file.read()
    if len(contents) > max_mb * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"Max filstorlek: {max_mb}MB")
    ext = file.filename.rsplit('.', 1)[-1] if '.' in (file.filename or '') else 'bin'
    filename = f"{prefix}_{uuid.uuid4()}.{ext}"
    filepath = UPLOADS_DIR / filename
    with open(filepath, "wb") as f:
        f.write(contents)
    return f"/api/uploads/{filename}", file.filename


@router.post("/order/businesscard")
async def order_businesscard(
    company_name: str = Form(...),
    contact_person: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    address: str = Form(""),
    postal_code: str = Form(""),
    city: str = Form(""),
    quantity: int = Form(1),
    message: str = Form(""),
    source: str = Form("editor"),
    card_name: str = Form(""),
    card_title: str = Form(""),
    card_company: str = Form(""),
    card_phone: str = Form(""),
    card_email: str = Form(""),
    card_website: str = Form(""),
    card_address: str = Form(""),
    card_template: str = Form("classic"),
    card_color: str = Form("#2a9d8f"),
    pdf_file: Optional[UploadFile] = File(None),
    logo_file: Optional[UploadFile] = File(None),
):
    """Order business cards - either from editor or PDF upload."""
    pdf_url = original_filename = logo_url = None

    if source == "pdf":
        if not pdf_file:
            raise HTTPException(status_code=400, detail="PDF-fil krävs")
        if pdf_file.content_type != "application/pdf":
            raise HTTPException(status_code=400, detail="Bara PDF-filer tillåtna")
        pdf_url, original_filename = await _save_upload(pdf_file, "bizcard", 50)

    if logo_file and logo_file.size > 0:
        logo_url, _ = await _save_upload(logo_file, "logo", 10)

    order_data = {
        "order_id": str(uuid.uuid4()),
        "order_type": "businesscard",
        "source": source,
        "company_name": company_name,
        "contact_person": contact_person,
        "email": email,
        "phone": phone,
        "address": address,
        "postal_code": postal_code,
        "city": city,
        "quantity": quantity,
        "message": message,
        "card_details": {
            "name": card_name, "title": card_title, "company": card_company,
            "phone": card_phone, "email": card_email, "website": card_website,
            "address": card_address, "template": card_template, "color": card_color,
        },
        "logo_url": logo_url,
        "pdf_url": pdf_url,
        "original_filename": original_filename,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    await db.catalog_orders.insert_one(order_data)
    order_data.pop("_id", None)
    return {"message": "Visitkortsbeställning mottagen", "order_id": order_data["order_id"]}


@router.get("/orders")
async def get_catalog_orders():
    orders = await db.catalog_orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return orders
