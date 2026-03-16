from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from schemas.sesion import SesionResponse, SesionCreate, SesionUpdate
from services import sesiones as sesion_service
from services.usuarios import usuario_service
from core.security import get_current_user

router = APIRouter()

@router.post("/", response_model=SesionResponse, status_code=status.HTTP_201_CREATED)
async def crear_sesion(sesion: SesionCreate, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get('oid')
    try:
        data = sesion.dict()
        if data.get('actividad') == 'Otros (eventos)' and data.get('actividad_custom'):
            data['actividad'] = data.pop('actividad_custom')
        else:
            data.pop('actividad_custom', None)

        data['created_by'] = current_user.get('email')
        data['created_by_id'] = user_id
        data['created_by_name'] = current_user.get('name')
        
        nueva_sesion = sesion_service.crear_sesion(data)
        if user_id:
            usuario_service.incrementar_formularios_creados(user_id)
        return nueva_sesion
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[SesionResponse])
async def listar_sesiones(current_user: dict = Depends(get_current_user)):
    user_email = current_user.get('email')
    user_oid = current_user.get('oid') or current_user.get('sub')
    try:
        rol = usuario_service.obtener_rol_usuario(user_oid)
        if rol == "Administrador":
            return sesion_service.get_sesiones_para_admin(user_email)
        return sesion_service.get_all_sesiones(owner_email=user_email)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{sesion_id}", response_model=SesionResponse)
async def obtener_sesion(sesion_id: str, current_user: dict = Depends(get_current_user)):
    sesion = sesion_service.get_sesion_by_id(sesion_id)
    if not sesion: raise HTTPException(status_code=404, detail="Sesión no encontrada")
    return sesion

@router.put("/{sesion_id}", response_model=SesionResponse)
async def actualizar_sesion(sesion_id: str, sesion_update: SesionUpdate, current_user: dict = Depends(get_current_user)):
    try:
        return sesion_service.actualizar_sesion(sesion_id, sesion_update.dict(exclude_preset=True))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{sesion_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_sesion(sesion_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get('oid')
    if sesion_service.delete_sesion(sesion_id):
        if user_id: usuario_service.decrementar_formularios_creados(user_id)
        return
    raise HTTPException(status_code=404, detail="No se pudo eliminar")
