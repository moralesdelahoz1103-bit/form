from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent.parent))

from schemas.usuario import Usuario, UsuarioUpdate
from services.usuarios import usuario_service
from api.endpoints.auth import get_current_user

router = APIRouter()

def verificar_es_administrador(current_user: dict):
    """Verificar que el usuario actual es administrador"""
    user_id = current_user.get("oid")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No se pudo verificar el usuario"
        )
    
    rol = usuario_service.obtener_rol_usuario(user_id)
    if rol != "Administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los administradores pueden realizar esta acción"
        )

@router.get("/", response_model=List[Usuario])
async def listar_usuarios(current_user: dict = Depends(get_current_user)):
    """Listar todos los usuarios del sistema"""
    usuarios = usuario_service.listar_usuarios()
    return usuarios

@router.put("/{usuario_id}/rol")
async def cambiar_rol_usuario(
    usuario_id: str,
    rol: str,
    current_user: dict = Depends(get_current_user)
):
    """Cambiar el rol de un usuario (solo administradores)"""
    verificar_es_administrador(current_user)
    
    # Validar rol
    roles_validos = ["Usuario", "Editor", "Administrador"]
    if rol not in roles_validos:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rol inválido. Roles válidos: {', '.join(roles_validos)}"
        )
    
    # Verificar que no es el último administrador
    if rol != "Administrador":
        usuarios = usuario_service.listar_usuarios()
        admins = [u for u in usuarios if u.get("rol") == "Administrador"]
        usuario_a_cambiar = next((u for u in usuarios if u.get("id") == usuario_id), None)
        
        if usuario_a_cambiar and usuario_a_cambiar.get("rol") == "Administrador" and len(admins) <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se puede cambiar el rol del último administrador"
            )
    
    usuario_actualizado = usuario_service.actualizar_usuario(usuario_id, rol=rol)
    
    if not usuario_actualizado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    return usuario_actualizado

@router.delete("/{usuario_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_usuario(
    usuario_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Eliminar un usuario del sistema (solo administradores)"""
    verificar_es_administrador(current_user)
    
    # No permitir eliminar el último administrador
    usuarios = usuario_service.listar_usuarios()
    admins = [u for u in usuarios if u.get("rol") == "Administrador"]
    
    usuario_a_eliminar = next((u for u in usuarios if u.get("id") == usuario_id), None)
    if not usuario_a_eliminar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    if usuario_a_eliminar.get("rol") == "Administrador" and len(admins) <= 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede eliminar el último administrador"
        )
    
    usuario_service.eliminar_usuario(usuario_id)
    return None
