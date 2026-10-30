from __future__ import annotations

import datetime as dt

from pydantic import BaseModel, ConfigDict, Field


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------- auth ----------
class LoginIn(BaseModel):
    username: str
    password: str


class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6)


class AdminOut(ORMModel):
    id: int
    username: str
    name: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AdminOut


# ---------- catalog ----------
class CategoryIn(BaseModel):
    name: str
    slug: str | None = None
    description: str = ""
    sort_order: int = 0


class CategoryOut(ORMModel):
    id: int
    name: str
    slug: str
    description: str
    sort_order: int


class ProductIn(BaseModel):
    name: str
    slug: str | None = None
    category_id: int | None = None
    description: str = ""
    materials: str = ""
    dimensions: str = ""
    warranty: str = "1 year warranty"
    price: float = 0
    compare_price: float | None = None
    image_url: str = ""
    gallery: str = ""
    stock: int = 0
    low_stock_threshold: int = 3
    lead_time_days: int = 7
    is_active: bool = True
    is_featured: bool = False
    sort_order: int = 0


class ProductOut(ORMModel):
    id: int
    name: str
    slug: str
    category_id: int | None
    category: CategoryOut | None = None
    description: str
    materials: str
    dimensions: str
    warranty: str
    price: float
    compare_price: float | None
    image_url: str
    gallery: str
    stock: int
    low_stock_threshold: int
    lead_time_days: int
    is_active: bool
    is_featured: bool
    sort_order: int
    created_at: dt.datetime
    updated_at: dt.datetime


class StockAdjustIn(BaseModel):
    change: int
    reason: str = "Manual adjustment"


class StockMovementOut(ORMModel):
    id: int
    product_id: int
    change: int
    stock_after: int
    reason: str
    order_number: str | None
    created_at: dt.datetime
    product: ProductOut | None = None


# ---------- orders ----------
class OrderItemIn(BaseModel):
    product_id: int
    quantity: int = Field(default=1, ge=1, le=100)


class OrderCreateIn(BaseModel):
    customer_name: str = Field(min_length=2, max_length=160)
    phone: str = Field(min_length=6, max_length=30)
    email: str = ""
    address: str = ""
    city: str = ""
    notes: str = ""
    items: list[OrderItemIn] = Field(min_length=1)
    delivery_fee: float = 0
    discount: float = 0


class OrderItemOut(ORMModel):
    id: int
    product_id: int | None
    product_name: str
    product_image: str
    unit_price: float
    quantity: int


class OrderEventOut(ORMModel):
    status: str
    note: str
    created_at: dt.datetime


class OrderOut(ORMModel):
    id: int
    order_number: str
    customer_name: str
    phone: str
    email: str
    address: str
    city: str
    notes: str
    status: str
    subtotal: float
    discount: float
    delivery_fee: float
    total: float
    created_at: dt.datetime
    updated_at: dt.datetime
    items: list[OrderItemOut] = []
    events: list[OrderEventOut] = []


class OrderStatusIn(BaseModel):
    status: str
    note: str = ""


class TrackQuery(BaseModel):
    order_number: str
    phone: str


# ---------- site settings ----------
class SiteSettingsOut(BaseModel):
    settings: dict[str, str]


class SiteSettingsIn(BaseModel):
    settings: dict[str, str]


# ---------- dashboard ----------
class EnquiryIn(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    email: str = Field(min_length=4, max_length=160)
    phone: str = ""
    category: str = ""
    message: str = Field(min_length=5)


class EnquiryOut(ORMModel):
    id: int
    name: str
    email: str
    phone: str
    category: str
    message: str
    created_at: dt.datetime


class StatsOut(BaseModel):
    total_orders: int
    pending_orders: int
    active_orders: int
    delivered_orders: int
    total_products: int
    low_stock_products: int
    revenue: float
    recent_orders: list[dict]
    total_enquiries: int = 0
