"""Application configuration constants."""
import os
import re
from pathlib import Path

ROOT_DIR = Path(__file__).parent

# JWT
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 8

# Stripe
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')

# Admin
ADMIN_EMAIL = os.environ['ADMIN_EMAIL']
ADMIN_PASSWORD_HASH = os.environ['ADMIN_PASSWORD_HASH']

# Email
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')

# Password validation
PASSWORD_MIN_LENGTH = 8
PASSWORD_REGEX = re.compile(
    r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};:\'",.<>?/\\|`~]).{8,}$'
)

# Uploads
UPLOADS_DIR = ROOT_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)
