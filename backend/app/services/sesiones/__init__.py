from .crud import crear, list_all as listar, list_admin as get_sesiones_para_admin, get_by_id as get_sesion_by_id, delete as delete_sesion, increment_asistentes
from .utils import generar_qr_dinamico, get_colombia_now
from .recurrence import resolver_herencia, inyectar_primera_oc
from .crud import preparar_respuesta
from db.cosmos_client import cosmos_db
from core.config import settings
from core.exceptions import TokenNotFoundException, TokenExpiredException, TokenInactiveException
from datetime import datetime, timedelta
from .storage_json import load_sesiones, save_sesiones
from .recurrence import generar_ocurrencia_dict

# Re-exportar funciones para mantener compatibilidad
__all__ = [
    'crear_sesion', 'get_all_sesiones', 'get_sesiones_para_admin', 'get_sesion_by_id',
    'get_sesion_by_token', 'actualizar_sesion', 'agregar_ocurrencia', 'eliminar_ocurrencia',
    'actualizar_ocurrencia', 'delete_sesion', 'generar_qr_dinamico', 'increment_asistentes'
]

def crear_sesion(data): return crear(data)
def get_all_sesiones(owner=None, tipos=None): return listar(owner, tipos)

def get_sesion_by_token(token: str) -> dict:
    import time
    start_time = time.time()
    if settings.STORAGE_MODE == "cosmosdb" and cosmos_db:
        sesion = cosmos_db.obtener_sesion_por_token(token)
    else:
        sesion = next((s for s in load_sesiones() if any(oc.get('token') == token for oc in s.get('ocurrencias', []))), None)

    if not sesion: 
        print(f"❌ Token no encontrado: {token}")
        raise TokenNotFoundException()
    
    oc_match = next((oc for oc in sesion.get('ocurrencias', []) if oc.get('token') == token), None)
    if not oc_match: raise TokenNotFoundException()

    merged = {**sesion, **oc_match}
    merged['_actividad_id'] = sesion['id']
    # Resolver nulos por campos de la madre
    for k in ['tema', 'hora_inicio', 'hora_fin', 'facilitador_entidad', 'tipo_actividad', 'contenido', 'actividad', 'actividad_custom', 'dirigido_a', 'modalidad', 'responsable', 'cargo_responsable']:
        if oc_match.get(k) is None:
            merged[k] = sesion.get(k, '')
    
    merged['_ocurrencia_id'] = oc_match['id']
    if not merged.get('token_active', True): raise TokenInactiveException()
    
    # Fix date parsing: handle 'Z' suffix correctly
    token_expiry_raw = merged.get('token_expiry')
    if not isinstance(token_expiry_raw, str):
        print(f"⚠️ token_expiry no es string ({type(token_expiry_raw)}): {token_expiry_raw}")
        token_expiry_str = str(token_expiry_raw) if token_expiry_raw else ""
    else:
        token_expiry_str = token_expiry_raw

    if token_expiry_str.endswith('Z'):
        token_expiry_str = token_expiry_str.replace('Z', '+00:00')
    
    try:
        expiry = datetime.fromisoformat(token_expiry_str)
    except Exception as e:
        print(f"❌ Error al parsear fecha de expiración '{token_expiry_str}': {e}")
        # Si falla el parseo, asumimos que no ha expirado para evitar bloqueo total
        expiry = get_colombia_now() + timedelta(days=1)

    if get_colombia_now() > expiry: 
        print(f"❌ Token expirado: {token} (exp: {expiry})")
        raise TokenExpiredException()
    
    end_time = time.time()
    print(f"⏱️ get_sesion_by_token tardó {end_time - start_time:.4f}s")
    return merged

def actualizar_sesion(sesion_id: str, datos: dict) -> dict:
    now_col = get_colombia_now().isoformat()
    datos['updated_at'] = now_col
    campos_oc = ['fecha', 'hora_inicio', 'hora_fin', 'facilitador_entidad', 'tipo_actividad', 'contenido', 'actividad', 'actividad_custom', 'dirigido_a', 'modalidad', 'responsable', 'cargo_responsable', 'tema', 'token_active']
    
    if settings.STORAGE_MODE == "cosmosdb" and cosmos_db:
        actual = cosmos_db.obtener_sesion(sesion_id)
        if not actual: raise ValueError("Sesión no encontrada")
        actual.update(datos)
        if actual.get('ocurrencias'):
            oc = actual['ocurrencias'][0]
            for c in campos_oc:
                if c in datos:
                    val = datos[c]
                    oc[c] = None if c in ['facilitador_entidad', 'tipo_actividad', 'contenido', 'actividad', 'actividad_custom', 'dirigido_a', 'modalidad', 'responsable', 'cargo_responsable', 'tema'] and val == actual.get(c) else val
            oc['updated_at'] = now_col
        res = cosmos_db.actualizar_sesion(sesion_id, actual)
    else:
        sesiones = load_sesiones()
        match = next((s for s in sesiones if s['id'] == sesion_id), None)
        if not match: raise ValueError("Sesión no encontrada")
        match.update(datos)
        if match.get('ocurrencias'):
            oc = match['ocurrencias'][0]
            for c in campos_oc:
                if c in datos:
                    val = datos[c]
                    oc[c] = None if c in ['facilitador_entidad', 'tipo_actividad', 'contenido', 'actividad', 'actividad_custom', 'dirigido_a', 'modalidad', 'responsable', 'cargo_responsable', 'tema'] and val == match.get(c) else val
            oc['updated_at'] = now_col
        save_sesiones(sesiones)
        res = match
    return preparar_respuesta([res])[0]

