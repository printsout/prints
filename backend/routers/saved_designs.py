"""Saved designs — flexible storage for any editor (BusinessCard, Calendar, NameTag, PhotoAlbum, DesignEditor)."""
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from database import db
from models import SavedDesign, SavedDesignCreate
from auth import require_auth
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/saved-designs", tags=["SavedDesigns"])


@router.post("", response_model=SavedDesign)
async def create_saved_design(payload: SavedDesignCreate, user: dict = Depends(require_auth)):
    """Save a design from any editor. Auth required."""
    now = datetime.now(timezone.utc).isoformat()
    design = payload.model_dump()
    design["design_id"] = str(uuid.uuid4())
    design["user_id"] = user["user_id"]
    design["created_at"] = now
    design["updated_at"] = now
    await db.saved_designs.insert_one(design.copy())
    design.pop("_id", None)
    return SavedDesign(**design)


@router.get("", response_model=List[SavedDesign])
async def list_my_saved_designs(user: dict = Depends(require_auth)):
    docs = await db.saved_designs.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("updated_at", -1).to_list(200)
    return [SavedDesign(**d) for d in docs]


@router.get("/{design_id}", response_model=SavedDesign)
async def get_saved_design(design_id: str, user: dict = Depends(require_auth)):
    doc = await db.saved_designs.find_one(
        {"design_id": design_id, "user_id": user["user_id"]}, {"_id": 0}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Design hittades inte")
    return SavedDesign(**doc)


@router.put("/{design_id}", response_model=SavedDesign)
async def update_saved_design(design_id: str, payload: SavedDesignCreate, user: dict = Depends(require_auth)):
    doc = await db.saved_designs.find_one(
        {"design_id": design_id, "user_id": user["user_id"]}, {"_id": 0}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Design hittades inte")
    update = payload.model_dump()
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.saved_designs.update_one(
        {"design_id": design_id, "user_id": user["user_id"]}, {"$set": update}
    )
    doc.update(update)
    return SavedDesign(**doc)


@router.delete("/{design_id}")
async def delete_saved_design(design_id: str, user: dict = Depends(require_auth)):
    result = await db.saved_designs.delete_one(
        {"design_id": design_id, "user_id": user["user_id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Design hittades inte")
    return {"message": "Design borttagen"}
