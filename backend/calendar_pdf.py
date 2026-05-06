"""
Calendar PDF Generator
Generates a 12-page calendar with user images and month grids.
"""
import calendar
import os
from pathlib import Path
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white, black
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

PAGE_W, PAGE_H = A4
DESK_PAGE_W, DESK_PAGE_H = landscape(A4)

MONTHS_SV = [
    'Januari', 'Februari', 'Mars', 'April',
    'Maj', 'Juni', 'Juli', 'Augusti',
    'September', 'Oktober', 'November', 'December'
]

DAYS_SV = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']

# Colors
HEADER_BG = HexColor("#1a1a2e")
HEADER_TEXT = white
DAY_HEADER_BG = HexColor("#2a9d8f")
DAY_HEADER_TEXT = white
WEEKEND_TEXT = HexColor("#E53935")
GRID_LINE = HexColor("#e2e8f0")
DAY_TEXT = HexColor("#1e293b")
SUBTLE_TEXT = HexColor("#94a3b8")

UPLOADS_DIR = Path(os.path.dirname(__file__)) / "uploads"


def _draw_text_overlay(c, month_data, cal_h, img_h):
    """Draw user text on the image area at the specified position."""
    if not month_data:
        return
    text = month_data.get("text", "")
    if not text:
        return
    pos = month_data.get("textPos", {"x": 50, "y": 85})
    color = month_data.get("textColor", "#FFFFFF")
    font_size = month_data.get("fontSize", 24)
    
    # Convert % position to PDF coordinates
    x = (pos.get("x", 50) / 100) * PAGE_W
    y = cal_h + img_h - (pos.get("y", 85) / 100) * img_h  # flip Y axis
    
    # Draw text shadow first
    c.saveState()
    c.setFillColor(HexColor("#000000"))
    c.setFont("Helvetica-Bold", font_size)
    c.setFillAlpha(0.5)
    c.drawCentredString(x + 1.5, y - 1.5, text)
    c.restoreState()
    
    # Draw main text
    c.saveState()
    try:
        c.setFillColor(HexColor(color))
    except Exception:
        c.setFillColor(white)
    c.setFont("Helvetica-Bold", font_size)
    c.drawCentredString(x, y, text)
    c.restoreState()


