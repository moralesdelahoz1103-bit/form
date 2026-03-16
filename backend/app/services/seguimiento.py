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
    Obtiene una lista de participantes únicos con su conteo de asistencias,
    filtrando únicamente por formaciones internas. Si user_email está presente,
    solo incluye asistencias a formaciones dictadas por ese facilitador.
    """
    asistentes = []
    sesiones = []
    
    if settings.STORAGE_MODE == "cosmosdb" and COSMOS_AVAILABLE:
        query = "SELECT c.cedula, c.nombre, c.correo, c.cargo, c.unidad, c.empresa, c.telefono, c.fecha_registro, c.sesion_id FROM c"
        asistentes = list(cosmos_db.asistentes_container.query_items(
            query=query,
            enable_cross_partition_query=True
        ))
        sesiones = cosmos_db.listar_sesiones()
    else:
        asistentes = load_asistentes()
        sesiones = load_sesiones()

    valid_sesion_ids = None
    if user_email:
        valid_sesion_ids = {s['id'] for s in sesiones if s.get('created_by') == user_email}

    # Agrupar por cédula, pero solo si es personal de la fundación (tienen unidad/dirección)
    resumen = {}
    for a in asistentes:
        if valid_sesion_ids is not None and a.get('sesion_id') not in valid_sesion_ids:
            continue

        # FILTRO: Solo personal de la fundación (identificados por tener el campo unidad/dirección)
        if not a.get('unidad'):
            continue

        cedula = a.get('cedula')
        if not cedula:
             continue
        
        if cedula not in resumen:
            resumen[cedula] = {
                "cedula": cedula,
                "nombre": a.get('nombre', 'Sin nombre'),
                "correo": a.get('correo', 'N/A'),
                "cargo": a.get('cargo', 'N/A'),
                "unidad": a.get('unidad') or a.get('empresa') or 'N/A',
                "empresa": a.get('empresa'),
                "telefono": a.get('telefono'),
                "total_asistencias": 0,
                "ultima_asistencia": a.get('fecha_registro', '')
            }
        
        resumen[cedula]["total_asistencias"] += 1
        # Actualizar fecha más reciente si aplica
        if a.get('fecha_registro', '') > resumen[cedula]["ultima_asistencia"]:
            resumen[cedula]["ultima_asistencia"] = a.get('fecha_registro')

    return list(resumen.values())

def obtener_detalle_participante(cedula: str, user_email: str = None) -> Dict[str, Any]:
    """
    Obtiene el historial detallado de actividades de un participante por su cédula.
    Si user_email está presente, solo devuelve el historial de actividades de ese usuario.
    """
    asistentes_match = []
    todas_sesiones = []

    if settings.STORAGE_MODE == "cosmosdb" and COSMOS_AVAILABLE:
        query = "SELECT * FROM c WHERE c.cedula = @cedula"
        parameters = [{"name": "@cedula", "value": cedula}]
        asistentes_match = list(cosmos_db.asistentes_container.query_items(
            query=query,
            parameters=parameters,
            enable_cross_partition_query=True
        ))
        # Traer sesiones para mapear nombres
        todas_sesiones = cosmos_db.listar_sesiones()
    else:
        asistentes = load_asistentes()
        asistentes_match = [a for a in asistentes if a.get('cedula') == cedula]
        todas_sesiones = load_sesiones()

    if user_email:
        valid_sesion_ids = {s['id'] for s in todas_sesiones if s.get('created_by') == user_email}
        asistentes_match = [am for am in asistentes_match if am.get('sesion_id') in valid_sesion_ids]

    # Mapear nombres de sesiones y temas
    sesiones_map = {s['id']: s for s in todas_sesiones}
    
    # Construir historial
    historial = []
    for am in asistentes_match:
        sid = am.get('sesion_id')
        sesion_info = sesiones_map.get(sid, {})
        
        # Si tiene ocurrencia_id, buscar el tema y facilitador específico
        tema = sesion_info.get('tema', 'Desconocido')
        facilitador_entidad = sesion_info.get('facilitador_entidad', 'N/A')
        modalidad = sesion_info.get('modalidad', 'Presencial')
        fecha_actividad = sesion_info.get('fecha', 'N/A')
        hora_inicio = sesion_info.get('hora_inicio', 'N/A')
        hora_fin = sesion_info.get('hora_fin', 'N/A')
        
        ocurrencias = sesion_info.get('ocurrencias', [])
        es_recurrente = len(ocurrencias) > 0
        sesion_nro = None
        
        oc_id = am.get('ocurrencia_id')
        if es_recurrente:
            if not oc_id:
                # Es la sesión principal (la primera)
                sesion_nro = 1
            else:
                # Buscar en qué posición de ocurrencias está
                for idx, oc in enumerate(ocurrencias):
                    if oc['id'] == oc_id:
                        tema = oc.get('tema') or tema
                        facilitador_entidad = oc.get('facilitador_entidad') or facilitador_entidad
                        modalidad = oc.get('modalidad') or modalidad
                        fecha_actividad = oc.get('fecha') or fecha_actividad
                        hora_inicio = oc.get('hora_inicio') or hora_inicio
                        hora_fin = oc.get('hora_fin') or hora_fin
                        sesion_nro = idx + 1 # Simplemente el índice + 1
                        break

        historial.append({
            "sesion_id": sid,
            "tema": tema,
            "fecha_registro": am.get('fecha_registro'),
            "fecha_actividad": fecha_actividad,
            "hora_inicio": hora_inicio,
            "hora_fin": hora_fin,
            "sesion_nro": sesion_nro,
            "actividad": sesion_info.get('actividad', 'N/A'),
            "modalidad": modalidad,
            "actividad": sesion_info.get('actividad', 'N/A'),
            "tipo_actividad": sesion_info.get('tipo_actividad', 'Interno'),
            "dirigido_a": sesion_info.get('dirigido_a', 'N/A'),
            "facilitador_entidad": facilitador_entidad,
            "responsable": sesion_info.get('responsable', 'N/A'),
            "empresa": am.get('participante', {}).get('empresa'),
            "telefono": am.get('participante', {}).get('telefono')
        })

    # Sort por fecha desc
    historial.sort(key=lambda x: x.get('fecha_registro', ''), reverse=True)

    # Info básica del perfil (tomada del último registro)
    perfil = {
        "cedula": cedula,
        "nombre": asistentes_match[0].get('nombre') if asistentes_match else 'Desconocido',
        "cargo": asistentes_match[0].get('cargo') if asistentes_match else 'N/A',
        "correo": asistentes_match[0].get('correo') if asistentes_match else 'N/A',
        "historial": historial
    }

    return perfil

def obtener_reporte_completo() -> List[Dict[str, Any]]:
    """
    Obtiene un reporte consolidado de todos los registros de asistencia con la información
    detallada de su respectiva sesión o ocurrencia.
    Utilizado para la exportación global a Excel en el Centro de Reportes.
    """
    asistentes = []
    todas_sesiones = []

    if settings.STORAGE_MODE == "cosmosdb" and COSMOS_AVAILABLE:
        # Traer todos los asistentes de todas las sesiones
        query = "SELECT * FROM c"
        asistentes = list(cosmos_db.asistentes_container.query_items(
            query=query,
            enable_cross_partition_query=True
        ))
        # Traer todas las sesiones
        todas_sesiones = cosmos_db.listar_sesiones()
    else:
        asistentes = load_asistentes()
        todas_sesiones = load_sesiones()

    # Mapear sesiones por ID para acceso rápido
    sesiones_map = {s['id']: s for s in todas_sesiones}
    
    reporte = []
    for a in asistentes:
        sid = a.get('sesion_id')
        sesion_info = sesiones_map.get(sid, {})
        
        # Datos base de la sesión
        tema = sesion_info.get('tema', 'Desconocido')
        facilitador_entidad = sesion_info.get('facilitador_entidad', 'N/A')
        modalidad = sesion_info.get('modalidad', 'Presencial')
        actividad = sesion_info.get('actividad', 'N/A')
        responsable = sesion_info.get('responsable', 'N/A')
        cargo_responsable = sesion_info.get('cargo_responsable', 'N/A')
        fecha_actividad = sesion_info.get('fecha', 'N/A')
        hora_inicio = sesion_info.get('hora_inicio', 'N/A')
        hora_fin = sesion_info.get('hora_fin', 'N/A')
        tipo_actividad = sesion_info.get('tipo_actividad', 'Interno')
        dirigido_a = sesion_info.get('dirigido_a', 'N/A')
        
        oc_id = a.get('ocurrencia_id')
        ocurrencias = sesion_info.get('ocurrencias', [])
        
        if len(ocurrencias) == 0:
            sesion_nro = "Única"
        else:
            if not oc_id:
                sesion_nro = "1"
            else:
                # Buscar el número de sesión basado en el índice de la ocurrencia
                sesion_nro = "Desconocida"
                for idx, oc in enumerate(ocurrencias):
                    if oc['id'] == oc_id:
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
            "cargo_asistente": a.get('cargo', 'N/A'),
            "unidad": a.get('unidad') or a.get('empresa') or 'N/A',
            "correo": a.get('correo', 'N/A'),
            "fecha_registro": a.get('fecha_registro')
        })

    return reporte
