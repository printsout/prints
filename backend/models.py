"""All Pydantic models for the application."""
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone


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
    model_type: str
    quantity_prices: Optional[List[dict]] = None
    color_images: Optional[dict] = None  # {"Svart": "url", "Vit": "url"}
    available_sizes: Optional[List[str]] = None
    available_qualities: Optional[List[str]] = None
    size_quality_prices: Optional[List[dict]] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class DiscountCode(BaseModel):
    code: str
    discount_percent: float
    active: bool = True
    max_uses: int = 0
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
    quantity_prices: Optional[List[dict]] = None
    color_images: Optional[dict] = None
    available_sizes: Optional[List[str]] = None
    available_qualities: Optional[List[str]] = None
    size_quality_prices: Optional[List[dict]] = None

class AdminOrderUpdate(BaseModel):
    status: Optional[str] = None
    payment_status: Optional[str] = None
    notes: Optional[str] = None
    tracking_number: Optional[str] = None
    tracking_carrier: Optional[str] = None

class SiteSettings(BaseModel):
    site_name: str = "Printsout"
    site_logo: Optional[str] = None
    contact_email: str = "info@printsout.se"
    notification_email: str = "info@printsout.se"
    phone: Optional[str] = None
    address: Optional[str] = None
    social_links: Dict[str, str] = {}

class PaymentSettings(BaseModel):
    stripe_enabled: bool = True
    stripe_test_mode: bool = True
    stripe_public_key: str = ""
    stripe_secret_key: str = ""
    klarna_enabled: bool = False
    klarna_merchant_id: str = ""
    klarna_api_key: str = ""
    swish_enabled: bool = False
    swish_number: str = ""
    swish_certificate: str = ""
    bank_transfer_enabled: bool = False
    bank_name: str = ""
    bank_account: str = ""
    bank_iban: str = ""
    bank_bic: str = ""
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
    payment_method: str = "card"

class Review(BaseModel):
    review_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_name: str
    rating: int
    text: str
    product_id: Optional[str] = None
    source: Optional[str] = "manual"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ContentPage(BaseModel):
    title: str
    slug: str
    content: str = ""
    status: str = "draft"
