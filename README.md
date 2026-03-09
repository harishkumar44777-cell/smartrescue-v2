# 🚑 SmartRescue v2 — Real-Time Ambulance Dispatch System

**All data comes from MySQL. Zero hardcoded/fake data.**

---

## Quick Start

### Step 1 — MySQL Setup

```bash
mysql -u root -proot123 < setup_db.sql
```

### Step 2 — Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

> The backend will auto-seed: user harish/444, 8 ambulances, 8 hospitals.
> No fake dispatch records are seeded — the dispatch log starts empty.

### Step 3 — Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit: **http://localhost:3000**

---

## Login

| Username | Password | Source      |
|----------|----------|-------------|
| harish   | 444      | MySQL users table |

---

## Real Data Flow

```
User fills Report Emergency form
      ↓
POST /incidents  →  MySQL incidents table
      ↓
Haversine algorithm finds nearest AVAILABLE ambulance
      ↓
Nominatim geocodes the location → lat/lng
      ↓
Ambulance status → DISPATCHED in MySQL
      ↓
dispatch_logs record created in MySQL
      ↓
WebSocket broadcasts NEW_DISPATCH to all clients
      ↓
Dashboard map shows Leaflet route: ambulance → incident → hospital
      ↓
Ambulance marker animates every 5 seconds (GPS simulator)
```

---

## Architecture

```
smartrescue-v2/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LiveMap.jsx      ← Leaflet + OpenStreetMap real tiles
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Header.jsx       ← WS connection status
│   │   │   └── UI.jsx           ← Shared components (no mock data)
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx    ← Authenticates against MySQL
│   │   │   ├── DashboardPage.jsx ← Stats + Map from API
│   │   │   ├── ReportEmergencyPage.jsx ← Geocodes + dispatches
│   │   │   ├── AmbulancesPage.jsx ← GET /ambulances
│   │   │   ├── HospitalsPage.jsx  ← GET /hospitals
│   │   │   ├── DispatchLogPage.jsx ← GET /dispatch-logs (real MySQL)
│   │   │   └── SettingsPage.jsx   ← POST to MySQL
│   │   ├── services/
│   │   │   └── api.js           ← All Axios calls + Nominatim geocode
│   │   └── App.jsx              ← WS manager, real state
├── backend/
│   ├── main.py                  ← FastAPI + GPS background task
│   ├── database.py              ← MySQL + auto seed
│   ├── models.py                ← SQLAlchemy ORM
│   ├── dispatch_algorithm.py    ← Haversine nearest ambulance + hospital
│   ├── ws_manager.py            ← WebSocket broadcaster
│   └── routes/
│       ├── auth.py              ← POST /login (JWT + bcrypt)
│       ├── ambulances.py        ← CRUD /ambulances
│       ├── hospitals.py         ← CRUD /hospitals
│       ├── incidents.py         ← POST /incidents (auto-dispatch)
│       │                           GET  /dispatch-logs
│       └── dashboard.py         ← GET /dashboard/stats
└── setup_db.sql
```

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| POST | /login | JWT auth against MySQL users table |
| GET  | /ambulances | All ambulances from DB |
| POST | /ambulances | Add ambulance to DB |
| GET  | /hospitals | All hospitals from DB |
| POST | /hospitals | Add hospital to DB |
| GET  | /incidents | All incidents from DB |
| POST | /incidents | Report emergency → auto dispatch |
| GET  | /dispatch-logs | Full dispatch history from DB |
| PATCH | /dispatch-logs/{id}/status | Mark completed |
| GET  | /dashboard/stats | Aggregated counts from DB |
| WS   | /ws/live | Real-time GPS + dispatch events |

---

## Map Features

- **Real OpenStreetMap tiles** via Leaflet.js
- **GPS Detect My Location** — uses `navigator.geolocation`
  - Fallback: Bannari Amman Institute of Technology, Sathyamangalam
- **Location Search** — Nominatim geocoding API (free, no key needed)
- **Live ambulance markers** with pulse animation for dispatched units
- **Route polyline** — ambulance → incident → hospital (dashed green line)
- **Filter** — show/hide ambulances, hospitals, incidents
