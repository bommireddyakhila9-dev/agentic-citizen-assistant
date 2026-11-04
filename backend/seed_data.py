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
            db.refresh(c1)
            db.refresh(c2)
            db.refresh(c3)
        else:
            c2 = db.query(Citizen).filter(Citizen.phone == "9123456780").first()
            c3 = db.query(Citizen).filter(Citizen.phone == "9988776655").first()

        # Seed sample grievances if fewer than 6 exist
        if db.query(Grievance).count() < 6:
            # Check existing ticket numbers to prevent uniqueness conflicts
            existing_tickets = {g.ticket_number for g in db.query(Grievance.ticket_number).all()}
            print("Seeding initial sample grievances...")
            g1 = Grievance(
                ticket_number="GRV-1001",
                citizen_id=c1.id,
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
                citizen_id=c1.id,
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
                citizen_id=c2.id if c2 else c1.id,
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
                citizen_id=c3.id if c3 else c1.id,
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
            g5 = Grievance(
                ticket_number="GRV-1005",
                citizen_id=c1.id,
                title="Monsoon Drain Blockage & Waterlogging",
                description="Stormwater drainage completely choked with plastic waste, causing 1-foot waterlogging after rains.",
                category="Water Supply & Sewage",
                priority="High",
                status="In Progress",
                location="Ring Road Junction, Sector 3",
                ward_number="Ward 3 - North",
                latitude=28.6150,
                longitude=77.2150,
                department_notes="Suction jetting machine deployed to de-silt main drain line.",
            )
            g6 = Grievance(
                ticket_number="GRV-1006",
                citizen_id=c2.id if c2 else c1.id,
                title="Construction Debris Dumped on Footpath",
                description="Commercial construction contractor dumped 3 truckloads of rubble blocking pedestrian access to the school.",
                category="Town Planning & Enforcement",
                priority="Medium",
                status="Resolved",
                location="Opposite Modern Primary School, Ward 4",
                ward_number="Ward 4 - West",
                latitude=28.6250,
                longitude=77.2100,
                department_notes="Enforcement officer issued notice to builder. Debris removed and fine levied.",
            )
            all_sample_grievances = [g1, g2, g3, g4, g5, g6]
            to_add = [g for g in all_sample_grievances if g.ticket_number not in existing_tickets]
            if to_add:
                db.add_all(to_add)
                db.commit()

        # Seed municipal government schemes if fewer than 6 exist
        if db.query(Service).count() < 6:
            existing_codes = {s.service_code for s in db.query(Service.service_code).all()}
            print("Seeding civic municipal welfare services...")
            s1 = Service(
                service_code="SRV-HOU-01",
                title="PMAY Urban Affordable Housing Scheme",
                category="Housing & Urban Development",
                description="Credit-linked interest subsidy scheme for middle and lower-income families constructing or purchasing their first home.",
                eligibility_criteria="Annual household income up to ₹18 Lakhs. No existing pucca house in India.",
                documents_required="Aadhaar, PAN, Income Certificate, Property Documents, Bank Passbook.",
                application_procedure="Apply online via Citizen Portal with income slip and property title deeds.",
            )
            s2 = Service(
                service_code="SRV-SOL-02",
                title="PM Surya Ghar Muft Bijli Rooftop Solar",
                category="Energy & Sustainability",
                description="Direct financial subsidy up to ₹78,000 for installing residential rooftop solar panels to generate free electricity.",
                eligibility_criteria="Resident homeowner with a grid-connected residential electricity meter.",
                documents_required="Electricity Bill, Property Ownership Proof, Bank Account, Aadhaar.",
                application_procedure="Submit electricity consumer number and technical feasibility self-assessment.",
            )
            s3 = Service(
                service_code="SRV-WAT-03",
                title="Amrit Clean Drinking Water Connection",
                category="Public Utilities",
                description="Subsidized piped potable water connection for all households across municipal wards.",
                eligibility_criteria="Registered resident within municipal corporation limits.",
                documents_required="Municipal Property Tax Receipt, Aadhaar Card, Water Connection Application.",
                application_procedure="Submit application at ward office or digitally via Assistant agent.",
            )
            s4 = Service(
                service_code="SRV-TAX-04",
                title="Municipal Property Tax Online Assessment & Self-Declaration",
                category="Revenue & Taxation",
                description="Digital assessment, GIS plot verification, and early-bird 10% rebate for residential and commercial property owners.",
                eligibility_criteria="All property and plot owners within municipal development limits.",
                documents_required="Sale Deed / Title Deed, Previous Tax Receipt, Building Approval Plan.",
                application_procedure="Enter property assessment PIN or select plot on GIS portal.",
            )
            s5 = Service(
                service_code="SRV-TRD-05",
                title="Digital Trade License & Commercial NOC Portal",
                category="Commerce & Industries",
                description="Instant issuance of municipal health and trade operating licenses for retail shops, restaurants, and startups.",
                eligibility_criteria="Any registered commercial establishment or shop operating within municipal limits.",
                documents_required="GSTIN Certificate, Rental Agreement, Fire Safety NOC, PAN Card.",
                application_procedure="Upload establishment photographs and commercial lease deed.",
            )
            s6 = Service(
                service_code="SRV-REG-06",
                title="Civil Birth & Death Digital Certificate Registration",
                category="Civil Registry & Healthcare",
                description="Digital verification, QR-coded digital certificate issuance, and hospital-linked institutional event recording.",
                eligibility_criteria="All births and deaths occurring within municipal hospital and residential jurisdictions.",
                documents_required="Hospital Discharge/Event Slip, Parents/Applicant Aadhaar Card, Marriage Certificate.",
                application_procedure="Auto-registered through hospital API or apply within 21 days with doctor slip.",
            )
            all_services = [s1, s2, s3, s4, s5, s6]
            srv_to_add = [s for s in all_services if s.service_code not in existing_codes]
            if srv_to_add:
                db.add_all(srv_to_add)
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
