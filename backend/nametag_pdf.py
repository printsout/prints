"""
Generate a printable A4 PDF with 140 name tag stickers (7 columns x 20 rows).
Each sticker is 30mm x 13mm, arranged on a 210x297mm A4 sheet.
"""
import os
import re
import tempfile
import requests
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white, black
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

FONT_CACHE_DIR = Path(tempfile.gettempdir()) / "nametag_fonts"
FONT_CACHE_DIR.mkdir(exist_ok=True)

# Sticker dimensions
STICKER_W = 29 * mm  # Slightly narrower to allow side margins
STICKER_H = 13 * mm
COLS = 7
ROWS = 20
TOTAL_STICKERS = COLS * ROWS  # 140

# A4 dimensions
PAGE_W, PAGE_H = A4  # 595.27, 841.89 points (210x297mm)

# Margins to center the grid (ensures printable area)
GRID_W = COLS * STICKER_W
GRID_H = ROWS * STICKER_H
MARGIN_LEFT = (PAGE_W - GRID_W) / 2
MARGIN_TOP = (PAGE_H - GRID_H) / 2

# Font family -> Google Fonts name mapping
GOOGLE_FONT_MAP = {
    "pacifico": "Pacifico",
    "patrickhand": "Patrick Hand",
    "permanentmarker": "Permanent Marker",
    "bubblegum": "Bubblegum Sans",
    "orbitron": "Orbitron",
    "roboto": "Roboto",
    "josefin": "Josefin Sans",
    "quicksand": "Quicksand",
    "bungee": "Bungee Shade",
    "poppins": "Poppins",
    "indieflower": "Indie Flower",
    "blackops": "Black Ops One",
}

# Background color map (matches frontend ALL_BACKGROUNDS)
BG_COLOR_MAP = {
    "white": "#FFFFFF", "teal": "#7BA5BA", "lilac": "#C8A2C8",
    "softpink": "#D3AEBF", "baby_blue": "#ADD8E6", "mint_green": "#98FF98",
    "peach": "#FFD7BE", "bright_red": "#E53935", "bright_blue": "#1E88E5",
    "bright_green": "#43A047", "bright_yellow": "#FDD835", "bright_orange": "#FB8C00",
    "bright_purple": "#8E24AA", "navy": "#000080", "black": "#000000",
    "dark_green": "#5A8E54", "dark_teal": "#00897B", "sky_orange": "#FF9800",
    "charcoal": "#546E7A",
    "p1": "#FBEAB4", "p2": "#FAEBD4", "p3": "#F9FAEC", "p4": "#F5EFE6",
    "p5": "#F2E8E6", "p6": "#EFD6D2", "p7": "#EEF1FF", "p8": "#E8DFCA",
    "p9": "#E3E0F8", "p10": "#E2E3E4", "p11": "#DEEFDC", "p12": "#D6ECFF",
    "p13": "#D0CDE8", "p14": "#B3CEAF", "p15": "#FFBB91", "p16": "#E4BEAD",
}

# Gradient backgrounds -> use first color
GRADIENT_MAP = {
    "rainbow_bg": "#fad0c4",
    "g1": "#667eea", "g2": "#f093fb", "g3": "#4facfe", "g4": "#43e97b",
    "g5": "#fa709a", "g6": "#a18cd1", "g7": "#ffecd2", "g8": "#89f7fe",
    "g9": "#fddb92", "g10": "#c1dfc4",
}

