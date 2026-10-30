# Ronak Furniture — shop, orders & inventory

A full-stack website for a made-to-order furniture shop:

- **Storefront** — product catalogue by category, search/sort, product detail pages, selection cart, order request checkout.
- **Admin panel** (JWT login) — dashboard, order management with status updates, product & **price editing**, inventory with stock adjustments and a movement log, and an editor for the website text (hero, about, contact, footer).

**Stack:** FastAPI + SQLAlchemy + PostgreSQL (backend) · React 19 + Vite + Motion (frontend, Apple-style design system: translucent nav, springs, system typography, light/dark, reduced-motion support).

---

## Quick start

Requirements: Docker, Python 3.11+, Node 20+.

```bash
# 1. one-time: create the Python environment
python3 -m venv backend/.venv
backend/.venv/bin/pip install -r backend/requirements.txt

# 2. start everything (Postgres container + API + web)
./dev.sh
```

Then open **http://localhost:5173** (shop) and **http://localhost:8000/docs** (API docs).

Running it manually instead:

```bash
docker start ronak-shop-db                 # or: docker run -d --name ronak-shop-db ... (see dev.sh)
cd backend && ./.venv/bin/uvicorn app.main:app --port 8000 --reload
cd frontend && npm run dev                 # second terminal
```

The database schema is created and demo data (7 categories, 15 products, default site content) is seeded automatically on first API start.

## Admin login

| | |
|---|---|
| URL | http://localhost:5173/admin/login |
| Username | `admin` |
| Password | `admin123` |

Change both in `backend/.env` (`ADMIN_USERNAME`, `ADMIN_PASSWORD`) — the seeded account is only created if it doesn't exist yet, so also change the password from **Website & account → Account security** after first sign-in. Change `JWT_SECRET` too.

## Configuration — `backend/.env`

```
DATABASE_URL=postgresql+psycopg://ronak:ronak_shop_2026@localhost:5432/ronak_shop
JWT_SECRET=change-this-secret-in-production
JWT_EXPIRE_MINUTES=720
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

## How orders work

1. Customer adds pieces to a selection and submits **Place order request** with name, phone and address.
2. The order gets a number (`RNK-00001`, `RNK-00002`, …), the chosen quantity is **reserved from stock**, and a movement row is logged.
3. The shop calls the customer to confirm price, stock and delivery date (payment is offline).
4. In admin → Orders you move it through: `pending → confirmed → in_production → ready → out_for_delivery → delivered`, adding a note at each step. **Cancelling releases the stock back**; reinstating a cancelled order re-reserves it (blocked if stock ran out).
5. Order status is managed by the admin; customers get the confirmation call instead of a tracking page.

## Images

**Admins can upload photos directly** — in Products → New/Edit product (and Website settings →
Hero image) there's an **Upload image** button next to the URL field. The backend resizes the
photo into the same responsive WebP sizes the seeded photos use and stores it in
`frontend/public/img/uploads/`. Max 15 MB; JPG, PNG or WebP accepted. The URL field still works
for pasting external images.

All product photos are served from your own domain as responsive WebP in `frontend/public/img/`
(`<photo-id>-<width>.webp` at 20 / 480 / 800 / 1200 / 1800 px):

- `frontend/src/lib/picture.js` builds `srcset` + `sizes` from any of those paths, plus a tiny 20px
  blur placeholder shown while the image decodes. Product cards pick ~5–25KB instead of ~110KB.
- The homepage hero loads `fetchpriority="high"` and picks the 800px file on phones (20KB).
- Admin image fields still accept **any URL** — external URLs simply fall back to a plain `<img src>`.
- To add a photo: drop `<id>-{20,480,800,1200,1800}.webp` into `frontend/public/img/`, then use
  `/img/<id>-800.webp` in the admin product form.

## Project layout

```
backend/
  app/main.py            FastAPI app, CORS, startup (create tables + seed)
  app/models.py          AdminUser, Category, Product, StockMovement, Order, OrderItem, OrderEvent, SiteSetting
  app/schemas.py         Pydantic request/response models
  app/security.py        bcrypt password hashing + JWT
  app/deps.py            admin auth dependency
  app/seed.py            demo categories/products/settings
  app/routers/
    auth.py              login, me, change-password
    catalog.py           public categories, products, product detail, site settings
    orders.py            create order (stock reservation)
    admin.py             products, categories, orders, inventory, site editor, dashboard stats
frontend/
  src/styles.css         design system (tokens, materials, components, dark mode, a11y media queries)
  src/context/StoreContext.jsx   site content, cart, admin session
  src/components/        NavBar, Footer, CartDrawer, ProductCard, Reveal, StatusPill, ToastHost
  src/pages/             Home, Products, ProductDetail, Checkout, Track, NotFound
  src/pages/admin/       AdminLogin, AdminLayout, Dashboard, Orders, Products, Inventory, Settings
dev.sh                   starts Postgres + API + web for development
```

## API overview

| Method & path | Who | Purpose |
|---|---|---|
| `POST /api/auth/login` | public | get JWT |
| `GET /api/categories`, `GET /api/products`, `GET /api/products/{slug}`, `GET /api/site` | public | storefront |
| `POST /api/orders` | public | place an order (reserves stock) |
| `GET /api/admin/stats` | admin | dashboard |
| `GET/POST/PATCH/DELETE /api/admin/products` | admin | catalogue & prices |
| `POST /api/admin/upload` | admin | photo upload → responsive WebP |
| `GET/POST/PATCH/DELETE /api/admin/categories` | admin | categories |
| `GET /api/admin/orders`, `PATCH /api/admin/orders/{no}/status` | admin | order management |
| `GET /api/admin/inventory`, `POST /api/admin/inventory/{id}/adjust`, `GET /api/admin/stock-movements` | admin | inventory |
| `GET/PUT /api/admin/site` | admin | website content |
| `POST /api/auth/change-password` | admin | account security |

## Production build

```bash
cd frontend && npm run build      # output in frontend/dist
cd backend && ./.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Serve `frontend/dist` with any static host (or nginx) and point its `/api` proxy at the FastAPI process; set real `CORS_ORIGINS`, a strong `JWT_SECRET`, and a managed Postgres `DATABASE_URL`.
