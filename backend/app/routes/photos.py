from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import List
import shutil
import os
from ..database import get_db
from ..models import photo as models
from ..models import user as user_models
from ..schemas import photo as schemas
from .auth import get_current_user

router = APIRouter()
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/", response_model=schemas.PhotoResponse)
def upload_photo(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: user_models.User = Depends(get_current_user)):
    file_location = f"{UPLOAD_DIR}/{file.filename}"
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    db_photo = models.Photo(user_id=current_user.id, file_path=file_location)
    db.add(db_photo)
    db.commit()
    db.refresh(db_photo)
    return db_photo

@router.get("/", response_model=List[schemas.PhotoResponse])
def get_photos(db: Session = Depends(get_db), current_user: user_models.User = Depends(get_current_user)):
    # Get photos from both user and partner
    if current_user.partner_id:
        return db.query(models.Photo).filter(
            (models.Photo.user_id == current_user.id) | (models.Photo.user_id == current_user.partner_id)
        ).all()
    else:
        return db.query(models.Photo).filter(models.Photo.user_id == current_user.id).all()
