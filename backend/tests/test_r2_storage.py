"""R2 storage migration tests — verifies uploads land in Cloudflare R2 (not local disk)
and GET /api/uploads/{filename} proxies from R2 with correct content-type.
"""
import base64
import io
import os
import sys
import uuid
from pathlib import Path

import boto3
import pytest
import requests
from botocore.config import Config
from botocore.exceptions import ClientError
from PIL import Image

# Load backend .env so R2 credentials are available to this test process
from dotenv import load_dotenv
load_dotenv("/app/backend/.env")

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://printout-lab.preview.emergentagent.com").rstrip("/")
LOCAL_UPLOADS = Path("/app/backend/uploads")

R2_ENDPOINT = os.environ["R2_ENDPOINT"]
R2_ACCESS_KEY = os.environ["R2_ACCESS_KEY"]
R2_SECRET_KEY = os.environ["R2_SECRET_KEY"]
R2_BUCKET = os.environ["R2_BUCKET"]


@pytest.fixture(scope="module")
def r2_client():
    return boto3.client(
        "s3",
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=R2_ACCESS_KEY,
        aws_secret_access_key=R2_SECRET_KEY,
        config=Config(signature_version="s3v4", region_name="auto"),
    )


def _make_jpg_bytes(size=(200, 200), color=(255, 0, 0)) -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", size, color).save(buf, format="JPEG", quality=85)
    return buf.getvalue()


def _make_png_bytes(size=(150, 150), color=(0, 128, 255, 255)) -> bytes:
    buf = io.BytesIO()
    Image.new("RGBA", size, color).save(buf, format="PNG")
    return buf.getvalue()


def _make_pdf_bytes() -> bytes:
    # Minimal valid PDF
    return (b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
            b"2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n"
            b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 100 100]>>endobj\n"
            b"xref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n"
            b"0000000050 00000 n\n0000000094 00000 n\ntrailer<</Size 4/Root 1 0 R>>\n"
            b"startxref\n150\n%%EOF\n")


def _r2_object_exists(client, key: str) -> bool:
    try:
        client.head_object(Bucket=R2_BUCKET, Key=key)
        return True
    except ClientError:
        return False


