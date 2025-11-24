import base64
import os
from PIL import Image
from io import BytesIO
from datetime import datetime
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from core.config import settings
from core.exceptions import InvalidFileException

def ensure_upload_dir():
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

def save_firma(firma_base64: str, cedula: str) -> str:
    """
    Guarda la firma en formato JPG con fondo blanco y retorna la ruta del archivo
    """
    ensure_upload_dir()
    
    try:
        # Remover el prefijo "data:image/png;base64," si existe
        if ',' in firma_base64:
            firma_base64 = firma_base64.split(',')[1]
        
        # Decodificar base64
        firma_bytes = base64.b64decode(firma_base64)
        
        # Validar tamaño
        if len(firma_bytes) > settings.MAX_FILE_SIZE:
            raise InvalidFileException("La firma excede el tamaño máximo permitido")
        
        # Abrir imagen con Pillow
        image = Image.open(BytesIO(firma_bytes))
        
        # Convertir a RGB si tiene transparencia (PNG)
        if image.mode in ('RGBA', 'LA', 'P'):
            # Crear una imagen con fondo blanco
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            # Pegar la imagen sobre el fondo blanco
            background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
            image = background
        elif image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Redimensionar si es muy grande (mantener aspecto)
        max_width = 500
        max_height = 200
        if image.width > max_width or image.height > max_height:
            image.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
        
        # Generar nombre único
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{cedula}_{timestamp}_firma.jpg"
        filepath = os.path.join(settings.UPLOAD_DIR, filename)
        
        # Guardar como JPG con fondo blanco y calidad alta
        image.save(filepath, 'JPEG', quality=95, optimize=True)
        
        return filepath
        
    except Exception as e:
        raise InvalidFileException(f"Error al procesar la firma: {str(e)}")

def delete_firma(filepath: str):
    """
    Elimina un archivo de firma
    """
    try:
        if os.path.exists(filepath):
            os.remove(filepath)
    except Exception as e:
        print(f"Error al eliminar firma: {e}")
