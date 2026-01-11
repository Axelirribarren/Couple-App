from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import user as models
from ..schemas import user as schemas
from .auth import get_current_user
import uuid

router = APIRouter()

@router.post("/generate-code")
def generate_link_code(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    code = str(uuid.uuid4())[:8] # Short code
    current_user.link_code = code
    db.commit()
    return {"code": code}

@router.post("/link")
def link_partner(code: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.partner_id:
        raise HTTPException(status_code=400, detail="Already linked to a partner")

    partner = db.query(models.User).filter(models.User.link_code == code).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Invalid code")
    
    if partner.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot link to yourself")

    # Link both ways
    current_user.partner_id = partner.id
    partner.partner_id = current_user.id
    
    # Clear codes
    current_user.link_code = None
    partner.link_code = None
    
    db.commit()
    return {"message": "Users linked successfully"}
