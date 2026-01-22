from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TestBase(BaseModel):
    question: str
    answer: str

class TestCreate(TestBase):
    pass

class TestResponse(TestBase):
    id: int
    user_id: int
    date: datetime

    class Config:
        from_attributes = True
