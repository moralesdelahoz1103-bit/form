import json
import os
from typing import List, Optional
from datetime import datetime
import uuid
import sys
from pathlib import Path
from zoneinfo import ZoneInfo
sys.path.append(str(Path(__file__).parent.parent))

from core.exceptions import DuplicateRegistrationException

DATA_FILE = "data/asistentes.json"

def ensure_data_file():
    os.makedirs("data", exist_ok=True)
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

def crear_asistente(asistente_data: dict, firma_path: str, sesion_id: str, ip_address: Optional[str] = None) -> dict:
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
        "firma_path": firma_path,
        "fecha_registro": datetime.now(ZoneInfo("America/Bogota")).isoformat(),
        "ip_address": ip_address
    }
    
    asistentes.append(nuevo_asistente)
    save_asistentes(asistentes)
    
    return nuevo_asistente

def get_asistentes_by_sesion(sesion_id: str) -> List[dict]:
    asistentes = load_asistentes()
    return [a for a in asistentes if a['sesion_id'] == sesion_id]

def delete_asistentes_by_sesion(sesion_id: str):
    asistentes = load_asistentes()
    new_asistentes = [a for a in asistentes if a['sesion_id'] != sesion_id]
    save_asistentes(new_asistentes)
