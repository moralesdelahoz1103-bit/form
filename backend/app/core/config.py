from pydantic_settings import BaseSettings
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # Base
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    
    # Configuración
    ALLOWED_DOMAIN: str = os.getenv("ALLOWED_DOMAIN", "@fundacionsantodomingo.org")
    TOKEN_EXPIRY_DAYS: int = int(os.getenv("TOKEN_EXPIRY_DAYS", "30"))
    MAX_FILE_SIZE: int = int(os.getenv("MAX_FILE_SIZE", "1048576"))

    # Entra ID (MSAL) - Backend Authentication
    ENTRA_CLIENT_ID: str = os.getenv("ENTRA_CLIENT_ID", "")
    ENTRA_TENANT_ID: str = os.getenv("ENTRA_TENANT_ID", "common")
    ENTRA_CLIENT_SECRET: str = os.getenv("ENTRA_CLIENT_SECRET", "")
    ENTRA_AUTHORITY: str = f"https://login.microsoftonline.com/{os.getenv('ENTRA_TENANT_ID', 'common')}"
    # Optional fixed redirect URI for the auth callback. If empty, the backend will build it from the incoming request.
    ENTRA_REDIRECT_URI: str = os.getenv("ENTRA_REDIRECT_URI", "")
    ENTRA_SCOPES: list = ["User.Read"]
    
    # Session Secret para JWT
    SESSION_SECRET: str = os.getenv("SESSION_SECRET", "change-this-to-a-secure-random-string")
    
    # CosmosDB
    COSMOS_ENDPOINT: str = os.getenv("COSMOS_ENDPOINT", "")
    COSMOS_KEY: str = os.getenv("COSMOS_KEY", "")
    COSMOS_DATABASE_NAME: str = os.getenv("COSMOS_DATABASE_NAME", "formaciones_db")
    
    # Modo de almacenamiento: "json" o "cosmosdb"
    STORAGE_MODE: str = os.getenv("STORAGE_MODE", "json")
    
    # Blob Storage Mode: "local" o "azure"
    BLOB_STORAGE_MODE: str = os.getenv("BLOB_STORAGE_MODE", "local")
    
    # Azure Blob Storage (opcional, solo si BLOB_STORAGE_MODE="azure")
    AZURE_STORAGE_CONNECTION_STRING: str = os.getenv("AZURE_STORAGE_CONNECTION_STRING", "")
    
    class Config:
        case_sensitive = True

settings = Settings()
