import time
from azure.core.exceptions import ServiceResponseError
from azure.cosmos import exceptions

def cosmos_retry(fn, max_retries: int = 3, base_delay: float = 1.0):
    """Ejecuta fn con reintentos ante errores transitorios de red."""
    delay = base_delay
    last_error = None
    for attempt in range(max_retries):
        try:
            return fn()
        except (ServiceResponseError, Exception) as e:
            err_str = str(e).lower()
            is_network_err = (
                isinstance(e, ServiceResponseError) or
                'connection' in err_str or
                'aborted' in err_str or
                'reset' in err_str or
                'timeout' in err_str
            )
            if not is_network_err:
                raise
            last_error = e
            if attempt < max_retries - 1:
                print(f"⚠️ CosmosDB error transitorio (intento {attempt+1}/{max_retries}): {e}. Reintentando en {delay}s...")
                time.sleep(delay)
                delay *= 2
            else:
                print(f"❌ CosmosDB error tras {max_retries} intentos: {e}")
    raise last_error

class BaseRepository:
    def __init__(self, container):
        self.container = container
