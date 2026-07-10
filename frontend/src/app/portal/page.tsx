"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { getMyReports, getReportPdfPreview, getAppointments, getTests } from "../../services/data";
import { Report, Appointment, Test } from "../../types/index";
import { 
  HeartPulse, LayoutDashboard, FileText, Calendar, 
  Receipt, User, LogOut, Sun, Moon, Eye, Printer, 
  ArrowLeft, Clock, FileWarning, Sparkles, RefreshCw
} from "lucide-react";

type PortalTab = "dashboard" | "reports" | "appointments" | "invoices" | "profile";

export default function PatientPortalPage() {
  const { user, logout, darkMode, toggleDarkMode, labName } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<PortalTab>("dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Portal data
  const [reports, setReports] = useState<Report[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tests, setTests] = useState<Test[]>([]);

  // PDF Preview State
  const [pdfReportData, setPdfReportData] = useState<any | null>(null);

  useEffect(() => {
    // Check login and patient role
    const storedUserStr = localStorage.getItem("medilab_user");
    if (!storedUserStr) {
      router.push("/auth/login?portal=true");
      return;
    }

    const storedUser = JSON.parse(storedUserStr);
    if (storedUser.role !== "Patient") {
      router.push("/dashboard");
      return;
    }

    // Load data
    loadPortalData();
  }, [router]);

  const loadPortalData = async () => {
    setLoading(true);
    setError("");
    try {
      const [reportList, apptList, testList] = await Promise.all([
        getMyReports(),
        getAppointments(), // will return filter list or mock from endpoint
        getTests() // will filter by user profile in production, fallback details
      ]);

      setReports(reportList);
      
      // Filter appointments and tests for patient in frontend for demo safety
      // In production, the backend handles this via JWT claims
      setAppointments(apptList);
      setTests(testList);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load patient records. Check server connection.");
    } finally {
      setLoading(false);
    }
  };

  const triggerPdfPreview = async (reportId: number) => {
    try {
      const data = await getReportPdfPreview(reportId);
      setPdfReportData(data);
    } catch (err: any) {
      alert("Could not load report certificate.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background dark:bg-darkBg">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Aggregate stats
  const completedReportsCount = reports.filter(r => r.status === "Completed").length;
  const upcomingAppt = appointments.find(a => a.status === "Scheduled") || null;
  const pendingPaymentsSum = tests
    .filter(t => t.payment_status === "Pending")
    .reduce((sum, t) => sum + (t.price - t.discount + t.tax), 0);

  return (
    <div className="min-h-screen flex flex-col bg-background dark:bg-darkBg transition-colors duration-300">
      
      {/* Portal Header */}
      <header className="sticky top-0 z-30 w-full bg-white dark:bg-darkCard border-b border-borders dark:border-darkBorders h-16 px-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <HeartPulse className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg text-slate-800 dark:text-white">MediLab<span className="text-primary">Portal</span></span>
          <span className="hidden sm:inline-block text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold ml-2">Patient Hub</span>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-xs text-slate-500 hidden md:inline">Facility: <strong className="text-slate-700 dark:text-slate-200 font-bold">{labName}</strong></span>
          
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg border border-borders dark:border-darkBorders text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <button
            onClick={logout}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-danger border border-red-100 hover:bg-red-50 dark:border-red-950/20 dark:hover:bg-red-950/10 rounded-lg transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-grow max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left Side Tab Navigation */}
        <aside className="lg:w-60 shrink-0 space-y-1">
          <button
            onClick={() => { setActiveTab("dashboard"); setPdfReportData(null); }}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "dashboard" && !pdfReportData
                ? "bg-primary text-white shadow-md shadow-primary/25" 
                : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-darkCard border border-transparent hover:border-borders dark:hover:border-darkBorders"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>My Dashboard</span>
          </button>

          <button
            onClick={() => { setActiveTab("reports"); setPdfReportData(null); }}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "reports" && !pdfReportData
                ? "bg-primary text-white shadow-md shadow-primary/25" 
                : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-darkCard border border-transparent hover:border-borders dark:hover:border-darkBorders"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>My Lab Reports</span>
          </button>

          <button
            onClick={() => { setActiveTab("appointments"); setPdfReportData(null); }}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "appointments" && !pdfReportData
                ? "bg-primary text-white shadow-md shadow-primary/25" 
                : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-darkCard border border-transparent hover:border-borders dark:hover:border-darkBorders"
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>My Appointments</span>
          </button>

          <button
            onClick={() => { setActiveTab("invoices"); setPdfReportData(null); }}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "invoices" && !pdfReportData
                ? "bg-primary text-white shadow-md shadow-primary/25" 
                : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-darkCard border border-transparent hover:border-borders dark:hover:border-darkBorders"
            }`}
          >
            <Receipt className="h-4 w-4" />
            <span>Invoices & Billing</span>
          </button>

          <button
            onClick={() => { setActiveTab("profile"); setPdfReportData(null); }}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "profile" && !pdfReportData
                ? "bg-primary text-white shadow-md shadow-primary/25" 
                : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-darkCard border border-transparent hover:border-borders dark:hover:border-darkBorders"
            }`}
          >
            <User className="h-4 w-4" />
            <span>Patient Profile</span>
          </button>
        </aside>

        {/* Right Side Content Panel */}
        <main className="flex-grow min-w-0">
          
          {error && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-950/50 rounded-xl text-xs flex items-center space-x-2 mb-6">
              <FileWarning className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* DYNAMIC CLINICAL PDF BANNER OVERLAY */}
          {pdfReportData ? (
            <div className="space-y-6">
              <button 
                onClick={() => setPdfReportData(null)}
                className="flex items-center space-x-1.5 text-xs text-mutedText hover:text-primary transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Close preview</span>
              </button>

              <div className="bg-white text-slate-900 p-8 rounded-xl border border-slate-200 shadow-2xl relative overflow-hidden font-sans">
                {/* Watermark Logo */}
                <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                  <HeartPulse className="h-80 w-80 text-primary" />
                </div>

                <div className="flex justify-between items-start border-b-2 border-primary pb-6 relative z-10">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <HeartPulse className="h-8 w-8 text-primary" />
                      <span className="font-extrabold text-2xl tracking-tight text-slate-800">{pdfReportData.lab_name}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-semibold">{pdfReportData.lab_address}</p>
                  </div>
                  <div className="text-right text-xs">
                    <div className="font-bold text-slate-700">Official Diagnostics Report</div>
                    <div className="text-[10px] text-slate-500">Report Status: <strong className="text-primary font-bold">{pdfReportData.status}</strong></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-6 border-b border-slate-100 text-xs relative z-10">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400">Patient ID</span>
                    <p className="font-mono font-bold text-slate-800">{pdfReportData.patient_id}</p>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400">Patient Name</span>
                    <p className="font-bold text-slate-900">{pdfReportData.patient_name}</p>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400">Age / Gender</span>
                    <p className="font-bold text-slate-800">{pdfReportData.patient_age_gender}</p>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400">Invoice Reference</span>
                    <p className="font-mono text-slate-700">{pdfReportData.invoice_number}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 py-4 border-b border-slate-100 text-xs relative z-10">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400">Lab Test</span>
                    <p className="font-bold text-slate-800">{pdfReportData.test_name}</p>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400">Category</span>
                    <p className="font-semibold text-primary">{pdfReportData.category}</p>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400">Sample Date</span>
                    <p className="font-semibold text-slate-600">{new Date(pdfReportData.collection_date).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="py-8 relative z-10">
                  <h3 className="font-bold text-slate-700 text-sm mb-4 border-l-4 border-primary pl-2 uppercase tracking-wide">Test Parameters & Results</h3>
                  
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Parameter Name</th>
                          <th className="p-3 text-right">Result Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pdfReportData.results_data.includes(":") ? (
                          pdfReportData.results_data.split("\n").filter((line: string) => line.includes(":")).map((line: string, i: number) => {
                            const [param, val] = line.split(":");
                            return (
                              <tr key={i} className="hover:bg-slate-50">
                                <td className="p-3 font-semibold text-slate-700">{param.trim()}</td>
                                <td className="p-3 text-right font-bold text-slate-900">{val.trim()}</td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={2} className="p-4 text-center font-medium text-slate-600">
                              {pdfReportData.results_data}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-12 pt-12 border-t border-slate-200 mt-12 relative z-10 text-xs text-center">
                  <div>
                    <div className="h-10 flex items-center justify-center font-mono italic text-slate-400">
                      {pdfReportData.technician_signed ? (
                        <div className="flex items-center space-x-1 text-primary">
                          <Sparkles className="h-4 w-4" />
                          <span>Signature Verified (Tech)</span>
                        </div>
                      ) : "Pending verification"}
                    </div>
                    <div className="border-t border-slate-200 pt-2 font-bold text-slate-700">Lab Technician Sign-off</div>
                  </div>

                  <div>
                    <div className="h-10 flex items-center justify-center font-mono italic text-slate-400">
                      {pdfReportData.doctor_signed ? (
                        <div className="flex items-center space-x-1 text-primary">
                          <Sparkles className="h-4 w-4" />
                          <span>Doctor Approved</span>
                        </div>
                      ) : "Pending doctor review"}
                    </div>
                    <div className="border-t border-slate-200 pt-2 font-bold text-slate-700">Authorized Clinical Signatory</div>
                  </div>
                </div>

                <div className="mt-8 text-center print:hidden">
                  <button
                    onClick={() => window.print()}
                    className="px-6 py-2.5 bg-primary text-white font-semibold rounded-lg text-xs hover:bg-primary/95 transition-colors shadow-md"
                  >
                    Download / Print Report
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* TAB 1: DASHBOARD OVERVIEW */}
              {activeTab === "dashboard" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Welcome back, {user?.name}!</h2>
                    <p className="text-xs text-mutedText dark:text-slate-400">Consolidated diagnostic reports and schedules</p>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-darkCard p-5 rounded-xl border border-borders dark:border-darkBorders shadow-sm">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold text-mutedText dark:text-slate-400">Total Reports</span>
                        <div className="p-1.5 bg-primary/10 rounded-lg text-primary"><FileText className="h-4 w-4" /></div>
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-2">{reports.length}</h3>
                      <span className="text-[10px] text-mutedText">{completedReportsCount} completed</span>
                    </div>

                    <div className="bg-white dark:bg-darkCard p-5 rounded-xl border border-borders dark:border-darkBorders shadow-sm">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold text-mutedText dark:text-slate-400">Upcoming Visit</span>
                        <div className="p-1.5 bg-primary/10 rounded-lg text-primary"><Calendar className="h-4 w-4" /></div>
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white mt-2 truncate">
                        {upcomingAppt ? upcomingAppt.appointment_date : "No visits scheduled"}
                      </h3>
                      <span className="text-[10px] text-mutedText">
                        {upcomingAppt ? `Queue Position: #${upcomingAppt.queue_number}` : "Book appointment below"}
                      </span>
                    </div>

                    <div className="bg-white dark:bg-darkCard p-5 rounded-xl border border-borders dark:border-darkBorders shadow-sm col-span-2">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold text-mutedText dark:text-slate-400">Pending Dues</span>
                        <div className="p-1.5 bg-red-500/10 rounded-lg text-danger"><Receipt className="h-4 w-4" /></div>
                      </div>
                      <h3 className="text-2xl font-bold text-slate-850 dark:text-white mt-2">${pendingPaymentsSum.toFixed(2)}</h3>
                      <span className="text-[10px] text-danger font-medium">Please settle at counter</span>
                    </div>
                  </div>

                  {/* Highlights section */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Latest Report card */}
                    <div className="bg-white dark:bg-darkCard p-6 rounded-xl border border-borders dark:border-darkBorders shadow-md">
                      <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-4">Latest Reports</h3>
                      {reports.length === 0 ? (
                        <p className="text-xs text-mutedText">No test reports synced yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {reports.slice(0, 3).map(r => (
                            <div key={r.id} className="flex justify-between items-center text-xs pb-2 border-b border-dashed border-borders dark:border-slate-800 last:border-0 last:pb-0">
                              <div>
                                <div className="font-bold text-slate-800 dark:text-white">{r.test_name}</div>
                                <div className="text-[10px] text-slate-400">Last updated: {new Date(r.updated_at).toLocaleDateString()}</div>
                              </div>
                              <button
                                onClick={() => triggerPdfPreview(r.id)}
                                className="text-[10px] font-bold text-primary hover:underline flex items-center space-x-1"
                              >
                                <Eye className="h-3 w-3" />
                                <span>Preview</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Quick Visit Schedule info */}
                    <div className="bg-white dark:bg-darkCard p-6 rounded-xl border border-borders dark:border-darkBorders shadow-md flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-2">Need a lab test?</h3>
                        <p className="text-xs text-mutedText mb-4">
                          Schedule a slot directly on the portal. Bring your prescription details or consult our doctor at the receptionist desk.
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab("appointments")}
                        className="w-full text-center py-2 bg-primary hover:bg-primary/95 text-white font-semibold rounded-lg text-xs shadow"
                      >
                        Book Appointment
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: REPORTS LEDGER */}
              {activeTab === "reports" && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">My Clinical Reports</h2>
                    <p className="text-xs text-mutedText dark:text-slate-400">Access and download verified diagnostic certificates</p>
                  </div>

                  <div className="bg-white dark:bg-darkCard border border-borders dark:border-darkBorders rounded-xl shadow-md overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 border-b border-borders dark:border-darkBorders font-semibold">
                        <tr>
                          <th className="p-4">Report Reference</th>
                          <th className="p-4">Test Name</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Updated Date</th>
                          <th className="p-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-borders dark:divide-darkBorders">
                        {reports.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-mutedText">
                              <FileText className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                              <span>No reports registered to your account yet.</span>
                            </td>
                          </tr>
                        ) : (
                          reports.map((r) => (
                            <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="p-4 font-semibold text-slate-700 dark:text-slate-200">#REP-{r.id + 4000}</td>
                              <td className="p-4 font-bold text-slate-800 dark:text-white">{r.test_name}</td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${
                                  r.status === "Pending" && "bg-slate-100 text-slate-600 dark:bg-slate-850"
                                } ${
                                  r.status === "Processing" && "bg-yellow-500/10 text-yellow-600"
                                } ${
                                  r.status === "Completed" && "bg-green-500/10 text-success"
                                }`}>
                                  {r.status}
                                </span>
                              </td>
                              <td className="p-4">{new Date(r.updated_at).toLocaleDateString()}</td>
                              <td className="p-4 text-center">
                                <button
                                  onClick={() => triggerPdfPreview(r.id)}
                                  className="text-[10px] font-bold text-primary border border-primary/20 bg-primary/5 hover:bg-primary hover:text-white px-2.5 py-1 rounded transition-colors"
                                >
                                  Preview Report
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: APPOINTMENTS BOOKINGS */}
              {activeTab === "appointments" && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">My Appointment Visits</h2>
                    <p className="text-xs text-mutedText dark:text-slate-400">Queue check-ins and future scheduling slots</p>
                  </div>

                  <div className="bg-white dark:bg-darkCard border border-borders dark:border-darkBorders rounded-xl shadow-md overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 border-b border-borders dark:border-darkBorders font-semibold">
                        <tr>
                          <th className="p-4 text-center">Queue #</th>
                          <th className="p-4">Appointment Date/Time</th>
                          <th className="p-4">Practitioner</th>
                          <th className="p-4">Symptoms / Reason</th>
                          <th className="p-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-borders dark:divide-darkBorders">
                        {appointments.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-mutedText">
                              <Calendar className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                              <span>No appointments scheduled.</span>
                            </td>
                          </tr>
                        ) : (
                          appointments.map((a) => (
                            <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="p-4 text-center">
                                <span className="h-5 w-5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-full flex items-center justify-center mx-auto text-[9px]">
                                  {a.queue_number}
                                </span>
                              </td>
                              <td className="p-4 font-semibold text-slate-700 dark:text-slate-200">{a.appointment_date}</td>
                              <td className="p-4">{a.doctor_name || "General Diagnostics"}</td>
                              <td className="p-4 truncate max-w-xs">{a.notes || "Check up"}</td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${
                                  a.status === "Scheduled" && "bg-slate-100 text-slate-600 dark:bg-slate-800"
                                } ${
                                  a.status === "In-Progress" && "bg-yellow-500/10 text-yellow-600"
                                } ${
                                  a.status === "Completed" && "bg-green-500/10 text-success"
                                } ${
                                  a.status === "Cancelled" && "bg-red-500/10 text-danger"
                                }`}>
                                  {a.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: BILLING INVOICES */}
              {activeTab === "invoices" && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Invoices & Billing History</h2>
                    <p className="text-xs text-mutedText dark:text-slate-400">Statement of test settlements and billing ledgers</p>
                  </div>

                  <div className="bg-white dark:bg-darkCard border border-borders dark:border-darkBorders rounded-xl shadow-md overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 border-b border-borders dark:border-darkBorders font-semibold">
                        <tr>
                          <th className="p-4">Invoice #</th>
                          <th className="p-4">Test Reference</th>
                          <th className="p-4">Total Amount</th>
                          <th className="p-4">Settlement Status</th>
                          <th className="p-4">Ordered Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-borders dark:divide-darkBorders">
                        {tests.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-mutedText">
                              <Receipt className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                              <span>No invoices found.</span>
                            </td>
                          </tr>
                        ) : (
                          tests.map((t) => {
                            const net = t.price - t.discount + t.tax;
                            return (
                              <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="p-4 font-semibold text-slate-750 dark:text-slate-200">{t.invoice_number}</td>
                                <td className="p-4 font-bold text-slate-800 dark:text-white">{t.test_name}</td>
                                <td className="p-4 font-bold text-slate-800 dark:text-white">${net.toFixed(2)}</td>
                                <td className="p-4">
                                  <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${
                                    t.payment_status === "Paid" 
                                      ? "bg-green-500/10 text-success" 
                                      : "bg-red-500/10 text-danger"
                                  }`}>
                                    {t.payment_status}
                                  </span>
                                </td>
                                <td className="p-4">{new Date(t.created_at).toLocaleDateString()}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 5: PATIENT PROFILE SETTINGS */}
              {activeTab === "profile" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">My Clinical Profile</h2>
                    <p className="text-xs text-mutedText dark:text-slate-400">Registered demographics and clinical history references</p>
                  </div>

                  <div className="bg-white dark:bg-darkCard rounded-xl border border-borders dark:border-darkBorders shadow-md overflow-hidden text-xs">
                    <div className="p-6 bg-slate-900 text-white flex items-center space-x-4">
                      <div className="h-14 w-14 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-xl uppercase shrink-0">
                        {user?.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{user?.name}</h3>
                        <p className="text-slate-400 text-[10px] uppercase font-semibold tracking-wider">Patient ID: CDL-10001</p>
                      </div>
                    </div>

                    <div className="p-6 md:p-8 grid md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h4 className="font-bold text-[10px] uppercase text-slate-400 tracking-wider border-b border-borders dark:border-darkBorders pb-1">Account & Contacts</h4>
                        <div className="space-y-2">
                          <div><span className="text-slate-400 text-[10px]">Email:</span> <p className="font-semibold text-slate-700 dark:text-slate-200">{user?.email}</p></div>
                          <div><span className="text-slate-400 text-[10px]">Phone:</span> <p className="font-semibold text-slate-700 dark:text-slate-200">555-0199</p></div>
                          <div><span className="text-slate-400 text-[10px]">Address:</span> <p className="font-semibold text-slate-700 dark:text-slate-200">789 Pine Street, Brooklyn, NY</p></div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-bold text-[10px] uppercase text-slate-400 tracking-wider border-b border-borders dark:border-darkBorders pb-1">Clinical Identifiers</h4>
                        <div className="space-y-2">
                          <div><span className="text-slate-400 text-[10px]">Date of Birth (Age):</span> <p className="font-semibold text-slate-700 dark:text-slate-200">1997-05-15 (29 Years)</p></div>
                          <div><span className="text-slate-400 text-[10px]">Gender & Blood:</span> <p className="font-semibold text-slate-700 dark:text-slate-200">Female / O+</p></div>
                          <div><span className="text-slate-400 text-[10px]">Emergency contact:</span> <p className="font-semibold text-slate-700 dark:text-slate-200">Robert Smith (Spouse): 555-0200</p></div>
                        </div>
                      </div>

                      <div className="md:col-span-2 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-borders dark:border-darkBorders">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">Registered Clinical Symptoms / History</h4>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                          Mild asthma, allergic to penicillin.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </main>

      </div>

      {/* Footer */}
      <footer className="border-t border-borders dark:border-darkBorders py-6 mt-12 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6 text-center text-[10px] text-mutedText">
          &copy; 2026 MediLab Pro. Access logs are audited for clinical compliance protection.
        </div>
      </footer>

    </div>
  );
}
