from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any, Dict
from datetime import datetime

# --- Auth Schemas ---
class UserLogin(BaseModel):
    email: EmailStr
    password: str
    remember_me: bool = False

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    role: str
    name: str
    lab_id: int
    lab_name: str

class TokenRefreshRequest(BaseModel):
    refresh_token: str

class ForgotPasswordRequest(BaseModel):
    email: str
    lab_slug: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

# --- Lab Schemas ---
class LabCreate(BaseModel):
    name: str
    slug: str
    address: Optional[str] = None
    email: Optional[str] = None

# --- User Profile / Registration ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str # "Lab Admin", "Receptionist", "Technician", "Doctor", "Patient"
    lab_id: int
    phone: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: str
    phone: Optional[str] = None
    name: str
    role: str
    lab_id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- Referral Doctor Schemas ---
class ReferralDoctorCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    commission_percentage: float = 0.0

class ReferralDoctorUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    commission_percentage: Optional[float] = None

class ReferralDoctorResponse(BaseModel):
    id: int
    lab_id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    commission_percentage: float
    created_at: datetime

    class Config:
        from_attributes = True

# --- Patient Schemas ---
class PatientCreate(BaseModel):
    title: Optional[str] = "Mr."
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    name: str
    age: int
    age_years: Optional[int] = 0
    age_months: Optional[int] = 0
    age_days: Optional[int] = 0
    gender: str
    dob: str # YYYY-MM-DD
    blood_group: Optional[str] = None
    phone: str
    email: EmailStr
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    referring_doctor: Optional[str] = None
    medical_history: Optional[str] = None
    photo_url: Optional[str] = None
    aadhaar_number: Optional[str] = None
    online_report_requested: bool = False

class PatientUpdate(BaseModel):
    title: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    name: Optional[str] = None
    age: Optional[int] = None
    age_years: Optional[int] = None
    age_months: Optional[int] = None
    age_days: Optional[int] = None
    gender: Optional[str] = None
    dob: Optional[str] = None
    blood_group: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    referring_doctor: Optional[str] = None
    medical_history: Optional[str] = None
    photo_url: Optional[str] = None
    aadhaar_number: Optional[str] = None
    online_report_requested: Optional[bool] = None

class PatientResponse(BaseModel):
    id: int
    patient_id: str
    lab_id: int
    user_id: Optional[int] = None
    title: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    name: str
    age: int
    age_years: int
    age_months: int
    age_days: int
    gender: str
    dob: str
    blood_group: Optional[str] = None
    phone: str
    email: str
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    referring_doctor: Optional[str] = None
    medical_history: Optional[str] = None
    photo_url: Optional[str] = None
    aadhaar_number: Optional[str] = None
    online_report_requested: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- Test Schemas ---
class TestCreate(BaseModel):
    patient_id: int
    invoice_number: Optional[str] = None
    category: str
    test_name: str
    price: float
    discount: float = 0.0
    discount_type: str = "fixed" # "fixed" or "percentage"
    tax: float = 0.0
    sample_type: Optional[str] = "Blood"
    collection_date: Optional[str] = None
    expected_delivery: Optional[str] = None
    payment_status: str = "Pending" # "Pending", "Paid"
    payment_method: Optional[str] = "Cash" # "Cash", "Card", "UPI"
    amount_received: float = 0.0
    balance_due: float = 0.0
    remarks: Optional[str] = None
    collection_centre: str = "Main"
    collection_agent: Optional[str] = None
    modality: str = "LAB"
    referral_doctor_id: Optional[int] = None
    status: str = "No due"

class TestUpdate(BaseModel):
    payment_status: Optional[str] = None
    payment_method: Optional[str] = None
    amount_received: Optional[float] = None
    balance_due: Optional[float] = None
    status: Optional[str] = None
    discount: Optional[float] = None
    tax: Optional[float] = None

class TestResponse(BaseModel):
    id: int
    lab_id: int
    patient_id: int
    invoice_number: str
    category: str
    test_name: str
    price: float
    discount: float
    discount_type: str
    tax: float
    sample_type: Optional[str]
    collection_date: Optional[str]
    expected_delivery: Optional[str]
    payment_status: str
    payment_method: Optional[str]
    amount_received: float
    balance_due: float
    remarks: Optional[str]
    collection_centre: str
    collection_agent: Optional[str]
    modality: str
    referral_doctor_id: Optional[int]
    status: str
    created_at: datetime
    patient_name: Optional[str] = None
    patient_phone: Optional[str] = None
    referral_doctor_name: Optional[str] = None

    class Config:
        from_attributes = True

