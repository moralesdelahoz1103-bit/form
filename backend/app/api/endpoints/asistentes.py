from fastapi import APIRouter, HTTPException, status, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent.parent))

from schemas.asistente import AsistenteCreate, AsistenteResponse
from schemas.sesion import SesionPublicResponse
from services import sesiones as sesion_service
from services import asistentes as asistente_service
from core.exceptions import (
    TokenNotFoundException, 
    TokenExpiredException, 
    TokenInactiveException,
    DuplicateRegistrationException
)

router = APIRouter(prefix="/api", tags=["asistentes"])
limiter = Limiter(key_func=get_remote_address)

@router.get("/sesion/{token}", response_model=SesionPublicResponse)
@limiter.limit("30/minute")
async def obtener_info_sesion(token: str, request: Request):
    """
    Obtener información pública de una capacitación por token.
    Rate limit: 30 intentos por minuto por IP.
    """
    try:
        sesion = sesion_service.get_sesion_by_token(token)
        return {
            "tema": sesion['tema'],
            "fecha": sesion['fecha'],
            "facilitador": sesion['facilitador'],
            "responsable": sesion.get('responsable'),
            "cargo": sesion.get('cargo'),
            "contenido": sesion['contenido'],
            "hora_inicio": sesion['hora_inicio'],
            "hora_fin": sesion['hora_fin'],
            "tipo_actividad": sesion['tipo_actividad']
        }
    except (TokenNotFoundException, TokenExpiredException, TokenInactiveException) as e:
        raise e

from fastapi import Form, File, UploadFile


@router.post("/asistencia", response_model=AsistenteResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def registrar_asistencia(
    request: Request,
    cedula: str = Form(...),
    nombre: str = Form(...),
    cargo: str = Form(...),
    unidad: str = Form(...),
    correo: str = Form(...),
    token: str = Form(...),
    firma: UploadFile = File(...)
):
    """
    Registrar asistencia de un participante.
    Rate limit: 5 registros por minuto por IP (previene spam y duplicados).
    """
    try:
        # Validar token y obtener sesión
        sesion = sesion_service.get_sesion_by_token(token)

        # Leer bytes de la firma subida
        firma_bytes = await firma.read()

        # Crear registro de asistente
        asistente_data = {
            'cedula': cedula,
            'nombre': nombre,
            'cargo': cargo,
            'unidad': unidad,
            'correo': correo,
            'token': token
        }

        nuevo_asistente = asistente_service.crear_asistente(
            asistente_data,
            firma_bytes,
            sesion['id']
        )
        
        return nuevo_asistente
        
    except (TokenNotFoundException, TokenExpiredException, TokenInactiveException) as e:
        raise e
    except DuplicateRegistrationException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al procesar la solicitud: {str(e)}"
        )
