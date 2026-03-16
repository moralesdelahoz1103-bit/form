from fastapi import APIRouter, HTTPException, Response
from services import sesiones as sesion_service

router = APIRouter()

@router.get("/{sesion_id}/asistentes")
async def obtener_asistentes(sesion_id: str, ocurrencia_id: str = None):
    from services import asistentes as asistente_service
    asistentes = asistente_service.get_asistentes_by_sesion(sesion_id)
    if ocurrencia_id:
        return [a for a in asistentes if a.get('ocurrencia_id') == ocurrencia_id]
    
    sesion = sesion_service.get_sesion_by_id(sesion_id)
    primera_oc_id = sesion['ocurrencias'][0]['id'] if sesion.get('ocurrencias') else None
    return [a for a in asistentes if not a.get('ocurrencia_id') or a.get('ocurrencia_id') == primera_oc_id]

@router.get("/{sesion_id}/qr")
async def obtener_qr_sesion(sesion_id: str):
    sesion = sesion_service.get_sesion_by_id(sesion_id)
    if not sesion: raise HTTPException(status_code=404, detail="Sesión no encontrada")
    qr_bytes = sesion_service.generar_qr_dinamico(sesion['link'])
    return Response(content=qr_bytes, media_type="image/png")

@router.get("/{sesion_id}/ocurrencias/{ocurrencia_id}/qr")
async def obtener_qr_ocurrencia(sesion_id: str, ocurrencia_id: str):
    sesion = sesion_service.get_sesion_by_id(sesion_id)
    oc = next((o for o in sesion.get('ocurrencias', []) if o['id'] == ocurrencia_id), None)
    if not oc: raise HTTPException(status_code=404, detail="Ocurrencia no encontrada")
    qr_bytes = sesion_service.generar_qr_dinamico(oc['link'])
    return Response(content=qr_bytes, media_type="image/png")
