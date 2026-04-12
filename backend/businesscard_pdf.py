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
        # Top accent section (38% of card height) — matches frontend
        top_h = CARD_H * 0.38
        c.setFillColor(accent)
        c.rect(x, y + CARD_H - top_h, CARD_W, top_h, fill=1, stroke=0)
        # Logo centered in top section (or company name if no logo)
        if logo_path and os.path.exists(logo_path):
            try:
                logo_w, logo_h = 22 * mm, 9 * mm
                c.drawImage(ImageReader(logo_path), x + CARD_W / 2 - logo_w / 2, y + CARD_H - top_h / 2 - logo_h / 2, logo_w, logo_h, preserveAspectRatio=True, anchor="c", mask="auto")
            except Exception:
                pass
        elif company:
            c.setFillColor(white)
            c.setFont("Helvetica-Bold", 8)
            c.drawCentredString(x + CARD_W / 2, y + CARD_H - top_h / 2 - 3, company)
        # Bottom white section — all centered
        bottom_h = CARD_H - top_h
        mid_x = x + CARD_W / 2
        # Name centered
        c.setFillColor(HexColor("#1e293b"))
        c.setFont("Helvetica-Bold", 10)
        c.drawCentredString(mid_x, y + bottom_h - 8 * mm, name)
        # Title centered in accent color
        c.setFillColor(accent)
        c.setFont("Helvetica", 7)
        c.drawCentredString(mid_x, y + bottom_h - 12 * mm, title)
        # Contact info centered
        cy = y + bottom_h - 17 * mm
        c.setFont("Helvetica", 6)
        c.setFillColor(HexColor("#475569"))
        for line in [phone, email, website]:
            if line:
                c.drawCentredString(mid_x, cy, line)
                cy -= 3.2 * mm

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

    elif template == "classic":
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

    elif template == "elegant":
        # Dark background
        c.setFillColor(HexColor("#1a1a2e"))
        c.roundRect(x, y, CARD_W, CARD_H, 2 * mm, fill=1, stroke=0)
        # Subtle glow circle top-right
        c.setFillColor(accent)
        c.setFillAlpha(0.08)
        c.circle(x + CARD_W - 8 * mm, y + CARD_H - 4 * mm, 18 * mm, fill=1, stroke=0)
        c.setFillAlpha(1)
        # Logo top-left
        lx = x + 5 * mm
        if logo_path and os.path.exists(logo_path):
            try:
                c.drawImage(ImageReader(logo_path), lx, y + CARD_H - 11 * mm, 18 * mm, 8 * mm, preserveAspectRatio=True, anchor="sw", mask="auto")
            except Exception:
                pass
        # Name
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(lx, y + CARD_H - 17 * mm, name)
        # Title in accent
        c.setFillColor(accent)
        c.setFont("Helvetica", 7)
        c.drawString(lx, y + CARD_H - 21 * mm, title)
        # Company
        if company:
            c.setFillColor(HexColor("#94a3b8"))
            c.setFont("Helvetica", 6)
            c.drawString(lx, y + CARD_H - 25 * mm, company)
        # Accent divider
        c.setStrokeColor(accent)
        c.setLineWidth(0.5)
        c.line(lx, y + 14 * mm, lx + 10 * mm, y + 14 * mm)
        # Contact
        cy = y + 11 * mm
        c.setFont("Helvetica", 5.5)
        c.setFillColor(HexColor("#94a3b8"))
        for line in [phone, email, website]:
            if line:
                c.drawString(lx, cy, line)
                cy -= 3 * mm

    elif template == "creative":
        # White bg with gradient top bar
        c.setFillColor(accent)
        c.rect(x, y + CARD_H - 2 * mm, CARD_W, 2 * mm, fill=1, stroke=0)
        # Decorative circles
        c.setFillColor(accent)
        c.setFillAlpha(0.06)
        c.circle(x + CARD_W - 6 * mm, y + CARD_H - 10 * mm, 14 * mm, fill=1, stroke=0)
        c.circle(x + 8 * mm, y + 6 * mm, 10 * mm, fill=1, stroke=0)
        c.setFillAlpha(1)
        # Name top-left
        lx = x + 5 * mm
        c.setFillColor(HexColor("#1e293b"))
        c.setFont("Helvetica-Bold", 10)
        c.drawString(lx, y + CARD_H - 10 * mm, name)
        c.setFillColor(accent)
        c.setFont("Helvetica", 7)
        c.drawString(lx, y + CARD_H - 14 * mm, title)
        # Logo top-right
        if logo_path and os.path.exists(logo_path):
            try:
                c.drawImage(ImageReader(logo_path), x + CARD_W - 24 * mm, y + CARD_H - 13 * mm, 18 * mm, 9 * mm, preserveAspectRatio=True, anchor="c", mask="auto")
            except Exception:
                pass
        # Contact bottom split
        cy = y + 10 * mm
        c.setFont("Helvetica", 5.5)
        c.setFillColor(HexColor("#475569"))
        for line in [phone, email]:
            if line:
                c.drawString(lx, cy, line)
                cy -= 3 * mm
        ry = y + 10 * mm
        for line in [website, address]:
            if line:
                c.drawRightString(x + CARD_W - 5 * mm, ry, line)
                ry -= 3 * mm

    elif template == "corporate":
        # Left color panel (35%)
        panel_w = CARD_W * 0.35
        c.setFillColor(accent)
        c.rect(x, y, panel_w, CARD_H, fill=1, stroke=0)
        # Logo centered in panel
        if logo_path and os.path.exists(logo_path):
            try:
                c.drawImage(ImageReader(logo_path), x + panel_w / 2 - 10 * mm, y + CARD_H / 2 - 5 * mm, 20 * mm, 10 * mm, preserveAspectRatio=True, anchor="c", mask="auto")
            except Exception:
                pass
        else:
            c.setFillColor(white)
            c.setFont("Helvetica-Bold", 18)
            initial = (company or name or "A")[0].upper()
            c.drawCentredString(x + panel_w / 2, y + CARD_H / 2 - 3, initial)
        # Right content
        rx = x + panel_w + 4 * mm
        # Company name top
        if company:
            c.setFillColor(accent)
            c.setFont("Helvetica-Bold", 5.5)
            c.drawString(rx, y + CARD_H - 7 * mm, company.upper())
        c.setFillColor(HexColor("#1e293b"))
        c.setFont("Helvetica-Bold", 9)
        c.drawString(rx, y + CARD_H - 13 * mm, name)
        c.setFillColor(HexColor("#64748b"))
        c.setFont("Helvetica", 6)
        c.drawString(rx, y + CARD_H - 17 * mm, title)
        # Contact
        cy = y + 10 * mm
        c.setFont("Helvetica", 5.5)
        c.setFillColor(HexColor("#475569"))
        for line in [phone, email, website]:
            if line:
                c.drawString(rx, cy, line)
                cy -= 3 * mm

    elif template == "nature":
        # Green gradient background
        c.setFillColor(HexColor("#f0fdf4"))
        c.roundRect(x, y, CARD_W, CARD_H, 2 * mm, fill=1, stroke=0)
        c.setFillColor(HexColor("#dcfce7"))
        c.setFillAlpha(0.5)
        c.roundRect(x, y, CARD_W, CARD_H / 2, 0, fill=1, stroke=0)
        c.setFillAlpha(1)
        lx = x + 5 * mm
        # Logo
        if logo_path and os.path.exists(logo_path):
            try:
                c.drawImage(ImageReader(logo_path), lx, y + CARD_H - 12 * mm, 18 * mm, 8 * mm, preserveAspectRatio=True, anchor="sw", mask="auto")
            except Exception:
                pass
        # Name
        c.setFillColor(HexColor("#14532d"))
        c.setFont("Helvetica-Bold", 10)
        c.drawString(lx, y + CARD_H - 18 * mm, name)
        c.setFillColor(HexColor("#15803d"))
        c.setFont("Helvetica", 7)
        c.drawString(lx, y + CARD_H - 22 * mm, title)
        if company:
            c.setFillColor(HexColor("#16a34a"))
            c.setFillAlpha(0.7)
            c.setFont("Helvetica", 6)
            c.drawString(lx, y + CARD_H - 26 * mm, company)
            c.setFillAlpha(1)
        # Green divider
        c.setStrokeColor(HexColor("#86efac"))
        c.setLineWidth(0.5)
        c.line(lx, y + 13 * mm, lx + 12 * mm, y + 13 * mm)
        # Contact
        cy = y + 10 * mm
        c.setFont("Helvetica", 5.5)
        c.setFillColor(HexColor("#166534"))
        c.setFillAlpha(0.6)
        for line in [phone, email, website]:
            if line:
                c.drawString(lx, cy, line)
                cy -= 3 * mm
        c.setFillAlpha(1)

    elif template == "tech":
        # Dark background with dot grid
        c.setFillColor(HexColor("#0f172a"))
        c.roundRect(x, y, CARD_W, CARD_H, 2 * mm, fill=1, stroke=0)
        # Dot grid pattern
        c.setFillColor(white)
        c.setFillAlpha(0.04)
        for dx in range(0, int(CARD_W / (3 * mm)), 1):
            for dy in range(0, int(CARD_H / (3 * mm)), 1):
                c.circle(x + 2 * mm + dx * 3 * mm, y + 2 * mm + dy * 3 * mm, 0.3, fill=1, stroke=0)
        c.setFillAlpha(1)
        lx = x + 5 * mm
        # Name + title
        c.setFillColor(white)
        c.setFont("Courier-Bold", 10)
        c.drawString(lx, y + CARD_H - 10 * mm, name)
        c.setFillColor(accent)
        c.setFont("Courier", 7)
        c.drawString(lx, y + CARD_H - 14 * mm, title)
        if company:
            c.setFillColor(HexColor("#64748b"))
            c.setFont("Courier", 6)
            c.drawString(lx, y + CARD_H - 18 * mm, company)
        # Logo top-right
        if logo_path and os.path.exists(logo_path):
            try:
                c.drawImage(ImageReader(logo_path), x + CARD_W - 22 * mm, y + CARD_H - 12 * mm, 16 * mm, 8 * mm, preserveAspectRatio=True, anchor="c", mask="auto")
            except Exception:
                pass
        # Neon accent line
        c.setStrokeColor(accent)
        c.setLineWidth(0.7)
        c.line(lx, y + 13 * mm, x + CARD_W / 2, y + 13 * mm)
        # Contact with $ prefix
        cy = y + 10 * mm
        c.setFont("Courier", 5.5)
        c.setFillColor(HexColor("#94a3b8"))
        for line in [phone, email, website]:
            if line:
                c.setFillColor(accent)
                c.drawString(lx, cy, "$")
                c.setFillColor(HexColor("#94a3b8"))
                c.drawString(lx + 3 * mm, cy, line)
                cy -= 3 * mm

    else:
        # Fallback: use classic style
        lx = x + 5 * mm
        c.setFillColor(HexColor("#1e293b"))
        c.setFont("Helvetica-Bold", 10)
        c.drawString(lx, y + CARD_H - 10 * mm, name)
        c.setFillColor(accent)
        c.setFont("Helvetica", 7)
        c.drawString(lx, y + CARD_H - 14 * mm, title)
        cy = y + 10 * mm
        c.setFont("Helvetica", 6)
        c.setFillColor(HexColor("#475569"))
        for line in [phone, email, website]:
            if line:
                c.drawString(lx, cy, line)
                cy -= 3 * mm

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
