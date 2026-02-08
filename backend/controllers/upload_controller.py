from fastapi import APIRouter, HTTPException, UploadFile, File, status
from pathlib import Path
import os
import cloudinary
import cloudinary.uploader
from typing import Optional

# Cloudinary configuration
cloudinary.config(
    cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME', 'dwxl9nxbe'),
    api_key=os.environ.get('CLOUDINARY_API_KEY', '144991629343521'),
    api_secret=os.environ.get('CLOUDINARY_API_SECRET', 'n1DlCwzdB9aWCg7jLK_bHAlQ_vE')
)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".jfif"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def get_upload_router() -> APIRouter:
    router = APIRouter(prefix="/upload", tags=["Upload"])
    
    @router.post("/image")
    async def upload_image(file: UploadFile = File(...), type: str = "products"):
        # Check if Cloudinary is configured
        if not os.environ.get('CLOUDINARY_CLOUD_NAME'):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env file"
            )
        
        # Validate file extension
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        try:
            # Upload to Cloudinary
            folder = f"mfrida/{type}"
            result = cloudinary.uploader.upload(
                file.file,
                folder=folder,
                resource_type="image",
                transformation=[
                    {'width': 1200, 'height': 1600, 'crop': 'limit'},
                    {'quality': 'auto:good'}
                ]
            )
            
            return {
                "success": True,
                "image_url": result['secure_url'],
                "public_id": result['public_id']
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload image: {str(e)}"
            )
        finally:
            file.file.close()
    
    @router.delete("/image")
    async def delete_image(public_id: str):
        try:
            # Delete from Cloudinary
            result = cloudinary.uploader.destroy(public_id)
            
            if result.get('result') == 'ok':
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