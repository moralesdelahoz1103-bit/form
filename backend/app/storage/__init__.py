from app.core.config import settings
from app.storage.adapter import StorageAdapter


def get_storage_adapter() -> StorageAdapter:
    """
    Factory function to get the appropriate storage adapter based on configuration.
    Returns LocalStorage or AzureBlobStorage depending on BLOB_STORAGE_MODE setting.
    """
    storage_mode = settings.BLOB_STORAGE_MODE.lower()
    
    if storage_mode == "azure":
        from app.storage.azure_blob import AzureBlobStorage
        return AzureBlobStorage()
    elif storage_mode == "local":
        from app.storage.local import LocalStorage
        return LocalStorage()
    else:
        raise ValueError(f"Invalid BLOB_STORAGE_MODE: {storage_mode}. Must be 'local' or 'azure'")
