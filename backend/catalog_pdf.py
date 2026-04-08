"""Generate a printable PDF from a custom catalog design."""
import os
import tempfile
import requests
from io import BytesIO
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white, black, Color
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from PIL import Image

PAGE_W, PAGE_H = A4
MARGIN = 15 * mm
CONTENT_W = PAGE_W - 2 * MARGIN
CONTENT_H = PAGE_H - 2 * MARGIN
API_BASE = os.environ.get("API_BASE_URL", "http://localhost:8001")


def _fetch_image(url: str) -> ImageReader | None:
    """Fetch image from URL or local path, return ImageReader or None."""
    try:
        if url.startswith("/api/uploads/"):
            from config import UPLOADS_DIR
            local_path = UPLOADS_DIR / url.split("/")[-1]
            if local_path.exists():
                return ImageReader(str(local_path))
            url = f"{API_BASE}{url}"

        if url.startswith("http"):
            resp = requests.get(url, timeout=10)
            resp.raise_for_status()
            return ImageReader(BytesIO(resp.content))
        elif os.path.exists(url):
            return ImageReader(url)
    except Exception:
        pass
    return None


def _draw_bg(c, color_hex: str):
    """Draw a colored background on the current page."""
    try:
        color = HexColor(color_hex)
    except Exception:
        color = HexColor("#ffffff")
    c.setFillColor(color)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)


def _draw_text(c, text: str, x: float, y: float, size: float = 12,
               color=black, font: str = "Helvetica", align: str = "left",
               max_width: float = None, bold: bool = False):
    """Draw text with optional alignment and max width."""
    font_name = f"{font}-Bold" if bold else font
    try:
        c.setFont(font_name, size)
    except Exception:
        c.setFont("Helvetica-Bold" if bold else "Helvetica", size)
    c.setFillColor(color)

    if max_width:
        text = _truncate_text(c, text, max_width)

    if align == "center":
        tw = c.stringWidth(text, font_name if font_name in ("Helvetica", "Helvetica-Bold") else "Helvetica", size)
        x = x - tw / 2
    elif align == "right":
        tw = c.stringWidth(text, font_name if font_name in ("Helvetica", "Helvetica-Bold") else "Helvetica", size)
        x = x - tw

    c.drawString(x, y, text)


def _truncate_text(c, text, max_width):
    """Truncate text to fit within max_width."""
    if c.stringWidth(text) <= max_width:
        return text
    while c.stringWidth(text + "...") > max_width and len(text) > 0:
        text = text[:-1]
    return text + "..."


def _draw_cover(c, page_data: dict, theme: dict, company_name: str, logo_url: str | None):
    """Draw the cover page."""
    primary = theme.get("primaryColor", "#2a9d8f")
    _draw_bg(c, primary)

    # Logo
    if logo_url:
        img = _fetch_image(logo_url)
        if img:
            c.drawImage(img, MARGIN, PAGE_H - 80 * mm, width=50 * mm, height=20 * mm,
                        preserveAspectRatio=True, mask="auto")

    # Title
    title = page_data.get("title") or company_name or "Produktkatalog"
    _draw_text(c, title, PAGE_W / 2, PAGE_H / 2 + 20 * mm, size=36, color=white,
               align="center", bold=True)

    # Subtitle
    subtitle = page_data.get("subtitle") or ""
    if subtitle:
        _draw_text(c, subtitle, PAGE_W / 2, PAGE_H / 2 - 5 * mm, size=16, color=white,
                   align="center")

    # Background image
    bg = page_data.get("bgImage")
    if bg:
        img = _fetch_image(bg)
        if img:
            c.saveState()
            c.setFillColor(Color(0, 0, 0, alpha=0.3))
            c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
            c.restoreState()


