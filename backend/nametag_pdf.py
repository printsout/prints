"""
Nametag PDF Generator — v2
Renders nametag stickers using actual lucide-react SVG icon paths.
"""
import json
import math
import os
import re
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white, black
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ── Sticker grid layout ──────────────────────────────────────────────
STICKER_W = 29 * mm
STICKER_H = 13 * mm
COLS = 7
ROWS = 10
PAGE_W, PAGE_H = A4
LEFT_MARGIN = (PAGE_W - COLS * STICKER_W) / 2
TOP_MARGIN = (PAGE_H - ROWS * STICKER_H) / 2

# ── Load lucide SVG icon data ─────────────────────────────────────────
_ICONS_PATH = os.path.join(os.path.dirname(__file__), "lucide_icons.json")
with open(_ICONS_PATH) as _f:
    LUCIDE_ICONS = json.load(_f)

# ── Motif colors (same as frontend) ──────────────────────────────────
MOTIF_COLORS = {
    "star": "#FFB300", "heart": "#E53935", "cat": "#FF8C00", "dog": "#8D6E63",
    "rabbit": "#F48FB1", "fish": "#29B6F6", "bird": "#66BB6A", "bug": "#EF5350",
    "flower": "#E91E63", "tree": "#2E7D32", "sun": "#FFA726", "moon": "#5C6BC0",
    "cloud": "#78909C", "leaf": "#4CAF50", "snowflake": "#4FC3F7",
    "car": "#E53935", "plane": "#5C6BC0", "rocket": "#FF5722", "ship": "#0288D1",
    "bike": "#43A047", "train": "#3949AB",
    "trophy": "#FFA000", "medal": "#FF8F00", "gamepad": "#7E57C2",
    "football": "#1B5E20", "volleyball": "#FF8F00",
    "dumbbell": "#546E7A", "target": "#E53935", "swords": "#78909C",
    "swimming": "#0288D1", "mountain": "#6D4C41", "shield": "#42A5F5",
    "flag": "#E53935", "weight": "#546E7A", "running": "#FF5722",
    "gem": "#AB47BC", "music": "#EC407A", "sparkles": "#AB47BC",
    "anchor": "#37474F", "skull": "#78909C", "ghost": "#B0BEC5",
    "flame": "#FF5722", "zap": "#FFC107", "rainbow": "#E91E63",
    "baby": "#F48FB1", "icecream": "#F48FB1", "cherry": "#D32F2F",
    "apple": "#E53935", "pizza": "#FF8F00", "cake": "#EC407A",
    "crown": "#FFA000", "footprints": "#8D6E63", "horse": "#8D6E63",
}

# ── Background colors (same as frontend) ─────────────────────────────
BG_COLORS = {
    "white": "#FFFFFF", "lightpink": "#FFE4E6", "lightblue": "#DBEAFE",
    "lightyellow": "#FEF9C3", "lightgreen": "#D1FAE5", "lavender": "#EDE9FE",
    "peach": "#FFEDD5", "lightcyan": "#CFFAFE", "linen": "#FAF5FF",
    "mintcream": "#F0FFF4", "mistyrose": "#FFE4E1", "beige": "#FEF3C7",
    "skyblue": "#BAE6FD", "coral": "#FED7AA", "teal": "#CCFBF1",
    "gold": "#FDE68A", "orchid": "#F5D0FE", "salmon": "#FECACA",
    "aqua": "#A5F3FC", "ivory": "#FFFBEB", "silver": "#E2E8F0",
    "khaki": "#FEF08A", "plum": "#E9D5FF", "tan": "#FED7AA",
}

GRADIENTS = {
    "rainbow_bg": ["#ff9a9e", "#fad0c4", "#ffecd2", "#a8edea", "#d4fc79"],
    "g1": ["#667eea", "#764ba2"], "g2": ["#f093fb", "#f5576c"],
    "g3": ["#4facfe", "#00f2fe"], "g4": ["#43e97b", "#38f9d7"],
    "g5": ["#fa709a", "#fee140"], "g6": ["#a18cd1", "#fbc2eb"],
    "g7": ["#ffecd2", "#fcb69f"], "g8": ["#89f7fe", "#66a6ff"],
    "g9": ["#fddb92", "#d1fdff"], "g10": ["#c1dfc4", "#deecdd"],
}

