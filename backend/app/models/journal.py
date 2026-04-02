from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class DailyJournal(Base):
    """
    Persistent storage for the Asymmetric Journal feature.
    Answers are tied to a specific user and a specific date string (YYYY-MM-DD).
    """
    __tablename__ = "daily_journal"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date_str = Column(String, nullable=False, index=True) # e.g., "2023-10-27"
    answer = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
