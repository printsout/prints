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

# Unicode symbols for motifs (simple representations for PDF)
MOTIF_SYMBOLS = {
    "star": "\u2605", "heart": "\u2665", "cat": "\U0001F431", "dog": "\U0001F436",
    "rabbit": "\U0001F430", "rainbow": "\u25CF", "crown": "\u265B",
    "rocket": "\u2191", "sparkles": "\u2728", "flower": "\u2740",
    "fish": "\u2248", "bird": "\u266A", "bug": "\u2022", "baby": "\u263A",
    "horse": "\u2658", "footprints": "\u2022",
    "tree": "\u2666", "sun": "\u263C", "moon": "\u263E", "cloud": "\u2601",
    "leaf": "\u2618", "snowflake": "\u2744",
    "car": "\u2022", "plane": "\u2708", "ship": "\u2693", "bike": "\u2022",
    "train": "\u2022",
    "trophy": "\u2606", "medal": "\u2605", "gamepad": "\u2022",
    "football": "\u26BD", "volleyball": "\u2022", "dumbbell": "\u2022",
    "target": "\u25CE", "swords": "\u2694", "swimming": "\u2248",
    "mountain": "\u25B2", "shield": "\u2022", "flag": "\u2691",
    "weight": "\u2022", "running": "\u2022",
    "gem": "\u2666", "music": "\u266B", "anchor": "\u2693",
    "skull": "\u2620", "ghost": "\u2022", "flame": "\u2022", "zap": "\u26A1",
    "icecream": "\u2022", "cherry": "\u2022", "apple": "\u2022",
    "pizza": "\u2022", "cake": "\u2022",
}

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


def generate_nametag_pdf(customization: dict, output_path: str):
    """Generate an A4 PDF with 140 name tag stickers."""
    child_name = customization.get("child_name", "")
    last_name = customization.get("last_name", "")
    phone_number = customization.get("phone_number", "")
    font_id = customization.get("font", "roboto")
    font_color_hex = customization.get("font_color", "#000000")
    motif_id = customization.get("motif")
    bg_id = customization.get("background", "white")

    display_name = child_name
    if last_name:
        display_name = f"{child_name} {last_name}"

    bg_hex = _get_bg_color(bg_id)
    font_color = HexColor(font_color_hex)
    bg_color = HexColor(bg_hex)

    c = canvas.Canvas(output_path, pagesize=A4)
    c.setTitle("Namnlappar - Printsout")
    c.setAuthor("Printsout AB")

    font_name = _register_font(c, font_id)

    # Draw cut marks (light gray guidelines)
    c.setStrokeColor(HexColor("#DDDDDD"))
    c.setLineWidth(0.25)

    for row in range(ROWS + 1):
        y = PAGE_H - MARGIN_TOP - row * STICKER_H
        c.line(MARGIN_LEFT - 2 * mm, y, MARGIN_LEFT + GRID_W + 2 * mm, y)

    for col in range(COLS + 1):
        x = MARGIN_LEFT + col * STICKER_W
        c.line(x, PAGE_H - MARGIN_TOP + 2 * mm, x, PAGE_H - MARGIN_TOP - GRID_H - 2 * mm)

    # Draw each sticker
    for i in range(TOTAL_STICKERS):
        col = i % COLS
        row = i // COLS

        x = MARGIN_LEFT + col * STICKER_W
        y = PAGE_H - MARGIN_TOP - (row + 1) * STICKER_H  # bottom-left of sticker

        # Background fill
        c.setFillColor(bg_color)
        c.rect(x, y, STICKER_W, STICKER_H, fill=1, stroke=0)

        # Light border
        c.setStrokeColor(HexColor("#CCCCCC"))
        c.setLineWidth(0.15)
        c.rect(x, y, STICKER_W, STICKER_H, fill=0, stroke=1)

        # Content area
        content_x = x + 1.5 * mm
        content_w = STICKER_W - 3 * mm

        # Motif symbol on the left
        motif_x_offset = 0
        if motif_id and motif_id in MOTIF_SYMBOLS:
            symbol = MOTIF_SYMBOLS[motif_id]
            motif_color_hex = MOTIF_COLORS.get(motif_id, "#000000")
            c.setFillColor(HexColor(motif_color_hex))
            c.setFont("Helvetica", 6)
            try:
                c.drawString(content_x, y + STICKER_H / 2 - 1.5 * mm, symbol)
            except Exception:
                c.drawString(content_x, y + STICKER_H / 2 - 1.5 * mm, "\u2022")
            motif_x_offset = 4 * mm

        # Name text
        text_x = content_x + motif_x_offset
        available_w = content_w - motif_x_offset

        c.setFillColor(font_color)

        # Calculate font size to fit
        name_font_size = 7
        if len(display_name) > 15:
            name_font_size = 5.5
        elif len(display_name) > 10:
            name_font_size = 6

        c.setFont(font_name, name_font_size)

        if phone_number:
            # Name higher, phone below
            name_y = y + STICKER_H * 0.58
            c.drawString(text_x, name_y, display_name)

            phone_font_size = max(3.5, name_font_size - 2)
            c.setFont(font_name, phone_font_size)
            c.setFillColor(HexColor(font_color_hex))
            c.globalState = None
            phone_y = y + STICKER_H * 0.2
            c.drawString(text_x, phone_y, phone_number)
        else:
            # Center name vertically
            name_y = y + STICKER_H / 2 - name_font_size / 2.5
            c.drawString(text_x, name_y, display_name)

    c.save()
    return output_path
