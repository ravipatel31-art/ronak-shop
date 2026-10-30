from __future__ import annotations

import re

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Order, OrderEvent, OrderItem, Product, StockMovement
from ..schemas import OrderCreateIn, OrderOut

router = APIRouter(prefix="/api", tags=["orders"])

ORDER_STATUSES = [
    "pending",
    "confirmed",
    "in_production",
    "ready",
    "out_for_delivery",
    "delivered",
    "cancelled",
]

STATUS_LABELS = {
    "pending": "Order received",
    "confirmed": "Confirmed",
    "in_production": "In production",
    "ready": "Ready for dispatch",
    "out_for_delivery": "Out for delivery",
    "delivered": "Delivered",
    "cancelled": "Cancelled",
}


def order_to_out(order: Order) -> dict:
    data = OrderOut.model_validate(order).model_dump()
    data["status_label"] = STATUS_LABELS.get(order.status, order.status)
    data["timeline"] = [
        {
            "status": e.status,
            "label": STATUS_LABELS.get(e.status, e.status),
            "note": e.note,
            "created_at": e.created_at.isoformat(),
        }
        for e in order.events
    ]
    return data


@router.post("/orders", status_code=status.HTTP_201_CREATED)
def create_order(payload: OrderCreateIn, db: Session = Depends(get_db)) -> dict:
    if not payload.address.strip():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Delivery address is required")

    # validate & lock products
    lines: list[tuple[Product, int]] = []
    for item in payload.items:
        product = (
            db.query(Product)
            .filter(Product.id == item.product_id, Product.is_active.is_(True))
            .with_for_update()
            .first()
        )
        if product is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "A product in your order no longer exists")
        if product.stock < item.quantity:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                f"Only {product.stock} in stock for “{product.name}”",
            )
        lines.append((product, item.quantity))

    # merge duplicate product lines
    merged: dict[int, tuple[Product, int]] = {}
    for product, qty in lines:
        _, current_qty = merged.get(product.id, (product, 0))
        merged[product.id] = (product, current_qty + qty)

    # reserve the row id up front so the human-readable order number exists on insert
    new_id = int(db.execute(text("SELECT nextval('orders_id_seq')")).scalar_one())
    order = Order(
        id=new_id,
        order_number=f"RNK-{new_id:05d}",
        customer_name=payload.customer_name.strip(),
        phone=payload.phone.strip(),
        email=payload.email.strip(),
        address=payload.address.strip(),
        city=payload.city.strip(),
        notes=payload.notes.strip(),
        delivery_fee=max(0.0, payload.delivery_fee),
        discount=max(0.0, payload.discount),
        status="pending",
    )
    db.add(order)
    db.flush()
    subtotal = 0.0
    for product, qty in merged.values():
        subtotal += product.price * qty
        db.add(
            OrderItem(
                order=order,
                product_id=product.id,
                product_name=product.name,
                product_image=product.image_url,
                unit_price=product.price,
                quantity=qty,
            )
        )
        product.stock -= qty
        db.add(
            StockMovement(
                product=product,
                change=-qty,
                stock_after=product.stock,
                reason="Reserved for order",
                order_number=order.order_number,
            )
        )

    order.subtotal = round(subtotal, 2)
    order.total = round(max(0.0, subtotal - order.discount + order.delivery_fee), 2)
    db.add(
        OrderEvent(
            order=order,
            status="pending",
            note="Order request received. We will call you to confirm the details.",
        )
    )
    db.commit()
    db.refresh(order)
    order = (
        db.query(Order).options(joinedload(Order.items), joinedload(Order.events)).filter(Order.id == order.id).first()
    )
    return order_to_out(order)
