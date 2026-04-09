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

# Gradient backgrounds -> list of hex color stops (left-to-right)
GRADIENT_MAP = {
    "rainbow_bg": ["#ff9a9e", "#fad0c4", "#ffecd2", "#a8edea", "#d4fc79"],
    "g1": ["#667eea", "#764ba2"],
    "g2": ["#f093fb", "#f5576c"],
    "g3": ["#4facfe", "#00f2fe"],
    "g4": ["#43e97b", "#38f9d7"],
    "g5": ["#fa709a", "#fee140"],
    "g6": ["#a18cd1", "#fbc2eb"],
    "g7": ["#ffecd2", "#fcb69f"],
    "g8": ["#89f7fe", "#66a6ff"],
    "g9": ["#fddb92", "#d1fdff"],
    "g10": ["#c1dfc4", "#deecdd"],
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


def _get_bg_info(bg_id: str) -> dict:
    """Return background info: either a solid hex or a gradient color list."""
    if bg_id in BG_COLOR_MAP:
        return {"type": "solid", "color": BG_COLOR_MAP[bg_id]}
    if bg_id in GRADIENT_MAP:
        return {"type": "gradient", "colors": GRADIENT_MAP[bg_id]}
    return {"type": "solid", "color": "#FFFFFF"}


def _hex_to_rgb(hex_color: str):
    """Convert hex color to (r, g, b) tuple with 0-255 values."""
    h = hex_color.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def _interpolate_color(c1, c2, t):
    """Linearly interpolate between two RGB tuples."""
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))


def _draw_gradient_rect(c: canvas.Canvas, x: float, y: float, w: float, h: float, color_stops: list):
    """Draw a horizontal gradient rectangle using thin vertical strips."""
    num_strips = max(int(w / 0.5), 20)  # ~0.5pt per strip for smooth gradient
    strip_w = w / num_strips
    rgb_stops = [_hex_to_rgb(col) for col in color_stops]
    num_segments = len(rgb_stops) - 1

    for i in range(num_strips):
        t = i / max(num_strips - 1, 1)
        seg_pos = t * num_segments
        seg_idx = min(int(seg_pos), num_segments - 1)
        seg_t = seg_pos - seg_idx
        rgb = _interpolate_color(rgb_stops[seg_idx], rgb_stops[seg_idx + 1], seg_t)
        hex_col = "#{:02x}{:02x}{:02x}".format(*rgb)
        c.setFillColor(HexColor(hex_col))
        c.rect(x + i * strip_w, y, strip_w + 0.5, h, fill=1, stroke=0)  # +0.5 overlap to avoid gaps


import math


