from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent.parent))

from schemas.sesion import SesionCreate, SesionUpdate, SesionResponse, SesionPublicResponse
from services import sesiones as sesion_service
from services import asistentes as asistente_service
from services.usuarios import usuario_service
from core.security import get_current_user

router = APIRouter(prefix="/api/sesiones", tags=["sesiones"])

@router.post("", response_model=SesionResponse, status_code=status.HTTP_201_CREATED)
async def crear_sesion(sesion: SesionCreate, current_user: dict = Depends(get_current_user)):
    """
    Crear nueva capacitación (requiere autenticación en producción)
    """
    user_id = current_user.get('oid')
    sesion_creada = False
    contador_incrementado = False
    
    try:
        data = sesion.dict()
        # Si se seleccionó 'Otros' y se especificó un valor personalizado, usarlo
        if data.get('tipo_actividad') == 'Otros' and data.get('tipo_actividad_custom'):
            data['tipo_actividad'] = data.pop('tipo_actividad_custom')

        data['created_by'] = current_user.get('email')
        data['created_by_id'] = user_id  # Guardar también el ID para facilitar conteo
        
        # Crear la sesión
        nueva_sesion = sesion_service.crear_sesion(data)
        nueva_sesion['total_asistentes'] = 0
        sesion_creada = True
        
        # Incrementar contador de formularios del usuario
        if user_id:
            try:
                usuario_service.incrementar_formularios_creados(user_id)
                contador_incrementado = True
            except Exception as e:
                # Si falla el incremento, eliminar la sesión creada
                if sesion_creada:
                    try:
                        sesion_service.delete_sesion(nueva_sesion['id'])
                    except:
                        pass  # Log pero no fallar
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Error al actualizar contador de formularios: {str(e)}"
                )
        
        return nueva_sesion
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        # Si algo falló, limpiar
        if sesion_creada and contador_incrementado and user_id:
            try:
                usuario_service.decrementar_formularios_creados(user_id)
            except:
                pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error inesperado al crear la sesión: {str(e)}"
        )

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

@router.put("/{sesion_id}", response_model=SesionResponse)
async def actualizar_sesion(sesion_id: str, sesion_update: SesionUpdate, current_user: dict = Depends(get_current_user)):
    """
    Actualizar información de una capacitación (requiere autenticación)
    """
    # Obtener sesión existente
    sesion = sesion_service.get_sesion_by_id(sesion_id)
    if not sesion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesión no encontrada")
    
    # Verificar que el usuario actual es el creador
    if sesion.get('created_by') and sesion.get('created_by') != current_user.get('email'):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado")
    
    try:
        # Preparar datos de actualización
        datos_actualizacion = sesion_update.dict(exclude_unset=True)
        
        # Si se seleccionó 'Otros' y se especificó un valor personalizado, usarlo
        if datos_actualizacion.get('tipo_actividad') == 'Otros' and datos_actualizacion.get('tipo_actividad_custom'):
            datos_actualizacion['tipo_actividad'] = datos_actualizacion.pop('tipo_actividad_custom')
        
        # Actualizar sesión
        sesion_actualizada = sesion_service.actualizar_sesion(sesion_id, datos_actualizacion)
        
        # Añadir conteo de asistentes
        asistentes = asistente_service.get_asistentes_by_sesion(sesion_id)
        sesion_actualizada['total_asistentes'] = len(asistentes)
        
        return sesion_actualizada
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{sesion_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_sesion(sesion_id: str, current_user: dict = Depends(get_current_user)):
    """
    Eliminar capacitación y todos sus asistentes (requiere autenticación en producción)
    """
    # Verificar propiedad antes de eliminar
    sesion = sesion_service.get_sesion_by_id(sesion_id)
    if not sesion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesión no encontrada")
    if sesion.get('created_by') and sesion.get('created_by') != current_user.get('email'):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado")
    
    # Variables para control de errores
    sesion_eliminada = False
    contador_decrementado = False
    errores = []
    
    try:
        # 1. Decrementar contador PRIMERO (antes de cualquier eliminación)
        # Así si falla algo después, el contador ya está correcto
        user_id = current_user.get('oid')
        if user_id:
            try:
                usuario_service.decrementar_formularios_creados(user_id)
                contador_decrementado = True
            except Exception as e:
                errores.append(f"Error al decrementar contador: {str(e)}")
        
        # 2. Eliminar asistentes
        try:
            asistente_service.delete_asistentes_by_sesion(sesion_id)
        except Exception as e:
            errores.append(f"Error al eliminar asistentes: {str(e)}")
        
        # 3. Eliminar sesión
        try:
            deleted = sesion_service.delete_sesion(sesion_id)
            if deleted:
                sesion_eliminada = True
            else:
                errores.append("No se pudo eliminar la sesión")
        except Exception as e:
            errores.append(f"Error al eliminar sesión: {str(e)}")
        
        # Si la sesión no se eliminó pero el contador sí se decrementó, revertir
        if not sesion_eliminada and contador_decrementado and user_id:
            try:
                usuario_service.incrementar_formularios_creados(user_id)
            except:
                pass  # Si falla la reversión, al menos intentamos
        
        # Si hubo errores críticos, reportar
        if not sesion_eliminada:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al eliminar la sesión: {'; '.join(errores)}"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        # Error inesperado - intentar revertir contador si fue decrementado
        if contador_decrementado and user_id:
            try:
                usuario_service.incrementar_formularios_creados(user_id)
            except:
                pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error inesperado al eliminar la sesión: {str(e)}"
        )

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
