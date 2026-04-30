"""Catalog order routes for B2B catalog requests."""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, EmailStr
from typing import Optional
from database import db
from datetime import datetime, timezone
from config import UPLOADS_DIR
import uuid

router = APIRouter(prefix="/catalog", tags=["Catalog"])


@router.get("/items")
async def get_public_catalog_items(catalog_type: str = None):
    """Public endpoint — get visible catalog items."""
    query = {"visible": True}
    if catalog_type:
        query["catalog_type"] = catalog_type
    items = await db.catalog_items.find(query, {"_id": 0}).sort("sort_order", 1).to_list(500)
    return items



@router.get("/photo-print-pricing")
async def get_photo_print_pricing():
    """Public endpoint for photo print sizes, qualities and prices."""
    settings = await db.site_settings.find_one({"type": "photo_print_pricing"}, {"_id": 0})
    if not settings:
        return {"sizes": [], "qualities": [], "prices": []}
    return {"sizes": settings.get("sizes", []), "qualities": settings.get("qualities", []), "prices": settings.get("prices", [])}


@router.get("/download-pdf")
async def download_catalog_pdf():
    """Generate and return a PDF catalog of all visible products."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.lib.colors import HexColor
    from reportlab.pdfgen import canvas as pdf_canvas
    from reportlab.lib.utils import ImageReader
    from fastapi.responses import FileResponse
    import os

    items = await db.catalog_items.find({"visible": True}, {"_id": 0}).sort("sort_order", 1).to_list(500)

    output_dir = UPLOADS_DIR.parent / "tmp_pdfs"
    output_dir.mkdir(exist_ok=True)
    output_path = str(output_dir / "printsout_katalog.pdf")

    PAGE_W, PAGE_H = A4
    c = pdf_canvas.Canvas(output_path, pagesize=A4)

    # Title page
    c.setFillColor(HexColor("#1e293b"))
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(HexColor("#2a9d8f"))
    c.setFont("Helvetica-Bold", 36)
    c.drawCentredString(PAGE_W / 2, PAGE_H / 2 + 20, "PrintsOut")
    c.setFillColor(HexColor("#94a3b8"))
    c.setFont("Helvetica", 14)
    c.drawCentredString(PAGE_W / 2, PAGE_H / 2 - 10, "Produktkatalog")
    c.setFont("Helvetica", 10)
    c.drawCentredString(PAGE_W / 2, PAGE_H / 2 - 30, "Kvalitet i Varje Utskrift")
    c.showPage()

    # Product pages (2 per page)
    margin = 20 * mm
    col_w = (PAGE_W - margin * 2) / 2
    items_on_page = 0

    for idx, item in enumerate(items):
        if items_on_page == 0:
            # Header
            c.setFillColor(HexColor("#f8fafc"))
            c.rect(0, PAGE_H - 15 * mm, PAGE_W, 15 * mm, fill=1, stroke=0)
            c.setFillColor(HexColor("#2a9d8f"))
            c.setFont("Helvetica-Bold", 9)
            c.drawString(margin, PAGE_H - 10 * mm, "PrintsOut Produktkatalog")
            c.setFillColor(HexColor("#94a3b8"))
            c.setFont("Helvetica", 8)
            c.drawRightString(PAGE_W - margin, PAGE_H - 10 * mm, f"Sida {(idx // 4) + 2}")

        col = items_on_page % 2
        row = items_on_page // 2
        x = margin + col * col_w
        y = PAGE_H - 25 * mm - row * 120 * mm

        # Product card
        c.setFillColor(HexColor("#1e293b"))
        c.setFont("Helvetica-Bold", 12)
        c.drawString(x + 2 * mm, y - 5 * mm, item.get("name", ""))

        c.setFillColor(HexColor("#2a9d8f"))
        c.setFont("Helvetica-Bold", 10)
        price = item.get("price", 0)
        c.drawString(x + 2 * mm, y - 11 * mm, f"{price} kr" if price > 0 else "Gratis")

        if item.get("category"):
            c.setFillColor(HexColor("#64748b"))
            c.setFont("Helvetica", 8)
            c.drawString(x + 2 * mm, y - 16 * mm, item["category"])

        # Description
        desc = item.get("description", "")
        if desc:
            c.setFillColor(HexColor("#475569"))
            c.setFont("Helvetica", 8)
            # Simple word wrap
            words = desc.split()
            line = ""
            ly = y - 22 * mm
            for word in words:
                if c.stringWidth(line + " " + word, "Helvetica", 8) > col_w - 10 * mm:
                    c.drawString(x + 2 * mm, ly, line)
                    ly -= 3.5 * mm
                    line = word
                    if ly < y - 50 * mm:
                        break
                else:
                    line = (line + " " + word).strip()
            if line:
                c.drawString(x + 2 * mm, ly, line)

        # Features
        features = item.get("features", [])
        if features:
            fy = y - 55 * mm
            c.setFont("Helvetica", 7)
            c.setFillColor(HexColor("#475569"))
            for feat in features[:4]:
                c.drawString(x + 4 * mm, fy, f"• {feat}")
                fy -= 3 * mm

        # Image
        images = item.get("images", [])
        img_url = images[0] if images else item.get("image_url", "")
        if img_url:
            try:
                # Resolve local uploads
                if "/api/uploads/" in img_url:
                    filename = img_url.split("/")[-1]
                    local_path = UPLOADS_DIR / filename
                    if local_path.exists():
                        c.drawImage(ImageReader(str(local_path)),
                                    x + 2 * mm, y - 110 * mm, col_w - 10 * mm, 45 * mm,
                                    preserveAspectRatio=True, anchor="nw", mask="auto")
            except Exception:
                pass

        items_on_page += 1
        if items_on_page >= 4:
            c.showPage()
            items_on_page = 0

    if items_on_page > 0:
        c.showPage()

    c.save()

    if not os.path.exists(output_path):
        raise HTTPException(status_code=500, detail="Kunde inte generera katalog")

    return FileResponse(output_path, media_type="application/pdf",
                        filename="PrintsOut_Produktkatalog.pdf",
                        headers={"Content-Disposition": 'attachment; filename="PrintsOut_Produktkatalog.pdf"'})




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


@router.post("/businesscard/preview-pdf")
async def preview_businesscard_pdf(data: dict):
    """Generate a preview PDF from business card editor data (public, no auth)."""
    from businesscard_pdf import generate_businesscard_pdf
    import os

    card_details = data.get("card_details", {})
    template = data.get("template", "classic")
    color = data.get("color", "#2a9d8f")
    logo_url = data.get("logo_url", "")

    # Resolve logo from uploads
    if logo_url:
        filename = logo_url.split("/")[-1]
        candidate = UPLOADS_DIR / filename
        if not (candidate.exists() and candidate.stat().st_size > 100):
            logo_url = ""

    customization = {
        "card_details": card_details,
        "template": template,
        "color": color,
        "logo_url": logo_url,
    }

    output_dir = UPLOADS_DIR.parent / "tmp_pdfs"
    output_dir.mkdir(exist_ok=True)
    uid = str(uuid.uuid4())[:8]
    name = card_details.get("name", "visitkort").replace(" ", "_")
    output_path = str(output_dir / f"visitkort_{name}_{uid}.pdf")
    font_settings = await db.site_settings.find_one({"type": "businesscard_fonts"}, {"_id": 0})
    generate_businesscard_pdf(customization, output_path, font_settings)

    from fastapi.responses import FileResponse
    filename = f"visitkort_{name}.pdf"
    return FileResponse(output_path, media_type="application/pdf", filename=filename,
                        headers={"Content-Disposition": f'attachment; filename="{filename}"'})
