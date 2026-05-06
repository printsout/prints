"""Public product routes."""
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from database import db
from models import Product

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("/", response_model=List[Product])
@router.get("", response_model=List[Product])
async def get_products(category: Optional[str] = None):
    query = {"hidden": {"$ne": True}}
    if category:
        query["category"] = {"$regex": f"^{category}$", "$options": "i"}
    products = await db.products.find(query, {"_id": 0}).to_list(100)
    return products

@router.get("/categories")
async def get_categories():
    """Build categories dynamically from non-hidden products in DB."""
    products = await db.products.find(
        {"category": {"$ne": "foretag"}, "hidden": {"$ne": True}},
        {"_id": 0, "category": 1, "images": 1}
    ).to_list(1000)

    # Pick first image per category as thumbnail
    category_image = {}
    category_counts = {}
    for p in products:
        cat = p.get("category", "").strip().lower()
        if not cat:
            continue
        category_counts[cat] = category_counts.get(cat, 0) + 1
        if cat not in category_image:
            imgs = p.get("images") or []
            if imgs:
                category_image[cat] = imgs[0]

    CATEGORY_NAMES = {
        "mugg": "Muggar", "tshirt": "T-shirts", "hoodie": "Hoodies",
        "poster": "Posters", "mobilskal": "Mobilskal", "tygkasse": "Tygkassar",
        "kalender": "Kalendrar", "namnskylt": "Namnlappar", "fotoalbum": "Fotoalbum",
    }

    categories = []
    for cat_id in sorted(category_counts.keys()):
        name = CATEGORY_NAMES.get(cat_id, cat_id.capitalize())
        categories.append({
            "id": cat_id,
            "name": name,
            "image": category_image.get(cat_id, ""),
        })

    return categories

@router.get("/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not product or product.get("hidden"):
        raise HTTPException(status_code=404, detail="Produkt hittades inte")
    return Product(**product)
