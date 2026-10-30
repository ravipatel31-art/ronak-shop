from __future__ import annotations

import datetime as dt
import io
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from PIL import Image, ImageOps
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..deps import get_current_admin
from ..models import AdminUser, Category, Order, OrderEvent, Product, SiteSetting, StockMovement
from ..routers.auth import slugify
from ..routers.catalog import DEFAULT_SETTINGS, get_site_settings
from ..routers.orders import ORDER_STATUSES, order_to_out
from ..schemas import (
    CategoryIn,
    OrderOut,
    OrderStatusIn,
    ProductIn,
    ProductOut,
    SiteSettingsIn,
    SiteSettingsOut,
    StatsOut,
    StockAdjustIn,
    StockMovementOut,
)

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(get_current_admin)])


def unique_slug(db: Session, base: str, exclude_id: int | None = None) -> str:
    root = slugify(base)
    slug, i = root, 2
    while True:
        q = db.query(Product).filter(Product.slug == slug)
        if exclude_id:
            q = q.filter(Product.id != exclude_id)
        if q.first() is None:
            return slug
        slug, i = f"{root}-{i}", i + 1


# ---------------- products ----------------
@router.get("/products", response_model=list[ProductOut])
def admin_products(db: Session = Depends(get_db), include_inactive: bool = True) -> list[Product]:
    q = db.query(Product).options(joinedload(Product.category)).order_by(Product.sort_order, Product.name)
    if not include_inactive:
        q = q.filter(Product.is_active.is_(True))
    return q.all()


@router.post("/products", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductIn, db: Session = Depends(get_db)) -> Product:
    if payload.category_id is not None and db.get(Category, payload.category_id) is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Category does not exist")
    slug = unique_slug(db, payload.slug or payload.name)
    product = Product(**payload.model_dump(exclude={"slug"}), slug=slug)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.patch("/products/{product_id}", response_model=ProductOut)
def update_product(product_id: int, payload: ProductIn, db: Session = Depends(get_db)) -> Product:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")
    if payload.category_id is not None and db.get(Category, payload.category_id) is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Category does not exist")
    data = payload.model_dump()
    requested_slug = data.pop("slug", None)
    for key, value in data.items():
        setattr(product, key, value)
    product.slug = unique_slug(db, requested_slug or product.slug, exclude_id=product.id)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/products/{product_id}")
def delete_product(product_id: int, hard: bool = False, db: Session = Depends(get_db)) -> dict:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")
    if hard:
        db.delete(product)
        db.commit()
        return {"ok": True, "message": "Product deleted"}
    product.is_active = False
    db.commit()
    return {"ok": True, "message": "Product hidden from the storefront"}


# ---------------- categories ----------------
@router.get("/categories")
def admin_categories(db: Session = Depends(get_db)) -> list[dict]:
    return [
        {"id": c.id, "name": c.name, "slug": c.slug, "description": c.description, "sort_order": c.sort_order}
        for c in db.query(Category).order_by(Category.sort_order, Category.name).all()
    ]


@router.post("/categories", status_code=status.HTTP_201_CREATED)
def create_category(payload: CategoryIn, db: Session = Depends(get_db)) -> dict:
    slug = slugify(payload.slug or payload.name)
    if db.query(Category).filter(Category.slug == slug).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Category already exists")
    category = Category(
        name=payload.name.strip(),
        slug=slug,
        description=payload.description,
        sort_order=payload.sort_order,
    )
    db.add(category)
    db.commit()
    return {"id": category.id, "name": category.name, "slug": category.slug}


@router.patch("/categories/{category_id}")
def update_category(category_id: int, payload: CategoryIn, db: Session = Depends(get_db)) -> dict:
    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Category not found")
    category.name = payload.name.strip()
    category.slug = slugify(payload.slug or payload.name)
    category.description = payload.description
    category.sort_order = payload.sort_order
    db.commit()
    return {"id": category.id, "name": category.name, "slug": category.slug}


