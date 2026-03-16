from typing import List, Optional, Dict, Any
from azure.cosmos import exceptions
from .base import BaseRepository

class AsistentesRepository(BaseRepository):
    def crear(self, asistente_data: Dict[str, Any]) -> Dict[str, Any]:
        return self.container.create_item(body=asistente_data)
    
    def obtener_por_id(self, asistente_id: str, sesion_id: str) -> Optional[Dict[str, Any]]:
        try:
            return self.container.read_item(item=asistente_id, partition_key=sesion_id)
        except exceptions.CosmosResourceNotFoundError:
            return None
    
    def listar_por_sesion(self, sesion_id: str) -> List[Dict[str, Any]]:
        query = "SELECT * FROM c WHERE c.sesion_id = @sesion_id ORDER BY c.fecha_registro ASC"
        parameters = [{"name": "@sesion_id", "value": sesion_id}]
        return list(self.container.query_items(query=query, parameters=parameters, partition_key=sesion_id))
    
    def verificar_duplicado(self, cedula: str, token: str) -> bool:
        query = "SELECT * FROM c WHERE c.cedula = @cedula AND c.token = @token"
        parameters = [{"name": "@cedula", "value": cedula}, {"name": "@token", "value": token}]
        items = list(self.container.query_items(query=query, parameters=parameters, enable_cross_partition_query=True))
        return len(items) > 0
    
    def eliminar_por_sesion(self, sesion_id: str) -> None:
        asistentes = self.listar_por_sesion(sesion_id)
        for asistente in asistentes:
            self.container.delete_item(item=asistente['id'], partition_key=sesion_id)