def _draw_motif(c: canvas.Canvas, cx: float, cy: float, motif_id: str, size: float = 3.0):
    """Draw a motif icon as vector graphics at center (cx, cy)."""
    color_hex = MOTIF_COLORS.get(motif_id, "#E53935")
    c.setFillColor(HexColor(color_hex))
    c.setStrokeColor(HexColor(color_hex))
    c.setLineWidth(0.3)
    s = size * mm

    dispatch = {
        "star": lambda: _draw_star(c, cx, cy, s * 0.45, 5),
        "heart": lambda: _draw_heart(c, cx, cy, s * 0.4),
        "flower": lambda: _draw_flower(c, cx, cy, s * 0.55),
        "sun": lambda: _draw_sun(c, cx, cy, s * 0.4),
        "moon": lambda: _draw_moon(c, cx, cy, s * 0.4),
        "snowflake": lambda: _draw_snowflake(c, cx, cy, s * 0.4),
        "tree": lambda: _draw_tree(c, cx, cy, s * 0.45),
        "leaf": lambda: _draw_leaf(c, cx, cy, s * 0.4),
        "crown": lambda: _draw_crown(c, cx, cy, s * 0.4),
        "football": lambda: _draw_football(c, cx, cy, s * 0.45),
        "volleyball": lambda: _draw_volleyball(c, cx, cy, s * 0.35),
        "trophy": lambda: _draw_trophy(c, cx, cy, s * 0.4),
        "medal": lambda: _draw_medal(c, cx, cy, s * 0.4),
        "cloud": lambda: _draw_cloud(c, cx, cy, s * 0.4),
        "gem": lambda: _draw_diamond(c, cx, cy, s * 0.4),
        "diamond": lambda: _draw_diamond(c, cx, cy, s * 0.4),
        "music": lambda: _draw_music_note(c, cx, cy, s * 0.4),
        "zap": lambda: _draw_zap(c, cx, cy, s * 0.45),
        "mountain": lambda: _draw_triangle(c, cx, cy, s * 0.45),
        "flag": lambda: _draw_flag(c, cx, cy, s * 0.4),
        # Animals
        "cat": lambda: _draw_cat(c, cx, cy, s * 0.5),
        "dog": lambda: _draw_dog(c, cx, cy, s * 0.5),
        "rabbit": lambda: _draw_rabbit(c, cx, cy, s * 0.5),
        "fish": lambda: _draw_fish(c, cx, cy, s * 0.5),
        "bird": lambda: _draw_bird(c, cx, cy, s * 0.5),
        "bug": lambda: _draw_bug(c, cx, cy, s * 0.5),
        "baby": lambda: _draw_baby(c, cx, cy, s * 0.5),
        "horse": lambda: _draw_horse(c, cx, cy, s * 0.5),
        "footprints": lambda: _draw_footprints(c, cx, cy, s * 0.5),
        # Vehicles
        "car": lambda: _draw_car(c, cx, cy, s * 0.5),
        "plane": lambda: _draw_plane(c, cx, cy, s * 0.5),
        "rocket": lambda: _draw_rocket(c, cx, cy, s * 0.5),
        "ship": lambda: _draw_ship(c, cx, cy, s * 0.5),
        "bike": lambda: _draw_bike(c, cx, cy, s * 0.5),
        "train": lambda: _draw_train(c, cx, cy, s * 0.4),
        # Sports & activities
        "gamepad": lambda: _draw_gamepad(c, cx, cy, s * 0.4),
        "sparkles": lambda: _draw_sparkles(c, cx, cy, s * 0.4),
        "swimming": lambda: _draw_waves(c, cx, cy, s * 0.4),
        "dumbbell": lambda: _draw_dumbbell(c, cx, cy, s * 0.4),
        "target": lambda: _draw_target(c, cx, cy, s * 0.4),
        "swords": lambda: _draw_swords(c, cx, cy, s * 0.4),
        "shield": lambda: _draw_shield(c, cx, cy, s * 0.4),
        "weight": lambda: _draw_dumbbell(c, cx, cy, s * 0.4),
        "running": lambda: _draw_running(c, cx, cy, s * 0.4),
        # Fun
        "rainbow": lambda: _draw_rainbow(c, cx, cy, s * 0.4),
        "anchor": lambda: _draw_anchor(c, cx, cy, s * 0.4),
        "skull": lambda: _draw_skull(c, cx, cy, s * 0.4),
        "ghost": lambda: _draw_ghost(c, cx, cy, s * 0.4),
        "flame": lambda: _draw_flame(c, cx, cy, s * 0.4),
        # Food
        "icecream": lambda: _draw_icecream(c, cx, cy, s * 0.4),
        "cherry": lambda: _draw_cherry(c, cx, cy, s * 0.4),
        "apple": lambda: _draw_apple(c, cx, cy, s * 0.4),
        "pizza": lambda: _draw_pizza(c, cx, cy, s * 0.4),
        "cake": lambda: _draw_cake(c, cx, cy, s * 0.4),
    }
    handler = dispatch.get(motif_id)
    if handler:
        handler()
    else:
        # Fallback: draw a small filled shape instead of plain circle
        _draw_star(c, cx, cy, s * 0.35, 5)


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
    """Flower with petals, center and a prominent leaf (like Flower2 icon)."""
    # Stem - thick and visible
    c.setStrokeColor(HexColor("#388E3C"))
    c.setLineWidth(max(0.8, r * 0.08))
    c.line(cx, cy + r * 0.05, cx, cy - r * 0.75)
    # Leaf on right side of stem - big enough to see
    c.setFillColor(HexColor("#4CAF50"))
    leaf = c.beginPath()
    leaf.moveTo(cx + r * 0.02, cy - r * 0.2)
    leaf.curveTo(cx + r * 0.5, cy - r * 0.05, cx + r * 0.55, cy - r * 0.35, cx + r * 0.3, cy - r * 0.55)
    leaf.curveTo(cx + r * 0.15, cy - r * 0.5, cx + r * 0.05, cy - r * 0.35, cx + r * 0.02, cy - r * 0.2)
    leaf.close()
    c.drawPath(leaf, fill=1, stroke=0)
    # Petals at top - big and colorful
    color_hex = MOTIF_COLORS.get("flower", "#E91E63")
    c.setFillColor(HexColor(color_hex))
    petal_cy = cy + r * 0.35
    for i in range(5):
        angle = math.radians(i * 72 + 90)
        px = cx + r * 0.25 * math.cos(angle)
        py = petal_cy + r * 0.25 * math.sin(angle)
        c.circle(px, py, r * 0.22, fill=1, stroke=0)
    # Yellow center
    c.setFillColor(HexColor("#FFC107"))
    c.circle(cx, petal_cy, r * 0.13, fill=1, stroke=0)


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


def _draw_leaf(c, cx, cy, r):
    """Leaf shape - pointed oval with stem."""
    path = c.beginPath()
    path.moveTo(cx, cy + r * 0.7)
    path.curveTo(cx + r * 0.6, cy + r * 0.3, cx + r * 0.5, cy - r * 0.5, cx, cy - r * 0.7)
    path.curveTo(cx - r * 0.5, cy - r * 0.5, cx - r * 0.6, cy + r * 0.3, cx, cy + r * 0.7)
    path.close()
    c.drawPath(path, fill=1, stroke=0)


def _draw_football(c, cx, cy, r):
    """Football/soccer ball - recognizable ball at any size."""
    # Solid green ball with thin white highlight
    c.setFillColor(HexColor("#1B5E20"))
    c.circle(cx, cy, r, fill=1, stroke=0)
    # Single white arc highlight to suggest roundness/ball
    c.setStrokeColor(white)
    c.setLineWidth(max(0.3, r * 0.1))
    path = c.beginPath()
    path.moveTo(cx - r * 0.3, cy + r * 0.6)
    path.curveTo(cx - r * 0.5, cy + r * 0.2, cx - r * 0.5, cy - r * 0.3, cx - r * 0.15, cy - r * 0.55)
    c.drawPath(path, fill=0, stroke=1)


