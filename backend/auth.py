"""Authentication helpers and dependencies."""
import re
import jwt
import bcrypt
import bleach
from datetime import datetime, timezone, timedelta
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config import JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRATION_HOURS, PASSWORD_MIN_LENGTH

security = HTTPBearer(auto_error=False)

# HTML sanitization
ALLOWED_TAGS = ['h1', 'h2', 'h3', 'h4', 'p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'blockquote']
ALLOWED_ATTRS = {'a': ['href', 'title']}

def sanitize_html(content: str) -> str:
    return bleach.clean(content, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRS, strip=True)

def validate_password(password: str) -> str:
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

def verify_admin_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
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
