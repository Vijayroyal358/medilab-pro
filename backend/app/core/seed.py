from sqlmodel import Session, select
from app.core.db import engine
from app.models.models import Lab, User, Patient, ReferralDoctor, Test, Appointment, Report, Expense, AuditLog
from app.core.security import get_password_hash
from datetime import datetime, timedelta

def seed_data():
    with Session(engine) as session:
        # Check if labs already exist
        existing_labs = session.exec(select(Lab)).all()
        if existing_labs:
            return  # Database is already seeded
            
        print("Seeding database with demo labs, users, referral doctors, and transactions...")
        
        # 1. Create Labs
        lab_central = Lab(
            name="Central Diagnostic Lab",
            slug="central-lab",
            address="123 Hospital Lane, Medical Center, NY",
            email="info@centrallab.com"
        )
        lab_metro = Lab(
            name="Metro Pathology Lab",
            slug="metro-lab",
            address="456 City Plaza, Downtown, NY",
            email="contact@metropath.com"
        )
        session.add(lab_central)
        session.add(lab_metro)
        session.commit()
        session.refresh(lab_central)
        session.refresh(lab_metro)
        
        # 2. Create Users for Central Lab
        users_central = [
            User(
                email="admin@medilab.pro",
                name="Dr. Sarah Jenkins",
                role="Lab Admin",
                hashed_password=get_password_hash("Admin@123"),
                lab_id=lab_central.id
            ),
            User(
                email="receptionist@medilab.pro",
                name="John Doe",
                role="Receptionist",
                hashed_password=get_password_hash("Reception@123"),
                lab_id=lab_central.id
            ),
            User(
                email="technician@medilab.pro",
                name="Alex Rivera",
                role="Technician",
                hashed_password=get_password_hash("Tech@123"),
                lab_id=lab_central.id
            ),
            User(
                email="doctor@medilab.pro",
                name="Dr. Michael Vance",
                role="Doctor",
                hashed_password=get_password_hash("Doctor@123"),
                lab_id=lab_central.id
            )
        ]
        
        for u in users_central:
            session.add(u)
            
        # 3. Create Users for Metro Lab
        user_metro = User(
            email="metroadmin@medilab.pro",
            name="Dr. Alan Turing",
            role="Lab Admin",
            hashed_password=get_password_hash("Admin@123"),
            lab_id=lab_metro.id
        )
        session.add(user_metro)
        session.commit()

        # 4. Create a Patient User & profile in Central Lab
        user_patient = User(
            email="patient@medilab.pro",
            name="Alice Smith",
            role="Patient",
            hashed_password=get_password_hash("Patient@123"),
            lab_id=lab_central.id
        )
        session.add(user_patient)
        session.commit()
        session.refresh(user_patient)

        # Create Patient Profile for Alice Smith
        patient_profile = Patient(
            lab_id=lab_central.id,
            user_id=user_patient.id,
            patient_id="CDL-1001",
            title="Mrs.",
            first_name="Alice",
            last_name="Smith",
            name="Alice Smith",
            age=29,
            age_years=29,
            age_months=0,
            age_days=0,
            gender="Female",
            dob="1997-05-15",
            blood_group="O+",
            phone="8555053215",
            email="patient@medilab.pro",
            address="789 Pine Street, Brooklyn, NY",
            emergency_contact="Robert Smith (Spouse): 555-0200",
            referring_doctor="Dr. Michael Vance",
            medical_history="Mild asthma, allergic to penicillin.",
            online_report_requested=True
        )
        
        # Another patient
        patient_sundhar = Patient(
            lab_id=lab_central.id,
            patient_id="CDL-1002",
            title="Mr.",
            first_name="Sundhar",
            last_name="Reddy",
            name="Sundhar Reddy",
            age=33,
            age_years=33,
            age_months=0,
            age_days=0,
            gender="Male",
            dob="1993-01-01",
            blood_group="B+",
            phone="8555053216",
            email="sundhar@gmail.com",
            address="12 Main St, Queens, NY",
            referring_doctor="Self",
            online_report_requested=True
        )
        
        session.add(patient_profile)
        session.add(patient_sundhar)
        session.commit()
        session.refresh(patient_profile)
        session.refresh(patient_sundhar)

        # 5. Create Referral Doctors
        doctor_jones = ReferralDoctor(
            lab_id=lab_central.id,
            name="Dr. Amanda Jones",
            email="jones@hospital.com",
            phone="555-0321",
            commission_percentage=15.0
        )
        doctor_watson = ReferralDoctor(
            lab_id=lab_central.id,
            name="Dr. James Watson",
            email="watson@clinic.com",
            phone="555-0322",
            commission_percentage=20.0
        )
        session.add(doctor_watson)
        session.add(doctor_jones)
        session.commit()
        session.refresh(doctor_jones)
        session.refresh(doctor_watson)

        # 6. Create Test Invoices (Bills)
        # We set registration dates to Jan 29, 2026 to match Mockup 1
        jan_29 = datetime(2026, 1, 29, 21, 0, 0)
        
        # Test 1: Lipid Profile - Canceled - #1001 L1
        test_lipid = Test(
            lab_id=lab_central.id,
            patient_id=patient_sundhar.id,
            invoice_number="CDL-INV-1001",
            category="Biochemistry",
            test_name="Lipid Profile",
            price=1200.0,
            discount=0.0,
            discount_type="fixed",
            tax=0.0,
            sample_type="Blood",
            collection_date="2026-01-29 21:47",
            expected_delivery="2026-01-30 09:00",
            payment_status="Pending",
            payment_method="Cash",
            amount_received=0.0,
            balance_due=1200.0,
            collection_centre="Main",
            modality="LAB",
            status="Canceled",
            created_at=jan_29 + timedelta(minutes=47)
        )
        
        # Test 2: HbA1c (Glycosylated Hemoglobin) - Canceled - #1002 L2
        test_hba1c = Test(
            lab_id=lab_central.id,
            patient_id=patient_sundhar.id,
            invoice_number="CDL-INV-1002",
            category="Biochemistry",
            test_name="HbA1c (Glycosylated Hemoglobin)",
            price=800.0,
            discount=0.0,
            discount_type="fixed",
            tax=0.0,
            sample_type="Blood",
            collection_date="2026-01-29 22:00",
            expected_delivery="2026-01-30 09:00",
            payment_status="Pending",
            payment_method="Cash",
            amount_received=0.0,
            balance_due=800.0,
            collection_centre="Main",
            modality="LAB",
            status="Canceled",
            created_at=jan_29 + timedelta(hours=1)
        )
        
        # Test 3: Malaria Antigen - New - #1003 L3
        test_malaria = Test(
            lab_id=lab_central.id,
            patient_id=patient_sundhar.id,
            invoice_number="CDL-INV-1003",
            category="Serology & Immunology",
            test_name="Malaria Antigen",
            price=500.0,
            discount=0.0,
            discount_type="fixed",
            tax=0.0,
            sample_type="Blood",
            collection_date="2026-01-29 22:09",
            expected_delivery="2026-01-30 09:00",
            payment_status="Pending",
            payment_method="Cash",
            amount_received=0.0,
            balance_due=500.0,
            collection_centre="Main",
            modality="LAB",
            status="No due",
            created_at=jan_29 + timedelta(hours=1, minutes=9)
        )
        
        session.add(test_lipid)
        session.add(test_hba1c)
        session.add(test_malaria)
        session.commit()
        session.refresh(test_lipid)
        session.refresh(test_hba1c)
        session.refresh(test_malaria)

        # 7. Add Reports (Dynamic user references)
        report_lipid = Report(
            lab_id=lab_central.id,
            test_id=test_lipid.id,
            patient_id=patient_sundhar.id,
            status="Canceled",
            collected_on="29-01-2026 09:47 PM",
            received_on="29-01-2026 09:50 PM",
            reported_on="29-01-2026 10:30 PM",
            print_results=False
        )
        
        report_hba1c = Report(
            lab_id=lab_central.id,
            test_id=test_hba1c.id,
            patient_id=patient_sundhar.id,
            status="Canceled",
            collected_on="29-01-2026 10:00 PM",
            received_on="29-01-2026 10:02 PM",
            reported_on="29-01-2026 10:45 PM",
            print_results=False
        )
        
        # Malaria Antigen report - Status "New" matching Mockup 1 & 2
        report_malaria = Report(
            lab_id=lab_central.id,
            test_id=test_malaria.id,
            patient_id=patient_sundhar.id,
            status="New",
            collected_on="29-01-2026",
            received_on="29-01-2026",
            reported_on="08-07-2026 09:37 AM",
            results_json='[{"parameter": "IgG", "observed": "", "normal_range": "Negative", "unit": "", "flag": "Normal"}, {"parameter": "IgM", "observed": "", "normal_range": "Negative", "unit": "", "flag": "Normal"}]',
            interpretation="Malaria antigen detection-whole blood\nFour species of the plasmodium parasites are responsible for human malaria infections. P. falciparum, P. vivax, P. ovale and P. malariae. Early detection and differentiation of malaria is of paramount importance due to incidence of cerebral malaria and drug resistance associated with P. falciparum malaria causing most of the morbidity and mortality worldwide.",
            test_utility="The current test is a qualitative test for detection of the P. falciparum specific histidine rich protein-2 (Pf HRP-2) and P. vivax specific lactate dehydrogenase (pv LDH) in whole blood samples. The assay is able to detect and distinguish P. vivax and P. falciparum infections and also identify mixed infections.",
            notes_and_limitations="The test detects P. falciparum specific HRP-2 and P. vivax specific LDH, a negative test result does not rule out infection with P. ovale and P. malariae. Constant exposure to the malarial parasites, as seen in areas of high endemicity, may result in positive results with doubtful clinical significance. Hence, the results must always be correlated with clinical history and relevant epidemiological and therapeutic context."
        )
        
        session.add(report_lipid)
        session.add(report_hba1c)
        session.add(report_malaria)
        session.commit()

        # 8. Add Expenses
        expenses = [
            Expense(lab_id=lab_central.id, description="Purchase of Hematology Reagents", category="Reagents", amount=450.0, payment_method="UPI"),
            Expense(lab_id=lab_central.id, description="Syringes and Swabs replenishment", category="Reagents", amount=120.0, payment_method="Cash"),
            Expense(lab_id=lab_central.id, description="Office Electricity Bill", category="Utilities", amount=350.0, payment_method="Card")
        ]
        for e in expenses:
            session.add(e)
        session.commit()

        # 9. Add Audit Logs
        audit_logs = [
            AuditLog(lab_id=lab_central.id, user_id=users_central[0].id, action="INITIALIZED", details="MediLab Pro LIMS system seeded with standard database datasets.")
        ]
        for a in audit_logs:
            session.add(a)
        session.commit()

        print("Database seeded successfully with new Billing schemas!")