def agregar_ocurrencia(sesion_id: str, **kwargs) -> dict:
    if settings.STORAGE_MODE == "cosmosdb" and cosmos_db:
        sesion = cosmos_db.obtener_sesion(sesion_id)
    else:
        sesion = next((s for s in load_sesiones() if s['id'] == sesion_id), None)
    if not sesion: raise ValueError("Sesión no encontrada")
    
    def clean(f, v): return None if v == sesion.get(f) else v
    nueva_oc = generar_ocurrencia_dict(
        fecha=kwargs.get('fecha'),
        hora_inicio=kwargs.get('hora_inicio'),
        hora_fin=kwargs.get('hora_fin'),
        **{c: clean(c, kwargs.get(c)) for c in ['facilitador_entidad', 'tipo_actividad', 'contenido', 'actividad', 'dirigido_a', 'modalidad', 'responsable', 'cargo_responsable', 'tema']}
    )
    
    if settings.STORAGE_MODE == "cosmosdb" and cosmos_db:
        sesion.setdefault('ocurrencias', []).append(nueva_oc)
        sesion['es_recurrente'] = True
        sesion['updated_at'] = get_colombia_now().isoformat()
        cosmos_db.actualizar_sesion(sesion_id, sesion)
    else:
        sesiones = load_sesiones()
        s = next((s for s in sesiones if s['id'] == sesion_id), None)
        s.setdefault('ocurrencias', []).append(nueva_oc)
        s['es_recurrente'] = True
        s['updated_at'] = get_colombia_now().isoformat()
        save_sesiones(sesiones)
    
    # Resolver herencia para respuesta
    for c in ['facilitador_entidad', 'tipo_actividad', 'contenido', 'actividad', 'dirigido_a', 'modalidad', 'responsable', 'cargo_responsable', 'tema']:
        if nueva_oc.get(c) is None: nueva_oc[c] = sesion.get(c)
    return nueva_oc

def eliminar_ocurrencia(sesion_id: str, oc_id: str) -> bool:
    from services.asistentes import delete_asistentes_by_sesion
    if settings.STORAGE_MODE == "cosmosdb" and cosmos_db:
        s = cosmos_db.obtener_sesion(sesion_id)
        if not s: return False
        
        orig_len = len(s.get('ocurrencias', []))
        s['ocurrencias'] = [o for o in s.get('ocurrencias', []) if o['id'] != oc_id]
        if len(s['ocurrencias']) == orig_len: return False
        
        # Eliminar asistentes de esta ocurrencia
        delete_asistentes_by_sesion(oc_id)
        
        s['updated_at'] = get_colombia_now().isoformat()
        cosmos_db.actualizar_sesion(sesion_id, s)
        return True
    else:
        sesiones = load_sesiones()
        s = next((s for s in sesiones if s['id'] == sesion_id), None)
        if not s: return False
        orig_len = len(s.get('ocurrencias', []))
        s['ocurrencias'] = [o for o in s.get('ocurrencias', []) if o['id'] != oc_id]
        if len(s['ocurrencias']) == orig_len: return False
        
        # Eliminar asistentes de esta ocurrencia
        delete_asistentes_by_sesion(oc_id)
        
        s['updated_at'] = get_colombia_now().isoformat()
        save_sesiones(sesiones)
        return True

def actualizar_ocurrencia(sesion_id: str, oc_id: str, data: dict) -> dict:
    if settings.STORAGE_MODE == "cosmosdb" and cosmos_db:
        s = cosmos_db.obtener_sesion(sesion_id)
    else:
        s = next((s for s in load_sesiones() if s['id'] == sesion_id), None)
    if not s: raise ValueError("Sesión no encontrada")
    
    oc = next((o for o in s.get('ocurrencias', []) if o['id'] == oc_id), None)
    if not oc: raise ValueError("Ocurrencia no encontrada")
    
    campos_herencia = ['facilitador_entidad', 'tipo_actividad', 'contenido', 'actividad', 'actividad_custom', 'dirigido_a', 'modalidad', 'responsable', 'cargo_responsable', 'tema']
    for k, v in data.items():
        if k in ['fecha', 'hora_inicio', 'hora_fin', 'token_active'] + campos_herencia:
            oc[k] = None if k in campos_herencia and v == s.get(k) else v
    
    if 'tema' in data: s['tema'] = data['tema']
    s['updated_at'] = get_colombia_now().isoformat()
    
    if settings.STORAGE_MODE == "cosmosdb" and cosmos_db:
        cosmos_db.actualizar_sesion(sesion_id, s)
    else:
        save_sesiones(load_sesiones()) # s ya está modificado en la lista si cargamos todas
        
    for c in campos_herencia:
        if oc.get(c) is None: oc[c] = s.get(c)
    return oc
