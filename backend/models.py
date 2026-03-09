from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    id       = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password = Column(String(255), nullable=False)

class Ambulance(Base):
    __tablename__ = "ambulances"
    id         = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(String(20), unique=True, nullable=False)
    driver     = Column(String(100), nullable=False)
    status     = Column(String(20), default="AVAILABLE")
    lat        = Column(Float, default=11.1271)
    lng        = Column(Float, default=78.6569)
    area       = Column(String(100), default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    logs       = relationship("DispatchLog", back_populates="ambulance")

class Hospital(Base):
    __tablename__ = "hospitals"
    id     = Column(Integer, primary_key=True, index=True)
    name   = Column(String(200), nullable=False)
    city   = Column(String(100), nullable=False)
    beds   = Column(Integer, default=0)
    status = Column(String(20), default="OPERATIONAL")
    lat    = Column(Float, default=11.1271)
    lng    = Column(Float, default=78.6569)

class Incident(Base):
    __tablename__ = "incidents"
    id          = Column(Integer, primary_key=True, index=True)
    type        = Column(String(100), nullable=False)
    location    = Column(String(300), nullable=False)
    priority    = Column(String(20), default="HIGH")
    patients    = Column(Integer, default=1)
    description = Column(Text, default="")
    status      = Column(String(20), default="OPEN")
    lat         = Column(Float, nullable=True)
    lng         = Column(Float, nullable=True)
    created_at  = Column(DateTime, default=datetime.utcnow)
    logs        = relationship("DispatchLog", back_populates="incident")

class DispatchLog(Base):
    __tablename__ = "dispatch_logs"
    id              = Column(Integer, primary_key=True, index=True)
    incident_id     = Column(Integer, ForeignKey("incidents.id"))
    ambulance_id    = Column(Integer, ForeignKey("ambulances.id"))
    hospital_id     = Column(Integer, ForeignKey("hospitals.id"), nullable=True)
    status          = Column(String(20), default="DISPATCHED")
    dispatched_at   = Column(DateTime, default=datetime.utcnow)
    response_time   = Column(Integer, nullable=True)
    distance_km     = Column(Float, nullable=True)
    incident        = relationship("Incident",  back_populates="logs")
    ambulance       = relationship("Ambulance", back_populates="logs")
    hospital        = relationship("Hospital")
