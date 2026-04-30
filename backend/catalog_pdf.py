"""Generate a printable PDF that closely matches the frontend PagePreview design."""
import os
import requests
from io import BytesIO
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white, Color
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from PIL import Image as PILImage

PAGE_W, PAGE_H = A4  # 210mm x 297mm
UPLOADS_DIR = Path(__file__).parent / "uploads"


def _hex(color_str):
    try:
        return HexColor(color_str)
    except Exception:
        return HexColor("#2a9d8f")


def _fetch_image(url):
    """Fetch image from local uploads or URL."""
    if not url:
        return None
    try:
        if url.startswith("/api/uploads/") or url.startswith("/uploads/"):
            filename = url.split("/")[-1]
            local = UPLOADS_DIR / filename
            if local.exists():
                return ImageReader(str(local))
        if url.startswith("http"):
            resp = requests.get(url, timeout=10)
            resp.raise_for_status()
            return ImageReader(BytesIO(resp.content))
        if url.startswith("data:"):
            import base64
            header, data = url.split(",", 1)
            return ImageReader(BytesIO(base64.b64decode(data)))
        if os.path.exists(url):
            return ImageReader(url)
    except Exception:
        pass
    return None


def _draw_image_adjusted(c, img, x, y, w, h, settings=None):
    """Draw image with zoom and position adjustments (crop simulation)."""
    if not img:
        return
    zoom = (settings or {}).get("zoom", 1)
    pos_x = (settings or {}).get("posX", 50) / 100.0
    pos_y = (settings or {}).get("posY", 50) / 100.0

    c.saveState()
    # Clip to the target area
    p = c.beginPath()
    p.rect(x, y, w, h)
    c.clipPath(p, stroke=0)

    # Calculate zoomed dimensions
    zw = w * zoom
    zh = h * zoom
    # Position: posX=0 means left edge, posX=100 means right edge
    dx = x - (zw - w) * pos_x
    # posY=0 means top, posY=100 means bottom (invert for PDF coords)
    dy = y - (zh - h) * (1 - pos_y)

    c.drawImage(img, dx, dy, width=zw, height=zh, preserveAspectRatio=True, mask="auto")
    c.restoreState()


def _set_font(c, font_name, size, bold=False):
    """Set font, falling back to Helvetica if custom font unavailable."""
    try:
        name = f"{font_name}-Bold" if bold else font_name
        c.setFont(name, size)
    except Exception:
        c.setFont("Helvetica-Bold" if bold else "Helvetica", size)


# ─── Cover Page ─────────────────────────────────────────
def _draw_cover(c, page, theme, company_logo, template):
    color = _hex(theme.get("primaryColor", "#2a9d8f"))
    font = theme.get("font", "Helvetica")

    # White background
    c.setFillColor(white)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

    # Background image with low opacity
    bg_img = _fetch_image(page.get("bgImage"))
    if bg_img:
        c.saveState()
        c.setFillColor(Color(1, 1, 1, alpha=0.7))
        _draw_image_adjusted(c, bg_img, 0, 0, PAGE_W, PAGE_H, page.get("bgImgSettings"))
        # Overlay to reduce opacity (simulate opacity: 0.3)
        c.setFillColor(Color(1, 1, 1, alpha=0.7))
        c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
        c.restoreState()

    # Gradient overlay (subtle)
    c.saveState()
    c.setFillColor(Color(
        color.red, color.green, color.blue, alpha=0.05
    ))
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.restoreState()

    # Center content
    center_y = PAGE_H / 2

    # Modern template: accent line above title
    if template == "modern":
        c.setFillColor(color)
        line_w = 50 * mm
        c.rect((PAGE_W - line_w) / 2, center_y + 30 * mm, line_w, 1 * mm, fill=1, stroke=0)

    # Company logo — clear and visible
    if company_logo:
        logo_img = _fetch_image(company_logo)
        if logo_img:
            logo_h = 22 * mm
            logo_w = 60 * mm
            c.drawImage(logo_img, (PAGE_W - logo_w) / 2, center_y + 12 * mm,
                        width=logo_w, height=logo_h, preserveAspectRatio=True)

    # Title
    title = page.get("title") or "Företagsnamn"
    _set_font(c, font, 28, bold=True)
    c.setFillColor(color)
    tw = c.stringWidth(title)
    c.drawString((PAGE_W - tw) / 2, center_y - 5 * mm, title)

    # Subtitle
    subtitle = page.get("subtitle") or "Produktkatalog"
    _set_font(c, font, 14)
    c.setFillColor(HexColor("#64748b"))
    sw = c.stringWidth(subtitle)
    c.drawString((PAGE_W - sw) / 2, center_y - 18 * mm, subtitle)

    # Classic template: accent line below subtitle
    if template == "classic":
        c.setFillColor(color)
        line_w = 32 * mm
        c.rect((PAGE_W - line_w) / 2, center_y - 26 * mm, line_w, 0.5 * mm, fill=1, stroke=0)


