from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Dict, Any, Optional
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent.parent))

from services import seguimiento as seguimiento_service
from core.security import get_current_user

router = APIRouter(prefix="/api/seguimiento", tags=["seguimiento"])

@router.get("/participantes", response_model=List[Dict[str, Any]])
async def listar_resumen_participantes(
    user_email: Optional[str] = Query(None, description="Email del usuario para filtrar 'Mis actividades'"),
    current_user: dict = Depends(get_current_user)
    ):
    """
    Obtener un resumen de todos los participantes únicos y su conteo de asistencias.
    Requiere autenticación.
    """
    try:
        return seguimiento_service.obtener_resumen_participantes(user_email=user_email)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/participantes/{cedula}", response_model=Dict[str, Any])
async def obtener_detalle_participante(
    cedula: str,
    user_email: Optional[str] = Query(None, description="Email del usuario para filtrar 'Mis actividades'"),
    current_user: dict = Depends(get_current_user)
    ):
    """
    Obtener el historial detallado de un participante por su cédula.
    Requiere autenticación.
    """
    try:
        detalle = seguimiento_service.obtener_detalle_participante(cedula, user_email=user_email)
        if not detalle or not detalle.get('historial'):
            raise HTTPException(status_code=404, detail="Participante no encontrado o sin historial en este contexto")
        return detalle
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reporte-completo", response_model=List[Dict[str, Any]])
async def obtener_reporte_completo(current_user: dict = Depends(get_current_user)):
    """
    Obtener el reporte completo consolidado de asistencias y sesiones.
    Requiere autenticación.
    """
    try:
        return seguimiento_service.obtener_reporte_completo()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
