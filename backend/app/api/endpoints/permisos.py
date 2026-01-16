from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from app.api.endpoints.auth import get_current_user
from app.services.permisos import permisos_service

router = APIRouter()

@router.get("")
async def obtener_permisos(
    current_user: dict = Depends(get_current_user)
):
    """Obtener la configuración de permisos por rol"""
    try:
        permisos = permisos_service.obtener_permisos()
        return permisos
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("")
async def actualizar_permisos(
    permisos: Dict[str, Dict[str, bool]],
    current_user: dict = Depends(get_current_user)
):
    """Actualizar la configuración de permisos (solo administradores)"""
    from app.services.usuarios import usuario_service
    
    # Verificar que el usuario sea administrador
    user_id = current_user.get("oid") or current_user.get("sub")
    rol = usuario_service.obtener_rol_usuario(user_id)
    
    if rol != "Administrador":
        raise HTTPException(
            status_code=403,
            detail="Solo los administradores pueden modificar permisos"
        )
    
    try:
        resultado = permisos_service.actualizar_permisos(permisos, user_id)
        return resultado
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/restablecer-defecto")
async def restablecer_permisos_defecto(
    current_user: dict = Depends(get_current_user)
):
    """Restablecer permisos a valores por defecto (solo administradores)"""
    from app.services.usuarios import usuario_service
    
    # Verificar que el usuario sea administrador
    user_id = current_user.get("oid") or current_user.get("sub")
    rol = usuario_service.obtener_rol_usuario(user_id)
    
    if rol != "Administrador":
        raise HTTPException(
            status_code=403,
            detail="Solo los administradores pueden restablecer permisos"
        )
    
    try:
        resultado = permisos_service.restablecer_permisos_defecto(user_id)
        # Retornar solo los permisos en el formato esperado por el frontend
        return {"permisos": resultado.get("permisos", resultado)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
