import json
import os
from typing import List, Dict, Any
from pathlib import Path
import sys

# Añadir el directorio padre al path
sys.path.append(str(Path(__file__).parent.parent))

from core.config import settings
from services.asistentes import load_asistentes
from services.sesiones import load_sesiones

# Importar cliente CosmosDB
try:
    from db.cosmos_client import cosmos_db
    COSMOS_AVAILABLE = cosmos_db is not None
except:
    COSMOS_AVAILABLE = False
    cosmos_db = None

def obtener_resumen_participantes(user_email: str = None) -> List[Dict[str, Any]]:
    """
    Obtiene una lista de asistentes únicos con su conteo de participaciones.
    """
    personas = []
    sesiones = []
    
    if settings.STORAGE_MODE == "cosmosdb" and COSMOS_AVAILABLE:
        # En el nuevo modelo, los asistentes YA están agrupados por persona
        query = "SELECT c.id as cedula, c.nombre, c.correo, c.cargo, c.unidad, c.empresa, c.telefono, c.asistencias FROM c"
        personas = list(cosmos_db.asistentes_container.query_items(
            query=query,
            enable_cross_partition_query=True
        ))
        sesiones = cosmos_db.listar_sesiones()
    else:
        # Fallback para JSON (sin cambios en estructura interna del archivo por ahora)
        asistentes_raw = load_asistentes()
        sesiones = load_sesiones()
        # Simular duplicados si fuera necesario, pero mantenemos lógica previa para no romper JSON
        return obtener_resumen_participantes_json(asistentes_raw, sesiones, user_email)

    valid_sesion_ids = None
    if user_email:
        valid_sesion_ids = {s['id'] for s in sesiones if s.get('created_by') == user_email}

    resumen = []
    for p in personas:
        # Filtrar asistencias válidas
        asistencias = p.get('asistencias', [])
        if valid_sesion_ids is not None:
            asistencias = [a for a in asistencias if a.get('actividad_id') in valid_sesion_ids or a.get('sesion_id') in valid_sesion_ids]
        
        if not asistencias:
            continue

        # FILTRO: Solo personal de la fundación o empresas aliadas (identificados por tener unidad o empresa)
        if not p.get('unidad') and not p.get('empresa'):
            continue

        resumen.append({
            "cedula": p.get('cedula'),
            "nombre": p.get('nombre', 'Sin nombre'),
            "correo": p.get('correo', 'N/A'),
            "cargo": p.get('cargo', 'N/A'),
            "unidad": p.get('unidad') or p.get('empresa') or 'N/A',
            "empresa": p.get('empresa'),
            "telefono": p.get('telefono'),
            "total_asistencias": len(asistencias),
            "ultima_asistencia": max([a.get('fecha_registro', '') for a in asistencias]) if asistencias else ''
        })

    return resumen

def obtener_resumen_participantes_json(asistentes, sesiones, user_email):
    # (Lógica original de agrupación para modo JSON si se requiere mantener compatibilidad)
    valid_sesion_ids = None
    if user_email:
        valid_sesion_ids = {s['id'] for s in sesiones if s.get('created_by') == user_email}
    resumen = {}
    for a in asistentes:
        if valid_sesion_ids is not None and a.get('actividad_id') not in valid_sesion_ids and a.get('sesion_id') not in valid_sesion_ids: continue
        if not a.get('unidad'): continue
        cedula = a.get('cedula')
        if not cedula: continue
        if cedula not in resumen:
            resumen[cedula] = {
                "cedula": cedula, "nombre": a.get('nombre', 'Sin nombre'),
                "correo": a.get('correo', 'N/A'), "cargo": a.get('cargo', 'N/A'),
                "unidad": a.get('unidad') or a.get('empresa') or 'N/A',
                "empresa": a.get('empresa'), "telefono": a.get('telefono'),
                "total_asistencias": 0, "ultima_asistencia": a.get('fecha_registro', '')
            }
        resumen[cedula]["total_asistencias"] += 1
        if a.get('fecha_registro', '') > resumen[cedula]["ultima_asistencia"]:
            resumen[cedula]["ultima_asistencia"] = a.get('fecha_registro')
    return list(resumen.values())

