"""Generate a printable PDF for a photo album order."""
from io import BytesIO
from reportlab.lib.pagesizes import A4, landscape, A5
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from storage import fetch_bytes


def _resolve_size(size_label: str):
    """Map cart size labels to ReportLab page tuples (width, height in points)."""
    if not size_label:
        return landscape(A4)
    s = size_label.lower()
    if "stående" in s or "portrait" in s:
        return A4
    if "kvadrat" in s or "square" in s:
        return A5
    if "30" in s:
        return (300 * mm, 300 * mm)
    return landscape(A4)


def _draw_image_fit(c, data: bytes, x: float, y: float, w: float, h: float):
    """Draw image stretched to fit (cover) — bytes wrapped via PIL ImageReader."""
    if not data:
        return
    try:
        from reportlab.lib.utils import ImageReader
        reader = ImageReader(BytesIO(data))
        c.drawImage(reader, x, y, w, h, preserveAspectRatio=True, anchor="c", mask="auto")
    except Exception:
        pass


def _draw_caption(c, text: str, cx: float, cy: float, w: float):
    if not text:
        return
    c.setFillColor(colors.black)
    c.setFont("Helvetica", 10)
    text = text[:80]
    c.drawCentredString(cx, cy, text)


def _draw_layout(c, layout_id: str, image_urls, captions, x: float, y: float, w: float, h: float):
    """Draw images according to layout id used in editor."""
    images = [fetch_bytes(u) for u in (image_urls or [])]
    pad = 5 * mm
    if layout_id == "single" or len(images) == 1:
        _draw_image_fit(c, images[0] if images else None, x + pad, y + pad, w - 2 * pad, h - 2 * pad)
    elif layout_id == "double":  # 2 side-by-side
        cw = (w - 3 * pad) / 2
        for i in range(min(2, len(images))):
            _draw_image_fit(c, images[i], x + pad + i * (cw + pad), y + pad, cw, h - 2 * pad)
    elif layout_id == "stacked":  # 2 stacked
        ch = (h - 3 * pad) / 2
        for i in range(min(2, len(images))):
            _draw_image_fit(c, images[i], x + pad, y + pad + (1 - i) * (ch + pad), w - 2 * pad, ch)
    elif layout_id == "one_two":  # 1 big + 2 small
        big_w = (w - 3 * pad) * 0.55
        small_w = (w - 3 * pad) * 0.45
        if images:
            _draw_image_fit(c, images[0], x + pad, y + pad, big_w, h - 2 * pad)
        sh = (h - 3 * pad) / 2
        for i in range(1, min(3, len(images))):
            _draw_image_fit(c, images[i], x + 2 * pad + big_w, y + pad + (2 - i) * (sh + pad), small_w, sh)
    elif layout_id == "grid":  # 2x2
        cw = (w - 3 * pad) / 2
        ch = (h - 3 * pad) / 2
        for i in range(min(4, len(images))):
            row, col = i // 2, i % 2
            _draw_image_fit(c, images[i], x + pad + col * (cw + pad),
                            y + pad + (1 - row) * (ch + pad), cw, ch)
    else:
        _draw_image_fit(c, images[0] if images else None, x + pad, y + pad, w - 2 * pad, h - 2 * pad)

    # Captions below each image — simple version, only for single layout
    if layout_id == "single" and captions and captions[0]:
        _draw_caption(c, captions[0], x + w / 2, y + pad / 2, w - 2 * pad)


def generate_photoalbum_pdf(customization: dict, output_path: str) -> str:
    """Render the album: cover + N inner pages."""
    page_size = _resolve_size(customization.get("size", ""))
    c = canvas.Canvas(output_path, pagesize=page_size)
    pw, ph = page_size

    # Cover page
    cover_url = customization.get("cover_image_url")
    if cover_url:
        cover_bytes = fetch_bytes(cover_url)
        _draw_image_fit(c, cover_bytes, 10 * mm, 10 * mm, pw - 20 * mm, ph - 30 * mm)
    cover_text = customization.get("cover_text")
    if cover_text:
        c.setFillColor(colors.black)
        c.setFont("Helvetica-Bold", 18)
        c.drawCentredString(pw / 2, 14 * mm, cover_text[:80])
    c.showPage()

    # Inner pages
    for page in customization.get("pages", []) or []:
        _draw_layout(
            c,
            page.get("layout", "single"),
            page.get("image_urls", []),
            page.get("captions", []),
            0, 0, pw, ph,
        )
        c.setFillColor(colors.grey)
        c.setFont("Helvetica", 8)
        c.drawCentredString(pw / 2, 6 * mm, f"Sida {page.get('page_number', '')}")
        c.showPage()

    c.save()
    return output_path
