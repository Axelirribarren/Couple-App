from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class EntryBase(BaseModel):
    text: str
    mood: int

class EntryCreate(EntryBase):
    pass

class EntryResponse(EntryBase):
    id: int
    user_id: int
    date: datetime

    class Config:
        from_attributes = True
