from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship, UniqueConstraint

# 1. Lab (Tenant) Model
class Lab(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    slug: str = Field(unique=True, index=True)
    address: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    gstin: Optional[str] = None
    pan: Optional[str] = None
    license_path: Optional[str] = None
    google_review_url: Optional[str] = None
    logo_path: Optional[str] = None
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    users: List["User"] = Relationship(back_populates="lab")
    patients: List["Patient"] = Relationship(back_populates="lab")
    tests: List["Test"] = Relationship(back_populates="lab")
    appointments: List["Appointment"] = Relationship(back_populates="lab")
    reports: List["Report"] = Relationship(back_populates="lab")
    audit_logs: List["AuditLog"] = Relationship(back_populates="lab")
    referral_doctors: List["ReferralDoctor"] = Relationship(back_populates="lab")
    expenses: List["Expense"] = Relationship(back_populates="lab")

# 2. User Model
class User(SQLModel, table=True):
    __table_args__ = (
        UniqueConstraint("lab_id", "email", name="uq_user_lab_email"),
    )
    
    id: Optional[int] = Field(default=None, primary_key=True)
    lab_id: Optional[int] = Field(default=None, foreign_key="lab.id", index=True)
    email: str = Field(index=True)
    hashed_password: str
    phone: Optional[str] = Field(default=None, index=True)
    name: str
    role: str = Field(default="Patient")  # "Super Admin", "Lab Admin", "Receptionist", "Technician", "Doctor", "Patient"
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    lab: Lab = Relationship(back_populates="users")
    patient_profile: Optional["Patient"] = Relationship(back_populates="user", sa_relationship_kwargs={"uselist": False})

# 3. Referral Doctor Model
class ReferralDoctor(SQLModel, table=True):
    __tablename__ = "referral_doctor"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    lab_id: int = Field(foreign_key="lab.id", index=True)
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    commission_percentage: float = Field(default=0.0)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    lab: Lab = Relationship(back_populates="referral_doctors")
    tests: List["Test"] = Relationship(back_populates="referral_doctor")

# 4. Patient Model
class Patient(SQLModel, table=True):
    __table_args__ = (
        UniqueConstraint("lab_id", "patient_id", name="uq_patient_lab_patient_id"),
        UniqueConstraint("lab_id", "email", name="uq_patient_lab_email"),
        UniqueConstraint("lab_id", "phone", name="uq_patient_lab_phone"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    lab_id: int = Field(foreign_key="lab.id", index=True)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id", nullable=True) # Linked if patient portal user created
    
    patient_id: str = Field(index=True)  # Auto-generated formatted code, e.g. CDL-10001
    title: Optional[str] = Field(default="Mr.") # Mr, Mrs, Ms, Dr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    name: str
    age: int
    age_years: Optional[int] = Field(default=0)
    age_months: Optional[int] = Field(default=0)
    age_days: Optional[int] = Field(default=0)
    gender: str
    dob: str  # Format YYYY-MM-DD
    blood_group: Optional[str] = None
    phone: str = Field(index=True)
    email: str = Field(index=True)
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    referring_doctor: Optional[str] = None # Plain text fallback
    medical_history: Optional[str] = None
    photo_url: Optional[str] = None
    aadhaar_number: Optional[str] = None
    online_report_requested: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    lab: Lab = Relationship(back_populates="patients")
    user: Optional[User] = Relationship(back_populates="patient_profile")
    tests: List["Test"] = Relationship(back_populates="patient")
    appointments: List["Appointment"] = Relationship(back_populates="patient")
    reports: List["Report"] = Relationship(back_populates="patient")

# 5. Test Model
class Test(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    lab_id: int = Field(foreign_key="lab.id", index=True)
    patient_id: int = Field(foreign_key="patient.id", index=True)
    invoice_number: str = Field(index=True) # Auto-generated
    
    category: str  # Hematology, Pathology, Biochemistry, Microbiology, etc.
    test_name: str
    price: float
    discount: float = Field(default=0.0) # Discount amount
    discount_type: str = Field(default="fixed") # "fixed" or "percentage"
    tax: float = Field(default=0.0)      # Absolute tax amount
    sample_type: Optional[str] = Field(default="Blood")
    collection_date: Optional[str] = None                 # ISO string or date
    expected_delivery: Optional[str] = None               # ISO string or date
    payment_status: str = Field(default="Pending") # "Pending", "Paid"
    payment_method: Optional[str] = Field(default="Cash") # "Cash", "Card", "UPI"
    amount_received: float = Field(default=0.0)
    balance_due: float = Field(default=0.0)
    remarks: Optional[str] = None
    collection_centre: str = Field(default="Main")
    collection_agent: Optional[str] = None
    modality: str = Field(default="LAB") # LAB, USG, XRAY, ECG, CT SCAN, MRI, etc.
    referral_doctor_id: Optional[int] = Field(default=None, foreign_key="referral_doctor.id", nullable=True)
    status: str = Field(default="No due") # "No due", "Has due", "Canceled"
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    lab: Lab = Relationship(back_populates="tests")
    patient: Patient = Relationship(back_populates="tests")
    referral_doctor: Optional[ReferralDoctor] = Relationship(back_populates="tests")
    reports: List["Report"] = Relationship(back_populates="test")

# 6. Appointment Model
class Appointment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    lab_id: int = Field(foreign_key="lab.id", index=True)
    patient_id: int = Field(foreign_key="patient.id", index=True)
    
    appointment_date: str # Format YYYY-MM-DD HH:MM
    queue_number: int
    status: str = Field(default="Scheduled") # "Scheduled", "In-Progress", "Completed", "Cancelled"
    doctor_name: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    lab: Lab = Relationship(back_populates="appointments")
    patient: Patient = Relationship(back_populates="appointments")

# 7. Report Model
class Report(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    lab_id: int = Field(foreign_key="lab.id", index=True)
    test_id: int = Field(foreign_key="test.id", index=True)
    patient_id: int = Field(foreign_key="patient.id", index=True)
    
    technician_id: Optional[int] = Field(default=None, foreign_key="user.id", nullable=True)
    doctor_id: Optional[int] = Field(default=None, foreign_key="user.id", nullable=True)
    
    status: str = Field(default="New") # "New", "In progress", "Final", "Signed off", "Canceled"
    results_data: Optional[str] = None    # Stored JSON string or text results
    results_json: Optional[str] = None    # Structured parameter values (observed, reference range, high/low flag)
    pdf_path: Optional[str] = None
    
    collected_on: Optional[str] = None
    received_on: Optional[str] = None
    reported_on: Optional[str] = None
    interpretation: Optional[str] = None
    test_utility: Optional[str] = None
    notes_and_limitations: Optional[str] = None
    remarks: Optional[str] = None
    advice: Optional[str] = None
    
    print_categories_new_page: bool = Field(default=False)
    print_results: bool = Field(default=True)
    page_break_after: bool = Field(default=False)
    skip_interpretation: bool = Field(default=False)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    lab: Lab = Relationship(back_populates="reports")
    patient: Patient = Relationship(back_populates="reports")
    test: Test = Relationship(back_populates="reports")

# 8. Expense Model
class Expense(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    lab_id: int = Field(foreign_key="lab.id", index=True)
    description: str
    category: str # "Reagents", "Rent", "Salary", "Utilities", "Other"
    amount: float
    payment_method: str # "Cash", "Card", "UPI"
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    lab: Lab = Relationship(back_populates="expenses")

# 9. AuditLog Model
class AuditLog(SQLModel, table=True):
    __tablename__ = "audit_log"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    lab_id: int = Field(foreign_key="lab.id", index=True)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id", nullable=True)
    
    action: str
    details: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    lab: Lab = Relationship(back_populates="audit_logs")

# 10. StaffOTP Model
class StaffOTP(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    phone: str = Field(index=True)
    otp: str
    expires_at: datetime = Field(default_factory=datetime.utcnow)

