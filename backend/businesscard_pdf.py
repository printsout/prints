"""
Business Card PDF Generator
Generates a printable PDF of business card designs.
Standard size: 90mm x 50mm (EU standard)
"""
import os
from pathlib import Path
from reportlab.lib.units import mm
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, white
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

CARD_W = 90 * mm
CARD_H = 50 * mm
PAGE_W, PAGE_H = A4
MARGIN = 10 * mm


def _draw_card(c, x, y, card_details, template, color, logo_path=None):
    """Draw a single business card at position (x, y)."""
    accent = HexColor(color or "#2a9d8f")
    name = card_details.get("name", "")
    title = card_details.get("title", "")
    company = card_details.get("company", "")
    phone = card_details.get("phone", "")
    email = card_details.get("email", "")
    website = card_details.get("website", "")
    address = card_details.get("address", "")

    # Card background
    c.saveState()
    c.setFillColor(white)
    c.setStrokeColor(HexColor("#e2e8f0"))
    c.setLineWidth(0.5)
    c.roundRect(x, y, CARD_W, CARD_H, 2 * mm, fill=1, stroke=1)

    if template == "modern":
        # Logo at top-right of header bar
        logo_drawn = False
        if logo_path and os.path.exists(logo_path):
            try:
                c.drawImage(ImageReader(logo_path), x + CARD_W - 22 * mm, y + CARD_H - 7.5 * mm, 18 * mm, 7 * mm, preserveAspectRatio=True, anchor="c", mask="auto")
                logo_drawn = True
            except Exception:
                pass
        # Top accent bar
        c.saveState()
        p = c.beginPath()
        p.rect(x, y + CARD_H - 8 * mm, CARD_W, 8 * mm)
        c.clipPath(p, stroke=0)
        c.setFillColor(accent)
        c.rect(x, y + CARD_H - 8 * mm, CARD_W, 8 * mm, fill=1, stroke=0)
        # Name left-aligned in header
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(x + 4 * mm, y + CARD_H - 6.5 * mm, name)
        # Logo in header bar (on top of accent)
        if logo_drawn and logo_path:
            try:
                c.drawImage(ImageReader(logo_path), x + CARD_W - 22 * mm, y + CARD_H - 7.5 * mm, 18 * mm, 7 * mm, preserveAspectRatio=True, anchor="c", mask="auto")
            except Exception:
                pass
        c.restoreState()
        # Title
        c.setFillColor(accent)
        c.setFont("Helvetica", 7)
        c.drawString(x + 4 * mm, y + CARD_H - 12 * mm, title)
        # Company
        if company:
            c.setFillColor(HexColor("#64748b"))
            c.setFont("Helvetica", 6.5)
            c.drawString(x + 4 * mm, y + CARD_H - 16 * mm, company)
        # Contact info left-aligned
        cy = y + 16 * mm
        c.setFont("Helvetica", 6)
        c.setFillColor(HexColor("#475569"))
        for line in [phone, email, website, address]:
            if line:
                c.drawString(x + 4 * mm, cy, line)
                cy -= 3.5 * mm
        # Large logo bottom-right
        if logo_path and os.path.exists(logo_path):
            try:
                c.drawImage(ImageReader(logo_path), x + CARD_W - 24 * mm, y + 2 * mm, 20 * mm, 10 * mm, preserveAspectRatio=True, anchor="c", mask="auto")
            except Exception:
                pass

    elif template == "minimal":
        # Thin bottom line
        c.setStrokeColor(accent)
        c.setLineWidth(1)
        c.line(x + 5 * mm, y + 3 * mm, x + CARD_W - 5 * mm, y + 3 * mm)
        # Name
        c.setFillColor(HexColor("#1e293b"))
        c.setFont("Helvetica-Bold", 10)
        c.drawString(x + 5 * mm, y + CARD_H - 10 * mm, name)
        # Title
        c.setFillColor(HexColor("#94a3b8"))
        c.setFont("Helvetica", 6.5)
        c.drawString(x + 5 * mm, y + CARD_H - 14 * mm, title)
        # Right side contact
        rx = x + CARD_W - 5 * mm
        cy = y + CARD_H - 10 * mm
        c.setFont("Helvetica", 6)
        c.setFillColor(HexColor("#475569"))
        for line in [email, phone, website]:
            if line:
                c.drawRightString(rx, cy, line)
                cy -= 3.5 * mm
        if company:
            c.setFillColor(HexColor("#64748b"))
            c.setFont("Helvetica", 6)
            c.drawString(x + 5 * mm, y + 7 * mm, company)
        if logo_path and os.path.exists(logo_path):
            try:
                c.drawImage(ImageReader(logo_path), rx - 20 * mm, y + 4 * mm, 18 * mm, 9 * mm, preserveAspectRatio=True, anchor="c", mask="auto")
            except Exception:
                pass

    else:  # classic
        # Left accent bar
        c.setFillColor(accent)
        c.rect(x, y, 2 * mm, CARD_H, fill=1, stroke=0)
        lx = x + 6 * mm
        # Logo top-left (larger)
        logo_bottom = y + CARD_H - 12 * mm
        if logo_path and os.path.exists(logo_path):
            try:
                c.drawImage(ImageReader(logo_path), lx, y + CARD_H - 12 * mm, 20 * mm, 10 * mm, preserveAspectRatio=True, anchor="sw", mask="auto")
                logo_bottom = y + CARD_H - 16 * mm
            except Exception:
                pass
        # Name
        c.setFillColor(HexColor("#1e293b"))
        c.setFont("Helvetica-Bold", 10)
        c.drawString(lx, logo_bottom, name)
        # Title
        c.setFillColor(accent)
        c.setFont("Helvetica", 6.5)
        c.drawString(lx, logo_bottom - 4 * mm, title)
        # Company
        if company:
            c.setFillColor(HexColor("#64748b"))
            c.setFont("Helvetica", 6)
            c.drawString(lx, logo_bottom - 8 * mm, company)
        # Contact info bottom
        cy = y + 10 * mm
        c.setFont("Helvetica", 6)
        c.setFillColor(HexColor("#475569"))
        contact_lines = []
        if phone and email:
            contact_lines.append(f"{phone}  |  {email}")
        else:
            if phone:
                contact_lines.append(phone)
            if email:
                contact_lines.append(email)
        if website and address:
            contact_lines.append(f"{website}  |  {address}")
        else:
            if website:
                contact_lines.append(website)
            if address:
                contact_lines.append(address)
        for line in contact_lines:
            c.drawString(lx, cy, line)
            cy -= 3.5 * mm

    c.restoreState()


