from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import test as models
from ..models import user as user_models
from ..schemas import test as schemas
from .auth import get_current_user

router = APIRouter()

@router.post("/", response_model=schemas.TestResponse)
def create_test_result(
    test: schemas.TestCreate, 
    db: Session = Depends(get_db), 
    current_user: user_models.User = Depends(get_current_user)
):
    db_test = models.EmotionalTest(**test.dict(), user_id=current_user.id)
    db.add(db_test)
    db.commit()
    db.refresh(db_test)
    return db_test

@router.get("/", response_model=List[schemas.TestResponse])
def read_tests(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db), 
    current_user: user_models.User = Depends(get_current_user)
):
    tests = db.query(models.EmotionalTest).filter(models.EmotionalTest.user_id == current_user.id).offset(skip).limit(limit).all()
    return tests

@router.get("/questions")
def get_daily_questions():
    # Return a curated list of questions
    return [
        "How are you feeling right now?",
        "What do you need most today?",
        "How can I support you?",
        "What was the best part of your day?"
    ]
