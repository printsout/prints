"""File upload routes."""
from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from config import UPLOADS_DIR
import uuid
import base64

router = APIRouter(tags=["Uploads"])

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    allowed = {'image/jpeg', 'image/png', 'image/webp', 'application/pdf'}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Bara JPG, PNG, WebP och PDF tillåtet")

    max_size = 50 * 1024 * 1024
    contents = await file.read()
    if len(contents) > max_size:
        raise HTTPException(status_code=400, detail="Max filstorlek: 50MB")

    ext = file.filename.rsplit('.', 1)[-1] if '.' in file.filename else 'jpg'
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = UPLOADS_DIR / filename

    with open(filepath, "wb") as f:
        f.write(contents)

    return {"filename": filename, "url": f"/api/uploads/{filename}"}

@router.post("/upload-base64")
async def upload_base64(data: dict):
    image_data = data.get("image")
    if not image_data:
        raise HTTPException(status_code=400, detail="Ingen bild skickad")

    # Reject server URLs passed by mistake (must be a data URL or raw base64)
    if image_data.startswith("/api/") or image_data.startswith("http"):
        raise HTTPException(status_code=400, detail="Ogiltig bilddata — URL skickad istället för base64")

    if "base64," in image_data:
        header, image_data = image_data.split("base64,", 1)
        if "png" in header:
            ext = "png"
        elif "webp" in header:
            ext = "webp"
        else:
            ext = "jpg"
    else:
        ext = "jpg"

    try:
        contents = base64.b64decode(image_data)
    except Exception:
        raise HTTPException(status_code=400, detail="Ogiltig bilddata")

    # Validate it's actually an image (check magic bytes)
    if len(contents) < 100:
        raise HTTPException(status_code=400, detail="Ogiltig bildfil — för liten")

    max_size = 10 * 1024 * 1024
    if len(contents) > max_size:
        raise HTTPException(status_code=400, detail="Max filstorlek: 10MB")

    filename = f"{uuid.uuid4()}.{ext}"
    filepath = UPLOADS_DIR / filename

    with open(filepath, "wb") as f:
        f.write(contents)

    return {"filename": filename, "url": f"/api/uploads/{filename}"}

@router.get("/uploads/{filename}")
async def get_upload(filename: str):
    filepath = UPLOADS_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Filen hittades inte")
    return FileResponse(filepath)
