import { apiFetch } from "./api";
import { 
  Patient, PatientCreate, PatientUpdate, 
  Test, TestCreate, 
  Appointment, AppointmentCreate, 
  Report, ReportUpdate, 
  DashboardStats,
  ReferralDoctor, ReferralDoctorCreate, ReferralDoctorUpdate, ReferralBusinessReport,
  Expense, ExpenseCreate, AuditLog
} from "../types/index";

// --- Patients Service ---
export async function getPatients(search?: string): Promise<Patient[]> {
  return apiFetch<Patient[]>("/patients", {
    method: "GET",
    params: search ? { search } : undefined,
  });
}

export async function getPatientById(id: number): Promise<Patient> {
  return apiFetch<Patient>(`/patients/${id}`, { method: "GET" });
}

export async function createPatient(patient: PatientCreate): Promise<Patient> {
  return apiFetch<Patient>("/patients", {
    method: "POST",
    body: JSON.stringify(patient),
  });
}

export async function updatePatient(id: number, patient: PatientUpdate): Promise<Patient> {
  return apiFetch<Patient>(`/patients/${id}`, {
    method: "PUT",
    body: JSON.stringify(patient),
  });
}

export async function deletePatient(id: number): Promise<void> {
  return apiFetch<void>(`/patients/${id}`, { method: "DELETE" });
}

// --- Tests Service ---
export async function getTests(): Promise<Test[]> {
  return apiFetch<Test[]>("/tests", { method: "GET" });
}

export async function registerTest(test: TestCreate): Promise<Test> {
  return apiFetch<Test>("/tests", {
    method: "POST",
    body: JSON.stringify(test),
  });
}

export async function updateTestPayment(testId: number, status: string): Promise<Test> {
  return apiFetch<Test>(`/tests/${testId}/payment?payment_status=${status}`, {
    method: "PUT",
  });
}

// --- Appointments Service ---
export async function getAppointments(date?: string): Promise<Appointment[]> {
  return apiFetch<Appointment[]>("/appointments", {
    method: "GET",
    params: date ? { date } : undefined,
  });
}

export async function scheduleAppointment(appt: AppointmentCreate): Promise<Appointment> {
  return apiFetch<Appointment>("/appointments", {
    method: "POST",
    body: JSON.stringify(appt),
  });
}

export async function updateAppointmentStatus(apptId: number, status: string): Promise<Appointment> {
  return apiFetch<Appointment>(`/appointments/${apptId}/status?status=${status}`, {
    method: "PUT",
  });
}

// --- Reports Service ---
export async function getReports(): Promise<Report[]> {
  return apiFetch<Report[]>("/reports", { method: "GET" });
}

export async function getMyReports(): Promise<Report[]> {
  return apiFetch<Report[]>("/reports/patient", { method: "GET" });
}

export async function getReportById(reportId: number): Promise<Report> {
  return apiFetch<Report>(`/reports/${reportId}`, { method: "GET" });
}

export async function updateReport(reportId: number, data: ReportUpdate): Promise<Report> {
  return apiFetch<Report>(`/reports/${reportId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function getReportPdfPreview(reportId: number): Promise<any> {
  return apiFetch<any>(`/reports/${reportId}/pdf-preview`, { method: "GET" });
}

// --- Referrals Service ---
export async function getReferrals(): Promise<ReferralDoctor[]> {
  return apiFetch<ReferralDoctor[]>("/referrals", { method: "GET" });
}

export async function createReferral(data: ReferralDoctorCreate): Promise<ReferralDoctor> {
  return apiFetch<ReferralDoctor>("/referrals", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateReferral(id: number, data: ReferralDoctorUpdate): Promise<ReferralDoctor> {
  return apiFetch<ReferralDoctor>(`/referrals/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteReferral(id: number): Promise<void> {
  return apiFetch<void>(`/referrals/${id}`, { method: "DELETE" });
}

export async function getReferralBusiness(id: number): Promise<ReferralBusinessReport> {
  return apiFetch<ReferralBusinessReport>(`/referrals/${id}/business`, { method: "GET" });
}

// --- Expenses Service ---
export async function getExpenses(): Promise<Expense[]> {
  return apiFetch<Expense[]>("/expenses", { method: "GET" });
}

export async function createExpense(data: ExpenseCreate): Promise<Expense> {
  return apiFetch<Expense>("/expenses", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// --- Audit Service ---
export async function getAuditLogs(): Promise<AuditLog[]> {
  return apiFetch<AuditLog[]>("/audit", { method: "GET" });
}

// --- Dashboard Service ---
export async function getDashboardStats(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>("/dashboard/stats", { method: "GET" });
}

// --- Setup Service ---
export interface LabSetupData {
  id?: number;
  name?: string;
  slug?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  gstin?: string;
  pan?: string;
  license_path?: string;
  google_review_url?: string;
  logo_path?: string;
}

export async function getLabSetup(): Promise<LabSetupData> {
  return apiFetch<LabSetupData>("/setup/lab", { method: "GET" });
}

export async function updateLabSetup(data: LabSetupData): Promise<LabSetupData> {
  return apiFetch<LabSetupData>("/setup/lab", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
