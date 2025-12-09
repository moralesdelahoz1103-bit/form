from fastapi import APIRouter, HTTPException, status, Request
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

@router.get("/sesion/{token}", response_model=SesionPublicResponse)
async def obtener_info_sesion(token: str):
    """
    Obtener información pública de una capacitación por token
    """
    try:
        sesion = sesion_service.get_sesion_by_token(token)
        return {
            "tema": sesion['tema'],
            "fecha": sesion['fecha'],
            "facilitador": sesion['facilitador'],
            "contenido": sesion['contenido'],
            "hora_inicio": sesion['hora_inicio'],
            "hora_fin": sesion['hora_fin'],
            "tipo_actividad": sesion['tipo_actividad']
        }
    except (TokenNotFoundException, TokenExpiredException, TokenInactiveException) as e:
        raise e

@router.post("/asistencia", response_model=AsistenteResponse, status_code=status.HTTP_201_CREATED)
async def registrar_asistencia(asistente: AsistenteCreate, request: Request):
    """
    Registrar asistencia de un participante
    """
    try:
        # Validar token y obtener sesión
        sesion = sesion_service.get_sesion_by_token(asistente.token)
        
        # Crear registro de asistente
        asistente_data = asistente.dict()
        firma_base64 = asistente_data.pop('firma')  # Extraer firma base64
        
        nuevo_asistente = asistente_service.crear_asistente(
            asistente_data,
            firma_base64,
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
