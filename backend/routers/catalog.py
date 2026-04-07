"""Catalog order routes for B2B catalog requests."""
from fastapi import APIRouter, HTTPException
from database import db
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/catalog", tags=["Catalog"])


class CatalogOrderRequest(BaseModel):
    company_name: str
    contact_person: str
    email: EmailStr
    phone: str
    address: Optional[str] = None
    postal_code: Optional[str] = None
    city: Optional[str] = None
    catalog_type: str  # "physical" or "digital"
    quantity: int = 1
    message: Optional[str] = None


@router.post("/order")
async def create_catalog_order(order: CatalogOrderRequest):
    order_data = order.model_dump()
    order_data["order_id"] = str(uuid.uuid4())
    order_data["status"] = "pending"
    order_data["created_at"] = datetime.now(timezone.utc).isoformat()

    await db.catalog_orders.insert_one(order_data)
    order_data.pop("_id", None)
    return {"message": "Beställning mottagen", "order_id": order_data["order_id"]}


@router.get("/orders")
async def get_catalog_orders():
    orders = await db.catalog_orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return orders
