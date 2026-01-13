from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..schemas.user import UserResponse
from ..routes.auth import get_current_user
from pydantic import BaseModel

router = APIRouter()

class UpdateCharacterRequest(BaseModel):
    character: str

class UpdateMoodRequest(BaseModel):
    mood: int

@router.put("/me/character", response_model=UserResponse)
def update_character(request: UpdateCharacterRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if request.character not in ["owl", "alien"]:
        raise HTTPException(status_code=400, detail="Invalid character. Must be 'owl' or 'alien'")
    
    current_user.character = request.character
    db.commit()
    db.refresh(current_user)
    return current_user

@router.put("/me/mood", response_model=UserResponse)
def update_mood(request: UpdateMoodRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not (1 <= request.mood <= 5):
        raise HTTPException(status_code=400, detail="Mood must be between 1 and 5")
    
    current_user.current_mood = request.mood
    db.commit()
    db.refresh(current_user)
    return current_user