def _draw_desk_month_page(c, year: int, month_index: int, image_path: str = None, month_data: dict = None):
    """Desk calendar layout: landscape A4, image on LEFT half, month grid on RIGHT half.
    Classic A-frame desk calendar with spiral holes at the top edge."""
    month_num = month_index + 1
    month_name = MONTHS_SV[month_index]
    pw, ph = DESK_PAGE_W, DESK_PAGE_H

    margin_top = 18 * mm  # reserved for spiral binding
    content_h = ph - margin_top
    image_w = pw * 0.5
    cal_x = image_w
    cal_w = pw - image_w

    # ── Image area (left half) ───────────────────────────────────
    if image_path and os.path.exists(image_path):
        try:
            img = ImageReader(image_path)
            iw, ih = img.getSize()
            scale = max(image_w / iw, content_h / ih)
            draw_w, draw_h = iw * scale, ih * scale
            img_pos = (month_data or {}).get("imagePos") or {"x": 50, "y": 50}
            fx = max(0.0, min(100.0, float(img_pos.get("x", 50)))) / 100.0
            fy = max(0.0, min(100.0, float(img_pos.get("y", 50)))) / 100.0
            extra_w = draw_w - image_w
            extra_h = draw_h - content_h
            x_pos = -extra_w * fx
            y_pos = -extra_h * (1 - fy)
            c.saveState()
            p = c.beginPath()
            p.rect(0, 0, image_w, content_h)
            c.clipPath(p, stroke=0)
            c.drawImage(img, x_pos, y_pos, draw_w, draw_h)
            c.restoreState()
        except Exception:
            c.setFillColor(HexColor("#f1f5f9"))
            c.rect(0, 0, image_w, content_h, fill=1, stroke=0)
    else:
        c.setFillColor(HexColor("#f1f5f9"))
        c.rect(0, 0, image_w, content_h, fill=1, stroke=0)
        c.setFillColor(SUBTLE_TEXT)
        c.setFont("Helvetica", 14)
        c.drawCentredString(image_w / 2, content_h / 2, "Ingen bild")

    # ── Month name — big script-style header on right side ──────
    c.setFillColor(HexColor("#1e293b"))
    c.setFont("Helvetica-BoldOblique", 48)
    header_y = content_h - 32 * mm
    c.drawString(cal_x + 15 * mm, header_y, month_name)
    c.setFont("Helvetica", 22)
    c.setFillColor(SUBTLE_TEXT)
    # Year number to the right of month
    c.drawRightString(pw - 15 * mm, header_y, str(year))

    # ── Day header ───────────────────────────────────────────────
    day_row_y = header_y - 18 * mm
    col_w = (cal_w - 30 * mm) / 7
    c.setFillColor(HexColor("#1e293b"))
    c.setFont("Helvetica-Bold", 12)
    for i, day in enumerate(['M', 'T', 'O', 'T', 'F', 'L', 'S']):
        is_weekend = i >= 5
        c.setFillColor(WEEKEND_TEXT if is_weekend else HexColor("#1e293b"))
        x = cal_x + 15 * mm + i * col_w + col_w / 2
        c.drawCentredString(x, day_row_y, day)

    # Horizontal rule under headers
    c.setStrokeColor(GRID_LINE)
    c.setLineWidth(0.5)
    c.line(cal_x + 15 * mm, day_row_y - 3 * mm, pw - 15 * mm, day_row_y - 3 * mm)

    # ── Calendar grid — plain numbers in 6-row grid ──────────────
    cal_grid = calendar.Calendar(firstweekday=0)
    month_days = cal_grid.monthdayscalendar(year, month_num)
    rows = len(month_days)
    grid_top_y = day_row_y - 8 * mm
    grid_bottom_y = 18 * mm
    row_h = (grid_top_y - grid_bottom_y) / max(rows, 1)

    c.setFont("Helvetica", 20)
    for row_idx, week in enumerate(month_days):
        row_center_y = grid_top_y - (row_idx + 0.5) * row_h
        for col_idx, day in enumerate(week):
            if day == 0:
                continue
            x = cal_x + 15 * mm + col_idx * col_w + col_w / 2
            if col_idx >= 5:
                c.setFillColor(WEEKEND_TEXT)
            else:
                c.setFillColor(HexColor("#1e293b"))
            c.drawCentredString(x, row_center_y - 3 * mm, str(day))

    # ── Spiral-binding holes strip on the top ────────────────────
    c.setFillColor(HexColor("#f8fafc"))
    c.rect(0, ph - margin_top, pw, margin_top, fill=1, stroke=0)
    # Draw small dots/circles to suggest spiral binding
    c.setFillColor(HexColor("#94a3b8"))
    n_holes = 28
    for i in range(n_holes):
        hx = (i + 0.5) * (pw / n_holes)
        hy = ph - margin_top / 2
        c.circle(hx, hy, 2.0, fill=1, stroke=0)


