from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent.parent))

from schemas.sesion import SesionCreate, SesionResponse, SesionPublicResponse
from services import sesiones as sesion_service
from services import asistentes as asistente_service
from core.security import get_current_user

router = APIRouter(prefix="/api/sesiones", tags=["sesiones"])

@router.post("", response_model=SesionResponse, status_code=status.HTTP_201_CREATED)
async def crear_sesion(sesion: SesionCreate, current_user: dict = Depends(get_current_user)):
    """
    Crear nueva capacitación (requiere autenticación en producción)
    """
    try:
        data = sesion.dict()
        # Si se seleccionó 'Otros' y se especificó un valor personalizado, usarlo
        if data.get('tipo_actividad') == 'Otros' and data.get('tipo_actividad_custom'):
            data['tipo_actividad'] = data.pop('tipo_actividad_custom')

        data['created_by'] = current_user.get('email')
        nueva_sesion = sesion_service.crear_sesion(data)
        nueva_sesion['total_asistentes'] = 0
        return nueva_sesion
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

@router.get("", response_model=List[SesionResponse])
async def listar_sesiones(current_user: dict = Depends(get_current_user)):
    """
    Listar todas las capacitaciones (requiere autenticación en producción)
    """
    sesiones = sesion_service.get_all_sesiones(owner_email=current_user.get('email'))
    
    # Añadir conteo de asistentes
    for sesion in sesiones:
        asistentes = asistente_service.get_asistentes_by_sesion(sesion['id'])
        sesion['total_asistentes'] = len(asistentes)
    
    return sesiones

@router.get("/{sesion_id}", response_model=SesionResponse)
async def obtener_sesion(sesion_id: str, current_user: dict = Depends(get_current_user)):
    """
    Obtener detalles de una capacitación (requiere autenticación en producción)
    """
    sesion = sesion_service.get_sesion_by_id(sesion_id)
    if not sesion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesión no encontrada")
    # Verificar que el usuario actual es el creador
    if sesion.get('created_by') and sesion.get('created_by') != current_user.get('email'):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado")
    asistentes = asistente_service.get_asistentes_by_sesion(sesion_id)
    sesion['total_asistentes'] = len(asistentes)
    
    return sesion

@router.delete("/{sesion_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_sesion(sesion_id: str, current_user: dict = Depends(get_current_user)):
    """
    Eliminar capacitación y todos sus asistentes (requiere autenticación en producción)
    """
    # Obtener asistentes para eliminar sus firmas
    asistentes = asistente_service.get_asistentes_by_sesion(sesion_id)
    
    # Eliminar asistentes
    asistente_service.delete_asistentes_by_sesion(sesion_id)
    
    # Eliminar sesión
    # Verificar propiedad antes de eliminar
    sesion = sesion_service.get_sesion_by_id(sesion_id)
    if not sesion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesión no encontrada")
    if sesion.get('created_by') and sesion.get('created_by') != current_user.get('email'):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado")

    deleted = sesion_service.delete_sesion(sesion_id)
    
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesión no encontrada")

@router.get("/{sesion_id}/asistentes")
async def obtener_asistentes(sesion_id: str):
    """
    Obtener lista de asistentes de una capacitación (requiere autenticación en producción)
    """
    sesion = sesion_service.get_sesion_by_id(sesion_id)
    if not sesion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesión no encontrada")
    
    asistentes = asistente_service.get_asistentes_by_sesion(sesion_id)
    return asistentes
