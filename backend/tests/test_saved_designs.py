"""Tests for Saved Designs feature — POST/GET/PUT/DELETE /api/saved-designs + SEO files."""
import os
import uuid
import pytest
import requests
from dotenv import load_dotenv

load_dotenv("/app/frontend/.env")
BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"


def _register_user():
    email = f"test_sd_{uuid.uuid4().hex[:10]}@example.com"
    password = "Testing123!"
    r = requests.post(f"{API}/auth/register", json={
        "email": email, "password": password, "name": "Saved Design Tester"
    }, timeout=30)
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    data = r.json()
    return {"email": email, "password": password, "token": data["access_token"], "user_id": data["user"]["user_id"]}


@pytest.fixture(scope="module")
def user_a():
    return _register_user()


@pytest.fixture(scope="module")
def user_b():
    return _register_user()


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


# ---------- AUTH GUARDS ----------
class TestAuthGuards:
    def test_post_requires_auth(self):
        r = requests.post(f"{API}/saved-designs", json={"editor_type": "calendar"}, timeout=15)
        assert r.status_code in (401, 403), f"expected 401/403, got {r.status_code}"

    def test_get_list_requires_auth(self):
        r = requests.get(f"{API}/saved-designs", timeout=15)
        assert r.status_code in (401, 403)

    def test_get_one_requires_auth(self):
        r = requests.get(f"{API}/saved-designs/nonexistent", timeout=15)
        assert r.status_code in (401, 403)

    def test_put_requires_auth(self):
        r = requests.put(f"{API}/saved-designs/x", json={"editor_type": "calendar"}, timeout=15)
        assert r.status_code in (401, 403)

    def test_delete_requires_auth(self):
        r = requests.delete(f"{API}/saved-designs/x", timeout=15)
        assert r.status_code in (401, 403)


