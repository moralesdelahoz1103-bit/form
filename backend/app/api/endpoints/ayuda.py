from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from app.api.endpoints.auth import get_current_user
from app.services.ayuda import ayuda_service

router = APIRouter()

@router.get("")
async def obtener_ayuda(
    current_user: dict = Depends(get_current_user)
):
    """Obtener el contenido completo del centro de ayuda filtrado por rol del usuario"""
    from app.services.usuarios import usuario_service
    
    try:
        ayuda = ayuda_service.obtener_ayuda()
        
        # Obtener el rol del usuario actual
        user_id = current_user.get("oid") or current_user.get("sub")
        rol_usuario = usuario_service.obtener_rol_usuario(user_id)
        
        # Filtrar tarjetas según el rol del usuario
        if ayuda.get("categorias"):
            categorias_filtradas = []
            for categoria in ayuda["categorias"]:
                tarjetas_filtradas = []
                for tarjeta in categoria.get("tarjetas", []):
                    # Verificar si la tarjeta tiene roles_permitidos definidos
                    roles_permitidos = tarjeta.get("roles_permitidos", ["Usuario", "Administrador"])
                    
                    # Si el rol del usuario está en los roles permitidos, incluir la tarjeta
                    if rol_usuario in roles_permitidos and tarjeta.get("visible", True):
                        tarjetas_filtradas.append(tarjeta)
                
                # Solo incluir categorías que tengan al menos una tarjeta visible
                if tarjetas_filtradas:
                    categoria_filtrada = categoria.copy()
                    categoria_filtrada["tarjetas"] = tarjetas_filtradas
                    categorias_filtradas.append(categoria_filtrada)
            
            ayuda["categorias"] = categorias_filtradas
        
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