@router.delete("/categories/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db)) -> dict:
    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Category not found")
    for product in category.products:
        product.category_id = None
    db.delete(category)
    db.commit()
    return {"ok": True}


# ---------------- orders ----------------
@router.get("/orders")
def admin_orders(
    db: Session = Depends(get_db),
    status_filter: str | None = Query(None, alias="status"),
    search: str | None = None,
    limit: int = Query(200, ge=1, le=500),
) -> list[dict]:
    q = db.query(Order).options(joinedload(Order.items), joinedload(Order.events)).order_by(Order.created_at.desc())
    if status_filter:
        q = q.filter(Order.status == status_filter)
    if search:
        term = f"%{search.strip()}%"
        q = q.filter(Order.order_number.ilike(term) | Order.customer_name.ilike(term) | Order.phone.ilike(term))
    return [order_to_out(o) for o in q.limit(limit).all()]


@router.get("/orders/{order_number}")
def admin_order(order_number: str, db: Session = Depends(get_db)) -> dict:
    order = (
        db.query(Order)
        .options(joinedload(Order.items), joinedload(Order.events))
        .filter(Order.order_number == order_number.strip().upper())
        .first()
    )
    if order is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
    return order_to_out(order)


@router.patch("/orders/{order_number}/status")
def set_order_status(order_number: str, payload: OrderStatusIn, db: Session = Depends(get_db)) -> dict:
    if payload.status not in ORDER_STATUSES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Unknown status: {payload.status}")
    order = (
        db.query(Order)
        .options(joinedload(Order.items), joinedload(Order.events))
        .filter(Order.order_number == order_number.strip().upper())
        .first()
    )
    if order is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")

    previous = order.status
    if previous == payload.status:
        return order_to_out(order)

    # cancelling an active order releases the reserved stock back
    if payload.status == "cancelled" and previous != "cancelled":
        for item in order.items:
            if item.product_id is None:
                continue
            product = db.get(Product, item.product_id)
            if product is None:
                continue
            product.stock += item.quantity
            db.add(
                StockMovement(
                    product=product,
                    change=item.quantity,
                    stock_after=product.stock,
                    reason="Order cancelled – stock released",
                    order_number=order.order_number,
                )
            )
    # re-activating after a cancellation re-reserves stock
    if previous == "cancelled" and payload.status != "cancelled":
        for item in order.items:
            if item.product_id is None:
                continue
            product = db.get(Product, item.product_id)
            if product is None:
                continue
            if product.stock < item.quantity:
                raise HTTPException(
                    status.HTTP_409_CONFLICT,
                    f"Not enough stock to reinstate “{product.name}” ({product.stock} left)",
                )
            product.stock -= item.quantity
            db.add(
                StockMovement(
                    product=product,
                    change=-item.quantity,
                    stock_after=product.stock,
                    reason="Order reinstated – stock reserved",
                    order_number=order.order_number,
                )
            )

    order.status = payload.status
    db.add(OrderEvent(order=order, status=payload.status, note=payload.note.strip()))
    db.commit()
    db.refresh(order)
    return order_to_out(order)


# ---------------- inventory ----------------
@router.get("/inventory")
def inventory(db: Session = Depends(get_db)) -> list[dict]:
    products = db.query(Product).options(joinedload(Product.category)).order_by(Product.name).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "slug": p.slug,
            "image_url": p.image_url,
            "category": p.category.name if p.category else None,
            "price": p.price,
            "stock": p.stock,
            "low_stock_threshold": p.low_stock_threshold,
            "is_active": p.is_active,
            "low_stock": p.stock <= p.low_stock_threshold,
            "out_of_stock": p.stock <= 0,
        }
        for p in products
    ]


@router.post("/inventory/{product_id}/adjust", response_model=StockMovementOut)
def adjust_stock(product_id: int, payload: StockAdjustIn, db: Session = Depends(get_db)) -> StockMovement:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")
    if payload.change == 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Change must be non-zero")
    new_stock = product.stock + payload.change
    if new_stock < 0:
        raise HTTPException(status.HTTP_409_CONFLICT, "Stock cannot go below zero")
    product.stock = new_stock
    movement = StockMovement(
        product=product,
        change=payload.change,
        stock_after=new_stock,
        reason=payload.reason.strip() or "Manual adjustment",
    )
    db.add(movement)
    db.commit()
    db.refresh(movement)
    return movement


@router.get("/stock-movements", response_model=list[StockMovementOut])
def stock_movements(db: Session = Depends(get_db), limit: int = Query(100, ge=1, le=500)) -> list[StockMovement]:
    return (
        db.query(StockMovement)
        .options(joinedload(StockMovement.product))
        .order_by(StockMovement.created_at.desc())
        .limit(limit)
        .all()
    )


