from pydantic import BaseModel, Field, validator
from typing import Optional
import re

class AsistenteCreate(BaseModel):
    token: str = Field(..., pattern=r'^[0-9A-Fa-f]{8}$')
    cedula: str = Field(..., pattern=r'^\d{6,10}$')
    nombre: str = Field(..., min_length=2, max_length=100)
    cargo: str = Field(..., min_length=2, max_length=100)
    unidad: str = Field(..., min_length=2, max_length=100)
    correo: str = Field(..., pattern=r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
    firma: str = Field(..., min_length=100)  # Base64 string
    
    @validator('nombre', 'cargo', 'unidad')
    def validate_only_letters(cls, v):
        if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$', v):
            raise ValueError('Solo se permiten letras y espacios')
        return v.strip()
    
    @validator('correo')
    def validate_email_lowercase(cls, v):
        return v.lower().strip()
    
    @validator('cedula')
    def validate_cedula_clean(cls, v):
        return v.strip()

class AsistenteResponse(BaseModel):
    id: str
    sesion_id: str
    token: str
    cedula: str
    nombre: str
    cargo: str
    unidad: str
    correo: str
    firma_base64: str
    fecha_registro: str
    
    class Config:
        from_attributes = True