def _draw_pentagon(c, cx, cy, r):
    """Draw a filled pentagon."""
    path = c.beginPath()
    for i in range(5):
        angle = math.radians(i * 72 - 90)
        x = cx + r * math.cos(angle)
        y = cy + r * math.sin(angle)
        if i == 0:
            path.moveTo(x, y)
        else:
            path.lineTo(x, y)
    path.close()
    c.drawPath(path, fill=1, stroke=0)


def _draw_volleyball(c, cx, cy, r):
    """Volleyball - circle with curved panel lines."""
    c.setFillColor(HexColor("#FFF8E1"))
    c.setStrokeColor(HexColor(MOTIF_COLORS.get("volleyball", "#FF8F00")))
    lw = max(0.5, r * 0.1)
    c.setLineWidth(lw)
    c.circle(cx, cy, r, fill=1, stroke=1)
    # Panel lines
    c.setLineWidth(max(0.3, r * 0.06))
    c.line(cx - r * 0.85, cy, cx + r * 0.85, cy)
    c.line(cx - r * 0.3, cy + r * 0.8, cx + r * 0.3, cy - r * 0.8)
    c.line(cx + r * 0.3, cy + r * 0.8, cx - r * 0.3, cy - r * 0.8)


def _draw_medal(c, cx, cy, r):
    """Medal - circle with ribbon."""
    # Ribbon
    path = c.beginPath()
    path.moveTo(cx - r * 0.3, cy + r * 0.3)
    path.lineTo(cx - r * 0.5, cy + r * 0.9)
    path.lineTo(cx, cy + r * 0.5)
    path.lineTo(cx + r * 0.5, cy + r * 0.9)
    path.lineTo(cx + r * 0.3, cy + r * 0.3)
    path.close()
    c.drawPath(path, fill=1, stroke=0)
    # Circle
    c.circle(cx, cy, r * 0.4, fill=1, stroke=0)
    c.setFillColor(HexColor("#FFFFFF"))
    _draw_star(c, cx, cy, r * 0.2, 5)


def _draw_cat(c, cx, cy, r):
    """Cat silhouette - simple bold shape with prominent ears."""
    # Head - large circle
    c.circle(cx, cy, r * 0.55, fill=1, stroke=0)
    # Left ear - big triangle
    path = c.beginPath()
    path.moveTo(cx - r * 0.5, cy + r * 0.25)
    path.lineTo(cx - r * 0.35, cy + r * 0.9)
    path.lineTo(cx - r * 0.05, cy + r * 0.4)
    path.close()
    c.drawPath(path, fill=1, stroke=0)
    # Right ear - big triangle
    path = c.beginPath()
    path.moveTo(cx + r * 0.5, cy + r * 0.25)
    path.lineTo(cx + r * 0.35, cy + r * 0.9)
    path.lineTo(cx + r * 0.05, cy + r * 0.4)
    path.close()
    c.drawPath(path, fill=1, stroke=0)


def _draw_dog(c, cx, cy, r):
    """Dog silhouette - round head with big floppy ears."""
    # Floppy ears (drawn first, behind head)
    c.ellipse(cx - r * 0.7, cy - r * 0.4, cx - r * 0.15, cy + r * 0.45, fill=1, stroke=0)
    c.ellipse(cx + r * 0.15, cy - r * 0.4, cx + r * 0.7, cy + r * 0.45, fill=1, stroke=0)
    # Head
    c.circle(cx, cy + r * 0.1, r * 0.5, fill=1, stroke=0)
    # Snout
    c.ellipse(cx - r * 0.2, cy - r * 0.25, cx + r * 0.2, cy + r * 0.05, fill=1, stroke=0)


def _draw_rabbit(c, cx, cy, r):
    """Rabbit silhouette - round head with very long ears."""
    # Head
    c.circle(cx, cy - r * 0.2, r * 0.45, fill=1, stroke=0)
    # Long ears
    c.ellipse(cx - r * 0.3, cy + r * 0.05, cx - r * 0.05, cy + r * 0.95, fill=1, stroke=0)
    c.ellipse(cx + r * 0.05, cy + r * 0.05, cx + r * 0.3, cy + r * 0.95, fill=1, stroke=0)


def _draw_fish(c, cx, cy, r):
    """Fish silhouette - body with tail fin."""
    # Body
    c.ellipse(cx - r * 0.55, cy - r * 0.3, cx + r * 0.25, cy + r * 0.3, fill=1, stroke=0)
    # Tail fin
    path = c.beginPath()
    path.moveTo(cx + r * 0.15, cy)
    path.lineTo(cx + r * 0.65, cy + r * 0.4)
    path.lineTo(cx + r * 0.65, cy - r * 0.4)
    path.close()
    c.drawPath(path, fill=1, stroke=0)


def _draw_bird(c, cx, cy, r):
    """Bird silhouette - body with wing and beak."""
    # Body
    c.ellipse(cx - r * 0.4, cy - r * 0.25, cx + r * 0.3, cy + r * 0.25, fill=1, stroke=0)
    # Head
    c.circle(cx - r * 0.35, cy + r * 0.15, r * 0.25, fill=1, stroke=0)
    # Beak
    path = c.beginPath()
    path.moveTo(cx - r * 0.55, cy + r * 0.2)
    path.lineTo(cx - r * 0.8, cy + r * 0.1)
    path.lineTo(cx - r * 0.55, cy + r * 0.05)
    path.close()
    c.drawPath(path, fill=1, stroke=0)
    # Tail
    path = c.beginPath()
    path.moveTo(cx + r * 0.25, cy + r * 0.05)
    path.lineTo(cx + r * 0.6, cy + r * 0.25)
    path.lineTo(cx + r * 0.55, cy - r * 0.1)
    path.close()
    c.drawPath(path, fill=1, stroke=0)


