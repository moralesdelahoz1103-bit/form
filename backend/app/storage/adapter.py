from abc import ABC, abstractmethod
from typing import Optional


class StorageAdapter(ABC):
    """
    Abstract base class for storage adapters.
    Provides interface for saving QR codes and signatures (firmas) to different storage backends.
    """
    
    @abstractmethod
    def save_qr(self, qr_image_bytes: bytes, nombre: str, fecha: str) -> str:
        """
        Save QR code image to storage.
        
        Args:
            qr_image_bytes: QR code image as bytes
            nombre: Name for the session (used in filename)
            fecha: Date string (used in filename)
            
        Returns:
            URL or path to access the saved QR code
            
        Filename format: {nombre}_{fecha}_XX.png (XX = 2 random digits)
        """
        pass
    
    @abstractmethod
    def save_firma(self, firma_image_bytes: bytes, cedula: str) -> str:
        """
        Save signature (firma) image to storage.
        
        Args:
            firma_image_bytes: Signature image as bytes
            cedula: ID number of the person (used as filename)
            
        Returns:
            URL or path to access the saved signature
            
        Filename format: {cedula}.png
        """
        pass
    
    @abstractmethod
    def delete_qr(self, filename: str) -> bool:
        """
        Delete QR code from storage.
        
        Args:
            filename: Name of the file to delete
            
        Returns:
            True if deleted successfully, False otherwise
        """
        pass
    
    @abstractmethod
    def delete_firma(self, filename: str) -> bool:
        """
        Delete signature from storage.
        
        Args:
            filename: Name of the file to delete
            
        Returns:
            True if deleted successfully, False otherwise
        """
        pass
    
    @abstractmethod
    def get_qr_url(self, filename: str) -> str:
        """
        Get URL to access a QR code.
        
        Args:
            filename: Name of the QR file
            
        Returns:
            URL or path to access the QR code
        """
        pass
    
    @abstractmethod
    def get_firma_url(self, filename: str) -> str:
        """
        Get URL to access a signature.
        
        Args:
            filename: Name of the firma file
            
        Returns:
            URL or path to access the signature
        """
        pass
