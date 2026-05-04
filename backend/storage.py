"""Centralized file storage helpers — Cloudflare R2 with local fallback."""
import base64
import logging
import os
from io import BytesIO
from pathlib import Path
from typing import Optional, Tuple

import boto3
import requests
from botocore.config import Config
from botocore.exceptions import ClientError

from config import UPLOADS_DIR

logger = logging.getLogger(__name__)

# ── R2 config (read at import time) ─────────────────────────────
R2_ENDPOINT = os.environ.get("R2_ENDPOINT", "").rstrip("/")
R2_ACCESS_KEY = os.environ.get("R2_ACCESS_KEY", "")
R2_SECRET_KEY = os.environ.get("R2_SECRET_KEY", "")
R2_BUCKET = os.environ.get("R2_BUCKET", "")
R2_PUBLIC_URL = os.environ.get("R2_PUBLIC_URL", "").rstrip("/")  # e.g. https://pub-xxx.r2.dev

R2_ENABLED = bool(R2_ENDPOINT and R2_ACCESS_KEY and R2_SECRET_KEY and R2_BUCKET)
_r2_client = None


def get_r2_client():
    global _r2_client
    if _r2_client is None and R2_ENABLED:
        _r2_client = boto3.client(
            "s3",
            endpoint_url=R2_ENDPOINT,
            aws_access_key_id=R2_ACCESS_KEY,
            aws_secret_access_key=R2_SECRET_KEY,
            config=Config(signature_version="s3v4", region_name="auto"),
        )
    return _r2_client


def store_file(filename: str, contents: bytes, content_type: str) -> str:
    """Save file to R2 (if configured) or local disk. Returns public URL.

    If R2_PUBLIC_URL is set, returns the direct CDN URL.
    Otherwise returns /api/uploads/<filename>; GET endpoint will proxy from R2.
    """
    if R2_ENABLED:
        try:
            client = get_r2_client()
            client.put_object(
                Bucket=R2_BUCKET,
                Key=filename,
                Body=contents,
                ContentType=content_type,
                CacheControl="public, max-age=31536000, immutable",
            )
            if R2_PUBLIC_URL:
                return f"{R2_PUBLIC_URL}/{filename}"
            return f"/api/uploads/{filename}"
        except (ClientError, Exception) as exc:  # pragma: no cover
            logger.error(f"R2 upload failed, falling back to local: {exc}")

    filepath = UPLOADS_DIR / filename
    with open(filepath, "wb") as f:
        f.write(contents)
    return f"/api/uploads/{filename}"


def fetch_bytes(url_or_path: str) -> Optional[bytes]:
    """
    Fetch raw bytes from a URL/path. Supports:
      - Local /api/uploads/<filename> or /uploads/<filename> (reads from UPLOADS_DIR)
      - http(s):// URL (R2 public URL or any external)
      - data:image/...;base64,<data>
      - Bare filename (looks in UPLOADS_DIR)
      - Absolute filesystem path
    Returns None on failure.
    """
    if not url_or_path:
        return None
    try:
        # Data URL
        if url_or_path.startswith("data:"):
            _, data = url_or_path.split(",", 1)
            return base64.b64decode(data)

        # Local API path
        if url_or_path.startswith("/api/uploads/") or url_or_path.startswith("/uploads/"):
            filename = url_or_path.rsplit("/", 1)[-1]
            local = UPLOADS_DIR / filename
            if local.exists():
                return local.read_bytes()
            # Try R2 fallback (e.g. older path stored before migration)
            if R2_ENABLED:
                try:
                    obj = get_r2_client().get_object(Bucket=R2_BUCKET, Key=filename)
                    return obj["Body"].read()
                except ClientError:
                    return None
            return None

        # External URL
        if url_or_path.startswith("http://") or url_or_path.startswith("https://"):
            resp = requests.get(url_or_path, timeout=15)
            resp.raise_for_status()
            return resp.content

        # Absolute path on disk
        if os.path.isabs(url_or_path) and os.path.exists(url_or_path):
            with open(url_or_path, "rb") as f:
                return f.read()

        # Bare filename → look in UPLOADS_DIR
        candidate = UPLOADS_DIR / url_or_path.split("/")[-1]
        if candidate.exists():
            return candidate.read_bytes()
    except Exception as exc:
        logger.warning(f"fetch_bytes failed for {url_or_path[:80]}: {exc}")
    return None


def fetch_image_reader(url_or_path: str):
    """Return a ReportLab ImageReader for the given URL/path, or None."""
    from reportlab.lib.utils import ImageReader  # lazy import (heavy)
    data = fetch_bytes(url_or_path)
    if data is None or len(data) < 100:
        return None
    try:
        return ImageReader(BytesIO(data))
    except Exception as exc:
        logger.warning(f"ImageReader failed for {url_or_path[:80]}: {exc}")
        return None


def fetch_to_tempfile(url_or_path: str, suffix: str = ".jpg") -> Optional[str]:
    """Download or copy file to a temp path, return that path. For libs that need a path."""
    import tempfile
    data = fetch_bytes(url_or_path)
    if data is None or len(data) < 100:
        return None
    fd, tmp = tempfile.mkstemp(suffix=suffix)
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(data)
        return tmp
    except Exception:
        return None
