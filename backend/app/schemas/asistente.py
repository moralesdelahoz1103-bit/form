from pydantic import BaseModel, Field, validator
from typing import Optional
import re

class AsistenteInternoCreate(BaseModel):
    token: str = Field(..., pattern=r'^[0-9A-Fa-f]{8}$')
    cedula: str = Field(..., pattern=r'^\d{6,10}$')
    nombre: str = Field(..., min_length=2, max_length=100)
    cargo: str = Field(..., min_length=2, max_length=100)
    unidad: str = Field(..., min_length=2, max_length=100)
    correo: str = Field(..., pattern=r'^[^\s@]+@[^\s@]+\.[^\s@]+$')

    @validator('nombre', 'cargo', 'unidad')
    def validate_only_letters(cls, v):
        if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.,-]+$', v):
            raise ValueError('Contiene caracteres no permitidos')
        return v.strip()
    
    @validator('cedula')
    def validate_cedula_clean(cls, v):
        return v.strip()

class AsistenteExternoCreate(BaseModel):
    token: str = Field(..., pattern=r'^[0-9A-Fa-f]{8}$')
    cedula: str = Field(..., pattern=r'^\d{6,15}$')
    nombre: str = Field(..., min_length=2, max_length=100)
    empresa: str = Field(..., min_length=2, max_length=100)
    cargo: str = Field(..., min_length=2, max_length=100)
    telefono: str = Field(..., pattern=r'^\d{7,15}$')
    correo: str = Field(..., pattern=r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
    
    @validator('nombre', 'empresa', 'cargo')
    def validate_only_letters(cls, v):
        if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.,-]+$', v):
            raise ValueError('Contiene caracteres no permitidos')
        return v.strip()
    
    @validator('cedula', 'telefono')
    def validate_clean(cls, v):
        if v:
            return v.strip()
        return v

class AsistenteResponse(BaseModel):
    id: str
    sesion_id: str
    token: str
    cedula: str
    nombre: str
    cargo: Optional[str] = None
    unidad: Optional[str] = None
    empresa: Optional[str] = None
    telefono: Optional[str] = None
    correo: Optional[str] = None
    fecha_registro: str
    
    class Config:
        from_attributes = True
