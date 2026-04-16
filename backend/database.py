from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
import os
from dotenv import load_dotenv

load_dotenv()

DB_URL = (
    f"mysql+pymysql://{os.getenv('DB_USER','root')}:"
    f"{os.getenv('DB_PASSWORD','root123')}@"
    f"{os.getenv('DB_HOST','localhost')}/"
    f"{os.getenv('DB_NAME','smartrescue')}?charset=utf8mb4"
)

engine       = create_engine(DB_URL, pool_pre_ping=True, pool_recycle=3600)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    from models import User, Ambulance, Hospital, Incident, DispatchLog
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        from passlib.context import CryptContext
        pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

        # Seed user hari / 4444
        from models import User
        if not db.query(User).filter(User.username == "hari").first():
            db.add(User(username="hari", password=pwd.hash("4444")))
            db.commit()
            print("✅ Seeded user: hari / 4444")

        # Seed ambulances (Tamil Nadu fleet)
        from models import Ambulance
        if db.query(Ambulance).count() == 0:
            fleet = [
                dict(vehicle_id="TN-AMB-001", driver="Rajan Kumar",   status="AVAILABLE",  lat=11.6643, lng=78.1460, area="Salem"),
                dict(vehicle_id="TN-AMB-002", driver="Priya Devi",    status="AVAILABLE",  lat=11.0168, lng=76.9558, area="Coimbatore"),
                dict(vehicle_id="TN-AMB-003", driver="Senthil M",     status="AVAILABLE",  lat=13.0827, lng=80.2707, area="Chennai"),
                dict(vehicle_id="TN-AMB-004", driver="Kavitha S",     status="AVAILABLE",  lat=9.9252,  lng=78.1198, area="Madurai"),
                dict(vehicle_id="TN-AMB-005", driver="Murugan P",     status="AVAILABLE",  lat=10.7905, lng=78.7047, area="Tiruchirappalli"),
                dict(vehicle_id="TN-AMB-006", driver="Lakshmi R",     status="AVAILABLE",  lat=8.7139,  lng=77.7567, area="Tirunelveli"),
                dict(vehicle_id="TN-AMB-007", driver="Arun Selvan",   status="AVAILABLE",  lat=12.9165, lng=79.1325, area="Vellore"),
                dict(vehicle_id="TN-AMB-008", driver="Deepa R",       status="AVAILABLE",  lat=11.3410, lng=77.7172, area="Erode"),
            ]
            db.add_all([Ambulance(**a) for a in fleet])
            db.commit()
            print(f"✅ Seeded {len(fleet)} ambulances")

        # Seed hospitals
        from models import Hospital
        if db.query(Hospital).count() == 0:
            hospitals = [
                dict(name="Government General Hospital",   city="Chennai",        beds=2400, status="OPERATIONAL", lat=13.0604, lng=80.2496),
                dict(name="Coimbatore Medical College",    city="Coimbatore",     beds=1200, status="OPERATIONAL", lat=11.0168, lng=76.9658),
                dict(name="Madurai Rajaji Hospital",       city="Madurai",        beds=900,  status="OPERATIONAL", lat=9.9252,  lng=78.1298),
                dict(name="Salem Government Hospital",     city="Salem",          beds=750,  status="OPERATIONAL", lat=11.6643, lng=78.1560),
                dict(name="Tirunelveli Medical College",   city="Tirunelveli",    beds=600,  status="OPERATIONAL", lat=8.7139,  lng=77.7667),
                dict(name="Vellore CMC Hospital",          city="Vellore",        beds=2800, status="OPERATIONAL", lat=12.9165, lng=79.1425),
                dict(name="JIPMER Puducherry",             city="Puducherry",     beds=1800, status="OPERATIONAL", lat=11.9416, lng=79.8183),
                dict(name="Erode Government Hospital",     city="Erode",          beds=500,  status="OPERATIONAL", lat=11.3410, lng=77.7272),
            ]
            db.add_all([Hospital(**h) for h in hospitals])
            db.commit()
            print(f"✅ Seeded {len(hospitals)} hospitals")

        print("✅ Database ready.")
    except Exception as e:
        db.rollback()
        print(f"⚠️  DB init warning: {e}")
    finally:
        db.close()