# ─── Product Page ───────────────────────────────────────
def _draw_product_page(c, page, theme):
    color = _hex(theme.get("primaryColor", "#2a9d8f"))
    font = theme.get("font", "Helvetica")

    # White background
    c.setFillColor(white)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

    # Top color bar (6mm)
    c.setFillColor(color)
    c.rect(0, PAGE_H - 6 * mm, PAGE_W, 6 * mm, fill=1, stroke=0)

    items = page.get("items") or []
    if not items:
        _set_font(c, font, 12)
        c.setFillColor(HexColor("#94a3b8"))
        c.drawCentredString(PAGE_W / 2, PAGE_H / 2, "Inga produkter tillagda")
        return

    margin = 8 * mm
    cols = 1 if len(items) <= 2 else 2
    gap = 6 * mm
    content_w = PAGE_W - 2 * margin
    col_w = (content_w - (cols - 1) * gap) / cols

    start_y = PAGE_H - 6 * mm - margin
    img_h = 50 * mm
    text_h = 30 * mm
    card_h = img_h + text_h
    row_gap = 6 * mm

    for i, item in enumerate(items[:6]):
        col = i % cols
        row = i // cols
        x = margin + col * (col_w + gap)
        y = start_y - row * (card_h + row_gap)

        # Card border
        c.setStrokeColor(HexColor("#f1f5f9"))
        c.setLineWidth(0.5)
        c.roundRect(x, y - card_h, col_w, card_h, 2 * mm, fill=0, stroke=1)

        # Image area
        c.setFillColor(HexColor("#f8fafc"))
        c.rect(x, y - img_h, col_w, img_h, fill=1, stroke=0)

        img = _fetch_image(item.get("image"))
        if img:
            _draw_image_adjusted(c, img, x, y - img_h, col_w, img_h, item.get("imgSettings"))

        # Text area
        text_x = x + 4 * mm
        text_y = y - img_h - 4 * mm

        # Product name
        name = item.get("name") or "Produktnamn"
        _set_font(c, font, 10, bold=True)
        c.setFillColor(HexColor("#1e293b"))
        c.drawString(text_x, text_y - 3 * mm, name[:35])

        # Description
        desc = item.get("desc") or ""
        if desc:
            _set_font(c, font, 7)
            c.setFillColor(HexColor("#94a3b8"))
            c.drawString(text_x, text_y - 9 * mm, desc[:50])

        # Price
        price = item.get("price")
        if price:
            _set_font(c, font, 10, bold=True)
            c.setFillColor(color)
            c.drawString(text_x, text_y - 16 * mm, f"{price} kr")


# ─── Gallery Page ───────────────────────────────────────
def _draw_gallery_page(c, page, theme):
    color = _hex(theme.get("primaryColor", "#2a9d8f"))
    font = theme.get("font", "Helvetica")

    c.setFillColor(white)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

    # Top bar
    c.setFillColor(color)
    c.rect(0, PAGE_H - 6 * mm, PAGE_W, 6 * mm, fill=1, stroke=0)

    margin = 8 * mm
    y_cursor = PAGE_H - 6 * mm - margin

    # Title
    title = page.get("title")
    if title:
        _set_font(c, font, 16, bold=True)
        c.setFillColor(color)
        c.drawString(margin, y_cursor - 4 * mm, title)
        y_cursor -= 14 * mm

    imgs = page.get("images") or []
    img_settings = page.get("imgSettings") or []
    captions = page.get("captions") or []
    gap = 4 * mm
    content_w = PAGE_W - 2 * margin
    col_w = (content_w - gap) / 2
    img_h = col_w * 0.75  # aspect ratio 4:3
    caption_h = 5 * mm

    for i, img_url in enumerate(imgs[:4]):
        col = i % 2
        row = i // 2
        x = margin + col * (col_w + gap)
        y = y_cursor - row * (img_h + caption_h + gap)

        # Background
        c.setFillColor(HexColor("#f8fafc"))
        c.roundRect(x, y - img_h, col_w, img_h, 1.5 * mm, fill=1, stroke=0)

        if img_url:
            img = _fetch_image(img_url)
            if img:
                settings = img_settings[i] if i < len(img_settings) else None
                _draw_image_adjusted(c, img, x, y - img_h, col_w, img_h, settings)

        # Caption
        caption = captions[i] if i < len(captions) else None
        if caption:
            _set_font(c, font, 8)
            c.setFillColor(HexColor("#64748b"))
            cw = c.stringWidth(caption)
            cx = x + (col_w - cw) / 2
            c.drawString(cx, y - img_h - caption_h, caption)


