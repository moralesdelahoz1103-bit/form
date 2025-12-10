from datetime import datetime, timedelta
from typing import Optional
from fastapi import HTTPException, Request
import jwt
from .config import settings

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=settings.TOKEN_EXPIRY_DAYS)
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    encoded_jwt = jwt.encode(to_encode, settings.SESSION_SECRET, algorithm="HS256")
    return encoded_jwt

def decode_token(token: str):
    try:
        payload = jwt.decode(token, settings.SESSION_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def get_current_user(request: Request) -> dict:
    """
    Extrae y valida el usuario actual desde el token de autorización.
    Útil como dependencia en endpoints protegidos.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autenticado")
    
    token = auth_header.replace("Bearer ", "")
    user_data = decode_token(token)
    
    if not user_data:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    
    return user_data

