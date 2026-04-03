import os
import pytest

@pytest.fixture
def admin_email():
    return os.environ.get("ADMIN_EMAIL", "info@printsout.se")

@pytest.fixture
def admin_password():
    return os.environ.get("ADMIN_PASSWORD", "PrintoutAdmin2024!")

@pytest.fixture
def api_base_url():
    return os.environ.get("API_BASE_URL", "http://localhost:8001/api")

@pytest.fixture
def test_user_email():
    return os.environ.get("TEST_USER_EMAIL", "testuser@test.com")

@pytest.fixture
def test_user_password():
    return os.environ.get("TEST_USER_PASSWORD", "TestPass123!")