def _draw_product_page(c, page_data: dict, theme: dict, page_num: int):
    """Draw a product grid page."""
    primary = theme.get("primaryColor", "#2a9d8f")

    # White background
    c.setFillColor(white)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

    # Header bar
    c.setFillColor(HexColor(primary))
    c.rect(0, PAGE_H - 25 * mm, PAGE_W, 25 * mm, fill=1, stroke=0)

    title = page_data.get("title") or f"Produkter"
    _draw_text(c, title, MARGIN, PAGE_H - 17 * mm, size=18, color=white, bold=True)

    # Product items
    items = page_data.get("items") or []
    if not items:
        _draw_text(c, "Inga produkter tillagda", PAGE_W / 2, PAGE_H / 2, size=14,
                   color=HexColor("#94a3b8"), align="center")
        return

    cols = 2
    item_w = (CONTENT_W - 10 * mm) / cols
    item_h = 70 * mm
    start_y = PAGE_H - 35 * mm

    for i, item in enumerate(items[:6]):
        col = i % cols
        row = i // cols
        x = MARGIN + col * (item_w + 10 * mm)
        y = start_y - row * (item_h + 10 * mm)

        # Item card background
        c.setFillColor(HexColor("#f8fafc"))
        c.roundRect(x, y - item_h, item_w, item_h, 3 * mm, fill=1, stroke=0)

        # Product image
        img_url = item.get("image")
        if img_url:
            img = _fetch_image(img_url)
            if img:
                img_size = 35 * mm
                c.drawImage(img, x + (item_w - img_size) / 2, y - img_size - 5 * mm,
                            width=img_size, height=img_size,
                            preserveAspectRatio=True, mask="auto")

        # Product name
        name = item.get("name") or "Produkt"
        _draw_text(c, name, x + 3 * mm, y - 50 * mm, size=10, bold=True,
                   max_width=item_w - 6 * mm)

        # Price
        price = item.get("price")
        if price:
            _draw_text(c, f"{price} kr", x + 3 * mm, y - 58 * mm, size=10,
                       color=HexColor(primary))

        # Description
        desc = item.get("description") or ""
        if desc:
            _draw_text(c, desc, x + 3 * mm, y - 65 * mm, size=7,
                       color=HexColor("#64748b"), max_width=item_w - 6 * mm)

    # Page number
    _draw_text(c, str(page_num), PAGE_W / 2, 10 * mm, size=9,
               color=HexColor("#94a3b8"), align="center")


def _draw_text_page(c, page_data: dict, theme: dict, page_num: int):
    """Draw a text/about page."""
    primary = theme.get("primaryColor", "#2a9d8f")

    c.setFillColor(white)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

    c.setFillColor(HexColor(primary))
    c.rect(0, PAGE_H - 25 * mm, PAGE_W, 25 * mm, fill=1, stroke=0)

    title = page_data.get("title") or "Om oss"
    _draw_text(c, title, MARGIN, PAGE_H - 17 * mm, size=18, color=white, bold=True)

    # Body text
    body = page_data.get("body") or page_data.get("description") or ""
    if body:
        text_obj = c.beginText(MARGIN, PAGE_H - 40 * mm)
        text_obj.setFont("Helvetica", 11)
        text_obj.setFillColor(HexColor("#334155"))
        text_obj.setLeading(16)
        for line in body.split("\n"):
            # Word-wrap
            words = line.split()
            current = ""
            for word in words:
                test = f"{current} {word}".strip()
                if c.stringWidth(test, "Helvetica", 11) > CONTENT_W:
                    text_obj.textLine(current)
                    current = word
                else:
                    current = test
            if current:
                text_obj.textLine(current)
            text_obj.textLine("")
        c.drawText(text_obj)

    # Page number
    _draw_text(c, str(page_num), PAGE_W / 2, 10 * mm, size=9,
               color=HexColor("#94a3b8"), align="center")


def _draw_contact_page(c, page_data: dict, theme: dict, company_name: str, page_num: int):
    """Draw a contact/back page."""
    primary = theme.get("primaryColor", "#2a9d8f")
    _draw_bg(c, primary)

    _draw_text(c, company_name or "Kontakta oss", PAGE_W / 2, PAGE_H / 2 + 30 * mm,
               size=28, color=white, align="center", bold=True)

    info_lines = []
    for key in ("email", "phone", "website", "address"):
        val = page_data.get(key) or page_data.get(f"contact_{key}")
        if val:
            info_lines.append(val)

    y = PAGE_H / 2
    for line in info_lines:
        _draw_text(c, line, PAGE_W / 2, y, size=14, color=white, align="center")
        y -= 8 * mm

    _draw_text(c, str(page_num), PAGE_W / 2, 10 * mm, size=9,
               color=Color(1, 1, 1, alpha=0.5), align="center")


def generate_catalog_pdf(design_data: dict, output_path: str):
    """Generate a catalog PDF from design data and save to output_path."""
    pages = design_data.get("pages") or []
    theme = design_data.get("theme") or {"primaryColor": "#2a9d8f", "font": "Helvetica"}
    company = design_data.get("company_name") or ""
    logo_url = design_data.get("logo_url")

    c = canvas.Canvas(output_path, pagesize=A4)
    c.setTitle(f"Katalog - {company}" if company else "Katalog")

    for i, page in enumerate(pages):
        page_type = page.get("type", "products")
        page_num = i + 1

        if page_type == "cover":
            _draw_cover(c, page, theme, company, logo_url)
        elif page_type in ("products", "product_grid"):
            _draw_product_page(c, page, theme, page_num)
        elif page_type in ("text", "about", "intro"):
            _draw_text_page(c, page, theme, page_num)
        elif page_type in ("contact", "back_cover"):
            _draw_contact_page(c, page, theme, company, page_num)
        else:
            # Generic fallback
            _draw_product_page(c, page, theme, page_num)

        c.showPage()

    c.save()
