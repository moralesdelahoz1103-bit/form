from fastapi import APIRouter
from .main import router as main_router
from .ocurrencias import router as ocurrencias_router
from .media import router as media_router

router = APIRouter(prefix="/api/sesiones", tags=["sesiones"])

# Incluir todas las sub-rutas
router.include_router(main_router)
router.include_router(ocurrencias_router)
router.include_router(media_router)