# Motif colors for vector drawing
MOTIF_COLORS = {
    "star": "#FFD700", "heart": "#E53935", "cat": "#FF8C00", "dog": "#8D6E63",
    "rabbit": "#F48FB1", "rainbow": "#FF6F00", "crown": "#FFC107",
    "rocket": "#1E88E5", "sparkles": "#AB47BC", "flower": "#E91E63",
    "fish": "#29B6F6", "bird": "#66BB6A", "bug": "#EF5350", "baby": "#F48FB1",
    "horse": "#795548", "footprints": "#8D6E63",
    "tree": "#2E7D32", "sun": "#FFB300", "moon": "#7E57C2", "cloud": "#42A5F5",
    "leaf": "#43A047", "snowflake": "#4FC3F7",
    "car": "#E53935", "plane": "#1565C0", "ship": "#00838F", "bike": "#43A047",
    "train": "#6D4C41",
    "trophy": "#FFB300", "medal": "#FFC107", "gamepad": "#7C4DFF",
    "football": "#1B5E20", "volleyball": "#FF9800", "dumbbell": "#546E7A",
    "target": "#E53935", "swords": "#78909C", "swimming": "#0288D1",
    "mountain": "#5D4037", "shield": "#1565C0", "flag": "#D32F2F",
    "weight": "#37474F", "running": "#FF5722",
    "gem": "#00BCD4", "music": "#9C27B0", "anchor": "#37474F",
    "skull": "#455A64", "ghost": "#7E57C2", "flame": "#FF5722", "zap": "#FFC107",
    "icecream": "#F48FB1", "cherry": "#D32F2F", "apple": "#4CAF50",
    "pizza": "#FF9800", "cake": "#EC407A",
}


def _download_google_font(font_id: str) -> str | None:
    """Download a Google Font TTF and return the local file path. Cached."""
    google_name = GOOGLE_FONT_MAP.get(font_id)
    if not google_name:
        return None

    cache_path = FONT_CACHE_DIR / f"{font_id}.ttf"
    if cache_path.exists():
        return str(cache_path)

    try:
        css_url = f"https://fonts.googleapis.com/css2?family={google_name.replace(' ', '+')}"
        resp = requests.get(css_url, headers={"User-Agent": "Mozilla/4.0"}, timeout=10)
        ttf_urls = re.findall(r"url\((https://fonts\.gstatic\.com/[^)]+\.ttf)\)", resp.text)
        if not ttf_urls:
            return None
        font_resp = requests.get(ttf_urls[0], timeout=15)
        font_resp.raise_for_status()
        cache_path.write_bytes(font_resp.content)
        return str(cache_path)
    except Exception as e:
        print(f"[FONT] Failed to download {google_name}: {e}")
        return None


def _register_font(c: canvas.Canvas, font_id: str) -> str:
    """Register a Google Font with reportlab and return the font name to use."""
    rl_name = f"gf_{font_id}"
    if rl_name in pdfmetrics.getRegisteredFontNames():
        return rl_name
    ttf_path = _download_google_font(font_id)
    if ttf_path:
        try:
            pdfmetrics.registerFont(TTFont(rl_name, ttf_path))
            return rl_name
        except Exception as e:
            print(f"[FONT] Failed to register {font_id}: {e}")
    return "Helvetica"


def _get_bg_color(bg_id: str) -> str:
    """Return hex color string for a background ID."""
    if bg_id in BG_COLOR_MAP:
        return BG_COLOR_MAP[bg_id]
    if bg_id in GRADIENT_MAP:
        return GRADIENT_MAP[bg_id]
    return "#FFFFFF"


import math


