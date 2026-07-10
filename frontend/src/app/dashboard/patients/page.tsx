"use client";

import React, { useState, useEffect } from "react";
import { getPatients, createPatient, updatePatient, deletePatient } from "../../../services/data";
import { Patient } from "../../../types/index";
import { 
  Plus, Search, FileDown, Eye, Edit, Trash2, ArrowLeft, 
  UserPlus, UserSquare2, Phone, Mail, MapPin, Stethoscope, 
  Heart, CalendarDays, UserCheck, EyeOff
} from "lucide-react";

type ViewMode = "list" | "form" | "details";

function calculateAgeFromDob(dobStr: string) {
  if (!dobStr) return { years: 0, months: 0, days: 0 };
  const birth = new Date(dobStr);
  const now = new Date();
  if (isNaN(birth.getTime())) return { years: 0, months: 0, days: 0 };
  
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();
  
  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  
  return {
    years: Math.max(years, 0),
    months: Math.max(months, 0),
    days: Math.max(days, 0)
  };
}

function calculateDobFromAge(years: number, months: number, days: number) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - (years || 0));
  d.setMonth(d.getMonth() - (months || 0));
  d.setDate(d.getDate() - (days || 0));
  
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Views & active selection
  const [view, setView] = useState<ViewMode>("list");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [editId, setEditId] = useState<number | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");

  // Columns visibility toggles
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    name: true,
    ageGender: true,
    phone: true,
    email: true,
    refDoctor: true,
    date: true,
  });
  const [colMenuOpen, setColMenuOpen] = useState(false);

  // Form Inputs
  const [name, setName] = useState("");
  const [age, setAge] = useState<number>(30);
  const [gender, setGender] = useState("Male");
  const [dob, setDob] = useState("");
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [referringDoctor, setReferringDoctor] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");
  
  // New Patient registration extra fields
  const [title, setTitle] = useState("Mr.");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [onlineReportRequested, setOnlineReportRequested] = useState(false);
  const [ageYears, setAgeYears] = useState<number>(30);
  const [ageMonths, setAgeMonths] = useState<number>(0);
  const [ageDays, setAgeDays] = useState<number>(0);
  
  // Validation Inline Errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "danger"; msg: string } | null>(null);

  const handleDobChange = (dobVal: string) => {
    setDob(dobVal);
    if (dobVal) {
      const { years, months, days } = calculateAgeFromDob(dobVal);
      setAgeYears(years);
      setAge(years);
      setAgeMonths(months);
      setAgeDays(days);
    }
  };

  const handleAgeYearsChange = (val: string) => {
    const yrs = Number(val) || 0;
    setAgeYears(yrs);
    setAge(yrs);
    const computedDob = calculateDobFromAge(yrs, ageMonths, ageDays);
    setDob(computedDob);
  };

  const handleAgeMonthsChange = (val: string) => {
    const mths = Number(val) || 0;
    setAgeMonths(mths);
    const computedDob = calculateDobFromAge(ageYears, mths, ageDays);
    setDob(computedDob);
  };

  const handleAgeDaysChange = (val: string) => {
    const dys = Number(val) || 0;
    setAgeDays(dys);
    const computedDob = calculateDobFromAge(ageYears, ageMonths, dys);
    setDob(computedDob);
  };

  const fetchPatientsList = async (query?: string) => {
    setLoading(true);
    try {
      const list = await getPatients(query);
      setPatients(list);
    } catch (err: any) {
      setError("Could not load patients list. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientsList();
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("register") === "true") {
      resetForm();
      setView("form");
    }
  }, []);

  // Search trigger
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPatientsList(searchQuery);
  };

  // CSV Export utility
  const handleExportCSV = () => {
    if (patients.length === 0) return;
    
    const headers = ["Patient ID", "Name", "Age", "Gender", "DOB", "Blood Group", "Phone", "Email", "Referring Doctor", "Registered Date"];
    const rows = patients.map(p => [
      p.patient_id,
      p.name,
      p.age,
      p.gender,
      p.dob,
      p.blood_group || "N/A",
      p.phone,
      p.email,
      p.referring_doctor || "N/A",
      new Date(p.created_at).toLocaleDateString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `medilab_patients_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset form inputs
  const resetForm = () => {
    setTitle("Mr.");
    setFirstName("");
    setLastName("");
    setName("");
    setAge(30);
    setAgeYears(30);
    setAgeMonths(0);
    setAgeDays(0);
    setGender("Male");
    setDob("");
    setBloodGroup("O+");
    setPhone("");
    setEmail("");
    setAddress("");
    setEmergencyContact("");
    setReferringDoctor("");
    setMedicalHistory("");
    setAadhaarNumber("");
    setOnlineReportRequested(false);
    setValidationErrors({});
    setEditId(null);
  };

  // Form check
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!firstName.trim()) errors.firstName = "First name is required.";
    if (!dob) errors.dob = "Date of birth is required.";
    if (!phone.trim()) errors.phone = "Phone number is required.";
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) errors.email = "Valid email address is required.";
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    const patientData = {
      name: `${title} ${firstName} ${lastName}`.trim(),
      title,
      first_name: firstName,
      last_name: lastName,
      age: Number(ageYears) || 0,
      age_years: Number(ageYears) || 0,
      age_months: Number(ageMonths) || 0,
      age_days: Number(ageDays) || 0,
      gender,
      dob,
      blood_group: bloodGroup,
      phone,
      email,
      address,
      emergency_contact: emergencyContact,
      referring_doctor: referringDoctor,
      medical_history: medicalHistory,
      aadhaar_number: aadhaarNumber,
      online_report_requested: onlineReportRequested
    };

    try {
      if (editId) {
        await updatePatient(editId, patientData);
        showToast("success", "Patient profile updated successfully!");
      } else {
        await createPatient(patientData);
        showToast("success", "Patient registered successfully!");
      }
      resetForm();
      setView("list");
      fetchPatientsList();
    } catch (err: any) {
      showToast("danger", err.message || "Failed to save patient record.");
    } finally {
      setSubmitting(false);
    }
  };

  const triggerEdit = (p: Patient) => {
    setEditId(p.id);
    setTitle(p.title || "Mr.");
    setFirstName(p.first_name || "");
    setLastName(p.last_name || "");
    setName(p.name);
    setAge(p.age);
    setAgeYears(p.age_years || p.age || 0);
    setAgeMonths(p.age_months || 0);
    setAgeDays(p.age_days || 0);
    setGender(p.gender);
    setDob(p.dob);
    setBloodGroup(p.blood_group || "O+");
    setPhone(p.phone);
    setEmail(p.email);
    setAddress(p.address || "");
    setEmergencyContact(p.emergency_contact || "");
    setReferringDoctor(p.referring_doctor || "");
    setMedicalHistory(p.medical_history || "");
    setAadhaarNumber(p.aadhaar_number || "");
    setOnlineReportRequested(!!p.online_report_requested);
    setValidationErrors({});
    setView("form");
  };

  const triggerDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete patient profile for ${name}?`)) {
      return;
    }
    try {
      await deletePatient(id);
      showToast("success", "Patient record deleted.");
      fetchPatientsList();
    } catch (err: any) {
      showToast("danger", err.message || "Could not delete patient.");
    }
  };

  const showToast = (type: "success" | "danger", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  // Filter list
  const filteredPatients = patients.filter(p => {
    if (genderFilter === "all") return true;
    return p.gender.toLowerCase() === genderFilter.toLowerCase();
  });

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white font-medium text-xs flex items-center space-x-2 ${
          toast.type === "success" ? "bg-success" : "bg-danger"
        }`}>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* VIEW 1: PATIENTS TABLE LIST */}
      {view === "list" && (
        <>
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Patients Registry</h1>
              <p className="text-xs text-mutedText dark:text-slate-400">Manage laboratory patient profiles</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  resetForm();
                  setView("form");
                }}
                className="flex items-center space-x-1.5 px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/95 rounded-lg shadow-md hover:shadow-lg transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Register Patient</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="flex items-center space-x-1.5 px-3 py-2 text-sm font-semibold text-slate-700 bg-white border border-borders dark:bg-darkCard dark:text-slate-200 dark:border-darkBorders hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg shadow-sm transition-all"
              >
                <FileDown className="h-4 w-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Search, Filter and Column Visibility Controls */}
          <div className="bg-white dark:bg-darkCard p-4 rounded-xl border border-borders dark:border-darkBorders flex flex-col md:flex-row md:items-center justify-between gap-4">
            <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 w-full md:max-w-md">
              <div className="relative flex-grow">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-mutedText">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="Search by ID, name or phone..."
                />
              </div>
              <button
                type="submit"
                className="h-10 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-all"
              >
                Search
              </button>
            </form>

            <div className="flex items-center space-x-4 shrink-0 justify-end">
              {/* Gender Filter */}
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-mutedText">Gender:</span>
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="h-9 px-2.5 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-xs focus:outline-none"
                >
                  <option value="all">All</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              {/* Column Visibility Menu */}
              <div className="relative">
                <button
                  onClick={() => setColMenuOpen(!colMenuOpen)}
                  className="h-9 px-3 text-xs font-semibold text-slate-700 bg-white border border-borders dark:bg-darkCard dark:text-slate-200 dark:border-darkBorders hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg shadow-sm transition-all"
                >
                  Columns
                </button>
                {colMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-darkCard border border-borders dark:border-darkBorders rounded-xl shadow-xl z-50 py-2 text-xs">
                    <div className="px-4 py-1.5 font-bold border-b border-borders dark:border-darkBorders text-slate-500">Show Columns</div>
                    <div className="p-2 space-y-2">
                      {Object.keys(visibleColumns).map((col) => (
                        <label key={col} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(visibleColumns as any)[col]}
                            onChange={(e) => setVisibleColumns({ ...visibleColumns, [col]: e.target.checked })}
                            className="rounded border-borders text-primary focus:ring-primary"
                          />
                          <span className="capitalize">{col.replace(/([A-Z])/g, " $1")}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Patients Table */}
          <div className="bg-white dark:bg-darkCard rounded-xl border border-borders dark:border-darkBorders shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 border-b border-borders dark:border-darkBorders font-semibold">
                  <tr>
                    {visibleColumns.id && <th className="p-4">Patient ID</th>}
                    {visibleColumns.name && <th className="p-4">Full Name</th>}
                    {visibleColumns.ageGender && <th className="p-4">Age / Gender</th>}
                    {visibleColumns.phone && <th className="p-4">Phone</th>}
                    {visibleColumns.email && <th className="p-4">Email</th>}
                    {visibleColumns.refDoctor && <th className="p-4">Referring Doctor</th>}
                    {visibleColumns.date && <th className="p-4">Registered</th>}
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borders dark:divide-darkBorders">
                  {filteredPatients.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-mutedText">
                        <UserSquare2 className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                        <p className="font-semibold text-slate-600 dark:text-slate-400">No patients registered</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Click 'Register Patient' to create a profile.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredPatients.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        {visibleColumns.id && <td className="p-4 font-semibold text-slate-700 dark:text-slate-200">{p.patient_id}</td>}
                        {visibleColumns.name && <td className="p-4 font-bold text-slate-800 dark:text-white">{p.name}</td>}
                        {visibleColumns.ageGender && <td className="p-4">{p.age} Y / {p.gender}</td>}
                        {visibleColumns.phone && <td className="p-4">{p.phone}</td>}
                        {visibleColumns.email && <td className="p-4">{p.email}</td>}
                        {visibleColumns.refDoctor && <td className="p-4">{p.referring_doctor || "Self"}</td>}
                        {visibleColumns.date && <td className="p-4">{new Date(p.created_at).toLocaleDateString()}</td>}
                        <td className="p-4">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedPatient(p);
                                setView("details");
                              }}
                              className="p-1.5 rounded-lg border border-borders dark:border-darkBorders hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                              title="View profile details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => triggerEdit(p)}
                              className="p-1.5 rounded-lg border border-borders dark:border-darkBorders hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                              title="Edit patient info"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => triggerDelete(p.id, p.name)}
                              className="p-1.5 rounded-lg border border-red-100 dark:border-red-950/20 text-danger hover:bg-red-50 dark:hover:bg-red-950/10 transition-colors"
                              title="Delete patient profile"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* VIEW 2: REGISTRATION & EDIT FORM */}
      {view === "form" && (
        <div className="max-w-3xl mx-auto space-y-6">
          <button 
            onClick={() => setView("list")}
            className="flex items-center space-x-1.5 text-xs text-mutedText hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Patients list</span>
          </button>

          <div className="bg-white dark:bg-darkCard p-6 md:p-8 rounded-xl border border-borders dark:border-darkBorders shadow-lg">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center space-x-2">
              <UserPlus className="h-5 w-5 text-primary" />
              <span>{editId ? "Modify Patient Profile" : "Register Diagnostic Patient"}</span>
            </h2>

            <form onSubmit={handleFormSubmit} className="space-y-6">
              
              {/* Demographics Grid (Title, First/Last Name) */}
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Title *</label>
                  <select
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="px-3 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-sm focus:outline-none"
                  >
                    <option value="Mr.">Mr.</option>
                    <option value="Mrs.">Mrs.</option>
                    <option value="Ms.">Ms.</option>
                    <option value="Dr.">Dr.</option>
                    <option value="Baby">Baby</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">First Name *</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={`px-3 w-full h-10 rounded-lg border bg-transparent text-sm focus:outline-none ${
                      validationErrors.firstName ? "border-danger" : "border-borders dark:border-darkBorders"
                    }`}
                    placeholder="First name"
                  />
                  {validationErrors.firstName && <p className="text-[10px] text-danger mt-1 font-semibold">{validationErrors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="px-3 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-sm focus:outline-none"
                    placeholder="Last name"
                  />
                </div>
              </div>

              {/* DOB & Age Grid */}
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => handleDobChange(e.target.value)}
                    className={`px-3 w-full h-10 rounded-lg border bg-transparent text-sm focus:outline-none ${
                      validationErrors.dob ? "border-danger" : "border-borders dark:border-darkBorders"
                    }`}
                  />
                  {validationErrors.dob && <p className="text-[10px] text-danger mt-1 font-semibold">{validationErrors.dob}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Age (Years)</label>
                  <input
                    type="number"
                    value={ageYears}
                    onChange={(e) => handleAgeYearsChange(e.target.value)}
                    className="px-3 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-sm focus:outline-none"
                    min={0}
                    max={150}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Age (Months)</label>
                  <input
                    type="number"
                    value={ageMonths}
                    onChange={(e) => handleAgeMonthsChange(e.target.value)}
                    className="px-3 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-sm focus:outline-none"
                    min={0}
                    max={11}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Age (Days)</label>
                  <input
                    type="number"
                    value={ageDays}
                    onChange={(e) => handleAgeDaysChange(e.target.value)}
                    className="px-3 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-sm focus:outline-none"
                    min={0}
                    max={30}
                  />
                </div>
              </div>

              {/* Gender and Blood Group */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="px-3 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-sm focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="px-3 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-sm focus:outline-none"
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              {/* Contacts Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Phone Number <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`px-3 w-full h-10 rounded-lg border bg-transparent text-sm focus:outline-none ${
                      validationErrors.phone ? "border-danger" : "border-borders dark:border-darkBorders"
                    }`}
                    placeholder="e.g. 555-0199"
                  />
                  {validationErrors.phone && <p className="text-[10px] text-danger mt-1 font-semibold">{validationErrors.phone}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Email Address <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`px-3 w-full h-10 rounded-lg border bg-transparent text-sm focus:outline-none ${
                      validationErrors.email ? "border-danger" : "border-borders dark:border-darkBorders"
                    }`}
                    placeholder="e.g. email@provider.com"
                  />
                  {validationErrors.email && <p className="text-[10px] text-danger mt-1 font-semibold">{validationErrors.email}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="px-3 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-sm focus:outline-none"
                  placeholder="Street name, City, Zip"
                />
              </div>

              {/* Emergency Contact, Referring Doctor & Aadhaar */}
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Emergency Contact</label>
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    className="px-3 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-sm focus:outline-none"
                    placeholder="e.g. Robert (Spouse) - 555-0200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Referring Doctor</label>
                  <input
                    type="text"
                    value={referringDoctor}
                    onChange={(e) => setReferringDoctor(e.target.value)}
                    className="px-3 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-sm focus:outline-none"
                    placeholder="e.g. Dr. Michael Vance"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Aadhaar / Gov ID</label>
                  <input
                    type="text"
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value)}
                    className="px-3 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-sm focus:outline-none"
                    placeholder="12-digit Aadhaar Card Number"
                  />
                </div>
              </div>

              {/* Medical History */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Medical History / Clinical Notes</label>
                <textarea
                  value={medicalHistory}
                  onChange={(e) => setMedicalHistory(e.target.value)}
                  className="p-3 w-full h-24 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-sm focus:outline-none resize-none"
                  placeholder="Known allergies, underlying symptoms, or clinical notes..."
                />
              </div>
              {/* Online reports requested */}
              <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-borders dark:border-darkBorders">
                <input
                  type="checkbox"
                  id="onlineReport"
                  checked={onlineReportRequested}
                  onChange={(e) => setOnlineReportRequested(e.target.checked)}
                  className="h-4 w-4 rounded border-borders dark:border-darkBorders accent-primary focus:ring-primary"
                />
                <label htmlFor="onlineReport" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  Enable Patient Online Reports Portal (Online Report Requested)
                </label>
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-primary hover:bg-primary/95 text-white font-semibold text-sm rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center disabled:opacity-50"
                >
                  {submitting ? "Saving record..." : editId ? "Update Patient Profile" : "Register Patient"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setView("list");
                  }}
                  className="px-6 py-2.5 text-slate-700 bg-white border border-borders dark:bg-darkCard dark:text-slate-200 dark:border-darkBorders hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-semibold rounded-lg shadow-sm transition-all"
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* VIEW 3: PATIENT PROFILE DETAIL INSPECTOR */}
      {view === "details" && selectedPatient && (
        <div className="max-w-3xl mx-auto space-y-6">
          <button 
            onClick={() => {
              setSelectedPatient(null);
              setView("list");
            }}
            className="flex items-center space-x-1.5 text-xs text-mutedText hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Patients list</span>
          </button>

          <div className="bg-white dark:bg-darkCard rounded-xl border border-borders dark:border-darkBorders shadow-lg overflow-hidden">
            {/* Header card banner */}
            <div className="p-6 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-2xl uppercase">
                  {selectedPatient.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedPatient.name}</h2>
                  <div className="flex items-center space-x-2 mt-1 text-slate-400 text-xs font-semibold">
                    <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono uppercase">{selectedPatient.patient_id}</span>
                    <span>&bull;</span>
                    <span>{selectedPatient.age} Y / {selectedPatient.gender}</span>
                    <span>&bull;</span>
                    <span>Blood Group: <strong className="text-primary font-bold">{selectedPatient.blood_group || "Unknown"}</strong></span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => triggerEdit(selectedPatient)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-lg transition-colors border border-slate-700 shrink-0 text-center"
              >
                Edit Profile
              </button>
            </div>

            {/* Profile Grid Details */}
            <div className="p-6 md:p-8 grid md:grid-cols-2 gap-8 text-xs">
              
              {/* Left Column Contact Details */}
              <div className="space-y-6">
                <h3 className="font-bold text-slate-800 dark:text-white uppercase text-[10px] tracking-wider border-b border-borders dark:border-darkBorders pb-1">Contact Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <div className="text-slate-400 text-[10px]">Phone Number</div>
                      <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{selectedPatient.phone}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <div className="text-slate-400 text-[10px]">Email Address</div>
                      <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{selectedPatient.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <div className="text-slate-400 text-[10px]">Address</div>
                      <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{selectedPatient.address || "No address provided."}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column Clinical Info */}
              <div className="space-y-6">
                <h3 className="font-bold text-slate-800 dark:text-white uppercase text-[10px] tracking-wider border-b border-borders dark:border-darkBorders pb-1">Clinical Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CalendarDays className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <div className="text-slate-400 text-[10px]">Date of Birth</div>
                      <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{selectedPatient.dob}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Stethoscope className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <div className="text-slate-400 text-[10px]">Referring Practitioner</div>
                      <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{selectedPatient.referring_doctor || "Self / None"}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Heart className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <div className="text-slate-400 text-[10px]">Emergency Contact</div>
                      <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{selectedPatient.emergency_contact || "No emergency details provided."}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Medical History Section */}
              <div className="md:col-span-2 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-borders dark:border-darkBorders">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">Medical History Notes</h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
                  {selectedPatient.medical_history || "No medical history recorded for this patient profile."}
                </p>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