def _draw_bug(c, cx, cy, r):
    """Ladybug silhouette - oval with dots."""
    # Body
    c.circle(cx, cy, r * 0.55, fill=1, stroke=0)
    # Center line
    c.setStrokeColor(black)
    c.setLineWidth(max(0.3, r * 0.04))
    c.line(cx, cy + r * 0.55, cx, cy - r * 0.55)
    # Head
    c.setFillColor(black)
    c.circle(cx, cy + r * 0.65, r * 0.2, fill=1, stroke=0)


def _draw_baby(c, cx, cy, r):
    """Baby face - simple pacifier-like silhouette."""
    c.circle(cx, cy, r * 0.55, fill=1, stroke=0)


def _draw_horse(c, cx, cy, r):
    """Horse head silhouette."""
    path = c.beginPath()
    path.moveTo(cx - r * 0.2, cy - r * 0.6)
    path.curveTo(cx - r * 0.5, cy - r * 0.4, cx - r * 0.4, cy + r * 0.3, cx - r * 0.2, cy + r * 0.5)
    path.lineTo(cx + r * 0.1, cy + r * 0.7)
    path.curveTo(cx + r * 0.4, cy + r * 0.5, cx + r * 0.4, cy + r * 0.1, cx + r * 0.25, cy - r * 0.2)
    path.lineTo(cx + r * 0.2, cy - r * 0.6)
    path.close()
    c.drawPath(path, fill=1, stroke=0)
    # Ear
    path = c.beginPath()
    path.moveTo(cx + r * 0.05, cy + r * 0.6)
    path.lineTo(cx - r * 0.1, cy + r * 0.85)
    path.lineTo(cx + r * 0.15, cy + r * 0.7)
    path.close()
    c.drawPath(path, fill=1, stroke=0)


def _draw_footprints(c, cx, cy, r):
    """Paw print - central pad + toe pads."""
    # Central pad
    c.ellipse(cx - r * 0.2, cy - r * 0.35, cx + r * 0.2, cy + r * 0.05, fill=1, stroke=0)
    # Toe pads
    c.circle(cx - r * 0.25, cy + r * 0.25, r * 0.12, fill=1, stroke=0)
    c.circle(cx - r * 0.05, cy + r * 0.4, r * 0.12, fill=1, stroke=0)
    c.circle(cx + r * 0.15, cy + r * 0.35, r * 0.12, fill=1, stroke=0)
    c.circle(cx + r * 0.3, cy + r * 0.2, r * 0.1, fill=1, stroke=0)


def _draw_car(c, cx, cy, r):
    """Simple side-view car."""
    # Body
    c.rect(cx - r * 0.5, cy - r * 0.15, r, r * 0.35, fill=1, stroke=0)
    # Roof
    path = c.beginPath()
    path.moveTo(cx - r * 0.2, cy + r * 0.2)
    path.lineTo(cx - r * 0.1, cy + r * 0.5)
    path.lineTo(cx + r * 0.25, cy + r * 0.5)
    path.lineTo(cx + r * 0.35, cy + r * 0.2)
    path.close()
    c.drawPath(path, fill=1, stroke=0)
    # Wheels
    c.setFillColor(black)
    c.circle(cx - r * 0.25, cy - r * 0.2, r * 0.12, fill=1, stroke=0)
    c.circle(cx + r * 0.25, cy - r * 0.2, r * 0.12, fill=1, stroke=0)


def _draw_plane(c, cx, cy, r):
    """Simple airplane from the side."""
    # Fuselage
    c.ellipse(cx - r * 0.6, cy - r * 0.1, cx + r * 0.4, cy + r * 0.1, fill=1, stroke=0)
    # Wing
    path = c.beginPath()
    path.moveTo(cx - r * 0.1, cy + r * 0.05)
    path.lineTo(cx, cy + r * 0.5)
    path.lineTo(cx + r * 0.3, cy + r * 0.5)
    path.lineTo(cx + r * 0.1, cy + r * 0.05)
    path.close()
    c.drawPath(path, fill=1, stroke=0)
    # Tail fin
    path = c.beginPath()
    path.moveTo(cx + r * 0.3, cy + r * 0.05)
    path.lineTo(cx + r * 0.35, cy + r * 0.35)
    path.lineTo(cx + r * 0.5, cy + r * 0.05)
    path.close()
    c.drawPath(path, fill=1, stroke=0)


