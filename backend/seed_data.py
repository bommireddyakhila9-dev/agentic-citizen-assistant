import sys
import os

# Ensure backend root is in Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, init_db
from app.models.citizen import Citizen
from app.models.grievance import Grievance
from app.models.service import Service
from app.models.notification import CivicNotification


def seed():
    print("Initializing database tables...")
    init_db()

    db = SessionLocal()
    try:
        # Check if citizens exist
        c1 = db.query(Citizen).filter(Citizen.phone == "9876543210").first()
        if not c1:
            print("Seeding sample citizens...")
            c1 = Citizen(
                full_name="John Doe",
                phone="9876543210",
                email="john.doe@example.com",
                address="14 Green Avenue, Sector 5",
                ward_number="Ward 2 - Sector 5",
            )
            c2 = Citizen(
                full_name="Priya Sharma",
                phone="9123456780",
                email="priya.sharma@example.com",
                address="45 Lakeview Towers, Ward 8",
                ward_number="Ward 8 - East",
            )
            c3 = Citizen(
                full_name="Ahmed Khan",
                phone="9988776655",
                email="ahmed.khan@example.com",
                address="78 Market Road, Old City",
                ward_number="Ward 1 - Central",
            )
            db.add_all([c1, c2, c3])
            db.commit()

        # Update or seed grievances with coordinates
        grievances = db.query(Grievance).all()
        coords_map = {
            "GRV-1001": (28.6219, 77.2185, "Ward 2 - Sector 5"),
            "GRV-1002": (28.6180, 77.2120, "Ward 2 - Sector 5"),
            "GRV-1003": (28.6080, 77.2250, "Ward 8 - East"),
            "GRV-1004": (28.6139, 77.2090, "Ward 1 - Central"),
        }

        for g in grievances:
            if g.ticket_number in coords_map:
                lat, lng, ward = coords_map[g.ticket_number]
                g.latitude = lat
                g.longitude = lng
                g.ward_number = ward
        db.commit()

        # Seed sample notifications if empty
        if not db.query(CivicNotification).first():
            print("Seeding initial civic notifications...")
            n1 = CivicNotification(
                ticket_number="GRV-1001",
                channel="SMS",
                recipient="9876543210",
                subject="Grievance Registered: GRV-1001",
                message="🏛️ CitizenConnect Alert: Your grievance GRV-1001 ('Deep Pothole near Sector 5 Bus Stop') has been registered with Roads & Infrastructure.",
                status="Delivered"
            )
            n2 = CivicNotification(
                ticket_number="GRV-1001",
                channel="EMAIL",
                recipient="john.doe@example.com",
                subject="Official Acknowledgement: Grievance GRV-1001",
                message="Your complaint regarding the Sector 5 pothole is currently In Progress. Asphalt patching scheduled.",
                status="Delivered"
            )
            n3 = CivicNotification(
                ticket_number="GRV-1003",
                channel="SMS",
                recipient="9123456780",
                subject="Grievance Resolved: GRV-1003",
                message="🏛️ CitizenConnect Alert: Sanitation complaint GRV-1003 has been marked RESOLVED. Special crew cleared waste.",
                status="Delivered"
            )
            db.add_all([n1, n2, n3])
            db.commit()

        print("Database verification & enrichment complete!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
