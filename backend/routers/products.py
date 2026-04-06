"""Public product routes."""
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from database import db
from models import Product

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("/", response_model=List[Product])
@router.get("", response_model=List[Product])
async def get_products(category: Optional[str] = None):
    query = {}
    if category:
        query["category"] = category
    products = await db.products.find(query, {"_id": 0}).to_list(100)
    return products

@router.get("/categories")
async def get_categories():
    return [
        {"id": "mugg", "name": "Muggar", "image": "https://images.unsplash.com/photo-1627807461786-081fc0e1215c?w=400"},
        {"id": "tshirt", "name": "T-shirts", "image": "https://images.unsplash.com/photo-1593733926335-bdec7f12acfd?w=400"},
        {"id": "hoodie", "name": "Hoodies", "image": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400"},
        {"id": "poster", "name": "Posters", "image": "https://images.unsplash.com/photo-1571164860029-856acbc24b4a?w=400"},
        {"id": "mobilskal", "name": "Mobilskal", "image": "https://static.prod-images.emergentagent.com/jobs/cd68a842-19ed-45bc-a36c-2389ae41c63e/images/85a45f02a7e9178632d56b673ee19b1c5ee40cbb0d3c4c37dd4c5ea35eaaf2e4.png"},
        {"id": "tygkasse", "name": "Tygkassar", "image": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400"},
        {"id": "kalender", "name": "Kalendrar", "image": "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400"},
        {"id": "namnskylt", "name": "Namnlappar", "image": "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400"},
        {"id": "fotoalbum", "name": "Fotoalbum", "image": "https://images.unsplash.com/photo-1694022861804-840f61c1c452?w=400"}
    ]

@router.get("/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Produkt hittades inte")
    return Product(**product)
