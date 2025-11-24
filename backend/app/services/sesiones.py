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

DATA_FILE = "data/sesiones.json"

def ensure_data_file():
    os.makedirs("data", exist_ok=True)
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

def generar_qr(link: str) -> str:
    """Genera un código QR y lo devuelve como base64"""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(link)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convertir a base64
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    
    return f"data:image/png;base64,{img_str}"

def crear_sesion(sesion_data: dict) -> dict:
    sesiones = load_sesiones()
    
    # Generar datos
    sesion_id = str(uuid.uuid4())
    # Token corto de 8 caracteres alfanuméricos
    token = uuid.uuid4().hex[:8].upper()
    now = datetime.utcnow().isoformat()
    expiry = (datetime.utcnow() + timedelta(days=settings.TOKEN_EXPIRY_DAYS)).isoformat()
    
    link = f"{settings.BASE_URL}/registro?token={token}"
    qr_code = generar_qr(link)
    
    nueva_sesion = {
        "id": sesion_id,
        "token": token,
        "link": link,
        "qr_code": qr_code,
        "token_expiry": expiry,
        "token_active": True,
        "created_at": now,
        "updated_at": now,
        **sesion_data
    }
    
    sesiones.append(nueva_sesion)
    save_sesiones(sesiones)
    
    return nueva_sesion

def get_all_sesiones() -> List[dict]:
    sesiones = load_sesiones()
    
    # Generar QR codes para sesiones que no lo tienen
    updated = False
    for sesion in sesiones:
        if 'qr_code' not in sesion:
            sesion['qr_code'] = generar_qr(sesion['link'])
            updated = True
    
    if updated:
        save_sesiones(sesiones)
    
    return sesiones

def get_sesion_by_id(sesion_id: str) -> Optional[dict]:
    sesiones = load_sesiones()
    for s in sesiones:
        if s['id'] == sesion_id:
            # Generar QR si no existe
            if 'qr_code' not in s:
                s['qr_code'] = generar_qr(s['link'])
                save_sesiones(sesiones)
            return s
    return None

def get_sesion_by_token(token: str) -> dict:
    sesiones = load_sesiones()
    for s in sesiones:
        if s['token'] == token:
            # Validar token
            if not s.get('token_active', True):
                raise TokenInactiveException()
            
            expiry = datetime.fromisoformat(s['token_expiry'])
            if datetime.utcnow() > expiry:
                raise TokenExpiredException()
            
            return s
    
    raise TokenNotFoundException()

def delete_sesion(sesion_id: str) -> bool:
    sesiones = load_sesiones()
    new_sesiones = [s for s in sesiones if s['id'] != sesion_id]
    
    if len(new_sesiones) == len(sesiones):
        return False
    
    save_sesiones(new_sesiones)
    return True
