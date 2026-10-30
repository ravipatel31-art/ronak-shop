from __future__ import annotations

from sqlalchemy.orm import Session

from .config import get_settings
from .models import AdminUser, Category, Product, SiteSetting
from .routers.catalog import DEFAULT_SETTINGS
from .security import hash_password

# Served from frontend/public/img as responsive WebP: <id>-{20,480,800,1200,1800}.webp
IMG = "/img/{}-800.webp"

CATEGORIES = [
    ("Sofas", "sofas", "2-seat, 3-seat and L-shaped sofas, built to your size.", 1),
    ("Beds", "beds", "Engineered wood and solid wood beds with storage options.", 2),
    ("Dining", "dining", "Dining tables and chairs for 4 to 8 people.", 3),
    ("Chairs", "chairs", "Accent chairs, dining chairs and bar stools.", 4),
    ("Wardrobes", "wardrobes", "Sliding and hinged wardrobes with internal organisers.", 5),
    ("TV Units", "tv-units", "Wall-mounted and floor TV consoles with cable management.", 6),
    ("Storage", "storage", "Sideboards, cabinets and display units.", 7),
]

# (name, category slug, image id, price, compare price, stock, featured, materials,
#  dimensions, description, lead time, gallery ids)
PRODUCTS = [
    (
        "Delaney Velvet 3-Seater Sofa",
        "sofas",
        "1555041469-a586c61ea9bc",
        38500,
        44000,
        6,
        True,
        "Solid teak legs, high-density foam, velvet upholstery",
        'W 210 × D 88 × H 82 cm',
        "A deep-seated three seater with a slim teak frame and stain-resistant velvet. "
        "Cushions are reversible and the covers zip off for dry cleaning.",
        14,
        ["1616486338812-3dadae4b4ace", "1583847268964-b28dc8f51f92"],
    ),
    (
        "Marcel Leather 3-Seater Sofa",
        "sofas",
        "1540574163026-643ea20ade25",
        64000,
        None,
        3,
        True,
        "Full-grain aniline leather, kiln-dried hardwood frame",
        'W 224 × D 92 × H 80 cm',
        "Hand-stitched full-grain leather over a kiln-dried hardwood frame. "
        "It ages into a richer patina every year and sits on brushed brass legs.",
        21,
        ["1616627561950-9f746e330187", "1600121848594-d8644e57abab"],
    ),
    (
        "Amber Fabric Sofa",
        "sofas",
        "1567016432779-094069958ea5",
        34900,
        39900,
        8,
        False,
        "Removable cotton-blend covers, birch legs",
        'W 196 × D 86 × H 84 cm',
        "Bright, practical and machine-washable. The seat base uses sinuous springs "
        "so it keeps its shape through years of daily use.",
        12,
        ["1558211583-d26f610c1eb1"],
    ),
    (
        "Sunnyside 2-Seater Sofa",
        "sofas",
        "1558211583-d26f610c1eb1",
        29500,
        None,
        2,
        False,
        "Woven fabric, foam-filled cushions, oak-finish legs",
        'W 168 × D 84 × H 82 cm',
        "Compact two seater for apartments and study rooms. Light enough to move, "
        "sturdy enough for everyday seating.",
        10,
        ["1555041469-a586c61ea9bc"],
    ),
    (
        "Haven King Bed with Headboard",
        "beds",
        "1616627561950-9f746e330187",
        46000,
        52000,
        4,
        True,
        "Solid wood frame, upholstered padded headboard",
        'King: W 198 × L 213 cm',
        "A padded headboard you can actually lean on, with a slatted base that "
        "needs no mattress support. Available in walnut or natural oak finish.",
        16,
        ["1615874959474-d609969a20ed", "1522771739844-6a9f6d5f14af"],
    ),
    (
        "Willow Queen Bed",
        "beds",
        "1615874959474-d609969a20ed",
        38500,
        None,
        5,
        False,
        "Engineered wood with teak veneer",
        'Queen: W 168 × L 213 cm',
        "Clean lines and a low profile that makes small bedrooms feel taller. "
        "Includes headboard, footboard and a noise-free bolt assembly.",
        12,
        ["1522771739844-6a9f6d5f14af"],
    ),
    (
        "Astra Storage Bed",
        "beds",
        "1522771739844-6a9f6d5f14af",
        41500,
        45000,
        0,
        False,
        "Plywood box with hydraulic lift, matte laminate finish",
        'Queen: W 168 × L 213 cm',
        "Gas-lift storage under the entire mattress base — enough for two suitcases "
        "and a stack of bedding. Easy one-hand lift.",
        18,
        ["1616627561950-9f746e330187"],
    ),
    (
        "Cora 4-Seater Dining Set",
        "dining",
        "1519710164239-da123dc03ef4",
        34000,
        38500,
        5,
        True,
        "Solid ash top, powder-coated steel base, 4 chairs included",
        'Table: L 180 × W 90 × H 76 cm',
        "A round-edged ash table with four moulded chairs. Seats four comfortably, "
        "six when you pull the ends in.",
        15,
        ["1524758631624-e2822e304c36"],
    ),
    (
        "Elle Accent Armchair",
        "chairs",
        "1550226891-ef816aed4a98",
        16500,
        18900,
        9,
        True,
        "Wool-blend upholstery, beech legs",
        'W 74 × D 78 × H 86 cm',
        "The chair that finishes a corner. High back, firm lumbar support and a "
        "fabric that does not pill.",
        10,
        ["1611967164521-abae8fba4668"],
    ),
    (
        "Winston Solid Wood Chair",
        "chairs",
        "1506439773649-6e0eb8cfb237",
        6900,
        None,
        20,
        False,
        "Solid sheesham wood, hand-waxed finish",
        'W 45 × D 50 × H 92 cm',
        "A traditional ladder-back chair in sheesham, joinery fitted by hand. "
        "Sold individually — buy four for a dining set.",
        8,
        [],
    ),
    (
        "Contour Molded Chair",
        "chairs",
        "1517705008128-361805f42e86",
        7400,
        8500,
        14,
        False,
        "Molded seat, steel wire base",
        'W 48 × D 52 × H 83 cm',
        "Light, stackable and easy to wipe down — works at the dining table, "
        "the desk or the balcony.",
        7,
        [],
    ),
    (
        "Birch Bar Stool",
        "chairs",
        "1503602642458-232111445657",
        5200,
        None,
        18,
        False,
        "Solid birch, natural lacquer",
        'W 38 × D 38 × H 74 cm',
        "A counter-height stool with a footrest at the right height. "
        "Flat pack, assembles in five minutes.",
        6,
        [],
    ),
    (
        "Frame Sliding Wardrobe",
        "wardrobes",
        "1595428774223-ef52624120d2",
        58000,
        65000,
        3,
        True,
        "Engineered wood, soft-close sliding doors, mirror option",
        'W 240 × D 60 × H 240 cm',
        "Made to your wall width. Two sliding doors, six shelves, two hanging rails "
        "and a drawer unit. Installation included.",
        21,
        ["1618220179428-22790b461013"],
    ),
    (
        "Linea Wall-Mounted TV Unit",
        "tv-units",
        "1594026112284-02bb6f3352fe",
        24500,
        27500,
        7,
        True,
        "Engineered wood, soft-close drawers, cable cut-outs",
        'W 180 × D 40 × H 45 cm',
        "Floating console that keeps the floor clear and the wires hidden. "
        "Two drawers and an open bay for your set-top box.",
        12,
        ["1600121848594-d8644e57abab"],
    ),
    (
        "Terra Sideboard",
        "storage",
        "1618220179428-22790b461013",
        27800,
        None,
        4,
        False,
        "Solid wood frame, cane-front doors",
        'W 160 × D 42 × H 78 cm',
        "Cane-fronted doors that let remotes and routers breathe while hiding "
        "everything else. Works in the dining room or the hallway.",
        14,
        ["1616486338812-3dadae4b4ace"],
    ),
]


