from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from database import get_db
from models import Hospital

router = APIRouter(prefix="/hospitals", tags=["hospitals"])

class HospitalIn(BaseModel):
    name:   str
    city:   str
    beds:   Optional[int]   = 0
    lat:    Optional[float] = 11.1271
    lng:    Optional[float] = 78.6569
    status: Optional[str]   = "OPERATIONAL"

def _serialize(h: Hospital):
    return {
        "id":     h.id,
        "name":   h.name,
        "city":   h.city,
        "beds":   h.beds,
        "status": h.status,
        "lat":    h.lat,
        "lng":    h.lng,
    }

@router.get("")
def list_hospitals(db: Session = Depends(get_db)):
    return [_serialize(h) for h in db.query(Hospital).all()]

@router.post("")
def create_hospital(data: HospitalIn, db: Session = Depends(get_db)):
    h = Hospital(**data.dict())
    db.add(h); db.commit(); db.refresh(h)
    return _serialize(h)
