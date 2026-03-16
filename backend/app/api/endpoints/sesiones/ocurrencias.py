from fastapi import APIRouter, HTTPException, status, Depends
from schemas.sesion import OcurrenciaResponse, OcurrenciaCreate, OcurrenciaUpdate
from services import sesiones as sesion_service
from core.security import get_current_user

router = APIRouter()

@router.post("/{sesion_id}/ocurrencias", response_model=OcurrenciaResponse, status_code=status.HTTP_201_CREATED)
async def agregar_ocurrencia(sesion_id: str, ocurrencia: OcurrenciaCreate, current_user: dict = Depends(get_current_user)):
    try:
        return sesion_service.agregar_ocurrencia(sesion_id, **ocurrencia.dict())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/{sesion_id}/ocurrencias/{ocurrencia_id}", response_model=OcurrenciaResponse)
async def actualizar_ocurrencia(sesion_id: str, ocurrencia_id: str, data: OcurrenciaUpdate, current_user: dict = Depends(get_current_user)):
    try:
        return sesion_service.actualizar_ocurrencia(sesion_id, ocurrencia_id, data.dict(exclude_unset=True))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{sesion_id}/ocurrencias/{ocurrencia_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_ocurrencia(sesion_id: str, ocurrencia_id: str, current_user: dict = Depends(get_current_user)):
    if sesion_service.eliminar_ocurrencia(sesion_id, ocurrencia_id):
        return
    raise HTTPException(status_code=404, detail="Ocurrencia no encontrada")
