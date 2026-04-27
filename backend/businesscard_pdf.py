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
UPLOADS_DIR = Path(os.path.dirname(__file__)) / "uploads"

# Default font sizes (can be overridden via admin settings)
DEFAULT_FS = {
    "name": 10, "title": 7, "company": 6, "contact": 6, "icon": 5.5,
}


# ─── Shared helpers ───

def _draw_logo(c, logo_path, x, y, w, h, **kwargs):
    """Safely draw a logo image. Returns True if drawn."""
    if not logo_path or not os.path.exists(logo_path):
        return False
    try:
        c.drawImage(ImageReader(logo_path), x, y, w, h,
                     preserveAspectRatio=True, mask="auto", **kwargs)
        return True
    except Exception:
        return False


def _draw_contact_lines(c, lines, x, y, spacing=3.2 * mm, align="left"):
    """Draw a list of contact lines vertically. Returns final y."""
    for line in lines:
        if line:
            if align == "center":
                c.drawCentredString(x, y, line)
            elif align == "right":
                c.drawRightString(x, y, line)
            else:
                c.drawString(x, y, line)
            y -= spacing
    return y


# ─── Template renderers ───

def _draw_modern(c, x, y, d, accent, logo_path, fs):
    top_h = CARD_H * 0.38
    c.setFillColor(accent)
    c.rect(x, y + CARD_H - top_h, CARD_W, top_h, fill=1, stroke=0)
    if not _draw_logo(c, logo_path, x + CARD_W / 2 - 11 * mm,
                      y + CARD_H - top_h / 2 - 4.5 * mm, 22 * mm, 9 * mm, anchor="c"):
        if d["company"]:
            c.setFillColor(white)
            c.setFont("Helvetica-Bold", fs["company"] + 2)
            c.drawCentredString(x + CARD_W / 2, y + CARD_H - top_h / 2 - 3, d["company"])
    bottom_h = CARD_H - top_h
    mid_x = x + CARD_W / 2
    c.setFillColor(HexColor("#1e293b"))
    c.setFont("Helvetica-Bold", fs["name"])
    c.drawCentredString(mid_x, y + bottom_h - 8 * mm, d["name"])
    c.setFillColor(accent)
    c.setFont("Helvetica", fs["title"])
    c.drawCentredString(mid_x, y + bottom_h - 12 * mm, d["title"])
    c.setFont("Helvetica", fs["company"])
    c.setFillColor(HexColor("#475569"))
    _draw_contact_lines(c, [d["phone"], d["email"], d["website"]],
                        mid_x, y + bottom_h - 17 * mm, align="center")


def _draw_classic(c, x, y, d, accent, logo_path, fs):
    c.setFillColor(accent)
    c.rect(x, y, 2 * mm, CARD_H, fill=1, stroke=0)
    lx = x + 6 * mm
    logo_bottom = y + CARD_H - 12 * mm
    if _draw_logo(c, logo_path, lx, y + CARD_H - 12 * mm, 20 * mm, 10 * mm, anchor="sw"):
        logo_bottom = y + CARD_H - 16 * mm
    c.setFillColor(HexColor("#1e293b"))
    c.setFont("Helvetica-Bold", fs["name"])
    c.drawString(lx, logo_bottom, d["name"])
    c.setFillColor(accent)
    c.setFont("Helvetica", fs["company"] + 0.5)
    c.drawString(lx, logo_bottom - 4 * mm, d["title"])
    if d["company"]:
        c.setFillColor(HexColor("#64748b"))
        c.setFont("Helvetica", fs["company"])
        c.drawString(lx, logo_bottom - 8 * mm, d["company"])
    cy = y + 10 * mm
    c.setFont("Helvetica", fs["company"])
    c.setFillColor(HexColor("#475569"))
    lines = []
    if d["phone"] and d["email"]:
        lines.append(f"{d['phone']}  |  {d['email']}")
    else:
        lines.extend(filter(None, [d["phone"], d["email"]]))
    if d["website"] and d["address"]:
        lines.append(f"{d['website']}  |  {d['address']}")
    else:
        lines.extend(filter(None, [d["website"], d["address"]]))
    _draw_contact_lines(c, lines, lx, cy, spacing=3.5 * mm)


