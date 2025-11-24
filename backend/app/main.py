from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import sys
from pathlib import Path
import os

# Añadir el directorio padre al path
sys.path.append(str(Path(__file__).parent.parent))

from api.endpoints import sesiones, asistentes
from core.config import settings

# Crear directorios necesarios
os.makedirs("data", exist_ok=True)
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

# Inicializar FastAPI
app = FastAPI(
    title="Sistema de Registro de Capacitaciones",
    description="API para gestionar capacitaciones y registrar asistencia",
    version="1.0.0"
)

# Rate limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        settings.BASE_URL,
        "*"  # En producción, especificar dominios exactos
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(sesiones.router)
app.include_router(asistentes.router)

# Servir archivos estáticos (firmas) - usar ruta absoluta
uploads_path = os.path.join(os.path.dirname(__file__), "uploads")
app.mount("/uploads", StaticFiles(directory=uploads_path), name="uploads")

# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}

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
