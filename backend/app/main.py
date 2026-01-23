from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import sys
from pathlib import Path
import os

# Añadir el directorio padre al path
sys.path.append(str(Path(__file__).parent))

from api.endpoints import sesiones, asistentes, auth, usuarios, permisos, ayuda, proxy
from core.config import settings

# Crear directorio de datos
os.makedirs("data", exist_ok=True)

# Inicializar FastAPI
app = FastAPI(
    title="Sistema de Registro de Capacitaciones",
    description="API para gestionar capacitaciones y registrar asistencia",
    version="2.0.0"
)

# Rate limiting - configuración más permisiva
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per minute", "50 per second"]
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS - Configuración segura solo con orígenes específicos
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        settings.FRONTEND_URL,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Incluir routers
app.include_router(sesiones.router)
app.include_router(asistentes.router)
app.include_router(auth.router)
app.include_router(usuarios.router, prefix="/api/usuarios", tags=["usuarios"])
app.include_router(permisos.router, prefix="/api/permisos", tags=["permisos"])
app.include_router(ayuda.router, prefix="/api/ayuda", tags=["ayuda"])
app.include_router(proxy.router)

# Servir archivos estáticos (uploads: QR y firmas)
from fastapi.staticfiles import StaticFiles
import pathlib
uploads_path = pathlib.Path(__file__).parent.parent / "uploads"
uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")

# Health check
@app.get("/api/health")
async def health_check():
    storage_mode = settings.STORAGE_MODE
    return {
        "status": "ok", 
        "version": "2.0.0",
        "storage": storage_mode
    }

# Root
@app.get("/")
async def root():
    return {
        "message": "Sistema de Registro de Capacitaciones API",
        "docs": "/docs",
        "health": "/api/health"
    }

# Error handler global
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Error interno del servidor",
            "error": str(exc)
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=True
    )
