"""Shared test fixtures and configuration."""
import os
import pytest
from pathlib import Path
from dotenv import load_dotenv

# Load test environment variables
_env_path = Path(__file__).parent / ".env.test"
load_dotenv(_env_path)


@pytest.fixture
def admin_email():
    return os.environ.get("ADMIN_EMAIL", "info@printsout.se")


@pytest.fixture
def admin_password():
    return os.environ.get("ADMIN_PASSWORD", "PrintoutAdmin2024!")


@pytest.fixture
def totp_secret():
    return os.environ.get("TOTP_SECRET", "")


@pytest.fixture
def test_user_password():
    return os.environ.get("TEST_USER_PASSWORD", "TestPassword123!")
