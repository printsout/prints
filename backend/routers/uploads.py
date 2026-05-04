"""File upload routes — uploads to Cloudflare R2 if configured, otherwise local disk."""
import base64
import logging
import os
import uuid
from typing import Optional

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse, RedirectResponse, Response

from config import UPLOADS_DIR

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Uploads"])

# ── Cloudflare R2 configuration ──
R2_ENDPOINT = os.environ.get("R2_ENDPOINT", "").rstrip("/")
R2_ACCESS_KEY = os.environ.get("R2_ACCESS_KEY", "")
R2_SECRET_KEY = os.environ.get("R2_SECRET_KEY", "")
R2_BUCKET = os.environ.get("R2_BUCKET", "")
R2_PUBLIC_URL = os.environ.get("R2_PUBLIC_URL", "").rstrip("/")  # e.g. https://pub-xxxx.r2.dev

R2_ENABLED = all([R2_ENDPOINT, R2_ACCESS_KEY, R2_SECRET_KEY, R2_BUCKET, R2_PUBLIC_URL])
_r2_client: Optional["boto3.client"] = None


def _get_r2_client():
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


def _upload_to_r2(filename: str, contents: bytes, content_type: str) -> str:
    """Upload bytes to R2 and return public URL."""
    client = _get_r2_client()
    client.put_object(
        Bucket=R2_BUCKET,
        Key=filename,
        Body=contents,
        ContentType=content_type,
        CacheControl="public, max-age=31536000, immutable",
    )
    return f"{R2_PUBLIC_URL}/{filename}"


def _store_file(filename: str, contents: bytes, content_type: str) -> str:
    """Store file to R2 (if configured) or local disk. Returns public URL."""
    if R2_ENABLED:
        try:
            return _upload_to_r2(filename, contents, content_type)
        except (ClientError, Exception) as exc:
            logger.error(f"R2 upload failed, falling back to local: {exc}")
    # Local fallback
    filepath = UPLOADS_DIR / filename
    with open(filepath, "wb") as f:
        f.write(contents)
    return f"/api/uploads/{filename}"


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    allowed = {"image/jpeg", "image/png", "image/webp", "application/pdf"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Bara JPG, PNG, WebP och PDF tillåtet")

    max_size = 50 * 1024 * 1024
    contents = await file.read()
    if len(contents) > max_size:
        raise HTTPException(status_code=400, detail="Max filstorlek: 50MB")

    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    url = _store_file(filename, contents, file.content_type)
    return {"filename": filename, "url": url}


@router.post("/upload-base64")
async def upload_base64(data: dict):
    image_data = data.get("image")
    if not image_data:
        raise HTTPException(status_code=400, detail="Ingen bild skickad")

    if image_data.startswith("/api/") or image_data.startswith("http"):
        raise HTTPException(status_code=400, detail="Ogiltig bilddata — URL skickad istället för base64")

    if "base64," in image_data:
        header, image_data = image_data.split("base64,", 1)
        if "png" in header:
            ext, mime = "png", "image/png"
        elif "webp" in header:
            ext, mime = "webp", "image/webp"
        else:
            ext, mime = "jpg", "image/jpeg"
    else:
        ext, mime = "jpg", "image/jpeg"

    try:
        contents = base64.b64decode(image_data)
    except Exception:
        raise HTTPException(status_code=400, detail="Ogiltig bilddata")

    if len(contents) < 100:
        raise HTTPException(status_code=400, detail="Ogiltig bildfil — för liten")

    max_size = 10 * 1024 * 1024
    if len(contents) > max_size:
        raise HTTPException(status_code=400, detail="Max filstorlek: 10MB")

    filename = f"{uuid.uuid4()}.{ext}"
    url = _store_file(filename, contents, mime)
    return {"filename": filename, "url": url}


@router.get("/uploads/{filename}")
async def get_upload(filename: str):
    """Serve old local files OR redirect to R2 public URL for forward-compat."""
    filepath = UPLOADS_DIR / filename
    if filepath.exists():
        return FileResponse(filepath)
    # Try to fetch from R2 if local doesn't exist
    if R2_ENABLED:
        try:
            client = _get_r2_client()
            obj = client.get_object(Bucket=R2_BUCKET, Key=filename)
            return Response(
                content=obj["Body"].read(),
                media_type=obj.get("ContentType", "application/octet-stream"),
                headers={"Cache-Control": "public, max-age=31536000, immutable"},
            )
        except ClientError:
            pass
        # Last resort: redirect to public R2 URL
        return RedirectResponse(url=f"{R2_PUBLIC_URL}/{filename}", status_code=302)
    raise HTTPException(status_code=404, detail="Filen hittades inte")