def _draw_rocket(c, cx, cy, r):
    """Rocket pointing up."""
    # Body
    path = c.beginPath()
    path.moveTo(cx, cy + r * 0.7)
    path.curveTo(cx + r * 0.2, cy + r * 0.5, cx + r * 0.2, cy - r * 0.2, cx + r * 0.15, cy - r * 0.4)
    path.lineTo(cx - r * 0.15, cy - r * 0.4)
    path.curveTo(cx - r * 0.2, cy - r * 0.2, cx - r * 0.2, cy + r * 0.5, cx, cy + r * 0.7)
    path.close()
    c.drawPath(path, fill=1, stroke=0)
    # Fins
    path = c.beginPath()
    path.moveTo(cx - r * 0.15, cy - r * 0.3)
    path.lineTo(cx - r * 0.35, cy - r * 0.5)
    path.lineTo(cx - r * 0.15, cy - r * 0.1)
    path.close()
    c.drawPath(path, fill=1, stroke=0)
    path = c.beginPath()
    path.moveTo(cx + r * 0.15, cy - r * 0.3)
    path.lineTo(cx + r * 0.35, cy - r * 0.5)
    path.lineTo(cx + r * 0.15, cy - r * 0.1)
    path.close()
    c.drawPath(path, fill=1, stroke=0)
    # Window
    c.setFillColor(white)
    c.circle(cx, cy + r * 0.2, r * 0.08, fill=1, stroke=0)
    # Flame
    c.setFillColor(HexColor("#FF9800"))
    path = c.beginPath()
    path.moveTo(cx - r * 0.1, cy - r * 0.4)
    path.lineTo(cx, cy - r * 0.65)
    path.lineTo(cx + r * 0.1, cy - r * 0.4)
    path.close()
    c.drawPath(path, fill=1, stroke=0)


def _draw_ship(c, cx, cy, r):
    """Simple boat/ship."""
    # Hull
    path = c.beginPath()
    path.moveTo(cx - r * 0.5, cy)
    path.lineTo(cx - r * 0.35, cy - r * 0.3)
    path.lineTo(cx + r * 0.35, cy - r * 0.3)
    path.lineTo(cx + r * 0.5, cy)
    path.close()
    c.drawPath(path, fill=1, stroke=0)
    # Mast
    c.setLineWidth(0.4)
    c.line(cx, cy, cx, cy + r * 0.6)
    # Sail
    path = c.beginPath()
    path.moveTo(cx, cy + r * 0.55)
    path.lineTo(cx + r * 0.35, cy + r * 0.1)
    path.lineTo(cx, cy + r * 0.1)
    path.close()
    c.drawPath(path, fill=1, stroke=0)


def _draw_bike(c, cx, cy, r):
    """Simple bicycle."""
    # Wheels
    c.setFillColor(HexColor(MOTIF_COLORS.get("bike", "#43A047")))
    c.setStrokeColor(HexColor(MOTIF_COLORS.get("bike", "#43A047")))
    c.setLineWidth(0.4)
    c.circle(cx - r * 0.3, cy - r * 0.15, r * 0.22, fill=0, stroke=1)
    c.circle(cx + r * 0.3, cy - r * 0.15, r * 0.22, fill=0, stroke=1)
    # Frame
    c.line(cx - r * 0.3, cy - r * 0.15, cx, cy + r * 0.2)
    c.line(cx, cy + r * 0.2, cx + r * 0.3, cy - r * 0.15)
    c.line(cx, cy + r * 0.2, cx - r * 0.15, cy + r * 0.2)
    # Handlebars
    c.line(cx + r * 0.3, cy - r * 0.15, cx + r * 0.2, cy + r * 0.2)
    # Seat
    c.line(cx - r * 0.05, cy + r * 0.25, cx + r * 0.05, cy + r * 0.25)


def _draw_train(c, cx, cy, r):
    """Simple train engine."""
    # Body
    c.rect(cx - r * 0.35, cy - r * 0.15, r * 0.6, r * 0.5, fill=1, stroke=0)
    # Cabin
    c.rect(cx - r * 0.35, cy + r * 0.35, r * 0.35, r * 0.3, fill=1, stroke=0)
    # Smokestack
    c.rect(cx + r * 0.05, cy + r * 0.35, r * 0.1, r * 0.2, fill=1, stroke=0)
    # Wheels
    c.setFillColor(black)
    c.circle(cx - r * 0.2, cy - r * 0.2, r * 0.1, fill=1, stroke=0)
    c.circle(cx + r * 0.1, cy - r * 0.2, r * 0.1, fill=1, stroke=0)
    # Window
    c.setFillColor(white)
    c.rect(cx - r * 0.28, cy + r * 0.42, r * 0.15, r * 0.15, fill=1, stroke=0)


def _draw_gamepad(c, cx, cy, r):
    """Game controller."""
    # Body
    c.ellipse(cx - r * 0.5, cy - r * 0.25, cx + r * 0.5, cy + r * 0.25, fill=1, stroke=0)
    # D-pad
    c.setFillColor(HexColor("#FFFFFF"))
    c.rect(cx - r * 0.35, cy - r * 0.03, r * 0.2, r * 0.06, fill=1, stroke=0)
    c.rect(cx - r * 0.28, cy - r * 0.1, r * 0.06, r * 0.2, fill=1, stroke=0)
    # Buttons
    c.circle(cx + r * 0.2, cy + r * 0.05, r * 0.05, fill=1, stroke=0)
    c.circle(cx + r * 0.3, cy, r * 0.05, fill=1, stroke=0)


def _draw_sparkles(c, cx, cy, r):
    """Sparkle/glitter - 4-point stars."""
    # Main sparkle
    _draw_4point_star(c, cx, cy, r * 0.5)
    # Smaller sparkles
    color_hex = MOTIF_COLORS.get("sparkles", "#AB47BC")
    c.setFillColor(HexColor(color_hex))
    _draw_4point_star(c, cx - r * 0.4, cy + r * 0.3, r * 0.25)
    _draw_4point_star(c, cx + r * 0.35, cy - r * 0.35, r * 0.2)


