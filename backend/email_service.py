"""Email templates and sending utilities for Printsout"""
import os
import logging
import asyncio
from datetime import datetime

import resend

logger = logging.getLogger(__name__)

SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
ADMIN_EMAIL = os.environ.get('ADMIN_NOTIFICATION_EMAIL', 'info@printsout.se')

# ─── Shared template parts ───────────────────────────

_HEADER = """
<div style="background:#1a1a2e;padding:30px;text-align:center">
  <h1 style="color:#fff;margin:0;font-size:26px">PrintsOut</h1>
</div>"""

_FOOTER = f"""
<div style="background:#f0f0f0;padding:20px;text-align:center;font-size:12px;color:#999">
  <p style="margin:0">&copy; {datetime.now().year} PrintsOut. Alla rättigheter förbehållna.</p>
</div>"""

_SIGNATURE = """
<p style="font-size:15px;color:#555;margin-top:24px">
  Med vänliga hälsningar<br>
  <strong style="color:#1a1a2e">PrintsOut</strong>
</p>"""


def _wrap_email(body_html: str) -> str:
    return f'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff">{_HEADER}<div style="padding:30px">{body_html}{_SIGNATURE}</div>{_FOOTER}</div>'


def _build_items_table(items: list, show_price: bool = True) -> str:
    """Build an HTML table of order items."""
    rows = ""
    for item in items:
        qty = item.get("quantity", 1)
        name = item.get("product_name", "Produkt")
        price_col = f'<td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;color:#333">{item.get("price", 0):.0f} kr</td>' if show_price else ""
        rows += (
            f'<tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#333">{name}</td>'
            f'<td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;color:#333">{qty}</td>'
            f'{price_col}</tr>'
        )
    price_header = '<th style="text-align:right;padding:8px 0;color:#1a1a2e">Pris</th>' if show_price else ""
    return f"""
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead><tr style="border-bottom:2px solid #1a1a2e">
        <th style="text-align:left;padding:8px 0;color:#1a1a2e">Produkt</th>
        <th style="text-align:center;padding:8px 0;color:#1a1a2e">Antal</th>
        {price_header}
      </tr></thead>
      <tbody>{rows}</tbody>
    </table>"""


def _build_info_box(content: str, border_color: str = "#2a9d8f") -> str:
    return f'<div style="background:#f8f9fa;border-radius:8px;padding:20px;margin:20px 0;border-left:4px solid {border_color}">{content}</div>'


# ─── Order Confirmation ──────────────────────────────

def build_order_confirmation_html(order: dict) -> str:
    order_id = order.get("order_id", "")[:8]
    created = order.get("created_at", "")[:10]
    total = order.get("total_amount", 0)

    info = _build_info_box(
        f'<p style="margin:0 0 6px 0;color:#555;font-size:14px"><strong>Ordernummer:</strong> #{order_id}</p>'
        f'<p style="margin:0;color:#555;font-size:14px"><strong>Datum:</strong> {created}</p>'
    )
    items_table = _build_items_table(order.get("items", []), show_price=True)
    total_html = f'<div style="text-align:right;margin-top:16px;padding-top:12px;border-top:2px solid #1a1a2e"><p style="font-size:18px;font-weight:700;color:#1a1a2e;margin:0">Totalt: {total:.0f} kr</p></div>'

    body = f"""
    <p style="font-size:16px;color:#333">Hej!</p>
    <p style="font-size:16px;color:#333;line-height:1.6">Tack för din beställning hos oss!</p>
    <p style="font-size:16px;color:#333;line-height:1.6">Vi har tagit emot din order och den behandlas just nu. Här är en sammanfattning:</p>
    {info}
    <p style="font-size:15px;color:#333;font-weight:600;margin-bottom:8px">Dina produkter:</p>
    {items_table}
    {total_html}
    <p style="font-size:15px;color:#333;line-height:1.6;margin-top:24px">Vi återkommer med en leveransbekräftelse så snart din order har skickats.</p>
    <p style="font-size:15px;color:#333;line-height:1.6">Har du några frågor är du alltid välkommen att kontakta oss.</p>
    """
    return _wrap_email(body)


# ─── Shipping Notification ───────────────────────────

CARRIER_URLS = {
    "postnord": "https://tracking.postnord.com/tracking.html?id={}",
    "dhl": "https://www.dhl.com/se-sv/home/tracking.html?tracking-id={}",
    "bring": "https://tracking.bring.se/tracking/{}",
    "schenker": "https://www.dbschenker.com/se-sv/spara/{}",
    "ups": "https://www.ups.com/track?tracknum={}",
}
CARRIER_NAMES = {"postnord": "PostNord", "dhl": "DHL", "bring": "Bring", "schenker": "DB Schenker", "ups": "UPS"}


