"""File upload routes — uses storage.py for R2/local handling."""
import base64
import logging
import uuid

from botocore.exceptions import ClientError
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse, RedirectResponse, Response

from config import UPLOADS_DIR
from storage import (
    R2_BUCKET,
    R2_ENABLED,
    R2_PUBLIC_URL,
    get_r2_client,
    store_file,
)

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Uploads"])


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    allowed = {"image/jpeg", "image/png", "image/webp", "application/pdf"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Bara JPG, PNG, WebP och PDF tillåtet")

    contents = await file.read()
    if len(contents) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Max filstorlek: 50MB")

    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    url = store_file(filename, contents, file.content_type)
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

    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Max filstorlek: 10MB")

    filename = f"{uuid.uuid4()}.{ext}"
    url = store_file(filename, contents, mime)
    return {"filename": filename, "url": url}


@router.get("/uploads/{filename}")
async def get_upload(filename: str):
    """Serve old local files OR proxy/redirect to R2 for backward-compat URLs."""
    filepath = UPLOADS_DIR / filename
    if filepath.exists():
        return FileResponse(filepath)
    if R2_ENABLED:
        # Try fetch from R2 directly (works even if bucket is private)
        try:
            obj = get_r2_client().get_object(Bucket=R2_BUCKET, Key=filename)
            return Response(
                content=obj["Body"].read(),
                media_type=obj.get("ContentType", "application/octet-stream"),
                headers={"Cache-Control": "public, max-age=31536000, immutable"},
            )
        except ClientError:
            pass
        # Last resort: redirect to public R2 URL (if configured)
        if R2_PUBLIC_URL:
            return RedirectResponse(url=f"{R2_PUBLIC_URL}/{filename}", status_code=302)
    raise HTTPException(status_code=404, detail="Filen hittades inte")