def _draw_4point_star(c, cx, cy, r):
    """4-pointed star shape."""
    path = c.beginPath()
    path.moveTo(cx, cy + r)
    path.lineTo(cx + r * 0.2, cy + r * 0.2)
    path.lineTo(cx + r, cy)
    path.lineTo(cx + r * 0.2, cy - r * 0.2)
    path.lineTo(cx, cy - r)
    path.lineTo(cx - r * 0.2, cy - r * 0.2)
    path.lineTo(cx - r, cy)
    path.lineTo(cx - r * 0.2, cy + r * 0.2)
    path.close()
    c.drawPath(path, fill=1, stroke=0)


def _draw_waves(c, cx, cy, r):
    """Wavy water lines."""
    color_hex = MOTIF_COLORS.get("swimming", "#0288D1")
    c.setStrokeColor(HexColor(color_hex))
    c.setLineWidth(0.5)
    for offset in [r * 0.2, 0, -r * 0.2]:
        path = c.beginPath()
        path.moveTo(cx - r * 0.5, cy + offset)
        path.curveTo(cx - r * 0.25, cy + offset + r * 0.15, cx, cy + offset - r * 0.15, cx + r * 0.25, cy + offset)
        path.curveTo(cx + r * 0.35, cy + offset + r * 0.1, cx + r * 0.45, cy + offset - r * 0.05, cx + r * 0.5, cy + offset)
        c.drawPath(path, fill=0, stroke=1)


def _draw_dumbbell(c, cx, cy, r):
    """Dumbbell weight."""
    # Bar
    c.rect(cx - r * 0.3, cy - r * 0.05, r * 0.6, r * 0.1, fill=1, stroke=0)
    # Left weight
    c.rect(cx - r * 0.5, cy - r * 0.25, r * 0.15, r * 0.5, fill=1, stroke=0)
    # Right weight
    c.rect(cx + r * 0.35, cy - r * 0.25, r * 0.15, r * 0.5, fill=1, stroke=0)


def _draw_target(c, cx, cy, r):
    """Bullseye target."""
    c.circle(cx, cy, r * 0.45, fill=1, stroke=0)
    c.setFillColor(white)
    c.circle(cx, cy, r * 0.3, fill=1, stroke=0)
    color_hex = MOTIF_COLORS.get("target", "#E53935")
    c.setFillColor(HexColor(color_hex))
    c.circle(cx, cy, r * 0.15, fill=1, stroke=0)


def _draw_swords(c, cx, cy, r):
    """Crossed swords."""
    c.setStrokeColor(HexColor(MOTIF_COLORS.get("swords", "#78909C")))
    c.setLineWidth(0.6)
    # Sword 1 (diagonal /)
    c.line(cx - r * 0.4, cy - r * 0.4, cx + r * 0.4, cy + r * 0.4)
    # Sword 2 (diagonal \)
    c.line(cx + r * 0.4, cy - r * 0.4, cx - r * 0.4, cy + r * 0.4)
    # Guards
    c.setLineWidth(0.8)
    c.line(cx - r * 0.2, cy + r * 0.15, cx + r * 0.05, cy - r * 0.1)
    c.line(cx - r * 0.05, cy - r * 0.1, cx + r * 0.2, cy + r * 0.15)


def _draw_shield(c, cx, cy, r):
    """Shield shape."""
    path = c.beginPath()
    path.moveTo(cx, cy + r * 0.7)
    path.lineTo(cx + r * 0.45, cy + r * 0.35)
    path.lineTo(cx + r * 0.45, cy - r * 0.1)
    path.curveTo(cx + r * 0.45, cy - r * 0.5, cx, cy - r * 0.7, cx, cy - r * 0.7)
    path.curveTo(cx, cy - r * 0.7, cx - r * 0.45, cy - r * 0.5, cx - r * 0.45, cy - r * 0.1)
    path.lineTo(cx - r * 0.45, cy + r * 0.35)
    path.close()
    c.drawPath(path, fill=1, stroke=0)
    # Center stripe
    c.setFillColor(white)
    c.rect(cx - r * 0.05, cy - r * 0.4, r * 0.1, r * 0.8, fill=1, stroke=0)


def _draw_running(c, cx, cy, r):
    """Running person - stick figure in motion."""
    color_hex = MOTIF_COLORS.get("running", "#FF5722")
    c.setStrokeColor(HexColor(color_hex))
    c.setFillColor(HexColor(color_hex))
    c.setLineWidth(0.5)
    # Head
    c.circle(cx, cy + r * 0.45, r * 0.12, fill=1, stroke=0)
    # Body
    c.line(cx, cy + r * 0.33, cx + r * 0.05, cy - r * 0.1)
    # Arms
    c.line(cx, cy + r * 0.2, cx - r * 0.25, cy + r * 0.35)
    c.line(cx, cy + r * 0.2, cx + r * 0.25, cy + r * 0.1)
    # Legs
    c.line(cx + r * 0.05, cy - r * 0.1, cx - r * 0.2, cy - r * 0.45)
    c.line(cx + r * 0.05, cy - r * 0.1, cx + r * 0.25, cy - r * 0.4)


def _draw_rainbow(c, cx, cy, r):
    """Rainbow - concentric arcs."""
    colors = ["#E53935", "#FF9800", "#FFC107", "#43A047", "#1E88E5", "#7E57C2"]
    c.setLineWidth(0.5)
    for i, col in enumerate(colors):
        c.setStrokeColor(HexColor(col))
        arc_r = r * (0.6 - i * 0.07)
        path = c.beginPath()
        steps = 20
        for j in range(steps + 1):
            angle = math.radians(180 * j / steps)
            px = cx + arc_r * math.cos(angle)
            py = cy + arc_r * math.sin(angle)
            if j == 0:
                path.moveTo(px, py)
            else:
                path.lineTo(px, py)
        c.drawPath(path, fill=0, stroke=1)


