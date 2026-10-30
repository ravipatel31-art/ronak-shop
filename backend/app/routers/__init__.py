from .admin import router as admin_router
from .auth import router as auth_router
from .catalog import router as catalog_router
from .enquiries import router as enquiries_router
from .orders import router as orders_router


__all__ = ["admin_router", "auth_router", "catalog_router", "enquiries_router", "orders_router"]
