export interface UserLogin {
  email: string;
  password: string;
  remember_me: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  role: string;
  name: string;
  lab_id: number;
  lab_name: string;
}

export interface ForgotPasswordRequest {
  email: string;
  lab_slug: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  lab_id: number;
  is_active: boolean;
}

export interface ReferralDoctor {
  id: number;
  lab_id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  commission_percentage: number;
  created_at: string;
}

export interface ReferralDoctorCreate {
  name: string;
  email?: string | null;
  phone?: string | null;
  commission_percentage: number;
}

export interface ReferralDoctorUpdate extends Partial<ReferralDoctorCreate> {}

export interface ReferralBusinessReport {
  doctor_name: string;
  commission_percentage: number;
  cases_referred: number;
  total_business: number;
  total_commission: number;
  cases: Array<{
    invoice_number: string;
    patient_name: string;
    test_name: string;
    net_amount: number;
    commission: number;
    date: string;
  }>;
}

export interface Patient {
  id: number;
  patient_id: string;
  lab_id: number;
  user_id?: number | null;
  title?: string;
  first_name?: string;
  last_name?: string;
  name: string;
  age: number;
  age_years: number;
  age_months: number;
  age_days: number;
  gender: string;
  dob: string;
  blood_group?: string;
  phone: string;
  email: string;
  address?: string;
  emergency_contact?: string;
  referring_doctor?: string;
  medical_history?: string;
  photo_url?: string;
  aadhaar_number?: string;
  online_report_requested: boolean;
  created_at: string;
}

export interface PatientCreate {
  title?: string;
  first_name?: string;
  last_name?: string;
  name: string;
  age: number;
  age_years?: number;
  age_months?: number;
  age_days?: number;
  gender: string;
  dob: string;
  blood_group?: string;
  phone: string;
  email: string;
  address?: string;
  emergency_contact?: string;
  referring_doctor?: string;
  medical_history?: string;
  photo_url?: string;
  aadhaar_number?: string;
  online_report_requested?: boolean;
}

export interface PatientUpdate extends Partial<PatientCreate> {}

export interface Test {
  id: number;
  lab_id: number;
  patient_id: number;
  invoice_number: string;
  category: string;
  test_name: string;
  price: number;
  discount: number;
  discount_type: string;
  tax: number;
  sample_type?: string;
  collection_date?: string;
  expected_delivery?: string;
  payment_status: string;
  payment_method?: string;
  amount_received: number;
  balance_due: number;
  remarks?: string;
  collection_centre: string;
  collection_agent?: string;
  modality: string;
  referral_doctor_id?: number | null;
  status: string;
  created_at: string;
  patient_name?: string;
  patient_phone?: string;
  referral_doctor_name?: string;
}

export interface TestCreate {
  patient_id: number;
  invoice_number?: string;
  category: string;
  test_name: string;
  price: number;
  discount?: number;
  discount_type?: string;
  tax?: number;
  sample_type?: string;
  collection_date?: string;
  expected_delivery?: string;
  payment_status?: string;
  payment_method?: string;
  amount_received?: number;
  balance_due?: number;
  remarks?: string;
  collection_centre?: string;
  collection_agent?: string;
  modality?: string;
  referral_doctor_id?: number | null;
  status?: string;
}

export interface Appointment {
  id: number;
  lab_id: number;
  patient_id: number;
  appointment_date: string;
  queue_number: number;
  status: string;
  doctor_name?: string;
  notes?: string;
  created_at: string;
  patient_name?: string;
  patient_phone?: string;
}

export interface AppointmentCreate {
  patient_id: number;
  appointment_date: string;
  doctor_name?: string;
  notes?: string;
}

export interface Report {
  id: number;
  lab_id: number;
  test_id: number;
  patient_id: number;
  technician_id?: number | null;
  doctor_id?: number | null;
  status: string;
  results_data?: string | null;
  results_json?: string | null;
  pdf_path?: string | null;
  collected_on?: string | null;
  received_on?: string | null;
  reported_on?: string | null;
  interpretation?: string | null;
  test_utility?: string | null;
  notes_and_limitations?: string | null;
  remarks?: string | null;
  advice?: string | null;
  print_categories_new_page: boolean;
  print_results: boolean;
  page_break_after: boolean;
  skip_interpretation: boolean;
  created_at: string;
  updated_at: string;
  patient_name?: string;
  patient_id_code?: string;
  test_name?: string;
  
  // PDF Preview fields
  lab_name?: string;
  lab_address?: string;
  lab_phone?: string;
  lab_email?: string;
  lab_website?: string;
  lab_gstin?: string;
  lab_pan?: string;
  patient_age_gender?: string;
  report_id?: number;
  technician_signed?: boolean;
  doctor_signed?: boolean;
  download_url?: string;
  invoice_number?: string;
  category?: string;
  referring_doctor?: string;
  patient_gender?: string;
  patient_dob?: string;
  patient_blood_group?: string;
  patient_phone?: string;
  patient_email?: string;
  patient_address?: string;
}

export interface ReportUpdate {
  status: string;
  results_data?: string | null;
  results_json?: string | null;
  pdf_path?: string | null;
  collected_on?: string | null;
  received_on?: string | null;
  reported_on?: string | null;
  interpretation?: string | null;
  test_utility?: string | null;
  notes_and_limitations?: string | null;
  remarks?: string | null;
  advice?: string | null;
  print_categories_new_page?: boolean;
  print_results?: boolean;
  page_break_after?: boolean;
  skip_interpretation?: boolean;
}

export interface Expense {
  id: number;
  lab_id: number;
  description: string;
  category: string;
  amount: number;
  payment_method: string;
  created_at: string;
}

export interface ExpenseCreate {
  description: string;
  category: string;
  amount: number;
  payment_method: string;
}

export interface DashboardActivity {
  time: string;
  user: string;
  action: string;
  details: string;
}

export interface WeeklyPatientStat {
  day: string;
  patients: number;
}

export interface WeeklyRevenueStat {
  day: string;
  revenue: number;
}

export interface DashboardStats {
  today_patients: number;
  today_appointments: number;
  pending_reports: number;
  completed_reports: number;
  today_revenue: number;
  pending_payments: number;
  today_expenses: number;
  today_commissions: number;
  today_revenue_split: Record<string, number>;
  weekly_patients: WeeklyPatientStat[];
  weekly_revenue: WeeklyRevenueStat[];
  recent_activities: DashboardActivity[];
  payments_due: Array<{
    id: number;
    patient_name: string;
    invoice_number: string;
    test_name: string;
    balance_due: number;
    created_at: string;
  }>;
  recent_transactions: Array<{
    id: number;
    patient_name: string;
    amount_paid: number;
    payment_method: string;
    time: string;
  }>;
  samples_collected?: number;
  test_statistics?: Record<string, number>;
  today_appointments_list?: Array<{
    id: number;
    time: string;
    patient_name: string;
    test_name: string;
    status: string;
  }>;
  active_patients_count?: number;
  total_reports_count?: number;
  tests_this_month_count?: number;
  monthly_collections?: number;
}

export interface AuditLog {
  id: number;
  action: string;
  details: string;
  user_name: string;
  created_at: string;
}
