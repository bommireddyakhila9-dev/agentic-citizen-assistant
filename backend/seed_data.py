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

        # Seed sample grievances if empty
        if db.query(Grievance).count() == 0:
            print("Seeding initial sample grievances...")
            g1 = Grievance(
                ticket_number="GRV-1001",
                citizen_phone="9876543210",
                title="Deep Pothole near Sector 5 Bus Stop",
                description="Heavy vehicle traffic has caused asphalt cracking and a 2-foot pothole near the main bus stop.",
                category="Roads & Civil Infrastructure",
                priority="High",
                status="In Progress",
                location="Sector 5, Main Bus Terminal",
                ward_number="Ward 2 - Sector 5",
                latitude=28.6219,
                longitude=77.2185,
                department_notes="Roads & Civil Infrastructure engineering team dispatched with asphalt patching crew.",
            )
            g2 = Grievance(
                ticket_number="GRV-1002",
                citizen_phone="9876543210",
                title="Garbage Overflow behind Community Center",
                description="Sanitation bin overflowing for 3 days attracting stray animals and blocking the pedestrian walkway.",
                category="Public Health & Sanitation",
                priority="Medium",
                status="In Progress",
                location="Block C Market, Ward 2",
                ward_number="Ward 2 - Sector 5",
                latitude=28.6180,
                longitude=77.2120,
                department_notes="Sanitation tractor assigned. Waste cleared and area sanitized with bleaching powder.",
            )
            g3 = Grievance(
                ticket_number="GRV-1003",
                citizen_phone="9123456780",
                title="Streetlight Pole Sparking & Damaged",
                description="Heavy wind storm tilted pole 42; wiring sparking intermittently at night.",
                category="Electricity & Lighting",
                priority="High",
                status="Resolved",
                location="East Ring Road, Pillar 42",
                ward_number="Ward 8 - East",
                latitude=28.6080,
                longitude=77.2250,
                department_notes="Electrical department replaced MCB and secured junction box. Power restored.",
            )
            g4 = Grievance(
                ticket_number="GRV-1004",
                citizen_phone="9988776655",
                title="Drinking Water Pipeline Leakage",
                description="Clean water leaking onto the street from main distribution valve, low pressure in nearby homes.",
                category="Water Supply & Sewage",
                priority="Medium",
                status="Pending",
                location="Near Clock Tower, Central Ward",
                ward_number="Ward 1 - Central",
                latitude=28.6139,
                longitude=77.2090,
                department_notes="Pending field inspection by water supply maintenance unit.",
            )
            db.add_all([g1, g2, g3, g4])
            db.commit()

        # Seed municipal government schemes if empty
        if db.query(Service).count() == 0:
            print("Seeding civic municipal welfare services...")
            s1 = Service(
                name="PMAY Urban Affordable Housing Scheme",
                category="Housing & Urban Development",
                description="Credit-linked interest subsidy scheme for middle and lower-income families constructing or purchasing their first home.",
                eligibility="Annual household income up to ₹18 Lakhs. No existing pucca house in India.",
                documents_required="Aadhaar, PAN, Income Certificate, Property Documents, Bank Passbook.",
            )
            s2 = Service(
                name="PM Surya Ghar Muft Bijli Rooftop Solar",
                category="Energy & Sustainability",
                description="Direct financial subsidy up to ₹78,000 for installing residential rooftop solar panels to generate free electricity.",
                eligibility="Resident homeowner with a grid-connected residential electricity meter.",
                documents_required="Electricity Bill, Property Ownership Proof, Bank Account, Aadhaar.",
            )
            s3 = Service(
                name="Amrit Clean Drinking Water Connection",
                category="Public Utilities",
                description="Subsidized piped potable water connection for all households across municipal wards.",
                eligibility="Registered resident within municipal corporation limits.",
                documents_required="Municipal Property Tax Receipt, Aadhaar Card, Water Connection Application.",
            )
            db.add_all([s1, s2, s3])
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
