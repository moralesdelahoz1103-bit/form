import random
import re
import os
from typing import Optional
from azure.storage.blob import BlobServiceClient, ContentSettings
from app.core.config import settings
from app.storage.adapter import StorageAdapter


def sanitize_filename(filename: str, max_length: int = 100) -> str:
    r"""
    Sanitiza nombres de archivos para prevenir ataques de path traversal.
    
    - Elimina caracteres peligrosos: / \ .. : * ? " < > | \0
    - Reemplaza espacios por guiones bajos
    - Limita longitud
    - Solo permite caracteres alfanuméricos, guiones, guiones bajos y puntos
    """
    # Remover caracteres nulos
    filename = filename.replace('\0', '')
    
    # Remover path separators y secuencias peligrosas
    filename = filename.replace('/', '_').replace('\\', '_')
    filename = filename.replace('..', '_').replace(':', '_')
    
    # Remover caracteres peligrosos del sistema de archivos
    dangerous_chars = ['*', '?', '"', '<', '>', '|']
    for char in dangerous_chars:
        filename = filename.replace(char, '_')
    
    # Reemplazar espacios múltiples y espacios por guiones bajos
    filename = re.sub(r'\s+', '_', filename)
    
    # Solo permitir caracteres alfanuméricos, guiones, guiones bajos, puntos
    filename = re.sub(r'[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ._-]', '_', filename)
    
    # Limitar longitud
    if len(filename) > max_length:
        name, ext = os.path.splitext(filename)
        filename = name[:max_length - len(ext)] + ext
    
    # Asegurar que no quede vacío
    if not filename or filename == '.':
        filename = 'file'
    
    return filename


