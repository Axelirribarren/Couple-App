from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base
import uuid

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    partner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Partner code for linking
    link_code = Column(String, unique=True, nullable=True)

    partner = relationship("User", remote_side=[id], post_update=True)
    entries = relationship("DailyEntry", back_populates="user")
    photos = relationship("Photo", back_populates="user")
