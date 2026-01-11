from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import entry as models
from ..models import user as user_models
from ..schemas import entry as schemas
from .auth import get_current_user

router = APIRouter()

@router.post("/", response_model=schemas.EntryResponse)
def create_entry(entry: schemas.EntryCreate, db: Session = Depends(get_db), current_user: user_models.User = Depends(get_current_user)):
    db_entry = models.DailyEntry(**entry.dict(), user_id=current_user.id)
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

@router.get("/", response_model=List[schemas.EntryResponse])
def read_entries(db: Session = Depends(get_db), current_user: user_models.User = Depends(get_current_user)):
    # Return user's own entries
    return db.query(models.DailyEntry).filter(models.DailyEntry.user_id == current_user.id).all()

@router.get("/partner", response_model=List[schemas.EntryResponse])
def read_partner_entries(db: Session = Depends(get_db), current_user: user_models.User = Depends(get_current_user)):
    if not current_user.partner_id:
         raise HTTPException(status_code=400, detail="No partner linked")
    return db.query(models.DailyEntry).filter(models.DailyEntry.user_id == current_user.partner_id).all()
