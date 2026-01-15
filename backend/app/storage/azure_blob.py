import random
import re
import os
from typing import Optional
from azure.storage.blob import BlobServiceClient, ContentSettings
from app.core.config import settings
from app.storage.adapter import StorageAdapter


def sanitize_filename(filename: str, max_length: int = 100) -> str:
    """
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
    Saves QR codes and signatures to Azure Blob Storage containers.
    """
    
    def __init__(self):
        if not settings.AZURE_STORAGE_CONNECTION_STRING:
            raise ValueError("AZURE_STORAGE_CONNECTION_STRING not configured")
        
        self.blob_service_client = BlobServiceClient.from_connection_string(
            settings.AZURE_STORAGE_CONNECTION_STRING
        )
        
        # Container names
        self.qr_container = "qr-codes"
        self.firma_container = "firmas"
        
        # Create containers if they don't exist
        self._ensure_containers()
    
    def _ensure_containers(self):
        """Create containers if they don't exist."""
        try:
            self.blob_service_client.create_container(self.qr_container)
        except Exception:
            pass  # Container already exists
        
        try:
            self.blob_service_client.create_container(self.firma_container)
        except Exception:
            pass  # Container already exists
    
    def save_qr(self, qr_image_bytes: bytes, nombre: str, fecha: str) -> str:
        """
        Save QR code to Azure Blob Storage.
        Filename format: {nombre}_{fecha}_XX.png (XX = 2 random digits)
        Protegido contra path traversal.
        """
        # Generate 2 random digits
        random_digits = f"{random.randint(0, 99):02d}"
        
        # Sanitizar nombre y fecha (seguro contra path traversal)
        nombre_clean = sanitize_filename(nombre, max_length=50)
        fecha_clean = sanitize_filename(fecha, max_length=20)
        
        # Create filename
        filename = f"{nombre_clean}_{fecha_clean}_{random_digits}.png"
        
        # Upload to blob
        blob_client = self.blob_service_client.get_blob_client(
            container=self.qr_container,
            blob=filename
        )
        
        blob_client.upload_blob(
            qr_image_bytes,
            overwrite=True,
            content_settings=ContentSettings(content_type="image/png")
        )
        
        return filename
    
    def save_firma(self, firma_image_bytes: bytes, cedula: str) -> str:
        """
        Save signature to Azure Blob Storage.
        Filename format: {cedula}.png
        Protegido contra path traversal.
        """
        # Sanitizar cédula (seguro contra path traversal)
        cedula_clean = sanitize_filename(cedula, max_length=20)
        
        # Create filename
        filename = f"{cedula_clean}.png"
        
        # Upload to blob
        blob_client = self.blob_service_client.get_blob_client(
            container=self.firma_container,
            blob=filename
        )
        
        blob_client.upload_blob(
            firma_image_bytes,
            overwrite=True,
            content_settings=ContentSettings(content_type="image/png")
        )
        
        return filename
    
    def delete_qr(self, filename: str) -> bool:
        """Delete QR code blob from Azure Storage."""
        try:
            blob_client = self.blob_service_client.get_blob_client(
                container=self.qr_container,
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
                container=self.firma_container,
                blob=filename
            )
            blob_client.delete_blob()
            return True
        except Exception:
            return False
    
    def get_qr_url(self, filename: str) -> str:
        """
        Get URL to access QR code in Azure Blob Storage.
        Returns public blob URL.
        """
        blob_client = self.blob_service_client.get_blob_client(
            container=self.qr_container,
            blob=filename
        )
        return blob_client.url
    
    def get_firma_url(self, filename: str) -> str:
        """
        Get URL to access signature in Azure Blob Storage.
        Returns public blob URL.
        """
        blob_client = self.blob_service_client.get_blob_client(
            container=self.firma_container,
            blob=filename
        )
        return blob_client.url
