import json
import os
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
import sys
from pathlib import Path
import qrcode
from io import BytesIO
import base64
sys.path.append(str(Path(__file__).parent.parent))

from core.config import settings
from core.exceptions import TokenNotFoundException, TokenExpiredException, TokenInactiveException
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
DATA_FILE = DATA_DIR / "sesiones.json"

def ensure_data_file():
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f)

def load_sesiones() -> List[dict]:
    ensure_data_file()
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return []

def save_sesiones(sesiones: List[dict]):
    ensure_data_file()
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(sesiones, f, ensure_ascii=False, indent=2)

def generar_qr(link: str, nombre: str, fecha: str) -> str:
    """
    Genera un código QR y lo guarda usando el storage adapter.
    Retorna el filename del QR guardado.
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(link)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to bytes
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    qr_bytes = buffered.getvalue()
    
    # Save using storage adapter
    storage = get_storage_adapter()
    filename = storage.save_qr(qr_bytes, nombre, fecha)
    
    return filename

# ========== FUNCIONES PRINCIPALES ==========

def crear_sesion(sesion_data: dict) -> dict:
    """Crear sesión en CosmosDB o JSON según configuración"""
    
    sesion_id = str(uuid.uuid4())
    token = uuid.uuid4().hex[:8].upper()
    now = datetime.utcnow().isoformat()
    expiry = (datetime.utcnow() + timedelta(days=settings.TOKEN_EXPIRY_DAYS)).isoformat()
    
    link = f"{settings.FRONTEND_URL}/registro?token={token}"
    
    # Generate QR and save with storage adapter
    nombre = sesion_data.get('tema', 'sesion')
    fecha = sesion_data.get('fecha', datetime.utcnow().strftime('%Y-%m-%d'))
    qr_filename = generar_qr(link, nombre, fecha)
    
    # Get QR URL from storage adapter
    storage = get_storage_adapter()
    qr_url = storage.get_qr_url(qr_filename)
    
    nueva_sesion = {
        "id": sesion_id,
        "token": token,
        "link": link,
        "qr_code": qr_url,
        "qr_filename": qr_filename,
        "token_expiry": expiry,
        "token_active": True,
        "created_at": now,
        "updated_at": now,
        **sesion_data
    }
    
    if settings.STORAGE_MODE == "cosmosdb" and COSMOS_AVAILABLE:
        return cosmos_db.crear_sesion(nueva_sesion)
    else:
        sesiones = load_sesiones()
        sesiones.append(nueva_sesion)
        save_sesiones(sesiones)
        return nueva_sesion

def get_all_sesiones(owner_email: Optional[str] = None) -> List[dict]:
    """Listar sesiones. Si se proporciona owner_email, devuelve solo las sesiones de ese propietario."""
    if settings.STORAGE_MODE == "cosmosdb" and COSMOS_AVAILABLE:
        return cosmos_db.listar_sesiones(owner_email)
    else:
        sesiones = load_sesiones()
        if owner_email:
            sesiones = [s for s in sesiones if s.get('created_by') == owner_email]
        sesiones.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        return sesiones

def get_sesion_by_id(sesion_id: str) -> Optional[dict]:
    """Obtener sesión por ID"""
    if settings.STORAGE_MODE == "cosmosdb" and COSMOS_AVAILABLE:
        return cosmos_db.obtener_sesion(sesion_id)
    else:
        sesiones = load_sesiones()
        for sesion in sesiones:
            if sesion['id'] == sesion_id:
                return sesion
        return None

def get_sesion_by_token(token: str) -> dict:
    """Obtener sesión por token con validaciones"""
    if settings.STORAGE_MODE == "cosmosdb" and COSMOS_AVAILABLE:
        sesion = cosmos_db.obtener_sesion_por_token(token)
    else:
        sesiones = load_sesiones()
        sesion = next((s for s in sesiones if s['token'] == token), None)
    
    if not sesion:
        raise TokenNotFoundException()
    
    if not sesion.get('token_active', True):
        raise TokenInactiveException()
    
    expiry = datetime.fromisoformat(sesion['token_expiry'])
    if datetime.utcnow() > expiry:
        raise TokenExpiredException()
    
    return sesion

def delete_sesion(sesion_id: str) -> bool:
    """Eliminar sesión"""
    if settings.STORAGE_MODE == "cosmosdb" and COSMOS_AVAILABLE:
        cosmos_db.eliminar_sesion(sesion_id)
        return True
    else:
        sesiones = load_sesiones()
        new_sesiones = [s for s in sesiones if s['id'] != sesion_id]
        if len(new_sesiones) == len(sesiones):
            return False
        save_sesiones(new_sesiones)
        return True