UPLOADS_DIR = Path(os.path.dirname(__file__)) / "uploads"


def generate_businesscard_pdf(customization: dict, output_path: str) -> str:
    """
    Generate a printable PDF with business cards arranged on A4.
    Fits 8 cards per A4 page (2 columns × 4 rows).
    """
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)

    card_details = customization.get("card_details", {})
    # template and color can be at top-level or inside card_details
    template = customization.get("template") or card_details.get("template", "classic")
    color = customization.get("color") or card_details.get("color", "#2a9d8f")

    # Resolve logo
    logo_path = None
    logo_url = customization.get("logo_url", "")
    if logo_url:
        filename = logo_url.split("/")[-1]
        candidate = UPLOADS_DIR / filename
        if candidate.exists() and candidate.stat().st_size > 100:
            logo_path = str(candidate)

    c_pdf = canvas.Canvas(output_path, pagesize=A4)

    # 2 columns × 4 rows = 8 cards per page
    cols, rows = 2, 4
    x_start = (PAGE_W - cols * CARD_W - (cols - 1) * 4 * mm) / 2
    y_start = PAGE_H - MARGIN - CARD_H

    # Print cut marks and cards
    for row in range(rows):
        for col in range(cols):
            cx = x_start + col * (CARD_W + 4 * mm)
            cy = y_start - row * (CARD_H + 4 * mm)
            _draw_card(c_pdf, cx, cy, card_details, template, color, logo_path)

            # Cut marks
            c_pdf.setStrokeColor(HexColor("#cbd5e1"))
            c_pdf.setLineWidth(0.25)
            mark = 3 * mm
            for mx, my in [(cx, cy), (cx + CARD_W, cy), (cx, cy + CARD_H), (cx + CARD_W, cy + CARD_H)]:
                c_pdf.line(mx - mark, my, mx - 1, my)
                c_pdf.line(mx + 1, my, mx + mark, my)
                c_pdf.line(mx, my - mark, mx, my - 1)
                c_pdf.line(mx, my + 1, mx, my + mark)

    # Footer
    c_pdf.setFont("Helvetica", 7)
    c_pdf.setFillColor(HexColor("#94a3b8"))
    c_pdf.drawCentredString(PAGE_W / 2, 5 * mm, f"Visitkort — {card_details.get('name', '')} — 8 st per A4 — Klipp längs markeringarna")

    c_pdf.save()
    return output_path
