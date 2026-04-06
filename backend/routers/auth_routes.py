"""Authentication routes: register, login, forgot/reset password."""
from fastapi import APIRouter, HTTPException, Depends, Request
from database import db
from models import UserCreate, UserLogin, UserResponse, TokenResponse
from auth import validate_password, hash_password, verify_password, create_token, require_auth
from email_service import build_password_reset_html
from config import SENDER_EMAIL
import uuid
import os
import asyncio
import resend
import logging
from datetime import datetime, timezone, timedelta

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
async def register(request: Request, user_data: UserCreate):
    pwd_error = validate_password(user_data.password)
    if pwd_error:
        raise HTTPException(status_code=400, detail=pwd_error)

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
        user=UserResponse(user_id=user_id, email=user_data.email, name=user_data.name, created_at=user_doc["created_at"])
    )

@router.post("/login", response_model=TokenResponse)
async def login(request: Request, credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Felaktig e-post eller lösenord")

    token = create_token(user["user_id"], user["email"])
    return TokenResponse(
        access_token=token,
        user=UserResponse(user_id=user["user_id"], email=user["email"], name=user["name"], created_at=user["created_at"])
    )

@router.get("/me", response_model=UserResponse)
async def get_profile(user: dict = Depends(require_auth)):
    user_doc = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "password_hash": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="Användare hittades inte")
    return UserResponse(**user_doc)

@router.post("/forgot-password")
async def customer_forgot_password(request: Request, data: dict):
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
        html = build_password_reset_html(reset_link)
        params = {
            "from": f"PrintsOut <{SENDER_EMAIL}>",
            "to": [email],
            "subject": "Återställ ditt lösenord",
            "html": html,
            "text": f"Hej!\n\nVi fick en begäran om att återställa lösenordet för ditt konto hos PrintsOut.\n\nKlicka på länken nedan för att välja ett nytt lösenord:\n{reset_link}\n\nLänken är giltig i 30 minuter.\n\nMed vänliga hälsningar,\nPrintsOut"
        }
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Password reset link sent to {email}")
    except Exception as e:
        logger.warning(f"Failed to send reset email: {e}")

    return {"message": "Om e-postadressen finns i systemet skickas en återställningslänk"}

@router.post("/reset-password")
async def customer_reset_password(request: Request, data: dict):
    token = (data.get("token") or "").strip()
    new_password = data.get("new_password") or ""

    pwd_error = validate_password(new_password)
    if pwd_error:
        raise HTTPException(status_code=400, detail=pwd_error)

    reset = await db.user_password_resets.find_one({"reset_token": token, "used": False}, {"_id": 0})
    if not reset:
        raise HTTPException(status_code=400, detail="Ogiltig eller utgången länk")

    if datetime.now(timezone.utc).isoformat() > reset["expires_at"]:
        raise HTTPException(status_code=400, detail="Länken har gått ut. Begär en ny.")

    new_hash = hash_password(new_password)
    await db.users.update_one({"email": reset["email"]}, {"$set": {"password_hash": new_hash}})
    await db.user_password_resets.update_one({"reset_token": token}, {"$set": {"used": True}})

    return {"message": "Lösenordet har ändrats. Du kan nu logga in."}
