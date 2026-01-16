from typing import Dict, Any
from datetime import datetime
from fastapi import HTTPException
from app.db.cosmos_client import get_cosmos_db


async def verificar_permiso(user_email: str, permiso: str) -> bool:
    """
    Verificar si un usuario tiene un permiso específico.
    Lanza HTTPException 403 si no tiene el permiso.
    
    Args:
        user_email: Email del usuario a verificar
        permiso: Nombre del permiso a verificar
        
    Returns:
        True si el usuario tiene el permiso
        
    Raises:
        HTTPException: 403 si no tiene permiso, 404 si usuario no existe
    """
    try:
        cosmos_db = get_cosmos_db()
        
        # Obtener usuario
        usuario = cosmos_db.obtener_usuario_por_email(user_email)
        if not usuario:
            raise HTTPException(
                status_code=404,
                detail="Usuario no encontrado en el sistema"
            )
        
        # Obtener rol del usuario
        rol = usuario.get("rol", "Usuario")
        
        # Obtener permisos del rol
        service = PermisosService()
        permisos = service.obtener_permisos()
        
        # Verificar si el rol tiene el permiso
        tiene_permiso = permisos.get(rol, {}).get(permiso, False)
        
        if not tiene_permiso:
            raise HTTPException(
                status_code=403,
                detail=f"No tienes permiso para: {permiso}"
            )
        
        return True
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al verificar permiso: {str(e)}"
        )


class PermisosService:
    """Servicio para gestionar permisos y roles del sistema"""
    
    def __init__(self):
        self.cosmos_db = get_cosmos_db()
        self.permisos_id = "permisos_roles"
        
    def obtener_permisos(self) -> Dict[str, Dict[str, bool]]:
        """
        Obtener la configuración de permisos del sistema.
        Si no existe en DB, crea la configuración por defecto.
        
        Returns:
            Diccionario con permisos por rol
        """
        try:
            if not self.cosmos_db:
                return self._permisos_por_defecto()
                
            permisos_doc = self.cosmos_db.obtener_permisos()
            
            if permisos_doc:
                return permisos_doc.get("permisos", self._permisos_por_defecto())
            else:
                # Si no existe, crear con valores por defecto
                return self._crear_permisos_iniciales()
                
        except Exception as e:
            print(f"Error obteniendo permisos: {e}")
            return self._permisos_por_defecto()
    
    def actualizar_permisos(self, permisos: Dict[str, Dict[str, bool]], user_email: str) -> Dict[str, Any]:
        """
        Actualizar la configuración de permisos en la base de datos.
        
        Args:
            permisos: Nueva configuración de permisos
            user_email: Email del usuario que realiza la modificación
            
        Returns:
            Documento actualizado
            
        Raises:
            Exception: Si la base de datos no está disponible
        """
        if not self.cosmos_db:
            raise Exception("Base de datos no disponible")
            
        permisos_doc = {
            "id": self.permisos_id,
            "tipo": "configuracion",
            "permisos": permisos,
            "fecha_modificacion": datetime.utcnow().isoformat(),
            "modificado_por": user_email
        }
        
        return self.cosmos_db.actualizar_permisos(permisos_doc)
    
    def restablecer_permisos_defecto(self, user_email: str) -> Dict[str, Any]:
        """
        Restablecer los permisos a sus valores por defecto.
        
        Args:
            user_email: Email del usuario que realiza la operación
            
        Returns:
            Documento con permisos por defecto
            
        Raises:
            Exception: Si la base de datos no está disponible
        """
        permisos_default = self._permisos_por_defecto()
        return self.actualizar_permisos(permisos_default, user_email)
    
    def _crear_permisos_iniciales(self) -> Dict[str, Dict[str, bool]]:
        """
        Crear permisos iniciales en la base de datos con valores por defecto.
        
        Returns:
            Permisos por defecto del sistema
        """
        permisos_default = self._permisos_por_defecto()
        
        if not self.cosmos_db:
            return permisos_default
        
        permisos_doc = {
            "id": self.permisos_id,
            "tipo": "configuracion",
            "permisos": permisos_default,
            "fecha_modificacion": datetime.utcnow().isoformat(),
            "modificado_por": "system"
        }
        
        try:
            self.cosmos_db.crear_permisos(permisos_doc)
        except Exception as e:
            print(f"Error creando permisos iniciales: {e}")
            
        return permisos_default
    
    def _permisos_por_defecto(self) -> Dict[str, Dict[str, bool]]:
        """
        Definición de permisos por defecto para cada rol del sistema.
        
        Roles:
            - Usuario: Acceso básico, solo lectura
            - Administrador: Control total del sistema
            
        Returns:
            Diccionario con permisos por rol
        """
        return {
            "Usuario": {
                "ver_sesiones": True,
                "crear_sesiones": True,
                "editar_sesiones": True,
                "eliminar_sesiones": True,
                "exportar_sesiones": True,
                "ver_usuarios": False,
                "cambiar_roles": False,
                "eliminar_usuarios": False,
                "acceder_config": False,
                "modificar_permisos": False,
            },
            "Administrador": {
                "ver_sesiones": True,
                "crear_sesiones": True,
                "editar_sesiones": True,
                "eliminar_sesiones": True,
                "exportar_sesiones": True,
                "ver_usuarios": True,
                "cambiar_roles": True,
                "eliminar_usuarios": True,
                "acceder_config": True,
                "modificar_permisos": True,
            }
        }
    
    def verificar_permiso_rol(self, rol: str, permiso: str) -> bool:
        """
        Verificar si un rol específico tiene un permiso.
        
        Args:
            rol: Nombre del rol
            permiso: Nombre del permiso a verificar
            
        Returns:
            True si el rol tiene el permiso, False en caso contrario
        """
        permisos = self.obtener_permisos()
        return permisos.get(rol, {}).get(permiso, False)
    
    def obtener_permisos_usuario(self, user_email: str) -> Dict[str, bool]:
        """
        Obtener todos los permisos de un usuario específico.
        
        Args:
            user_email: Email del usuario
            
        Returns:
            Diccionario con los permisos del usuario
        """
        try:
            if not self.cosmos_db:
                return {}
                
            usuario = self.cosmos_db.obtener_usuario_por_email(user_email)
            if not usuario:
                return {}
            
            rol = usuario.get("rol", "Usuario")
            permisos = self.obtener_permisos()
            
            return permisos.get(rol, {})
            
        except Exception as e:
            print(f"Error obteniendo permisos de usuario: {e}")
            return {}


# Instancia global del servicio de permisos
permisos_service = PermisosService()
