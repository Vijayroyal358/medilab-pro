from sqlmodel import Session, select, func
from app.models.models import Lab, User, Patient, Test, Appointment, Report, AuditLog, ReferralDoctor, Expense
from app.schemas.schemas import PatientCreate, PatientUpdate, TestCreate, AppointmentCreate, ReportUpdate, UserCreate, ReferralDoctorCreate, ReferralDoctorUpdate, ExpenseCreate
from app.core.security import get_password_hash
from datetime import datetime

# --- Lab CRUD ---
def get_lab_by_slug(db: Session, slug: str):
    return db.exec(select(Lab).where(Lab.slug == slug)).first()

def get_lab(db: Session, lab_id: int):
    return db.exec(select(Lab).where(Lab.id == lab_id)).first()

def create_lab(db: Session, name: str, slug: str, address: str = None, email: str = None) -> Lab:
    db_lab = Lab(name=name, slug=slug, address=address, email=email)
    db.add(db_lab)
    db.commit()
    db.refresh(db_lab)
    return db_lab

# --- User CRUD ---
def get_user_by_email_and_lab(db: Session, email: str, lab_id: int):
    return db.exec(select(User).where(User.email == email, User.lab_id == lab_id)).first()

def create_user(db: Session, user_in: UserCreate) -> User:
    hashed_pwd = get_password_hash(user_in.password)
    db_user = User(
        email=user_in.email,
        hashed_password=hashed_pwd,
        phone=user_in.phone,
        name=user_in.name,
        role=user_in.role,
        lab_id=user_in.lab_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- Referral Doctor CRUD ---
def get_referral_doctors(db: Session, lab_id: int):
    return db.exec(select(ReferralDoctor).where(ReferralDoctor.lab_id == lab_id)).all()

def get_referral_doctor(db: Session, doctor_id: int, lab_id: int):
    return db.exec(select(ReferralDoctor).where(ReferralDoctor.id == doctor_id, ReferralDoctor.lab_id == lab_id)).first()

def create_referral_doctor(db: Session, doc_in: ReferralDoctorCreate, lab_id: int) -> ReferralDoctor:
    db_doc = ReferralDoctor(
        lab_id=lab_id,
        name=doc_in.name,
        email=doc_in.email,
        phone=doc_in.phone,
        commission_percentage=doc_in.commission_percentage
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    return db_doc

def update_referral_doctor(db: Session, db_doc: ReferralDoctor, doc_up: ReferralDoctorUpdate) -> ReferralDoctor:
    update_data = doc_up.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_doc, key, value)
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    return db_doc

def delete_referral_doctor(db: Session, db_doc: ReferralDoctor) -> None:
    db.delete(db_doc)
    db.commit()

# --- Patient CRUD ---
def get_patient_by_email_in_lab(db: Session, email: str, lab_id: int):
    return db.exec(select(Patient).where(Patient.email == email, Patient.lab_id == lab_id)).first()

def get_patient_by_phone_in_lab(db: Session, phone: str, lab_id: int):
    return db.exec(select(Patient).where(Patient.phone == phone, Patient.lab_id == lab_id)).first()

def get_patient(db: Session, patient_id: int, lab_id: int):
    return db.exec(select(Patient).where(Patient.id == patient_id, Patient.lab_id == lab_id)).first()

def get_patients_in_lab(db: Session, lab_id: int, query: str = None):
    stmt = select(Patient).where(Patient.lab_id == lab_id)
    if query:
        stmt = stmt.where(
            (Patient.name.contains(query)) | 
            (Patient.patient_id.contains(query)) | 
            (Patient.phone.contains(query))
        )
    return db.exec(stmt.order_by(Patient.created_at.desc())).all()

def create_patient_in_lab(db: Session, patient_in: PatientCreate, lab_id: int) -> Patient:
    lab = get_lab(db, lab_id)
    initials = "".join([w[0].upper() for w in lab.name.split() if w])[:4]
    
    count = db.exec(select(func.count(Patient.id)).where(Patient.lab_id == lab_id)).one()
    unique_num = 1001 + count
    patient_id_str = f"{initials}-{unique_num}"
    
    # Auto assemble name if first/last provided
    full_name = patient_in.name
    if patient_in.first_name:
        full_name = f"{patient_in.first_name} {patient_in.last_name or ''}".strip()
    
    db_patient = Patient(
        lab_id=lab_id,
        patient_id=patient_id_str,
        title=patient_in.title,
        first_name=patient_in.first_name,
        last_name=patient_in.last_name,
        name=full_name,
        age=patient_in.age,
        age_years=patient_in.age_years or patient_in.age,
        age_months=patient_in.age_months or 0,
        age_days=patient_in.age_days or 0,
        gender=patient_in.gender,
        dob=patient_in.dob,
        blood_group=patient_in.blood_group,
        phone=patient_in.phone,
        email=patient_in.email,
        address=patient_in.address,
        emergency_contact=patient_in.emergency_contact,
        referring_doctor=patient_in.referring_doctor,
        medical_history=patient_in.medical_history,
        photo_url=patient_in.photo_url,
        aadhaar_number=patient_in.aadhaar_number,
        online_report_requested=patient_in.online_report_requested
    )
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

def update_patient_in_lab(db: Session, db_patient: Patient, patient_update: PatientUpdate) -> Patient:
    update_data = patient_update.model_dump(exclude_unset=True)
    
    if "first_name" in update_data or "last_name" in update_data:
        fn = update_data.get("first_name", db_patient.first_name)
        ln = update_data.get("last_name", db_patient.last_name)
        db_patient.name = f"{fn or ''} {ln or ''}".strip()
        
    for key, value in update_data.items():
        if key != "name":
            setattr(db_patient, key, value)
            
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

def delete_patient_in_lab(db: Session, db_patient: Patient) -> None:
    db.delete(db_patient)
    db.commit()

# --- Test CRUD ---
def get_tests_in_lab(db: Session, lab_id: int):
    stmt = (
        select(Test, Patient.name, Patient.phone, ReferralDoctor.name)
        .join(Patient, Test.patient_id == Patient.id)
        .join(ReferralDoctor, Test.referral_doctor_id == ReferralDoctor.id, isouter=True)
        .where(Test.lab_id == lab_id)
    )
    results = db.exec(stmt).all()
    
    tests_out = []
    for test, p_name, p_phone, doc_name in results:
        test_dict = test.model_dump()
        test_dict["patient_name"] = p_name
        test_dict["patient_phone"] = p_phone
        test_dict["referral_doctor_name"] = doc_name or "Self"
        tests_out.append(test_dict)
    return tests_out

def create_test_in_lab(db: Session, test_in: TestCreate, lab_id: int) -> Test:
    lab = get_lab(db, lab_id)
    initials = "".join([w[0].upper() for w in lab.name.split() if w])[:4]
    
    if hasattr(test_in, 'invoice_number') and test_in.invoice_number:
        invoice_str = test_in.invoice_number
    else:
        count = db.exec(select(func.count(Test.id)).where(Test.lab_id == lab_id)).one()
        invoice_str = f"{initials}-INV-{1001 + count}"
    
    # Calculate balance due
    # Net Price = Price - Discount + Tax
    # Discount calculation
    discount_val = test_in.discount
    if test_in.discount_type == "percentage":
        discount_val = (test_in.price * test_in.discount / 100.0)
        
    net_price = test_in.price - discount_val + test_in.tax
    balance = net_price - test_in.amount_received
    
    # Determine test status
    status_str = "No due"
    if test_in.status == "Canceled":
        status_str = "Canceled"
    elif balance > 0:
        status_str = "Has due"
        
    db_test = Test(
        lab_id=lab_id,
        patient_id=test_in.patient_id,
        invoice_number=invoice_str,
        category=test_in.category,
        test_name=test_in.test_name,
        price=test_in.price,
        discount=discount_val,
        discount_type=test_in.discount_type,
        tax=test_in.tax,
        sample_type=test_in.sample_type,
        collection_date=test_in.collection_date or datetime.utcnow().strftime("%Y-%m-%d %H:%M"),
        expected_delivery=test_in.expected_delivery,
        payment_status="Paid" if balance <= 0 else "Pending",
        payment_method=test_in.payment_method,
        amount_received=test_in.amount_received,
        balance_due=max(balance, 0.0),
        remarks=test_in.remarks,
        collection_centre=test_in.collection_centre,
        collection_agent=test_in.collection_agent,
        modality=test_in.modality,
        referral_doctor_id=test_in.referral_doctor_id,
        status=status_str
    )
    db.add(db_test)
    db.commit()
    db.refresh(db_test)
    
    # Initialize report
    import json
    default_results = "[]"
    t_name = db_test.test_name.lower()
    
    if "malaria" in t_name:
        default_results = json.dumps([
            {"parameter": "IgG", "observed": "", "normal_range": "Negative", "unit": "", "flag": "Normal"},
            {"parameter": "IgM", "observed": "", "normal_range": "Negative", "unit": "", "flag": "Normal"}
        ])
    elif "lipid" in t_name:
        default_results = json.dumps([
            {"parameter": "Total Cholesterol", "observed": "", "normal_range": "< 200", "unit": "mg/dL", "flag": "Normal"},
            {"parameter": "Triglycerides", "observed": "", "normal_range": "< 150", "unit": "mg/dL", "flag": "Normal"},
            {"parameter": "HDL Cholesterol", "observed": "", "normal_range": "> 40", "unit": "mg/dL", "flag": "Normal"},
            {"parameter": "LDL Cholesterol", "observed": "", "normal_range": "< 100", "unit": "mg/dL", "flag": "Normal"}
        ])
    elif "hba1c" in t_name or "glycosylated" in t_name:
        default_results = json.dumps([
            {"parameter": "HbA1c", "observed": "", "normal_range": "4.0 - 5.6", "unit": "%", "flag": "Normal"}
        ])
    elif "urine" in t_name:
        default_results = json.dumps([
            {"parameter": "Color", "observed": "", "normal_range": "Pale Yellow", "unit": "", "flag": "Normal"},
            {"parameter": "Transparency", "observed": "", "normal_range": "Clear", "unit": "", "flag": "Normal"},
            {"parameter": "pH", "observed": "", "normal_range": "4.5 - 8.0", "unit": "", "flag": "Normal"},
            {"parameter": "Protein", "observed": "", "normal_range": "Nil", "unit": "", "flag": "Normal"},
            {"parameter": "Glucose", "observed": "", "normal_range": "Nil", "unit": "", "flag": "Normal"}
        ])
    elif "cbc" in t_name or "complete blood count" in t_name:
        default_results = json.dumps([
            {"parameter": "Hemoglobin", "observed": "", "normal_range": "13.8 - 17.2", "unit": "g/dL", "flag": "Normal"},
            {"parameter": "Red Blood Cells", "observed": "", "normal_range": "4.5 - 5.9", "unit": "x10^6/uL", "flag": "Normal"},
            {"parameter": "White Blood Cells", "observed": "", "normal_range": "4.0 - 11.0", "unit": "x10^3/uL", "flag": "Normal"},
            {"parameter": "Platelets", "observed": "", "normal_range": "150 - 450", "unit": "x10^3/uL", "flag": "Normal"}
        ])

    db_report = Report(
        lab_id=lab_id,
        test_id=db_test.id,
        patient_id=db_test.patient_id,
        status="Pending",
        results_json=default_results
    )
    db.add(db_report)
    db.commit()
    
    return db_test

def update_test_payment_status(db: Session, test_id: int, lab_id: int, status: str) -> Test:
    db_test = db.exec(select(Test).where(Test.id == test_id, Test.lab_id == lab_id)).first()
    if db_test:
        if status == "Canceled":
            db_test.status = "Canceled"
            db_test.balance_due = 0.0
        else:
            db_test.payment_status = status
            if status == "Paid":
                # Net Price = Price - Discount + Tax
                net_price = db_test.price - db_test.discount + db_test.tax
                db_test.amount_received = net_price
                db_test.balance_due = 0.0
                db_test.status = "No due"
            else:
                db_test.amount_received = 0.0
                db_test.balance_due = db_test.price - db_test.discount + db_test.tax
                db_test.status = "Has due"
            
        db.add(db_test)
        db.commit()
        db.refresh(db_test)
    return db_test

# --- Appointment CRUD ---
def get_appointments_in_lab(db: Session, lab_id: int, date_str: str = None):
    stmt = select(Appointment, Patient.name, Patient.phone).join(Patient, Appointment.patient_id == Patient.id).where(Appointment.lab_id == lab_id)
    if date_str:
        stmt = stmt.where(Appointment.appointment_date.like(f"{date_str}%"))
    results = db.exec(stmt).all()
    
    appt_out = []
    for appt, p_name, p_phone in results:
        appt_dict = appt.model_dump()
        appt_dict["patient_name"] = p_name
        appt_dict["patient_phone"] = p_phone
        appt_out.append(appt_dict)
    return appt_out

def create_appointment_in_lab(db: Session, appt_in: AppointmentCreate, lab_id: int) -> Appointment:
    date_day = appt_in.appointment_date[:10]
    count = db.exec(select(func.count(Appointment.id)).where(
        Appointment.lab_id == lab_id,
        Appointment.appointment_date.like(f"{date_day}%")
    )).one()
    queue_num = count + 1
    
    db_appt = Appointment(
        lab_id=lab_id,
        patient_id=appt_in.patient_id,
        appointment_date=appt_in.appointment_date,
        queue_number=queue_num,
        doctor_name=appt_in.doctor_name,
        notes=appt_in.notes,
        status="Scheduled"
    )
    db.add(db_appt)
    db.commit()
    db.refresh(db_appt)
    return db_appt

def update_appointment_status(db: Session, appt_id: int, lab_id: int, status: str) -> Appointment:
    db_appt = db.exec(select(Appointment).where(Appointment.id == appt_id, Appointment.lab_id == lab_id)).first()
    if db_appt:
        db_appt.status = status
        db.add(db_appt)
        db.commit()
        db.refresh(db_appt)
    return db_appt

# --- Report CRUD ---
def get_reports_in_lab(db: Session, lab_id: int):
    stmt = (
        select(Report, Patient.name, Patient.patient_id, Test.test_name)
        .join(Patient, Report.patient_id == Patient.id)
        .join(Test, Report.test_id == Test.id)
        .where(Report.lab_id == lab_id)
    )
    results = db.exec(stmt).all()
    
    reports_out = []
    for report, p_name, p_code, t_name in results:
        r_dict = report.model_dump()
        r_dict["patient_name"] = p_name
        r_dict["patient_id_code"] = p_code
        r_dict["test_name"] = t_name
        reports_out.append(r_dict)
    return reports_out

def get_reports_for_patient(db: Session, patient_user_id: int, lab_id: int):
    patient = db.exec(select(Patient).where(Patient.user_id == patient_user_id, Patient.lab_id == lab_id)).first()
    if not patient:
        return []
    
    stmt = (
        select(Report, Patient.name, Patient.patient_id, Test.test_name)
        .join(Patient, Report.patient_id == Patient.id)
        .join(Test, Report.test_id == Test.id)
        .where(Report.lab_id == lab_id, Report.patient_id == patient.id)
    )
    results = db.exec(stmt).all()
    
    reports_out = []
    for report, p_name, p_code, t_name in results:
        r_dict = report.model_dump()
        r_dict["patient_name"] = p_name
        r_dict["patient_id_code"] = p_code
        r_dict["test_name"] = t_name
        reports_out.append(r_dict)
    return reports_out

def update_report_results(db: Session, report_id: int, lab_id: int, report_in: ReportUpdate, user_id: int) -> Report:
    db_report = db.exec(select(Report).where(Report.id == report_id, Report.lab_id == lab_id)).first()
    if db_report:
        db_report.status = report_in.status
        db_report.updated_at = datetime.utcnow()
        if report_in.results_data is not None:
            db_report.results_data = report_in.results_data
        if report_in.results_json is not None:
            db_report.results_json = report_in.results_json
        if report_in.pdf_path is not None:
            db_report.pdf_path = report_in.pdf_path
            
        # Copy the new fields
        if report_in.collected_on is not None:
            db_report.collected_on = report_in.collected_on
        if report_in.received_on is not None:
            db_report.received_on = report_in.received_on
        if report_in.reported_on is not None:
            db_report.reported_on = report_in.reported_on
        if report_in.interpretation is not None:
            db_report.interpretation = report_in.interpretation
        if report_in.test_utility is not None:
            db_report.test_utility = report_in.test_utility
        if report_in.notes_and_limitations is not None:
            db_report.notes_and_limitations = report_in.notes_and_limitations
        if report_in.remarks is not None:
            db_report.remarks = report_in.remarks
        if report_in.advice is not None:
            db_report.advice = report_in.advice
            
        if report_in.print_categories_new_page is not None:
            db_report.print_categories_new_page = report_in.print_categories_new_page
        if report_in.print_results is not None:
            db_report.print_results = report_in.print_results
        if report_in.page_break_after is not None:
            db_report.page_break_after = report_in.page_break_after
        if report_in.skip_interpretation is not None:
            db_report.skip_interpretation = report_in.skip_interpretation
        
        user = db.exec(select(User).where(User.id == user_id)).first()
        if user:
            if user.role == "Technician":
                db_report.technician_id = user_id
            elif user.role == "Doctor":
                db_report.doctor_id = user_id
        
        db.add(db_report)
        db.commit()
        db.refresh(db_report)
        
        create_audit_log(
            db, 
            lab_id=lab_id, 
            user_id=user_id, 
            action="UPDATE_REPORT", 
            details=f"Report ID {report_id} status updated to {report_in.status}"
        )
    return db_report

# --- Expense CRUD ---
def get_expenses_in_lab(db: Session, lab_id: int):
    return db.exec(select(Expense).where(Expense.lab_id == lab_id)).all()

def create_expense_in_lab(db: Session, exp_in: ExpenseCreate, lab_id: int) -> Expense:
    db_exp = Expense(
        lab_id=lab_id,
        description=exp_in.description,
        category=exp_in.category,
        amount=exp_in.amount,
        payment_method=exp_in.payment_method
    )
    db.add(db_exp)
    db.commit()
    db.refresh(db_exp)
    return db_exp

# --- Audit Logs ---
def create_audit_log(db: Session, lab_id: int, user_id: int, action: str, details: str) -> AuditLog:
    log = AuditLog(lab_id=lab_id, user_id=user_id, action=action, details=details)
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

def get_audit_logs_in_lab(db: Session, lab_id: int, limit: int = 100):
    return db.exec(select(AuditLog).where(AuditLog.lab_id == lab_id).order_by(AuditLog.created_at.desc()).limit(limit)).all()
