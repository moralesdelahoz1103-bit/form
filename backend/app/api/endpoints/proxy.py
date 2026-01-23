from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import httpx
from app.storage import get_storage_adapter
from app.core.config import settings

router = APIRouter(prefix="/api/proxy", tags=["proxy"])

@router.get("/blob/{blob_path:path}")
async def proxy_blob(blob_path: str):
    """
    Proxy endpoint to fetch blobs from Azure Storage and serve them to the frontend.
    This bypasses CORS issues when fetching directly from Azure.
    """
    try:
        storage = get_storage_adapter()
        
        # Only works with Azure Blob Storage
        if settings.BLOB_STORAGE_MODE != "azure":
            raise HTTPException(status_code=400, detail="Proxy only available for Azure storage")
        
        # Get the full URL with SAS token using the internal method
        blob_url = storage.get_blob_url_with_sas(blob_path)
        
        # Fetch the blob content
        async with httpx.AsyncClient() as client:
            response = await client.get(blob_url)
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch blob")
            
            # Return the image with proper content type
            return StreamingResponse(
                iter([response.content]),
                media_type=response.headers.get("content-type", "image/png"),
                headers={
                    "Cache-Control": "public, max-age=3600",
                    "Access-Control-Allow-Origin": "*"
                }
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching blob: {str(e)}")
