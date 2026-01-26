from fastapi import APIRouter, HTTPException, UploadFile, File, status
from pathlib import Path
import uuid
import shutil
import os

UPLOAD_DIR = Path("/app/backend/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Create subdirectories
(UPLOAD_DIR / "products").mkdir(exist_ok=True)
(UPLOAD_DIR / "banners").mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def get_upload_router() -> APIRouter:
    router = APIRouter(prefix="/upload", tags=["Upload"])
    
    @router.post("/image")
    async def upload_image(file: UploadFile = File(...), type: str = "products"):
        # Validate file extension
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        # Generate unique filename
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        
        # Determine upload path
        if type == "banners":
            upload_path = UPLOAD_DIR / "banners" / unique_filename
        else:
            upload_path = UPLOAD_DIR / "products" / unique_filename
        
        # Save file
        try:
            with open(upload_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload file: {str(e)}"
            )
        finally:
            file.file.close()
        
        # Return the URL path
        backend_url = os.environ.get('BACKEND_PUBLIC_URL', 'http://localhost:8001')
        image_url = f"{backend_url}/api/uploads/{type}/{unique_filename}"
        
        return {
            "success": True,
            "image_url": image_url,
            "filename": unique_filename
        }
    
    @router.delete("/image")
    async def delete_image(image_url: str):
        # Extract filename from URL
        try:
            filename = image_url.split("/")[-1]
            type_folder = image_url.split("/")[-2]
            
            file_path = UPLOAD_DIR / type_folder / filename
            
            if file_path.exists():
                file_path.unlink()
                return {"success": True, "message": "Image deleted successfully"}
            else:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Image not found"
                )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete image: {str(e)}"
            )
    
    return router
