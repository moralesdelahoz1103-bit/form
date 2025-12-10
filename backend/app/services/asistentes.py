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
    COSMOS_AVAILABLE = True
except Exception as e:
    print(f"⚠️ CosmosDB no disponible: {e}")
    COSMOS_AVAILABLE = False

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

def crear_asistente(asistente_data: dict, firma_data, sesion_id: str, ip_address: Optional[str] = None) -> dict:
    """Crear asistente en CosmosDB o JSON según configuración.

    `firma_data` puede ser:
    - bytes: los bytes del archivo de imagen (cuando viene como upload)
    - str: un data URL o base64 crudo (cuando viene desde frontend en base64)
    """

    # Save firma using storage adapter
    storage = get_storage_adapter()

    # Obtener bytes desde distintos formatos
    if isinstance(firma_data, (bytes, bytearray)):
        firma_bytes = bytes(firma_data)
    elif isinstance(firma_data, str):
        firma_base64 = firma_data
        if firma_base64.startswith('data:image'):
            # Remove data URL prefix if present
            firma_base64 = firma_base64.split(',')[1]
        firma_bytes = base64.b64decode(firma_base64)
    else:
        raise ValueError('Formato de firma no soportado')
    cedula = asistente_data['cedula']
    firma_filename = storage.save_firma(firma_bytes, cedula)
    firma_url = storage.get_firma_url(firma_filename)
    
    if settings.STORAGE_MODE == "cosmosdb" and COSMOS_AVAILABLE:
        # Verificar duplicados en CosmosDB
        if cosmos_db.verificar_asistente_duplicado(asistente_data['cedula'], asistente_data['token']):
            raise DuplicateRegistrationException()
        
        nuevo_asistente = {
            "id": str(uuid.uuid4()),
            "sesion_id": sesion_id,
            "token": asistente_data['token'],
            "cedula": asistente_data['cedula'],
            "nombre": asistente_data['nombre'],
            "cargo": asistente_data['cargo'],
            "unidad": asistente_data['unidad'],
            "correo": asistente_data['correo'],
            "firma_url": firma_url,
            "firma_filename": firma_filename,
            # Usa pytz para compatibilidad en Windows donde ZoneInfo no tiene America/Bogota
            "fecha_registro": datetime.now(pytz.timezone("America/Bogota")).isoformat()
        }
        
        return cosmos_db.crear_asistente(nuevo_asistente)
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
            "cargo": asistente_data['cargo'],
            "unidad": asistente_data['unidad'],
            "correo": asistente_data['correo'],
            "firma_url": firma_url,
            "firma_filename": firma_filename,
            # Usa pytz para compatibilidad en Windows donde ZoneInfo no tiene America/Bogota
            "fecha_registro": datetime.now(pytz.timezone("America/Bogota")).isoformat()
        }
        
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
