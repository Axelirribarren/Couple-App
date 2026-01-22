from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class CheckInBase(BaseModel):
    sleep_quality: int
    stress_level: int
    connection_felt: int
    note: Optional[str] = None

class CheckInCreate(CheckInBase):
    pass

class CheckInResponse(CheckInBase):
    id: int
    user_id: int
    date: datetime

    class Config:
        from_attributes = True
