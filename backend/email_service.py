"""Email templates and sending utilities for Printsout"""
import os
import logging
import asyncio
from datetime import datetime

import resend

logger = logging.getLogger(__name__)

SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')


def build_order_confirmation_html(order: dict) -> str:
    items_html = ""
    for item in order.get("items", []):
        qty = item.get("quantity", 1)
        price = item.get("price", 0)
        name = item.get("product_name", "Produkt")
        items_html += (
            f'<tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#333">{name}</td>'
            f'<td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;color:#333">{qty}</td>'
            f'<td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;color:#333">{price:.0f} kr</td></tr>'
        )

    total = order.get("total_amount", 0)
    order_id = order.get("order_id", "")[:8]
    created = order.get("created_at", "")[:10]

    return f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff">
      <div style="background:#1a1a2e;padding:30px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:26px">PrintsOut</h1>
      </div>
      <div style="padding:30px">
        <p style="font-size:16px;color:#333">Hej!</p>
        <p style="font-size:16px;color:#333;line-height:1.6">
          Tack för din beställning hos oss 🎉
        </p>
        <p style="font-size:16px;color:#333;line-height:1.6">
          Vi har tagit emot din order och den behandlas just nu. Här är en sammanfattning:
        </p>
        <div style="background:#f8f9fa;border-radius:8px;padding:20px;margin:20px 0">
          <p style="margin:0 0 6px 0;color:#555;font-size:14px"><strong>Ordernummer:</strong> #{order_id}</p>
          <p style="margin:0;color:#555;font-size:14px"><strong>Datum:</strong> {created}</p>
        </div>
        <p style="font-size:15px;color:#333;font-weight:600;margin-bottom:8px">Dina produkter:</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <thead>
            <tr style="border-bottom:2px solid #1a1a2e">
              <th style="text-align:left;padding:8px 0;color:#1a1a2e">Produkt</th>
              <th style="text-align:center;padding:8px 0;color:#1a1a2e">Antal</th>
              <th style="text-align:right;padding:8px 0;color:#1a1a2e">Pris</th>
            </tr>
          </thead>
          <tbody>{items_html}</tbody>
        </table>
        <div style="text-align:right;margin-top:16px;padding-top:12px;border-top:2px solid #1a1a2e">
          <p style="font-size:18px;font-weight:700;color:#1a1a2e;margin:0">Totalt: {total:.0f} kr</p>
        </div>
        <p style="font-size:15px;color:#333;line-height:1.6;margin-top:24px">
          Vi återkommer med en leveransbekräftelse så snart din order har skickats.
        </p>
        <p style="font-size:15px;color:#333;line-height:1.6">
          Har du några frågor är du alltid välkommen att kontakta oss.
        </p>
        <p style="font-size:15px;color:#333;line-height:1.6">
          Tack för att du handlar hos oss!
        </p>
        <p style="font-size:15px;color:#555;margin-top:24px">
          Med vänliga hälsningar<br>
          <strong style="color:#1a1a2e">PrintsOut</strong>
        </p>
      </div>
      <div style="background:#f0f0f0;padding:20px;text-align:center;font-size:12px;color:#999">
        <p style="margin:0">© {datetime.now().year} PrintsOut. Alla rättigheter förbehållna.</p>
      </div>
    </div>
    """


def build_discount_email_html(discount_code: str, code_doc: dict, custom_message: str, site_url: str) -> str:
    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: #1a1a2e; padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Printsout</h1>
      </div>
      <div style="padding: 30px;">
        <h2 style="color: #1a1a2e; margin-top: 0;">Exklusiv rabatt till dig!</h2>
        {f'<p style="color: #333; font-size: 16px; line-height: 1.6;">{custom_message}</p>' if custom_message else ''}
        <div style="background: #f0fdf4; border: 2px dashed #2a9d8f; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
          <p style="color: #666; margin: 0 0 8px 0; font-size: 14px;">Din rabattkod:</p>
          <p style="font-size: 32px; font-weight: bold; color: #1a1a2e; margin: 0; letter-spacing: 3px; font-family: monospace;">{discount_code}</p>
          <p style="color: #2a9d8f; margin: 12px 0 0 0; font-size: 20px; font-weight: bold;">{code_doc['discount_percent']}% rabatt</p>
        </div>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Ange koden i kassan for att fa rabatten.
          {f'Koden gäller till {code_doc["expires_at"][:10]}.' if code_doc.get('expires_at') else ''}
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{site_url}/produkter" style="background: #2a9d8f; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Handla nu</a>
        </div>
      </div>
      <div style="background: #f8fafc; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p>Printsout — Personliga produkter med dina bilder</p>
      </div>
    </div>
    """


