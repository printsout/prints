"""Design routes."""
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from database import db
from models import Design, DesignConfig
from auth import get_current_user, require_auth
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/designs", tags=["Designs"])

@router.post("/", response_model=Design)
async def create_design(design: Design, user: dict = Depends(get_current_user)):
    design_dict = design.model_dump()
    if user:
        design_dict["user_id"] = user["user_id"]
    design_dict["design_id"] = str(uuid.uuid4())
    design_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    design_dict["updated_at"] = design_dict["created_at"]
    await db.designs.insert_one(design_dict)
    return Design(**design_dict)

@router.get("/my-designs", response_model=List[Design])
async def get_my_designs(user: dict = Depends(require_auth)):
    designs = await db.designs.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(100)
    return [Design(**d) for d in designs]

@router.get("/{design_id}", response_model=Design)
async def get_design(design_id: str):
    design = await db.designs.find_one({"design_id": design_id}, {"_id": 0})
    if not design:
        raise HTTPException(status_code=404, detail="Design hittades inte")
    return Design(**design)

@router.put("/{design_id}", response_model=Design)
async def update_design(design_id: str, config: DesignConfig, user: dict = Depends(get_current_user)):
    design = await db.designs.find_one({"design_id": design_id}, {"_id": 0})
    if not design:
        raise HTTPException(status_code=404, detail="Design hittades inte")
    design["config"] = config.model_dump()
    design["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.designs.update_one({"design_id": design_id}, {"$set": design})
    return Design(**design)

@router.delete("/{design_id}")
async def delete_design(design_id: str, user: dict = Depends(require_auth)):
    result = await db.designs.delete_one({"design_id": design_id, "user_id": user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Design hittades inte")
    return {"message": "Design borttagen"}
