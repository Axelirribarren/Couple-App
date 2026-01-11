from pydantic import BaseModel
from datetime import datetime

class PhotoResponse(BaseModel):
    id: int
    user_id: int
    file_path: str
    created_at: datetime

    class Config:
        from_attributes = True
