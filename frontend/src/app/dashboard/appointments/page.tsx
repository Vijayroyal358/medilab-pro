"use client";

import React, { useState, useEffect } from "react";
import { getAppointments, scheduleAppointment, updateAppointmentStatus, getPatients } from "../../../services/data";
import { Appointment, Patient } from "../../../types/index";
import { 
  Plus, CalendarDays, UserSquare2, RefreshCw, 
  ArrowLeft, Clock, HelpCircle, Activity, CheckSquare
} from "lucide-react";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [selectedDate, setSelectedDate] = useState("");

  // Form states
  const [selectedPatientId, setSelectedPatientId] = useState<number>(0);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [notes, setNotes] = useState("");

  // Validation
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: "success" | "danger"; msg: string } | null>(null);

  const loadData = async (dateFilter?: string) => {
    setLoading(true);
    try {
      const [apptList, patientList] = await Promise.all([
        getAppointments(dateFilter),
        getPatients()
      ]);
      setAppointments(apptList);
      setPatients(patientList);
    } catch (err: any) {
      setError("Unable to sync appointment schedules. Verify server status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Default filter date to today (YYYY-MM-DD)
    const todayStr = new Date().toISOString().slice(0, 10);
    setSelectedDate(todayStr);
    
    // Set default booking date to today plus 1 hour
    const dateVal = new Date();
    dateVal.setHours(dateVal.getHours() + 1);
    setAppointmentDate(dateVal.toISOString().slice(0, 16));

    loadData(todayStr);
  }, []);

  const handleDateFilterChange = (dateVal: string) => {
    setSelectedDate(dateVal);
    loadData(dateVal);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (selectedPatientId === 0) errors.patient = "Please select a patient.";
    if (!appointmentDate) errors.appointmentDate = "Appointment date/time is required.";
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    const bookingData = {
      patient_id: Number(selectedPatientId),
      appointment_date: appointmentDate.replace("T", " "), // Format YYYY-MM-DD HH:MM
      doctor_name: doctorName || undefined,
      notes: notes || undefined
    };

    try {
      await scheduleAppointment(bookingData);
      setToast({ type: "success", msg: "Appointment scheduled successfully!" });
      setFormOpen(false);
      resetForm();
      loadData(selectedDate);
    } catch (err: any) {
      setToast({ type: "danger", msg: err.message || "Failed to schedule appointment." });
    } finally {
      setSubmitting(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleStatusChange = async (apptId: number, nextStatus: string) => {
    try {
      await updateAppointmentStatus(apptId, nextStatus);
      setToast({ type: "success", msg: `Queue status updated to ${nextStatus}` });
      loadData(selectedDate);
    } catch (err: any) {
      setToast({ type: "danger", msg: err.message || "Could not change status." });
    } finally {
      setTimeout(() => setToast(null), 3000);
    }
  };

  const resetForm = () => {
    setSelectedPatientId(0);
    setDoctorName("");
    setNotes("");
    setValidationErrors({});
  };

  return (
    <div className="space-y-6">
      
      {/* Toast alert */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white font-medium text-xs ${
          toast.type === "success" ? "bg-success" : "bg-danger"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* VIEW 1: QUEUE LIST / SCHEDULER BOARD */}
      {!formOpen && (
        <>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Appointments Queue</h1>
              <p className="text-xs text-mutedText dark:text-slate-400">Track check-ins and consult schedules</p>
            </div>

            <button
              onClick={() => setFormOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/95 rounded-lg shadow-md hover:shadow-lg transition-all shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Schedule Appointment</span>
            </button>
          </div>

          {/* Date Picker Filter */}
          <div className="bg-white dark:bg-darkCard p-4 rounded-xl border border-borders dark:border-darkBorders flex items-center justify-between gap-4">
            <div className="flex items-center space-x-2 text-xs">
              <CalendarDays className="h-4 w-4 text-primary" />
              <span className="font-semibold text-slate-600 dark:text-slate-300">Select Schedule Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateFilterChange(e.target.value)}
                className="h-9 px-3 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
            
            <button
              onClick={() => loadData(selectedDate)}
              className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 transition-colors"
              title="Refresh queue"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {/* Appointments list */}
          <div className="bg-white dark:bg-darkCard rounded-xl border border-borders dark:border-darkBorders shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 border-b border-borders dark:border-darkBorders font-semibold">
                  <tr>
                    <th className="p-4 text-center">Queue #</th>
                    <th className="p-4">Time Slot</th>
                    <th className="p-4">Patient Name</th>
                    <th className="p-4">Phone Number</th>
                    <th className="p-4">Consultant</th>
                    <th className="p-4">Reason / Notes</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borders dark:divide-darkBorders">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-mutedText">
                        <LoaderSpinner />
                      </td>
                    </tr>
                  ) : appointments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-mutedText">
                        <Clock className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                        <p className="font-semibold text-slate-600 dark:text-slate-400">No scheduled appointments for this day</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Click 'Schedule Appointment' to check in a patient.</p>
                      </td>
                    </tr>
                  ) : (
                    appointments.map((appt) => {
                      const timeStr = appt.appointment_date.split(" ")[1] || appt.appointment_date;
                      return (
                        <tr key={appt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-4 text-center">
                            <span className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center mx-auto text-[10px]">
                              {appt.queue_number}
                            </span>
                          </td>
                          <td className="p-4 font-semibold text-slate-700 dark:text-slate-200">{timeStr}</td>
                          <td className="p-4 font-bold text-slate-800 dark:text-white">{appt.patient_name || `Patient #${appt.patient_id}`}</td>
                          <td className="p-4">{appt.patient_phone || "N/A"}</td>
                          <td className="p-4">{appt.doctor_name || "Any Practitioner"}</td>
                          <td className="p-4 truncate max-w-xs">{appt.notes || "Standard Consultation"}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${
                              appt.status === "Scheduled" && "bg-slate-100 text-slate-600 dark:bg-slate-800"
                            } ${
                              appt.status === "In-Progress" && "bg-yellow-500/10 text-yellow-600"
                            } ${
                              appt.status === "Completed" && "bg-green-500/10 text-success"
                            } ${
                              appt.status === "Cancelled" && "bg-red-500/10 text-danger"
                            }`}>
                              {appt.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center space-x-2">
                              {appt.status === "Scheduled" && (
                                <button
                                  onClick={() => handleStatusChange(appt.id, "In-Progress")}
                                  className="text-[9px] font-bold text-yellow-600 border border-yellow-200 bg-yellow-50/5 hover:bg-yellow-500 hover:text-white px-2 py-1 rounded transition-colors"
                                >
                                  Check In
                                </button>
                              )}
                              {appt.status === "In-Progress" && (
                                <button
                                  onClick={() => handleStatusChange(appt.id, "Completed")}
                                  className="text-[9px] font-bold text-success border border-green-200 bg-green-50/5 hover:bg-success hover:text-white px-2 py-1 rounded transition-colors"
                                >
                                  Complete
                                </button>
                              )}
                              {appt.status !== "Completed" && appt.status !== "Cancelled" && (
                                <button
                                  onClick={() => handleStatusChange(appt.id, "Cancelled")}
                                  className="text-[9px] font-bold text-danger border border-red-200 bg-red-50/5 hover:bg-danger hover:text-white px-2 py-1 rounded transition-colors"
                                >
                                  Cancel Slot
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* VIEW 2: BOOKING FORM */}
      {formOpen && (
        <div className="max-w-xl mx-auto space-y-6">
          <button 
            onClick={() => setFormOpen(false)}
            className="flex items-center space-x-1.5 text-xs text-mutedText hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Queue list</span>
          </button>

          <div className="bg-white dark:bg-darkCard p-6 md:p-8 rounded-xl border border-borders dark:border-darkBorders shadow-lg">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center space-x-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              <span>Schedule Patient Appointment</span>
            </h2>

            <form onSubmit={handleFormSubmit} className="space-y-6">
              
              {/* Select Patient */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Patient <span className="text-danger">*</span>
                </label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(Number(e.target.value))}
                  className={`px-3 w-full h-10 rounded-lg border bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${
                    validationErrors.patient ? "border-danger" : "border-borders dark:border-darkBorders"
                  }`}
                >
                  <option value={0}>-- Select Patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.patient_id})</option>
                  ))}
                </select>
                {validationErrors.patient && <p className="text-[10px] text-danger mt-1 font-semibold">{validationErrors.patient}</p>}
              </div>

              {/* Date & Time Slot */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Appointment Time Slot <span className="text-danger">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className={`px-3 w-full h-10 rounded-lg border bg-transparent text-sm focus:outline-none ${
                    validationErrors.appointmentDate ? "border-danger" : "border-borders dark:border-darkBorders"
                  }`}
                />
                {validationErrors.appointmentDate && <p className="text-[10px] text-danger mt-1 font-semibold">{validationErrors.appointmentDate}</p>}
              </div>

              {/* Consultant Practitioner */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Consulting Doctor / Practitioner</label>
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="px-3 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-sm focus:outline-none"
                  placeholder="e.g. Dr. Michael Vance (leave blank for general check-in)"
                />
              </div>

              {/* Symptoms / Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Reason / Symptoms notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="p-3 w-full h-24 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-sm focus:outline-none resize-none"
                  placeholder="Details of symptoms or reason for visit..."
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-primary hover:bg-primary/95 text-white font-semibold text-sm rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center disabled:opacity-50"
                >
                  {submitting ? "Booking appointment..." : "Confirm Schedule"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setFormOpen(false);
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

    </div>
  );
}

function LoaderSpinner() {
  return (
    <div className="flex justify-center items-center py-6">
      <RefreshCw className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}