# ---------------- site settings ----------------
@router.get("/site", response_model=SiteSettingsOut)
def read_site(db: Session = Depends(get_db)) -> SiteSettingsOut:
    return SiteSettingsOut(settings=get_site_settings(db))


@router.put("/site", response_model=SiteSettingsOut)
def write_site(payload: SiteSettingsIn, db: Session = Depends(get_db)) -> SiteSettingsOut:
    for key, value in payload.settings.items():
        row = db.get(SiteSetting, key)
        if row is None:
            db.add(SiteSetting(key=key, value=value))
        else:
            row.value = value
        DEFAULT_SETTINGS.setdefault(key, "")
    db.commit()
    return SiteSettingsOut(settings=get_site_settings(db))


# ---------------- dashboard ----------------
@router.get("/stats", response_model=StatsOut)
def stats(db: Session = Depends(get_db)) -> StatsOut:
    now = dt.datetime.now(dt.timezone.utc)
    month_start = dt.datetime(now.year, now.month, 1, tzinfo=dt.timezone.utc)

    total_orders = db.query(func.count(Order.id)).scalar() or 0
    pending = db.query(func.count(Order.id)).filter(Order.status == "pending").scalar() or 0
    active = (
        db.query(func.count(Order.id))
        .filter(Order.status.in_([s for s in ORDER_STATUSES if s not in ("delivered", "cancelled")]))
        .scalar()
        or 0
    )
    delivered = db.query(func.count(Order.id)).filter(Order.status == "delivered").scalar() or 0
    revenue = (
        db.query(func.coalesce(func.sum(Order.total), 0.0))
        .filter(Order.status != "cancelled", Order.created_at >= month_start)
        .scalar()
        or 0.0
    )
    total_products = db.query(func.count(Product.id)).filter(Product.is_active.is_(True)).scalar() or 0
    low_stock = (
        db.query(func.count(Product.id))
        .filter(Product.is_active.is_(True), Product.stock <= Product.low_stock_threshold)
        .scalar()
        or 0
    )
    recent = (
        db.query(Order)
        .options(joinedload(Order.items), joinedload(Order.events))
        .order_by(Order.created_at.desc())
        .limit(6)
        .all()
    )
    return StatsOut(
        total_orders=total_orders,
        pending_orders=pending,
        active_orders=active,
        delivered_orders=delivered,
        total_products=total_products,
        low_stock_products=low_stock,
        revenue=float(revenue),
        recent_orders=[order_to_out(o) for o in recent],
    )


# ---------------- image upload ----------------
# Uploaded photos land in frontend/public/img/uploads (served by Vite in dev and
# copied into dist on build). We resize them into the same responsive WebP sizes
# the seeded photos use, so every image gets fast srcset loading for free.
UPLOAD_DIR = Path(__file__).resolve().parents[3] / "frontend" / "public" / "img" / "uploads"
UPLOAD_WIDTHS = [(20, 55), (480, 70), (800, 74), (1200, 76), (1800, 78)]
MAX_UPLOAD_BYTES = 15 * 1024 * 1024


@router.post("/upload")
async def upload_image(file: UploadFile = File(...)) -> dict:
    raw = await file.read()
    if not raw:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No file was received")
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "Image is too large (max 15 MB)")

    try:
        img = Image.open(io.BytesIO(raw))
        img.load()
    except Exception:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "That file is not a readable image — use JPG, PNG or WebP",
        )

    img = ImageOps.exif_transpose(img)  # respect the camera's orientation
    if img.mode in ("RGBA", "LA", "P"):
        img = img.convert("RGBA")
        background = Image.new("RGB", img.size, (255, 255, 255))
        background.paste(img, mask=img.split()[-1])
        img = background
    else:
        img = img.convert("RGB")

    name = uuid.uuid4().hex[:12]
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    for width, quality in UPLOAD_WIDTHS:
        w = min(width, img.width)
        h = max(1, round(img.height * w / img.width))
        img.resize((w, h), Image.Resampling.LANCZOS).save(
            UPLOAD_DIR / f"{name}-{width}.webp", "WEBP", quality=quality, method=6
        )

    return {"url": f"/img/uploads/{name}-800.webp"}
