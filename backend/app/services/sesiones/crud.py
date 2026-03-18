import uuid
from typing import List, Optional
from core.config import settings
from db.cosmos_client import cosmos_db
from .storage_json import load_sesiones, save_sesiones
from .utils import get_colombia_now
from .recurrence import generar_ocurrencia_dict, resolver_herencia, inyectar_primera_oc

COSMOS_AVAILABLE = cosmos_db is not None

def preparar_respuesta(sesiones: List[dict]) -> List[dict]:
    """Prepara las sesiones para la API (herencia e inyección)."""
    result = []
    for s in sesiones:
        s = inyectar_primera_oc(s)
        s = resolver_herencia(s)
        result.append(s)
    return result

def crear(sesion_data: dict) -> dict:
    sesion_id = str(uuid.uuid4())
    now_col = get_colombia_now().isoformat()
    
    campos_instancia = ['fecha', 'hora_inicio', 'hora_fin', 'token', 'link', 'token_active', 'token_expiry']
    root_data = {k: v for k, v in sesion_data.items() if k not in (campos_instancia + ['ocurrencias_programadas'])}
    
    nueva_sesion = {
        "id": sesion_id,
        "created_at": now_col,
        "updated_at": now_col,
        "ocurrencias": [],
        **root_data
    }
    
    def val_or_null(field, source):
        val = source.get(field)
        return val if val and val != root_data.get(field) else None

    # Primera ocurrencia
    primera_oc = generar_ocurrencia_dict(
        fecha=sesion_data.get('fecha'),
        hora_inicio=sesion_data.get('hora_inicio'),
        hora_fin=sesion_data.get('hora_fin'),
        **{c: val_or_null(c, sesion_data) for c in [
            'facilitador_entidad', 'tipo_actividad', 'contenido', 'actividad', 
            'dirigido_a', 'modalidad', 'responsable', 'cargo_responsable', 'tema', 'actividad_custom'
        ]}
    )
    nueva_sesion["ocurrencias"].append(primera_oc)
    
    # Ocurrencias adicionales
    for oc in sesion_data.get('ocurrencias_programadas', []):
        oc_data = oc if isinstance(oc, dict) else oc.dict()
        nueva_sesion["ocurrencias"].append(
            generar_ocurrencia_dict(
                fecha=oc_data.get('fecha'),
                hora_inicio=oc_data.get('hora_inicio'),
                hora_fin=oc_data.get('hora_fin'),
                **{c: val_or_null(c, oc_data) for c in [
                    'facilitador_entidad', 'tipo_actividad', 'contenido', 'actividad', 
                    'dirigido_a', 'modalidad', 'responsable', 'cargo_responsable', 'tema', 'actividad_custom'
                ]}
            )
        )
        
    if settings.STORAGE_MODE == "cosmosdb" and COSMOS_AVAILABLE:
        result = cosmos_db.crear_sesion(nueva_sesion)
    else:
        sesiones = load_sesiones()
        sesiones.append(nueva_sesion)
        save_sesiones(sesiones)
        result = nueva_sesion
        
    return preparar_respuesta([result])[0]

def list_all(owner_email: Optional[str] = None, tipos: Optional[List[str]] = None) -> List[dict]:
    if settings.STORAGE_MODE == "cosmosdb" and COSMOS_AVAILABLE:
        sesiones = cosmos_db.listar_sesiones(owner_email, tipos)
    else:
        sesiones = load_sesiones()
        if owner_email:
            sesiones = [s for s in sesiones if s.get('created_by') == owner_email]
        if tipos:
            sesiones = [s for s in sesiones if s.get('actividad') in tipos]
        sesiones.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    return preparar_respuesta(sesiones)

def list_admin(admin_email: str) -> List[dict]:
    if settings.STORAGE_MODE == "cosmosdb" and COSMOS_AVAILABLE:
        sesiones = cosmos_db.listar_sesiones_admin(admin_email)
    else:
        sesiones = load_sesiones()
        sesiones = [
            s for s in sesiones 
            if s.get('created_by') == admin_email or s.get('actividad') in ['Inducción', 'Actividad', 'Capacitación']
        ]
        sesiones.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    return preparar_respuesta(sesiones)