def _draw_motif(c: canvas.Canvas, cx: float, cy: float, motif_id: str, size: float = 3.0):
    """Draw a motif icon as vector graphics at center (cx, cy)."""
    color_hex = MOTIF_COLORS.get(motif_id, "#E53935")
    c.setFillColor(HexColor(color_hex))
    c.setStrokeColor(HexColor(color_hex))
    c.setLineWidth(0.3)
    s = size * mm

    if motif_id == "star":
        _draw_star(c, cx, cy, s * 0.45, 5)
    elif motif_id == "heart":
        _draw_heart(c, cx, cy, s * 0.4)
    elif motif_id == "flower":
        _draw_flower(c, cx, cy, s * 0.4)
    elif motif_id == "sun":
        _draw_sun(c, cx, cy, s * 0.4)
    elif motif_id == "moon":
        _draw_moon(c, cx, cy, s * 0.4)
    elif motif_id == "snowflake":
        _draw_snowflake(c, cx, cy, s * 0.4)
    elif motif_id in ("tree", "leaf"):
        _draw_tree(c, cx, cy, s * 0.45)
    elif motif_id == "crown":
        _draw_crown(c, cx, cy, s * 0.4)
    elif motif_id in ("football", "volleyball"):
        c.circle(cx, cy, s * 0.35, fill=1, stroke=0)
    elif motif_id in ("trophy", "medal"):
        _draw_trophy(c, cx, cy, s * 0.4)
    elif motif_id == "cloud":
        _draw_cloud(c, cx, cy, s * 0.4)
    elif motif_id in ("gem", "diamond"):
        _draw_diamond(c, cx, cy, s * 0.4)
    elif motif_id == "music":
        _draw_music_note(c, cx, cy, s * 0.4)
    elif motif_id == "zap":
        _draw_zap(c, cx, cy, s * 0.45)
    elif motif_id == "mountain":
        _draw_triangle(c, cx, cy, s * 0.45)
    elif motif_id == "flag":
        _draw_flag(c, cx, cy, s * 0.4)
    else:
        c.circle(cx, cy, s * 0.35, fill=1, stroke=0)


def _draw_star(c, cx, cy, r, points=5):
    inner_r = r * 0.4
    path = c.beginPath()
    for i in range(points * 2):
        angle = math.radians(90 + i * 360 / (points * 2))
        radius = r if i % 2 == 0 else inner_r
        px = cx + radius * math.cos(angle)
        py = cy + radius * math.sin(angle)
        if i == 0:
            path.moveTo(px, py)
        else:
            path.lineTo(px, py)
    path.close()
    c.drawPath(path, fill=1, stroke=0)


def _draw_heart(c, cx, cy, r):
    path = c.beginPath()
    path.moveTo(cx, cy - r * 0.4)
    path.curveTo(cx + r, cy + r * 0.6, cx + r * 0.5, cy + r * 1.2, cx, cy + r * 0.6)
    path.curveTo(cx - r * 0.5, cy + r * 1.2, cx - r, cy + r * 0.6, cx, cy - r * 0.4)
    path.close()
    c.drawPath(path, fill=1, stroke=0)


def _draw_flower(c, cx, cy, r):
    for i in range(5):
        angle = math.radians(i * 72)
        px = cx + r * 0.5 * math.cos(angle)
        py = cy + r * 0.5 * math.sin(angle)
        c.circle(px, py, r * 0.3, fill=1, stroke=0)
    c.setFillColor(HexColor("#FFC107"))
    c.circle(cx, cy, r * 0.2, fill=1, stroke=0)


def _draw_sun(c, cx, cy, r):
    c.circle(cx, cy, r * 0.4, fill=1, stroke=0)
    for i in range(8):
        angle = math.radians(i * 45)
        x1 = cx + r * 0.55 * math.cos(angle)
        y1 = cy + r * 0.55 * math.sin(angle)
        x2 = cx + r * 0.9 * math.cos(angle)
        y2 = cy + r * 0.9 * math.sin(angle)
        c.setLineWidth(0.5)
        c.line(x1, y1, x2, y2)


def _draw_moon(c, cx, cy, r):
    c.circle(cx, cy, r * 0.5, fill=1, stroke=0)
    c.setFillColor(HexColor("#FFFFFF"))
    c.circle(cx + r * 0.2, cy + r * 0.15, r * 0.4, fill=1, stroke=0)


def _draw_snowflake(c, cx, cy, r):
    for i in range(6):
        angle = math.radians(i * 60)
        x2 = cx + r * 0.8 * math.cos(angle)
        y2 = cy + r * 0.8 * math.sin(angle)
        c.setLineWidth(0.4)
        c.line(cx, cy, x2, y2)


