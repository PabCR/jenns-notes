# API route handlers
from app.routes.resources import router as resources_router
from app.routes.objects import router as objects_router

__all__ = ["resources_router", "objects_router"]