def _draw_minimal(c, x, y, d, accent, logo_path, fs):
    c.setStrokeColor(accent)
    c.setLineWidth(1)
    c.line(x + 5 * mm, y + 3 * mm, x + CARD_W - 5 * mm, y + 3 * mm)
    c.setFillColor(HexColor("#1e293b"))
    c.setFont("Helvetica-Bold", fs["name"])
    c.drawString(x + 5 * mm, y + CARD_H - 10 * mm, d["name"])
    c.setFillColor(HexColor("#94a3b8"))
    c.setFont("Helvetica", fs["company"] + 0.5)
    c.drawString(x + 5 * mm, y + CARD_H - 14 * mm, d["title"])
    rx = x + CARD_W - 5 * mm
    c.setFont("Helvetica", fs["company"])
    c.setFillColor(HexColor("#475569"))
    _draw_contact_lines(c, [d["email"], d["phone"], d["website"]],
                        rx, y + CARD_H - 10 * mm, spacing=3.5 * mm, align="right")
    if d["company"]:
        c.setFillColor(HexColor("#64748b"))
        c.setFont("Helvetica", fs["company"])
        c.drawString(x + 5 * mm, y + 7 * mm, d["company"])
    _draw_logo(c, logo_path, rx - 20 * mm, y + 4 * mm, 18 * mm, 9 * mm, anchor="c")


def _draw_elegant(c, x, y, d, accent, logo_path, fs):
    c.setFillColor(HexColor("#1a1a2e"))
    c.roundRect(x, y, CARD_W, CARD_H, 2 * mm, fill=1, stroke=0)
    c.setFillColor(accent)
    c.setFillAlpha(0.08)
    c.circle(x + CARD_W - 8 * mm, y + CARD_H - 4 * mm, 18 * mm, fill=1, stroke=0)
    c.setFillAlpha(1)
    lx = x + 5 * mm
    _draw_logo(c, logo_path, lx, y + CARD_H - 11 * mm, 18 * mm, 8 * mm, anchor="sw")
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", fs["name"])
    c.drawString(lx, y + CARD_H - 17 * mm, d["name"])
    c.setFillColor(accent)
    c.setFont("Helvetica", fs["title"])
    c.drawString(lx, y + CARD_H - 21 * mm, d["title"])
    if d["company"]:
        c.setFillColor(HexColor("#94a3b8"))
        c.setFont("Helvetica", fs["company"])
        c.drawString(lx, y + CARD_H - 25 * mm, d["company"])
    c.setStrokeColor(accent)
    c.setLineWidth(0.5)
    c.line(lx, y + 14 * mm, lx + 10 * mm, y + 14 * mm)
    c.setFont("Helvetica", fs["icon"])
    c.setFillColor(HexColor("#94a3b8"))
    _draw_contact_lines(c, [d["phone"], d["email"], d["website"]],
                        lx, y + 11 * mm, spacing=3 * mm)


def _draw_creative(c, x, y, d, accent, logo_path, fs):
    c.setFillColor(accent)
    c.rect(x, y + CARD_H - 2 * mm, CARD_W, 2 * mm, fill=1, stroke=0)
    c.setFillColor(accent)
    c.setFillAlpha(0.06)
    c.circle(x + CARD_W - 6 * mm, y + CARD_H - 10 * mm, 14 * mm, fill=1, stroke=0)
    c.circle(x + 8 * mm, y + 6 * mm, 10 * mm, fill=1, stroke=0)
    c.setFillAlpha(1)
    lx = x + 5 * mm
    c.setFillColor(HexColor("#1e293b"))
    c.setFont("Helvetica-Bold", fs["name"])
    c.drawString(lx, y + CARD_H - 10 * mm, d["name"])
    c.setFillColor(accent)
    c.setFont("Helvetica", fs["title"])
    c.drawString(lx, y + CARD_H - 14 * mm, d["title"])
    _draw_logo(c, logo_path, x + CARD_W - 24 * mm, y + CARD_H - 13 * mm, 18 * mm, 9 * mm, anchor="c")
    c.setFont("Helvetica", fs["icon"])
    c.setFillColor(HexColor("#475569"))
    _draw_contact_lines(c, [d["phone"], d["email"]], lx, y + 10 * mm, spacing=3 * mm)
    _draw_contact_lines(c, [d["website"], d["address"]],
                        x + CARD_W - 5 * mm, y + 10 * mm, spacing=3 * mm, align="right")


