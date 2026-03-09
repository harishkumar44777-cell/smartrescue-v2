from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from database import get_db
from models import Incident, DispatchLog, Ambulance
from dispatch_algorithm import run_dispatch
from ws_manager import manager
import asyncio

inc_router      = APIRouter(prefix="/incidents",     tags=["incidents"])
dispatch_router = APIRouter(prefix="/dispatch-logs", tags=["dispatch"])

# ── Incidents ──────────────────────────────────────────────────────────────────
class IncidentIn(BaseModel):
    type:        str
    location:    str
    priority:    Optional[str]   = "HIGH"
    patients:    Optional[int]   = 1
    description: Optional[str]  = ""
    lat:         Optional[float] = None
    lng:         Optional[float] = None

def _serialize_inc(inc: Incident):
    return {
        "id":          inc.id,
        "type":        inc.type,
        "location":    inc.location,
        "priority":    inc.priority,
        "patients":    inc.patients,
        "description": inc.description,
        "status":      inc.status,
        "lat":         inc.lat,
        "lng":         inc.lng,
        "created_at":  inc.created_at.isoformat() if inc.created_at else None,
    }

@inc_router.get("")
def list_incidents(db: Session = Depends(get_db)):
    rows = db.query(Incident).order_by(Incident.created_at.desc()).limit(100).all()
    return [_serialize_inc(r) for r in rows]

@inc_router.post("")
async def report_incident(data: IncidentIn, db: Session = Depends(get_db)):
    inc = Incident(**data.dict())
    db.add(inc); db.commit(); db.refresh(inc)

    log, ambulance, hospital = run_dispatch(db, inc)

    if not log:
        return {
            "incident": _serialize_inc(inc),
            "dispatch": None,
            "error": "No available ambulances"
        }

    dispatch_payload = _serialize_dispatch(log, inc, ambulance, hospital)

    # Broadcast via WebSocket
    asyncio.create_task(
        manager.broadcast("NEW_DISPATCH", dispatch_payload)
    )

    return {
        "incident":  _serialize_inc(inc),
        "dispatch":  dispatch_payload,
    }

# ── Dispatch Logs ──────────────────────────────────────────────────────────────
def _serialize_dispatch(log: DispatchLog, inc=None, amb=None, hosp=None):
    if not inc:
        inc = log.incident
    if not amb:
        amb = log.ambulance
    if not hosp:
        hosp = log.hospital
    return {
        "id":               log.id,
        "incident_id":      log.incident_id,
        "incident_type":    inc.type        if inc  else None,
        "incident_location":inc.location    if inc  else None,
        "incident_lat":     inc.lat         if inc  else None,
        "incident_lng":     inc.lng         if inc  else None,
        "ambulance_id":     amb.vehicle_id  if amb  else None,
        "ambulance_driver": amb.driver      if amb  else None,
        "ambulance_lat":    amb.lat         if amb  else None,
        "ambulance_lng":    amb.lng         if amb  else None,
        "hospital_name":    hosp.name       if hosp else None,
        "hospital_lat":     hosp.lat        if hosp else None,
        "hospital_lng":     hosp.lng        if hosp else None,
        "status":           log.status,
        "dispatched_at":    log.dispatched_at.isoformat() if log.dispatched_at else None,
        "response_time":    log.response_time,
        "distance_km":      log.distance_km,
    }

@dispatch_router.get("")
def list_dispatch_logs(db: Session = Depends(get_db)):
    logs = (
        db.query(DispatchLog)
        .order_by(DispatchLog.dispatched_at.desc())
        .limit(200)
        .all()
    )
    return [_serialize_dispatch(log) for log in logs]

@dispatch_router.patch("/{log_id}/status")
async def update_status(log_id: int, status: str, db: Session = Depends(get_db)):
    log = db.query(DispatchLog).get(log_id)
    if not log:
        raise HTTPException(404, "Log not found")
    log.status = status
    if log.ambulance:
        log.ambulance.status = "AVAILABLE" if status == "COMPLETED" else status
    db.commit()
    asyncio.create_task(
        manager.broadcast("STATUS_UPDATE", {"log_id": log_id, "status": status})
    )
    return {"updated": log_id, "status": status}