def _build_tracking_section(order: dict) -> str:
    tracking_number = order.get("tracking_number", "")
    if not tracking_number:
        return ""
    carrier = order.get("tracking_carrier", "postnord")
    url = CARRIER_URLS.get(carrier, CARRIER_URLS["postnord"]).format(tracking_number)
    name = CARRIER_NAMES.get(carrier, carrier or "PostNord")
    return f"""
    <div style="background:#eef6ff;border-radius:8px;padding:20px;margin:20px 0;border-left:4px solid #3b82f6;text-align:center">
      <p style="margin:0 0 4px 0;color:#555;font-size:13px;font-weight:600">SPÅRNINGSNUMMER ({name})</p>
      <p style="font-size:20px;font-weight:700;color:#1a1a2e;margin:8px 0;letter-spacing:1px;font-family:monospace">{tracking_number}</p>
      <a href="{url}" style="display:inline-block;background:#3b82f6;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;margin-top:8px">Spåra ditt paket</a>
    </div>"""


def _build_address_section(order: dict) -> str:
    shipping = order.get("shipping_address", {}) or {}
    lines = []
    if shipping.get("street"):
        lines.append(shipping["street"])
    postal_city = f"{shipping.get('postal_code', '')} {shipping.get('city', '')}".strip()
    if postal_city:
        lines.append(postal_city)
    address_html = "<br>".join(lines) if lines else "Se din orderbekräftelse"
    return f"""
    <div style="background:#f8f9fa;border-radius:8px;padding:16px;margin:20px 0">
      <p style="margin:0 0 4px 0;color:#555;font-size:13px;font-weight:600">LEVERANSADRESS:</p>
      <p style="margin:0;color:#333;font-size:14px">{address_html}</p>
    </div>"""


def build_shipping_notification_html(order: dict) -> str:
    order_id = order.get("order_id", "")[:8]
    info = _build_info_box(f'<p style="margin:0 0 6px 0;color:#555;font-size:14px"><strong>Ordernummer:</strong> #{order_id}</p>')
    tracking = _build_tracking_section(order)
    items_table = _build_items_table(order.get("items", []), show_price=False)
    address = _build_address_section(order)

    body = f"""
    <p style="font-size:16px;color:#333">Hej!</p>
    <p style="font-size:16px;color:#333;line-height:1.6">Din beställning har nu skickats!</p>
    {info}
    {tracking}
    <p style="font-size:15px;color:#333;font-weight:600;margin-bottom:8px">Produkter i din leverans:</p>
    {items_table}
    {address}
    <p style="font-size:15px;color:#333;line-height:1.6;margin-top:24px">Har du frågor om din leverans? Tveka inte att kontakta oss!</p>
    """
    return _wrap_email(body)


# ─── Discount Email ──────────────────────────────────

def build_discount_email_html(discount_code: str, code_doc: dict, custom_message: str, site_url: str) -> str:
    msg_html = f'<p style="color: #333; font-size: 16px; line-height: 1.6;">{custom_message}</p>' if custom_message else ''
    expires = f'Koden gäller till {code_doc["expires_at"][:10]}.' if code_doc.get('expires_at') else ''

    body = f"""
    <h2 style="color: #1a1a2e; margin-top: 0;">Exklusiv rabatt till dig!</h2>
    {msg_html}
    <div style="background: #f0fdf4; border: 2px dashed #2a9d8f; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
      <p style="color: #666; margin: 0 0 8px 0; font-size: 14px;">Din rabattkod:</p>
      <p style="font-size: 32px; font-weight: bold; color: #1a1a2e; margin: 0; letter-spacing: 3px; font-family: monospace;">{discount_code}</p>
      <p style="color: #2a9d8f; margin: 12px 0 0 0; font-size: 20px; font-weight: bold;">{code_doc['discount_percent']}% rabatt</p>
    </div>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">Ange koden i kassan för att få rabatten. {expires}</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{site_url}/produkter" style="background: #2a9d8f; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Handla nu</a>
    </div>
    """
    return _wrap_email(body)


# ─── Password Reset ──────────────────────────────────

def build_password_reset_html(reset_url: str) -> str:
    body = f"""
    <h2 style="color:#1a1a2e;margin-top:0">Återställ ditt lösenord</h2>
    <p style="font-size:16px;color:#333;line-height:1.6">Vi fick en förfrågan om att återställa lösenordet för ditt konto.</p>
    <p style="font-size:16px;color:#333;line-height:1.6">Klicka på länken nedan för att skapa ett nytt lösenord:</p>
    <div style="text-align:center;margin:30px 0">
      <a href="{reset_url}" style="background:#2a9d8f;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">Återställ lösenord</a>
    </div>
    <p style="font-size:14px;color:#666;line-height:1.6">Om du inte begärde detta, kan du ignorera detta e-postmeddelande. Länken är giltig i 30 minuter.</p>
    """
    return _wrap_email(body)


# ─── Admin Order Notification ────────────────────────