# ── Register fonts ───────────────────────────────────────────────────
FONT_DIR = os.path.join(os.path.dirname(__file__), "fonts")
FONT_MAP = {}

def _register_fonts():
    google_fonts = {
        "roboto": "Roboto-Regular.ttf", "pacifico": "Pacifico-Regular.ttf",
        "lobster": "Lobster-Regular.ttf", "dancingscript": "DancingScript-Regular.ttf",
        "permanentmarker": "PermanentMarker-Regular.ttf", "caveat": "Caveat-Regular.ttf",
        "indieflower": "IndieFlower-Regular.ttf", "shadowsintolight": "ShadowsIntoLight-Regular.ttf",
        "amaticsc": "AmaticSC-Regular.ttf", "fredokaone": "FredokaOne-Regular.ttf",
        "comfortaa": "Comfortaa-Regular.ttf", "quicksand": "Quicksand-Regular.ttf",
    }
    for fid, fname in google_fonts.items():
        fpath = os.path.join(FONT_DIR, fname)
        if os.path.exists(fpath):
            try:
                pdfmetrics.registerFont(TTFont(fid, fpath))
                FONT_MAP[fid] = fid
            except Exception:
                pass
    FONT_MAP.setdefault("roboto", "Helvetica")

_register_fonts()


# ── SVG Path Parser ──────────────────────────────────────────────────
def _parse_svg_path(d: str):
    """Parse an SVG path d attribute into a list of commands."""
    commands = []
    # Tokenize: split into command letters and numbers
    tokens = re.findall(r'[MmLlHhVvCcSsQqTtAaZz]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?', d)
    i = 0
    current_cmd = None
    while i < len(tokens):
        token = tokens[i]
        if token.isalpha():
            current_cmd = token
            i += 1
        elif current_cmd is None:
            i += 1
            continue

        cmd = current_cmd
        if cmd in ('M', 'm'):
            x, y = float(tokens[i]), float(tokens[i+1])
            commands.append((cmd, x, y))
            i += 2
            current_cmd = 'L' if cmd == 'M' else 'l'
        elif cmd in ('L', 'l'):
            x, y = float(tokens[i]), float(tokens[i+1])
            commands.append((cmd, x, y))
            i += 2
        elif cmd in ('H', 'h'):
            x = float(tokens[i])
            commands.append((cmd, x))
            i += 1
        elif cmd in ('V', 'v'):
            y = float(tokens[i])
            commands.append((cmd, y))
            i += 1
        elif cmd in ('C', 'c'):
            args = [float(tokens[i+j]) for j in range(6)]
            commands.append((cmd, *args))
            i += 6
        elif cmd in ('S', 's'):
            args = [float(tokens[i+j]) for j in range(4)]
            commands.append((cmd, *args))
            i += 4
        elif cmd in ('Q', 'q'):
            args = [float(tokens[i+j]) for j in range(4)]
            commands.append((cmd, *args))
            i += 4
        elif cmd in ('T', 't'):
            x, y = float(tokens[i]), float(tokens[i+1])
            commands.append((cmd, x, y))
            i += 2
        elif cmd in ('A', 'a'):
            args = [float(tokens[i+j]) for j in range(7)]
            commands.append((cmd, *args))
            i += 7
        elif cmd in ('Z', 'z'):
            commands.append((cmd,))
        else:
            i += 1
    return commands


def _arc_to_bezier(cx, cy, rx, ry, start_angle, delta_angle):
    """Convert an arc segment to cubic bezier control points."""
    alpha = delta_angle / 2.0
    cos_a = math.cos(alpha)
    sin_a = math.sin(alpha)
    if abs(cos_a) < 1e-10 or abs(sin_a) < 1e-10:
        return []

    p1x = cx + rx * math.cos(start_angle)
    p1y = cy + ry * math.sin(start_angle)
    p4x = cx + rx * math.cos(start_angle + delta_angle)
    p4y = cy + ry * math.sin(start_angle + delta_angle)
    
    t = math.tan(delta_angle / 4.0)
    alpha_val = math.sin(delta_angle) * (math.sqrt(4 + 3 * t * t) - 1) / 3.0
    
    p2x = p1x - alpha_val * ry * math.sin(start_angle)
    p2y = p1y + alpha_val * rx * math.cos(start_angle)  
    p3x = p4x + alpha_val * ry * math.sin(start_angle + delta_angle)
    p3y = p4y - alpha_val * rx * math.cos(start_angle + delta_angle)
    
    return [(p2x, p2y, p3x, p3y, p4x, p4y)]