async def send_order_confirmation(order: dict):
    """Send order confirmation email to customer"""
    try:
        html = build_order_confirmation_html(order)
        order_id = order.get("order_id", "")[:8]
        params = {
            "from": f"PrintsOut <{SENDER_EMAIL}>",
            "to": [order["email"]],
            "subject": f"Orderbekräftelse #{order_id} - PrintsOut",
            "html": html,
            "headers": {
                "List-Unsubscribe": f"<mailto:{SENDER_EMAIL}?subject=unsubscribe>"
            }
        }
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Order confirmation email sent to {order['email']} for order {order['order_id']}")
    except Exception as e:
        logger.warning(f"Failed to send order confirmation email: {e}")


async def send_discount_emails(discount_code: str, code_doc: dict, custom_message: str, all_emails: set, site_url: str) -> tuple:
    """Send discount code email to a set of emails. Returns (sent_count, failed_emails)."""
    html_template = build_discount_email_html(discount_code, code_doc, custom_message, site_url)
    sent_count = 0
    failed_emails = []

    for email in all_emails:
        try:
            params = {
                "from": f"PrintsOut <{SENDER_EMAIL}>",
                "to": [email],
                "subject": f"Din exklusiva rabattkod: {discount_code} — {code_doc['discount_percent']}% rabatt!",
                "html": html_template,
                "headers": {
                    "List-Unsubscribe": f"<mailto:{SENDER_EMAIL}?subject=unsubscribe>"
                }
            }
            await asyncio.to_thread(resend.Emails.send, params)
            sent_count += 1
        except Exception as e:
            logger.error(f"Failed to send email to {email}: {str(e)}")
            failed_emails.append(email)

    return sent_count, failed_emails


