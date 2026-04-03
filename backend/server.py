from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os
import re
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import base64
import bleach
import resend
import asyncio
import pyotp
import qrcode
import io
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Resend email config
resend.api_key = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 8  # Session timeout: 8 hours

# Stripe Config
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')

# Admin credentials from environment
ADMIN_EMAIL = os.environ['ADMIN_EMAIL']
ADMIN_PASSWORD_HASH = os.environ['ADMIN_PASSWORD_HASH']

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

# Create the main app with redirect_slashes disabled to handle both /products and /products/
app = FastAPI(title="Printsout API", redirect_slashes=False)
app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "För många förfrågningar. Vänta en stund och försök igen."}
    )

# Create routers
api_router = APIRouter(prefix="/api")
auth_router = APIRouter(prefix="/auth", tags=["Authentication"])
products_router = APIRouter(prefix="/products", tags=["Products"])
cart_router = APIRouter(prefix="/cart", tags=["Cart"])
designs_router = APIRouter(prefix="/designs", tags=["Designs"])
orders_router = APIRouter(prefix="/orders", tags=["Orders"])
payments_router = APIRouter(prefix="/payments", tags=["Payments"])
admin_router = APIRouter(prefix="/admin", tags=["Admin"])

security = HTTPBearer(auto_error=False)

# ─── Password validation ──────────────────────────
PASSWORD_MIN_LENGTH = 8
PASSWORD_REGEX = re.compile(
    r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};:\'",.<>?/\\|`~]).{8,}$'
)

def validate_password(password: str) -> str:
    """Validate password strength. Returns error message or empty string."""
    if len(password) < PASSWORD_MIN_LENGTH:
        return f"Lösenordet måste vara minst {PASSWORD_MIN_LENGTH} tecken"
    if not re.search(r'[a-z]', password):
        return "Lösenordet måste innehålla minst en liten bokstav"
    if not re.search(r'[A-Z]', password):
        return "Lösenordet måste innehålla minst en stor bokstav"
    if not re.search(r'\d', password):
        return "Lösenordet måste innehålla minst en siffra"
    if not re.search(r'[!@#$%^&*()_+\-=\[\]{};:\'",.<>?/\\|`~]', password):
        return "Lösenordet måste innehålla minst ett specialtecken"
    return ""

# ─── HTML sanitization ────────────────────────────
ALLOWED_TAGS = ['h1', 'h2', 'h3', 'h4', 'p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'blockquote']
ALLOWED_ATTRS = {'a': ['href', 'title']}

def sanitize_html(content: str) -> str:
    """Sanitize HTML content to prevent XSS attacks."""
    return bleach.clean(content, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRS, strip=True)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============== MODELS ==============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    user_id: str
    email: str
    name: str
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class Product(BaseModel):
    product_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str
    description: str
    price: float
    images: List[str]
    colors: List[str] = []
    sizes: List[str] = []
    model_type: str  # mug, tshirt, hoodie, poster, phonecase, totebag
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class DiscountCode(BaseModel):
    code: str
    discount_percent: float
    active: bool = True
    max_uses: int = 0  # 0 = unlimited
    current_uses: int = 0
    expires_at: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class CartItem(BaseModel):
    cart_item_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    name: Optional[str] = None
    price: Optional[float] = None
    quantity: int = 1
    color: Optional[str] = None
    size: Optional[str] = None
    image: Optional[str] = None
    design_id: Optional[str] = None
    design_preview: Optional[str] = None
    customization: Optional[Dict[str, Any]] = None

class Cart(BaseModel):
    cart_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    session_id: str
    items: List[CartItem] = []
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class DesignConfig(BaseModel):
    image_data: Optional[str] = None
    position_x: float = 50
    position_y: float = 50
    scale: float = 1.0
    rotation: float = 0
    text: Optional[str] = None
    text_font: Optional[str] = None
    text_color: Optional[str] = None
    background_color: Optional[str] = None

class Design(BaseModel):
    design_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    product_id: str
    name: str = "Min design"
    config: DesignConfig
    preview_image: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# Admin Models
class AdminLogin(BaseModel):
    email: EmailStr
    password: str

class AdminStats(BaseModel):
    total_users: int
    total_orders: int
    total_products: int
    total_revenue: float
    recent_orders: int
    pending_orders: int

class AdminUserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    is_blocked: Optional[bool] = None

class AdminProductCreate(BaseModel):
    name: str
    category: str
    description: str
    price: float
    images: List[str]
    colors: List[str] = []
    sizes: List[str] = []
    model_type: str

class AdminOrderUpdate(BaseModel):
    status: Optional[str] = None
    payment_status: Optional[str] = None
    notes: Optional[str] = None

class SiteSettings(BaseModel):
    site_name: str = "Printsout"
    site_logo: Optional[str] = None
    contact_email: str = "info@printsout.se"
    phone: Optional[str] = None
    address: Optional[str] = None
    social_links: Dict[str, str] = {}

class PaymentSettings(BaseModel):
    # Stripe
    stripe_enabled: bool = True
    stripe_test_mode: bool = True
    stripe_public_key: str = ""
    stripe_secret_key: str = ""
    
    # Klarna
    klarna_enabled: bool = False
    klarna_merchant_id: str = ""
    klarna_api_key: str = ""
    
    # Swish
    swish_enabled: bool = False
    swish_number: str = ""
    swish_certificate: str = ""
    
    # Bank transfer
    bank_transfer_enabled: bool = False
    bank_name: str = ""
    bank_account: str = ""
    bank_iban: str = ""
    bank_bic: str = ""
    
    # General
    currency: str = "SEK"
    tax_enabled: bool = True
    tax_rate: float = 25
    shipping_enabled: bool = True
    free_shipping_threshold: float = 500
    shipping_cost: float = 49
    discount_enabled: bool = False
    discount_percent: float = 0
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class OrderItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    price: float
    color: Optional[str] = None
    size: Optional[str] = None
    design_preview: Optional[str] = None
    customization: Optional[Dict[str, Any]] = None
    image: Optional[str] = None

class Order(BaseModel):
    order_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    email: str
    items: List[OrderItem]
    total_amount: float
    status: str = "pending"
    payment_status: str = "pending"
    shipping_address: Optional[Dict[str, str]] = None
    stripe_session_id: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PaymentTransaction(BaseModel):
    transaction_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    user_id: Optional[str] = None
    email: Optional[str] = None
    amount: float
    currency: str = "sek"
    status: str = "pending"
    payment_status: str = "initiated"
    metadata: Dict[str, Any] = {}
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class CheckoutRequest(BaseModel):
    cart_session_id: str
    email: str
    shipping_address: Optional[Dict[str, str]] = None

class Review(BaseModel):
    review_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_name: str
    rating: int
    text: str
    product_id: Optional[str] = None
    source: Optional[str] = "manual"  # manual, google, trustpilot, etc.
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ============== AUTH HELPERS ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_auth(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")
    user = await get_current_user(credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid authentication")
    return user

# ============== AUTH ROUTES ==============

@auth_router.post("/register", response_model=TokenResponse)
@limiter.limit("5/minute")
async def register(request: Request, user_data: UserCreate):
    # Validate password strength
    pwd_error = validate_password(user_data.password)
    if pwd_error:
        raise HTTPException(status_code=400, detail=pwd_error)
    
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="E-postadressen är redan registrerad")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": hash_password(user_data.password),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, user_data.email)
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            user_id=user_id,
            email=user_data.email,
            name=user_data.name,
            created_at=user_doc["created_at"]
        )
    )

@auth_router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(request: Request, credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Felaktig e-post eller lösenord")
    
    token = create_token(user["user_id"], user["email"])
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            user_id=user["user_id"],
            email=user["email"],
            name=user["name"],
            created_at=user["created_at"]
        )
    )

