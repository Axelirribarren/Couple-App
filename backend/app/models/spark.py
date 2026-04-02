from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
from ..database import Base

class Spark(Base):
    """
    Ephemeral "Sparks" (Haptic Heartbeats, Polaroids, Nudges).
    These are temporary blobs acting as pass-through sync between partners
    when they are not on the same local network.
    Once consumed by the receiver, they should be deleted from the database.
    """
    __tablename__ = "sparks"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    spark_type = Column(String, nullable=False) # e.g., 'haptic', 'polaroid', 'nudge'

    # Encrypted payload (base64 or hex string), so the server doesn't know what it is.
    # In a local-first architecture, the server just holds the envelope.
    encrypted_payload = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(hours=24))

    # Feature 1: Cápsula del futuro
    # If set, the Spark is "locked" and should not be deleted by garbage collection
    # until after this date (and then it lives for 24h after unlock).
    unlock_at = Column(DateTime, nullable=True)

    # Relationships (Optional, mainly if you want to cascade deletes,
    # but here we'll just query them)
    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])