def _draw_month_page(c, year: int, month_index: int, image_path: str = None, month_data: dict = None, layout: str = "standard"):
    """Draw a single calendar month page.

    layout:
      - "standard" / "family": image top 40%, calendar grid bottom 60% (portrait)
      - "desk": landscape A-frame with image on left and grid on right (see _draw_desk_month_page)
    """
    if (layout or "standard").lower() == "desk":
        return _draw_desk_month_page(c, year, month_index, image_path, month_data)

    month_num = month_index + 1
    month_name = MONTHS_SV[month_index]

    # Layout: image top 40%, calendar bottom 60% — calendar is visually dominant
    img_h = PAGE_H * 0.40
    cal_h = PAGE_H * 0.60

    # ── Image area ────────────────────────────────────────────────
    if image_path and os.path.exists(image_path):
        try:
            img = ImageReader(image_path)
            iw, ih = img.getSize()
            # Cover mode: fill the image area entirely (may crop)
            scale = max(PAGE_W / iw, img_h / ih)
            draw_w = iw * scale
            draw_h = ih * scale
            # Image focal point from user's drag-positioning (0-100%)
            img_pos = (month_data or {}).get("imagePos") or {"x": 50, "y": 50}
            focal_x = max(0.0, min(100.0, float(img_pos.get("x", 50)))) / 100.0
            focal_y = max(0.0, min(100.0, float(img_pos.get("y", 50)))) / 100.0
            # Compute offset so the focal point of the source image aligns with the same
            # focal point of the visible area (CSS object-position semantics).
            extra_w = draw_w - PAGE_W
            extra_h = draw_h - img_h
            x_pos = -extra_w * focal_x
            # ReportLab Y grows upward; CSS Y grows downward → invert
            y_pos = cal_h - extra_h * (1 - focal_y)
            # Clip to the image zone so any overflow is hidden
            c.saveState()
            p = c.beginPath()
            p.rect(0, cal_h, PAGE_W, img_h)
            c.clipPath(p, stroke=0)
            c.drawImage(img, x_pos, y_pos, draw_w, draw_h)
            # Draw text overlay if present
            _draw_text_overlay(c, month_data, cal_h, img_h)
            c.restoreState()
        except Exception:
            # Draw placeholder
            c.setFillColor(HexColor("#f1f5f9"))
            c.rect(0, cal_h, PAGE_W, img_h, fill=1, stroke=0)
            c.setFillColor(SUBTLE_TEXT)
            c.setFont("Helvetica", 14)
            c.drawCentredString(PAGE_W / 2, cal_h + img_h / 2, "Ingen bild")
    else:
        c.setFillColor(HexColor("#f1f5f9"))
        c.rect(0, cal_h, PAGE_W, img_h, fill=1, stroke=0)
        c.setFillColor(SUBTLE_TEXT)
        c.setFont("Helvetica", 14)
        c.drawCentredString(PAGE_W / 2, cal_h + img_h / 2, "Ingen bild")

    # ── Month header ──────────────────────────────────────────────
    header_h = 14 * mm
    header_y = cal_h - header_h
    c.setFillColor(HEADER_BG)
    c.rect(0, cal_h - header_h, PAGE_W, header_h, fill=1, stroke=0)
    c.setFillColor(HEADER_TEXT)
    c.setFont("Helvetica-Bold", 18)
    c.drawCentredString(PAGE_W / 2, cal_h - header_h + 4 * mm, f"{month_name} {year}")

    # ── Day headers ───────────────────────────────────────────────
    day_header_h = 8 * mm
    day_header_y = header_y - day_header_h
    c.setFillColor(DAY_HEADER_BG)
    c.rect(0, day_header_y, PAGE_W, day_header_h, fill=1, stroke=0)

    col_w = PAGE_W / 7
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(DAY_HEADER_TEXT)
    for i, day in enumerate(DAYS_SV):
        x = i * col_w + col_w / 2
        c.drawCentredString(x, day_header_y + 2.5 * mm, day)

    # ── Calendar grid ─────────────────────────────────────────────
    cal = calendar.Calendar(firstweekday=0)  # Monday first
    month_days = cal.monthdayscalendar(year, month_num)

    rows = len(month_days)
    grid_top = day_header_y
    grid_h = grid_top  # from 0 to grid_top
    row_h = grid_h / max(rows, 1)

    for row_idx, week in enumerate(month_days):
        row_y = grid_top - (row_idx + 1) * row_h

        # Row background (alternate)
        if row_idx % 2 == 0:
            c.setFillColor(HexColor("#ffffff"))
        else:
            c.setFillColor(HexColor("#f8fafc"))
        c.rect(0, row_y, PAGE_W, row_h, fill=1, stroke=0)

        # Grid lines
        c.setStrokeColor(GRID_LINE)
        c.setLineWidth(0.3)
        c.line(0, row_y, PAGE_W, row_y)

        for col_idx, day in enumerate(week):
            if day == 0:
                continue

            # Weekend days (Sat=5, Sun=6) in red
            if col_idx >= 5:
                c.setFillColor(WEEKEND_TEXT)
            else:
                c.setFillColor(DAY_TEXT)

            # Number in top-left corner of cell — leaves room for notes
            c.setFont("Helvetica-Bold", 11)
            x = col_idx * col_w + 3 * mm
            y = row_y + row_h - 5 * mm
            c.drawString(x, y, str(day))

    # Vertical grid lines
    c.setStrokeColor(GRID_LINE)
    c.setLineWidth(0.3)
    for i in range(1, 7):
        x = i * col_w
        c.line(x, 0, x, grid_top)

    # Bottom border
    c.line(0, 0, PAGE_W, 0)
    c.rect(0, 0, PAGE_W, grid_top, fill=0, stroke=1)


def generate_calendar_pdf(year: int, months_data: list, output_path: str, layout: str = "standard"):
    """
    Generate a full 12-month calendar PDF.

    Args:
        year: The calendar year
        months_data: List of 12 dicts with keys: month, hasImage, image_url
        output_path: Where to save the PDF
        layout: "standard" / "family" (portrait) or "desk" (landscape A-frame)
    """
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    is_desk = (layout or "standard").lower() == "desk"
    page_size = landscape(A4) if is_desk else A4
    c = canvas.Canvas(output_path, pagesize=page_size)

    for i in range(12):
        if i > 0:
            c.showPage()

        image_path = None
        month_data = None
        if i < len(months_data):
            month_data = months_data[i]
            img_url = month_data.get("image_url")
            if img_url:
                from storage import fetch_to_tempfile
                image_path = fetch_to_tempfile(img_url, suffix=".jpg")

        _draw_month_page(c, year, i, image_path, month_data, layout)

    c.save()
    return output_path
