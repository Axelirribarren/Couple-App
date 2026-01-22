from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class CheckIn(Base):
    __tablename__ = "checkins"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    sleep_quality = Column(Integer) # 1-5
    stress_level = Column(Integer) # 1-5
    connection_felt = Column(Integer) # 1-5
    note = Column(String(140), nullable=True)
    date = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="checkins")
