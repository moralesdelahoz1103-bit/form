import uuid
from datetime import timedelta
from core.config import settings
from .utils import get_colombia_now

def generar_ocurrencia_dict(
    fecha: str,
    hora_inicio: str = None,
    hora_fin: str = None,
    **kwargs
) -> dict:
    """Generar una ocurrencia siguiendo el modelo de herencia."""
    token = uuid.uuid4().hex[:8].upper()
    now_col = get_colombia_now()
    expiry = (now_col + timedelta(days=settings.TOKEN_EXPIRY_DAYS)).isoformat()
    link = f"{settings.FRONTEND_URL}/registro?token={token}"
    
    oc = {
        "id": str(uuid.uuid4()),
        "fecha": fecha,
        "hora_inicio": hora_inicio,
        "hora_fin": hora_fin,
        "token": token,
        "link": link,
        "token_active": True,
        "token_expiry": expiry,
        "created_at": now_col.isoformat(),
        "total_asistentes": 0
    }
    
    # Añadir campos de herencia si se proporcionan (solo si son diferentes a la madre se guardan como valor)
    # Nota: la lógica de "si es diferente" se maneja en el servicio principal antes de llamar aquí 
    # o mediante kwarg explícitamente filtrados.
    campos_herencia = [
        'facilitador_entidad', 'tipo_actividad', 'contenido', 
        'actividad', 'dirigido_a', 'modalidad', 'responsable', 
        'cargo_responsable', 'tema', 'actividad_custom'
    ]
    for campo in campos_herencia:
        if campo in kwargs:
            oc[campo] = kwargs[campo]
            
    return oc

def resolver_herencia(sesion: dict) -> dict:
    """Resuelve la herencia para todas las ocurrencias de una sesión."""
    campos_herencia = [
        'facilitador_entidad', 'tipo_actividad', 'contenido', 
        'actividad', 'dirigido_a', 'modalidad', 'responsable', 
        'cargo_responsable', 'tema', 'actividad_custom'
    ]
    if not sesion.get('ocurrencias'):
        return sesion
        
    for oc in sesion['ocurrencias']:
        for campo in campos_herencia:
            if oc.get(campo) is None:
                oc[campo] = sesion.get(campo)
    return sesion

def inyectar_primera_oc(sesion: dict) -> dict:
    """Inyecta datos de la primera ocurrencia en la raíz para el frontend."""
    if sesion.get('ocurrencias') and len(sesion['ocurrencias']) > 0:
        oc = sesion['ocurrencias'][0]
        campos_vitales = ['token', 'link', 'token_active', 'token_expiry', 'fecha', 'hora_inicio', 'hora_fin']
        for campo in campos_vitales:
            if campo in oc:
                sesion[campo] = oc[campo]
        
        campos_herencia = [
            'facilitador_entidad', 'tipo_actividad', 'contenido', 
            'actividad', 'dirigido_a', 'modalidad', 'responsable', 
            'cargo_responsable', 'tema', 'actividad_custom'
        ]
        for campo in campos_herencia:
            if oc.get(campo) is not None:
                sesion[campo] = oc[campo]
    return sesion
