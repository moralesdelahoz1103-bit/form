from typing import List, Optional, Dict, Any
from azure.cosmos import exceptions
from .base import BaseRepository, cosmos_retry

class SesionesRepository(BaseRepository):
    def crear(self, sesion_data: Dict[str, Any]) -> Dict[str, Any]:
        return self.container.create_item(body=sesion_data)
    
    def obtener_por_id(self, sesion_id: str) -> Optional[Dict[str, Any]]:
        try:
            return self.container.read_item(item=sesion_id, partition_key=sesion_id)
        except (exceptions.CosmosResourceNotFoundError, exceptions.CosmosHttpResponseError) as e:
            if getattr(e, 'status_code', 0) == 404 or isinstance(e, exceptions.CosmosResourceNotFoundError):
                return None
            raise
    
    def listar(self, owner_email: Optional[str] = None, tipos_actividad: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        def _query():
            parameters = []
            where_clauses = []
            if owner_email:
                where_clauses.append("c.created_by = @owner")
                parameters.append({"name": "@owner", "value": owner_email})
            if tipos_actividad:
                placeholders = []
                for i, tipo in enumerate(tipos_actividad):
                    p_name = f"@tipo{i}"
                    placeholders.append(p_name)
                    parameters.append({"name": p_name, "value": tipo})
                where_clauses.append(f"c.actividad IN ({', '.join(placeholders)})")
            query = "SELECT * FROM c"
            if where_clauses:
                query += " WHERE " + " AND ".join(where_clauses)
            query += " ORDER BY c.created_at DESC"
            return list(self.container.query_items(query=query, parameters=parameters, enable_cross_partition_query=True))
        return cosmos_retry(_query)

    def listar_admin(self, admin_email: str) -> List[Dict[str, Any]]:
        def _query():
            query = """
                SELECT * FROM c 
                WHERE c.created_by = @admin 
                OR c.actividad IN ('Inducción', 'Formación', 'Capacitación') 
                ORDER BY c.created_at DESC
            """
            parameters = [{"name": "@admin", "value": admin_email}]
            return list(self.container.query_items(query=query, parameters=parameters, enable_cross_partition_query=True))
        return cosmos_retry(_query)
    
    def obtener_por_token(self, token: str) -> Optional[Dict[str, Any]]:
        query = """
            SELECT * FROM c 
            WHERE c.token = @token 
            OR EXISTS(SELECT VALUE oc FROM oc IN c.ocurrencias WHERE oc.token = @token)
        """
        parameters = [{"name": "@token", "value": token}]
        items = list(self.container.query_items(query=query, parameters=parameters, enable_cross_partition_query=True))
        return items[0] if items else None
    
    def actualizar(self, sesion_id: str, sesion_data: Dict[str, Any]) -> Dict[str, Any]:
        return self.container.replace_item(item=sesion_id, body=sesion_data)
    
    def eliminar(self, sesion_id: str) -> None:
        self.container.delete_item(item=sesion_id, partition_key=sesion_id)