# --- Appointment Schemas ---
class AppointmentCreate(BaseModel):
    patient_id: int
    appointment_date: str # YYYY-MM-DD HH:MM
    doctor_name: Optional[str] = None
    notes: Optional[str] = None

class AppointmentUpdate(BaseModel):
    status: str # "Scheduled", "In-Progress", "Completed", "Cancelled"
    doctor_name: Optional[str] = None
    notes: Optional[str] = None

class AppointmentResponse(BaseModel):
    id: int
    lab_id: int
    patient_id: int
    appointment_date: str
    queue_number: int
    status: str
    doctor_name: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    patient_name: Optional[str] = None
    patient_phone: Optional[str] = None

    class Config:
        from_attributes = True

# --- Report Schemas ---
class ReportUpdate(BaseModel):
    status: str # "Pending", "Processing", "Completed"
    results_data: Optional[str] = None
    results_json: Optional[str] = None
    pdf_path: Optional[str] = None
    collected_on: Optional[str] = None
    received_on: Optional[str] = None
    reported_on: Optional[str] = None
    interpretation: Optional[str] = None
    test_utility: Optional[str] = None
    notes_and_limitations: Optional[str] = None
    remarks: Optional[str] = None
    advice: Optional[str] = None
    print_categories_new_page: Optional[bool] = None
    print_results: Optional[bool] = None
    page_break_after: Optional[bool] = None
    skip_interpretation: Optional[bool] = None

class ReportResponse(BaseModel):
    id: int
    lab_id: int
    test_id: int
    patient_id: int
    technician_id: Optional[int] = None
    doctor_id: Optional[int] = None
    status: str
    results_data: Optional[str] = None
    results_json: Optional[str] = None
    pdf_path: Optional[str] = None
    collected_on: Optional[str] = None
    received_on: Optional[str] = None
    reported_on: Optional[str] = None
    interpretation: Optional[str] = None
    test_utility: Optional[str] = None
    notes_and_limitations: Optional[str] = None
    remarks: Optional[str] = None
    advice: Optional[str] = None
    print_categories_new_page: bool
    print_results: bool
    page_break_after: bool
    skip_interpretation: bool
    created_at: datetime
    updated_at: datetime
    patient_name: Optional[str] = None
    patient_id_code: Optional[str] = None
    test_name: Optional[str] = None

    class Config:
        from_attributes = True

# --- Expense Schemas ---
class ExpenseCreate(BaseModel):
    description: str
    category: str # "Reagents", "Rent", "Salary", "Utilities", "Other"
    amount: float
    payment_method: str # "Cash", "Card", "UPI"

class ExpenseResponse(BaseModel):
    id: int
    lab_id: int
    description: str
    category: str
    amount: float
    payment_method: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Dashboard Stats Schemas ---
class DashboardActivity(BaseModel):
    time: str
    user: str
    action: str
    details: str

class WeeklyPatientStat(BaseModel):
    day: str
    patients: int

class WeeklyRevenueStat(BaseModel):
    day: str
    revenue: float

class DashboardDueInvoice(BaseModel):
    id: int
    patient_name: str = ""
    invoice_number: str
    test_name: str
    balance_due: float
    created_at: str

class DashboardTransaction(BaseModel):
    id: int
    patient_name: str
    amount_paid: float
    payment_method: str
    time: str

class DashboardStats(BaseModel):
    today_patients: int
    today_appointments: int
    pending_reports: int
    completed_reports: int
    today_revenue: float
    pending_payments: float
    today_expenses: float
    today_commissions: float
    today_revenue_split: Dict[str, float]
    weekly_patients: List[WeeklyPatientStat]
    weekly_revenue: List[WeeklyRevenueStat]
    recent_activities: List[DashboardActivity]
    payments_due: List[Dict[str, Any]] = []
    recent_transactions: List[Dict[str, Any]] = []
    samples_collected: Optional[int] = 0
    test_statistics: Optional[Dict[str, float]] = None
    today_appointments_list: List[Dict[str, Any]] = []
    active_patients_count: Optional[int] = 0
    total_reports_count: Optional[int] = 0
    tests_this_month_count: Optional[int] = 0
    monthly_collections: Optional[float] = 0.0

# --- Additional Auth Schemas ---
class GoogleLoginRequest(BaseModel):
    id_token: str

class OTPSendRequest(BaseModel):
    phone: str

class OTPVerifyRequest(BaseModel):
    phone: str
    otp: str