def _draw_tree(c, cx, cy, r):
    path = c.beginPath()
    path.moveTo(cx, cy + r * 0.7)
    path.lineTo(cx - r * 0.5, cy - r * 0.3)
    path.lineTo(cx + r * 0.5, cy - r * 0.3)
    path.close()
    c.drawPath(path, fill=1, stroke=0)
    c.setFillColor(HexColor("#795548"))
    c.rect(cx - r * 0.1, cy - r * 0.7, r * 0.2, r * 0.4, fill=1, stroke=0)


def _draw_crown(c, cx, cy, r):
    path = c.beginPath()
    path.moveTo(cx - r * 0.5, cy - r * 0.3)
    path.lineTo(cx - r * 0.5, cy + r * 0.2)
    path.lineTo(cx - r * 0.25, cy)
    path.lineTo(cx, cy + r * 0.4)
    path.lineTo(cx + r * 0.25, cy)
    path.lineTo(cx + r * 0.5, cy + r * 0.2)
    path.lineTo(cx + r * 0.5, cy - r * 0.3)
    path.close()
    c.drawPath(path, fill=1, stroke=0)


def _draw_trophy(c, cx, cy, r):
    c.rect(cx - r * 0.3, cy - r * 0.1, r * 0.6, r * 0.6, fill=1, stroke=0)
    c.rect(cx - r * 0.1, cy - r * 0.5, r * 0.2, r * 0.4, fill=1, stroke=0)
    c.rect(cx - r * 0.35, cy - r * 0.55, r * 0.7, r * 0.1, fill=1, stroke=0)


def _draw_cloud(c, cx, cy, r):
    c.circle(cx - r * 0.25, cy, r * 0.3, fill=1, stroke=0)
    c.circle(cx + r * 0.2, cy, r * 0.35, fill=1, stroke=0)
    c.circle(cx, cy + r * 0.15, r * 0.3, fill=1, stroke=0)
    c.rect(cx - r * 0.5, cy - r * 0.2, r, r * 0.3, fill=1, stroke=0)


def _draw_diamond(c, cx, cy, r):
    path = c.beginPath()
    path.moveTo(cx, cy + r * 0.6)
    path.lineTo(cx + r * 0.4, cy)
    path.lineTo(cx, cy - r * 0.6)
    path.lineTo(cx - r * 0.4, cy)
    path.close()
    c.drawPath(path, fill=1, stroke=0)


def _draw_music_note(c, cx, cy, r):
    c.circle(cx - r * 0.15, cy - r * 0.3, r * 0.2, fill=1, stroke=0)
    c.setLineWidth(0.6)
    c.line(cx + r * 0.05, cy - r * 0.3, cx + r * 0.05, cy + r * 0.5)


def _draw_zap(c, cx, cy, r):
    path = c.beginPath()
    path.moveTo(cx, cy + r * 0.7)
    path.lineTo(cx + r * 0.3, cy + r * 0.1)
    path.lineTo(cx + r * 0.05, cy + r * 0.1)
    path.lineTo(cx + r * 0.2, cy - r * 0.7)
    path.lineTo(cx - r * 0.3, cy - r * 0.05)
    path.lineTo(cx - r * 0.05, cy - r * 0.05)
    path.close()
    c.drawPath(path, fill=1, stroke=0)


def _draw_triangle(c, cx, cy, r):
    path = c.beginPath()
    path.moveTo(cx, cy + r * 0.6)
    path.lineTo(cx - r * 0.5, cy - r * 0.4)
    path.lineTo(cx + r * 0.5, cy - r * 0.4)
    path.close()
    c.drawPath(path, fill=1, stroke=0)


def _draw_flag(c, cx, cy, r):
    c.setLineWidth(0.5)
    c.line(cx - r * 0.3, cy - r * 0.6, cx - r * 0.3, cy + r * 0.6)
    path = c.beginPath()
    path.moveTo(cx - r * 0.3, cy + r * 0.6)
    path.lineTo(cx + r * 0.4, cy + r * 0.3)
    path.lineTo(cx - r * 0.3, cy)
    path.close()
    c.drawPath(path, fill=1, stroke=0)


