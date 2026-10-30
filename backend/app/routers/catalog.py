from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Category, Product, SiteSetting

router = APIRouter(prefix="/api", tags=["catalog"])

DEFAULT_SETTINGS = {
    "shop_name": "Ronak Furniture",
    "tagline": "Handcrafted furniture, built for your home",
    "hero_title": "Furniture made to measure for the way you live",
    "hero_subtitle": (
        "Tell us how you use your space — we design, build and deliver the piece, "
        "then keep you posted at every step."
    ),
    "hero_image": "/img/1586023492125-27b2c045efd7-1800.webp",
    "about_title": "Built in our workshop, not a warehouse",
    "about_body": (
        "Every order starts with your requirement — size, wood, finish, budget. "
        "Our carpenters build it to order, quality-check it, and deliver it with "
        "installation. Premium hardwoods, marine-grade ply, 1-year warranty."
    ),
    "phone": "+91 98765 43210",
    "email": "hello@ronakfurniture.in",
    "address": "Shop 12, Main Road, Your City",
    "hours": "Mon – Sat · 10:00 AM – 8:00 PM",
    "showroom_note": "Free design consultation & measurement at your home",
    "footer_text": "© 2026 Ronak Furniture. Handcrafted to order.",
    "instagram": "https://instagram.com/",
    "whatsapp": "https://wa.me/919876543210",
    "delivery_note": "Free delivery within 30 km · Installation included",
}


def get_site_settings(db: Session) -> dict[str, str]:
    values = dict(DEFAULT_SETTINGS)
    for row in db.query(SiteSetting).all():
        values[row.key] = row.value
    return values


@router.get("/categories")
def list_categories(db: Session = Depends(get_db)) -> list[dict]:
    rows = db.query(Category).order_by(Category.sort_order, Category.name).all()
    out = []
    for c in rows:
        active_count = (
            db.query(Product).filter(Product.category_id == c.id, Product.is_active.is_(True)).count()
        )
        out.append(
            {
                "id": c.id,
                "name": c.name,
                "slug": c.slug,
                "description": c.description,
                "sort_order": c.sort_order,
                "product_count": active_count,
            }
        )
    return out


@router.get("/products")
def list_products(
    db: Session = Depends(get_db),
    category: str | None = None,
    search: str | None = None,
    featured: bool | None = None,
    in_stock: bool | None = None,
    sort: str = "featured",
    page: int = Query(1, ge=1),
    page_size: int = Query(24, ge=1, le=100),
) -> dict:
    q = db.query(Product).options(joinedload(Product.category)).filter(Product.is_active.is_(True))
    if category:
        q = q.join(Category).filter(or_(Category.slug == category, Category.name == category))
    if search:
        like = f"%{search.strip()}%"
        q = q.filter(or_(Product.name.ilike(like), Product.description.ilike(like), Product.materials.ilike(like)))
    if featured is not None:
        q = q.filter(Product.is_featured.is_(featured))
    if in_stock:
        q = q.filter(Product.stock > 0)

    if sort == "price_asc":
        q = q.order_by(Product.price.asc())
    elif sort == "price_desc":
        q = q.order_by(Product.price.desc())
    elif sort == "newest":
        q = q.order_by(Product.created_at.desc())
    else:
        q = q.order_by(Product.sort_order.asc(), Product.is_featured.desc(), Product.id.asc())

    total = q.count()
    items = q.offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": [ProductPublicOut(p) for p in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": max(1, -(-total // page_size)),
    }


def ProductPublicOut(p: Product) -> dict:
    return {
        "id": p.id,
        "name": p.name,
        "slug": p.slug,
        "category": p.category.name if p.category else None,
        "category_slug": p.category.slug if p.category else None,
        "description": p.description,
        "materials": p.materials,
        "dimensions": p.dimensions,
        "warranty": p.warranty,
        "price": p.price,
        "compare_price": p.compare_price,
        "image_url": p.image_url,
        "gallery": p.gallery_list,
        "stock": p.stock,
        "in_stock": p.stock > 0,
        "low_stock": 0 < p.stock <= p.low_stock_threshold,
        "lead_time_days": p.lead_time_days,
        "is_featured": p.is_featured,
    }


@router.get("/products/{slug}")
def get_product(slug: str, db: Session = Depends(get_db)) -> dict:
    p = (
        db.query(Product)
        .options(joinedload(Product.category))
        .filter(Product.slug == slug, Product.is_active.is_(True))
        .first()
    )
    if p is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")
    data = ProductPublicOut(p)
    related = (
        db.query(Product)
        .options(joinedload(Product.category))
        .filter(
            Product.is_active.is_(True),
            Product.id != p.id,
            Product.category_id == p.category_id,
        )
        .limit(4)
        .all()
    )
    data["related"] = [ProductPublicOut(r) for r in related]
    return data


@router.get("/site")
def site(db: Session = Depends(get_db)) -> dict[str, str]:
    return get_site_settings(db)