# ─── Text Page ──────────────────────────────────────────
def _draw_text_page(c, page, theme):
    color = _hex(theme.get("primaryColor", "#2a9d8f"))
    font = theme.get("font", "Helvetica")

    c.setFillColor(white)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

    # Top bar
    c.setFillColor(color)
    c.rect(0, PAGE_H - 6 * mm, PAGE_W, 6 * mm, fill=1, stroke=0)

    margin = 10 * mm
    y = PAGE_H - 6 * mm - margin

    # Title
    title = page.get("title") or "Rubrik"
    _set_font(c, font, 18, bold=True)
    c.setFillColor(color)
    c.drawString(margin, y - 5 * mm, title)
    y -= 16 * mm

    # Body text with word wrap
    body = page.get("body") or ""
    if body:
        _set_font(c, font, 9)
        c.setFillColor(HexColor("#475569"))
        max_w = PAGE_W - 2 * margin
        leading = 14

        for line in body.split("\n"):
            words = line.split()
            current = ""
            for word in words:
                test = f"{current} {word}".strip()
                if c.stringWidth(test) > max_w:
                    c.drawString(margin, y, current)
                    y -= leading
                    current = word
                    if y < 20 * mm:
                        break
                else:
                    current = test
            if current and y > 20 * mm:
                c.drawString(margin, y, current)
                y -= leading
            y -= leading * 0.5


# ─── Back Cover ─────────────────────────────────────────
def _draw_backcover(c, page, theme, company_logo):
    font = theme.get("font", "Helvetica")

    c.setFillColor(white)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

    center_y = PAGE_H / 2

    # Logo — large and clear
    if company_logo:
        logo_img = _fetch_image(company_logo)
        if logo_img:
            logo_h = 25 * mm
            logo_w = 70 * mm
            c.drawImage(logo_img, (PAGE_W - logo_w) / 2, center_y + 15 * mm,
                        width=logo_w, height=logo_h, preserveAspectRatio=True)

    # Company name
    name = page.get("companyName") or ""
    _set_font(c, font, 16, bold=True)
    c.setFillColor(HexColor("#1e293b"))
    nw = c.stringWidth(name)
    c.drawString((PAGE_W - nw) / 2, center_y, name)

    # Contact info
    y = center_y - 10 * mm
    _set_font(c, font, 9)
    for key, clr in [("phone", "#64748b"), ("email", theme.get("primaryColor", "#2a9d8f")), ("website", "#64748b")]:
        val = page.get(key)
        if val:
            c.setFillColor(HexColor(clr))
            vw = c.stringWidth(val)
            c.drawString((PAGE_W - vw) / 2, y, val)
            y -= 6 * mm

    # Address
    address = page.get("address")
    if address:
        _set_font(c, font, 8)
        c.setFillColor(HexColor("#94a3b8"))
        aw = c.stringWidth(address)
        c.drawString((PAGE_W - aw) / 2, y - 4 * mm, address)


# ─── Main Generator ────────────────────────────────────
def generate_catalog_pdf(design_data: dict, output_path: str):
    """Generate a catalog PDF matching the frontend PagePreview design."""
    pages = design_data.get("pages") or []
    theme = design_data.get("theme") or {"primaryColor": "#2a9d8f", "font": "Helvetica"}
    company = design_data.get("company_name") or ""
    logo_url = design_data.get("logo_url")
    template = design_data.get("template") or "classic"

    c = canvas.Canvas(output_path, pagesize=A4)
    c.setTitle(f"Katalog — {company}" if company else "Katalog")

    for page in pages:
        page_type = page.get("type", "product")

        if page_type == "cover":
            _draw_cover(c, page, theme, logo_url, template)
        elif page_type == "product":
            _draw_product_page(c, page, theme)
        elif page_type == "gallery":
            _draw_gallery_page(c, page, theme)
        elif page_type == "text":
            _draw_text_page(c, page, theme)
        elif page_type == "backcover":
            _draw_backcover(c, page, theme, logo_url)
        else:
            _draw_product_page(c, page, theme)

        c.showPage()

    c.save()