def _svg_arc_to_curves(x1, y1, rx, ry, phi, fa, fs, x2, y2):
    """Convert SVG arc parameters to cubic bezier curves (simplified)."""
    # For small arcs at our scale, approximate with a line
    return [('L', x2, y2)]


def _draw_svg_icon(c, cx, cy, size, icon_data, color_hex):
    """Draw a lucide SVG icon centered at (cx, cy) with given size."""
    if not icon_data:
        return
    
    scale = size / 24.0  # lucide icons are 24x24 viewBox
    # Transform: scale and translate so icon center (12,12) maps to (cx,cy)
    # In PDF: y-axis is UP, SVG: y-axis is DOWN → flip y
    
    def tx(x):
        return cx + (x - 12) * scale
    
    def ty(y):
        return cy - (y - 12) * scale  # flip y
    
    c.setStrokeColor(HexColor(color_hex))
    c.setFillColor(HexColor(color_hex))
    lw = max(0.4, size * 0.07)
    c.setLineWidth(lw)
    c.setLineCap(1)   # round cap
    c.setLineJoin(1)  # round join
    
    for elem in icon_data:
        etype = elem["type"]
        
        if etype == "circle":
            ecx, ecy, er = elem["cx"], elem["cy"], elem["r"]
            pcx, pcy = tx(ecx), ty(ecy)
            pr = er * scale
            if pr < 0.3:
                c.circle(pcx, pcy, max(0.3, pr), fill=1, stroke=0)
            else:
                c.circle(pcx, pcy, pr, fill=0, stroke=1)
        
        elif etype == "rect":
            rx = tx(elem.get("x", 0))
            ry_top = ty(elem.get("y", 0))
            rw = elem.get("width", 0) * scale
            rh = elem.get("height", 0) * scale
            c.rect(rx, ry_top - rh, rw, rh, fill=0, stroke=1)
        
        elif etype == "line":
            c.line(tx(elem["x1"]), ty(elem["y1"]), tx(elem["x2"]), ty(elem["y2"]))
        
        elif etype == "path":
            d = elem.get("d", "")
            if not d:
                continue
            cmds = _parse_svg_path(d)
            if not cmds:
                continue
            
            path = c.beginPath()
            cur_x, cur_y = 0.0, 0.0
            start_x, start_y = 0.0, 0.0
            last_cp_x, last_cp_y = 0.0, 0.0
            last_cmd = None
            
            for cmd_data in cmds:
                cmd = cmd_data[0]
                
                if cmd == 'M':
                    cur_x, cur_y = cmd_data[1], cmd_data[2]
                    start_x, start_y = cur_x, cur_y
                    path.moveTo(tx(cur_x), ty(cur_y))
                elif cmd == 'm':
                    cur_x += cmd_data[1]
                    cur_y += cmd_data[2]
                    start_x, start_y = cur_x, cur_y
                    path.moveTo(tx(cur_x), ty(cur_y))
                
                elif cmd == 'L':
                    cur_x, cur_y = cmd_data[1], cmd_data[2]
                    path.lineTo(tx(cur_x), ty(cur_y))
                elif cmd == 'l':
                    cur_x += cmd_data[1]
                    cur_y += cmd_data[2]
                    path.lineTo(tx(cur_x), ty(cur_y))
                
                elif cmd == 'H':
                    cur_x = cmd_data[1]
                    path.lineTo(tx(cur_x), ty(cur_y))
                elif cmd == 'h':
                    cur_x += cmd_data[1]
                    path.lineTo(tx(cur_x), ty(cur_y))
                
                elif cmd == 'V':
                    cur_y = cmd_data[1]
                    path.lineTo(tx(cur_x), ty(cur_y))
                elif cmd == 'v':
                    cur_y += cmd_data[1]
                    path.lineTo(tx(cur_x), ty(cur_y))
                
                elif cmd == 'C':
                    x1, y1, x2, y2, x, y = cmd_data[1:7]
                    path.curveTo(tx(x1), ty(y1), tx(x2), ty(y2), tx(x), ty(y))
                    last_cp_x, last_cp_y = x2, y2
                    cur_x, cur_y = x, y
                elif cmd == 'c':
                    x1, y1, x2, y2, x, y = cmd_data[1:7]
                    ax1, ay1 = cur_x + x1, cur_y + y1
                    ax2, ay2 = cur_x + x2, cur_y + y2
                    ax, ay = cur_x + x, cur_y + y
                    path.curveTo(tx(ax1), ty(ay1), tx(ax2), ty(ay2), tx(ax), ty(ay))
                    last_cp_x, last_cp_y = ax2, ay2
                    cur_x, cur_y = ax, ay
                
                elif cmd == 'S':
                    x2, y2, x, y = cmd_data[1:5]
                    # Reflect last control point
                    if last_cmd in ('C', 'c', 'S', 's'):
                        x1 = 2 * cur_x - last_cp_x
                        y1 = 2 * cur_y - last_cp_y
                    else:
                        x1, y1 = cur_x, cur_y
                    path.curveTo(tx(x1), ty(y1), tx(x2), ty(y2), tx(x), ty(y))
                    last_cp_x, last_cp_y = x2, y2
                    cur_x, cur_y = x, y
                elif cmd == 's':
                    x2, y2, x, y = cmd_data[1:5]
                    if last_cmd in ('C', 'c', 'S', 's'):
                        x1 = 2 * cur_x - last_cp_x
                        y1 = 2 * cur_y - last_cp_y
                    else:
                        x1, y1 = cur_x, cur_y
                    ax2, ay2 = cur_x + x2, cur_y + y2
                    ax, ay = cur_x + x, cur_y + y
                    path.curveTo(tx(x1), ty(y1), tx(ax2), ty(ay2), tx(ax), ty(ay))
                    last_cp_x, last_cp_y = ax2, ay2
                    cur_x, cur_y = ax, ay
                
                elif cmd == 'Q':
                    qx1, qy1, x, y = cmd_data[1:5]
                    # Convert quadratic to cubic bezier
                    cx1 = cur_x + 2/3 * (qx1 - cur_x)
                    cy1 = cur_y + 2/3 * (qy1 - cur_y)
                    cx2 = x + 2/3 * (qx1 - x)
                    cy2 = y + 2/3 * (qy1 - y)
                    path.curveTo(tx(cx1), ty(cy1), tx(cx2), ty(cy2), tx(x), ty(y))
                    last_cp_x, last_cp_y = qx1, qy1
                    cur_x, cur_y = x, y
                elif cmd == 'q':
                    qx1, qy1, x, y = cmd_data[1:5]
                    aqx1, aqy1 = cur_x + qx1, cur_y + qy1
                    ax, ay = cur_x + x, cur_y + y
                    cx1 = cur_x + 2/3 * (aqx1 - cur_x)
                    cy1 = cur_y + 2/3 * (aqy1 - cur_y)
                    cx2 = ax + 2/3 * (aqx1 - ax)
                    cy2 = ay + 2/3 * (aqy1 - ay)
                    path.curveTo(tx(cx1), ty(cy1), tx(cx2), ty(cy2), tx(ax), ty(ay))
                    last_cp_x, last_cp_y = aqx1, aqy1
                    cur_x, cur_y = ax, ay
                
                elif cmd in ('A', 'a'):
                    # SVG arc — approximate with line for simplicity at small scale
                    if cmd == 'A':
                        x, y = cmd_data[6], cmd_data[7]
                    else:
                        x, y = cur_x + cmd_data[6], cur_y + cmd_data[7]
                    path.lineTo(tx(x), ty(y))
                    cur_x, cur_y = x, y
                
                elif cmd in ('Z', 'z'):
                    path.close()
                    cur_x, cur_y = start_x, start_y
                
                last_cmd = cmd
            
            c.drawPath(path, fill=0, stroke=1)