def _draw_corporate(c, x, y, d, accent, logo_path, fs):
    panel_w = CARD_W * 0.35
    c.setFillColor(accent)
    c.rect(x, y, panel_w, CARD_H, fill=1, stroke=0)
    if not _draw_logo(c, logo_path, x + panel_w / 2 - 10 * mm,
                      y + CARD_H / 2 - 5 * mm, 20 * mm, 10 * mm, anchor="c"):
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", fs["name"] * 1.8)
        initial = (d["company"] or d["name"] or "A")[0].upper()
        c.drawCentredString(x + panel_w / 2, y + CARD_H / 2 - 3, initial)
    rx = x + panel_w + 4 * mm
    if d["company"]:
        c.setFillColor(accent)
        c.setFont("Helvetica-Bold", fs["icon"])
        c.drawString(rx, y + CARD_H - 7 * mm, d["company"].upper())
    c.setFillColor(HexColor("#1e293b"))
    c.setFont("Helvetica-Bold", fs["name"] - 1)
    c.drawString(rx, y + CARD_H - 13 * mm, d["name"])
    c.setFillColor(HexColor("#64748b"))
    c.setFont("Helvetica", fs["company"])
    c.drawString(rx, y + CARD_H - 17 * mm, d["title"])
    c.setFont("Helvetica", fs["icon"])
    c.setFillColor(HexColor("#475569"))
    _draw_contact_lines(c, [d["phone"], d["email"], d["website"]],
                        rx, y + 10 * mm, spacing=3 * mm)


def _draw_nature(c, x, y, d, accent, logo_path, fs):
    c.setFillColor(HexColor("#f0fdf4"))
    c.roundRect(x, y, CARD_W, CARD_H, 2 * mm, fill=1, stroke=0)
    c.setFillColor(HexColor("#dcfce7"))
    c.setFillAlpha(0.5)
    c.roundRect(x, y, CARD_W, CARD_H / 2, 0, fill=1, stroke=0)
    c.setFillAlpha(1)
    lx = x + 5 * mm
    _draw_logo(c, logo_path, lx, y + CARD_H - 12 * mm, 18 * mm, 8 * mm, anchor="sw")
    c.setFillColor(HexColor("#14532d"))
    c.setFont("Helvetica-Bold", fs["name"])
    c.drawString(lx, y + CARD_H - 18 * mm, d["name"])
    c.setFillColor(HexColor("#15803d"))
    c.setFont("Helvetica", fs["title"])
    c.drawString(lx, y + CARD_H - 22 * mm, d["title"])
    if d["company"]:
        c.setFillColor(HexColor("#16a34a"))
        c.setFillAlpha(0.7)
        c.setFont("Helvetica", fs["company"])
        c.drawString(lx, y + CARD_H - 26 * mm, d["company"])
        c.setFillAlpha(1)
    c.setStrokeColor(HexColor("#86efac"))
    c.setLineWidth(0.5)
    c.line(lx, y + 13 * mm, lx + 12 * mm, y + 13 * mm)
    c.setFont("Helvetica", fs["icon"])
    c.setFillColor(HexColor("#166534"))
    c.setFillAlpha(0.6)
    _draw_contact_lines(c, [d["phone"], d["email"], d["website"]],
                        lx, y + 10 * mm, spacing=3 * mm)
    c.setFillAlpha(1)


