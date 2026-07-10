"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Shield, Building2, ClipboardList, FileText, Mail, 
  History, Check, ChevronRight, Search, Plus, 
  Printer, ArrowLeft, Download, AlertCircle, X, Edit2, MoreHorizontal
} from "lucide-react";
import { DEFAULT_TESTS_DATABASE, CatalogTest } from "../../../../../utils/tests_catalog";

const SETUP_STEPS = [
  { id: "kyc", label: "KYC", icon: Shield, href: "/dashboard/setup/kyc" },
  { id: "center", label: "Center details", icon: Building2, href: "/dashboard/setup/center" },
  { id: "ratelist", label: "Ratelist", icon: ClipboardList, active: true, href: "/dashboard/setup/ratelist" },
  { id: "letterhead", label: "Letterhead", icon: FileText, href: "/dashboard/setup/letterhead" },
  { id: "review", label: "Google review", icon: Mail, href: "/dashboard/setup/review" },
  { id: "panels", label: "Panels", icon: ClipboardList, href: "/dashboard/setup/panels" }
];

export default function ModalityRatelistPage() {
  const params = useParams();
  const router = useRouter();
  const modality = decodeURIComponent(params.modality as string || "LAB");

  const [tests, setTests] = useState<CatalogTest[]>([]);
  const [searchText, setSearchText] = useState("");
  const [bulkPercent, setBulkPercent] = useState("");
  const [activeTab, setActiveTab] = useState<"active" | "inactive">("active");
  const [selectedSubFilter, setSelectedSubFilter] = useState<"all" | "Test" | "Package" | "Panel" | "Bill only">("all");

  // Edit test name inline modal/states
  const [editingTestIdx, setEditingTestIdx] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  // Add new test modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTestName, setNewTestName] = useState("");
  const [newTestFee, setNewTestFee] = useState("");
  const [newTestGender, setNewTestGender] = useState<"Both" | "Male" | "Female">("Both");
  const [newTestEntryType, setNewTestEntryType] = useState<"Test" | "Package" | "Panel" | "Bill only">("Test");

  const [toast, setToast] = useState<{ type: "success" | "danger"; msg: string } | null>(null);

  const showToast = (type: "success" | "danger", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  // Load ratelist from localStorage or default
  useEffect(() => {
    const saved = localStorage.getItem("medilab_ratelist");
    let fullDb: Record<string, CatalogTest[]> = {};
    if (saved) {
      try {
        fullDb = JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved ratelist", e);
      }
    }
    
    if (!fullDb[modality]) {
      fullDb[modality] = JSON.parse(JSON.stringify(DEFAULT_TESTS_DATABASE[modality] || []));
      const allSaved = saved ? JSON.parse(saved) : {};
      allSaved[modality] = fullDb[modality];
      localStorage.setItem("medilab_ratelist", JSON.stringify(allSaved));
    }
    
    setTests(fullDb[modality]);
  }, [modality]);

  const saveList = (updatedTests: CatalogTest[]) => {
    const saved = localStorage.getItem("medilab_ratelist");
    const allSaved = saved ? JSON.parse(saved) : {};
    allSaved[modality] = updatedTests;
    localStorage.setItem("medilab_ratelist", JSON.stringify(allSaved));
    setTests(updatedTests);
  };

  const handlePriceChange = (index: number, val: string) => {
    const updated = [...tests];
    updated[index].price = Number(val) || 0;
    saveList(updated);
  };

  const handleRevenueShareChange = (index: number, val: string) => {
    const updated = [...tests];
    updated[index].revenue_share = Number(val) || 0;
    saveList(updated);
  };

  const handleGenderChange = (index: number, val: "Both" | "Male" | "Female") => {
    const updated = [...tests];
    updated[index].gender = val;
    saveList(updated);
  };

  const toggleTestActiveState = (index: number) => {
    const updated = [...tests];
    const item = updated[index];
    item.active = item.active === false ? true : false;
    saveList(updated);
    showToast("success", `${item.name} moved to ${item.active ? "Active" : "Inactive"}.`);
  };

  const handleBulkUpdateRevenue = () => {
    const percent = Number(bulkPercent);
    if (isNaN(percent) || percent < 0 || percent > 100) {
      showToast("danger", "Please enter a valid percentage between 0 and 100.");
      return;
    }
    const updated = tests.map(t => ({
      ...t,
      revenue_share: Math.round(t.price * percent / 100)
    }));
    saveList(updated);
    showToast("success", `Updated all revenue shares to ${percent}% of fees.`);
    setBulkPercent("");
  };

  const handleAddNewTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestName.trim()) {
      showToast("danger", "Test name is required.");
      return;
    }
    const fee = Number(newTestFee);
    if (isNaN(fee) || fee <= 0) {
      showToast("danger", "Please enter a valid fee.");
      return;
    }

    const newTest: CatalogTest = {
      name: newTestName.trim(),
      price: fee,
      category: modality,
      revenue_share: 0,
      gender: newTestGender,
      active: true,
      entry_type: newTestEntryType
    };

    if (tests.some(t => t.name.toLowerCase() === newTest.name.toLowerCase())) {
      showToast("danger", "A test with this name already exists in this ratelist.");
      return;
    }

    const updated = [...tests, newTest];
    saveList(updated);
    setShowAddModal(false);
    setNewTestName("");
    setNewTestFee("");
    setNewTestGender("Both");
    setNewTestEntryType("Test");
    showToast("success", `Added "${newTest.name}" to ratelist.`);
  };

  const handleStartRename = (index: number) => {
    setEditingTestIdx(index);
    setEditingName(tests[index].name);
  };

  const handleSaveRename = () => {
    if (editingTestIdx === null) return;
    if (!editingName.trim()) {
      showToast("danger", "Test name cannot be empty.");
      return;
    }
    const updated = [...tests];
    updated[editingTestIdx].name = editingName.trim();
    saveList(updated);
    setEditingTestIdx(null);
    showToast("success", "Renamed successfully.");
  };

  const handleDownloadCSV = () => {
    const headers = ["Name", "Category", "Fee", "Revenue Share", "Gender", "Status"];
    const rows = tests.map(t => [
      t.name,
      t.category,
      t.price,
      t.revenue_share || 0,
      t.gender || "Both",
      t.active === false ? "Inactive" : "Active"
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${modality.toLowerCase()}_ratelist.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter based on search query, Active/Inactive tab, and entry_type sub-filter
  const filtered = tests.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchText.toLowerCase());
    const isActive = t.active !== false;
    const matchesTab = activeTab === "active" ? isActive : !isActive;
    
    let matchesSubFilter = true;
    if (selectedSubFilter !== "all") {
      const type = t.entry_type || "Test";
      matchesSubFilter = type === selectedSubFilter;
    }
    
    return matchesSearch && matchesTab && matchesSubFilter;
  });

  const activeCount = tests.filter(t => t.active !== false).length;
  const inactiveCount = tests.filter(t => t.active === false).length;

  return (
    <div className="flex bg-white dark:bg-darkCard rounded-2xl border border-slate-200 dark:border-darkBorders shadow-sm min-h-[calc(100vh-8rem)] overflow-hidden text-xs text-slate-700 dark:text-slate-300">
      
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white font-medium text-xs ${
          toast.type === "success" ? "bg-success" : "bg-danger"
        }`}>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Left Sidebar Setup Guide (Navy theme matching mockup) */}
      <div className="w-64 bg-[#0A2540] text-slate-300 p-5 flex flex-col justify-between border-r border-[#081e33] shrink-0 font-semibold">
        <div className="space-y-6">
          <h2 className="text-base font-extrabold text-white tracking-tight border-b border-slate-750 pb-3">Setup Guide</h2>
          <nav className="space-y-1 text-xs">
            {SETUP_STEPS.map(step => (
              <div 
                key={step.id} 
                onClick={() => router.push(step.href)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                  step.active 
                    ? "bg-[#1A3149] text-white font-extrabold" 
                    : "hover:bg-[#122b44] hover:text-white"
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <step.icon className={`h-4 w-4 ${step.active ? "text-emerald-400" : "text-slate-400"}`} />
                  <span>{step.label}</span>
                </div>
                <ChevronRight className="h-3 w-3 opacity-60" />
              </div>
            ))}
          </nav>
        </div>

        <div className="space-y-3 pt-6 border-t border-[#122b44] text-[10px] font-black uppercase tracking-wider">
          <button 
            type="button" 
            onClick={() => router.push("/dashboard")}
            className="w-full py-2 border border-slate-700 hover:bg-[#122b44] text-white rounded-lg text-center font-bold"
          >
            Skip setup &raquo;
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button 
              type="button" 
              onClick={() => router.push("/dashboard/setup/ratelist")} 
              className="py-2 border border-slate-700 hover:bg-[#122b44] text-center rounded-lg text-slate-400 font-bold"
            >
              &lt; Prev
            </button>
            <button 
              type="button" 
              className="py-2 border border-slate-700 hover:bg-[#122b44] text-center rounded-lg text-slate-400 font-bold"
            >
              Next &gt;
            </button>
          </div>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-grow p-6 bg-slate-50/20 dark:bg-slate-900/10 overflow-y-auto space-y-4">
        
        {/* Breadcrumb */}
        <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
          <button onClick={() => router.push("/dashboard/setup/ratelist")} className="hover:text-slate-650 transition-colors">Ratelist</button>
          <span>/</span>
          <span className="text-[#00A770] font-black">{modality} Ratelist</span>
        </div>

        {/* Title */}
        <h1 className="text-xl font-extrabold text-slate-800 dark:text-white capitalize leading-none pb-2">{modality.toLowerCase()} ratelist</h1>

        {/* Toolbar & Filters (Matching mockup grid layout exactly) */}
        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-darkCard p-3.5 rounded-xl border border-slate-200 dark:border-darkBorders shadow-sm">
          
          {/* Search box */}
          <div className="relative w-56">
            <input 
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search tests..."
              className="pl-8 pr-3 w-full h-8.5 rounded-lg border border-slate-250 dark:border-darkBorders bg-transparent text-xs focus:outline-none focus:border-blue-500"
            />
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          </div>

          {/* Bulk Update Controls */}
          <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            <span>Bulk update revenue share by percentage:</span>
            <div className="flex rounded-lg border border-slate-250 overflow-hidden h-8.5 w-16 bg-white dark:bg-slate-900">
              <input 
                type="number"
                value={bulkPercent}
                onChange={(e) => setBulkPercent(e.target.value)}
                placeholder="0"
                className="px-1.5 w-full text-xs text-center focus:outline-none font-bold"
              />
              <span className="px-2 bg-slate-50 border-l border-slate-200 flex items-center text-xs text-slate-400 font-bold">%</span>
            </div>
            <button
              onClick={handleBulkUpdateRevenue}
              className="px-3 h-8.5 border border-slate-250 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg transition-all"
            >
              Update all
            </button>
          </div>

          {/* Download CSV */}
          <button 
            onClick={handleDownloadCSV}
            className="px-3 h-8.5 bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download CSV</span>
          </button>

          {/* Spacer */}
          <div className="flex-grow" />

          {/* Add New & printer options */}
          <div className="flex items-center space-x-1.5">
            <button 
              onClick={() => {
                setNewTestName("");
                setNewTestFee("");
                setNewTestGender("Both");
                setNewTestEntryType("Test");
                setShowAddModal(true);
              }}
              className="px-3.5 h-8.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add New</span>
            </button>

            {/* Three dot button */}
            <button 
              onClick={() => alert("Bill-only configuration options coming soon!")}
              className="p-2 border border-slate-250 hover:bg-slate-50 rounded-lg"
              title="More actions"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>

            <button 
              onClick={() => window.print()}
              className="px-3 h-8.5 bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print ratelist</span>
            </button>
          </div>
        </div>

        {/* Cyan Banner Note (Mockup styled info banner) */}
        <div className="p-3 bg-cyan-50 border border-cyan-100 rounded-xl flex items-center space-x-2 text-[10.5px] text-cyan-800 font-bold leading-normal">
          <AlertCircle className="h-4 w-4 text-cyan-600 shrink-0" />
          <span>Note: Bill-only entries can be added from the three-dot menu beside the add new option.</span>
        </div>

        {/* Pink Banner warning */}
        <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center space-x-2 text-[10.5px] text-rose-700 font-bold leading-normal">
          <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
          <span>Use <kbd className="px-1.5 py-0.5 bg-white border border-rose-200 rounded font-black shadow-sm text-rose-800">TAB</kbd> button to change the rates one by one.</span>
        </div>

        {/* Active / Inactive Tabs */}
        <div className="flex border-b border-slate-200 dark:border-darkBorders">
          <button
            onClick={() => setActiveTab("active")}
            className={`pb-2 px-4 font-bold text-xs uppercase border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === "active"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-slate-400 hover:text-slate-650"
            }`}
          >
            <span>Active</span>
            <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full text-[9px] font-black">{activeCount}</span>
          </button>
          
          <button
            onClick={() => setActiveTab("inactive")}
            className={`pb-2 px-4 font-bold text-xs uppercase border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === "inactive"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-slate-400 hover:text-slate-650"
            }`}
          >
            <span>Inactive</span>
            <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full text-[9px] font-black">{inactiveCount}</span>
          </button>
        </div>

        {/* Sub-Filters Row (Pills filtering entry_type) */}
        <div className="flex items-center space-x-2 pb-1.5">
          <span className="text-slate-400 font-bold select-none pr-1">Filter:</span>
          {[
            { id: "all", label: "All items" },
            { id: "Test", label: "Tests" },
            { id: "Package", label: "Packages" },
            { id: "Panel", label: "Panels" },
            { id: "Bill only", label: "Bill only" }
          ].map(pill => (
            <button
              key={pill.id}
              onClick={() => setSelectedSubFilter(pill.id as any)}
              className={`px-3 py-1 rounded-full text-[10.5px] font-bold border transition-colors ${
                selectedSubFilter === pill.id
                  ? "bg-slate-800 border-slate-800 text-white"
                  : "border-slate-200 bg-white hover:bg-slate-50 text-slate-650"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Table list */}
        <div className="bg-white dark:bg-darkCard rounded-xl border border-slate-200 dark:border-darkBorders shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs font-semibold text-slate-650 dark:text-slate-350 divide-y divide-slate-150 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-800/40 text-[10.5px] text-slate-405 dark:text-slate-500 uppercase font-black tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Name</th>
                <th className="p-3.5 w-32">Entry Type</th>
                <th className="p-3.5 w-32">Fee (Rs.)</th>
                <th className="p-3.5 w-44">Revenue Share Amount</th>
                <th className="p-3.5 w-36">For Gender</th>
                <th className="p-3.5 w-28 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-bold">No investigations match selected filters.</td>
                </tr>
              ) : (
                filtered.map((test, index) => {
                  const masterIdx = tests.findIndex(t => t.name === test.name);
                  const entryType = test.entry_type || "Test";
                  return (
                    <tr key={test.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      
                      {/* Name rename field */}
                      <td className="p-3.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-extrabold text-slate-800 dark:text-white text-xs">{test.name}</span>
                          <button 
                            onClick={() => handleStartRename(masterIdx)}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                            title="Rename"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>

                      {/* Entry Type label */}
                      <td className="p-3.5 text-slate-450 dark:text-slate-400 font-bold">
                        <span>{entryType} ***</span>
                      </td>

                      {/* Fee input */}
                      <td className="p-3.5">
                        <input
                          type="number"
                          value={test.price}
                          onChange={(e) => handlePriceChange(masterIdx, e.target.value)}
                          className="px-3 py-1.5 w-24 border border-slate-250 dark:border-darkBorders bg-white dark:bg-slate-900 rounded-lg text-xs font-extrabold focus:outline-none focus:border-blue-500 shadow-sm"
                        />
                      </td>

                      {/* Revenue share */}
                      <td className="p-3.5">
                        <input
                          type="number"
                          value={test.revenue_share || 0}
                          onChange={(e) => handleRevenueShareChange(masterIdx, e.target.value)}
                          className="px-3 py-1.5 w-28 border border-slate-250 dark:border-darkBorders bg-white dark:bg-slate-900 rounded-lg text-xs font-bold focus:outline-none focus:border-blue-500 shadow-sm"
                        />
                      </td>

                      {/* Gender selectivity */}
                      <td className="p-3.5">
                        <select
                          value={test.gender || "Both"}
                          onChange={(e) => handleGenderChange(masterIdx, e.target.value as any)}
                          className="px-2 py-1.5 w-32 border border-slate-250 dark:border-darkBorders bg-white dark:bg-slate-900 rounded-lg text-xs font-bold focus:outline-none focus:border-blue-500 shadow-sm"
                        >
                          <option value="Both">Both</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </td>

                      {/* Delete status toggle */}
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => toggleTestActiveState(masterIdx)}
                          className={`text-[10px] font-black uppercase tracking-wider flex items-center space-x-1 justify-end ml-auto ${
                            activeTab === "active" ? "text-red-500 hover:text-red-750" : "text-emerald-500 hover:text-emerald-705"
                          }`}
                        >
                          <span>{activeTab === "active" ? "⊗ Remove" : "⊗ Restore"}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Rename Test Modal */}
      {editingTestIdx !== null && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-2xl max-w-md w-full space-y-5 animate-in zoom-in-95 duration-200 text-slate-700">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-xs uppercase tracking-widest text-[#062A22]">Rename investigation</h3>
              <button onClick={() => setEditingTestIdx(null)} className="text-slate-400 hover:text-slate-650">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-450 uppercase font-black mb-1">* Test Name</label>
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="px-3 w-full h-10 rounded-xl border border-slate-200 bg-transparent text-xs focus:outline-none focus:border-[#00A770] font-bold text-slate-800"
                  placeholder="Enter test name"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2 text-[10px] font-black uppercase tracking-wider">
                <button 
                  type="button"
                  onClick={() => setEditingTestIdx(null)}
                  className="px-4.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveRename}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md font-bold"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Test Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-2xl max-w-xl w-full space-y-5 animate-in zoom-in-95 duration-200 text-slate-700">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-xs uppercase tracking-widest text-[#062A22]">Add new {modality} investigation</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-655">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            <form onSubmit={handleAddNewTest} className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1">
                  <label className="block text-[10px] text-slate-455 uppercase font-black mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={newTestName}
                    onChange={(e) => setNewTestName(e.target.value)}
                    className="px-3 w-full h-10 rounded-xl border border-slate-200 bg-transparent text-xs focus:outline-none focus:border-[#00A770]"
                    placeholder="Enter test name"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] text-slate-455 uppercase font-black mb-1">* Fee</label>
                  <input
                    type="number"
                    required
                    value={newTestFee}
                    onChange={(e) => setNewTestFee(e.target.value)}
                    className="px-3 w-full h-10 rounded-xl border border-slate-200 bg-transparent text-xs focus:outline-none focus:border-[#00A770]"
                    placeholder="Enter fee amount"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] text-slate-455 uppercase font-black mb-1">For gender</label>
                  <select
                    value={newTestGender}
                    onChange={(e) => setNewTestGender(e.target.value as any)}
                    className="px-3 w-full h-10 rounded-xl border border-slate-200 bg-transparent text-xs focus:outline-none focus:border-[#00A770]"
                  >
                    <option value="Both">Both</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] text-slate-455 uppercase font-black mb-1">Entry Type</label>
                  <select
                    value={newTestEntryType}
                    onChange={(e) => setNewTestEntryType(e.target.value as any)}
                    className="px-3 w-full h-10 rounded-xl border border-slate-200 bg-transparent text-xs focus:outline-none focus:border-[#00A770]"
                  >
                    <option value="Test">Test</option>
                    <option value="Package">Package</option>
                    <option value="Panel">Panel</option>
                    <option value="Bill only">Bill only</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-start pt-2 text-[10px] font-black uppercase tracking-wider">
                <button 
                  type="submit"
                  className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md font-bold"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