def _parse_customization(customization: dict) -> dict:
    """Extract and prepare sticker data from order customization."""
    child_name = customization.get("child_name", "")
    last_name = customization.get("last_name", "")
    display_name = f"{child_name} {last_name}" if last_name else child_name
    return {
        "display_name": display_name,
        "phone_number": customization.get("phone_number", ""),
        "font_id": customization.get("font", "roboto"),
        "font_color_hex": customization.get("font_color", "#000000"),
        "motif_id": customization.get("motif"),
        "bg_hex": _get_bg_color(customization.get("background", "white")),
    }


def _draw_cut_marks(c: canvas.Canvas):
    """Draw light gray cut-mark guidelines on the page."""
    c.setStrokeColor(HexColor("#DDDDDD"))
    c.setLineWidth(0.25)
    for row in range(ROWS + 1):
        y = PAGE_H - MARGIN_TOP - row * STICKER_H
        c.line(MARGIN_LEFT - 2 * mm, y, MARGIN_LEFT + GRID_W + 2 * mm, y)
    for col in range(COLS + 1):
        x = MARGIN_LEFT + col * STICKER_W
        c.line(x, PAGE_H - MARGIN_TOP + 2 * mm, x, PAGE_H - MARGIN_TOP - GRID_H - 2 * mm)


def _calc_font_size(name: str) -> float:
    """Return a font size that fits the sticker width."""
    if len(name) > 15:
        return 5.5
    if len(name) > 10:
        return 6.0
    return 7.0


def _draw_sticker(c: canvas.Canvas, x: float, y: float, data: dict, font_name: str):
    """Render a single sticker at (x, y) bottom-left."""
    bg_color = HexColor(data["bg_hex"])
    font_color = HexColor(data["font_color_hex"])

    # Background + border
    c.setFillColor(bg_color)
    c.rect(x, y, STICKER_W, STICKER_H, fill=1, stroke=0)
    c.setStrokeColor(HexColor("#CCCCCC"))
    c.setLineWidth(0.15)
    c.rect(x, y, STICKER_W, STICKER_H, fill=0, stroke=1)

    content_x = x + 1.5 * mm
    motif_x_offset = 0

    # Motif icon (vector graphics)
    motif_id = data["motif_id"]
    if motif_id and motif_id in MOTIF_COLORS:
        motif_cx = content_x + 1.5 * mm
        motif_cy = y + STICKER_H / 2
        _draw_motif(c, motif_cx, motif_cy, motif_id)
        motif_x_offset = 4.5 * mm

    # Text
    text_x = content_x + motif_x_offset
    name_size = _calc_font_size(data["display_name"])
    c.setFillColor(font_color)
    c.setFont(font_name, name_size)

    if data["phone_number"]:
        c.drawString(text_x, y + STICKER_H * 0.58, data["display_name"])
        c.setFont(font_name, max(3.5, name_size - 2))
        c.drawString(text_x, y + STICKER_H * 0.2, data["phone_number"])
    else:
        c.drawString(text_x, y + STICKER_H / 2 - name_size / 2.5, data["display_name"])


def generate_nametag_pdf(customization: dict, output_path: str):
    """Generate an A4 PDF with 140 name tag stickers."""
    data = _parse_customization(customization)

    c = canvas.Canvas(output_path, pagesize=A4)
    c.setTitle("Namnlappar - Printsout")
    c.setAuthor("Printsout AB")

    font_name = _register_font(c, data["font_id"])
    _draw_cut_marks(c)

    for i in range(TOTAL_STICKERS):
        col = i % COLS
        row = i // COLS
        x = MARGIN_LEFT + col * STICKER_W
        y = PAGE_H - MARGIN_TOP - (row + 1) * STICKER_H
        _draw_sticker(c, x, y, data, font_name)

    c.save()
    return output_path
