from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import base64
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'nordicprint_secret')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Stripe Config
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')

# Create the main app with redirect_slashes disabled to handle both /products and /products/
app = FastAPI(title="Printout API", redirect_slashes=False)

# Create routers
api_router = APIRouter(prefix="/api")
auth_router = APIRouter(prefix="/auth", tags=["Authentication"])
products_router = APIRouter(prefix="/products", tags=["Products"])
cart_router = APIRouter(prefix="/cart", tags=["Cart"])
designs_router = APIRouter(prefix="/designs", tags=["Designs"])
orders_router = APIRouter(prefix="/orders", tags=["Orders"])
payments_router = APIRouter(prefix="/payments", tags=["Payments"])

security = HTTPBearer(auto_error=False)

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

class CartItem(BaseModel):
    cart_item_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    quantity: int = 1
    color: Optional[str] = None
    size: Optional[str] = None
    design_id: Optional[str] = None
    design_preview: Optional[str] = None

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
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class OrderItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    price: float
    color: Optional[str] = None
    size: Optional[str] = None
    design_preview: Optional[str] = None

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
async def register(user_data: UserCreate):
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
async def login(credentials: UserLogin):
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
        {"id": "mobilskal", "name": "Mobilskal", "image": "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400"},
        {"id": "tygkasse", "name": "Tygkassar", "image": "https://images.unsplash.com/photo-1597633244018-0201d0158aec?w=400"}
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
            item_total = product["price"] * cart_item["quantity"]
            total_amount += item_total
            order_items.append(OrderItem(
                product_id=product["product_id"],
                product_name=product["name"],
                quantity=cart_item["quantity"],
                price=product["price"],
                color=cart_item.get("color"),
                size=cart_item.get("size"),
                design_preview=cart_item.get("design_preview")
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
                # Send confirmation email (mocked)
                logger.info(f"[MOCK EMAIL] Order confirmation sent to {order['email']} for order {order['order_id']}")
        
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
        
        return {"received": True}
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        return {"received": True, "error": str(e)}

# ============== REVIEWS ROUTES ==============

@api_router.get("/reviews", response_model=List[Review])
async def get_reviews():
    reviews = await db.reviews.find({}, {"_id": 0}).sort("created_at", -1).to_list(20)
    return [Review(**r) for r in reviews]

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
            images=["https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600"],
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

# ============== ROOT ==============

@api_router.get("/")
async def root():
    return {"message": "Printout API", "version": "1.0.0"}

# ============== INCLUDE ROUTERS ==============

api_router.include_router(auth_router)
api_router.include_router(products_router)
api_router.include_router(cart_router)
api_router.include_router(designs_router)
api_router.include_router(orders_router)
api_router.include_router(payments_router)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