# ---------- CRUD ----------
class TestSavedDesignCRUD:
    def test_create_returns_full_model(self, user_a):
        payload = {
            "name": "TEST_Kalender2026",
            "editor_type": "calendar",
            "product_id": "prod-cal-1",
            "product_name": "Väggkalender A3",
            "price": 199.0,
            "quantity": 1,
            "customization": {"month_images": ["img1", "img2"], "theme": "nature"},
        }
        r = requests.post(f"{API}/saved-designs", json=payload, headers=_auth(user_a["token"]), timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "design_id" in data and data["design_id"]
        assert data["user_id"] == user_a["user_id"]
        assert data["editor_type"] == "calendar"
        assert data["name"] == "TEST_Kalender2026"
        assert data["customization"]["theme"] == "nature"
        assert "created_at" in data and "updated_at" in data
        assert "_id" not in data, "Mongo ObjectId leaked in response"
        user_a["design_id"] = data["design_id"]

    def test_list_only_my_designs_sorted(self, user_a, user_b):
        # user_b creates one
        pb = {"name": "TEST_B_nametag", "editor_type": "nametag",
              "customization": {"text": "John"}}
        rb = requests.post(f"{API}/saved-designs", json=pb, headers=_auth(user_b["token"]), timeout=20)
        assert rb.status_code == 200
        user_b["design_id"] = rb.json()["design_id"]

        # user_a creates a second
        pa2 = {"name": "TEST_A2_photoalbum", "editor_type": "photoalbum",
               "customization": {"pages": 20}}
        ra2 = requests.post(f"{API}/saved-designs", json=pa2, headers=_auth(user_a["token"]), timeout=20)
        assert ra2.status_code == 200
        newest = ra2.json()["design_id"]

        # List for user_a
        r = requests.get(f"{API}/saved-designs", headers=_auth(user_a["token"]), timeout=15)
        assert r.status_code == 200
        items = r.json()
        ids = [d["design_id"] for d in items]
        assert newest in ids and user_a["design_id"] in ids
        assert user_b["design_id"] not in ids, "User A should not see User B's designs"
        # Newest first
        assert items[0]["design_id"] == newest
        for d in items:
            assert "_id" not in d
            assert d["user_id"] == user_a["user_id"]

    def test_get_one_owned(self, user_a):
        r = requests.get(f"{API}/saved-designs/{user_a['design_id']}",
                         headers=_auth(user_a["token"]), timeout=15)
        assert r.status_code == 200
        assert r.json()["design_id"] == user_a["design_id"]
        assert "_id" not in r.json()

    def test_get_other_users_design_returns_404(self, user_a, user_b):
        r = requests.get(f"{API}/saved-designs/{user_b['design_id']}",
                         headers=_auth(user_a["token"]), timeout=15)
        assert r.status_code == 404

    def test_get_invalid_id_returns_404(self, user_a):
        r = requests.get(f"{API}/saved-designs/does-not-exist-{uuid.uuid4().hex}",
                         headers=_auth(user_a["token"]), timeout=15)
        assert r.status_code == 404

    def test_put_updates_and_bumps_updated_at(self, user_a):
        # fetch current updated_at
        r0 = requests.get(f"{API}/saved-designs/{user_a['design_id']}",
                          headers=_auth(user_a["token"]), timeout=15)
        before = r0.json()["updated_at"]

        import time
        time.sleep(1.1)
        payload = {
            "name": "TEST_Kalender2026_UPD",
            "editor_type": "calendar",
            "product_id": "prod-cal-1",
            "price": 249.0,
            "quantity": 2,
            "customization": {"theme": "city"},
        }
        r = requests.put(f"{API}/saved-designs/{user_a['design_id']}",
                         json=payload, headers=_auth(user_a["token"]), timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["name"] == "TEST_Kalender2026_UPD"
        assert data["customization"]["theme"] == "city"
        assert data["price"] == 249.0
        assert data["updated_at"] > before
        assert "_id" not in data

        # GET verifies persistence
        r2 = requests.get(f"{API}/saved-designs/{user_a['design_id']}",
                          headers=_auth(user_a["token"]), timeout=15)
        assert r2.json()["name"] == "TEST_Kalender2026_UPD"

    def test_put_other_users_design_404(self, user_a, user_b):
        r = requests.put(f"{API}/saved-designs/{user_b['design_id']}",
                         json={"editor_type": "nametag", "name": "hack"},
                         headers=_auth(user_a["token"]), timeout=15)
        assert r.status_code == 404

    def test_delete_other_users_404(self, user_a, user_b):
        r = requests.delete(f"{API}/saved-designs/{user_b['design_id']}",
                            headers=_auth(user_a["token"]), timeout=15)
        assert r.status_code == 404

    def test_delete_owner_ok_then_404(self, user_a):
        r = requests.delete(f"{API}/saved-designs/{user_a['design_id']}",
                            headers=_auth(user_a["token"]), timeout=15)
        assert r.status_code == 200
        # Subsequent GET -> 404
        r2 = requests.get(f"{API}/saved-designs/{user_a['design_id']}",
                          headers=_auth(user_a["token"]), timeout=15)
        assert r2.status_code == 404


# ---------- EDITOR-TYPE FLEXIBILITY ----------
class TestEditorTypes:
    @pytest.mark.parametrize("etype,cust", [
        ("businesscard", {"front": {"name": "Lisa", "title": "VD"}, "back_style": "solid"}),
        ("nametag", {"text": "Erik", "color": "#ff0"}),
        ("photoalbum", {"pages": [{"img": "a"}, {"img": "b"}]}),
        ("design", {"text": "hej", "scale": 1.2, "position_x": 0.5}),
    ])
    def test_create_each_editor_type(self, user_a, etype, cust):
        r = requests.post(f"{API}/saved-designs",
                          json={"name": f"TEST_{etype}", "editor_type": etype, "customization": cust},
                          headers=_auth(user_a["token"]), timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["editor_type"] == etype
        assert d["customization"] == cust
        # cleanup
        requests.delete(f"{API}/saved-designs/{d['design_id']}",
                        headers=_auth(user_a["token"]), timeout=10)


# ---------- SEO FILES ----------
class TestSEOFiles:
    def test_robots_txt(self):
        r = requests.get(f"{BASE_URL}/robots.txt", timeout=15)
        assert r.status_code == 200, r.status_code
        assert "Sitemap" in r.text, "robots.txt should contain Sitemap line"

    def test_sitemap_xml(self):
        r = requests.get(f"{BASE_URL}/sitemap.xml", timeout=15)
        assert r.status_code == 200
        import xml.etree.ElementTree as ET
        ET.fromstring(r.text)  # raises if invalid

    def test_manifest_json(self):
        r = requests.get(f"{BASE_URL}/manifest.json", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "icons" in data and isinstance(data["icons"], list) and len(data["icons"]) > 0

    @pytest.mark.parametrize("path", [
        "/favicon.ico", "/favicon-32x32.png", "/apple-touch-icon.png", "/og-image.jpg",
    ])
    def test_icon_files(self, path):
        r = requests.get(f"{BASE_URL}{path}", timeout=15)
        assert r.status_code == 200, f"{path} -> {r.status_code}"
        assert len(r.content) > 100

    def test_index_html_seo_tags(self):
        r = requests.get(f"{BASE_URL}/", timeout=15)
        assert r.status_code == 200
        html = r.text.lower()
        assert 'lang="sv"' in html or "lang='sv'" in html, "lang='sv' missing"
        assert "og:title" in html
        assert "og:image" in html
        assert "twitter:card" in html
        assert "application/ld+json" in html
