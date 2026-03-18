import json
import os
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
import sys
from pathlib import Path
import pytz
import base64
sys.path.append(str(Path(__file__).parent.parent))

from core.config import settings
from core.exceptions import DuplicateRegistrationException
from storage import get_storage_adapter

# Importar cliente CosmosDB
try:
    from db.cosmos_client import cosmos_db
    COSMOS_AVAILABLE = cosmos_db is not None
    if not COSMOS_AVAILABLE:
        print("⚠️ CosmosDB no disponible: No se pudo crear la instancia")
except Exception as e:
    print(f"⚠️ CosmosDB no disponible: {e}")
    COSMOS_AVAILABLE = False
    cosmos_db = None

# Configuración de archivos JSON (fallback)
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_FILE = DATA_DIR / "asistentes.json"

def ensure_data_file():
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f)

def load_asistentes() -> List[dict]:
    ensure_data_file()
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return []

def save_asistentes(asistentes: List[dict]):
    ensure_data_file()
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(asistentes, f, ensure_ascii=False, indent=2)

# ========== FUNCIONES PRINCIPALES ==========

def crear_asistente(asistente_data: dict, sesion_id: str, ip_address: Optional[str] = None) -> dict:
    """Crear asistente en CosmosDB o JSON según configuración."""
    
    # Import sesiones service to get session info
    from services import sesiones as sesion_service

    cedula = asistente_data['cedula']
    
    if settings.STORAGE_MODE == "cosmosdb" and COSMOS_AVAILABLE:
        import time
        t0 = time.time()
        # Obtener sesión completa para tener acceso a _actividad_id y metadatos
        sesion = sesion_service.get_sesion_by_token(asistente_data['token'])
        t1 = time.time()
        print(f"⏱️ [crear_asistente] Obtener sesión: {t1-t0:.4f}s")
        
        # ID específico de la sesión (ocurrencia o maestro)
        id_especifico = asistente_data.get('ocurrencia_id') or sesion['id']
        # ID de la actividad principal (maestro)
        id_actividad = sesion.get('_actividad_id', sesion['id'])

        # Verificar duplicados en CosmosDB (por cédula y sesión específica)
        t2 = time.time()
        if cosmos_db.asistentes.verificar_duplicado(cedula, id_especifico):
            print(f"⏱️ [crear_asistente] Verificar duplicado tardó {time.time()-t2:.4f}s (ENCONTRADO)")
            raise DuplicateRegistrationException()
        t3 = time.time()
        print(f"⏱️ [crear_asistente] Verificar duplicado tardó {t3-t2:.4f}s (NO encontrado)")
        
        # Preparar datos para el registro
        asistente_data['fecha_registro'] = datetime.now(pytz.timezone(settings.TIMEZONE)).isoformat()

        # Crear/Actualizar registro en base de datos
        t4 = time.time()
        nuevo_asistente = cosmos_db.asistentes.crear_o_actualizar(
            asistente_data,
            id_actividad
        )
        t5 = time.time()
        print(f"⏱️ [crear_asistente] Crear/Actualizar persona tardó {t5-t4:.4f}s")
        
        # Incrementar contador de asistentes en la sesión/ocurrencia
        try:
            # Usar id_actividad para encontrar el documento maestro de la sesión
            # y pasar asistente_data.get('ocurrencia_id') para el contador de la sesión específica
            sesion_service.increment_asistentes(id_actividad, asistente_data.get('ocurrencia_id'))
        except Exception as e:
            print(f"⚠️ No se pudo incrementar el contador de asistentes: {e}")

        print(f"⏱️ [crear_asistente] TOTAL: {time.time()-t0:.4f}s")
        
        # Devolver el formato aplanado para compatibilidad con el frontend
        return {
            "id": cedula,
            "actividad_id": id_actividad,
            "sesion_id": id_especifico,
            "cedula": cedula,
            "nombre": nuevo_asistente.get('nombre'),
            "cargo": nuevo_asistente.get('cargo'),
            "unidad": nuevo_asistente.get('unidad'),
            "empresa": nuevo_asistente.get('empresa'),
            "telefono": nuevo_asistente.get('telefono'),
            "correo": nuevo_asistente.get('correo'),
            "fecha_registro": asistente_data['fecha_registro']
        }
    else:
        # Modo JSON (original)
        asistentes = load_asistentes()
        
        # Verificar duplicados
        for a in asistentes:
            if a['cedula'] == asistente_data['cedula'] and a['token'] == asistente_data['token']:
                raise DuplicateRegistrationException()
        
        nuevo_asistente = {
            "id": str(uuid.uuid4()),
            "sesion_id": sesion_id,
            "token": asistente_data['token'],
            "cedula": asistente_data['cedula'],
            "nombre": asistente_data['nombre'],
            "cargo": asistente_data.get('cargo'),
            "unidad": asistente_data.get('unidad'),
            "empresa": asistente_data.get('empresa'),
            "telefono": asistente_data.get('telefono'),
            "correo": asistente_data.get('correo'),
            "fecha_registro": datetime.now(pytz.timezone(settings.TIMEZONE)).isoformat()
        }
        if asistente_data.get('ocurrencia_id'):
            nuevo_asistente['ocurrencia_id'] = asistente_data['ocurrencia_id']
        
        asistentes.append(nuevo_asistente)
        save_asistentes(asistentes)
        
        return nuevo_asistente

def get_asistentes_by_sesion(sesion_id: str) -> List[dict]:
    """Obtener asistentes por sesión"""
    if settings.STORAGE_MODE == "cosmosdb" and COSMOS_AVAILABLE:
        return cosmos_db.listar_asistentes_por_sesion(sesion_id)
    else:
        asistentes = load_asistentes()
        return [a for a in asistentes if a['sesion_id'] == sesion_id]

def delete_asistentes_by_sesion(sesion_id: str):
    """Eliminar asistentes por sesión"""
    if settings.STORAGE_MODE == "cosmosdb" and COSMOS_AVAILABLE:
        cosmos_db.eliminar_asistentes_por_sesion(sesion_id)
    else:
        asistentes = load_asistentes()
        new_asistentes = [a for a in asistentes if a['sesion_id'] != sesion_id]
        save_asistentes(new_asistentes)

def obtener_asistente_por_cedula(cedula: str) -> Optional[dict]:
    """Buscar un asistente por su cédula"""
    if settings.STORAGE_MODE == "cosmosdb" and COSMOS_AVAILABLE:
        return cosmos_db.asistentes.obtener_por_cedula(cedula)
    else:
        asistentes = load_asistentes()
        for a in asistentes:
            if a['cedula'] == cedula:
                return a
    return None

def actualizar_asistente(cedula: str, asistente_data: dict) -> Optional[dict]:
    """Actualizar datos de un asistente"""
    if settings.STORAGE_MODE == "cosmosdb" and COSMOS_AVAILABLE:
        return cosmos_db.asistentes.actualizar_campos(cedula, asistente_data)
    else:
        asistentes = load_asistentes()
        for i, a in enumerate(asistentes):
            if a['cedula'] == cedula:
                # Actualizar campos
                for k, v in asistente_data.items():
                    if v is not None:
                        asistentes[i][k] = v
                save_asistentes(asistentes)
                return asistentes[i]
    return None