def build_shipping_notification_html(order: dict) -> str:
    """Build HTML for shipping notification email"""
    items_html = ""
    for item in order.get("items", []):
        qty = item.get("quantity", 1)
        name = item.get("product_name", "Produkt")
        items_html += (
            f'<tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#333">{name}</td>'
            f'<td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;color:#333">{qty}</td></tr>'
        )

    order_id = order.get("order_id", "")[:8]
    shipping = order.get("shipping_address", {}) or {}
    address_lines = []
    if shipping.get("street"):
        address_lines.append(shipping["street"])
    if shipping.get("postal_code") or shipping.get("city"):
        address_lines.append(f"{shipping.get('postal_code', '')} {shipping.get('city', '')}".strip())

    address_html = "<br>".join(address_lines) if address_lines else "Se din orderbekräftelse"

    tracking_number = order.get("tracking_number", "")
    tracking_carrier = order.get("tracking_carrier", "postnord")

    carrier_urls = {
        "postnord": f"https://tracking.postnord.com/tracking.html?id={tracking_number}",
        "dhl": f"https://www.dhl.com/se-sv/home/tracking.html?tracking-id={tracking_number}",
        "bring": f"https://tracking.bring.se/tracking/{tracking_number}",
        "schenker": f"https://www.dbschenker.com/se-sv/spara/{tracking_number}",
        "ups": f"https://www.ups.com/track?tracknum={tracking_number}",
    }
    tracking_url = carrier_urls.get(tracking_carrier, carrier_urls["postnord"])
    carrier_names = {
        "postnord": "PostNord",
        "dhl": "DHL",
        "bring": "Bring",
        "schenker": "DB Schenker",
        "ups": "UPS",
    }
    carrier_name = carrier_names.get(tracking_carrier, tracking_carrier or "PostNord")

    tracking_html = ""
    if tracking_number:
        tracking_html = f"""
        <div style="background:#eef6ff;border-radius:8px;padding:20px;margin:20px 0;border-left:4px solid #3b82f6;text-align:center">
          <p style="margin:0 0 4px 0;color:#555;font-size:13px;font-weight:600">SPÅRNINGSNUMMER ({carrier_name})</p>
          <p style="font-size:20px;font-weight:700;color:#1a1a2e;margin:8px 0;letter-spacing:1px;font-family:monospace">{tracking_number}</p>
          <a href="{tracking_url}" style="display:inline-block;background:#3b82f6;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;margin-top:8px">Spåra ditt paket</a>
        </div>
        """

    return f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff">
      <div style="background:#1a1a2e;padding:30px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:26px">PrintsOut</h1>
      </div>
      <div style="padding:30px">
        <p style="font-size:16px;color:#333">Hej!</p>
        <p style="font-size:16px;color:#333;line-height:1.6">
          Din beställning har nu skickats!
        </p>
        <div style="background:#f0fdf4;border-radius:8px;padding:20px;margin:20px 0;border-left:4px solid #2a9d8f">
          <p style="margin:0 0 6px 0;color:#555;font-size:14px"><strong>Ordernummer:</strong> #{order_id}</p>
        </div>
        {tracking_html}
        <p style="font-size:15px;color:#333;font-weight:600;margin-bottom:8px">Produkter i din leverans:</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <thead>
            <tr style="border-bottom:2px solid #1a1a2e">
              <th style="text-align:left;padding:8px 0;color:#1a1a2e">Produkt</th>
              <th style="text-align:center;padding:8px 0;color:#1a1a2e">Antal</th>
            </tr>
          </thead>
          <tbody>{items_html}</tbody>
        </table>
        <div style="background:#f8f9fa;border-radius:8px;padding:16px;margin:20px 0">
          <p style="margin:0 0 4px 0;color:#555;font-size:13px;font-weight:600">LEVERANSADRESS:</p>
          <p style="margin:0;color:#333;font-size:14px">{address_html}</p>
        </div>
        <p style="font-size:15px;color:#333;line-height:1.6;margin-top:24px">
          Har du frågor om din leverans? Tveka inte att kontakta oss!
        </p>
        <p style="font-size:15px;color:#555;margin-top:24px">
          Med vänliga hälsningar<br>
          <strong style="color:#1a1a2e">PrintsOut</strong>
        </p>
      </div>
      <div style="background:#f0f0f0;padding:20px;text-align:center;font-size:12px;color:#999">
        <p style="margin:0">&copy; {datetime.now().year} PrintsOut. Alla rättigheter förbehållna.</p>
      </div>
    </div>
    """


async def send_shipping_notification(order: dict):
    """Send shipping notification email to customer"""
    try:
        html = build_shipping_notification_html(order)
        order_id = order.get("order_id", "")[:8]
        params = {
            "from": f"PrintsOut <{SENDER_EMAIL}>",
            "to": [order["email"]],
            "subject": f"Din order #{order_id} har skickats! - PrintsOut",
            "html": html,
            "headers": {
                "List-Unsubscribe": f"<mailto:{SENDER_EMAIL}?subject=unsubscribe>"
            }
        }
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Shipping notification sent to {order['email']} for order {order['order_id']}")
    except Exception as e:
        logger.warning(f"Failed to send shipping notification: {e}")


def build_password_reset_html(reset_url: str) -> str:
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff">
      <div style="background:#1a1a2e;padding:30px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:26px">PrintsOut</h1>
      </div>
      <div style="padding:30px">
        <h2 style="color:#1a1a2e;margin-top:0">Återställ ditt lösenord</h2>
        <p style="font-size:16px;color:#333;line-height:1.6">
          Vi fick en förfrågan om att återställa lösenordet för ditt konto.
        </p>
        <p style="font-size:16px;color:#333;line-height:1.6">
          Klicka på länken nedan för att skapa ett nytt lösenord:
        </p>
        <div style="text-align:center;margin:30px 0">
          <a href="{reset_url}" style="background:#2a9d8f;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">
            Återställ lösenord
          </a>
        </div>
        <p style="font-size:14px;color:#666;line-height:1.6">
          Om du inte begärde detta, kan du ignorera detta e-postmeddelande. Länken är giltig i 1 timme.
        </p>
      </div>
      <div style="background:#f0f0f0;padding:20px;text-align:center;font-size:12px;color:#999">
        <p style="margin:0">© {datetime.now().year} PrintsOut. Alla rättigheter förbehållna.</p>
      </div>
    </div>
    """