def _draw_anchor(c, cx, cy, r):
    """Anchor shape."""
    c.setStrokeColor(HexColor(MOTIF_COLORS.get("anchor", "#37474F")))
    c.setFillColor(HexColor(MOTIF_COLORS.get("anchor", "#37474F")))
    c.setLineWidth(0.5)
    # Ring at top
    c.circle(cx, cy + r * 0.45, r * 0.1, fill=0, stroke=1)
    # Vertical shaft
    c.line(cx, cy + r * 0.35, cx, cy - r * 0.4)
    # Cross bar
    c.line(cx - r * 0.2, cy + r * 0.15, cx + r * 0.2, cy + r * 0.15)
    # Curved arms at bottom
    path = c.beginPath()
    path.moveTo(cx - r * 0.35, cy - r * 0.15)
    path.curveTo(cx - r * 0.35, cy - r * 0.4, cx, cy - r * 0.45, cx, cy - r * 0.4)
    c.drawPath(path, fill=0, stroke=1)
    path = c.beginPath()
    path.moveTo(cx + r * 0.35, cy - r * 0.15)
    path.curveTo(cx + r * 0.35, cy - r * 0.4, cx, cy - r * 0.45, cx, cy - r * 0.4)
    c.drawPath(path, fill=0, stroke=1)


def _draw_skull(c, cx, cy, r):
    """Skull - round top with jaw."""
    c.circle(cx, cy + r * 0.1, r * 0.4, fill=1, stroke=0)
    # Jaw
    c.rect(cx - r * 0.25, cy - r * 0.3, r * 0.5, r * 0.2, fill=1, stroke=0)
    # Eyes
    c.setFillColor(white)
    c.circle(cx - r * 0.13, cy + r * 0.15, r * 0.1, fill=1, stroke=0)
    c.circle(cx + r * 0.13, cy + r * 0.15, r * 0.1, fill=1, stroke=0)
    # Nose
    path = c.beginPath()
    path.moveTo(cx, cy + r * 0.05)
    path.lineTo(cx - r * 0.05, cy - r * 0.05)
    path.lineTo(cx + r * 0.05, cy - r * 0.05)
    path.close()
    c.drawPath(path, fill=1, stroke=0)


def _draw_ghost(c, cx, cy, r):
    """Cute ghost shape."""
    # Body top (half circle)
    c.circle(cx, cy + r * 0.1, r * 0.4, fill=1, stroke=0)
    # Body bottom (wavy)
    c.rect(cx - r * 0.4, cy - r * 0.35, r * 0.8, r * 0.45, fill=1, stroke=0)
    # Wavy bottom
    for i in range(3):
        bx = cx - r * 0.27 + i * r * 0.27
        c.circle(bx, cy - r * 0.35, r * 0.13, fill=1, stroke=0)
    # Eyes
    c.setFillColor(black)
    c.circle(cx - r * 0.12, cy + r * 0.15, r * 0.06, fill=1, stroke=0)
    c.circle(cx + r * 0.12, cy + r * 0.15, r * 0.06, fill=1, stroke=0)


def _draw_flame(c, cx, cy, r):
    """Fire flame."""
    # Outer flame
    path = c.beginPath()
    path.moveTo(cx, cy + r * 0.7)
    path.curveTo(cx + r * 0.35, cy + r * 0.3, cx + r * 0.4, cy - r * 0.2, cx + r * 0.15, cy - r * 0.5)
    path.curveTo(cx + r * 0.05, cy - r * 0.2, cx - r * 0.05, cy - r * 0.2, cx - r * 0.15, cy - r * 0.5)
    path.curveTo(cx - r * 0.4, cy - r * 0.2, cx - r * 0.35, cy + r * 0.3, cx, cy + r * 0.7)
    path.close()
    c.drawPath(path, fill=1, stroke=0)
    # Inner flame (yellow)
    c.setFillColor(HexColor("#FFC107"))
    path = c.beginPath()
    path.moveTo(cx, cy + r * 0.35)
    path.curveTo(cx + r * 0.15, cy + r * 0.1, cx + r * 0.15, cy - r * 0.15, cx + r * 0.05, cy - r * 0.3)
    path.curveTo(cx, cy - r * 0.1, cx, cy - r * 0.1, cx - r * 0.05, cy - r * 0.3)
    path.curveTo(cx - r * 0.15, cy - r * 0.15, cx - r * 0.15, cy + r * 0.1, cx, cy + r * 0.35)
    path.close()
    c.drawPath(path, fill=1, stroke=0)


def _draw_icecream(c, cx, cy, r):
    """Ice cream cone."""
    # Cone
    color_hex = MOTIF_COLORS.get("icecream", "#F48FB1")
    c.setFillColor(HexColor("#D2691E"))
    path = c.beginPath()
    path.moveTo(cx - r * 0.25, cy)
    path.lineTo(cx, cy - r * 0.6)
    path.lineTo(cx + r * 0.25, cy)
    path.close()
    c.drawPath(path, fill=1, stroke=0)
    # Scoop
    c.setFillColor(HexColor(color_hex))
    c.circle(cx, cy + r * 0.15, r * 0.3, fill=1, stroke=0)


