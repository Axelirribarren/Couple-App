from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Union
from ..database import get_db
from ..models import user as user_models
from ..models import entry, checkin, test
from ..schemas import entry as entry_schemas
from ..schemas import checkin as checkin_schemas
from ..schemas import test as test_schemas
from .auth import get_current_user
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

# Unified Timeline Item
class TimelineItem(BaseModel):
    type: str # 'mood', 'checkin', 'test'
    data: Union[entry_schemas.EntryResponse, checkin_schemas.CheckInResponse, test_schemas.TestResponse]
    date: datetime

@router.get("/", response_model=List[TimelineItem])
def get_timeline(
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(get_current_user)
):
    user_ids = [current_user.id]
    if current_user.partner_id:
        user_ids.append(current_user.partner_id)

    # Fetch all types
    moods = db.query(entry.DailyEntry).filter(entry.DailyEntry.user_id.in_(user_ids)).all()
    checkins = db.query(checkin.CheckIn).filter(checkin.CheckIn.user_id.in_(user_ids)).all()
    tests = db.query(test.EmotionalTest).filter(test.EmotionalTest.user_id.in_(user_ids)).all()

    timeline = []

    for m in moods:
        timeline.append({"type": "mood", "data": m, "date": m.date})
    
    for c in checkins:
        timeline.append({"type": "checkin", "data": c, "date": c.date})
    
    for t in tests:
        timeline.append({"type": "test", "data": t, "date": t.date})

    # Sort by date descending
    timeline.sort(key=lambda x: x['date'], reverse=True)

    return timeline