def seed(db: Session) -> None:
    settings = get_settings()

    if db.query(AdminUser).filter(AdminUser.username == settings.admin_username).first() is None:
        db.add(
            AdminUser(
                username=settings.admin_username,
                name=settings.admin_name,
                password_hash=hash_password(settings.admin_password),
            )
        )

    if db.query(Category).count() == 0:
        for name, slug, description, order in CATEGORIES:
            db.add(Category(name=name, slug=slug, description=description, sort_order=order))
        db.flush()

    if db.query(Product).count() == 0:
        by_slug = {c.slug: c.id for c in db.query(Category).all()}
        for i, (
            name,
            cat_slug,
            img_id,
            price,
            compare_price,
            stock,
            featured,
            materials,
            dimensions,
            description,
            lead_time,
            gallery,
        ) in enumerate(PRODUCTS, start=1):
            db.add(
                Product(
                    name=name,
                    slug=name.lower().replace(" ", "-").replace("/", "-"),
                    category_id=by_slug.get(cat_slug),
                    description=description,
                    materials=materials,
                    dimensions=dimensions,
                    warranty="1 year warranty · free installation",
                    price=float(price),
                    compare_price=float(compare_price) if compare_price else None,
                    image_url=IMG.format(img_id),
                    gallery="\n".join(IMG.format(g) for g in gallery),
                    stock=stock,
                    low_stock_threshold=3,
                    lead_time_days=lead_time,
                    is_active=True,
                    is_featured=featured,
                    sort_order=i,
                )
            )

    if db.query(SiteSetting).count() == 0:
        for key, value in DEFAULT_SETTINGS.items():
            db.add(SiteSetting(key=key, value=value))

    db.commit()
