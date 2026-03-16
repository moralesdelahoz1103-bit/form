from core.config import settings
from storage.adapter import StorageAdapter


def get_storage_adapter() -> StorageAdapter:
    """
    Factory function to get the appropriate storage adapter based on configuration.
    Returns LocalStorage or AzureBlobStorage depending on BLOB_STORAGE_MODE setting.
    """
    storage_mode = settings.BLOB_STORAGE_MODE.lower()
    
    if storage_mode == "azure":
        from storage.azure_blob import AzureBlobAdapter
        return AzureBlobAdapter()
    elif storage_mode == "local":
        from storage.local import LocalStorageAdapter
        return LocalStorageAdapter()
    else:
        raise ValueError(f"Invalid BLOB_STORAGE_MODE: {storage_mode}. Must be 'local' or 'azure'")