# ── Gradient rendering ───────────────────────────────────────────────
def _hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def _draw_gradient_rect(c, x, y, w, h, colors):
    """Draw a horizontal gradient rectangle."""
    strips = max(int(w / 0.5), 20)
    sw = w / strips
    rgbs = [_hex_to_rgb(col) for col in colors]
    segs = len(rgbs) - 1
    for i in range(strips):
        t = i / max(strips - 1, 1)
        sp = t * segs
        si = min(int(sp), segs - 1)
        st = sp - si
        r = int(rgbs[si][0] + (rgbs[si+1][0] - rgbs[si][0]) * st)
        g = int(rgbs[si][1] + (rgbs[si+1][1] - rgbs[si][1]) * st)
        b = int(rgbs[si][2] + (rgbs[si+1][2] - rgbs[si][2]) * st)
        c.setFillColor(HexColor("#{:02x}{:02x}{:02x}".format(r, g, b)))
        c.rect(x + i * sw, y, sw + 0.5, h, fill=1, stroke=0)


# ── Sticker drawing ─────────────────────────────────────────────────
def _draw_sticker(c, x, y, data, font_name):
    """Render a single sticker at (x, y) bottom-left."""
    bg = data["bg"]
    font_color = HexColor(data["font_color_hex"])

    # Background
    if bg["type"] == "gradient":
        _draw_gradient_rect(c, x, y, STICKER_W, STICKER_H, bg["colors"])
    else:
        c.setFillColor(HexColor(bg["color"]))
        c.rect(x, y, STICKER_W, STICKER_H, fill=1, stroke=0)

    # Border
    c.setStrokeColor(HexColor("#CCCCCC"))
    c.setLineWidth(0.15)
    c.rect(x, y, STICKER_W, STICKER_H, fill=0, stroke=1)

    # Content layout
    pad = 1.5 * mm
    motif_offset = 0

    # Motif icon
    motif_id = data["motif_id"]
    if motif_id and motif_id in LUCIDE_ICONS:
        icon_size = 6 * mm
        motif_cx = x + pad + icon_size / 2
        motif_cy = y + STICKER_H / 2
        color = MOTIF_COLORS.get(motif_id, "#E53935")
        _draw_svg_icon(c, motif_cx, motif_cy, icon_size, LUCIDE_ICONS[motif_id], color)
        motif_offset = icon_size + 1 * mm

    # Text area
    text_x = x + pad + motif_offset
    text_w = STICKER_W - pad * 2 - motif_offset
    name = data["display_name"]
    phone = data["phone_number"]

    c.setFillColor(font_color)
    fn = FONT_MAP.get(data["font_id"], "Helvetica")

    if phone:
        # Two lines: name + phone
        name_size = min(6, text_w / max(len(name), 1) * 1.8)
        name_size = max(3.5, min(name_size, 6))
        c.setFont(fn, name_size)
        c.drawString(text_x, y + STICKER_H * 0.55, name)
        c.setFont("Helvetica", 3.5)
        c.drawString(text_x, y + STICKER_H * 0.2, phone)
    else:
        # Single line: name centered vertically
        name_size = min(7, text_w / max(len(name), 1) * 1.8)
        name_size = max(4, min(name_size, 7))
        c.setFont(fn, name_size)
        c.drawString(text_x, y + STICKER_H * 0.35, name)


