from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional
import re

class SesionCreate(BaseModel):
    tema: str = Field(..., min_length=3, max_length=200)
    fecha: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}$')
    tipo_actividad: str = Field(..., pattern=r'^(Inducción|Formación|Evento|Otros)$')
    # Campo opcional para especificar tipo cuando se elige 'Otros'
    tipo_actividad_custom: Optional[str] = None
    facilitador: str = Field(..., min_length=3, max_length=100)
    responsable: str = Field(..., min_length=3, max_length=100)
    cargo: str = Field(..., min_length=3, max_length=100)
    contenido: str = Field(..., min_length=10)
    hora_inicio: str = Field(..., pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')
    hora_fin: str = Field(..., pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')
    
    @validator('facilitador', 'tema', 'responsable', 'cargo')
    def validate_no_special_chars(cls, v):
        if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s0-9.,\-]+$', v):
            raise ValueError('Contiene caracteres no permitidos')
        return v.strip()
    
    @validator('hora_fin')
    def validate_hora_fin(cls, v, values):
        if 'hora_inicio' in values:
            if v <= values['hora_inicio']:
                raise ValueError('Hora fin debe ser posterior a hora inicio')
        return v

    @validator('tipo_actividad_custom')
    def validate_custom_tipo(cls, v, values):
        # Si se proporciona, debe tener al menos 3 caracteres y no contener caracteres extraños
        if v is None:
            return v
        if not isinstance(v, str) or len(v.strip()) < 3:
            raise ValueError('tipo_actividad_custom debe tener al menos 3 caracteres')
        if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.,\-]+$', v):
            raise ValueError('Contiene caracteres no permitidos')
        return v.strip()

class SesionResponse(BaseModel):
    id: str
    token: str
    tema: str
    fecha: str
    tipo_actividad: str
    facilitador: str
    responsable: Optional[str] = None
    cargo: Optional[str] = None
    contenido: str
    hora_inicio: str
    hora_fin: str
    link: str
    qr_code: str
    qr_filename: Optional[str] = None
    token_expiry: str
    token_active: bool
    created_by: Optional[str] = None
    created_at: str
    updated_at: str
    total_asistentes: Optional[int] = 0
    
    class Config:
        from_attributes = True

class SesionPublicResponse(BaseModel):
    tema: str
    fecha: str
    facilitador: str
    responsable: Optional[str] = None
    cargo: Optional[str] = None
    contenido: str
    hora_inicio: str
    hora_fin: str
    tipo_actividad: str
