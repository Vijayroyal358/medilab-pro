"use client";

import React, { useState, useEffect } from "react";
import { getReports, getReportById, updateReport, getReportPdfPreview } from "../../../services/data";
import { Report } from "../../../types/index";
import { useAuth } from "../../../context/AuthContext";
import { 
  FileSpreadsheet, ClipboardEdit, Eye, Printer, ArrowLeft, 
  CheckSquare, FileWarning, Loader2, HeartPulse, Sparkles,
  Search, ChevronLeft, ChevronRight, Calendar, BarChart3,
  MoreVertical, Send, CheckCircle2, FileText, ChevronDown,
  X, Check, AlertCircle, Trash2, ArrowUpRight, HelpCircle,
  Plus, Clock, User, Activity
} from "lucide-react";

type ReportStatusFilter = "all" | "New" | "In progress" | "Final" | "Signed off";

export default function ReportsPage() {
  const { user } = useAuth();
  
  // Navigation & Data States
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "danger"; msg: string } | null>(null);

  // View States: "list" | "edit" | "preview"
  const [viewMode, setViewMode] = useState<"list" | "edit" | "preview">("list");
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [currentReport, setCurrentReport] = useState<Report | null>(null);

  // List View Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date()); // Default to today
  const [activeTab, setActiveTab] = useState<ReportStatusFilter>("all");
  const [sortBy, setSortBy] = useState<"oldest" | "newest">("oldest");
  const [activeActionMenuId, setActiveActionMenuId] = useState<number | null>(null);
  
  // Dialog States
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState<{ open: boolean; report: Report | null }>({ open: false, report: null });

  // Edit View Form States
  const [collectedOn, setCollectedOn] = useState("");
  const [receivedOn, setReceivedOn] = useState("");
  const [reportedOn, setReportedOn] = useState("");
  
  const [printCategoriesNewPage, setPrintCategoriesNewPage] = useState(false);
  const [printResults, setPrintResults] = useState(true);
  const [pageBreakAfter, setPageBreakAfter] = useState(false);
  const [skipInterpretation, setSkipInterpretation] = useState(false);

  // Dynamic parameters state (parsed from results_json)
  const [parameters, setParameters] = useState<Array<{
    parameter: string;
    observed: string;
    normal_range: string;
    unit: string;
    flag: string;
  }>>([]);

  const [interpretation, setInterpretation] = useState("");
  const [testUtility, setTestUtility] = useState("");
  const [notesAndLimitations, setNotesAndLimitations] = useState("");
  const [remarks, setRemarks] = useState("");
  const [advice, setAdvice] = useState("");

  const [showRemarksInput, setShowRemarksInput] = useState(false);
  const [showAdviceInput, setShowAdviceInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Right Sidebar active panel on edit/view: "patient" | "doctor" | "history" | "recent" | "activities" | "debug"
  const [sidebarPanel, setSidebarPanel] = useState<"patient" | "doctor" | "history" | "recent" | "activities" | "debug">("patient");

  // Load Reports list
  const loadReports = async () => {
    setLoading(true);
    try {
      const list = await getReports();
      setReports(list);
    } catch (err: any) {
      setError("Failed to sync reports. Ensure Supabase database and backend are active.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const triggerToast = (type: "success" | "danger", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  // Date manipulation
  const changeDate = (days: number) => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(selectedDate.getDate() + days);
    setSelectedDate(nextDate);
  };

  // Formatted date string for input/display
  const formatDisplayDate = (d: Date) => {
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }); // DD/MM/YYYY
  };

  const formatIsoDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Fetch single report for Editing
  const triggerEdit = async (reportId: number) => {
    try {
      setLoading(true);
      const rep = await getReportById(reportId);
      setCurrentReport(rep);
      setSelectedReportId(reportId);
      
      // Initialize Edit values
      setCollectedOn(rep.collected_on || "29-01-2026");
      setReceivedOn(rep.received_on || "29-01-2026");
      setReportedOn(rep.reported_on || "08-07-2026 09:37 AM");
      
      setPrintCategoriesNewPage(rep.print_categories_new_page ?? false);
      setPrintResults(rep.print_results ?? true);
      setPageBreakAfter(rep.page_break_after ?? false);
      setSkipInterpretation(rep.skip_interpretation ?? false);

      setInterpretation(rep.interpretation || "");
      setTestUtility(rep.test_utility || "");
      setNotesAndLimitations(rep.notes_and_limitations || "");
      setRemarks(rep.remarks || "");
      setAdvice(rep.advice || "");
      setShowRemarksInput(!!rep.remarks);
      setShowAdviceInput(!!rep.advice);

      // Parse parameters
      if (rep.results_json) {
        try {
          setParameters(JSON.parse(rep.results_json));
        } catch {
          setParameters([]);
        }
      } else {
        setParameters([]);
      }

      setViewMode("edit");
    } catch (err: any) {
      triggerToast("danger", "Could not fetch report details: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch report details for Print Preview
  const triggerPreview = async (reportId: number) => {
    try {
      setLoading(true);
      const repData = await getReportPdfPreview(reportId);
      // Construct a report-like object out of the preview data
      setCurrentReport(repData);
      setSelectedReportId(reportId);
      setViewMode("preview");
    } catch (err: any) {
      triggerToast("danger", "Failed to compile report preview.");
    } finally {
      setLoading(false);
    }
  };

  // Save report contents
  const saveReportData = async (targetStatus: string) => {
    if (!selectedReportId) return;
    setSubmitting(true);
    try {
      const results_data_text = parameters
        .map(p => `${p.parameter}: ${p.observed} ${p.unit} (Ref: ${p.normal_range})`)
        .join("\n");

      await updateReport(selectedReportId, {
        status: targetStatus,
        results_data: results_data_text,
        results_json: JSON.stringify(parameters),
        collected_on: collectedOn,
        received_on: receivedOn,
        reported_on: reportedOn,
        interpretation: interpretation,
        test_utility: testUtility,
        notes_and_limitations: notesAndLimitations,
        remarks: remarks,
        advice: advice,
        print_categories_new_page: printCategoriesNewPage,
        print_results: printResults,
        page_break_after: pageBreakAfter,
        skip_interpretation: skipInterpretation
      });

      triggerToast("success", `Report successfully saved as ${targetStatus}`);
      setViewMode("list");
      loadReports();
    } catch (err: any) {
      triggerToast("danger", "Error saving report: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Parameter input updates
  const updateParamValue = (idx: number, val: string) => {
    const updated = [...parameters];
    updated[idx].observed = val;
    // Simple Auto flag mapping for common fields
    const normal = updated[idx].normal_range.toLowerCase();
    if (normal === "negative" && val.toLowerCase() === "positive") {
      updated[idx].flag = "High";
    } else if (normal === "negative" && val.toLowerCase() === "negative") {
      updated[idx].flag = "Normal";
    }
    setParameters(updated);
  };

  const updateParamRange = (idx: number, range: string) => {
    const updated = [...parameters];
    updated[idx].normal_range = range;
    setParameters(updated);
  };

  const updateParamUnit = (idx: number, unit: string) => {
    const updated = [...parameters];
    updated[idx].unit = unit;
    setParameters(updated);
  };

  // Filter reports
  const filteredReports = reports.filter((r) => {
    // 1. Search filter
    const matchesSearch = 
      r.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.patient_id_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.test_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `#${r.id + 1000}`.includes(searchQuery);

    // 2. Date filter (match test created_at)
    const matchDateStr = formatIsoDate(selectedDate);
    const reportDateStr = r.created_at.split('T')[0];
    const matchesDate = reportDateStr === matchDateStr;

    // 3. Tab filter
    if (activeTab === "all") return matchesSearch && matchesDate;
    return matchesSearch && matchesDate && r.status === activeTab;
  });

  // Sort reports
  const sortedReports = [...filteredReports].sort((a, b) => {
    if (sortBy === "oldest") {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    } else {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  // Stats Counters
  const allDateReports = reports.filter(r => r.created_at.split('T')[0] === formatIsoDate(selectedDate));
  const newCount = allDateReports.filter(r => r.status === "New").length;
  const inProgressCount = allDateReports.filter(r => r.status === "In progress").length;
  const finalCount = allDateReports.filter(r => r.status === "Final").length;
  const signedOffCount = allDateReports.filter(r => r.status === "Signed off").length;
  const canceledCount = allDateReports.filter(r => r.status === "Canceled").length;

  // Print counters
  const printedCount = 0; // Mock print count

  // Barcode renderer
  const renderBarcode = (text: string) => {
    return (
      <div className="flex flex-col items-center select-none bg-white p-2 border border-slate-100 rounded-lg">
        <div className="flex h-10 items-end justify-center bg-white">
          {[2,1,3,1,2,4,1,2,3,1,2,1,4,2,1,3,2,1,4,1,2,3,1,2,1,4,2,1,3,2,1,4].map((width, idx) => (
            <div key={idx} className={`h-full bg-slate-800 ${idx % 2 === 0 ? 'opacity-100' : 'opacity-0'}`} style={{ width: `${width}px` }} />
          ))}
        </div>
        <span className="text-[10px] tracking-[0.25em] font-mono mt-1 text-slate-700">{text}</span>
      </div>
    );
  };

  // QR Code renderer
  const renderQrCode = () => {
    return (
      <div className="p-1.5 border border-slate-200 bg-white rounded-lg shadow-sm flex items-center justify-center shrink-0 w-16 h-16">
        <div className="grid grid-cols-12 gap-[0.5px] w-full h-full bg-white">
          {Array.from({ length: 144 }).map((_, idx) => {
            const row = Math.floor(idx / 12);
            const col = idx % 12;
            const isAnchor =
              (row < 3 && col < 3) ||
              (row < 3 && col >= 9) ||
              (row >= 9 && col < 3);
            const isAnchorBorder =
              (row === 3 && col < 4) || (row < 4 && col === 3) ||
              (row === 3 && col >= 8) || (row < 4 && col === 8) ||
              (row >= 8 && col === 3) || (row === 8 && col < 4);
            
            let bg = 'bg-white';
            if (isAnchor) bg = 'bg-slate-900';
            else if (isAnchorBorder) bg = 'bg-white';
            else bg = Math.random() > 0.45 ? 'bg-slate-900' : 'bg-white';

            return <div key={idx} className={`w-full h-full ${bg}`} />;
          })}
        </div>
      </div>
    );
  };

  if (loading && viewMode === "list") {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-darkBg">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-sm font-semibold text-slate-500">Loading Clinical Reports Ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-800 dark:text-slate-100 pb-12 font-sans">
      
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl text-white font-semibold text-xs flex items-center space-x-2 transition-all duration-300 animate-slide-in ${
          toast.type === "success" ? "bg-emerald-500" : "bg-red-500"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* VIEW 1: MAIN REPORTS HUB */}
      {viewMode === "list" && (
        <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          
          {/* Main Title and Action Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Reports for {selectedDate.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}
                </h1>
                <a href="#" className="text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors flex items-center space-x-0.5">
                  <span>Recent changes</span>
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                View, manage, and verify patient diagnostics results.
              </p>
            </div>
            
            {/* Header controls */}
            <div className="flex items-center space-x-3 shrink-0">
              <button 
                onClick={() => alert("Creating a new test panel entry...")}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm hover:shadow transition-all flex items-center space-x-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>New test</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/50 rounded-xl text-xs flex items-center space-x-2">
              <FileWarning className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Filtering and Controls Panel */}
          <div className="bg-white dark:bg-darkCard p-4 rounded-xl border border-slate-200/80 dark:border-darkBorders shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            
            {/* Left Controls: Search & Date picker */}
            <div className="flex flex-wrap items-center gap-3">
              
              {/* Search */}
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search in page..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-darkBorders bg-slate-50 dark:bg-darkBg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-700 dark:text-slate-200"
                />
              </div>

              {/* Date navigator */}
              <div className="flex items-center bg-slate-50 dark:bg-darkBg border border-slate-200 dark:border-darkBorders rounded-lg overflow-hidden h-9">
                <button 
                  onClick={() => changeDate(-1)}
                  className="px-2.5 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors h-full flex items-center text-slate-500"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-4 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center space-x-1.5 h-full">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>{formatDisplayDate(selectedDate)}</span>
                </span>
                <button 
                  onClick={() => changeDate(1)}
                  className="px-2.5 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors h-full flex items-center text-slate-500"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Today shortcut */}
              <button
                onClick={() => setSelectedDate(new Date())}
                className="px-3 py-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-all h-9 whitespace-nowrap"
              >
                Today
              </button>

              {/* Go to */}
              <div className="relative">
                <select 
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "today") {
                      setSelectedDate(new Date());
                    } else {
                      const diff = parseInt(val);
                      if (!isNaN(diff)) changeDate(diff);
                    }
                    (e.target as HTMLSelectElement).value = "";
                  }}
                  className="px-3 py-2 bg-slate-50 dark:bg-darkBg border border-slate-200 dark:border-darkBorders text-xs font-bold rounded-lg focus:outline-none pr-8 appearance-none text-slate-700 dark:text-slate-200"
                  defaultValue=""
                >
                  <option value="" disabled>Go to</option>
                  <option value="today">Today</option>
                  <option value="-1">Yesterday</option>
                  <option value="-7">1 Week Ago</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-3 h-3 w-3 text-slate-500 pointer-events-none" />
              </div>

              {/* Stats button */}
              <button 
                onClick={() => setShowStatsModal(true)}
                className="px-4 py-2 border border-blue-500/30 hover:border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-500/5 font-bold text-xs rounded-lg transition-all flex items-center space-x-1 h-9"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Stats</span>
              </button>

            </div>

            {/* Right Controls: Sort & Print Status */}
            <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 text-xs font-semibold text-slate-600 dark:text-slate-400">
              
              {/* Sorting */}
              <div className="flex items-center space-x-2">
                <span>Sort by:</span>
                <div className="relative">
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="py-1.5 pl-2 pr-6 bg-transparent border border-slate-200 dark:border-darkBorders rounded-lg text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none text-[11px]"
                  >
                    <option value="oldest">Oldest first</option>
                    <option value="newest">Newest first</option>
                  </select>
                  <ChevronDown className="absolute right-1.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Print Counter */}
              <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-darkBg px-3 py-1.5 border border-slate-200 dark:border-darkBorders rounded-lg text-[11px] font-bold text-slate-600 dark:text-slate-300">
                <Printer className="h-3.5 w-3.5 text-slate-400" />
                <span>{printedCount}/{allDateReports.length} Printed</span>
              </div>

            </div>

          </div>

          {/* Filter Status Tabs */}
          <div className="flex border-b border-slate-200 dark:border-darkBorders text-xs font-bold gap-1">
            {[
              { id: "all", label: "All", count: allDateReports.length },
              { id: "New", label: "New", count: newCount },
              { id: "In progress", label: "In progress", count: inProgressCount },
              { id: "Final", label: "Final", count: finalCount },
              { id: "Signed off", label: "Signed off", count: signedOffCount },
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2.5 border-b-2 -mb-px transition-colors flex items-center space-x-1.5 ${
                    isSelected 
                      ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400" 
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-150 text-slate-500 dark:bg-slate-800'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Reports Table Grid */}
          <div className="bg-white dark:bg-darkCard rounded-xl border border-slate-200 dark:border-darkBorders shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 border-b border-slate-200 dark:border-darkBorders font-bold tracking-wide">
                  <tr>
                    <th className="p-4 w-32">REG. NO.</th>
                    <th className="p-4 w-28">TIME</th>
                    <th className="p-4">PATIENT</th>
                    <th className="p-4">REFERRED BY</th>
                    <th className="p-4">TESTS</th>
                    <th className="p-4 w-20">CC</th>
                    <th className="p-4 w-32 text-center">STATUS</th>
                    <th className="p-4 w-48 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-darkBorders">
                  {sortedReports.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-slate-400">
                        <FileSpreadsheet className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                        <p className="font-bold text-slate-600 dark:text-slate-400 text-sm">No reports scheduled for this date</p>
                        <p className="text-xs text-slate-400 mt-1">Try toggling dates using the date picker navigation above.</p>
                      </td>
                    </tr>
                  ) : (
                    sortedReports.map((r, index) => {
                      const sequenceNum = index + 1;
                      const displayRegNo = `#100${sequenceNum} L${sequenceNum}`;
                      const regTimeStr = new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      
                      return (
                        <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors align-middle">
                          
                          {/* REG. NO. */}
                          <td className="p-4">
                            <div className="font-bold text-slate-900 dark:text-white">{displayRegNo}</div>
                            <div className="text-[9px] text-slate-400 font-mono mt-0.5">ID: {r.id + 4000}</div>
                          </td>

                          {/* TIME */}
                          <td className="p-4 font-semibold text-slate-600 dark:text-slate-350">
                            {regTimeStr}
                          </td>

                          {/* PATIENT */}
                          <td className="p-4">
                            <div className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer" onClick={() => triggerEdit(r.id)}>
                              {r.patient_name || "Alice Smith"}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 flex items-center space-x-1.5">
                              <span>33 YRS/M</span>
                              <span className="text-slate-300">|</span>
                              <span className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[8px] font-bold">B- A</span>
                            </div>
                          </td>

                          {/* REFERRED BY */}
                          <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                            {r.patient_name?.includes("Alice") ? "Dr. Vance" : "Self"}
                          </td>

                          {/* TESTS */}
                          <td className="p-4">
                            <div className="font-bold text-slate-800 dark:text-slate-200">{r.test_name}</div>
                          </td>

                          {/* CC */}
                          <td className="p-4 font-bold text-slate-600 dark:text-slate-400">
                            Main
                          </td>

                          {/* STATUS */}
                          <td className="p-4 text-center">
                            <span className={`px-3 py-1 rounded-lg font-extrabold text-[9px] uppercase tracking-wider ${
                              r.status === "New" && "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                            } ${
                              r.status === "In progress" && "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                            } ${
                              r.status === "Final" && "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                            } ${
                              r.status === "Signed off" && "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                            } ${
                              r.status === "Canceled" && "bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                            }`}>
                              {r.status}
                            </span>
                          </td>

                          {/* ACTIONS */}
                          <td className="p-4 text-right">
                            <div className="inline-flex items-center space-x-1.5 relative">
                              
                              {/* Enter results (Only for New or In progress) */}
                              {r.status !== "Canceled" && (
                                <button
                                  onClick={() => triggerEdit(r.id)}
                                  className="h-8 px-3 rounded-lg border border-slate-200 dark:border-darkBorders hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] flex items-center space-x-1 transition-colors"
                                >
                                  <ClipboardEdit className="h-3.5 w-3.5 text-blue-500" />
                                  <span>Enter results</span>
                                </button>
                              )}

                              {/* View */}
                              <button
                                onClick={() => triggerPreview(r.id)}
                                className="h-8 px-3 rounded-lg border border-slate-200 dark:border-darkBorders hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] flex items-center space-x-1 transition-colors"
                              >
                                <Eye className="h-3.5 w-3.5 text-slate-400" />
                                <span>View</span>
                              </button>

                              {/* Dropdown Menu Toggle */}
                              <button
                                onClick={() => setActiveActionMenuId(activeActionMenuId === r.id ? null : r.id)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>

                              {/* Context Dropdown Menu */}
                              {activeActionMenuId === r.id && (
                                <div className="absolute right-0 top-9 z-20 w-44 bg-white dark:bg-darkCard border border-slate-200 dark:border-darkBorders rounded-xl shadow-xl py-1 text-left">
                                  <button 
                                    onClick={() => {
                                      triggerToast("success", "Report sent to " + r.patient_name);
                                      setActiveActionMenuId(null);
                                    }}
                                    className="w-full px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center space-x-2 transition-colors"
                                  >
                                    <Send className="h-3.5 w-3.5 text-slate-400" />
                                    <span>Send report</span>
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setShowBillModal({ open: true, report: r });
                                      setActiveActionMenuId(null);
                                    }}
                                    className="w-full px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center space-x-2 transition-colors"
                                  >
                                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                                    <span>View bill</span>
                                  </button>
                                </div>
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

        </div>
      )}

      {/* VIEW 2: TECHNICIAN / DOCTOR RESULTS EDITOR (Mockup 2) */}
      {viewMode === "edit" && currentReport && (
        <div className="max-w-7xl mx-auto px-4 pt-6 space-y-6">
          
          {/* Breadcrumbs / Top Actions */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-darkBorders pb-4">
            
            {/* Left Header Info */}
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setViewMode("list")}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg mr-1"
                >
                  <ArrowLeft className="h-5 w-5 text-slate-500" />
                </button>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Lab report</h1>
                <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono text-slate-500">
                  Reg no. {selectedReportId ? currentReport.id + 1000 : 1003} | L3
                </span>
                <span className="text-[10px] bg-purple-105 text-purple-605 dark:bg-purple-950/20 dark:text-purple-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center space-x-1">
                  <User className="h-3 w-3" />
                  <span>MALE</span>
                </span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  Status: {currentReport.status}
                </span>
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  Online report requested
                </span>
              </div>
            </div>

            {/* Right Header Navigation buttons */}
            <div className="flex items-center space-x-2 shrink-0">
              <div className="relative">
                <button className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-darkBorders text-xs font-bold rounded-lg flex items-center space-x-1">
                  <span>Go to</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>
              <div className="inline-flex rounded-lg border border-slate-200 dark:border-darkBorders overflow-hidden">
                <button 
                  onClick={() => triggerEdit(selectedReportId!)}
                  className="px-3 py-1.5 bg-blue-500/10 text-blue-650 dark:text-blue-400 text-xs font-bold border-r border-slate-200 dark:border-darkBorders flex items-center space-x-1"
                >
                  <span>&lt; Edit &gt;</span>
                </button>
                <button 
                  onClick={() => triggerPreview(selectedReportId!)}
                  className="px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center space-x-1"
                >
                  <span>&lt; View &gt;</span>
                </button>
              </div>
            </div>

          </div>

          {/* Form Layout Split */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Left Content Area (Columns 1-3) */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Patient Info Card Table */}
              <div className="bg-white dark:bg-darkCard p-4 rounded-xl border border-slate-200 dark:border-darkBorders shadow-sm relative">
                
                {/* Header structure grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  
                  {/* Left Metadata Grid */}
                  <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 text-xs">
                    
                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">Patient Name:</span>
                      <span className="font-bold text-slate-800 dark:text-white text-sm">{currentReport.patient_name || "Mr. Sundhar Reddy"}</span>
                    </div>
                    
                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">Registered on:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-205 flex items-center space-x-1.5">
                        <span>29/01/2026 10:09 PM</span>
                        <ClipboardEdit className="h-3.5 w-3.5 text-slate-400 cursor-pointer hover:text-blue-500" />
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">Age / Sex:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-205">33 YRS / M</span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">Collected on:</span>
                      <div className="flex items-center space-x-1 mt-0.5">
                        <input 
                          type="text" 
                          value={collectedOn} 
                          onChange={(e) => setCollectedOn(e.target.value)}
                          className="px-2 py-1 border border-slate-200 dark:border-darkBorders rounded bg-slate-50 dark:bg-darkBg w-28 focus:outline-none text-slate-800 dark:text-slate-200"
                        />
                        <div className="w-16 h-7 border border-slate-200 dark:border-darkBorders rounded bg-slate-50 dark:bg-darkBg flex items-center justify-center text-slate-400 cursor-pointer">
                          <Clock className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">Referred By:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-205">Self</span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">Received on:</span>
                      <div className="flex items-center space-x-1 mt-0.5">
                        <input 
                          type="text" 
                          value={receivedOn} 
                          onChange={(e) => setReceivedOn(e.target.value)}
                          className="px-2 py-1 border border-slate-200 dark:border-darkBorders rounded bg-slate-50 dark:bg-darkBg w-28 focus:outline-none text-slate-800 dark:text-slate-200"
                        />
                        <div className="w-16 h-7 border border-slate-200 dark:border-darkBorders rounded bg-slate-50 dark:bg-darkBg flex items-center justify-center text-slate-400 cursor-pointer">
                          <Clock className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">Reg. no. / Collected at:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-205">1003 / Home</span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">Reported on:</span>
                      <div className="flex items-center space-x-1 mt-0.5">
                        <input 
                          type="text" 
                          value={reportedOn} 
                          onChange={(e) => setReportedOn(e.target.value)}
                          className="px-2 py-1 border border-slate-200 dark:border-darkBorders rounded bg-slate-50 dark:bg-darkBg w-36 focus:outline-none text-slate-800 dark:text-slate-200"
                        />
                        <div className="w-10 h-7 border border-slate-200 dark:border-darkBorders rounded bg-slate-50 dark:bg-darkBg flex items-center justify-center text-slate-400 cursor-pointer">
                          <Clock className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Right Barcode Panel */}
                  <div className="md:col-span-3 border-t md:border-t-0 md:border-l border-slate-100 dark:border-darkBorders pt-4 md:pt-0 md:pl-4 flex flex-col items-center justify-center h-full">
                    {renderBarcode(selectedReportId ? String(1000 + currentReport.id) : "1003")}
                  </div>

                </div>

              </div>

              {/* Print Category Preferences Checkbox */}
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-655 dark:text-slate-350">
                <input 
                  type="checkbox" 
                  id="printCategories"
                  checked={printCategoriesNewPage}
                  onChange={(e) => setPrintCategoriesNewPage(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                />
                <label htmlFor="printCategories" className="cursor-pointer">Print categories from new page (PDF only)</label>
                <span title="Forces category banner page breaks on PDF rendering">
                  <HelpCircle className="h-3.5 w-3.5 text-slate-400 cursor-pointer" />
                </span>
              </div>

              {/* Test Category Banner Segment */}
              <div className="bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-darkBorders overflow-hidden">
                
                {/* Banner Header */}
                <div className="px-5 py-3.5 bg-slate-200/50 dark:bg-slate-800/50 flex justify-between items-center border-b border-slate-200 dark:border-darkBorders">
                  <span className="font-extrabold text-sm tracking-wide text-slate-700 dark:text-slate-250 uppercase">
                    {currentReport.test_name === "Malaria Antigen" ? "SEROLOGY & IMMUNOLOGY" : "CLINICAL PATHOLOGY"}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <button className="px-2.5 py-1 bg-white dark:bg-darkCard border border-slate-200 dark:border-darkBorders text-[10px] font-bold rounded flex items-center space-x-0.5 text-slate-600 dark:text-slate-355">
                      <span>Reorder</span>
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Parameters Editing Table */}
                <div className="p-5 space-y-4 bg-white dark:bg-darkCard">
                  
                  {/* Parameter Entry Table */}
                  <div className="border border-slate-200 dark:border-darkBorders rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 border-b border-slate-200 dark:border-darkBorders font-bold tracking-wide">
                        <tr>
                          <th className="p-3 w-1/3">TEST</th>
                          <th className="p-3 w-1/4">VALUE</th>
                          <th className="p-3 w-1/6">UNIT</th>
                          <th className="p-3">REFERENCE</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-darkBorders">
                        
                        {/* Test Group Header Checkbox Row */}
                        <tr className="bg-slate-50/20 dark:bg-slate-800/10 font-bold">
                          <td colSpan={4} className="p-3">
                            <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200">
                              <input 
                                type="checkbox" 
                                id="testCategoryGroup"
                                defaultChecked={true}
                                className="h-3.5 w-3.5 rounded border-slate-300"
                              />
                              <label htmlFor="testCategoryGroup" className="cursor-pointer">{currentReport.test_name}</label>
                            </div>
                          </td>
                        </tr>

                        {/* Parameter Inputs Rows */}
                        {parameters.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-slate-400">
                              No parameter list available. Enter results findings text manually in the section below.
                            </td>
                          </tr>
                        ) : (
                          parameters.map((param, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/20 dark:hover:bg-slate-850/10">
                              
                              {/* Parameter Name */}
                              <td className="p-3 pl-8 font-semibold text-slate-750 dark:text-slate-200">
                                {param.parameter}
                              </td>

                              {/* Parameter Value Entry (Dropdown + text input) */}
                              <td className="p-3">
                                <div className="flex items-center space-x-1">
                                  {/* Custom select wrapper for options like Negative/Positive */}
                                  <div className="relative w-full">
                                    <select 
                                      value={param.observed}
                                      onChange={(e) => updateParamValue(idx, e.target.value)}
                                      className="w-full px-2.5 py-1 bg-slate-50 dark:bg-darkBg border border-slate-200 dark:border-darkBorders rounded focus:outline-none font-bold text-slate-800 dark:text-white"
                                    >
                                      <option value="">Select or type</option>
                                      <option value="Negative">Negative</option>
                                      <option value="Positive">Positive</option>
                                    </select>
                                  </div>
                                  <button 
                                    onClick={() => {
                                      const newVal = param.observed === "Negative" ? "Positive" : "Negative";
                                      updateParamValue(idx, newVal);
                                    }}
                                    type="button" 
                                    className="p-1 bg-blue-500/10 border border-blue-500/20 rounded text-blue-600 hover:bg-blue-500/20 shrink-0"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>

                              {/* Parameter Unit */}
                              <td className="p-3">
                                <input 
                                  type="text" 
                                  value={param.unit} 
                                  onChange={(e) => updateParamUnit(idx, e.target.value)}
                                  className="w-full px-2 py-1 bg-slate-50 dark:bg-darkBg border border-slate-200 dark:border-darkBorders rounded text-slate-800 dark:text-slate-200 focus:outline-none"
                                />
                              </td>

                              {/* Parameter Reference range */}
                              <td className="p-3">
                                <div className="flex items-center space-x-2">
                                  <div className="h-3 w-3 rounded-full bg-slate-900 border border-slate-950 cursor-pointer shrink-0" title="Reference range status normal indicator" />
                                  <input 
                                    type="text" 
                                    value={param.normal_range} 
                                    onChange={(e) => updateParamRange(idx, e.target.value)}
                                    className="w-full px-2.5 py-1 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-darkBorders rounded text-slate-600 dark:text-slate-350 focus:outline-none"
                                  />
                                </div>
                              </td>

                            </tr>
                          ))
                        )}

                      </tbody>
                    </table>
                  </div>

                  {/* Print settings and actions check row */}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-xs font-semibold text-slate-655 dark:text-slate-350">
                    
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={printResults}
                        onChange={(e) => setPrintResults(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                      />
                      <span>Print results</span>
                    </label>

                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={pageBreakAfter}
                        onChange={(e) => setPageBreakAfter(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                      />
                      <span>Page break after (PDF only)</span>
                    </label>

                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={skipInterpretation}
                        onChange={(e) => setSkipInterpretation(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                      />
                      <span>Skip interpretation</span>
                    </label>

                  </div>

                  {/* Blue Option Add buttons: Notes, Remarks, Advice */}
                  <div className="flex items-center space-x-4 pt-1 text-xs font-extrabold text-blue-600 dark:text-blue-400">
                    <button 
                      onClick={() => alert("Configure categories template notes...")}
                      className="hover:underline flex items-center space-x-0.5"
                    >
                      <span>+ Notes</span>
                    </button>
                    
                    <button 
                      onClick={() => setShowRemarksInput(!showRemarksInput)}
                      className="hover:underline flex items-center space-x-0.5"
                    >
                      <span>{showRemarksInput ? "- Remarks" : "+ Remarks"}</span>
                    </button>

                    <button 
                      onClick={() => setShowAdviceInput(!showAdviceInput)}
                      className="hover:underline flex items-center space-x-0.5"
                    >
                      <span>{showAdviceInput ? "- Advice" : "+ Advice"}</span>
                    </button>
                  </div>

                  {/* Collapsible Remarks Field */}
                  {showRemarksInput && (
                    <div className="space-y-1 pt-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Remarks:</label>
                      <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-darkBg border border-slate-200 dark:border-darkBorders rounded-lg text-xs focus:outline-none text-slate-800 dark:text-slate-200"
                        rows={2}
                        placeholder="Type laboratory findings remarks..."
                      />
                    </div>
                  )}

                  {/* Collapsible Advice Field */}
                  {showAdviceInput && (
                    <div className="space-y-1 pt-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Patient Advice:</label>
                      <textarea
                        value={advice}
                        onChange={(e) => setAdvice(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-darkBg border border-slate-200 dark:border-darkBorders rounded-lg text-xs focus:outline-none text-slate-800 dark:text-slate-200"
                        rows={2}
                        placeholder="Type medical instructions/advice..."
                      />
                    </div>
                  )}

                </div>

              </div>

              {/* Dynamic Text Parameters: Interpretation, Test Utility, Limitations */}
              {!skipInterpretation && (
                <div className="space-y-6">
                  
                  {/* Interpretation Card */}
                  <div className="bg-white dark:bg-darkCard p-5 rounded-xl border border-slate-200 dark:border-darkBorders shadow-sm space-y-2">
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-darkBorders pb-2">
                      <span className="font-extrabold text-xs text-slate-700 dark:text-slate-250 uppercase tracking-wider">Interpretation</span>
                      <button className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-darkBorders rounded font-bold text-slate-500 hover:text-blue-500 flex items-center space-x-0.5">
                        <ClipboardEdit className="h-3 w-3" />
                        <span>Edit</span>
                      </button>
                    </div>
                    <textarea 
                      value={interpretation} 
                      onChange={(e) => setInterpretation(e.target.value)}
                      className="w-full bg-transparent text-xs text-slate-600 dark:text-slate-300 leading-relaxed focus:outline-none resize-y min-h-[80px]"
                    />
                  </div>

                  {/* Test Utility */}
                  <div className="bg-white dark:bg-darkCard p-5 rounded-xl border border-slate-200 dark:border-darkBorders shadow-sm space-y-2">
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-darkBorders pb-2">
                      <span className="font-extrabold text-xs text-slate-700 dark:text-slate-255 uppercase tracking-wider">Test Utility</span>
                    </div>
                    <textarea 
                      value={testUtility} 
                      onChange={(e) => setTestUtility(e.target.value)}
                      className="w-full bg-transparent text-xs text-slate-600 dark:text-slate-350 leading-relaxed focus:outline-none resize-y min-h-[60px]"
                    />
                  </div>

                  {/* Notes & Limitations */}
                  <div className="bg-white dark:bg-darkCard p-5 rounded-xl border border-slate-200 dark:border-darkBorders shadow-sm space-y-2">
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-darkBorders pb-2">
                      <span className="font-extrabold text-xs text-slate-700 dark:text-slate-255 uppercase tracking-wider">Notes & Limitations</span>
                    </div>
                    <textarea 
                      value={notesAndLimitations} 
                      onChange={(e) => setNotesAndLimitations(e.target.value)}
                      className="w-full bg-transparent text-xs text-slate-600 dark:text-slate-355 leading-relaxed focus:outline-none resize-y min-h-[60px]"
                    />
                  </div>

                </div>
              )}

              {/* Bottom Footer Actions row */}
              <div className="flex items-center space-x-3 pt-4 border-t border-slate-200 dark:border-darkBorders">
                <button
                  onClick={() => saveReportData("Signed off")}
                  disabled={submitting}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Sign off</span>
                </button>
                
                <button
                  onClick={() => saveReportData("Final")}
                  disabled={submitting}
                  className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-darkBorders text-slate-700 dark:text-slate-200 hover:bg-slate-200 hover:dark:bg-slate-750 font-bold text-xs rounded-xl transition-all"
                >
                  <span>Final</span>
                </button>

                <button
                  onClick={() => saveReportData("In progress")}
                  disabled={submitting}
                  className="px-6 py-2.5 border border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-500/5 font-bold text-xs rounded-xl transition-all"
                >
                  <span>Save only</span>
                </button>
              </div>

            </div>

            {/* Right Side Sidebar Drawer (Column 4) */}
            <div className="lg:col-span-1 space-y-4">
              
              {/* Tab Navigation header */}
              <div className="bg-white dark:bg-darkCard p-2 rounded-xl border border-slate-200 dark:border-darkBorders shadow-sm grid grid-cols-3 gap-1 text-[10px] font-bold text-center">
                {[
                  { id: "patient", label: "Patient" },
                  { id: "doctor", label: "Doctor" },
                  { id: "history", label: "History" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSidebarPanel(tab.id as any)}
                    className={`py-1.5 rounded transition-all ${
                      sidebarPanel === tab.id 
                        ? "bg-blue-650 text-white" 
                        : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="bg-white dark:bg-darkCard p-2 rounded-xl border border-slate-200 dark:border-darkBorders shadow-sm grid grid-cols-3 gap-1 text-[10px] font-bold text-center">
                {[
                  { id: "recent", label: "Reports" },
                  { id: "activities", label: "Log" },
                  { id: "debug", label: "Debug" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSidebarPanel(tab.id as any)}
                    className={`py-1.5 rounded transition-all ${
                      sidebarPanel === tab.id 
                        ? "bg-blue-650 text-white" 
                        : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Sidebar Content Panel */}
              <div className="bg-white dark:bg-darkCard p-5 rounded-xl border border-slate-200 dark:border-darkBorders shadow-sm text-xs min-h-[300px]">
                
                {sidebarPanel === "patient" && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">Patient Profile</span>
                      <ClipboardEdit className="h-4 w-4 text-slate-400 hover:text-blue-500 cursor-pointer" />
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-slate-400 block font-semibold text-[10px] uppercase">Name</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200">Mr. Sundhar Reddy</p>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold text-[10px] uppercase">Phone</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200">8555053216</p>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold text-[10px] uppercase">Email</span>
                        <p className="font-mono text-slate-700 dark:text-slate-300">sundhar@gmail.com</p>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold text-[10px] uppercase">Address</span>
                        <p className="font-medium text-slate-700 dark:text-slate-300 leading-normal">12 Main St, Queens, NY</p>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold text-[10px] uppercase">Emergency Contact</span>
                        <p className="font-semibold text-slate-500">N/A</p>
                      </div>
                    </div>
                  </div>
                )}

                {sidebarPanel === "doctor" && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">Doctor Details</span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-slate-400 block font-semibold text-[10px] uppercase">Referred By</span>
                        <p className="font-bold text-slate-800 dark:text-slate-202">Self (Walk-in case)</p>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold text-[10px] uppercase">Commission Rate</span>
                        <p className="font-bold text-slate-800 dark:text-slate-202">0.0%</p>
                      </div>
                    </div>
                  </div>
                )}

                {sidebarPanel === "history" && (
                  <div className="space-y-4">
                    <div className="border-b pb-2">
                      <span className="font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">Patient History</span>
                    </div>
                    <div className="text-slate-450 font-semibold text-center py-8">
                      No previous clinical history files uploaded for this patient.
                    </div>
                  </div>
                )}

                {sidebarPanel === "recent" && (
                  <div className="space-y-4">
                    <div className="border-b pb-2">
                      <span className="font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">Recent Lab Reports</span>
                    </div>
                    <div className="space-y-2.5">
                      <div className="p-2 border border-slate-100 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer">
                        <div className="font-bold">Lipid Profile</div>
                        <div className="text-[10px] text-slate-400 flex justify-between mt-0.5">
                          <span>29-01-2026</span>
                          <span className="text-red-500 font-bold uppercase">Canceled</span>
                        </div>
                      </div>
                      <div className="p-2 border border-slate-100 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer">
                        <div className="font-bold">HbA1c</div>
                        <div className="text-[10px] text-slate-400 flex justify-between mt-0.5">
                          <span>29-01-2026</span>
                          <span className="text-red-500 font-bold uppercase">Canceled</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {sidebarPanel === "activities" && (
                  <div className="space-y-4">
                    <div className="border-b pb-2">
                      <span className="font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">Report Activities</span>
                    </div>
                    <div className="space-y-3 font-medium text-slate-655">
                      <div className="flex items-start space-x-2">
                        <Activity className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                        <div>
                          <p>Order registered by John Doe</p>
                          <span className="text-[9px] text-slate-400">29/01/2026 10:09 PM</span>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Activity className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                        <div>
                          <p>Report parameters initialized</p>
                          <span className="text-[9px] text-slate-400">29/01/2026 10:10 PM</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {sidebarPanel === "debug" && (
                  <div className="space-y-3">
                    <div className="border-b pb-2">
                      <span className="font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">Raw State Debug</span>
                    </div>
                    <pre className="p-2.5 bg-slate-900 text-[9px] text-slate-300 font-mono rounded-lg overflow-x-auto select-all max-h-[250px]">
                      {JSON.stringify({
                        id: selectedReportId,
                        patient: "Mr. Sundhar Reddy",
                        test: currentReport.test_name,
                        status: currentReport.status,
                        parameters
                      }, null, 2)}
                    </pre>
                  </div>
                )}

              </div>

            </div>

          </div>

        </div>
      )}

      {/* VIEW 3: CLINICAL PDF CERTIFICATE PREVIEW (Mockup 3/4) */}
      {viewMode === "preview" && currentReport && (
        <div className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
          
          {/* Header Action menu */}
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-darkBorders pb-4 print:hidden">
            
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setViewMode("list")}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg mr-1"
              >
                <ArrowLeft className="h-5 w-5 text-slate-500" />
              </button>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Lab report</h1>
              
              {/* Version dropdown */}
              <div className="relative">
                <select className="pl-3 pr-8 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-darkBorders text-xs font-bold rounded-lg focus:outline-none appearance-none text-slate-700 dark:text-slate-200">
                  <option>Version 2</option>
                  <option>Version 1</option>
                </select>
                <ChevronDown className="absolute right-2 top-2 h-3 w-3 text-slate-500 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <div className="inline-flex rounded-lg border border-slate-200 dark:border-darkBorders overflow-hidden">
                <button 
                  onClick={() => triggerEdit(selectedReportId!)}
                  className="px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-darkBorders"
                >
                  <span>&lt; Edit &gt;</span>
                </button>
                <button 
                  onClick={() => triggerPreview(selectedReportId!)}
                  className="px-3 py-1.5 bg-blue-500/10 text-blue-650 dark:text-blue-400 text-xs font-bold flex items-center space-x-1"
                >
                  <span>&lt; View &gt;</span>
                </button>
              </div>
            </div>

          </div>

          {/* Grid Layout splits: Report Paper preview + Drawer */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Paper Sheet Preview container */}
            <div className="lg:col-span-3">
              
              {/* Printable sheet element */}
              <div className="bg-white text-slate-900 p-8 md:p-12 rounded-xl border border-slate-200 shadow-2xl relative overflow-hidden font-sans print:shadow-none print:border-none print:p-0">
                
                {/* Banner watermark background */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none">
                  <HeartPulse className="h-96 w-96 text-blue-600" />
                </div>

                {/* Letterhead header */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 relative z-10">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className="p-1 bg-blue-600 rounded text-white shrink-0">
                        <HeartPulse className="h-6 w-6" />
                      </div>
                      <span className="font-extrabold text-xl tracking-tight text-slate-900">
                        {currentReport.lab_name || "Central Diagnostic Lab"}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold leading-normal">
                      {currentReport.lab_address || "123 Hospital Lane, Medical Center, NY"}
                    </p>
                    {(currentReport.lab_phone || currentReport.lab_email || currentReport.lab_website) && (
                      <p className="text-[9px] text-slate-400 font-semibold mt-1">
                        {currentReport.lab_phone && <span className="mr-3">Phone: {currentReport.lab_phone}</span>}
                        {currentReport.lab_email && <span className="mr-3">Email: {currentReport.lab_email}</span>}
                        {currentReport.lab_website && <span>Website: {currentReport.lab_website}</span>}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-xs uppercase tracking-wider text-slate-800">Diagnostics Certificate</div>
                    <div className="text-[9px] text-slate-500 font-bold mt-1">Status: <strong className="text-blue-600 uppercase font-black">{currentReport.status}</strong></div>
                  </div>
                </div>

                {/* Patient metadata table card */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-5 border-b border-slate-200 text-[11px] leading-relaxed relative z-10">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Patient ID:</span>
                    <span className="font-bold font-mono text-slate-800">{currentReport.patient_id || "CDL-1002"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Patient Name:</span>
                    <span className="font-extrabold text-slate-900">{currentReport.patient_name || "Mr. Sundhar Reddy"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Age / Gender:</span>
                    <span className="font-bold text-slate-800">{currentReport.patient_age_gender || "33 / Male"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Invoice Number:</span>
                    <span className="font-mono text-slate-600">{currentReport.invoice_number || "CDL-INV-1003"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Collected At:</span>
                    <span className="font-bold text-slate-700">Home</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Registered on:</span>
                    <span className="font-bold text-slate-700">29/01/2026 10:09 PM</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Reported on:</span>
                    <span className="font-bold text-slate-700">08-07-2026 09:37 AM</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Referred By:</span>
                    <span className="font-bold text-slate-700">{currentReport.referring_doctor || "Self"}</span>
                  </div>
                </div>

                {/* Specimen and dates details */}
                <div className="flex justify-between items-center py-4 border-b border-slate-200 text-[11px] relative z-10">
                  <div className="flex space-x-6">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Sample Type:</span>
                      <span className="font-bold text-slate-700">Blood Specimen</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Collection Date:</span>
                      <span className="font-bold text-slate-700">29-01-2026</span>
                    </div>
                  </div>
                  
                  {/* Barcode and QR code display */}
                  <div className="flex items-center space-x-4">
                    {renderBarcode(selectedReportId ? String(1000 + (currentReport.report_id ?? currentReport.id ?? 3)) : "1003")}
                    {renderQrCode()}
                  </div>
                </div>

                {/* Results Section */}
                <div className="py-6 relative z-10">
                  
                  <h3 className="font-extrabold text-xs text-slate-700 mb-3 uppercase tracking-wider border-l-4 border-blue-600 pl-2">
                    {currentReport.category || "SEROLOGY & IMMUNOLOGY"}
                  </h3>

                  {currentReport.print_results !== false ? (
                    <div className="border border-slate-200 rounded-lg overflow-hidden mt-3">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-55 text-slate-500 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-3 w-1/3">TEST</th>
                            <th className="p-3 w-1/4">VALUE</th>
                            <th className="p-3 w-1/6">UNIT</th>
                            <th className="p-3">REFERENCE</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          
                          {/* Test Group Row */}
                          <tr className="bg-slate-50/40 font-bold text-slate-800">
                            <td colSpan={4} className="p-3">
                              {currentReport.test_name}
                            </td>
                          </tr>

                          {/* Parameter list mapping */}
                          {currentReport.results_json ? (
                            (() => {
                              try {
                                const parsed = JSON.parse(currentReport.results_json);
                                return parsed.map((p: any, idx: number) => (
                                  <tr key={idx} className="hover:bg-slate-50/50">
                                    <td className="p-3 pl-8 text-slate-700 font-semibold">{p.parameter}</td>
                                    <td className="p-3 font-extrabold text-slate-900">{p.observed || "Negative"}</td>
                                    <td className="p-3 font-medium text-slate-500">{p.unit || "-"}</td>
                                    <td className="p-3 font-medium text-slate-600">{p.normal_range || "Negative"}</td>
                                  </tr>
                                ));
                              } catch {
                                return (
                                  <tr>
                                    <td colSpan={4} className="p-4 text-center text-slate-500">
                                      {currentReport.results_data}
                                    </td>
                                  </tr>
                                );
                              }
                            })()
                          ) : (
                            <tr>
                              <td colSpan={4} className="p-4 text-center text-slate-500">
                                {currentReport.results_data}
                              </td>
                            </tr>
                          )}

                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-6 bg-slate-50 text-center font-bold text-slate-500 rounded-lg">
                      Diagnostics parameter values excluded from print summary.
                    </div>
                  )}

                </div>

                {/* Interpretation notes */}
                {currentReport.skip_interpretation !== true && (
                  <div className="space-y-4 pt-4 border-t border-slate-200 relative z-10 text-[11px] leading-relaxed">
                    
                    {currentReport.interpretation && (
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[10px]">Interpretation:</h4>
                        <p className="text-slate-600 leading-relaxed text-justify whitespace-pre-line">{currentReport.interpretation}</p>
                      </div>
                    )}

                    {currentReport.test_utility && (
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[10px]">Test Utility:</h4>
                        <p className="text-slate-600 leading-relaxed text-justify whitespace-pre-line">{currentReport.test_utility}</p>
                      </div>
                    )}

                    {currentReport.notes_and_limitations && (
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[10px]">Notes & Limitations:</h4>
                        <p className="text-slate-600 leading-relaxed text-justify whitespace-pre-line">{currentReport.notes_and_limitations}</p>
                      </div>
                    )}

                  </div>
                )}

                {/* Remarks & Advice */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 text-[11px] relative z-10">
                  {currentReport.remarks && (
                    <div>
                      <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[10px]">Findings Remarks:</h4>
                      <p className="text-slate-600 mt-1 italic leading-relaxed">"{currentReport.remarks}"</p>
                    </div>
                  )}
                  {currentReport.advice && (
                    <div>
                      <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[10px]">Clinician Advice:</h4>
                      <p className="text-slate-600 mt-1 leading-relaxed">{currentReport.advice}</p>
                    </div>
                  )}
                </div>

                {/* End of report notice */}
                <div className="text-center text-[10px] text-slate-400 font-extrabold tracking-widest pt-8 uppercase relative z-10">
                  --- End of report ---
                </div>

                {/* Signatures footer */}
                <div className="grid grid-cols-2 gap-12 pt-12 border-t border-slate-200 mt-12 relative z-10 text-[11px] text-center">
                  <div>
                    <div className="h-10 flex items-center justify-center font-mono italic text-slate-400">
                      {currentReport.technician_signed ? (
                        <div className="flex items-center space-x-1 text-emerald-600 font-bold">
                          <Sparkles className="h-4 w-4" />
                          <span>Signature Verified (Tech)</span>
                        </div>
                      ) : "Alex Rivera (Verified Signature)"}
                    </div>
                    <div className="border-t border-slate-200 pt-2 font-bold text-slate-700">Lab Technician Sign-off</div>
                  </div>

                  <div>
                    <div className="h-10 flex items-center justify-center font-mono italic text-slate-400">
                      {currentReport.doctor_signed ? (
                        <div className="flex items-center space-x-1 text-blue-600 font-bold">
                          <Sparkles className="h-4 w-4" />
                          <span>Doctor Approved</span>
                        </div>
                      ) : "Dr. Michael Vance (Authorized Signatory)"}
                    </div>
                    <div className="border-t border-slate-200 pt-2 font-bold text-slate-700">Authorized Clinical Signatory</div>
                  </div>
                </div>

              </div>

              {/* Print buttons inside view */}
              <div className="mt-4 flex items-center justify-center space-x-3 print:hidden">
                <button 
                  onClick={() => alert("Configure print-ready diagnostics filters...")}
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl shadow-sm transition-all"
                >
                  Select print ready tests
                </button>
              </div>

            </div>

            {/* Right sidebar action panels (Print/Download, Signatures, settings) */}
            <div className="lg:col-span-1 space-y-4 print:hidden">
              
              {/* Primary print action buttons */}
              <div className="bg-white dark:bg-darkCard p-4 rounded-xl border border-slate-200 dark:border-darkBorders shadow-sm space-y-2.5">
                <h3 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider mb-2">Publishing Actions</h3>
                
                <button 
                  onClick={() => window.print()}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center space-x-1.5 transition-all"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print PDF Report</span>
                </button>

                <button 
                  onClick={() => {
                    triggerToast("success", "Report successfully dispatched to Patient portal and Email.");
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center space-x-1.5 transition-all"
                >
                  <Send className="h-4 w-4" />
                  <span>Send Report</span>
                </button>

                <button 
                  onClick={() => triggerEdit(selectedReportId!)}
                  className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-darkBorders hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-all"
                >
                  <ClipboardEdit className="h-4 w-4" />
                  <span>Enter Results</span>
                </button>
              </div>

              {/* Tab Navigation header */}
              <div className="bg-white dark:bg-darkCard p-2 rounded-xl border border-slate-200 dark:border-darkBorders shadow-sm grid grid-cols-3 gap-1 text-[10px] font-bold text-center">
                {[
                  { id: "patient", label: "Patient" },
                  { id: "doctor", label: "Doctor" },
                  { id: "recent", label: "Reports" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSidebarPanel(tab.id as any)}
                    className={`py-1.5 rounded transition-all ${
                      sidebarPanel === tab.id 
                        ? "bg-blue-600 text-white" 
                        : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Sidebar Content Panel */}
              <div className="bg-white dark:bg-darkCard p-5 rounded-xl border border-slate-200 dark:border-darkBorders shadow-sm text-xs min-h-[220px]">
                
                {sidebarPanel === "patient" && (
                  <div className="space-y-4">
                    <span className="font-extrabold text-slate-800 dark:text-white uppercase tracking-wider block">Patient Card</span>
                    <div className="space-y-2">
                      <div>
                        <span className="text-slate-400 block font-semibold text-[10px] uppercase">Name</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200">Mr. Sundhar Reddy</p>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold text-[10px] uppercase">Age / Gender</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200">33 / Male</p>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold text-[10px] uppercase">Address</span>
                        <p className="font-semibold text-slate-700 dark:text-slate-300">12 Main St, Queens, NY</p>
                      </div>
                    </div>
                  </div>
                )}

                {sidebarPanel === "doctor" && (
                  <div className="space-y-4">
                    <span className="font-extrabold text-slate-800 dark:text-white uppercase tracking-wider block">Referred By</span>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">Self</p>
                      <p className="text-slate-400 mt-1 font-semibold">Walk-in patient checkup</p>
                    </div>
                  </div>
                )}

                {sidebarPanel === "recent" && (
                  <div className="space-y-4">
                    <span className="font-extrabold text-slate-800 dark:text-white uppercase tracking-wider block">Recent Tests</span>
                    <div className="space-y-2 text-[11px]">
                      <div className="p-2 border border-slate-100 rounded-lg">
                        <div className="font-bold">Lipid Profile</div>
                        <span className="text-red-500 font-extrabold text-[9px] uppercase block mt-0.5">Canceled</span>
                      </div>
                      <div className="p-2 border border-slate-100 rounded-lg">
                        <div className="font-bold">HbA1c</div>
                        <span className="text-red-500 font-extrabold text-[9px] uppercase block mt-0.5">Canceled</span>
                      </div>
                    </div>
                  </div>
                )}

              </div>

            </div>

          </div>

        </div>
      )}

      {/* STATS DIALOG MODAL */}
      {showStatsModal && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-darkCard rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-darkBorders shadow-2xl relative">
            <button 
              onClick={() => setShowStatsModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              <span>Today's Reports Summary</span>
            </h3>

            <div className="grid grid-cols-2 gap-4 py-2 text-xs font-semibold">
              <div className="p-3 bg-slate-50 dark:bg-darkBg border border-slate-150 rounded-xl">
                <span className="text-slate-400 block uppercase text-[10px]">Total Orders</span>
                <span className="text-xl font-bold text-slate-800 dark:text-white mt-1 block">{allDateReports.length}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-darkBg border border-slate-150 rounded-xl">
                <span className="text-slate-400 block uppercase text-[10px]">New (Pending)</span>
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1 block">{newCount}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-darkBg border border-slate-150 rounded-xl">
                <span className="text-slate-400 block uppercase text-[10px]">In Progress</span>
                <span className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1 block">{inProgressCount}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-darkBg border border-slate-150 rounded-xl">
                <span className="text-slate-400 block uppercase text-[10px]">Signed Off</span>
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">{signedOffCount}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-darkBg border border-slate-150 rounded-xl">
                <span className="text-slate-400 block uppercase text-[10px]">Canceled</span>
                <span className="text-xl font-bold text-red-600 dark:text-red-400 mt-1 block">{canceledCount}</span>
              </div>
            </div>

            <button 
              onClick={() => setShowStatsModal(false)}
              className="w-full mt-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition-all"
            >
              Close Stats
            </button>
          </div>
        </div>
      )}

      {/* VIEW BILL DIALOG MODAL */}
      {showBillModal.open && showBillModal.report && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-darkCard rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-darkBorders shadow-2xl relative">
            <button 
              onClick={() => setShowBillModal({ open: false, report: null })}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
              <FileText className="h-5 w-5 text-emerald-500" />
              <span>Bill Invoice Details</span>
            </h3>

            <div className="border border-slate-200 rounded-xl divide-y divide-slate-150 text-xs font-semibold">
              <div className="p-3 flex justify-between">
                <span className="text-slate-400">Invoice Number:</span>
                <span className="font-mono text-slate-850 dark:text-slate-200">CDL-INV-{showBillModal.report.id + 1000}</span>
              </div>
              <div className="p-3 flex justify-between">
                <span className="text-slate-400">Patient:</span>
                <span className="text-slate-850 dark:text-slate-200">{showBillModal.report.patient_name}</span>
              </div>
              <div className="p-3 flex justify-between">
                <span className="text-slate-400">Diagnostics Test:</span>
                <span className="text-slate-850 dark:text-slate-200">{showBillModal.report.test_name}</span>
              </div>
              <div className="p-3 flex justify-between">
                <span className="text-slate-400">Total Price:</span>
                <span className="font-bold text-slate-900 dark:text-white">$500.00</span>
              </div>
              <div className="p-3 flex justify-between">
                <span className="text-slate-400">Amount Paid:</span>
                <span className="font-bold text-emerald-600">$500.00</span>
              </div>
              <div className="p-3 flex justify-between">
                <span className="text-slate-400">Balance Due:</span>
                <span className="font-bold text-red-500">$0.00</span>
              </div>
              <div className="p-3 flex justify-between items-center">
                <span className="text-slate-400">Status:</span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-600 text-[9px] font-extrabold uppercase">Paid</span>
              </div>
            </div>

            <button 
              onClick={() => setShowBillModal({ open: false, report: null })}
              className="w-full mt-5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all"
            >
              Dismiss Bill
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
