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
    unlock_at: Optional[datetime] = None

class SparkResponse(BaseModel):
    id: int
    sender_id: int
    spark_type: str
    encrypted_payload: Optional[str] = None
    created_at: datetime
    unlock_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class SyncResponse(BaseModel):
    partner_id: Optional[int] = None
    partner_mood: Optional[int] = None
    streak_count: int
    sparks: List[SparkResponse] = []

class ShakeResponse(BaseModel):
    synced: bool
    message: str


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
    # Ignore deletion if it's a locked time capsule
    now = datetime.utcnow()

    # We only delete sparks that have expired AND (are not time capsules OR have passed their unlock + 24h)
    sparks_to_delete = db.query(Spark).filter(
        Spark.expires_at < now,
        (Spark.unlock_at.is_(None)) | (Spark.unlock_at < now)
    ).all()

    for s in sparks_to_delete:
        db.delete(s)
    db.commit()

    # Return active sparks (including locked ones, so the client knows they exist but can't open them yet)
    # Re-query after deletion
    pending_sparks = db.query(Spark).filter(Spark.receiver_id == current_user.id).all()
    response_data["sparks"] = pending_sparks

    return response_data

from datetime import timedelta

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
        encrypted_payload=spark.encrypted_payload,
        unlock_at=spark.unlock_at
    )

    # Ensure the spark doesn't expire immediately upon unlocking
    if spark.unlock_at:
        new_spark.expires_at = spark.unlock_at + timedelta(hours=24)

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

@router.post("/shake", response_model=ShakeResponse)
def handle_shake(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Called when the user physically shakes their device.
    Checks if the partner shook their device in the last 30 seconds.
    """
    if not current_user.partner:
        return ShakeResponse(synced=False, message="No partner linked")

    now = datetime.utcnow()
    current_user.last_shake = now
    db.commit()

    if current_user.partner.last_shake:
        time_diff = (now - current_user.partner.last_shake).total_seconds()
        if time_diff <= 30:
            return ShakeResponse(synced=True, message="Synchronous shake detected!")

    return ShakeResponse(synced=False, message="Shake recorded, waiting for partner...")
