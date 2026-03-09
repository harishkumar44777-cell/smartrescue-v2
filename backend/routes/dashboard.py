from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Ambulance, Hospital, Incident, DispatchLog

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    total_amb    = db.query(Ambulance).count()
    available    = db.query(Ambulance).filter(Ambulance.status == "AVAILABLE").count()
    dispatched   = db.query(Ambulance).filter(Ambulance.status.in_(["DISPATCHED","EN_ROUTE"])).count()
    total_hosp   = db.query(Hospital).count()
    open_inc     = db.query(Incident).filter(Incident.status == "OPEN").count()
    total_inc    = db.query(Incident).count()

    # Average response time (minutes) from dispatch logs
    logs = db.query(DispatchLog).filter(DispatchLog.response_time.isnot(None)).all()
    avg_resp_sec = (sum(l.response_time for l in logs) / len(logs)) if logs else 0
    avg_resp_min = round(avg_resp_sec / 60, 1)

    return {
        "total_ambulances":   total_amb,
        "available":          available,
        "dispatched":         dispatched,
        "total_hospitals":    total_hosp,
        "open_incidents":     open_inc,
        "total_incidents":    total_inc,
        "total_dispatches":   len(logs),
        "avg_response_min":   avg_resp_min,
    }
