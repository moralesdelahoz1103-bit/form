from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UsuarioBase(BaseModel):
    nombre: str
    rol: str = "Usuario"  # Usuario (por defecto), Editor, Administrador

class UsuarioCreate(BaseModel):
    nombre: str
    rol: str = "Usuario"

class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    rol: Optional[str] = None

class Usuario(BaseModel):
    id: str
    nombre: str
    rol: str
    fecha_ingreso: datetime

    class Config:
        from_attributes = True
