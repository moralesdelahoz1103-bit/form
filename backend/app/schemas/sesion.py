from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional
import re

class SesionCreate(BaseModel):
    tema: str = Field(..., min_length=3, max_length=200)
    fecha: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}$')
    tipo_actividad: str = Field(..., pattern=r'^(Inducción|Formación|Evento)$')
    facilitador: str = Field(..., min_length=3, max_length=100)
    contenido: str = Field(..., min_length=10)
    hora_inicio: str = Field(..., pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')
    hora_fin: str = Field(..., pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')
    
    @validator('facilitador', 'tema')
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

class SesionResponse(BaseModel):
    id: str
    token: str
    tema: str
    fecha: str
    tipo_actividad: str
    facilitador: str
    contenido: str
    hora_inicio: str
    hora_fin: str
    link: str
    qr_code: str
    token_expiry: str
    token_active: bool
    created_at: str
    updated_at: str
    total_asistentes: Optional[int] = 0
    
    class Config:
        from_attributes = True

class SesionPublicResponse(BaseModel):
    tema: str
    fecha: str
    facilitador: str
    contenido: str
    hora_inicio: str
    hora_fin: str
    tipo_actividad: str
