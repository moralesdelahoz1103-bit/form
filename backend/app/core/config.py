from pydantic_settings import BaseSettings
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # Base - Detectar automáticamente el dominio en Vercel
    BASE_URL: str = os.getenv("VERCEL_URL", os.getenv("BASE_URL", "http://localhost:3000"))
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    
    # Si estamos en Vercel, usar el dominio con https
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if os.getenv("VERCEL_URL"):
            self.BASE_URL = f"https://{os.getenv('VERCEL_URL')}"
    
    # Configuración
    ALLOWED_DOMAIN: str = os.getenv("ALLOWED_DOMAIN", "@fundacionsantodomingo.org")
    TOKEN_EXPIRY_DAYS: int = int(os.getenv("TOKEN_EXPIRY_DAYS", "30"))
    MAX_FILE_SIZE: int = int(os.getenv("MAX_FILE_SIZE", "1048576"))
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads/firmas")
    
    class Config:
        case_sensitive = True

settings = Settings()