class AzureBlobStorage(StorageAdapter):
    """
    Azure Blob Storage adapter.
    Saves QR codes and signatures to Azure Blob Storage in organized folder structure.
    Container: formatoformacionesoeventos
    Structure:
      - QRS/{created_by}/{nombre_capacitacion}/qr_{timestamp}.png
      - firma/{cedula}/{nombre_capacitacion}/firma.png
    """
    
    def __init__(self):
        if not settings.AZURE_STORAGE_CONNECTION_STRING:
            raise ValueError("AZURE_STORAGE_CONNECTION_STRING not configured")
        
        self.blob_service_client = BlobServiceClient.from_connection_string(
            settings.AZURE_STORAGE_CONNECTION_STRING
        )
        
        # Single container with organized folder structure
        self.container_name = "formatoformacionesoeventos"
        
        # Create container if it doesn't exist
        self._ensure_container()
    
    def _ensure_container(self):
        """Create container if it doesn't exist."""
        try:
            self.blob_service_client.create_container(self.container_name)
        except Exception:
            pass  # Container already exists
    
    def save_qr(self, qr_image_bytes: bytes, nombre: str, fecha: str, created_by: str = "") -> str:
        """
        Save QR code to Azure Blob Storage.
        New structure: {Creator}/{Training}/QR_{Training}.png
        """
        # Sanitizar inputs
        created_by_clean = sanitize_filename(created_by or "unknown", max_length=50)
        nombre_clean = sanitize_filename(nombre, max_length=50)
        
        # Create blob path: Creator/Training/QR_Training.png
        blob_path = f"{created_by_clean}/{nombre_clean}/QR_{nombre_clean}.png"
        
        # Upload to blob
        blob_client = self.blob_service_client.get_blob_client(
            container=self.container_name,
            blob=blob_path
        )
        
        blob_client.upload_blob(
            qr_image_bytes,
            overwrite=True,
            content_settings=ContentSettings(content_type="image/png")
        )
        
        return blob_path
    
    def save_firma(self, firma_image_bytes: bytes, cedula: str, nombre_capacitacion: str = "", created_by: str = "", nombre_persona: str = "") -> str:
        """
        Save signature to Azure Blob Storage.
        New structure: {Creator}/{Training}/Firmas/Firma_{Cedula}.png
        """
        # Sanitizar inputs
        created_by_clean = sanitize_filename(created_by or "unknown", max_length=50)
        nombre_capacitacion_clean = sanitize_filename(nombre_capacitacion or "unknown", max_length=50)
        cedula_clean = sanitize_filename(cedula, max_length=20)
        
        # Create blob path: Creator/Training/Firmas/Firma_{Cedula}.png
        blob_path = f"{created_by_clean}/{nombre_capacitacion_clean}/Firmas/Firma_{cedula_clean}.png"
        
        # Upload to blob
        blob_client = self.blob_service_client.get_blob_client(
            container=self.container_name,
            blob=blob_path
        )
        
        blob_client.upload_blob(
            firma_image_bytes,
            overwrite=True,
            content_settings=ContentSettings(content_type="image/png")
        )
        
        return blob_path
    
    def delete_training_folder(self, created_by: str, nombre_capacitacion: str) -> bool:
        """
        Delete entire training folder including QR and all signatures.
        Used when a training session is deleted.
        
        Deletes: {Creator}/{Training}/ (including QR and Firmas subfolder)
        """
        try:
            # Sanitizar inputs
            created_by_clean = sanitize_filename(created_by, max_length=50)
            nombre_clean = sanitize_filename(nombre_capacitacion, max_length=50)
            
            # Folder prefix to delete
            folder_prefix = f"{created_by_clean}/{nombre_clean}/"
            
            # Get container client
            container_client = self.blob_service_client.get_container_client(self.container_name)
            
            # List all blobs in the folder
            blobs_to_delete = container_client.list_blobs(name_starts_with=folder_prefix)
            
            # Delete each blob
            deleted_count = 0
            for blob in blobs_to_delete:
                blob_client = self.blob_service_client.get_blob_client(
                    container=self.container_name,
                    blob=blob.name
                )
                blob_client.delete_blob()
                deleted_count += 1
            
            return deleted_count > 0
        except Exception:
            # Don't expose error details in production
            return False
    
    def delete_qr(self, filename: str) -> bool:
        """Delete QR code blob from Azure Storage."""
        try:
            blob_client = self.blob_service_client.get_blob_client(
                container=self.container_name,
                blob=filename
            )
            blob_client.delete_blob()
            return True
        except Exception:
            return False
    
    def delete_firma(self, filename: str) -> bool:
        """Delete signature blob from Azure Storage."""
        try:
            blob_client = self.blob_service_client.get_blob_client(
                container=self.container_name,
                blob=filename
            )
            blob_client.delete_blob()
            return True
        except Exception:
            return False
    
    def get_blob_url_with_sas(self, filename: str) -> str:
        """
        Get direct Azure Blob URL with SAS token.
        Used internally by the proxy endpoint to fetch blobs.
        """
        from datetime import datetime, timedelta
        from azure.storage.blob import generate_blob_sas, BlobSasPermissions
        
        blob_client = self.blob_service_client.get_blob_client(
            container=self.container_name,
            blob=filename
        )
        
        # Generate SAS token with 24-hour expiration
        sas_token = generate_blob_sas(
            account_name=self.blob_service_client.account_name,
            container_name=self.container_name,
            blob_name=filename,
            account_key=self.blob_service_client.credential.account_key,
            permission=BlobSasPermissions(read=True),
            expiry=datetime.utcnow() + timedelta(hours=24)
        )
        
        # Return URL with SAS token
        return f"{blob_client.url}?{sas_token}"
    
    def get_qr_url(self, filename: str) -> str:
        """
        Get URL to access QR code through backend proxy.
        Returns backend proxy URL to avoid CORS issues.
        """
        # Return proxy URL through backend instead of direct Azure URL
        # This avoids CORS issues when fetching from frontend
        return f"/api/proxy/blob/{filename}"
    
    def get_firma_url(self, filename: str) -> str:
        """
        Get URL to access signature through backend proxy.
        Returns backend proxy URL to avoid CORS issues.
        """
        # Return proxy URL through backend instead of direct Azure URL
        # This avoids CORS issues when fetching from frontend
        return f"/api/proxy/blob/{filename}"
