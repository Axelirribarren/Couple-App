from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import checkin as models
from ..models import user as user_models
from ..schemas import checkin as schemas
from .auth import get_current_user
from datetime import datetime, time

router = APIRouter()

@router.post("/", response_model=schemas.CheckInResponse)
def create_checkin(
    checkin: schemas.CheckInCreate, 
    db: Session = Depends(get_db), 
    current_user: user_models.User = Depends(get_current_user)
):
    # Check if user already checked in today
    today_start = datetime.combine(datetime.utcnow().date(), time.min)
    today_end = datetime.combine(datetime.utcnow().date(), time.max)
    
    existing = db.query(models.CheckIn).filter(
        models.CheckIn.user_id == current_user.id,
        models.CheckIn.date >= today_start,
        models.CheckIn.date <= today_end
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="You have already checked in today.")

    db_checkin = models.CheckIn(**checkin.dict(), user_id=current_user.id)
    db.add(db_checkin)
    db.commit()
    db.refresh(db_checkin)
    return db_checkin

@router.get("/", response_model=List[schemas.CheckInResponse])
def read_checkins(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db), 
    current_user: user_models.User = Depends(get_current_user)
):
    checkins = db.query(models.CheckIn).filter(models.CheckIn.user_id == current_user.id).offset(skip).limit(limit).all()
    return checkins