def obtener_detalle_participante(cedula: str, user_email: str = None) -> Dict[str, Any]:
    """
    Obtiene el historial detallado de actividades de un participante por su cédula.
    """
    persona = None
    todas_sesiones = []

    if settings.STORAGE_MODE == "cosmosdb" and COSMOS_AVAILABLE:
        persona = cosmos_db.asistentes.obtener_por_cedula(cedula)
        todas_sesiones = cosmos_db.listar_sesiones()
    else:
        asistentes = load_asistentes()
        asistentes_match = [a for a in asistentes if a.get('cedula') == cedula]
        todas_sesiones = load_sesiones()
        if asistentes_match:
            persona = {
                "id": cedula, "nombre": asistentes_match[0].get('nombre'),
                "cargo": asistentes_match[0].get('cargo'), "correo": asistentes_match[0].get('correo'),
                "asistencias": [{"actividad_id": am.get('actividad_id'), "sesion_id": am.get('sesion_id'), "fecha_registro": am.get('fecha_registro')} for am in asistentes_match]
            }

    if not persona:
        return {"cedula": cedula, "nombre": "No encontrado", "historial": []}

    sesiones_map = {s['id']: s for s in todas_sesiones}
    if user_email:
        valid_sesion_ids = {s['id'] for s in todas_sesiones if s.get('created_by') == user_email}
        persona['asistencias'] = [a for a in persona.get('asistencias', []) if a.get('actividad_id') in valid_sesion_ids]

    historial = []
    for am in persona.get('asistencias', []):
        act_id = am.get('actividad_id')
        ses_id = am.get('sesion_id')
        sesion_info = sesiones_map.get(act_id, {})
        tema, facilitador, modalidad, fecha, h1, h2 = sesion_info.get('tema', 'Desconocido'), sesion_info.get('facilitador_entidad', 'N/A'), sesion_info.get('modalidad', 'Presencial'), sesion_info.get('fecha', 'N/A'), sesion_info.get('hora_inicio', 'N/A'), sesion_info.get('hora_fin', 'N/A')
        
        ocurrencias = sesion_info.get('ocurrencias', [])
        sesion_nro = None
        if len(ocurrencias) > 0:
            if ses_id == act_id: sesion_nro = 1
            else:
                for idx, oc in enumerate(ocurrencias):
                    if oc['id'] == ses_id:
                        tema, facilitador, modalidad, fecha, h1, h2 = oc.get('tema') or tema, oc.get('facilitador_entidad') or facilitador, oc.get('modalidad') or modalidad, oc.get('fecha') or fecha, oc.get('hora_inicio') or h1, oc.get('hora_fin') or h2
                        sesion_nro = idx + 1
                        break

        historial.append({
            "sesion_id": ses_id, "tema": tema, "fecha_registro": am.get('fecha_registro'),
            "fecha_actividad": fecha, "hora_inicio": h1, "hora_fin": h2, "sesion_nro": sesion_nro,
            "actividad": sesion_info.get('actividad', 'N/A'), "modalidad": modalidad,
            "tipo_actividad": sesion_info.get('tipo_actividad', 'Interno'),
            "dirigido_a": sesion_info.get('dirigido_a', 'N/A'),
            "facilitador_entidad": facilitador, "responsable": sesion_info.get('responsable', 'N/A')
        })

    historial.sort(key=lambda x: x.get('fecha_registro', ''), reverse=True)
    return {"cedula": cedula, "nombre": persona.get('nombre', 'Desconocido'), "cargo": persona.get('cargo', 'N/A'), "correo": persona.get('correo', 'N/A'), "historial": historial}

