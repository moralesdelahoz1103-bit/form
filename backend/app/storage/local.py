import os
import random
from pathlib import Path
from app.storage.adapter import StorageAdapter
import logging

logger = logging.getLogger(__name__)
if not logger.handlers:
    # Simple console handler for debugging during development
    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)
    logger.addHandler(ch)


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
    
    def save_qr(self, qr_image_bytes: bytes, nombre: str, fecha: str) -> str:
        """
        Save QR code to local filesystem.
        Filename format: {nombre}_{fecha}_XX.png (XX = 2 random digits)
        """
        # Generate 2 random digits
        random_digits = f"{random.randint(0, 99):02d}"
        
        # Clean nombre and fecha to avoid filesystem issues
        nombre_clean = nombre.replace(" ", "_").replace("/", "-")
        fecha_clean = fecha.replace(" ", "_").replace("/", "-")
        
        # Create filename
        filename = f"{nombre_clean}_{fecha_clean}_{random_digits}.png"
        filepath = self.qr_dir / filename
        
        # Save file
        with open(filepath, "wb") as f:
            f.write(qr_image_bytes)
        logger.info(f"QR guardado: {filepath}")
        
        return filename
    
    def save_firma(self, firma_image_bytes: bytes, cedula: str) -> str:
        """
        Save signature to local filesystem.
        Filename format: {cedula}.png
        """
        # Clean cedula to avoid filesystem issues
        cedula_clean = cedula.replace(" ", "_").replace("/", "-")
        
        # Create filename
        filename = f"{cedula_clean}.png"
        filepath = self.firma_dir / filename
        
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