# ── 1. POST /api/upload ─────────────────────────────────────────
class TestUpload:
    def test_upload_jpg_lands_in_r2_not_local(self, r2_client):
        img = _make_jpg_bytes()
        r = requests.post(
            f"{BASE_URL}/api/upload",
            files={"file": ("test.jpg", img, "image/jpeg")},
            timeout=30,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert "filename" in body and "url" in body
        filename = body["filename"]
        assert body["url"] == f"/api/uploads/{filename}"
        assert filename.endswith(".jpg")

        # CRITICAL: must be in R2 bucket
        assert _r2_object_exists(r2_client, filename), \
            f"File {filename} NOT found in R2 bucket {R2_BUCKET}"
        # CRITICAL: must NOT be on local disk
        assert not (LOCAL_UPLOADS / filename).exists(), \
            f"File {filename} unexpectedly written to local disk"

        # Cleanup
        r2_client.delete_object(Bucket=R2_BUCKET, Key=filename)

    def test_upload_png(self, r2_client):
        png = _make_png_bytes()
        r = requests.post(
            f"{BASE_URL}/api/upload",
            files={"file": ("logo.png", png, "image/png")},
            timeout=30,
        )
        assert r.status_code == 200
        fn = r.json()["filename"]
        assert _r2_object_exists(r2_client, fn)
        r2_client.delete_object(Bucket=R2_BUCKET, Key=fn)

    def test_upload_invalid_type_rejected(self):
        r = requests.post(
            f"{BASE_URL}/api/upload",
            files={"file": ("evil.exe", b"MZ\x90", "application/octet-stream")},
            timeout=15,
        )
        assert r.status_code == 400


# ── 2. POST /api/upload-base64 ─────────────────────────────────
class TestUploadBase64:
    def test_upload_base64_lands_in_r2(self, r2_client):
        img = _make_jpg_bytes(color=(0, 255, 0))
        data_url = "data:image/jpeg;base64," + base64.b64encode(img).decode()
        r = requests.post(
            f"{BASE_URL}/api/upload-base64",
            json={"image": data_url},
            timeout=30,
        )
        assert r.status_code == 200, r.text
        fn = r.json()["filename"]
        assert fn.endswith(".jpg")
        assert _r2_object_exists(r2_client, fn), f"{fn} not in R2"
        assert not (LOCAL_UPLOADS / fn).exists()
        r2_client.delete_object(Bucket=R2_BUCKET, Key=fn)

    def test_upload_base64_url_rejected(self):
        r = requests.post(
            f"{BASE_URL}/api/upload-base64",
            json={"image": "https://example.com/foo.jpg"},
            timeout=10,
        )
        assert r.status_code == 400


# ── 3. GET /api/uploads/{filename} — R2 proxy & local fallback ─
class TestGetUpload:
    def test_proxy_from_r2_when_no_local(self, r2_client):
        # Put directly in R2 (no local copy)
        key = f"test-r2-only-{uuid.uuid4()}.jpg"
        body = _make_jpg_bytes(color=(128, 64, 200))
        r2_client.put_object(Bucket=R2_BUCKET, Key=key, Body=body, ContentType="image/jpeg")
        try:
            assert not (LOCAL_UPLOADS / key).exists()  # sanity
            r = requests.get(f"{BASE_URL}/api/uploads/{key}", timeout=20)
            assert r.status_code == 200, f"Expected 200 proxy, got {r.status_code}"
            assert r.headers.get("content-type", "").startswith("image/jpeg")
            assert r.content == body, "Proxied bytes mismatch"
        finally:
            r2_client.delete_object(Bucket=R2_BUCKET, Key=key)

    def test_local_legacy_file_still_served(self):
        # Pick first existing local file (backwards-compat)
        existing = next((p for p in LOCAL_UPLOADS.iterdir() if p.is_file()), None)
        if existing is None:
            pytest.skip("No legacy local upload files")
        r = requests.get(f"{BASE_URL}/api/uploads/{existing.name}", timeout=15)
        assert r.status_code == 200
        assert len(r.content) == existing.stat().st_size

    def test_missing_file_returns_404(self):
        r = requests.get(f"{BASE_URL}/api/uploads/does-not-exist-{uuid.uuid4()}.jpg", timeout=10)
        assert r.status_code == 404


# ── 4. POST /api/calendar/generate-pdf with R2 image ───────────
class TestCalendarPdf:
    def test_generate_pdf_with_r2_image(self):
        # Upload an image first → goes to R2
        img = _make_jpg_bytes(size=(800, 600), color=(200, 100, 50))
        up = requests.post(
            f"{BASE_URL}/api/upload",
            files={"file": ("cal.jpg", img, "image/jpeg")},
            timeout=30,
        )
        assert up.status_code == 200
        url = up.json()["url"]
        filename = up.json()["filename"]

        try:
            payload = {
                "year": 2026,
                "month_images": {str(m): url for m in range(1, 13)},
                "format": "A4",
            }
            r = requests.post(f"{BASE_URL}/api/calendar/generate-pdf", json=payload, timeout=120)
            assert r.status_code == 200, r.text[:300]
            assert r.headers.get("content-type", "").startswith("application/pdf")
            assert len(r.content) > 15_000, \
                f"PDF too small ({len(r.content)} bytes) — image likely not embedded from R2"
        finally:
            try:
                boto3.client(
                    "s3", endpoint_url=R2_ENDPOINT,
                    aws_access_key_id=R2_ACCESS_KEY,
                    aws_secret_access_key=R2_SECRET_KEY,
                    config=Config(signature_version="s3v4", region_name="auto"),
                ).delete_object(Bucket=R2_BUCKET, Key=filename)
            except Exception:
                pass


# ── 5. POST /api/catalog/businesscard/preview-pdf with R2 logo ─
class TestBusinessCardPreview:
    def test_preview_pdf_with_r2_logo(self):
        png = _make_png_bytes(size=(300, 300))
        up = requests.post(
            f"{BASE_URL}/api/upload",
            files={"file": ("logo.png", png, "image/png")},
            timeout=30,
        )
        assert up.status_code == 200
        logo_url = up.json()["url"]
        filename = up.json()["filename"]

        try:
            payload = {
                "card_details": {
                    "name": "Test Tester", "title": "CEO", "company": "Test AB",
                    "phone": "0701234567", "email": "test@test.se",
                    "website": "test.se", "address": "Testvägen 1",
                },
                "template": "classic",
                "color": "#2a9d8f",
                "logo_url": logo_url,
            }
            r = requests.post(
                f"{BASE_URL}/api/catalog/businesscard/preview-pdf",
                json=payload, timeout=60,
            )
            assert r.status_code == 200, r.text[:300]
            assert r.headers.get("content-type", "").startswith("application/pdf")
            assert len(r.content) > 2_000
        finally:
            try:
                boto3.client(
                    "s3", endpoint_url=R2_ENDPOINT,
                    aws_access_key_id=R2_ACCESS_KEY,
                    aws_secret_access_key=R2_SECRET_KEY,
                    config=Config(signature_version="s3v4", region_name="auto"),
                ).delete_object(Bucket=R2_BUCKET, Key=filename)
            except Exception:
                pass


# ── 6. POST /api/catalog/order/print — PDF goes to R2 ──────────
class TestCatalogOrderPrint:
    def test_print_order_pdf_to_r2(self, r2_client):
        pdf = _make_pdf_bytes()
        files = {"pdf_file": ("catalog.pdf", pdf, "application/pdf")}
        data = {
            "company_name": "TEST_R2 AB",
            "contact_person": "Test Person",
            "email": "test_r2@example.com",
            "phone": "0700000000",
            "quantity": "1",
        }
        r = requests.post(
            f"{BASE_URL}/api/catalog/order/print",
            files=files, data=data, timeout=30,
        )
        assert r.status_code == 200, r.text
        order_id = r.json()["order_id"]

        # Find resulting order
        orders = requests.get(f"{BASE_URL}/api/catalog/orders", timeout=15).json()
        match = next((o for o in orders if o.get("order_id") == order_id), None)
        assert match is not None
        pdf_url = match["pdf_url"]
        filename = match["pdf_filename"]
        assert pdf_url == f"/api/uploads/{filename}"
        assert filename.startswith("catalog_") and filename.endswith(".pdf")
        # Must be in R2
        assert _r2_object_exists(r2_client, filename), f"{filename} not in R2"
        assert not (LOCAL_UPLOADS / filename).exists()

        # GET should proxy from R2
        g = requests.get(f"{BASE_URL}/api/uploads/{filename}", timeout=20)
        assert g.status_code == 200
        assert g.headers.get("content-type", "").startswith("application/pdf")

        # Cleanup
        r2_client.delete_object(Bucket=R2_BUCKET, Key=filename)


# ── 7. POST /api/catalog/order/businesscard (source=pdf) ───────
class TestBusinessCardOrderPdf:
    def test_businesscard_pdf_to_r2(self, r2_client):
        pdf = _make_pdf_bytes()
        files = {"pdf_file": ("bc.pdf", pdf, "application/pdf")}
        data = {
            "company_name": "TEST_R2 BC AB",
            "contact_person": "BC Person",
            "email": "bc_r2@example.com",
            "phone": "0700000001",
            "quantity": "100",
            "source": "pdf",
        }
        r = requests.post(
            f"{BASE_URL}/api/catalog/order/businesscard",
            files=files, data=data, timeout=30,
        )
        assert r.status_code == 200, r.text
        order_id = r.json()["order_id"]

        orders = requests.get(f"{BASE_URL}/api/catalog/orders", timeout=15).json()
        match = next((o for o in orders if o.get("order_id") == order_id), None)
        assert match is not None
        pdf_url = match["pdf_url"]
        assert pdf_url and pdf_url.startswith("/api/uploads/bizcard_")
        filename = pdf_url.rsplit("/", 1)[-1]
        assert _r2_object_exists(r2_client, filename), f"{filename} not in R2"
        assert not (LOCAL_UPLOADS / filename).exists()
        r2_client.delete_object(Bucket=R2_BUCKET, Key=filename)
