from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from app.api.endpoints.auth import get_current_user
from app.services.ayuda import ayuda_service

router = APIRouter()

@router.get("")
async def obtener_ayuda(
    current_user: dict = Depends(get_current_user)
):
    """Obtener el contenido completo del centro de ayuda"""
    try:
        ayuda = ayuda_service.obtener_ayuda()
        return ayuda
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("")
async def actualizar_ayuda(
    categorias: List[Dict[str, Any]],
    current_user: dict = Depends(get_current_user)
):
    """Actualizar el contenido del centro de ayuda (solo administradores)"""
    from app.services.usuarios import usuario_service
    
    # Verificar que el usuario sea administrador
    user_id = current_user.get("oid") or current_user.get("sub")
    rol = usuario_service.obtener_rol_usuario(user_id)
    
    if rol != "Administrador":
        raise HTTPException(
            status_code=403,
            detail="Solo los administradores pueden modificar el centro de ayuda"
        )
    
    try:
        resultado = ayuda_service.actualizar_ayuda(categorias, user_id)
        return resultado
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
