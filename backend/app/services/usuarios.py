import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from db.cosmos_client import get_cosmos_db
from datetime import datetime
import uuid

class UsuarioService:
    def __init__(self):
        self.cosmos_db = get_cosmos_db()
    
    def registrar_o_actualizar_usuario(self, user_id: str, nombre: str):
        """Registrar un usuario nuevo o actualizar su última sesión"""
        usuario_existente = self.obtener_usuario_por_id(user_id)
        
        if usuario_existente:
            # Usuario ya existe, solo retornar sus datos
            return usuario_existente
        else:
            # Usuario nuevo, registrar con rol por defecto
            usuario_data = {
                "id": user_id,
                "nombre": nombre,
                "rol": "Usuario",
                "fecha_ingreso": datetime.utcnow().isoformat()
            }
            return self.cosmos_db.crear_usuario(usuario_data)
    
    def crear_usuario(self, nombre: str, rol: str = "Usuario"):
        """Crear un nuevo usuario del sistema manualmente"""
        usuario_id = str(uuid.uuid4())
        usuario_data = {
            "id": usuario_id,
            "nombre": nombre,
            "rol": rol,
            "fecha_ingreso": datetime.utcnow().isoformat()
        }
        return self.cosmos_db.crear_usuario(usuario_data)
    
    def listar_usuarios(self):
        """Listar todos los usuarios del sistema"""
        return self.cosmos_db.listar_usuarios()
    
    def obtener_usuario_por_id(self, usuario_id: str):
        """Obtener un usuario por ID"""
        return self.cosmos_db.obtener_usuario_por_id(usuario_id)
    
    def obtener_usuario_por_email(self, email: str):
        """Obtener un usuario por email (mantener por compatibilidad)"""
        return self.cosmos_db.obtener_usuario_por_email(email)
    
    def actualizar_usuario(self, usuario_id: str, **kwargs):
        """Actualizar un usuario del sistema"""
        update_data = {k: v for k, v in kwargs.items() if v is not None}
        if update_data:
            return self.cosmos_db.actualizar_usuario(usuario_id, update_data)
        return None
    
    def eliminar_usuario(self, usuario_id: str):
        """Eliminar un usuario del sistema"""
        return self.cosmos_db.eliminar_usuario(usuario_id)
    
    def obtener_rol_usuario(self, usuario_id: str):
        """Obtener el rol de un usuario"""
        usuario = self.obtener_usuario_por_id(usuario_id)
        return usuario.get("rol") if usuario else "Usuario"
    
    def verificar_acceso_usuario(self, email: str):
        """Verificar si un usuario tiene acceso al sistema - Acceso abierto a todos"""
        # Permitir acceso a cualquier usuario autenticado
        return True, "autorizado"

usuario_service = UsuarioService()
