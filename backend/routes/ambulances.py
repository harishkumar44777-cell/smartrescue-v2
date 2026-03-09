from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from database import get_db
from models import Ambulance

router = APIRouter(prefix="/ambulances", tags=["ambulances"])

class AmbulanceIn(BaseModel):
    vehicle_id: str
    driver:     str
    area:       Optional[str] = ""
    lat:        Optional[float] = 11.1271
    lng:        Optional[float] = 78.6569

class LocationIn(BaseModel):
    lat: float
    lng: float

def _serialize(a: Ambulance):
    return {
        "id":         a.id,
        "vehicle_id": a.vehicle_id,
        "driver":     a.driver,
        "status":     a.status,
        "lat":        a.lat,
        "lng":        a.lng,
        "area":       a.area,
        "created_at": a.created_at.isoformat() if a.created_at else None,
    }

@router.get("")
def list_ambulances(db: Session = Depends(get_db)):
    return [_serialize(a) for a in db.query(Ambulance).all()]

@router.post("")
def create_ambulance(data: AmbulanceIn, db: Session = Depends(get_db)):
    if db.query(Ambulance).filter(Ambulance.vehicle_id == data.vehicle_id).first():
        raise HTTPException(400, "Vehicle ID already exists")
    a = Ambulance(**data.dict())
    db.add(a); db.commit(); db.refresh(a)
    return _serialize(a)

@router.patch("/{vehicle_id}/location")
def update_location(vehicle_id: str, loc: LocationIn, db: Session = Depends(get_db)):
    a = db.query(Ambulance).filter(Ambulance.vehicle_id == vehicle_id).first()
    if not a:
        raise HTTPException(404, "Not found")
    a.lat = loc.lat; a.lng = loc.lng
    db.commit(); db.refresh(a)
    return _serialize(a)

@router.delete("/{vehicle_id}")
def delete_ambulance(vehicle_id: str, db: Session = Depends(get_db)):
    a = db.query(Ambulance).filter(Ambulance.vehicle_id == vehicle_id).first()
    if not a:
        raise HTTPException(404, "Not found")
    db.delete(a); db.commit()
    return {"deleted": vehicle_id}
