"""Public miscellaneous routes: reviews, pages, discount validation."""
from fastapi import APIRouter, HTTPException
from typing import List
from database import db
from models import Review
from datetime import datetime, timezone

router = APIRouter(tags=["Public"])

@router.get("/reviews", response_model=List[Review])
async def get_reviews():
    reviews = await db.reviews.find({}, {"_id": 0}).sort("created_at", -1).to_list(20)
    return [Review(**r) for r in reviews]

@router.get("/review-platforms")
async def get_review_platforms():
    settings = await db.review_settings.find_one({"type": "platforms"}, {"_id": 0})
    if not settings:
        return {"platforms": []}
    return {"platforms": settings.get("platforms", [])}

@router.post("/validate-discount-code")
async def validate_discount_code(data: dict):
    code = data.get("code", "").strip().upper()
    if not code:
        raise HTTPException(status_code=400, detail="Ange en rabattkod")

    doc = await db.discount_codes.find_one({"code": code}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Ogiltig rabattkod")
    if not doc.get("active", True):
        raise HTTPException(status_code=400, detail="Rabattkoden är inte aktiv")
    if doc.get("max_uses", 0) > 0 and doc.get("current_uses", 0) >= doc["max_uses"]:
        raise HTTPException(status_code=400, detail="Rabattkoden har redan använts max antal gånger")
    if doc.get("expires_at"):
        try:
            exp = datetime.fromisoformat(doc["expires_at"].replace("Z", "+00:00"))
            if datetime.now(timezone.utc) > exp:
                raise HTTPException(status_code=400, detail="Rabattkoden har gått ut")
        except (ValueError, TypeError):
            pass

    return {"valid": True, "code": doc["code"], "discount_percent": doc["discount_percent"]}

@router.get("/pages/{slug:path}")
async def get_public_page(slug: str):
    page = await db.content_pages.find_one({"slug": f"/{slug}", "status": "published"}, {"_id": 0})
    if not page:
        raise HTTPException(status_code=404, detail="Sidan hittades inte")
    return page
