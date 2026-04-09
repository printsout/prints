"""
Calendar PDF Generator
Generates a 12-page calendar with user images and month grids.
"""
import calendar
import os
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white, black
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

PAGE_W, PAGE_H = A4

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


def _draw_month_page(c, year: int, month_index: int, image_path: str = None):
    """Draw a single calendar month page."""
    month_num = month_index + 1
    month_name = MONTHS_SV[month_index]

    # Layout: image top 60%, calendar bottom 40%
    img_h = PAGE_H * 0.60
    cal_h = PAGE_H * 0.40
    cal_y_start = cal_h  # bottom of calendar area is 0, top is cal_h

    # ── Image area ────────────────────────────────────────────────
    if image_path and os.path.exists(image_path):
        try:
            img = ImageReader(image_path)
            iw, ih = img.getSize()
            # Scale to fill width
            scale = PAGE_W / iw
            draw_h = ih * scale
            # Clip to image area and center vertically
            c.saveState()
            p = c.beginPath()
            p.rect(0, cal_h, PAGE_W, img_h)
            c.clipPath(p, stroke=0)
            if draw_h >= img_h:
                # Image taller than area — center vertically
                y_pos = cal_h + (img_h - draw_h) / 2
            else:
                # Image shorter than area — center with gray padding
                c.setFillColor(HexColor("#f1f5f9"))
                c.rect(0, cal_h, PAGE_W, img_h, fill=1, stroke=0)
                y_pos = cal_h + (img_h - draw_h) / 2
            c.drawImage(img, 0, y_pos, PAGE_W, draw_h)
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

    c.setFont("Helvetica", 11)

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
            x = col_idx * col_w + col_w / 2
            y = row_y + row_h / 2 - 2

            # Weekend days (Sat=5, Sun=6) in red
            if col_idx >= 5:
                c.setFillColor(WEEKEND_TEXT)
            else:
                c.setFillColor(DAY_TEXT)

            c.setFont("Helvetica", 11)
            c.drawCentredString(x, y, str(day))

    # Vertical grid lines
    c.setStrokeColor(GRID_LINE)
    c.setLineWidth(0.3)
    for i in range(1, 7):
        x = i * col_w
        c.line(x, 0, x, grid_top)

    # Bottom border
    c.line(0, 0, PAGE_W, 0)
    c.rect(0, 0, PAGE_W, grid_top, fill=0, stroke=1)


def generate_calendar_pdf(year: int, months_data: list, output_path: str):
    """
    Generate a full 12-month calendar PDF.

    Args:
        year: The calendar year
        months_data: List of 12 dicts with keys: month, hasImage, image_url
        output_path: Where to save the PDF
    """
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    c = canvas.Canvas(output_path, pagesize=A4)

    for i in range(12):
        if i > 0:
            c.showPage()

        image_path = None
        if i < len(months_data):
            img_url = months_data[i].get("image_url")
            if img_url:
                # Extract filename from URL path like /api/uploads/abc.jpg
                filename = img_url.split("/")[-1]
                candidate = UPLOADS_DIR / filename
                if candidate.exists():
                    image_path = str(candidate)

        _draw_month_page(c, year, i, image_path)

    c.save()
    return output_path
