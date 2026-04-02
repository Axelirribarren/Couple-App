from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional

from ..database import get_db
from ..models.user import User
from ..models.spark import Spark
from ..routes.auth import get_current_user
from pydantic import BaseModel

router = APIRouter()

# --- SCHEMAS ---
class SyncRequest(BaseModel):
    current_mood: Optional[int] = None
    streak_count: Optional[int] = None

class SparkCreate(BaseModel):
    spark_type: str
    encrypted_payload: Optional[str] = None

class SparkResponse(BaseModel):
    id: int
    sender_id: int
    spark_type: str
    encrypted_payload: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True

class SyncResponse(BaseModel):
    partner_id: Optional[int] = None
    partner_mood: Optional[int] = None
    streak_count: int
    sparks: List[SparkResponse] = []


# --- ROUTES ---

@router.post("/", response_model=SyncResponse)
def sync_metadata(request: SyncRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Called by the client to update their own state and fetch the partner's state + any pending Sparks.
    This acts as the minimal "Supabase" layer for local-first architecture.
    """
    current_user.last_active = datetime.utcnow()

    # Update local state if provided
    if request.current_mood is not None:
        current_user.current_mood = request.current_mood

    # Backend validates if the streak should be broken based on BOTH users' activity
    if request.streak_count is not None:
        new_streak = request.streak_count

        if current_user.partner and current_user.partner.last_active:
            # Check if partner has been inactive for > 48 hours
            # If so, the streak is broken for BOTH
            time_since_partner_active = datetime.utcnow() - current_user.partner.last_active
            if time_since_partner_active.total_seconds() > 48 * 3600:
                new_streak = 1 # Broken streak due to partner inactivity

        current_user.streak_count = new_streak
        if current_user.partner:
            current_user.partner.streak_count = new_streak

    db.commit()

    # Prepare response
    response_data = {
        "partner_id": current_user.partner_id,
        "partner_mood": current_user.partner.current_mood if current_user.partner else None,
        "streak_count": current_user.streak_count,
        "sparks": []
    }

    # Fetch pending sparks directed to the current_user
    pending_sparks = db.query(Spark).filter(Spark.receiver_id == current_user.id).all()

    # Delete expired sparks from DB entirely (Garbage collection)
    now = datetime.utcnow()
    db.query(Spark).filter(Spark.expires_at < now).delete()
    db.commit()

    # Return only unexpired sparks
    response_data["sparks"] = [s for s in pending_sparks if s.expires_at >= now]

    return response_data

@router.post("/sparks", response_model=SparkResponse)
def send_spark(spark: SparkCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Sends an ephemeral spark (Haptic Heartbeat, Nudge, Fragmented Photo) to the partner.
    The server just acts as a pass-through envelope.
    """
    if not current_user.partner_id:
        raise HTTPException(status_code=400, detail="No partner linked")

    new_spark = Spark(
        sender_id=current_user.id,
        receiver_id=current_user.partner_id,
        spark_type=spark.spark_type,
        encrypted_payload=spark.encrypted_payload
    )

    db.add(new_spark)
    db.commit()
    db.refresh(new_spark)
    return new_spark

@router.delete("/sparks/{spark_id}")
def consume_spark(spark_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Called by the receiver once a Spark is read/viewed/felt.
    It deletes the Spark from the server immediately (Snapchat style).
    """
    spark = db.query(Spark).filter(Spark.id == spark_id, Spark.receiver_id == current_user.id).first()

    if not spark:
        raise HTTPException(status_code=404, detail="Spark not found or already consumed")

    db.delete(spark)
    db.commit()

    return {"message": "Spark consumed and deleted successfully"}
