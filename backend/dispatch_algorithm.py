import math
from sqlalchemy.orm import Session
from models import Ambulance, Hospital, Incident, DispatchLog

def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Distance in km between two GPS coordinates."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlng / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def find_nearest_ambulance(db: Session, lat: float, lng: float) -> Ambulance | None:
    available = db.query(Ambulance).filter(Ambulance.status == "AVAILABLE").all()
    if not available:
        return None
    return min(available, key=lambda a: haversine(lat, lng, a.lat, a.lng))

def find_nearest_hospital(db: Session, lat: float, lng: float) -> Hospital | None:
    hospitals = db.query(Hospital).filter(Hospital.status == "OPERATIONAL").all()
    if not hospitals:
        return None
    return min(hospitals, key=lambda h: haversine(lat, lng, h.lat, h.lng))

def run_dispatch(db: Session, incident: Incident):
    """
    Full dispatch flow:
    1. Find nearest available ambulance
    2. Find nearest hospital
    3. Mark ambulance as DISPATCHED
    4. Create dispatch_log record
    5. Return dispatch info
    """
    inc_lat = incident.lat or 11.1271
    inc_lng = incident.lng or 78.6569

    ambulance = find_nearest_ambulance(db, inc_lat, inc_lng)
    hospital  = find_nearest_hospital(db, inc_lat, inc_lng)

    if not ambulance:
        return None, None, None

    dist_km     = haversine(inc_lat, inc_lng, ambulance.lat, ambulance.lng)
    eta_seconds = int((dist_km / 60) * 3600)   # assume avg 60 km/h

    # Update statuses
    ambulance.status = "DISPATCHED"
    incident.status  = "DISPATCHED"

    log = DispatchLog(
        incident_id   = incident.id,
        ambulance_id  = ambulance.id,
        hospital_id   = hospital.id if hospital else None,
        status        = "DISPATCHED",
        response_time = eta_seconds,
        distance_km   = round(dist_km, 2),
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    db.refresh(ambulance)

    return log, ambulance, hospital