@auth_router.get("/me", response_model=UserResponse)
async def get_profile(user: dict = Depends(require_auth)):
    user_doc = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "password_hash": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="Användare hittades inte")
    return UserResponse(**user_doc)

@auth_router.post("/forgot-password")
@limiter.limit("3/minute")
async def customer_forgot_password(request: Request, data: dict):
    """Generate a password reset token and send a reset link via email"""
    email = data.get("email", "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="E-post krävs")

    user = await db.users.find_one({"email": email}, {"_id": 0, "password_hash": 0})
    if not user:
        return {"message": "Om e-postadressen finns i systemet skickas en återställningslänk"}

    reset_token = str(uuid.uuid4())
    await db.user_password_resets.delete_many({"email": email})
    await db.user_password_resets.insert_one({
        "email": email,
        "reset_token": reset_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat(),
        "used": False
    })

    site_url = os.environ.get('SITE_URL', '')
    reset_link = f"{site_url}/aterstall-losenord?token={reset_token}"

    try:
        html = f"""
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff">
          <div style="background:#1a1a2e;padding:30px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:26px">PrintsOut</h1>
          </div>
          <div style="padding:30px">
            <p style="font-size:16px;color:#333">Hej!</p>
            <p style="font-size:16px;color:#333;line-height:1.6">
              Vi fick en begäran om att återställa lösenordet för ditt konto.
            </p>
            <p style="font-size:16px;color:#333;line-height:1.6">
              Klicka på knappen nedan för att välja ett nytt lösenord:
            </p>
            <div style="text-align:center;margin:30px 0">
              <a href="{reset_link}" style="background:#1a1a2e;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:600;display:inline-block">
                Återställ lösenord
              </a>
            </div>
            <p style="font-size:13px;color:#999;line-height:1.6">
              Länken är giltig i 30 minuter. Om du inte begärde detta kan du ignorera detta mail.
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
        params = {
            "from": SENDER_EMAIL,
            "to": [email],
            "subject": "Återställ ditt lösenord - PrintsOut",
            "html": html
        }
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Password reset link sent to {email}")
    except Exception as e:
        logger.warning(f"Failed to send reset email: {e}")

    return {"message": "Om e-postadressen finns i systemet skickas en återställningslänk"}

@auth_router.post("/reset-password")
@limiter.limit("5/minute")
async def customer_reset_password(request: Request, data: dict):
    """Reset customer password using reset token from email link"""
    token = (data.get("token") or "").strip()
    new_password = data.get("new_password") or ""

    pwd_error = validate_password(new_password)
    if pwd_error:
        raise HTTPException(status_code=400, detail=pwd_error)

    reset = await db.user_password_resets.find_one({
        "reset_token": token,
        "used": False
    }, {"_id": 0})

    if not reset:
        raise HTTPException(status_code=400, detail="Ogiltig eller utgången länk")

    if datetime.now(timezone.utc).isoformat() > reset["expires_at"]:
        raise HTTPException(status_code=400, detail="Länken har gått ut. Begär en ny.")

    new_hash = hash_password(new_password)
    await db.users.update_one({"email": reset["email"]}, {"$set": {"password_hash": new_hash}})
    await db.user_password_resets.update_one({"reset_token": token}, {"$set": {"used": True}})

    return {"message": "Lösenordet har ändrats. Du kan nu logga in."}

async def send_order_confirmation_email(order: dict):
    """Send order confirmation email to customer"""
    try:
        items_html = ""
        for item in order.get("items", []):
            qty = item.get("quantity", 1)
            price = item.get("price", 0)
            name = item.get("product_name", "Produkt")
            items_html += f'<tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#333">{name}</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;color:#333">{qty}</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;color:#333">{price:.0f} kr</td></tr>'

        total = order.get("total_amount", 0)
        order_id = order.get("order_id", "")[:8]
        created = order.get("created_at", "")[:10]

        html = f"""
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

        params = {
            "from": SENDER_EMAIL,
            "to": [order["email"]],
            "subject": f"Orderbekräftelse #{order_id} - PrintsOut",
            "html": html
        }
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Order confirmation email sent to {order['email']} for order {order['order_id']}")
    except Exception as e:
        logger.warning(f"Failed to send order confirmation email: {e}")

# ============== PRODUCTS ROUTES ==============

@products_router.get("/", response_model=List[Product])
@products_router.get("", response_model=List[Product])
async def get_products(category: Optional[str] = None):
    query = {}
    if category:
        query["category"] = category
    products = await db.products.find(query, {"_id": 0}).to_list(100)
    return products

@products_router.get("/categories")
async def get_categories():
    return [
        {"id": "mugg", "name": "Muggar", "image": "https://images.unsplash.com/photo-1627807461786-081fc0e1215c?w=400"},
        {"id": "tshirt", "name": "T-shirts", "image": "https://images.unsplash.com/photo-1593733926335-bdec7f12acfd?w=400"},
        {"id": "hoodie", "name": "Hoodies", "image": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400"},
        {"id": "poster", "name": "Posters", "image": "https://images.unsplash.com/photo-1571164860029-856acbc24b4a?w=400"},
        {"id": "mobilskal", "name": "Mobilskal", "image": "https://static.prod-images.emergentagent.com/jobs/cd68a842-19ed-45bc-a36c-2389ae41c63e/images/85a45f02a7e9178632d56b673ee19b1c5ee40cbb0d3c4c37dd4c5ea35eaaf2e4.png"},
        {"id": "tygkasse", "name": "Tygkassar", "image": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400"},
        {"id": "kalender", "name": "Kalendrar", "image": "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400"},
        {"id": "namnskylt", "name": "Namnlappar", "image": "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400"},
        {"id": "fotoalbum", "name": "Fotoalbum", "image": "https://images.unsplash.com/photo-1694022861804-840f61c1c452?w=400"}
    ]

@products_router.get("/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Produkt hittades inte")
    return Product(**product)

# ============== CART ROUTES ==============

@cart_router.get("/{session_id}")
async def get_cart(session_id: str):
    cart = await db.carts.find_one({"session_id": session_id}, {"_id": 0})
    if not cart:
        return {"cart_id": str(uuid.uuid4()), "session_id": session_id, "items": []}
    return cart

@cart_router.post("/{session_id}/items")
async def add_to_cart(session_id: str, item: CartItem):
    cart = await db.carts.find_one({"session_id": session_id}, {"_id": 0})
    
    if not cart:
        cart = {
            "cart_id": str(uuid.uuid4()),
            "session_id": session_id,
            "items": [],
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    
    # Add item
    item_dict = item.model_dump()
    item_dict["cart_item_id"] = str(uuid.uuid4())
    cart["items"].append(item_dict)
    cart["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.carts.update_one(
        {"session_id": session_id},
        {"$set": cart},
        upsert=True
    )
    return cart

@cart_router.put("/{session_id}/items/{cart_item_id}")
async def update_cart_item(session_id: str, cart_item_id: str, quantity: int):
    cart = await db.carts.find_one({"session_id": session_id}, {"_id": 0})
    if not cart:
        raise HTTPException(status_code=404, detail="Varukorg hittades inte")
    
    for item in cart["items"]:
        if item["cart_item_id"] == cart_item_id:
            if quantity <= 0:
                cart["items"].remove(item)
            else:
                item["quantity"] = quantity
            break
    
    cart["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.carts.update_one({"session_id": session_id}, {"$set": cart})
    return cart

@cart_router.delete("/{session_id}/items/{cart_item_id}")
async def remove_from_cart(session_id: str, cart_item_id: str):
    cart = await db.carts.find_one({"session_id": session_id}, {"_id": 0})
    if not cart:
        raise HTTPException(status_code=404, detail="Varukorg hittades inte")
    
    cart["items"] = [item for item in cart["items"] if item["cart_item_id"] != cart_item_id]
    cart["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.carts.update_one({"session_id": session_id}, {"$set": cart})
    return cart

@cart_router.delete("/{session_id}")
async def clear_cart(session_id: str):
    await db.carts.delete_one({"session_id": session_id})
    return {"message": "Varukorg tömd"}

# ============== DESIGNS ROUTES ==============

@designs_router.post("/", response_model=Design)
async def create_design(design: Design, user: dict = Depends(get_current_user)):
    design_dict = design.model_dump()
    if user:
        design_dict["user_id"] = user["user_id"]
    design_dict["design_id"] = str(uuid.uuid4())
    design_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    design_dict["updated_at"] = design_dict["created_at"]
    
    await db.designs.insert_one(design_dict)
    return Design(**design_dict)

@designs_router.get("/my-designs", response_model=List[Design])
async def get_my_designs(user: dict = Depends(require_auth)):
    designs = await db.designs.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(100)
    return [Design(**d) for d in designs]

@designs_router.get("/{design_id}", response_model=Design)
async def get_design(design_id: str):
    design = await db.designs.find_one({"design_id": design_id}, {"_id": 0})
    if not design:
        raise HTTPException(status_code=404, detail="Design hittades inte")
    return Design(**design)

@designs_router.put("/{design_id}", response_model=Design)
async def update_design(design_id: str, config: DesignConfig, user: dict = Depends(get_current_user)):
    design = await db.designs.find_one({"design_id": design_id}, {"_id": 0})
    if not design:
        raise HTTPException(status_code=404, detail="Design hittades inte")
    
    design["config"] = config.model_dump()
    design["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.designs.update_one({"design_id": design_id}, {"$set": design})
    return Design(**design)

@designs_router.delete("/{design_id}")
async def delete_design(design_id: str, user: dict = Depends(require_auth)):
    result = await db.designs.delete_one({"design_id": design_id, "user_id": user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Design hittades inte")
    return {"message": "Design borttagen"}

# ============== ORDERS ROUTES ==============

@orders_router.get("/my-orders", response_model=List[Order])
async def get_my_orders(user: dict = Depends(require_auth)):
    orders = await db.orders.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [Order(**o) for o in orders]

@orders_router.get("/{order_id}", response_model=Order)
async def get_order(order_id: str, user: dict = Depends(get_current_user)):
    query = {"order_id": order_id}
    if user:
        query["user_id"] = user["user_id"]
    order = await db.orders.find_one(query, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order hittades inte")
    return Order(**order)

# ============== PAYMENTS ROUTES ==============

@api_router.get("/shipping-settings")
async def get_public_shipping_settings():
    """Public endpoint for shipping and discount configuration"""
    settings = await db.settings.find_one({"type": "payment_settings"}, {"_id": 0})
    if not settings:
        defaults = PaymentSettings()
        return {
            "shipping_enabled": defaults.shipping_enabled,
            "shipping_cost": defaults.shipping_cost,
            "free_shipping_threshold": defaults.free_shipping_threshold,
            "discount_enabled": defaults.discount_enabled,
            "discount_percent": defaults.discount_percent,
            "tax_enabled": defaults.tax_enabled,
            "tax_rate": defaults.tax_rate,
        }
    return {
        "shipping_enabled": settings.get("shipping_enabled", True),
        "shipping_cost": settings.get("shipping_cost", 49),
        "free_shipping_threshold": settings.get("free_shipping_threshold", 500),
        "discount_enabled": settings.get("discount_enabled", False),
        "discount_percent": settings.get("discount_percent", 0),
        "tax_enabled": settings.get("tax_enabled", True),
        "tax_rate": settings.get("tax_rate", 25),
    }



@payments_router.post("/checkout")
async def create_checkout(request: Request, checkout_data: CheckoutRequest, user: dict = Depends(get_current_user)):
    # Get cart
    cart = await db.carts.find_one({"session_id": checkout_data.cart_session_id}, {"_id": 0})
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=400, detail="Varukorgen är tom")
    
    # Calculate total
    total_amount = 0.0
    order_items = []
    
    for cart_item in cart["items"]:
        product = await db.products.find_one({"product_id": cart_item["product_id"]}, {"_id": 0})
        if product:
            # Use cart item price if set (editors may add extra costs), else product price
            item_price = cart_item.get("price") or product["price"]
            item_total = item_price * cart_item["quantity"]
            total_amount += item_total
            order_items.append(OrderItem(
                product_id=product["product_id"],
                product_name=cart_item.get("name") or product["name"],
                quantity=cart_item["quantity"],
                price=item_price,
                color=cart_item.get("color"),
                size=cart_item.get("size"),
                image=cart_item.get("image"),
                design_preview=cart_item.get("design_preview"),
                customization=cart_item.get("customization"),
            ))
    
    if total_amount <= 0:
        raise HTTPException(status_code=400, detail="Ogiltig totalsumma")
    
    # Create order
    order = Order(
        user_id=user["user_id"] if user else None,
        email=checkout_data.email,
        items=[item.model_dump() for item in order_items],
        total_amount=total_amount,
        shipping_address=checkout_data.shipping_address
    )
    
    # Get origin URL from request
    origin_url = request.headers.get("origin", str(request.base_url).rstrip("/"))
    
    # Create Stripe checkout session
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    success_url = f"{origin_url}/order-confirmation?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/kassa"
    
    checkout_request = CheckoutSessionRequest(
        amount=float(total_amount),
        currency="sek",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "order_id": order.order_id,
            "email": checkout_data.email,
            "user_id": user["user_id"] if user else "guest"
        }
    )
    
    try:
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Update order with session ID
        order.stripe_session_id = session.session_id
        await db.orders.insert_one(order.model_dump())
        
        # Create payment transaction record
        transaction = PaymentTransaction(
            session_id=session.session_id,
            user_id=user["user_id"] if user else None,
            email=checkout_data.email,
            amount=total_amount,
            currency="sek",
            status="pending",
            payment_status="initiated",
            metadata={"order_id": order.order_id}
        )
        await db.payment_transactions.insert_one(transaction.model_dump())
        
        return {"checkout_url": session.url, "session_id": session.session_id, "order_id": order.order_id}
    except Exception as e:
        logger.error(f"Stripe checkout error: {str(e)}")
        raise HTTPException(status_code=500, detail="Kunde inte skapa betalningssession")

@payments_router.get("/status/{session_id}")
async def get_payment_status(session_id: str, request: Request):
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        status = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction and order status
        new_status = "completed" if status.payment_status == "paid" else status.payment_status
        
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {
                "status": new_status,
                "payment_status": status.payment_status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Update order status
        if status.payment_status == "paid":
            order = await db.orders.find_one({"stripe_session_id": session_id}, {"_id": 0})
            if order and order["payment_status"] != "paid":
                await db.orders.update_one(
                    {"stripe_session_id": session_id},
                    {"$set": {
                        "status": "confirmed",
                        "payment_status": "paid"
                    }}
                )
                # Send confirmation email
                await send_order_confirmation_email(order)
        
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "amount_total": status.amount_total,
            "currency": status.currency
        }
    except Exception as e:
        logger.error(f"Payment status error: {str(e)}")
        raise HTTPException(status_code=500, detail="Kunde inte hämta betalningsstatus")

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature", "")
    
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            await db.orders.update_one(
                {"stripe_session_id": webhook_response.session_id},
                {"$set": {"status": "confirmed", "payment_status": "paid"}}
            )
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {"$set": {"status": "completed", "payment_status": "paid"}}
            )
            # Send confirmation email via webhook
            order = await db.orders.find_one({"stripe_session_id": webhook_response.session_id}, {"_id": 0})
            if order:
                await send_order_confirmation_email(order)
        
        return {"received": True}
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        return {"received": True, "error": str(e)}

# ============== REVIEWS ROUTES ==============

@api_router.get("/reviews", response_model=List[Review])
async def get_reviews():
    reviews = await db.reviews.find({}, {"_id": 0}).sort("created_at", -1).to_list(20)
    return [Review(**r) for r in reviews]

@api_router.get("/review-platforms")
async def get_review_platforms():
    """Public endpoint: get external review platform links"""
    settings = await db.review_settings.find_one({"type": "platforms"}, {"_id": 0})
    if not settings:
        return {"platforms": []}
    return {"platforms": settings.get("platforms", [])}

# ============== INIT DATA ==============

@api_router.post("/init-data")
async def init_data():
    """Initialize sample products and reviews"""
    
    # Check if already initialized
    existing = await db.products.find_one({}, {"_id": 0})
    if existing:
        return {"message": "Data redan initialiserad"}
    
    # Sample products
    products = [
        Product(
            name="Klassisk Fotomugg",
            category="mugg",
            description="En vacker keramikmugg med ditt eget foto. Perfekt för morgonkaffet eller som personlig present.",
            price=149.0,
            images=["https://images.unsplash.com/photo-1627807461786-081fc0e1215c?w=600"],
            colors=["Vit", "Svart", "Beige"],
            model_type="mug"
        ),
        Product(
            name="Premium Fotomugg",
            category="mugg",
            description="Extra stor mugg med hög bildkvalitet. Tål diskmaskin.",
            price=199.0,
            images=["https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600"],
            colors=["Vit", "Grå"],
            model_type="mug"
        ),
        Product(
            name="T-shirt med Eget Tryck",
            category="tshirt",
            description="100% bomull t-shirt med ditt personliga motiv. Hög kvalité och hållbar tryckteknik.",
            price=249.0,
            images=["https://images.unsplash.com/photo-1593733926335-bdec7f12acfd?w=600"],
            colors=["Vit", "Svart", "Grå", "Marinblå"],
            sizes=["XS", "S", "M", "L", "XL", "XXL"],
            model_type="tshirt"
        ),
        Product(
            name="Premium T-shirt",
            category="tshirt",
            description="Ekologisk bomull med premiumtryck. Extra mjukt tyg.",
            price=349.0,
            images=["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600"],
            colors=["Vit", "Svart", "Beige"],
            sizes=["S", "M", "L", "XL"],
            model_type="tshirt"
        ),
        Product(
            name="Hoodie med Foto",
            category="hoodie",
            description="Mysig hoodie med eget motiv. Perfekt för svalare dagar.",
            price=449.0,
            images=["https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600"],
            colors=["Svart", "Grå", "Marinblå"],
            sizes=["S", "M", "L", "XL", "XXL"],
            model_type="hoodie"
        ),
        Product(
            name="Fotocanvas Poster",
            category="poster",
            description="Canvas print av hög kvalité. Redo att hänga på väggen.",
            price=299.0,
            images=["https://images.unsplash.com/photo-1571164860029-856acbc24b4a?w=600"],
            sizes=["30x40cm", "50x70cm", "70x100cm"],
            model_type="poster"
        ),
        Product(
            name="Premium Poster",
            category="poster",
            description="Konsttryck på premium fotopapper. Museestandard.",
            price=399.0,
            images=["https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=600"],
            sizes=["A3", "A2", "A1"],
            model_type="poster"
        ),
        Product(
            name="iPhone Skal",
            category="mobilskal",
            description="Skyddande mobilskal med ditt eget foto. Passar de senaste iPhone-modellerna.",
            price=199.0,
            images=["https://static.prod-images.emergentagent.com/jobs/cd68a842-19ed-45bc-a36c-2389ae41c63e/images/85a45f02a7e9178632d56b673ee19b1c5ee40cbb0d3c4c37dd4c5ea35eaaf2e4.png"],
            colors=["Transparent", "Svart"],
            sizes=["iPhone 14", "iPhone 15", "iPhone 16"],
            model_type="phonecase"
        ),
        Product(
            name="Ekologisk Tygkasse",
            category="tygkasse",
            description="Miljövänlig tygkasse med ditt personliga motiv. Perfekt för shopping.",
            price=129.0,
            images=["https://images.unsplash.com/photo-1597633244018-0201d0158aec?w=600"],
            colors=["Naturvit", "Svart"],
            model_type="totebag"
        ),
        Product(
            name="Årskalender med Foton",
            category="kalender",
            description="Personlig väggkalender med dina egna bilder. 12 månader, en bild per månad. A3-format.",
            price=249.0,
            images=["https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600"],
            sizes=["A3", "A4"],
            model_type="calendar"
        ),
        Product(
            name="Skrivbordskalender",
            category="kalender",
            description="Kompakt skrivbordskalender med spiralbindning. Perfekt present eller för kontoret.",
            price=179.0,
            images=["https://images.unsplash.com/photo-1435527173128-983b87201f4d?w=600"],
            sizes=["Standard"],
            model_type="calendar"
        ),
        Product(
            name="Familjekalender",
            category="kalender",
            description="Stor familjekalender med plats för anteckningar. Perfekt för att planera familjens aktiviteter.",
            price=299.0,
            images=["https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=600"],
            sizes=["A2", "A3"],
            model_type="calendar"
        ),
        Product(
            name="Strykmärken med Namn",
            category="namnskylt",
            description="Personliga strykmärken för barnskläder. Perfekt för förskolan! 30 st i paketet. Tål tvätt i 60°C.",
            price=149.0,
            images=["https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600"],
            colors=["Vit", "Rosa", "Ljusblå", "Grön", "Gul"],
            sizes=["Liten (2x5cm)", "Mellan (2.5x6cm)", "Stor (3x7cm)"],
            model_type="nametag"
        ),
        Product(
            name="Symärken med Namn",
            category="namnskylt",
            description="Sybara namnlappar i mjukt tyg. Perfekt för ömtåliga plagg. 25 st i paketet.",
            price=129.0,
            images=["https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600"],
            colors=["Vit", "Beige", "Rosa", "Ljusblå"],
            sizes=["Standard (2x6cm)"],
            model_type="nametag"
        ),
        Product(
            name="Namnstämpel för Kläder",
            category="namnskylt",
            description="Självfärgande stämpel för att märka kläder, väskor och lunchboxar. Tål tvätt upp till 90°C!",
            price=199.0,
            images=["https://images.unsplash.com/photo-1584727638096-042c45049ebe?w=600"],
            model_type="nametag"
        ),
        Product(
            name="Namnlappar med Figur",
            category="namnskylt",
            description="Strykmärken med söta figurer (djur, fordon, blommor) + barnets namn. 30 st i paketet.",
            price=179.0,
            images=["https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600"],
            colors=["Vit bakgrund", "Färgglad bakgrund"],
            sizes=["Liten (2x5cm)", "Mellan (2.5x6cm)"],
            model_type="nametag"
        ),
    ]
    
    for product in products:
        await db.products.insert_one(product.model_dump())
    
    # Sample reviews
    reviews = [
        Review(
            user_name="Anna S.",
            rating=5,
            text="Fantastisk kvalité på muggen! Min mormor älskade presenten. Kommer definitivt beställa fler."
        ),
        Review(
            user_name="Erik M.",
            rating=5,
            text="Supersmidig process från uppladdning till leverans. T-shirten ser precis ut som förhandsgranskningen."
        ),
        Review(
            user_name="Lisa K.",
            rating=4,
            text="Jättebra tygkasse! Perfekt julklapp. Lite längre leveranstid än förväntat men värt väntan."
        ),
        Review(
            user_name="Johan P.",
            rating=5,
            text="Designverktyget är så enkelt att använda. Gjorde en hoodie till min son - han blev jätteglad!"
        ),
        Review(
            user_name="Maria L.",
            rating=5,
            text="Canvas-postern blev verkligen fin! Hög kvalité och snabb leverans. Rekommenderas!"
        ),
    ]
    
    for review in reviews:
        await db.reviews.insert_one(review.model_dump())
    
    return {"message": "Data initialiserad", "products": len(products), "reviews": len(reviews)}

# ============== ADMIN ROUTES ==============

def verify_admin_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify admin JWT token"""
    if not credentials:
        raise HTTPException(status_code=401, detail="Admin-autentisering krävs")
    
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if not payload.get("is_admin"):
            raise HTTPException(status_code=403, detail="Endast administratörer har tillgång")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token har gått ut")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Ogiltig token")

@admin_router.post("/login")
@limiter.limit("5/minute")
async def admin_login(request: Request, login_data: AdminLogin):
    """Admin login step 1: verify email + password, always require 2FA"""
    if login_data.email != ADMIN_EMAIL or not verify_password(login_data.password, ADMIN_PASSWORD_HASH):
        raise HTTPException(status_code=401, detail="Felaktiga inloggningsuppgifter")
    
    admin_2fa = await db.admin_settings_2fa.find_one({"admin_email": ADMIN_EMAIL}, {"_id": 0})
    
    temp_token = jwt.encode({
        "sub": "admin_2fa_pending",
        "email": ADMIN_EMAIL,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=10)
    }, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    if admin_2fa and admin_2fa.get("totp_enabled") and admin_2fa.get("totp_secret"):
        # 2FA already set up - just ask for the code
        return {"requires_2fa": True, "needs_setup": False, "temp_token": temp_token}
    
    # 2FA not set up yet - generate QR code and force setup
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    uri = totp.provisioning_uri(name=ADMIN_EMAIL, issuer_name="Printsout Admin")
    
    qr = qrcode.make(uri)
    buffer = io.BytesIO()
    qr.save(buffer, format="PNG")
    qr_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    await db.admin_settings_2fa.update_one(
        {"admin_email": ADMIN_EMAIL},
        {"$set": {"admin_email": ADMIN_EMAIL, "totp_secret": secret, "totp_enabled": False}},
        upsert=True
    )
    
    return {
        "requires_2fa": True,
        "needs_setup": True,
        "temp_token": temp_token,
        "qr_code": f"data:image/png;base64,{qr_base64}",
        "secret": secret
    }

@admin_router.post("/verify-2fa")
@limiter.limit("5/minute")
async def admin_verify_2fa(request: Request, data: dict):
    """Admin login step 2: verify TOTP code (also activates 2FA on first use)"""
    temp_token = data.get("temp_token")
    code = data.get("code", "")
    
    try:
        payload = jwt.decode(temp_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("sub") != "admin_2fa_pending":
            raise HTTPException(status_code=401, detail="Ogiltig token")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Koden har gått ut, logga in igen")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Ogiltig token")
    
    admin_2fa = await db.admin_settings_2fa.find_one({"admin_email": ADMIN_EMAIL}, {"_id": 0})
    if not admin_2fa or not admin_2fa.get("totp_secret"):
        raise HTTPException(status_code=400, detail="2FA är inte konfigurerat")
    
    totp = pyotp.TOTP(admin_2fa["totp_secret"])
    if not totp.verify(code, valid_window=1):
        raise HTTPException(status_code=401, detail="Felaktig verifieringskod")
    
    # Enable 2FA if this is the first verification (setup flow)
    if not admin_2fa.get("totp_enabled"):
        await db.admin_settings_2fa.update_one(
            {"admin_email": ADMIN_EMAIL},
            {"$set": {"totp_enabled": True}}
        )
    
    # Code is valid - issue full admin token
    token_data = {
        "sub": "admin",
        "email": ADMIN_EMAIL,
        "is_admin": True,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    token = jwt.encode(token_data, JWT_SECRET, algorithm=JWT_ALGORITHM)
    await db.admin_logs.insert_one({
        "action": "login_2fa",
        "admin_email": ADMIN_EMAIL,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "ip": "system"
    })
    return {"access_token": token, "token_type": "bearer"}

@admin_router.post("/setup-2fa")
async def admin_setup_2fa(admin=Depends(verify_admin_token)):
    """Generate TOTP secret and QR code for 2FA setup"""
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    uri = totp.provisioning_uri(name=ADMIN_EMAIL, issuer_name="Printsout Admin")
    
    # Generate QR code as base64
    qr = qrcode.make(uri)
    buffer = io.BytesIO()
    qr.save(buffer, format="PNG")
    qr_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    # Store secret (not yet enabled)
    await db.admin_settings_2fa.update_one(
        {"admin_email": ADMIN_EMAIL},
        {"$set": {"admin_email": ADMIN_EMAIL, "totp_secret": secret, "totp_enabled": False}},
        upsert=True
    )
    
    return {"qr_code": f"data:image/png;base64,{qr_base64}", "secret": secret}

@admin_router.post("/confirm-2fa")
async def admin_confirm_2fa(data: dict, admin=Depends(verify_admin_token)):
    """Confirm 2FA setup with a valid code"""
    code = data.get("code", "")
    admin_2fa = await db.admin_settings_2fa.find_one({"admin_email": ADMIN_EMAIL}, {"_id": 0})
    
    if not admin_2fa or not admin_2fa.get("totp_secret"):
        raise HTTPException(status_code=400, detail="Starta 2FA-installationen först")
    
    totp = pyotp.TOTP(admin_2fa["totp_secret"])
    if not totp.verify(code, valid_window=1):
        raise HTTPException(status_code=400, detail="Felaktig kod. Försök igen.")
    
    await db.admin_settings_2fa.update_one(
        {"admin_email": ADMIN_EMAIL},
        {"$set": {"totp_enabled": True}}
    )
    return {"message": "2FA aktiverat"}

@admin_router.post("/disable-2fa")
async def admin_disable_2fa(data: dict, admin=Depends(verify_admin_token)):
    """Disable 2FA with a valid code"""
    code = data.get("code", "")
    admin_2fa = await db.admin_settings_2fa.find_one({"admin_email": ADMIN_EMAIL}, {"_id": 0})
    
    if not admin_2fa or not admin_2fa.get("totp_secret"):
        raise HTTPException(status_code=400, detail="2FA är inte aktiverat")
    
    totp = pyotp.TOTP(admin_2fa["totp_secret"])
    if not totp.verify(code, valid_window=1):
        raise HTTPException(status_code=400, detail="Felaktig kod")
    
    await db.admin_settings_2fa.update_one(
        {"admin_email": ADMIN_EMAIL},
        {"$set": {"totp_enabled": False, "totp_secret": None}}
    )
    return {"message": "2FA inaktiverat"}

@admin_router.get("/2fa-status")
async def admin_2fa_status(admin=Depends(verify_admin_token)):
    """Check if 2FA is enabled"""
    admin_2fa = await db.admin_settings_2fa.find_one({"admin_email": ADMIN_EMAIL}, {"_id": 0})
    return {"enabled": bool(admin_2fa and admin_2fa.get("totp_enabled"))}

@admin_router.post("/forgot-password")
@limiter.limit("3/minute")
async def admin_forgot_password(request: Request, data: dict):
    """Generate password reset token"""
    email = data.get("email", "")
    if email != ADMIN_EMAIL:
        # Don't reveal if email exists
        return {"message": "Om e-postadressen finns skickas en återställningskod"}
    
    reset_code = str(uuid.uuid4())[:8].upper()
    await db.admin_password_resets.delete_many({"admin_email": ADMIN_EMAIL})
    await db.admin_password_resets.insert_one({
        "admin_email": ADMIN_EMAIL,
        "reset_code": reset_code,
        "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat(),
        "used": False
    })
    
    # Log the reset code (in production, send via email)
    logger.info(f"Admin password reset code: {reset_code}")
    
    return {"message": "Om e-postadressen finns skickas en återställningskod", "reset_code": reset_code}

@admin_router.post("/reset-password")
@limiter.limit("5/minute")
async def admin_reset_password(request: Request, data: dict):
    """Reset password using reset code"""
    code = data.get("code", "")
    new_password = data.get("new_password", "")
    
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Lösenordet måste vara minst 8 tecken")
    
    reset = await db.admin_password_resets.find_one({
        "admin_email": ADMIN_EMAIL,
        "reset_code": code,
        "used": False
    }, {"_id": 0})
    
    if not reset:
        raise HTTPException(status_code=400, detail="Ogiltig eller utgången kod")
    
    if datetime.now(timezone.utc).isoformat() > reset["expires_at"]:
        raise HTTPException(status_code=400, detail="Koden har gått ut")
    
    # Hash new password and update .env
    new_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Update in-memory and store in DB
    global ADMIN_PASSWORD_HASH
    ADMIN_PASSWORD_HASH = new_hash
    await db.admin_settings_2fa.update_one(
        {"admin_email": ADMIN_EMAIL},
        {"$set": {"password_hash": new_hash}},
        upsert=True
    )
    
    await db.admin_password_resets.update_one(
        {"reset_code": code},
        {"$set": {"used": True}}
    )
    
    return {"message": "Lösenordet har ändrats"}

@admin_router.get("/stats")
async def get_admin_stats(admin = Depends(verify_admin_token)):
    """Get dashboard statistics"""
    total_users = await db.users.count_documents({})
    total_orders = await db.orders.count_documents({})
    total_products = await db.products.count_documents({})
    
    # Calculate revenue using aggregation pipeline
    pipeline = [
        {"$match": {"payment_status": "completed"}},
        {"$group": {"_id": None, "total_revenue": {"$sum": "$total_amount"}}}
    ]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total_revenue"] if revenue_result else 0
    
    # Recent orders (last 7 days)
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    recent_orders = await db.orders.count_documents({"created_at": {"$gte": week_ago}})
    
    # Pending orders
    pending_orders = await db.orders.count_documents({"status": {"$in": ["pending", "processing"]}})
    
    return {
        "total_users": total_users,
        "total_orders": total_orders,
        "total_products": total_products,
        "total_revenue": total_revenue,
        "recent_orders": recent_orders,
        "pending_orders": pending_orders
    }

@admin_router.get("/users")
async def get_all_users(admin = Depends(verify_admin_token), skip: int = 0, limit: int = 50):
    """Get all users"""
    users = await db.users.find({}, {"password_hash": 0, "_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents({})
    return {"users": users, "total": total}

@admin_router.get("/users/{user_id}")
async def get_user_details(user_id: str, admin = Depends(verify_admin_token)):
    """Get user details with their orders"""
    user = await db.users.find_one({"user_id": user_id}, {"password_hash": 0, "_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Användare hittades inte")
    
    orders = await db.orders.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)
    designs = await db.designs.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)
    
    return {"user": user, "orders": orders, "designs": designs}

@admin_router.put("/users/{user_id}")
async def update_user(user_id: str, update_data: AdminUserUpdate, admin = Depends(verify_admin_token)):
    """Update user details"""
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="Inga uppdateringar angivna")
    
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Användare hittades inte")
    
    # Log action
    await db.admin_logs.insert_one({
        "action": "update_user",
        "target_user_id": user_id,
        "changes": update_dict,
        "admin_email": admin.get("email"),
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Användare uppdaterad"}

@admin_router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin = Depends(verify_admin_token)):
    """Delete a user"""
    result = await db.users.delete_one({"user_id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Användare hittades inte")
    
    # Log action
    await db.admin_logs.insert_one({
        "action": "delete_user",
        "target_user_id": user_id,
        "admin_email": admin.get("email"),
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Användare raderad"}

@admin_router.get("/orders")
async def get_all_orders(
    admin = Depends(verify_admin_token), 
    skip: int = 0, 
    limit: int = 50,
    status: Optional[str] = None
):
    """Get all orders"""
    query = {}
    if status:
        query["status"] = status
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.orders.count_documents(query)
    return {"orders": orders, "total": total}

@admin_router.get("/orders/{order_id}")
async def get_order_details(order_id: str, admin = Depends(verify_admin_token)):
    """Get order details"""
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order hittades inte")
    return order

@admin_router.put("/orders/{order_id}")
async def update_order(order_id: str, update_data: AdminOrderUpdate, admin = Depends(verify_admin_token)):
    """Update order status"""
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.orders.update_one(
        {"order_id": order_id},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order hittades inte")
    
    # Log action
    await db.admin_logs.insert_one({
        "action": "update_order",
        "order_id": order_id,
        "changes": update_dict,
        "admin_email": admin.get("email"),
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Order uppdaterad"}

@admin_router.delete("/orders/{order_id}")
async def delete_order(order_id: str, admin = Depends(verify_admin_token)):
    result = await db.orders.delete_one({"order_id": order_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Order hittades inte")
    await db.admin_logs.insert_one({
        "action": "delete_order",
        "order_id": order_id,
        "admin_email": admin.get("email"),
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    return {"message": "Order raderad"}



@admin_router.get("/products")
async def admin_get_products(admin = Depends(verify_admin_token)):
    """Get all products for admin"""
    products = await db.products.find({}, {"_id": 0}).to_list(100)
    return {"products": products, "total": len(products)}

@admin_router.post("/products")
async def create_product(product_data: AdminProductCreate, admin = Depends(verify_admin_token)):
    """Create a new product"""
    product = Product(**product_data.model_dump())
    await db.products.insert_one(product.model_dump())
    
    # Log action
    await db.admin_logs.insert_one({
        "action": "create_product",
        "product_id": product.product_id,
        "admin_email": admin.get("email"),
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Produkt skapad", "product_id": product.product_id}

@admin_router.put("/products/{product_id}")
async def update_product(product_id: str, product_data: AdminProductCreate, admin = Depends(verify_admin_token)):
    """Update a product"""
    result = await db.products.update_one(
        {"product_id": product_id},
        {"$set": product_data.model_dump()}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Produkt hittades inte")
    
    # Log action
    await db.admin_logs.insert_one({
        "action": "update_product",
        "product_id": product_id,
        "admin_email": admin.get("email"),
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Produkt uppdaterad"}

@admin_router.delete("/products/{product_id}")
async def delete_product(product_id: str, admin = Depends(verify_admin_token)):
    """Delete a product"""
    result = await db.products.delete_one({"product_id": product_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Produkt hittades inte")
    
    # Log action
    await db.admin_logs.insert_one({
        "action": "delete_product",
        "product_id": product_id,
        "admin_email": admin.get("email"),
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Produkt raderad"}

@admin_router.get("/settings")
async def get_settings(admin = Depends(verify_admin_token)):
    """Get site settings"""
    settings = await db.settings.find_one({"type": "site_settings"}, {"_id": 0})
    if not settings:
        # Return default settings
        return SiteSettings().model_dump()
    return settings

@admin_router.put("/settings")
async def update_settings(settings: SiteSettings, admin = Depends(verify_admin_token)):
    """Update site settings"""
    await db.settings.update_one(
        {"type": "site_settings"},
        {"$set": {**settings.model_dump(), "type": "site_settings"}},
        upsert=True
    )
    
    # Log action
    await db.admin_logs.insert_one({
        "action": "update_settings",
        "admin_email": admin.get("email"),
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Inställningar uppdaterade"}

@admin_router.get("/logs")
@admin_router.get("/logs")
async def get_admin_logs(admin = Depends(verify_admin_token), skip: int = 0, limit: int = 100):
    """Get admin activity logs"""
    logs = await db.admin_logs.find({}, {"_id": 0}).sort("timestamp", -1).skip(skip).limit(limit).to_list(limit)
    return {"logs": logs}

@admin_router.delete("/logs")
async def clear_admin_logs(admin = Depends(verify_admin_token)):
    """Clear all admin activity logs"""
    result = await db.admin_logs.delete_many({})
    await db.admin_logs.insert_one({
        "action": "clear_logs",
        "admin_email": ADMIN_EMAIL,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "details": f"{result.deleted_count} poster raderade"
    })
    return {"message": f"{result.deleted_count} loggposter raderade"}

@admin_router.get("/payment-settings")
async def get_payment_settings(admin = Depends(verify_admin_token)):
    """Get payment settings"""
    settings = await db.settings.find_one({"type": "payment_settings"}, {"_id": 0})
    if not settings:
        return PaymentSettings().model_dump()
    # Remove the type field from response
    settings.pop("type", None)
    return settings

@admin_router.put("/payment-settings")
async def update_payment_settings(settings: PaymentSettings, admin = Depends(verify_admin_token)):
    """Update payment settings"""
    await db.settings.update_one(
        {"type": "payment_settings"},
        {"$set": {**settings.model_dump(), "type": "payment_settings"}},
        upsert=True
    )
    
    # Log action
    await db.admin_logs.insert_one({
        "action": "update_payment_settings",
        "admin_email": admin.get("email"),
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Betalningsinställningar uppdaterade"}

# ============== ADMIN REVIEW ROUTES ==============

@api_router.get("/admin/reviews")
async def admin_get_reviews(admin=Depends(verify_admin_token)):
    reviews = await db.reviews.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return reviews

@api_router.post("/admin/reviews")
async def admin_create_review(review: Review, admin=Depends(verify_admin_token)):
    await db.reviews.insert_one(review.model_dump())
    return {"message": "Recension skapad", "review_id": review.review_id}

@api_router.put("/admin/reviews/{review_id}")
async def admin_update_review(review_id: str, data: dict, admin=Depends(verify_admin_token)):
    update_data = {k: v for k, v in data.items() if k not in ["review_id", "_id"]}
    result = await db.reviews.update_one({"review_id": review_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Recension hittades inte")
    return {"message": "Recension uppdaterad"}

@api_router.delete("/admin/reviews/{review_id}")
async def admin_delete_review(review_id: str, admin=Depends(verify_admin_token)):
    result = await db.reviews.delete_one({"review_id": review_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Recension hittades inte")
    return {"message": "Recension raderad"}

@api_router.get("/admin/review-platforms")
async def admin_get_review_platforms(admin=Depends(verify_admin_token)):
    settings = await db.review_settings.find_one({"type": "platforms"}, {"_id": 0})
    if not settings:
        return {"platforms": []}
    return {"platforms": settings.get("platforms", [])}

@api_router.put("/admin/review-platforms")
async def admin_update_review_platforms(data: dict, admin=Depends(verify_admin_token)):
    platforms = data.get("platforms", [])
    await db.review_settings.update_one(
        {"type": "platforms"},
        {"$set": {"type": "platforms", "platforms": platforms}},
        upsert=True
    )
    return {"message": "Recensionsplattformar uppdaterade"}

# ============== CONTENT PAGES ==============

class ContentPage(BaseModel):
    title: str
    slug: str
    content: str = ""
    status: str = "draft"

@admin_router.get("/content")
async def get_content_pages(admin = Depends(verify_admin_token)):
    """Get all content pages"""
    pages = await db.content_pages.find({}, {"_id": 0}).to_list(100)
    return {"pages": pages}

@admin_router.post("/content")
async def create_content_page(page: ContentPage, admin = Depends(verify_admin_token)):
    """Create a new content page with XSS sanitization"""
    page_data = page.model_dump()
    page_data["content"] = sanitize_html(page_data["content"])
    page_data["title"] = bleach.clean(page_data["title"], tags=[], strip=True)
    page_data["page_id"] = str(uuid.uuid4())
    page_data["created_at"] = datetime.now(timezone.utc).isoformat()
    page_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    slug = page_data["slug"].strip("/")
    if not slug.startswith("/"):
        page_data["slug"] = f"/{slug}"
    await db.content_pages.insert_one(page_data)
    return {"message": "Sida skapad", "page_id": page_data["page_id"]}

@admin_router.put("/content/{page_id}")
async def update_content_page(page_id: str, page: ContentPage, admin = Depends(verify_admin_token)):
    """Update a content page with XSS sanitization"""
    page_data = page.model_dump()
    page_data["content"] = sanitize_html(page_data["content"])
    page_data["title"] = bleach.clean(page_data["title"], tags=[], strip=True)
    page_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    slug = page_data["slug"].strip("/")
    if not slug.startswith("/"):
        page_data["slug"] = f"/{slug}"
    result = await db.content_pages.update_one(
        {"page_id": page_id},
        {"$set": page_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Sida hittades inte")
    return {"message": "Sida uppdaterad"}

@admin_router.delete("/content/{page_id}")
async def delete_content_page(page_id: str, admin = Depends(verify_admin_token)):
    """Delete a content page"""
    result = await db.content_pages.delete_one({"page_id": page_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Sida hittades inte")
    return {"message": "Sida raderad"}

# ===================== DISCOUNT CODES =====================

@admin_router.get("/discount-codes")
async def get_discount_codes(admin = Depends(verify_admin_token)):
    codes = await db.discount_codes.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return codes

@admin_router.post("/discount-codes")
async def create_discount_code(code_data: DiscountCode, admin = Depends(verify_admin_token)):
    existing = await db.discount_codes.find_one({"code": code_data.code.upper()})
    if existing:
        raise HTTPException(status_code=400, detail="Koden finns redan")
    code_dict = code_data.model_dump()
    code_dict["code"] = code_dict["code"].upper()
    await db.discount_codes.insert_one(code_dict)
    return {"message": "Rabattkod skapad", "code": code_dict["code"]}

@admin_router.put("/discount-codes/{code}")
async def update_discount_code(code: str, code_data: dict, admin = Depends(verify_admin_token)):
    update_fields = {k: v for k, v in code_data.items() if k in ("discount_percent", "active", "max_uses", "expires_at")}
    if not update_fields:
        raise HTTPException(status_code=400, detail="Inga fält att uppdatera")
    result = await db.discount_codes.update_one({"code": code.upper()}, {"$set": update_fields})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Kod hittades inte")
    return {"message": "Rabattkod uppdaterad"}

@admin_router.delete("/discount-codes/{code}")
async def delete_discount_code(code: str, admin = Depends(verify_admin_token)):
    result = await db.discount_codes.delete_one({"code": code.upper()})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Kod hittades inte")
    return {"message": "Rabattkod raderad"}


@admin_router.post("/send-discount-email")

@admin_router.get("/tax-report")
async def get_tax_report(admin = Depends(verify_admin_token)):
    """Get tax/VAT report grouped by month"""
    TAX_RATE = 0.25
    
    pipeline = [
        {"$addFields": {
            "month": {"$substr": ["$created_at", 0, 7]},
        }},
        {"$group": {
            "_id": "$month",
            "total_sales": {"$sum": "$total_amount"},
            "order_count": {"$sum": 1},
        }},
        {"$sort": {"_id": -1}},
    ]
    
    monthly = await db.orders.aggregate(pipeline).to_list(100)
    
    months = []
    grand_total = 0
    grand_vat = 0
    grand_net = 0
    
    for m in monthly:
        total = m["total_sales"] or 0
        vat = round(total * TAX_RATE / (1 + TAX_RATE), 2)
        net = round(total - vat, 2)
        grand_total += total
        grand_vat += vat
        grand_net += net
        months.append({
            "month": m["_id"],
            "order_count": m["order_count"],
            "total_sales": round(total, 2),
            "vat_amount": vat,
            "net_amount": net,
        })
    
    return {
        "tax_rate": TAX_RATE * 100,
        "months": months,
        "summary": {
            "total_sales": round(grand_total, 2),
            "total_vat": round(grand_vat, 2),
            "total_net": round(grand_net, 2),
            "total_orders": sum(month["order_count"] for month in months),
        }
    }


async def send_discount_email(data: dict, admin = Depends(verify_admin_token)):
    """Send a discount code email to all registered customers"""
    discount_code = data.get("code", "").strip().upper()
    custom_message = data.get("message", "")
    
    if not discount_code:
        raise HTTPException(status_code=400, detail="Ange en rabattkod")
    
    # Verify code exists
    code_doc = await db.discount_codes.find_one({"code": discount_code}, {"_id": 0})
    if not code_doc:
        raise HTTPException(status_code=404, detail="Rabattkoden finns inte")
    
    # Get all customer emails
    users = await db.users.find({"role": {"$ne": "admin"}}, {"_id": 0, "email": 1, "name": 1}).to_list(1000)
    
    # Also collect unique emails from orders (guests)
    order_emails = await db.orders.distinct("email")
    
    # Merge unique emails
    all_emails = set()
    email_names = {}
    for u in users:
        if u.get("email"):
            all_emails.add(u["email"])
            email_names[u["email"]] = u.get("name", "")
    for e in order_emails:
        if e:
            all_emails.add(e)
    
    if not all_emails:
        raise HTTPException(status_code=400, detail="Inga kunder hittade")
    
    site_url = os.environ.get('SITE_URL', '')
    
    html_template = f"""
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
    
    sent_count = 0
    failed_emails = []
    
    for email in all_emails:
        try:
            params = {
                "from": SENDER_EMAIL,
                "to": [email],
                "subject": f"Din exklusiva rabattkod: {discount_code} — {code_doc['discount_percent']}% rabatt!",
                "html": html_template,
            }
            await asyncio.to_thread(resend.Emails.send, params)
            sent_count += 1
        except Exception as e:
            logger.error(f"Failed to send email to {email}: {str(e)}")
            failed_emails.append(email)
    
    await db.admin_logs.insert_one({
        "action": "send_discount_email",
        "code": discount_code,
        "sent_count": sent_count,
        "failed_count": len(failed_emails),
        "admin_email": admin.get("email"),
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "message": f"E-post skickad till {sent_count} kunder",
        "sent_count": sent_count,
        "failed_count": len(failed_emails),
        "failed_emails": failed_emails
    }


@api_router.post("/validate-discount-code")
async def validate_discount_code(data: dict):
    code = data.get("code", "").strip().upper()
    if not code:
        raise HTTPException(status_code=400, detail="Ange en rabattkod")
    
    doc = await db.discount_codes.find_one({"code": code}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Ogiltig rabattkod")
    if not doc.get("active", True):
        raise HTTPException(status_code=400, detail="Rabattkoden är inte aktiv")
    if doc.get("max_uses", 0) > 0 and doc.get("current_uses", 0) >= doc["max_uses"]:
        raise HTTPException(status_code=400, detail="Rabattkoden har redan använts max antal gånger")
    if doc.get("expires_at"):
        from datetime import datetime as dt
        try:
            exp = dt.fromisoformat(doc["expires_at"].replace("Z", "+00:00"))
            if datetime.now(timezone.utc) > exp:
                raise HTTPException(status_code=400, detail="Rabattkoden har gått ut")
        except (ValueError, TypeError):
            pass
    
    return {"valid": True, "code": doc["code"], "discount_percent": doc["discount_percent"]}



# Public endpoint to get page by slug
@api_router.get("/pages/{slug:path}")
async def get_public_page(slug: str):
    """Get a published content page by slug"""
    page = await db.content_pages.find_one(
        {"slug": f"/{slug}", "status": "published"},
        {"_id": 0}
    )
    if not page:
        raise HTTPException(status_code=404, detail="Sidan hittades inte")
    return page

# ============== FILE UPLOADS ==============

UPLOADS_DIR = ROOT_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

from typing import List as TypingList

@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload an image file and return the URL"""
    allowed = {'image/jpeg', 'image/png', 'image/webp'}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Bara JPG, PNG och WebP tillåtet")
    
    max_size = 10 * 1024 * 1024  # 10MB
    contents = await file.read()
    if len(contents) > max_size:
        raise HTTPException(status_code=400, detail="Max filstorlek: 10MB")
    
    ext = file.filename.rsplit('.', 1)[-1] if '.' in file.filename else 'jpg'
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = UPLOADS_DIR / filename
    
    with open(filepath, "wb") as f:
        f.write(contents)
    
    return {"filename": filename, "url": f"/api/uploads/{filename}"}

@api_router.post("/upload-base64")
async def upload_base64(data: dict):
    """Upload a base64 encoded image and return the URL"""
    image_data = data.get("image")
    if not image_data:
        raise HTTPException(status_code=400, detail="Ingen bild skickad")
    
    # Remove data:image/xxx;base64, prefix
    if "base64," in image_data:
        header, image_data = image_data.split("base64,", 1)
        if "png" in header:
            ext = "png"
        elif "webp" in header:
            ext = "webp"
        else:
            ext = "jpg"
    else:
        ext = "jpg"
    
    try:
        contents = base64.b64decode(image_data)
    except Exception:
        raise HTTPException(status_code=400, detail="Ogiltig bilddata")
    
    max_size = 10 * 1024 * 1024
    if len(contents) > max_size:
        raise HTTPException(status_code=400, detail="Max filstorlek: 10MB")
    
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = UPLOADS_DIR / filename
    
    with open(filepath, "wb") as f:
        f.write(contents)
    
    return {"filename": filename, "url": f"/api/uploads/{filename}"}

@api_router.get("/uploads/{filename}")
async def get_upload(filename: str):
    """Serve an uploaded file"""
    filepath = UPLOADS_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Filen hittades inte")
    return FileResponse(filepath)

# ============== ROOT ==============

@api_router.get("/")
async def root():
    return {"message": "Printsout API", "version": "1.0.0"}

# ============== INCLUDE ROUTERS ==============

api_router.include_router(auth_router)
api_router.include_router(products_router)
api_router.include_router(cart_router)
api_router.include_router(designs_router)
api_router.include_router(orders_router)
api_router.include_router(payments_router)
api_router.include_router(admin_router)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Security Headers Middleware ───────────────────
from starlette.middleware.base import BaseHTTPMiddleware

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

app.add_middleware(SecurityHeadersMiddleware)

@app.on_event("startup")
async def startup_init():
    """Seed initial data and load DB-stored password if exists"""
    global ADMIN_PASSWORD_HASH
    existing = await db.products.find_one({}, {"_id": 0})
    if not existing:
        await init_data()
    # Check if password was reset via DB
    admin_2fa = await db.admin_settings_2fa.find_one({"admin_email": ADMIN_EMAIL}, {"_id": 0})
    if admin_2fa and admin_2fa.get("password_hash"):
        ADMIN_PASSWORD_HASH = admin_2fa["password_hash"]

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