def build_admin_order_notification_html(order: dict) -> str:
    order_id = order.get("order_id", "")[:8]
    created = order.get("created_at", "")[:16].replace("T", " ")
    total = order.get("total_amount", 0)
    customer_email = order.get("email", "Okänd")
    customer_name = order.get("name", order.get("shipping_address", {}).get("name", ""))

    shipping = order.get("shipping_address", {}) or {}
    address_lines = []
    if shipping.get("name"):
        address_lines.append(f"<strong>{shipping['name']}</strong>")
    if shipping.get("street"):
        address_lines.append(shipping["street"])
    postal_city = f"{shipping.get('postal_code', '')} {shipping.get('city', '')}".strip()
    if postal_city:
        address_lines.append(postal_city)
    if shipping.get("phone"):
        address_lines.append(f"Tel: {shipping['phone']}")
    address_html = "<br>".join(address_lines) if address_lines else "Ej angiven"

    items_table = _build_items_table(order.get("items", []), show_price=True)
    total_html = f'<div style="text-align:right;margin-top:16px;padding-top:12px;border-top:2px solid #1a1a2e"><p style="font-size:20px;font-weight:700;color:#2a9d8f;margin:0">Totalt: {total:.0f} kr</p></div>'

    body = f"""
    <h2 style="color:#1a1a2e;margin-top:0">Ny beställning!</h2>
    <p style="font-size:16px;color:#333;line-height:1.6">En ny order har lagts och betalningen är bekräftad.</p>

    <div style="background:#f0fdf4;border-radius:8px;padding:20px;margin:20px 0;border-left:4px solid #2a9d8f">
      <p style="margin:0 0 6px 0;color:#555;font-size:14px"><strong>Ordernummer:</strong> #{order_id}</p>
      <p style="margin:0 0 6px 0;color:#555;font-size:14px"><strong>Datum:</strong> {created}</p>
      <p style="margin:0 0 6px 0;color:#555;font-size:14px"><strong>Kund:</strong> {customer_name or customer_email}</p>
      <p style="margin:0;color:#555;font-size:14px"><strong>E-post:</strong> {customer_email}</p>
    </div>

    <p style="font-size:15px;color:#333;font-weight:600;margin-bottom:8px">Beställda produkter:</p>
    {items_table}
    {total_html}

    <div style="background:#f8f9fa;border-radius:8px;padding:16px;margin:20px 0">
      <p style="margin:0 0 4px 0;color:#555;font-size:13px;font-weight:600">LEVERANSADRESS:</p>
      <p style="margin:0;color:#333;font-size:14px">{address_html}</p>
    </div>

    <p style="font-size:15px;color:#333;line-height:1.6;margin-top:24px">Logga in på admin-panelen för att hantera ordern.</p>
    """
    return _wrap_email(body)


# ─── Send Functions ──────────────────────────────────

async def send_order_confirmation(order: dict):
    try:
        html = build_order_confirmation_html(order)
        params = {
            "from": f"PrintsOut <{SENDER_EMAIL}>",
            "to": [order["email"]],
            "subject": f"Orderbekräftelse #{order.get('order_id', '')[:8]} - PrintsOut",
            "html": html,
            "headers": {"List-Unsubscribe": f"<mailto:{SENDER_EMAIL}?subject=unsubscribe>"}
        }
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Order confirmation sent to {order['email']}")
    except Exception as e:
        logger.warning(f"Failed to send order confirmation: {e}")


async def send_discount_emails(discount_code: str, code_doc: dict, custom_message: str, all_emails: set, site_url: str) -> tuple:
    html = build_discount_email_html(discount_code, code_doc, custom_message, site_url)
    sent_count = 0
    failed_emails = []
    for email in all_emails:
        try:
            params = {
                "from": f"PrintsOut <{SENDER_EMAIL}>",
                "to": [email],
                "subject": f"Din exklusiva rabattkod: {discount_code} — {code_doc['discount_percent']}% rabatt!",
                "html": html,
                "headers": {"List-Unsubscribe": f"<mailto:{SENDER_EMAIL}?subject=unsubscribe>"}
            }
            await asyncio.to_thread(resend.Emails.send, params)
            sent_count += 1
        except Exception as e:
            logger.error(f"Failed to send email to {email}: {e}")
            failed_emails.append(email)
    return sent_count, failed_emails


async def send_shipping_notification(order: dict):
    try:
        html = build_shipping_notification_html(order)
        params = {
            "from": f"PrintsOut <{SENDER_EMAIL}>",
            "to": [order["email"]],
            "subject": f"Din order #{order.get('order_id', '')[:8]} har skickats! - PrintsOut",
            "html": html,
            "headers": {"List-Unsubscribe": f"<mailto:{SENDER_EMAIL}?subject=unsubscribe>"}
        }
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Shipping notification sent to {order['email']}")
    except Exception as e:
        logger.warning(f"Failed to send shipping notification: {e}")


async def send_admin_order_notification(order: dict):
    try:
        html = build_admin_order_notification_html(order)
        order_id = order.get("order_id", "")[:8]
        total = order.get("total_amount", 0)
        params = {
            "from": f"PrintsOut <{SENDER_EMAIL}>",
            "to": [ADMIN_EMAIL],
            "subject": f"Ny beställning #{order_id} — {total:.0f} kr",
            "html": html,
        }
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Admin order notification sent to {ADMIN_EMAIL}")
    except Exception as e:
        logger.warning(f"Failed to send admin order notification: {e}")
