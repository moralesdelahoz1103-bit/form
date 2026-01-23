import os
import random
import re
from pathlib import Path
from app.storage.adapter import StorageAdapter
import logging

logger = logging.getLogger(__name__)
if not logger.handlers:
    # Simple console handler for debugging during development
    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)
    logger.addHandler(ch)


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
    # y caracteres latinos (á, é, í, ó, ú, ñ, etc.)
    filename = re.sub(r'[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ._-]', '_', filename)
    
    # Limitar longitud
    if len(filename) > max_length:
        name, ext = os.path.splitext(filename)
        filename = name[:max_length - len(ext)] + ext
    
    # Asegurar que no quede vacío
    if not filename or filename == '.':
        filename = 'file'
    
    return filename


class LocalStorage(StorageAdapter):
    """
    Local filesystem storage adapter.
    Saves QR codes and signatures to local directories.
    """
    
    def __init__(self):
        # Define storage directories relative to this file to avoid cwd issues
        # backend/app/storage/local.py -> parent.parent.parent = backend
        self.base_dir = Path(__file__).parent.parent.parent / "uploads"
        self.qr_dir = self.base_dir / "qr_codes"
        self.firma_dir = self.base_dir / "firmas"
        
        # Create directories if they don't exist
        self.qr_dir.mkdir(parents=True, exist_ok=True)
        self.firma_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"LocalStorage base_dir: {self.base_dir}")
    
    def save_qr(self, qr_image_bytes: bytes, nombre: str, fecha: str, created_by: str = "") -> str:
        """
        Save QR code to local filesystem.
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
        filepath = self.qr_dir / filename
        
        # Validación adicional: asegurar que el path final está dentro del directorio permitido
        if not filepath.resolve().is_relative_to(self.qr_dir.resolve()):
            raise ValueError("Path traversal detectado en nombre de archivo QR")
        
        # Save file
        with open(filepath, "wb") as f:
            f.write(qr_image_bytes)
        logger.info(f"QR guardado: {filepath}")
        
        return filename
    
    def save_firma(self, firma_image_bytes: bytes, cedula: str, nombre_capacitacion: str = "", created_by: str = "", nombre_persona: str = "") -> str:
        """
        Save signature to local filesystem.
        Filename format: {cedula}.png
        Protegido contra path traversal.
        Note: Local storage doesn't use the new folder structure, kept for backward compatibility.
        """
        # Sanitizar cédula (seguro contra path traversal)
        cedula_clean = sanitize_filename(cedula, max_length=20)
        
        # Create filename
        filename = f"{cedula_clean}.png"
        filepath = self.firma_dir / filename
        
        # Validación adicional: asegurar que el path final está dentro del directorio permitido
        if not filepath.resolve().is_relative_to(self.firma_dir.resolve()):
            raise ValueError("Path traversal detectado en nombre de archivo de firma")
        
        # Save file
        with open(filepath, "wb") as f:
            f.write(firma_image_bytes)
        logger.info(f"Firma guardada: {filepath}")

        return filename
    
    def delete_qr(self, filename: str) -> bool:
        """Delete QR code file from local filesystem."""
        try:
            filepath = self.qr_dir / filename
            if filepath.exists():
                filepath.unlink()
                return True
            return False
        except Exception:
            return False
    
    def delete_firma(self, filename: str) -> bool:
        """Delete signature file from local filesystem."""
        try:
            filepath = self.firma_dir / filename
            if filepath.exists():
                filepath.unlink()
                return True
            return False
        except Exception:
            return False
    
    def get_qr_url(self, filename: str) -> str:
        """
        Get URL to access QR code.
        Returns relative path for local storage.
        """
        return f"/uploads/qr_codes/{filename}"
    
    def get_firma_url(self, filename: str) -> str:
        """
        Get URL to access signature.
        Returns relative path for local storage.
        """
        return f"/uploads/firmas/{filename}"
