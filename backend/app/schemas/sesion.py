from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional, List
import re

# ─── Ocurrencias ───────────────────────────────────────────────────────────

class OcurrenciaCreate(BaseModel):
    fecha: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}$')
    hora_inicio: Optional[str] = Field(None, pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')
    hora_fin: Optional[str] = Field(None, pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')
    facilitador_entidad: Optional[str] = Field(None, min_length=3, max_length=100)
    tipo_actividad: Optional[str] = Field(None, pattern=r'^(Interno|Externo)$')
    contenido: Optional[str] = Field(None, max_length=2000)
    actividad: Optional[str] = None
    dirigido_a: Optional[str] = None
    modalidad: Optional[str] = None
    responsable: Optional[str] = None
    cargo_responsable: Optional[str] = None
    tema: Optional[str] = None

    @validator('hora_fin')
    def validate_hora_fin(cls, v, values):
        if v is None:
            return v
        if values.get('hora_inicio') and v <= values['hora_inicio']:
            raise ValueError('Hora fin debe ser posterior a hora inicio')
        return v

class OcurrenciaUpdate(BaseModel):
    fecha: Optional[str] = Field(None, pattern=r'^\d{4}-\d{2}-\d{2}$')
    hora_inicio: Optional[str] = Field(None, pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')
    hora_fin: Optional[str] = Field(None, pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')
    facilitador_entidad: Optional[str] = Field(None, min_length=3, max_length=100)
    tipo_actividad: Optional[str] = Field(None, pattern=r'^(Interno|Externo)$')
    contenido: Optional[str] = Field(None, max_length=2000)
    actividad: Optional[str] = None
    dirigido_a: Optional[str] = None
    modalidad: Optional[str] = None
    responsable: Optional[str] = None
    cargo_responsable: Optional[str] = None
    tema: Optional[str] = None

    @validator('hora_fin')
    def validate_hora_fin(cls, v, values):
        if v is None:
            return v
        if values.get('hora_inicio') and v <= values['hora_inicio']:
            raise ValueError('Hora fin debe ser posterior a hora inicio')
        return v

class OcurrenciaResponse(BaseModel):
    id: str
    fecha: str
    hora_inicio: Optional[str] = None
    hora_fin: Optional[str] = None
    facilitador_entidad: Optional[str] = None
    tipo_actividad: Optional[str] = None
    contenido: Optional[str] = None
    actividad: Optional[str] = None
    dirigido_a: Optional[str] = None
    modalidad: Optional[str] = None
    responsable: Optional[str] = None
    cargo_responsable: Optional[str] = None
    tema: Optional[str] = None
    token: Optional[str] = None
    link: Optional[str] = None
    token_active: Optional[bool] = True
    token_expiry: Optional[str] = None
    created_at: Optional[str] = None
    total_asistentes: Optional[int] = 0

# ─── Sesión ────────────────────────────────────────────────────────────────

class SesionCreate(BaseModel):
    tema: str = Field(..., min_length=3, max_length=200)
    fecha: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}$')
    actividad: str = Field(..., pattern=r'^(Inducción|Formación|Capacitación|Otros \(eventos\))$')
    actividad_custom: Optional[str] = None
    facilitador_entidad: str = Field(..., min_length=3, max_length=100)
    tipo_actividad: str = Field("Interno", pattern=r'^(Interno|Externo)$')
    responsable: str = Field(..., min_length=3, max_length=100)
    cargo_responsable: str = Field(..., min_length=3, max_length=100)
    contenido: str = Field(..., min_length=10)
    hora_inicio: str = Field(..., pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')
    hora_fin: str = Field(..., pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')
    dirigido_a: str = Field(..., pattern=r'^(Personal FSD|Personal Externo|Personal FSD y externo)$')
    modalidad: str = Field(..., pattern=r'^(Virtual|Presencial|Híbrida)$')
    # ── Recurrencia ──
    es_recurrente: bool = False
    ocurrencias_programadas: List[OcurrenciaCreate] = []

    @validator('facilitador_entidad', 'tema', 'responsable', 'cargo_responsable')
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

    @validator('actividad_custom')
    def validate_custom_actividad(cls, v, values):
        if v is None:
            return v
        if not isinstance(v, str) or len(v.strip()) < 3:
            raise ValueError('actividad_custom debe tener al menos 3 caracteres')
        if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.,\-]+$', v):
            raise ValueError('Contiene caracteres no permitidos')
        return v.strip()

class SesionResponse(BaseModel):
    id: str
    token: Optional[str] = None
    tema: Optional[str] = None
    fecha: Optional[str] = None
    actividad: Optional[str] = None
    actividad_custom: Optional[str] = None
    facilitador_entidad: Optional[str] = None
    tipo_actividad: Optional[str] = None
    responsable: Optional[str] = None
    cargo_responsable: Optional[str] = None
    contenido: Optional[str] = None
    hora_inicio: Optional[str] = None
    hora_fin: Optional[str] = None
    dirigido_a: Optional[str] = None
    modalidad: Optional[str] = None
    link: Optional[str] = None
    token_expiry: Optional[str] = None
    token_active: Optional[bool] = True
    created_by: Optional[str] = None
    created_by_name: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    total_asistentes: Optional[int] = 0
    total_asistentes_principal: Optional[int] = 0
    # ── Recurrencia ──
    es_recurrente: bool = False
    ocurrencias: List[OcurrenciaResponse] = []

    class Config:
        from_attributes = True

class SesionUpdate(BaseModel):
    tema: Optional[str] = Field(None, min_length=3, max_length=200)
    fecha: Optional[str] = Field(None, pattern=r'^\d{4}-\d{2}-\d{2}$')
    actividad: Optional[str] = None
    actividad_custom: Optional[str] = None
    facilitador_entidad: Optional[str] = Field(None, min_length=3, max_length=100)
    tipo_actividad: Optional[str] = Field(None, pattern=r'^(Interno|Externo)$')
    responsable: Optional[str] = Field(None, min_length=3, max_length=100)
    cargo_responsable: Optional[str] = Field(None, min_length=3, max_length=100)
    contenido: Optional[str] = Field(None, min_length=10)
    hora_inicio: Optional[str] = Field(None, pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')
    hora_fin: Optional[str] = Field(None, pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')
    dirigido_a: Optional[str] = Field(None, pattern=r'^(Personal FSD|Personal Externo|Personal FSD y externo)$')
    modalidad: Optional[str] = Field(None, pattern=r'^(Virtual|Presencial|Híbrida)$')

    @validator('facilitador_entidad', 'tema', 'responsable', 'cargo_responsable')
    def validate_no_special_chars(cls, v):
        if v is None:
            return v
        if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s0-9.,\-]+$', v):
            raise ValueError('Contiene caracteres no permitidos')
        return v.strip()

    @validator('hora_fin')
    def validate_hora_fin(cls, v, values):
        if v is None:
            return v
        if 'hora_inicio' in values and values['hora_inicio']:
            if v <= values['hora_inicio']:
                raise ValueError('Hora fin debe ser posterior a hora inicio')
        return v

    @validator('actividad_custom')
    def validate_custom_actividad(cls, v, values):
        if v is None:
            return v
        if not isinstance(v, str) or len(v.strip()) < 3:
            raise ValueError('actividad_custom debe tener al menos 3 caracteres')
        if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.,\-]+$', v):
            raise ValueError('Contiene caracteres no permitidos')
        return v.strip()

class SesionPublicResponse(BaseModel):
    tema: Optional[str] = None
    fecha: Optional[str] = None
    facilitador_entidad: Optional[str] = None
    responsable: Optional[str] = None
    cargo_responsable: Optional[str] = None
    contenido: Optional[str] = None
    hora_inicio: Optional[str] = None
    hora_fin: Optional[str] = None
    actividad: Optional[str] = None
    tipo_actividad: Optional[str] = None
    dirigido_a: Optional[str] = None
    modalidad: Optional[str] = None
