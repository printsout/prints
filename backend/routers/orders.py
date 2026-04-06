"""User-facing order routes."""
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from database import db
from models import Order
from auth import get_current_user, require_auth

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.get("/my-orders", response_model=List[Order])
async def get_my_orders(user: dict = Depends(require_auth)):
    orders = await db.orders.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [Order(**o) for o in orders]

@router.get("/{order_id}", response_model=Order)
async def get_order(order_id: str, user: dict = Depends(get_current_user)):
    query = {"order_id": order_id}
    if user:
        query["user_id"] = user["user_id"]
    order = await db.orders.find_one(query, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order hittades inte")
    return Order(**order)
