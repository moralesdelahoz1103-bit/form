from pydantic_settings import BaseSettings
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # Base
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    
    # Configuración
    ALLOWED_DOMAIN: str = os.getenv("ALLOWED_DOMAIN", "@fundacionsantodomingo.org")
    TOKEN_EXPIRY_DAYS: int = int(os.getenv("TOKEN_EXPIRY_DAYS", "30"))
    MAX_FILE_SIZE: int = int(os.getenv("MAX_FILE_SIZE", "1048576"))
    
    # CosmosDB
    COSMOS_ENDPOINT: str = os.getenv("COSMOS_ENDPOINT", "")
    COSMOS_KEY: str = os.getenv("COSMOS_KEY", "")
    COSMOS_DATABASE_NAME: str = os.getenv("COSMOS_DATABASE_NAME", "formaciones_db")
    
    # Modo de almacenamiento: "json" o "cosmosdb"
    STORAGE_MODE: str = os.getenv("STORAGE_MODE", "json")
    
    class Config:
        case_sensitive = True

settings = Settings()