def _draw_tech(c, x, y, d, accent, logo_path, fs):
    c.setFillColor(HexColor("#0f172a"))
    c.roundRect(x, y, CARD_W, CARD_H, 2 * mm, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFillAlpha(0.04)
    for dx in range(0, int(CARD_W / (3 * mm))):
        for dy in range(0, int(CARD_H / (3 * mm))):
            c.circle(x + 2 * mm + dx * 3 * mm, y + 2 * mm + dy * 3 * mm, 0.3, fill=1, stroke=0)
    c.setFillAlpha(1)
    lx = x + 5 * mm
    c.setFillColor(white)
    c.setFont("Courier-Bold", fs["name"])
    c.drawString(lx, y + CARD_H - 10 * mm, d["name"])
    c.setFillColor(accent)
    c.setFont("Courier", fs["title"])
    c.drawString(lx, y + CARD_H - 14 * mm, d["title"])
    if d["company"]:
        c.setFillColor(HexColor("#64748b"))
        c.setFont("Courier", fs["company"])
        c.drawString(lx, y + CARD_H - 18 * mm, d["company"])
    _draw_logo(c, logo_path, x + CARD_W - 22 * mm, y + CARD_H - 12 * mm, 16 * mm, 8 * mm, anchor="c")
    c.setStrokeColor(accent)
    c.setLineWidth(0.7)
    c.line(lx, y + 13 * mm, x + CARD_W / 2, y + 13 * mm)
    cy = y + 10 * mm
    c.setFont("Courier", fs["icon"])
    for line in [d["phone"], d["email"], d["website"]]:
        if line:
            c.setFillColor(accent)
            c.drawString(lx, cy, "$")
            c.setFillColor(HexColor("#94a3b8"))
            c.drawString(lx + 3 * mm, cy, line)
            cy -= 3 * mm


# ─── Template dispatch ───

_TEMPLATE_RENDERERS = {
    "modern": _draw_modern,
    "classic": _draw_classic,
    "minimal": _draw_minimal,
    "elegant": _draw_elegant,
    "creative": _draw_creative,
    "corporate": _draw_corporate,
    "nature": _draw_nature,
    "tech": _draw_tech,
}


def _draw_card(c, x, y, card_details, template, color, logo_path=None, fs=None):
    """Draw a single business card at position (x, y)."""
    accent = HexColor(color or "#2a9d8f")
    d = {k: card_details.get(k, "") for k in
         ("name", "title", "company", "phone", "email", "website", "address")}
    if fs is None:
        fs = DEFAULT_FS

    c.saveState()
    c.setFillColor(white)
    c.setStrokeColor(HexColor("#e2e8f0"))
    c.setLineWidth(0.5)
    c.roundRect(x, y, CARD_W, CARD_H, 2 * mm, fill=1, stroke=1)

    renderer = _TEMPLATE_RENDERERS.get(template, _draw_classic)
    renderer(c, x, y, d, accent, logo_path, fs)

    c.restoreState()


def _draw_cut_marks(c_pdf, cx, cy):
    """Draw cut marks around a card position."""
    c_pdf.setStrokeColor(HexColor("#cbd5e1"))
    c_pdf.setLineWidth(0.25)
    mark = 3 * mm
    for mx, my in [(cx, cy), (cx + CARD_W, cy), (cx, cy + CARD_H), (cx + CARD_W, cy + CARD_H)]:
        c_pdf.line(mx - mark, my, mx - 1, my)
        c_pdf.line(mx + 1, my, mx + mark, my)
        c_pdf.line(mx, my - mark, mx, my - 1)
        c_pdf.line(mx, my + 1, mx, my + mark)


# ─── Back side renderers ───

def _draw_back_logo_only(c, x, y, d, accent, logo_path):
    """Back: just centered logo."""
    mid_x = x + CARD_W / 2
    mid_y = y + CARD_H / 2
    if _draw_logo(c, logo_path, mid_x - 12 * mm, mid_y - 6 * mm, 24 * mm, 12 * mm, anchor="c"):
        pass
    else:
        c.setFillColor(HexColor("#e2e8f0"))
        c.setFont("Helvetica-Bold", 9)
        c.drawCentredString(mid_x, mid_y - 3, d.get("company", ""))


def _draw_back_logo_tagline(c, x, y, d, accent, logo_path, tagline=""):
    """Back: logo + tagline text."""
    mid_x = x + CARD_W / 2
    _draw_logo(c, logo_path, mid_x - 12 * mm, y + CARD_H / 2, 24 * mm, 12 * mm, anchor="c")
    if tagline:
        c.setFillColor(HexColor("#64748b"))
        c.setFont("Helvetica", 6.5)
        c.drawCentredString(mid_x, y + CARD_H / 2 - 10 * mm, tagline)
    # Bottom accent line
    c.setFillColor(accent)
    c.setFillAlpha(0.3)
    c.rect(x + 10 * mm, y + 3 * mm, CARD_W - 20 * mm, 0.8, fill=1, stroke=0)
    c.setFillAlpha(1)


def _draw_back_solid_color(c, x, y, d, accent, logo_path):
    """Back: solid accent color with inverted logo."""
    c.setFillColor(accent)
    c.roundRect(x, y, CARD_W, CARD_H, 2 * mm, fill=1, stroke=0)
    if logo_path and os.path.exists(logo_path):
        _draw_logo(c, logo_path, x + CARD_W / 2 - 12 * mm, y + CARD_H / 2 - 6 * mm, 24 * mm, 12 * mm, anchor="c")


def _draw_back_minimal_info(c, x, y, d, accent, logo_path):
    """Back: centered contact info."""
    mid_x = x + CARD_W / 2
    cy = y + CARD_H / 2 + 8 * mm
    if d.get("company"):
        c.setFillColor(HexColor("#1e293b"))
        c.setFont("Helvetica-Bold", 8)
        c.drawCentredString(mid_x, cy, d["company"])
        cy -= 5 * mm
    # Accent divider
    c.setStrokeColor(accent)
    c.setLineWidth(0.5)
    c.line(mid_x - 5 * mm, cy, mid_x + 5 * mm, cy)
    cy -= 5 * mm
    # Contact lines
    c.setFont("Helvetica", 6)
    c.setFillColor(HexColor("#475569"))
    for line in [d.get("phone"), d.get("email"), d.get("website"), d.get("address")]:
        if line:
            c.drawCentredString(mid_x, cy, line)
            cy -= 3.2 * mm


def _draw_card_back(c, x, y, card_details, back_style, color, logo_path, tagline=""):
    """Draw a single back-side card at position (x, y)."""
    accent = HexColor(color or "#2a9d8f")
    d = {k: card_details.get(k, "") for k in
         ("name", "title", "company", "phone", "email", "website", "address")}

    c.saveState()
    if back_style != "solid_color":
        c.setFillColor(white)
        c.setStrokeColor(HexColor("#e2e8f0"))
        c.setLineWidth(0.5)
        c.roundRect(x, y, CARD_W, CARD_H, 2 * mm, fill=1, stroke=1)

    if back_style == "logo_tagline":
        _draw_back_logo_tagline(c, x, y, d, accent, logo_path, tagline)
    elif back_style == "solid_color":
        _draw_back_solid_color(c, x, y, d, accent, logo_path)
    elif back_style == "minimal_info":
        _draw_back_minimal_info(c, x, y, d, accent, logo_path)
    else:
        _draw_back_logo_only(c, x, y, d, accent, logo_path)

    c.restoreState()


# ─── Public API ───

def generate_businesscard_pdf(customization: dict, output_path: str, font_settings: dict = None) -> str:
    """
    Generate a printable PDF with business cards arranged on A4.
    Page 1: Front side (8 cards). Page 2: Back side (8 cards).
    """
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)

    card_details = customization.get("card_details", {})
    template = customization.get("template") or card_details.get("template", "classic")
    color = customization.get("color") or card_details.get("color", "#2a9d8f")
    back_style = customization.get("back_style", "logo_only")
    back_tagline = customization.get("back_tagline", "")
    back_color = customization.get("back_color", "") or color

    # Build font sizes from settings
    fs = dict(DEFAULT_FS)
    if font_settings:
        fs["name"] = font_settings.get("name_size", fs["name"])
        fs["title"] = font_settings.get("title_size", fs["title"])
        fs["company"] = font_settings.get("company_size", fs["company"])
        fs["contact"] = font_settings.get("contact_size", fs["contact"])
        fs["icon"] = font_settings.get("icon_size", fs["icon"])

    logo_path = None
    logo_url = customization.get("logo_url", "")
    if logo_url:
        filename = logo_url.split("/")[-1]
        candidate = UPLOADS_DIR / filename
        if candidate.exists() and candidate.stat().st_size > 100:
            logo_path = str(candidate)

    c_pdf = canvas.Canvas(output_path, pagesize=A4)

    cols, rows = 2, 4
    x_start = (PAGE_W - cols * CARD_W - (cols - 1) * 4 * mm) / 2
    y_start = PAGE_H - MARGIN - CARD_H

    # ─── Page 1: Front ───
    for row in range(rows):
        for col in range(cols):
            cx = x_start + col * (CARD_W + 4 * mm)
            cy = y_start - row * (CARD_H + 4 * mm)
            _draw_card(c_pdf, cx, cy, card_details, template, color, logo_path, fs)
            _draw_cut_marks(c_pdf, cx, cy)

    c_pdf.setFont("Helvetica", 7)
    c_pdf.setFillColor(HexColor("#94a3b8"))
    c_pdf.drawCentredString(PAGE_W / 2, 5 * mm,
        f"Visitkort — {card_details.get('name', '')} — FRAMSIDA — 8 st per A4")

    # ─── Page 2: Back ───
    c_pdf.showPage()
    for row in range(rows):
        for col in range(cols):
            cx = x_start + col * (CARD_W + 4 * mm)
            cy = y_start - row * (CARD_H + 4 * mm)
            _draw_card_back(c_pdf, cx, cy, card_details, back_style, back_color, logo_path, back_tagline)
            _draw_cut_marks(c_pdf, cx, cy)

    c_pdf.setFont("Helvetica", 7)
    c_pdf.setFillColor(HexColor("#94a3b8"))
    c_pdf.drawCentredString(PAGE_W / 2, 5 * mm,
        f"Visitkort — {card_details.get('name', '')} — BAKSIDA — 8 st per A4")

    c_pdf.save()
    return output_path
