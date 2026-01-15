from fastapi import APIRouter, HTTPException, Response, Request
from fastapi.responses import RedirectResponse, JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from core.config import settings
from services.usuarios import usuario_service
import msal
import secrets
import jwt
from datetime import datetime, timedelta
from typing import Optional

router = APIRouter(prefix="/api/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)

# Almacenamiento en memoria de estados PKCE (en producción, usar Redis o base de datos)
pkce_states = {}
user_sessions = {}


def create_msal_app():
    """Crea una instancia de MSAL Confidential Client para autenticación del servidor"""
    return msal.ConfidentialClientApplication(
        settings.ENTRA_CLIENT_ID,
        authority=settings.ENTRA_AUTHORITY,
        client_credential=settings.ENTRA_CLIENT_SECRET,
    )


def create_session_token(user_info: dict) -> str:
    """Crea un JWT token para la sesión del usuario"""
    payload = {
        "sub": user_info.get("preferred_username") or user_info.get("email"),
        "name": user_info.get("name"),
        "email": user_info.get("preferred_username") or user_info.get("email"),
        "oid": user_info.get("oid"),
        "exp": datetime.utcnow() + timedelta(days=settings.TOKEN_EXPIRY_DAYS),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, settings.SESSION_SECRET, algorithm="HS256")


def verify_session_token(token: str) -> Optional[dict]:
    """Verifica y decodifica el JWT token de sesión"""
    try:
        payload = jwt.decode(token, settings.SESSION_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


@router.get("/login")
@limiter.limit("10/minute")
async def login(request: Request):
    """
    Inicia el flujo de autenticación con Microsoft Entra ID.
    Redirige al usuario a Microsoft para autenticarse.
    Rate limit: 10 intentos por minuto por IP.
    """
    try:
        # Generar un state único para CSRF protection
        state = secrets.token_urlsafe(32)
        
        # Crear la aplicación MSAL
        msal_app = create_msal_app()

        # Construir la URL de autorización.
        # Si se proporciona ENTRA_REDIRECT_URI en .env, usarla (útil para entornos o proxies).
        # Si no, construir dinámicamente desde la petición.
        redirect_uri = settings.ENTRA_REDIRECT_URI or f"{request.url.scheme}://{request.url.netloc}/api/auth/callback"

        auth_url = msal_app.get_authorization_request_url(
            scopes=settings.ENTRA_SCOPES,
            state=state,
            redirect_uri=redirect_uri,
        )
        
        # Guardar el state temporalmente (en producción, usar Redis)
        pkce_states[state] = {
            "created_at": datetime.utcnow(),
            "redirect_uri": redirect_uri,
        }
        
        # Limpiar estados antiguos (más de 10 minutos)
        current_time = datetime.utcnow()
        pkce_states_to_remove = [
            s for s, data in pkce_states.items()
            if (current_time - data["created_at"]).total_seconds() > 600
        ]
        for s in pkce_states_to_remove:
            del pkce_states[s]
        
        return RedirectResponse(url=auth_url)
    
    except HTTPException:
        raise
    except Exception as e:
        # Log interno del error real
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Login error: {str(e)}")
        # Mensaje genérico al usuario
        raise HTTPException(status_code=500, detail="Error al iniciar sesión. Intenta nuevamente.")


@router.get("/callback")
@limiter.limit("20/minute")
async def callback(request: Request, code: str, state: str):
    """
    Callback de Microsoft Entra ID después de la autenticación.
    Intercambia el código de autorización por tokens de acceso.
    Rate limit: 20 intentos por minuto por IP.
    """
    try:
        # Verificar el state para proteger contra CSRF
        if state not in pkce_states:
            raise HTTPException(status_code=400, detail="Estado de autenticación inválido o expirado")
        
        state_data = pkce_states.pop(state)
        redirect_uri = state_data["redirect_uri"]
        
        # Crear la aplicación MSAL
        msal_app = create_msal_app()
        
        # Intercambiar el código por tokens
        result = msal_app.acquire_token_by_authorization_code(
            code=code,
            scopes=settings.ENTRA_SCOPES,
            redirect_uri=redirect_uri,
        )
        
        if "error" in result:
            # No exponer detalles técnicos de Azure al frontend
            error_msg = result.get('error', 'Error de autenticación')
            # Log interno para debugging (no visible al usuario)
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Azure auth error: {result.get('error_description', error_msg)}")
            
            raise HTTPException(
                status_code=400,
                detail="Error al autenticar con Microsoft. Verifica tus credenciales e intenta nuevamente."
            )
        
        # Extraer información del usuario
        user_info = result.get("id_token_claims", {})
        
        # Verificar dominio permitido
        email = user_info.get("preferred_username") or user_info.get("email")
        if not email or not email.endswith(settings.ALLOWED_DOMAIN):
            raise HTTPException(
                status_code=403,
                detail=f"Acceso denegado. Solo se permiten usuarios del dominio {settings.ALLOWED_DOMAIN}"
            )
        
        # Registrar usuario automáticamente si es la primera vez
        user_id = user_info.get("oid")  # Object ID de Azure
        user_name = user_info.get("name", email.split("@")[0])
        
        if user_id:
            usuario_service.registrar_o_actualizar_usuario(user_id, user_name)
        
        # Crear sesión
        session_token = create_session_token(user_info)
        
        # Guardar información de la sesión
        user_sessions[session_token] = {
            "user_info": user_info,
            "access_token": result.get("access_token"),
            "created_at": datetime.utcnow(),
        }
        
        # Redirigir al frontend con el token en la URL
        frontend_url = f"{settings.FRONTEND_URL}/auth-success?token={session_token}"
        return RedirectResponse(url=frontend_url)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en callback: {str(e)}")


@router.get("/me")
@limiter.limit("30/minute")
async def get_current_user(request: Request):
    """
    Obtiene la información del usuario autenticado actual.
    Requiere el token de sesión en el header Authorization.
    Rate limit: 30 intentos por minuto por IP.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autenticado")
    
    token = auth_header.replace("Bearer ", "")
    
    # Verificar el token
    user_data = verify_session_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    
    return {
        "email": user_data.get("email"),
        "name": user_data.get("name"),
        "oid": user_data.get("oid"),
        "rol": usuario_service.obtener_rol_usuario(user_data.get("oid", ""))
    }


@router.post("/logout")
async def logout(request: Request):
    """
    Cierra la sesión del usuario.
    Elimina la sesión del backend y devuelve la URL de logout de Microsoft.
    """
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.replace("Bearer ", "")
        # Eliminar la sesión
        if token in user_sessions:
            del user_sessions[token]
    
    # Construir URL de logout de Microsoft
    logout_url = f"https://login.microsoftonline.com/{settings.ENTRA_TENANT_ID}/oauth2/v2.0/logout"
    post_logout_redirect = f"{settings.FRONTEND_URL}/login"
    
    return {
        "message": "Sesión cerrada exitosamente",
        "logout_url": f"{logout_url}?post_logout_redirect_uri={post_logout_redirect}"
    }


@router.get("/status")
async def auth_status():
    """
    Verifica el estado de la configuración de autenticación.
    """
    return {
        "configured": bool(settings.ENTRA_CLIENT_ID and settings.ENTRA_CLIENT_SECRET),
        "tenant_id": settings.ENTRA_TENANT_ID,
        "allowed_domain": settings.ALLOWED_DOMAIN,
    }
