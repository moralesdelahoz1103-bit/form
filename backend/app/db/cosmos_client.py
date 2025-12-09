from azure.cosmos import CosmosClient, PartitionKey, exceptions
from typing import List, Optional, Dict, Any
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from core.config import settings

class CosmosDBClient:
    def __init__(self):
        self.client = CosmosClient(settings.COSMOS_ENDPOINT, settings.COSMOS_KEY)
        self.database_name = settings.COSMOS_DATABASE_NAME
        self.database = None
        self.sesiones_container = None
        self.asistentes_container = None
        self._initialize_database()
    
    def _initialize_database(self):
        """Inicializar base de datos y contenedores"""
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
            
            print("✅ CosmosDB inicializado correctamente")
        except exceptions.CosmosHttpResponseError as e:
            print(f"❌ Error inicializando CosmosDB: {e}")
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
    
    def listar_sesiones(self) -> List[Dict[str, Any]]:
        """Listar todas las sesiones"""
        try:
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

# Instancia global
cosmos_db = CosmosDBClient()
