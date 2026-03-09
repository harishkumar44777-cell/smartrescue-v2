import asyncio
import random
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from database import init_db, SessionLocal
from models import Ambulance
from ws_manager import manager
from routes.auth       import router as auth_router
from routes.ambulances import router as amb_router
from routes.hospitals  import router as hosp_router
from routes.incidents  import inc_router, dispatch_router
from routes.dashboard  import router as dash_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        init_db()
    except Exception as e:
        print(f"⚠️  DB init error: {e}")

    # Background GPS simulator — move DISPATCHED ambulances every 5 s
    async def gps_loop():
        while True:
            await asyncio.sleep(5)
            try:
                db = SessionLocal()
                moving = db.query(Ambulance).filter(
                    Ambulance.status.in_(["DISPATCHED", "EN_ROUTE"])
                ).all()
                updates = []
                for a in moving:
                    a.lat = round(a.lat + random.uniform(-0.005, 0.005), 5)
                    a.lng = round(a.lng + random.uniform(-0.005, 0.005), 5)
                    updates.append({
                        "vehicle_id": a.vehicle_id,
                        "lat": a.lat,
                        "lng": a.lng,
                        "status": a.status
                    })
                if updates:
                    db.commit()
                    await manager.broadcast("GPS_UPDATE", {"ambulances": updates})
                db.close()
            except Exception as e:
                print(f"GPS loop error: {e}")

    task = asyncio.create_task(gps_loop())
    yield
    task.cancel()

app = FastAPI(title="SmartRescue API v2", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(amb_router)
app.include_router(hosp_router)
app.include_router(inc_router)
app.include_router(dispatch_router)
app.include_router(dash_router)

@app.websocket("/ws/live")
async def websocket_live(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(ws)

@app.get("/")
def root():
    return {"status": "SmartRescue v2 running 🚑", "docs": "/docs"}

@app.get("/health")
def health():
    return {"status": "ok"}
