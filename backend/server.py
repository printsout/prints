"""Printsout API — Main application entry point."""
from fastapi import FastAPI, APIRouter, Request
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pathlib import Path
import os
import logging
import resend

# Load .env before any other local imports
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env', override=False)

# Setup email
resend.api_key = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
print(f"[STARTUP] Resend key: {resend.api_key[:12]}... | From: {SENDER_EMAIL}")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

# App
app = FastAPI(title="Printsout API", redirect_slashes=False)
app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(status_code=429, content={"detail": "För många förfrågningar. Vänta en stund och försök igen."})

# ─── Routers ────────────────────────────────────────
from routers.auth_routes import router as auth_router
from routers.products import router as products_router
from routers.cart import router as cart_router
from routers.designs import router as designs_router
from routers.orders import router as orders_router
from routers.payments import router as payments_router, handle_stripe_webhook, get_public_shipping_settings
from routers.admin import router as admin_router
from routers.uploads import router as uploads_router
from routers.public import router as public_router
from routers.catalog import router as catalog_router

api_router = APIRouter(prefix="/api")
api_router.include_router(auth_router)
api_router.include_router(products_router)
api_router.include_router(cart_router)
api_router.include_router(designs_router)
api_router.include_router(orders_router)
api_router.include_router(payments_router)
api_router.include_router(admin_router)
api_router.include_router(uploads_router)
api_router.include_router(public_router)
api_router.include_router(catalog_router)

# Endpoints registered directly on api_router
@api_router.get("/")
async def root():
    return {"message": "Printsout API", "version": "2.0.0"}

@api_router.get("/shipping-settings")
async def shipping_settings():
    return await get_public_shipping_settings()

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    return await handle_stripe_webhook(request)

app.include_router(api_router)

# ─── Middleware ──────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# ─── Startup / Shutdown ─────────────────────────────

from database import db, client
from seed_data import get_seed_products, get_seed_reviews
from routers.admin import set_admin_password_hash
from config import ADMIN_EMAIL

@app.on_event("startup")
async def startup_init():
    existing = await db.products.find_one({}, {"_id": 0})
    if not existing:
        for product in get_seed_products():
            await db.products.insert_one(product.model_dump())
        for review in get_seed_reviews():
            await db.reviews.insert_one(review.model_dump())
        logger.info("Seed data initialized")
    # Ensure B2B products exist (idempotent upsert)
    for product in get_seed_products():
        if product.category == "foretag":
            await db.products.update_one(
                {"product_id": product.product_id},
                {"$setOnInsert": product.model_dump()},
                upsert=True,
            )
    # Load DB-stored admin password if exists
    admin_2fa = await db.admin_settings_2fa.find_one({"admin_email": ADMIN_EMAIL}, {"_id": 0})
    if admin_2fa and admin_2fa.get("password_hash"):
        set_admin_password_hash(admin_2fa["password_hash"])

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
