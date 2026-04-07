"""Cart routes."""
from fastapi import APIRouter, HTTPException
from database import db
from models import CartItem
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/cart", tags=["Cart"])

@router.get("/{session_id}")
async def get_cart(session_id: str):
    cart = await db.carts.find_one({"session_id": session_id}, {"_id": 0})
    if not cart:
        return {"cart_id": str(uuid.uuid4()), "session_id": session_id, "items": []}
    return cart

@router.post("/{session_id}/items")
async def add_to_cart(session_id: str, item: CartItem):
    cart = await db.carts.find_one({"session_id": session_id}, {"_id": 0})
    if not cart:
        cart = {"cart_id": str(uuid.uuid4()), "session_id": session_id, "items": [], "updated_at": datetime.now(timezone.utc).isoformat()}

    item_dict = item.model_dump()
    item_dict["cart_item_id"] = str(uuid.uuid4())
    cart["items"].append(item_dict)
    cart["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.carts.update_one({"session_id": session_id}, {"$set": cart}, upsert=True)
    return cart

@router.put("/{session_id}/items/{cart_item_id}")
async def update_cart_item(session_id: str, cart_item_id: str, quantity: int):
    cart = await db.carts.find_one({"session_id": session_id}, {"_id": 0})
    if not cart:
        raise HTTPException(status_code=404, detail="Varukorg hittades inte")

    for item in cart["items"]:
        if item["cart_item_id"] == cart_item_id:
            if quantity <= 0:
                cart["items"].remove(item)
            else:
                item["quantity"] = quantity
            break

    cart["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.carts.update_one({"session_id": session_id}, {"$set": cart})
    return cart

@router.delete("/{session_id}/items/{cart_item_id}")
async def remove_from_cart(session_id: str, cart_item_id: str):
    cart = await db.carts.find_one({"session_id": session_id}, {"_id": 0})
    if not cart:
        raise HTTPException(status_code=404, detail="Varukorg hittades inte")

    cart["items"] = [item for item in cart["items"] if item["cart_item_id"] != cart_item_id]
    cart["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.carts.update_one({"session_id": session_id}, {"$set": cart})
    return cart

@router.patch("/{session_id}/items/{cart_item_id}")
async def update_cart_item_full(session_id: str, cart_item_id: str, item: CartItem):
    """Replace a cart item's data while preserving the cart_item_id."""
    cart = await db.carts.find_one({"session_id": session_id}, {"_id": 0})
    if not cart:
        raise HTTPException(status_code=404, detail="Varukorg hittades inte")

    found = False
    for i, existing in enumerate(cart["items"]):
        if existing["cart_item_id"] == cart_item_id:
            item_dict = item.model_dump()
            item_dict["cart_item_id"] = cart_item_id
            cart["items"][i] = item_dict
            found = True
            break

    if not found:
        raise HTTPException(status_code=404, detail="Artikel hittades inte i varukorgen")

    cart["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.carts.update_one({"session_id": session_id}, {"$set": cart})
    return cart

@router.delete("/{session_id}")
async def clear_cart(session_id: str):
    await db.carts.delete_one({"session_id": session_id})
    return {"message": "Varukorg tömd"}
