from fastapi import APIRouter, HTTPException, status, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent.parent))

from schemas.asistente import AsistenteInternoCreate, AsistenteExternoCreate, AsistenteResponse, AsistenteUpdate
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

@router.get("/asistentes/{cedula}", response_model=dict)
@limiter.limit("60/minute")
async def buscar_asistente(cedula: str, request: Request):
    """Buscar un asistente por su cédula para autocompletar el formulario."""
    asistente = asistente_service.obtener_asistente_por_cedula(cedula)
    if not asistente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asistente no encontrado"
        )
    return asistente

@router.patch("/asistentes/{cedula}", response_model=dict)
@limiter.limit("60/minute")
async def actualizar_asistente(
    cedula: str, 
    asistente_update: AsistenteUpdate,
    request: Request
):
    """Actualizar datos parciales de un asistente."""
    actualizado = asistente_service.actualizar_asistente(
        cedula, 
        asistente_update.dict(exclude_unset=True)
    )
    if not actualizado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se pudo encontrar el asistente para actualizar"
        )
    return actualizado

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
            "facilitador_entidad": sesion.get('facilitador_entidad'),
            "responsable": sesion.get('responsable'),
            "cargo_responsable": sesion.get('cargo_responsable'),
            "contenido": sesion['contenido'],
            "hora_inicio": sesion['hora_inicio'],
            "hora_fin": sesion['hora_fin'],
            "actividad": sesion.get('actividad'),
            "tipo_actividad": sesion.get('tipo_actividad'),
            "dirigido_a": sesion.get('dirigido_a'),
            "modalidad": sesion.get('modalidad')
        }
    except (TokenNotFoundException, TokenExpiredException, TokenInactiveException) as e:
        raise e

@router.post("/asistencia/interna", response_model=AsistenteResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("60/minute")
async def registrar_asistencia_interna(
    request: Request,
    asistente_in: AsistenteInternoCreate
):
    """
    Registrar asistencia de un participante interno.
    Rate limit: 60 registros por minuto por IP.
    """
    try:
        # Validar token y obtener sesión
        sesion = sesion_service.get_sesion_by_token(asistente_in.token)

        # Crear registro de asistente
        asistente_data = asistente_in.dict()

        # Si el token pertenece a una ocurrencia, guardar su id
        ocurrencia_id = sesion.get('_ocurrencia_id')
        if ocurrencia_id:
            asistente_data['ocurrencia_id'] = ocurrencia_id

        nuevo_asistente = asistente_service.crear_asistente(
            asistente_data,
            sesion['id']
        )
        
        return nuevo_asistente
        
    except (TokenNotFoundException, TokenExpiredException, TokenInactiveException) as e:
        print(f"⚠️ Error de token en registro interno: {e}")
        raise e
    except DuplicateRegistrationException as e:
        print(f"⚠️ Registro duplicado: {asistente_in.cedula}")
        raise e
    except Exception as e:
        import traceback
        print(f"❌ ERROR CRÍTICO en registrar_asistencia_interna:")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno al registrar asistencia: {str(e)}"
        )


@router.post("/asistencia/externa", response_model=AsistenteResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("60/minute")
async def registrar_asistencia_externa(
    request: Request,
    asistente_in: AsistenteExternoCreate
):
    """
    Registrar asistencia de un participante externo.
    Rate limit: 5 registros por minuto por IP.
    """
    try:
        # Validar token y obtener sesión
        sesion = sesion_service.get_sesion_by_token(asistente_in.token)

        # Crear registro de asistente
        asistente_data = asistente_in.dict()

        # Si el token pertenece a una ocurrencia, guardar su id
        ocurrencia_id = sesion.get('_ocurrencia_id')
        if ocurrencia_id:
            asistente_data['ocurrencia_id'] = ocurrencia_id

        nuevo_asistente = asistente_service.crear_asistente(
            asistente_data,
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


