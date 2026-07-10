"use client";

import React, { useEffect, useState } from "react";
import { getTests, updateTestPayment } from "../../../../services/data";
import { Test } from "../../../../types/index";
import { 
  ChevronRight, ChevronDown, Search, X, Loader2, 
  Printer, FileText, CheckCircle2, AlertTriangle, 
  Calendar, CreditCard, Ban, MoreVertical, Edit2, ShieldAlert, Plus
} from "lucide-react";
import Link from "next/link";

interface BillGroup {
  invoice_number: string;
  patient_id: number;
  patient_name: string;
  patient_phone: string;
  referral_doctor_name: string;
  created_at: string;
  total: number;
  paid: number;
  discount: number;
  status: string;
  payment_method: string;
  collection_centre: string;
  collection_agent: string;
  tests: Array<{ id: number; test_name: string; price: number; status: string }>;
}

export default function AllBillsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Expandable rows state
  const [expandedInvoices, setExpandedInvoices] = useState<Record<string, boolean>>({});

  // Dropdowns actions state
  const [activeMenuInvoice, setActiveMenuInvoice] = useState<string | null>(null);

  // Edit/Modify Modal State
  const [editingBill, setEditingBill] = useState<BillGroup | null>(null);
  const [editPatientName, setEditPatientName] = useState("");
  const [editReferredBy, setEditReferredBy] = useState("");
  const [editAgent, setEditAgent] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Premium dialogue box modal state
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm?: () => void;
    isConfirm: boolean;
  }>({
    isOpen: false,
    title: "",
    message: "",
    isConfirm: false
  });

  // Filter States
  const [duration, setDuration] = useState("7");
  const [regNo, setRegNo] = useState("");
  const [patientName, setPatientName] = useState("");
  const [referredBy, setReferredBy] = useState("");
  const [collectionCentre, setCollectionCentre] = useState("");
  const [collectionAgent, setCollectionAgent] = useState(""); // Filter by collection agent
  const [hasDue, setHasDue] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  // Grouped Bills
  const [bills, setBills] = useState<BillGroup[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getTests();
      setTests(data);
      groupTestsIntoBills(data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch bill invoices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const groupTestsIntoBills = (rawTests: Test[]) => {
    const billsMap: Record<string, BillGroup> = {};

    rawTests.forEach((t) => {
      if (!billsMap[t.invoice_number]) {
        billsMap[t.invoice_number] = {
          invoice_number: t.invoice_number,
          patient_id: t.patient_id,
          patient_name: t.patient_name || "Unknown",
          patient_phone: t.patient_phone || "",
          referral_doctor_name: t.referral_doctor_name || "Self",
          created_at: t.created_at,
          total: 0,
          paid: 0,
          discount: 0,
          status: "No due",
          payment_method: t.payment_method || "Cash",
          collection_centre: t.collection_centre || "Main",
          collection_agent: t.collection_agent || "Reddy",
          tests: []
        };
      }
      const bill = billsMap[t.invoice_number];
      bill.total += t.price;
      bill.paid += t.amount_received;
      bill.discount += t.discount;
      bill.tests.push({
        id: t.id,
        test_name: t.test_name,
        price: t.price,
        status: t.status
      });

      // Status resolution hierarchy: Canceled < Has due < No due
      if (t.status === "Has due") {
        bill.status = "Has due";
      } else if (t.status === "Canceled" && bill.status !== "Has due") {
        bill.status = "Canceled";
      } else if (t.status === "No due" && bill.status !== "Has due") {
        bill.status = "No due";
      }
    });

    const sortedBills = Object.values(billsMap).sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      if (dateA !== dateB) return dateB - dateA;
      return b.invoice_number.localeCompare(a.invoice_number);
    });
    setBills(sortedBills);
  };

  const toggleRowExpand = (invoiceNumber: string) => {
    setExpandedInvoices(prev => ({
      ...prev,
      [invoiceNumber]: !prev[invoiceNumber]
    }));
  };

  const handleClearFilters = () => {
    setDuration("7");
    setRegNo("");
    setPatientName("");
    setReferredBy("");
    setCollectionCentre("");
    setCollectionAgent("");
    setHasDue(false);
    setCancelled(false);
    groupTestsIntoBills(tests);
  };

  const handleSearch = () => {
    let filtered = [...tests];

    if (duration !== "all") {
      const days = Number(duration);
      const cutOffDate = new Date();
      cutOffDate.setDate(cutOffDate.getDate() - days);
      filtered = filtered.filter(t => new Date(t.created_at) >= cutOffDate);
    }

    if (regNo.trim()) {
      filtered = filtered.filter(t => t.invoice_number.toLowerCase().includes(regNo.toLowerCase()));
    }

    if (patientName.trim()) {
      filtered = filtered.filter(t => t.patient_name?.toLowerCase().includes(patientName.toLowerCase()));
    }

    if (referredBy.trim()) {
      filtered = filtered.filter(t => t.referral_doctor_name?.toLowerCase().includes(referredBy.toLowerCase()));
    }

    if (collectionCentre) {
      filtered = filtered.filter(t => t.collection_centre?.toLowerCase() === collectionCentre.toLowerCase());
    }

    if (collectionAgent) {
      filtered = filtered.filter(t => t.collection_agent?.toLowerCase() === collectionAgent.toLowerCase());
    }

    if (hasDue) {
      filtered = filtered.filter(t => t.balance_due > 0 && t.status !== "Canceled");
    }

    if (cancelled) {
      filtered = filtered.filter(t => t.status === "Canceled");
    }

    groupTestsIntoBills(filtered);
  };

  // Cancel bill operation
  const handleCancelBill = (invoiceNumber: string, billTests: Array<{ id: number }>) => {
    setActiveMenuInvoice(null);
    setModalConfig({
      isOpen: true,
      title: "Cancel Bill Confirmation",
      message: `Are you sure you want to cancel bill ${invoiceNumber}? This action will cancel all associated laboratory test orders.`,
      isConfirm: true,
      onConfirm: async () => {
        try {
          for (const t of billTests) {
            await updateTestPayment(t.id, "Canceled");
          }
          loadData();
        } catch (err) {
          console.error(err);
          setTimeout(() => {
            setModalConfig({
              isOpen: true,
              title: "Error",
              message: "Failed to cancel bill. Please check your backend connection.",
              isConfirm: false
            });
          }, 100);
        }
      }
    });
  };

  // Open Edit Modal
  const openEditModal = (bill: BillGroup) => {
    setEditingBill(bill);
    setEditPatientName(bill.patient_name);
    setEditReferredBy(bill.referral_doctor_name);
    setEditAgent(bill.collection_agent);
    setActiveMenuInvoice(null);
  };

  // Save Edit Modifications (Saves/mocks updates)
  const handleSaveEdit = async () => {
    if (!editPatientName.trim()) return;
    setSavingEdit(true);
    // Mimic updating local patient profile name and metadata
    setTimeout(() => {
      setBills(prev => prev.map(b => {
        if (b.invoice_number === editingBill?.invoice_number) {
          return {
            ...b,
            patient_name: editPatientName,
            referral_doctor_name: editReferredBy,
            collection_agent: editAgent
          };
        }
        return b;
      }));
      setSavingEdit(false);
      setEditingBill(null);
    }, 800);
  };

  const formatDateTime = (dateString: string) => {
    const d = new Date(dateString);
    const dateStr = d.toLocaleDateString("en-GB"); // DD/MM/YYYY
    const timeStr = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    return { dateStr, timeStr };
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">All bills</h1>
          <p className="text-[10px] text-mutedText">Manage patient invoices, payment status, and diagnostic test records</p>
        </div>
        <Link
          href="/dashboard/cases/bills/new"
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-1.5"
        >
          <Plus className="h-4 w-4" />
          <span>New Bill</span>
        </Link>
      </div>

      {/* Advanced Filters Block */}
      <div className="bg-white dark:bg-darkCard p-6 rounded-xl border border-borders dark:border-darkBorders shadow-sm text-xs font-semibold space-y-4">
        
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          
          {/* Duration */}
          <div>
            <label className="block text-[10px] text-slate-500 mb-1">Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="px-3 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-xs focus:outline-none"
            >
              <option value="7">Past 7 days</option>
              <option value="30">Past 30 days</option>
              <option value="all">All time</option>
            </select>
          </div>

          {/* Reg No */}
          <div>
            <label className="block text-[10px] text-slate-500 mb-1">Reg. no.</label>
            <input
              type="text"
              value={regNo}
              onChange={(e) => setRegNo(e.target.value)}
              className="px-3 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-xs focus:outline-none"
              placeholder="e.g. 1005"
            />
          </div>

          {/* Patient Name */}
          <div>
            <label className="block text-[10px] text-slate-500 mb-1">Patient name</label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="px-3 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-xs focus:outline-none"
              placeholder="Patient first/last name"
            />
          </div>

          {/* Referred By */}
          <div>
            <label className="block text-[10px] text-slate-500 mb-1">Referred by</label>
            <input
              type="text"
              value={referredBy}
              onChange={(e) => setReferredBy(e.target.value)}
              className="px-3 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-xs focus:outline-none"
              placeholder="Doctor name"
            />
          </div>

          {/* Collection Centre */}
          <div>
            <label className="block text-[10px] text-slate-500 mb-1">Collection centre</label>
            <select
              value={collectionCentre}
              onChange={(e) => setCollectionCentre(e.target.value)}
              className="px-3 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-xs focus:outline-none"
            >
              <option value="">All centres</option>
              <option value="Main">Main Centre</option>
              <option value="Satellite A">Satellite Lab A</option>
            </select>
          </div>

          {/* Collection Agent filter dropdown */}
          <div>
            <label className="block text-[10px] text-slate-500 mb-1">Sample collection agent</label>
            <select
              value={collectionAgent}
              onChange={(e) => setCollectionAgent(e.target.value)}
              className="px-3 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-xs focus:outline-none"
            >
              <option value="">All agents</option>
              <option value="Reddy">Agent Reddy</option>
              <option value="Smith">Agent Smith</option>
              <option value="Self">Self Collected</option>
            </select>
          </div>

        </div>

        {/* Checkboxes & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-dashed border-borders dark:border-slate-800">
          
          <div className="flex items-center space-x-6">
            <label className="flex items-center space-x-2 cursor-pointer font-bold text-slate-700 dark:text-slate-350">
              <input
                type="checkbox"
                checked={hasDue}
                onChange={(e) => setHasDue(e.target.checked)}
                className="rounded border-borders text-primary focus:ring-primary"
              />
              <span>Has due</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer font-bold text-slate-700 dark:text-slate-350">
              <input
                type="checkbox"
                checked={cancelled}
                onChange={(e) => setCancelled(e.target.checked)}
                className="rounded border-borders text-primary focus:ring-primary"
              />
              <span>Cancelled</span>
            </label>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleSearch}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-all"
            >
              Search
            </button>
            <button
              onClick={handleClearFilters}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-borders dark:border-darkBorders font-bold rounded-lg transition-all"
            >
              Clear
            </button>
          </div>

        </div>

      </div>

      {/* Bills Data Table */}
      <div className="bg-white dark:bg-darkCard rounded-xl border border-borders dark:border-darkBorders shadow-sm overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-borders dark:border-darkBorders text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-10"></th>
                <th className="py-3 px-4">Reg. No.</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Referred By</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Discount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borders dark:divide-darkBorders">
              {bills.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-mutedText">
                    <FileText className="h-10 w-10 text-slate-200 dark:text-slate-800 mx-auto mb-2" />
                    <p className="font-semibold">No bills found</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Try altering the search filters above.</p>
                  </td>
                </tr>
              ) : (
                bills.map((bill) => {
                  const isExpanded = !!expandedInvoices[bill.invoice_number];
                  const { dateStr, timeStr } = formatDateTime(bill.created_at);
                  const isMenuOpen = activeMenuInvoice === bill.invoice_number;

                  return (
                    <React.Fragment key={bill.invoice_number}>
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors font-medium">
                        
                        {/* Toggle expand button */}
                        <td className="py-4 px-4 text-center">
                          <button 
                            onClick={() => toggleRowExpand(bill.invoice_number)}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-slate-500" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-slate-500" />
                            )}
                          </button>
                        </td>

                        {/* Invoice Number */}
                        <td className="py-4 px-4 font-bold text-slate-800 dark:text-white">
                          {bill.invoice_number.split("-").pop() || bill.invoice_number}
                        </td>
                        
                        {/* Date with Time underneath */}
                        <td className="py-4 px-4 text-slate-500 whitespace-nowrap">
                          <div>{dateStr}</div>
                          <div className="text-[9px] text-slate-400 mt-0.5">{timeStr}</div>
                        </td>
                        
                        {/* Patient */}
                        <td className="py-4 px-4">
                          <div className="font-bold text-slate-800 dark:text-white">{bill.patient_name}</div>
                          <div className="text-[10px] text-slate-400 flex items-center space-x-1.5 mt-0.5">
                            <span className="p-0.5 bg-slate-100 dark:bg-slate-800 text-[8px] font-bold text-slate-400 rounded">PH</span>
                            <span>{bill.patient_phone}</span>
                          </div>
                        </td>

                        {/* Referring Doctor */}
                        <td className="py-4 px-4 text-slate-655 font-semibold">{bill.referral_doctor_name}</td>
                        
                        {/* Financial Totals */}
                        <td className="py-4 px-4 text-right font-bold">Rs. {bill.total.toLocaleString()}</td>
                        <td className="py-4 px-4 text-right text-success font-bold">Rs. {bill.paid.toLocaleString()}</td>
                        <td className="py-4 px-4 text-right text-slate-500 font-semibold">Rs. {bill.discount}</td>

                        {/* Status Badge */}
                        <td className="py-4 px-4 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            bill.status === "No due" 
                              ? "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400"
                              : bill.status === "Canceled"
                              ? "bg-red-50 text-danger dark:bg-red-950/20 dark:text-red-400"
                              : "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/20 dark:text-yellow-400"
                          }`}>
                            {bill.status}
                          </span>
                        </td>

                        {/* Actions buttons & Dropdown */}
                        <td className="py-4 px-4 text-center">
                          <div className="flex justify-center items-center space-x-1 relative">
                            <Link
                              href={`/dashboard/cases/bills/${bill.invoice_number}`}
                              className="px-2.5 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold rounded dark:bg-blue-950/30 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
                            >
                              View bill
                            </Link>
                            
                            {/* ... Dropdown trigger */}
                            <button
                              onClick={() => setActiveMenuInvoice(isMenuOpen ? null : bill.invoice_number)}
                              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors text-slate-500"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>

                            {isMenuOpen && (
                              <div className="absolute right-0 top-8 w-36 bg-white dark:bg-darkCard border border-borders dark:border-darkBorders rounded-lg shadow-xl z-50 py-1 text-left">
                                <Link
                                  href={`/dashboard/cases/bills/${bill.invoice_number}/edit`}
                                  className="w-full px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-200 flex items-center space-x-1.5"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                  <span>Modify</span>
                                </Link>
                                
                                {bill.status !== "Canceled" && (
                                  <button
                                    onClick={() => handleCancelBill(bill.invoice_number, bill.tests)}
                                    className="w-full px-4 py-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-[10px] font-bold text-danger flex items-center space-x-1.5"
                                  >
                                    <Ban className="h-3.5 w-3.5" />
                                    <span>Cancel Bill</span>
                                  </button>
                                )}
                              </div>
                            )}

                          </div>
                        </td>

                      </tr>

                      {/* Expanded Row Detail */}
                      {isExpanded && (
                        <tr className="bg-slate-50/50 dark:bg-slate-900/10">
                          <td colSpan={10} className="py-3 px-8">
                            <div className="border-l-2 border-primary pl-4 py-2 space-y-2">
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Investigations details</div>
                              <div className="divide-y divide-borders dark:divide-darkBorders max-w-xl">
                                {bill.tests.map((test, tidx) => (
                                  <div key={test.id} className="flex justify-between items-center py-2 text-xs">
                                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                                      {tidx + 1}. {test.test_name}
                                    </div>
                                    <div className="flex items-center space-x-4">
                                      <span className="font-bold text-slate-655">Rs. {test.price.toLocaleString()}</span>
                                      <span className={`inline-flex px-1.5 py-0.25 rounded text-[8px] font-bold uppercase tracking-wider ${
                                        test.status === "No due" ? "bg-blue-100 text-blue-700" : test.status === "Canceled" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-750"
                                      }`}>
                                        {test.status}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="text-[9px] text-slate-400 mt-2">
                                CC: <strong>{bill.collection_centre}</strong> &bull; Agent: <strong>Agent {bill.collection_agent}</strong>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modify / Edit Popup Modal */}
      {editingBill && (
        <div className="fixed inset-0 z-60 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-darkCard p-6 rounded-xl border border-borders dark:border-darkBorders max-w-sm w-full shadow-2xl space-y-4 text-xs font-medium">
            
            <div className="flex justify-between items-center border-b border-borders dark:border-slate-800 pb-2">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Modify Case Information</h3>
              <button onClick={() => setEditingBill(null)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Patient Name</label>
                <input
                  type="text"
                  value={editPatientName}
                  onChange={(e) => setEditPatientName(e.target.value)}
                  className="px-3 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-xs focus:outline-none"
                  placeholder="Patient Name"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Referred By</label>
                <input
                  type="text"
                  value={editReferredBy}
                  onChange={(e) => setEditReferredBy(e.target.value)}
                  className="px-3 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-xs focus:outline-none"
                  placeholder="Doctor Name"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Collection Agent</label>
                <select
                  value={editAgent}
                  onChange={(e) => setEditAgent(e.target.value)}
                  className="px-3 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-xs focus:outline-none"
                >
                  <option value="Reddy">Agent Reddy</option>
                  <option value="Smith">Agent Smith</option>
                  <option value="Self">Self Collected</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="flex-grow py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center justify-center space-x-1"
              >
                {savingEdit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <span>Save Changes</span>}
              </button>
              <button
                onClick={() => setEditingBill(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 rounded-lg text-xs border border-borders dark:border-darkBorders font-bold"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}
      {/* Premium Dialogue Box Modal */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm transition-all duration-300 animate-fadeIn">
          <div className="bg-white dark:bg-darkCard border border-slate-100 dark:border-darkBorders rounded-2xl p-6 w-full max-w-sm shadow-[0_20px_50px_rgba(0,0,0,0.15)] transform scale-100 transition-all">
            <div className="flex items-center space-x-3 text-amber-500 mb-4">
              <ShieldAlert className="h-6 w-6 shrink-0" />
              <h3 className="text-base font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">{modalConfig.title}</h3>
            </div>
            
            <p className="text-xs font-semibold text-slate-650 dark:text-slate-350 leading-relaxed">
              {modalConfig.message}
            </p>

            <div className="mt-6 flex justify-end space-x-3 font-bold text-xs uppercase tracking-wider">
              {modalConfig.isConfirm && (
                <button
                  onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}
                  className="px-4 py-2.5 text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 rounded-lg transition-all"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={() => {
                  setModalConfig({ ...modalConfig, isOpen: false });
                  if (modalConfig.onConfirm) modalConfig.onConfirm();
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all"
              >
                {modalConfig.isConfirm ? "Confirm" : "Ok"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