def get_by_id(sesion_id: str) -> Optional[dict]:
    if settings.STORAGE_MODE == "cosmosdb" and COSMOS_AVAILABLE:
        sesion = cosmos_db.obtener_sesion(sesion_id)
    else:
        sesion = next((s for s in load_sesiones() if s['id'] == sesion_id), None)
    return preparar_respuesta([sesion])[0] if sesion else None

def delete(sesion_id: str) -> bool:
    from storage import get_storage_adapter
    sesion = get_by_id(sesion_id)
    if not sesion: return False
    
    if settings.STORAGE_MODE == "cosmosdb" and COSMOS_AVAILABLE:
        # Limpiar por actividad_id = sesion_id (registros donde no hay ocurrencia específica)
        cosmos_db.eliminar_asistentes_por_sesion(sesion_id)
        # Limpiar también por cada ocurrencia individualmente (sesion_id = oc_id)
        for oc in sesion.get('ocurrencias', []):
            oc_id = oc.get('id')
            if oc_id:
                cosmos_db.eliminar_asistentes_por_sesion(oc_id)
        cosmos_db.eliminar_sesion(sesion_id)
    else:
        from services.asistentes import delete_asistentes_by_sesion
        delete_asistentes_by_sesion(sesion_id)
        
        sesiones = load_sesiones()
        new_sesiones = [s for s in sesiones if s['id'] != sesion_id]
        if len(new_sesiones) == len(sesiones): return False
        save_sesiones(new_sesiones)
        
    if settings.BLOB_STORAGE_MODE == "azure":
        storage = get_storage_adapter()
        if hasattr(storage, 'delete_training_folder'):
            storage.delete_training_folder(sesion.get('created_by', ''), sesion.get('tema', ''))
    return True

def increment_asistentes(sesion_id: str, ocurrencia_id: Optional[str] = None):
    """Incrementa el contador de asistentes de una sesión y/o ocurrencia específica"""
    if settings.STORAGE_MODE == "cosmosdb" and COSMOS_AVAILABLE:
        sesion = cosmos_db.obtener_sesion(sesion_id)
        if not sesion: return
        
        # Incrementar total global
        sesion['total_asistentes'] = sesion.get('total_asistentes', 0) + 1
        
        # Si hay ocurrencia_id, buscarla e incrementar
        encontrado = False
        if ocurrencia_id:
            for oc in sesion.get('ocurrencias', []):
                if oc.get('id') == ocurrencia_id:
                    oc['total_asistentes'] = oc.get('total_asistentes', 0) + 1
                    encontrado = True
                    break
                    
        # Si no se pasó ocurrencia_id o no se encontró (es la principal)
        if not encontrado:
            sesion['total_asistentes_principal'] = sesion.get('total_asistentes_principal', 0) + 1
            # También sincronizar la primera ocurrencia si existe (suelen ser lo mismo)
            if sesion.get('ocurrencias') and len(sesion['ocurrencias']) > 0:
                oc0 = sesion['ocurrencias'][0]
                oc0['total_asistentes'] = oc0.get('total_asistentes', 0) + 1
                    
        cosmos_db.actualizar_sesion(sesion_id, sesion)
    else:
        # Modo JSON
        sesiones = load_sesiones()
        for s in sesiones:
            if s['id'] == sesion_id:
                s['total_asistentes'] = s.get('total_asistentes', 0) + 1
                
                encontrado = False
                if ocurrencia_id:
                    for oc in s.get('ocurrencias', []):
                        if oc.get('id') == ocurrencia_id:
                            oc['total_asistentes'] = oc.get('total_asistentes', 0) + 1
                            encontrado = True
                            break
                
                if not encontrado:
                    s['total_asistentes_principal'] = s.get('total_asistentes_principal', 0) + 1
                    if s.get('ocurrencias') and len(s['ocurrencias']) > 0:
                        s['ocurrencias'][0]['total_asistentes'] = s['ocurrencias'][0].get('total_asistentes', 0) + 1
                        
                save_sesiones(sesiones)
                break
