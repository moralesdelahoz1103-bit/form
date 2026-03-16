from typing import List, Optional, Dict, Any
from azure.cosmos import exceptions
from .base import BaseRepository

class UsuariosRepository(BaseRepository):
    def crear(self, usuario_data: Dict[str, Any]) -> Dict[str, Any]:
        return self.container.create_item(body=usuario_data)
    
    def listar(self) -> List[Dict[str, Any]]:
        query = "SELECT * FROM c ORDER BY c.fecha_ingreso DESC"
        return list(self.container.query_items(query=query, enable_cross_partition_query=True))
    
    def obtener_por_id(self, usuario_id: str) -> Optional[Dict[str, Any]]:
        try:
            return self.container.read_item(item=usuario_id, partition_key=usuario_id)
        except exceptions.CosmosResourceNotFoundError:
            return None
    
    def obtener_por_email(self, email: str) -> Optional[Dict[str, Any]]:
        query = "SELECT * FROM c WHERE LOWER(c.email) = LOWER(@email)"
        parameters = [{"name": "@email", "value": email}]
        items = list(self.container.query_items(query=query, parameters=parameters, enable_cross_partition_query=True))
        return items[0] if items else None
    
    def actualizar(self, usuario_id: str, usuario_data: Dict[str, Any]) -> Dict[str, Any]:
        existing = self.obtener_por_id(usuario_id)
        if not existing:
            raise exceptions.CosmosResourceNotFoundError()
        existing.update(usuario_data)
        return self.container.replace_item(item=usuario_id, body=existing)
    
    def eliminar(self, usuario_id: str) -> None:
        self.container.delete_item(item=usuario_id, partition_key=usuario_id)

class ConfiguracionRepository(BaseRepository):
    def obtener_por_id(self, config_id: str) -> Optional[Dict[str, Any]]:
        try:
            return self.container.read_item(item=config_id, partition_key=config_id)
        except exceptions.CosmosResourceNotFoundError:
            return None
    
    def crear(self, config_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        data["id"] = config_id
        return self.container.create_item(body=data)
    
    def actualizar(self, config_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        data["id"] = config_id
        return self.container.upsert_item(body=data)
