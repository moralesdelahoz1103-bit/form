from azure.cosmos import CosmosClient, PartitionKey, exceptions
from typing import List, Optional, Dict, Any
import sys
from pathlib import Path
import time
sys.path.append(str(Path(__file__).parent.parent))

from core.config import settings

class CosmosDBClient:
    def __init__(self):
        # Configurar cliente de CosmosDB
        self.client = CosmosClient(
            settings.COSMOS_ENDPOINT, 
            settings.COSMOS_KEY
        )
        self.database_name = settings.COSMOS_DATABASE_NAME
        self.database = None
        self.sesiones_container = None
        self.asistentes_container = None
        self._initialize_database()
    
    def _initialize_database(self):
        """Inicializar base de datos y contenedores con reintentos"""
        max_retries = 3
        retry_delay = 2
        
        for attempt in range(max_retries):
            try:
                # Crear base de datos si no existe
                self.database = self.client.create_database_if_not_exists(id=self.database_name)
                
                # Crear contenedor de sesiones (sin throughput para cuentas serverless)
                self.sesiones_container = self.database.create_container_if_not_exists(
                    id="sesiones",
                    partition_key=PartitionKey(path="/id")
                )
                
                # Crear contenedor de asistentes (sin throughput para cuentas serverless)
                self.asistentes_container = self.database.create_container_if_not_exists(
                    id="asistentes",
                    partition_key=PartitionKey(path="/sesion_id")
                )
                
                # Crear contenedor de usuarios del sistema
                self.usuarios_container = self.database.create_container_if_not_exists(
                    id="usuarios",
                    partition_key=PartitionKey(path="/id")
                )
                
                # Crear contenedor de configuración (permisos, etc.)
                self.configuracion_container = self.database.create_container_if_not_exists(
                    id="configuracion",
                    partition_key=PartitionKey(path="/id")
                )
                
                print("✅ CosmosDB inicializado correctamente")
                return
                
            except (exceptions.CosmosHttpResponseError, Exception) as e:
                if attempt < max_retries - 1:
                    print(f"⚠️  Intento {attempt + 1}/{max_retries} fallido. Reintentando en {retry_delay}s...")
                    time.sleep(retry_delay)
                    retry_delay *= 2  # Exponential backoff
                else:
                    print(f"❌ Error inicializando CosmosDB después de {max_retries} intentos: {e}")
                    raise
    
    # ========== OPERACIONES SESIONES ==========
    
    def crear_sesion(self, sesion_data: Dict[str, Any]) -> Dict[str, Any]:
        """Crear una nueva sesión"""
        try:
            return self.sesiones_container.create_item(body=sesion_data)
        except exceptions.CosmosHttpResponseError as e:
            print(f"Error creando sesión: {e}")
            raise
    
    def obtener_sesion(self, sesion_id: str) -> Optional[Dict[str, Any]]:
        """Obtener sesión por ID"""
        try:
            return self.sesiones_container.read_item(item=sesion_id, partition_key=sesion_id)
        except exceptions.CosmosResourceNotFoundError:
            return None
        except exceptions.CosmosHttpResponseError as e:
            print(f"Error obteniendo sesión: {e}")
            raise
    
    def listar_sesiones(self, owner_email: Optional[str] = None) -> List[Dict[str, Any]]:
        """Listar sesiones. Si se pasa owner_email, filtra solo las sesiones creadas por ese email."""
        try:
            if owner_email:
                query = "SELECT * FROM c WHERE c.created_by = @owner ORDER BY c.created_at DESC"
                parameters = [{"name": "@owner", "value": owner_email}]
                items = list(self.sesiones_container.query_items(
                    query=query,
                    parameters=parameters,
                    enable_cross_partition_query=True
                ))
            else:
                query = "SELECT * FROM c ORDER BY c.created_at DESC"
                items = list(self.sesiones_container.query_items(
                    query=query,
                    enable_cross_partition_query=True
                ))
            return items
        except exceptions.CosmosHttpResponseError as e:
            print(f"Error listando sesiones: {e}")
            raise
    
    def obtener_sesion_por_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Obtener sesión por token"""
        try:
            query = "SELECT * FROM c WHERE c.token = @token"
            parameters = [{"name": "@token", "value": token}]
            items = list(self.sesiones_container.query_items(
                query=query,
                parameters=parameters,
                enable_cross_partition_query=True
            ))
            return items[0] if items else None
        except exceptions.CosmosHttpResponseError as e:
            print(f"Error obteniendo sesión por token: {e}")
            raise
    
    def actualizar_sesion(self, sesion_id: str, sesion_data: Dict[str, Any]) -> Dict[str, Any]:
        """Actualizar sesión"""
        try:
            return self.sesiones_container.replace_item(item=sesion_id, body=sesion_data)
        except exceptions.CosmosHttpResponseError as e:
            print(f"Error actualizando sesión: {e}")
            raise
    
    def eliminar_sesion(self, sesion_id: str) -> None:
        """Eliminar sesión"""
        try:
            self.sesiones_container.delete_item(item=sesion_id, partition_key=sesion_id)
        except exceptions.CosmosHttpResponseError as e:
            print(f"Error eliminando sesión: {e}")
            raise
    
    # ========== OPERACIONES ASISTENTES ==========
    
    def crear_asistente(self, asistente_data: Dict[str, Any]) -> Dict[str, Any]:
        """Crear un nuevo asistente"""
        try:
            return self.asistentes_container.create_item(body=asistente_data)
        except exceptions.CosmosHttpResponseError as e:
            print(f"Error creando asistente: {e}")
            raise
    
    def obtener_asistente(self, asistente_id: str, sesion_id: str) -> Optional[Dict[str, Any]]:
        """Obtener asistente por ID"""
        try:
            return self.asistentes_container.read_item(item=asistente_id, partition_key=sesion_id)
        except exceptions.CosmosResourceNotFoundError:
            return None
        except exceptions.CosmosHttpResponseError as e:
            print(f"Error obteniendo asistente: {e}")
            raise
    
    def listar_asistentes_por_sesion(self, sesion_id: str) -> List[Dict[str, Any]]:
        """Listar asistentes de una sesión"""
        try:
            query = "SELECT * FROM c WHERE c.sesion_id = @sesion_id ORDER BY c.fecha_registro ASC"
            parameters = [{"name": "@sesion_id", "value": sesion_id}]
            items = list(self.asistentes_container.query_items(
                query=query,
                parameters=parameters,
                partition_key=sesion_id
            ))
            return items
        except exceptions.CosmosHttpResponseError as e:
            print(f"Error listando asistentes: {e}")
            raise
    
    def verificar_asistente_duplicado(self, cedula: str, token: str) -> bool:
        """Verificar si un asistente ya está registrado"""
        try:
            query = "SELECT * FROM c WHERE c.cedula = @cedula AND c.token = @token"
            parameters = [
                {"name": "@cedula", "value": cedula},
                {"name": "@token", "value": token}
            ]
            items = list(self.asistentes_container.query_items(
                query=query,
                parameters=parameters,
                enable_cross_partition_query=True
            ))
            return len(items) > 0
        except exceptions.CosmosHttpResponseError as e:
            print(f"Error verificando duplicado: {e}")
            raise
    
    def eliminar_asistentes_por_sesion(self, sesion_id: str) -> None:
        """Eliminar todos los asistentes de una sesión"""
        try:
            asistentes = self.listar_asistentes_por_sesion(sesion_id)
            for asistente in asistentes:
                self.asistentes_container.delete_item(
                    item=asistente['id'],
                    partition_key=sesion_id
                )
        except exceptions.CosmosHttpResponseError as e:
            print(f"Error eliminando asistentes: {e}")
            raise
    
    # ========== OPERACIONES USUARIOS DEL SISTEMA ==========
    
    def crear_usuario(self, usuario_data: Dict[str, Any]) -> Dict[str, Any]:
        """Crear un nuevo usuario del sistema"""
        try:
            return self.usuarios_container.create_item(body=usuario_data)
        except exceptions.CosmosHttpResponseError as e:
            print(f"Error creando usuario: {e}")
            raise
    
    def listar_usuarios(self) -> List[Dict[str, Any]]:
        """Listar todos los usuarios del sistema"""
        try:
            query = "SELECT * FROM c ORDER BY c.fecha_ingreso DESC"
            items = list(self.usuarios_container.query_items(
                query=query,
                enable_cross_partition_query=True
            ))
            return items
        except exceptions.CosmosHttpResponseError as e:
            print(f"Error listando usuarios: {e}")
            raise
    
    def obtener_usuario_por_id(self, usuario_id: str) -> Optional[Dict[str, Any]]:
        """Obtener un usuario por ID"""
        try:
            return self.usuarios_container.read_item(item=usuario_id, partition_key=usuario_id)
        except exceptions.CosmosResourceNotFoundError:
            return None
        except exceptions.CosmosHttpResponseError as e:
            print(f"Error obteniendo usuario: {e}")
            raise
    
    def obtener_usuario_por_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Obtener un usuario por email (mantener para compatibilidad)"""
        try:
            query = "SELECT * FROM c WHERE LOWER(c.email) = LOWER(@email)"
            parameters = [{"name": "@email", "value": email}]
            items = list(self.usuarios_container.query_items(
                query=query,
                parameters=parameters,
                enable_cross_partition_query=True
            ))
            return items[0] if items else None
        except exceptions.CosmosHttpResponseError as e:
            print(f"Error obteniendo usuario: {e}")
            raise
    
    def actualizar_usuario(self, usuario_id: str, usuario_data: Dict[str, Any]) -> Dict[str, Any]:
        """Actualizar un usuario del sistema"""
        try:
            existing = self.usuarios_container.read_item(item=usuario_id, partition_key=usuario_id)
            existing.update(usuario_data)
            return self.usuarios_container.replace_item(item=usuario_id, body=existing)
        except exceptions.CosmosHttpResponseError as e:
            print(f"Error actualizando usuario: {e}")
            raise
    
    def eliminar_usuario(self, usuario_id: str) -> None:
        """Eliminar un usuario del sistema"""
        try:
            self.usuarios_container.delete_item(item=usuario_id, partition_key=usuario_id)
        except exceptions.CosmosHttpResponseError as e:
            print(f"Error eliminando usuario: {e}")
            raise
    
    # Métodos para gestión de permisos
    def obtener_permisos(self) -> dict:
        """Obtener configuración de permisos de roles"""
        try:
            return self.configuracion_container.read_item(
                item="permisos_roles",
                partition_key="permisos_roles"
            )
        except exceptions.CosmosResourceNotFoundError:
            return None
        except exceptions.CosmosHttpResponseError as e:
            print(f"Error obteniendo permisos: {e}")
            raise
    
    def crear_permisos(self, permisos_data: dict) -> dict:
        """Crear configuración inicial de permisos"""
        try:
            permisos_data["id"] = "permisos_roles"
            return self.configuracion_container.create_item(body=permisos_data)
        except exceptions.CosmosHttpResponseError as e:
            print(f"Error creando permisos: {e}")
            raise
    
    def actualizar_permisos(self, permisos_data: dict) -> dict:
        """Actualizar configuración de permisos"""
        try:
            permisos_data["id"] = "permisos_roles"
            return self.configuracion_container.upsert_item(body=permisos_data)
        except exceptions.CosmosHttpResponseError as e:
            print(f"Error actualizando permisos: {e}")
            raise

# Instancia global con lazy initialization
_cosmos_db_instance = None

def get_cosmos_db():
    """Obtener instancia de CosmosDB con lazy initialization"""
    global _cosmos_db_instance
    if _cosmos_db_instance is None:
        try:
            _cosmos_db_instance = CosmosDBClient()
        except Exception as e:
            print(f"⚠️ CosmosDB no disponible: {e}")
            _cosmos_db_instance = None
    return _cosmos_db_instance

# Para compatibilidad con código existente - devuelve la instancia
cosmos_db = get_cosmos_db()