def obtener_reporte_completo() -> List[Dict[str, Any]]:
    """
    Obtiene un reporte consolidado usando la estructura agrupada (JOIN).
    """
    asistentes_planos = []
    todas_sesiones = []

    if settings.STORAGE_MODE == "cosmosdb" and COSMOS_AVAILABLE:
        # Traer todos los registros de asistencia mediante JOIN
        query = """
        SELECT 
            c.id as cedula, c.nombre, c.cargo as cargo_asistente, c.unidad, c.empresa, c.telefono, c.correo,
            a.actividad_id, a.sesion_id, a.fecha_registro
        FROM c
        JOIN a IN c.asistencias
        """
        asistentes_planos = list(cosmos_db.asistentes_container.query_items(
            query=query,
            enable_cross_partition_query=True
        ))
        todas_sesiones = cosmos_db.listar_sesiones()
    else:
        asistentes_planos = load_asistentes()
        todas_sesiones = load_sesiones()

    sesiones_map = {s['id']: s for s in todas_sesiones}
    
    reporte = []
    for a in asistentes_planos:
        act_id = a.get('actividad_id')
        ses_id = a.get('sesion_id')
        sesion_info = sesiones_map.get(act_id, {})
        
        # Datos base de la sesión (metadatos)
        tema = sesion_info.get('tema', 'Desconocido')
        facilitador_entidad = sesion_info.get('facilitador_entidad', 'N/A')
        modalidad = sesion_info.get('modalidad', 'Presencial')
        actividad = sesion_info.get('actividad', 'N/A')
        tipo_actividad = sesion_info.get('tipo_actividad', 'Interno')
        dirigido_a = sesion_info.get('dirigido_a', 'N/A')
        responsable = sesion_info.get('responsable', 'N/A')
        cargo_responsable = sesion_info.get('cargo_responsable', 'N/A')
        fecha_actividad = sesion_info.get('fecha', 'N/A')
        hora_inicio = sesion_info.get('hora_inicio', 'N/A')
        hora_fin = sesion_info.get('hora_fin', 'N/A')
        
        ocurrencias = sesion_info.get('ocurrencias', [])
        
        sesion_nro = "Única"
        if len(ocurrencias) > 0:
            if ses_id == act_id:
                sesion_nro = "1"
            else:
                sesion_nro = "Desconocida"
                for idx, oc in enumerate(ocurrencias):
                    if oc['id'] == ses_id:
                        sesion_nro = f"{idx + 1}"
                        tema = oc.get('tema') or tema
                        facilitador_entidad = oc.get('facilitador_entidad') or facilitador_entidad
                        modalidad = oc.get('modalidad') or modalidad
                        fecha_actividad = oc.get('fecha') or fecha_actividad
                        hora_inicio = oc.get('hora_inicio') or hora_inicio
                        hora_fin = oc.get('hora_fin') or hora_fin
                        tipo_actividad = oc.get('tipo_actividad') or tipo_actividad
                        dirigido_a = oc.get('dirigido_a') or dirigido_a
                        break

        reporte.append({
            "tema": tema,
            "sesion_nro": sesion_nro,
            "facilitador_entidad": facilitador_entidad,
            "modalidad": modalidad,
            "actividad": actividad,
            "tipo_actividad": tipo_actividad,
            "dirigido_a": dirigido_a,
            "responsable": responsable,
            "cargo_responsable": cargo_responsable,
            "fecha": fecha_actividad,
            "hora_inicio": hora_inicio,
            "hora_fin": hora_fin,
            "asistente": a.get('nombre', 'Anónimo'),
            "cedula": a.get('cedula', 'N/A'),
            "cargo_asistente": a.get('cargo_asistente', 'N/A'),
            "unidad": a.get('unidad') or a.get('empresa') or 'N/A',
            "correo": a.get('correo', 'N/A'),
            "fecha_registro": a.get('fecha_registro')
        })

    return reporte