# ── Main generation function ─────────────────────────────────────────
def generate_nametag_pdf(customization: dict, output_path: str):
    """Generate a full A4 sheet of nametag stickers."""
    # Parse customization
    child_name = customization.get("child_name", "")
    last_name = customization.get("last_name", "")
    display_name = f"{child_name} {last_name}".strip() if last_name else child_name

    bg_id = customization.get("background", "white")
    if bg_id in GRADIENTS:
        bg = {"type": "gradient", "colors": GRADIENTS[bg_id]}
    elif bg_id in BG_COLORS:
        bg = {"type": "solid", "color": BG_COLORS[bg_id]}
    else:
        bg = {"type": "solid", "color": "#FFFFFF"}

    data = {
        "display_name": display_name,
        "phone_number": customization.get("phone_number", ""),
        "font_id": customization.get("font", "roboto"),
        "font_color_hex": customization.get("font_color", "#000000"),
        "motif_id": customization.get("motif"),
        "bg": bg,
    }

    font_name = FONT_MAP.get(data["font_id"], "Helvetica")

    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    c_pdf = canvas.Canvas(output_path, pagesize=A4)

    sticker_count = 0

    for page in range(2):
        if page > 0:
            c_pdf.showPage()
        for row in range(ROWS):
            for col in range(COLS):
                x = LEFT_MARGIN + col * STICKER_W
                y = PAGE_H - TOP_MARGIN - (row + 1) * STICKER_H
                _draw_sticker(c_pdf, x, y, data, font_name)
                sticker_count += 1

    c_pdf.save()
    return output_path