def _draw_cherry(c, cx, cy, r):
    """Two cherries with stems."""
    color_hex = MOTIF_COLORS.get("cherry", "#D32F2F")
    c.setFillColor(HexColor(color_hex))
    c.circle(cx - r * 0.2, cy - r * 0.2, r * 0.22, fill=1, stroke=0)
    c.circle(cx + r * 0.2, cy - r * 0.15, r * 0.22, fill=1, stroke=0)
    # Stems
    c.setStrokeColor(HexColor("#2E7D32"))
    c.setLineWidth(0.4)
    c.line(cx - r * 0.2, cy, cx, cy + r * 0.4)
    c.line(cx + r * 0.2, cy + r * 0.05, cx, cy + r * 0.4)
    # Leaf
    c.setFillColor(HexColor("#4CAF50"))
    path = c.beginPath()
    path.moveTo(cx, cy + r * 0.4)
    path.curveTo(cx + r * 0.15, cy + r * 0.55, cx + r * 0.3, cy + r * 0.45, cx + r * 0.2, cy + r * 0.3)
    path.close()
    c.drawPath(path, fill=1, stroke=0)


def _draw_apple(c, cx, cy, r):
    """Apple shape."""
    c.circle(cx, cy - r * 0.05, r * 0.4, fill=1, stroke=0)
    # Stem
    c.setStrokeColor(HexColor("#795548"))
    c.setLineWidth(0.4)
    c.line(cx, cy + r * 0.35, cx + r * 0.05, cy + r * 0.55)
    # Leaf
    c.setFillColor(HexColor("#4CAF50"))
    path = c.beginPath()
    path.moveTo(cx + r * 0.05, cy + r * 0.5)
    path.curveTo(cx + r * 0.2, cy + r * 0.6, cx + r * 0.25, cy + r * 0.45, cx + r * 0.15, cy + r * 0.35)
    path.close()
    c.drawPath(path, fill=1, stroke=0)


def _draw_pizza(c, cx, cy, r):
    """Pizza slice."""
    path = c.beginPath()
    path.moveTo(cx, cy - r * 0.5)
    path.lineTo(cx - r * 0.4, cy + r * 0.4)
    path.curveTo(cx - r * 0.2, cy + r * 0.55, cx + r * 0.2, cy + r * 0.55, cx + r * 0.4, cy + r * 0.4)
    path.close()
    c.drawPath(path, fill=1, stroke=0)
    # Pepperoni
    c.setFillColor(HexColor("#D32F2F"))
    c.circle(cx - r * 0.1, cy + r * 0.1, r * 0.07, fill=1, stroke=0)
    c.circle(cx + r * 0.1, cy + r * 0.15, r * 0.06, fill=1, stroke=0)
    c.circle(cx, cy - r * 0.1, r * 0.06, fill=1, stroke=0)


def _draw_cake(c, cx, cy, r):
    """Birthday cake."""
    # Base
    c.rect(cx - r * 0.4, cy - r * 0.35, r * 0.8, r * 0.45, fill=1, stroke=0)
    # Top layer
    c.setFillColor(HexColor("#FFB6C1"))
    c.rect(cx - r * 0.4, cy + r * 0.1, r * 0.8, r * 0.1, fill=1, stroke=0)
    # Candle
    c.setFillColor(HexColor("#FFC107"))
    c.rect(cx - r * 0.03, cy + r * 0.2, r * 0.06, r * 0.25, fill=1, stroke=0)
    # Flame
    c.setFillColor(HexColor("#FF9800"))
    c.circle(cx, cy + r * 0.5, r * 0.05, fill=1, stroke=0)


def _parse_customization(customization: dict) -> dict:
    """Extract and prepare sticker data from order customization."""
    child_name = customization.get("child_name", "")
    last_name = customization.get("last_name", "")
    display_name = f"{child_name} {last_name}" if last_name else child_name
    bg_info = _get_bg_info(customization.get("background", "white"))
    return {
        "display_name": display_name,
        "phone_number": customization.get("phone_number", ""),
        "font_id": customization.get("font", "roboto"),
        "font_color_hex": customization.get("font_color", "#000000"),
        "motif_id": customization.get("motif"),
        "bg_info": bg_info,
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
    font_color = HexColor(data["font_color_hex"])
    bg_info = data["bg_info"]

    # Background: gradient or solid
    if bg_info["type"] == "gradient":
        _draw_gradient_rect(c, x, y, STICKER_W, STICKER_H, bg_info["colors"])
    else:
        c.setFillColor(HexColor(bg_info["color"]))
        c.rect(x, y, STICKER_W, STICKER_H, fill=1, stroke=0)

    # Border
    c.setStrokeColor(HexColor("#CCCCCC"))
    c.setLineWidth(0.15)
    c.rect(x, y, STICKER_W, STICKER_H, fill=0, stroke=1)

    content_x = x + 1.5 * mm
    motif_x_offset = 0

    # Motif icon (vector graphics) - size 5mm for visibility
    motif_id = data["motif_id"]
    if motif_id and motif_id in MOTIF_COLORS:
        motif_cx = content_x + 2.5 * mm
        motif_cy = y + STICKER_H / 2
        _draw_motif(c, motif_cx, motif_cy, motif_id, size=5.0)
        motif_x_offset = 6.5 * mm

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
