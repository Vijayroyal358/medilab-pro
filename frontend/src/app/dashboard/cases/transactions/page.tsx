"use client";

import React, { useEffect, useState } from "react";
import { getTests, getExpenses } from "../../../../services/data";
import { Test, Expense } from "../../../../types/index";
import { 
  Search, X, Loader2, FileText, ArrowUpRight, 
  ArrowDownRight, Landmark, Calendar, RefreshCw,
  Printer, Mail, ArrowLeft, ArrowRight, ChevronDown, 
  Plus, CheckCircle2, AlertCircle, TrendingUp, DollarSign,
  Briefcase, Activity, CalendarDays
} from "lucide-react";
import Link from "next/link";

interface TransactionRow {
  id: number;
  reg_no: string;
  patient_name: string;
  referred_by: string;
  date: string;
  time: string;
  dcn: string;
  cc: string;
  amount: number;
  is_positive: boolean;
  method: string;
  received_by: string;
  invoice_number: string;
}

export default function DailyBusinessPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Daily Business Date Picker
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date("2026-07-01"));
  
  // Navigation / Search states
  const [activeSubTab, setActiveSubTab] = useState<"transactions" | "bills" | "expenses">("transactions");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal states
  const [cashierModalOpen, setCashierModalOpen] = useState(false);
  const [cashierName, setCashierName] = useState("");
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [monthlyModalOpen, setMonthlyModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [testsData, expensesData] = await Promise.all([
        getTests(),
        getExpenses()
      ]);
      setTests(testsData);
      setExpenses(expensesData);
    } catch (err: any) {
      console.error(err);
      setError("Failed to compile dynamic daily business transactions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Format Date for Date Picker display: e.g. "01/07/2026"
  const formatDateString = (d: Date) => {
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const incrementDate = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  const decrementDate = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  // Compile Transactions for the Selected Date
  const getDailyTransactions = () => {
    const rows: TransactionRow[] = [];
    tests.forEach((t) => {
      const testDate = new Date(t.created_at);
      if (
        testDate.getDate() !== selectedDate.getDate() ||
        testDate.getMonth() !== selectedDate.getMonth() ||
        testDate.getFullYear() !== selectedDate.getFullYear()
      ) {
        return;
      }

      const dateStr = testDate.toLocaleDateString("en-GB");
      const timeStr = testDate.toLocaleTimeString("en-US", { 
        hour: "2-digit", 
        minute: "2-digit",
        hour12: true 
      });

      const numPart = t.invoice_number.split("-").pop() || "1000";
      const regNo = `#${numPart}`;
      const modInitial = t.modality ? t.modality.charAt(0).toUpperCase() : "C";
      const dcn = `${modInitial}${1 + (t.id % 4)}`;

      // 1. Positive Amount transaction (Collections received)
      if (t.amount_received > 0 && t.status !== "Canceled") {
        rows.push({
          id: 31943000 + t.id * 10,
          reg_no: regNo,
          patient_name: t.patient_name || "Unknown",
          referred_by: t.referral_doctor_name || "Self",
          date: dateStr,
          time: timeStr,
          dcn: dcn,
          cc: t.collection_centre || "Main",
          amount: t.amount_received,
          is_positive: true,
          method: t.payment_method || "Cash",
          received_by: t.collection_agent || "Reddy",
          invoice_number: t.invoice_number
        });
      }

      // 2. Negative Amount transaction (Outstanding due amounts shown as debit)
      if (t.balance_due > 0 && t.status !== "Canceled") {
        rows.push({
          id: 31943000 + t.id * 10 + 1,
          reg_no: regNo,
          patient_name: t.patient_name || "Unknown",
          referred_by: t.referral_doctor_name || "Self",
          date: dateStr,
          time: timeStr,
          dcn: dcn,
          cc: t.collection_centre || "Main",
          amount: t.balance_due,
          is_positive: false,
          method: t.payment_method || "Cash",
          received_by: t.collection_agent || "Reddy",
          invoice_number: t.invoice_number
        });
      }
    });

    // Sort descending
    return rows.sort((a, b) => b.id - a.id);
  };

  // Compile Bills for the Selected Date
  const getDailyBills = () => {
    return tests.filter((t) => {
      const testDate = new Date(t.created_at);
      return (
        testDate.getDate() === selectedDate.getDate() &&
        testDate.getMonth() === selectedDate.getMonth() &&
        testDate.getFullYear() === selectedDate.getFullYear()
      );
    });
  };

  // Compile Expenses for the Selected Date
  const getDailyExpenses = () => {
    return expenses.filter((e) => {
      const expDate = new Date(e.created_at);
      return (
        expDate.getDate() === selectedDate.getDate() &&
        expDate.getMonth() === selectedDate.getMonth() &&
        expDate.getFullYear() === selectedDate.getFullYear()
      );
    });
  };

  const dailyTrans = getDailyTransactions();
  const dailyBills = getDailyBills();
  const dailyExps = getDailyExpenses();

  // Metrics Calculations
  const totalIncome = dailyTrans
    .filter(r => r.is_positive)
    .reduce((sum, r) => sum + r.amount, 0);

  const totalExpenses = dailyExps.reduce((sum, e) => sum + e.amount, 0);
  const totalCollectionCharge = 0; // Mock or calculated commission charges
  const netIncome = totalIncome + totalCollectionCharge - totalExpenses;

  // Split calculations
  const splitCash = dailyTrans
    .filter(r => r.is_positive && r.method?.toLowerCase() === "cash")
    .reduce((sum, r) => sum + r.amount, 0);

  const splitCard = dailyTrans
    .filter(r => r.is_positive && (r.method?.toLowerCase() === "card" || r.method?.toLowerCase() === "credit card"))
    .reduce((sum, r) => sum + r.amount, 0);

  const splitUPI = dailyTrans
    .filter(r => r.is_positive && r.method?.toLowerCase() === "upi")
    .reduce((sum, r) => sum + r.amount, 0);

  const splitInsurance = dailyTrans
    .filter(r => r.is_positive && r.method?.toLowerCase() === "insurance")
    .reduce((sum, r) => sum + r.amount, 0);

  // Search filter implementation
  const filterTransactions = () => {
    if (!searchQuery) return dailyTrans;
    const query = searchQuery.toLowerCase();
    return dailyTrans.filter(
      r => 
        r.patient_name.toLowerCase().includes(query) ||
        r.reg_no.toLowerCase().includes(query) ||
        r.referred_by.toLowerCase().includes(query) ||
        r.method.toLowerCase().includes(query)
    );
  };

  const filterBills = () => {
    if (!searchQuery) return dailyBills;
    const query = searchQuery.toLowerCase();
    return dailyBills.filter(
      b => 
        b.patient_name?.toLowerCase().includes(query) ||
        b.invoice_number?.toLowerCase().includes(query) ||
        b.referral_doctor_name?.toLowerCase().includes(query)
    );
  };

  const filterExpenses = () => {
    if (!searchQuery) return dailyExps;
    const query = searchQuery.toLowerCase();
    return dailyExps.filter(
      e => 
        e.description.toLowerCase().includes(query) ||
        e.category.toLowerCase().includes(query)
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAddCashier = (e: React.FormEvent) => {
    e.preventDefault();
    if (cashierName.trim()) {
      alert(`Cashier "${cashierName}" added to diagnostic desk billing registry.`);
      setCashierName("");
      setCashierModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#00A770]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 text-xs font-semibold text-slate-650 dark:text-slate-350">
      
      {/* Page Title & Control actions bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-white">Daily business</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Real-time collections & ledger settlement controls</p>
        </div>

        {/* Buttons group */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-wider">
          <button 
            onClick={() => setReportModalOpen(true)}
            className="px-3.5 py-2 border border-slate-200 dark:border-darkBorders hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-750 flex items-center space-x-1"
          >
            <FileText className="h-3.5 w-3.5 text-[#00A770]" />
            <span>Business Report</span>
          </button>
          
          <button 
            onClick={() => setMonthlyModalOpen(true)}
            className="px-3.5 py-2 border border-slate-200 dark:border-darkBorders hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-755 flex items-center space-x-1"
          >
            <TrendingUp className="h-3.5 w-3.5 text-[#00A770]" />
            <span>Monthly Overview (BETA)</span>
          </button>

          <button 
            onClick={handlePrint}
            className="px-3.5 py-2 border border-slate-200 dark:border-darkBorders hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-755 flex items-center space-x-1"
          >
            <Printer className="h-3.5 w-3.5 text-slate-400" />
            <span>Print</span>
          </button>

          <button 
            onClick={() => alert("Daily business report queued for recipient email dispatch.")}
            className="px-3.5 py-2 border border-slate-200 dark:border-darkBorders hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-755 flex items-center space-x-1"
          >
            <Mail className="h-3.5 w-3.5 text-slate-400" />
            <span>Email</span>
          </button>
        </div>
      </div>

      {/* Date Switcher row */}
      <div className="bg-white dark:bg-darkCard rounded-2xl border border-slate-150 p-4 flex items-center space-x-2 shadow-sm shrink-0 w-fit">
        <button 
          onClick={decrementDate}
          className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </button>
        
        <div className="flex items-center space-x-2 px-3 py-1 bg-slate-50 rounded-lg border border-slate-150">
          <Calendar className="h-4 w-4 text-[#00A770]" />
          <span className="font-black text-xs font-mono text-slate-800">{formatDateString(selectedDate)}</span>
        </div>

        <button 
          onClick={incrementDate}
          className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-all"
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Financial calculations strip (Total Income + Commission - Expenses = Net Income) */}
      <div className="bg-white dark:bg-darkCard rounded-2xl border border-slate-150 p-6 shadow-sm">
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-slate-150">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full max-w-4xl text-xs font-bold text-slate-650">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Total Income</p>
              <h3 className="text-base font-black text-slate-800 dark:text-white mt-1">Rs. {totalIncome.toFixed(2)}</h3>
            </div>
            
            <div className="flex items-center space-x-1.5">
              <span className="text-lg text-slate-300 font-extrabold">+</span>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Total collection charge</p>
                <h3 className="text-base font-black text-slate-800 dark:text-white mt-1">Rs. {totalCollectionCharge.toFixed(2)}</h3>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="text-lg text-slate-300 font-extrabold">-</span>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Expenses</p>
                <h3 className="text-base font-black text-slate-800 dark:text-white mt-1">Rs. {totalExpenses.toFixed(2)}</h3>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="text-lg text-[#00A770] font-black">=</span>
              <div>
                <p className="text-[10px] text-[#00A770] uppercase tracking-widest font-black">Net Income</p>
                <h3 className="text-base font-black text-slate-800 dark:text-white mt-1">Rs. {netIncome.toFixed(2)}</h3>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 text-[#00A770] border border-emerald-100/50 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0">
            ✓ Today Status
          </div>
        </div>

        {/* Total Income Split row (Cash, Card, UPI, Insurance) */}
        <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-150/60">
            <span className="text-[9px] text-slate-450 uppercase font-black tracking-wider block mb-1">Cash Collection</span>
            <strong className="text-xs font-extrabold text-slate-800">Rs. {splitCash.toFixed(2)}</strong>
          </div>
          
          <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-150/60">
            <span className="text-[9px] text-slate-450 uppercase font-black tracking-wider block mb-1">Card Payments</span>
            <strong className="text-xs font-extrabold text-slate-800">Rs. {splitCard.toFixed(2)}</strong>
          </div>

          <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-150/60">
            <span className="text-[9px] text-slate-450 uppercase font-black tracking-wider block mb-1">UPI / QR Codes</span>
            <strong className="text-xs font-extrabold text-[#00A770]">Rs. {splitUPI.toFixed(2)}</strong>
          </div>

          <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-150/60">
            <span className="text-[9px] text-slate-450 uppercase font-black tracking-wider block mb-1">Insurance / Credit</span>
            <strong className="text-xs font-extrabold text-slate-800">Rs. {splitInsurance.toFixed(2)}</strong>
          </div>
        </div>

      </div>

      {/* Ledger Sub-tabs Section */}
      <div className="space-y-4">
        
        {/* Tab switcher buttons */}
        <div className="flex border-b border-slate-150 text-[11px] font-extrabold text-slate-550">
          <button
            onClick={() => setActiveSubTab("transactions")}
            className={`pb-2.5 px-4 transition-all uppercase tracking-wider ${
              activeSubTab === "transactions" 
                ? "border-b-2 border-[#00A770] text-[#00A770] font-black" 
                : "hover:text-slate-700"
            }`}
          >
            Transactions ({dailyTrans.length})
          </button>
          
          <button
            onClick={() => setActiveSubTab("bills")}
            className={`pb-2.5 px-4 transition-all uppercase tracking-wider ${
              activeSubTab === "bills" 
                ? "border-b-2 border-[#00A770] text-[#00A770] font-black" 
                : "hover:text-slate-700"
            }`}
          >
            Bills ({dailyBills.length})
          </button>

          <button
            onClick={() => setActiveSubTab("expenses")}
            className={`pb-2.5 px-4 transition-all uppercase tracking-wider ${
              activeSubTab === "expenses" 
                ? "border-b-2 border-[#00A770] text-[#00A770] font-black" 
                : "hover:text-slate-700"
            }`}
          >
            Expenses ({dailyExps.length})
          </button>
        </div>

        {/* Table filter actions */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
          
          {/* Search box */}
          <div className="relative w-full max-w-xs shrink-0">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-350" />
            <input 
              type="text" 
              placeholder="Search in page..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9.5 pl-10 pr-4 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00A770] text-xs"
            />
          </div>

          {/* Quick buttons */}
          <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-wider">
            <button
              onClick={decrementDate}
              className="px-3.5 py-2 border border-slate-250 bg-white hover:bg-slate-50 rounded-xl text-slate-700 shadow-sm"
            >
              Previous day bills
            </button>

            <button
              onClick={() => setCashierModalOpen(true)}
              className="px-3.5 py-2 bg-[#00A770] hover:bg-[#009060] text-white rounded-xl shadow-md flex items-center space-x-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add cashier</span>
            </button>
          </div>
        </div>

        {/* Ledger Table Container */}
        <div className="bg-white dark:bg-darkCard rounded-2xl border border-slate-150 shadow-sm overflow-hidden">
          
          {/* 1. Transactions Tab View */}
          {activeSubTab === "transactions" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[10.5px]">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] border-b border-slate-150 font-black tracking-wider">
                  <tr>
                    <th className="p-3.5 pl-6">ID</th>
                    <th className="p-3.5">REG. NO.</th>
                    <th className="p-3.5">PATIENT NAME</th>
                    <th className="p-3.5">REFERRED BY</th>
                    <th className="p-3.5">DATE</th>
                    <th className="p-3.5">TIME</th>
                    <th className="p-3.5">DCN</th>
                    <th className="p-3.5">CC</th>
                    <th className="p-3.5 text-right">AMOUNT</th>
                    <th className="p-3.5">METHOD</th>
                    <th className="p-3.5">RECEIVED BY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filterTransactions().length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-slate-400">
                        No financial transactions registered for this date.
                      </td>
                    </tr>
                  ) : (
                    filterTransactions().map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/40">
                        <td className="p-3.5 pl-6 font-mono text-[9.5px] text-slate-400">{row.id}</td>
                        <td className="p-3.5 font-bold text-[#00A770]">
                          <Link href={`/dashboard/cases/bills/${row.invoice_number}`} className="hover:underline">
                            {row.reg_no}
                          </Link>
                        </td>
                        <td className="p-3.5 font-extrabold text-slate-800">{row.patient_name}</td>
                        <td className="p-3.5">{row.referred_by}</td>
                        <td className="p-3.5 font-mono">{row.date}</td>
                        <td className="p-3.5 font-mono">{row.time}</td>
                        <td className="p-3.5 font-mono">{row.dcn}</td>
                        <td className="p-3.5"><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[9px]">{row.cc}</span></td>
                        <td className={`p-3.5 text-right font-black ${row.is_positive ? "text-slate-800" : "text-red-500"}`}>
                          {row.is_positive ? "" : "-"}{row.amount.toFixed(2)}
                        </td>
                        <td className="p-3.5"><span className="bg-emerald-50 text-[#00A770] px-2 py-0.5 rounded-md text-[9px]">{row.method}</span></td>
                        <td className="p-3.5 font-mono">{row.received_by}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              
              {/* Footer */}
              <div className="bg-slate-50/50 p-4 border-t border-slate-150 flex justify-between items-center text-xs">
                <span className="text-slate-400">Total Income:</span>
                <strong className="text-[#00A770] font-black text-sm">Rs. {totalIncome.toFixed(2)}</strong>
              </div>
            </div>
          )}

          {/* 2. Bills / Invoices Tab View */}
          {activeSubTab === "bills" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[10.5px]">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] border-b border-slate-150 font-black tracking-wider">
                  <tr>
                    <th className="p-3.5 pl-6">BILL ID</th>
                    <th className="p-3.5">PATIENT NAME</th>
                    <th className="p-3.5">REFERRED BY</th>
                    <th className="p-3.5 text-right">TOTAL PRICE</th>
                    <th className="p-3.5 text-right">DISCOUNT</th>
                    <th className="p-3.5 text-right">PAID</th>
                    <th className="p-3.5 text-right">DUE AMOUNT</th>
                    <th className="p-3.5">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filterBills().length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No billing invoices compiled for this date.
                      </td>
                    </tr>
                  ) : (
                    filterBills().map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/40">
                        <td className="p-3.5 pl-6 font-bold text-[#00A770]">
                          <Link href={`/dashboard/cases/bills/${b.invoice_number}`} className="hover:underline">
                            {b.invoice_number}
                          </Link>
                        </td>
                        <td className="p-3.5 font-extrabold text-slate-800">{b.patient_name}</td>
                        <td className="p-3.5">{b.referral_doctor_name || "Self"}</td>
                        <td className="p-3.5 text-right font-extrabold">{(b.price || 0).toFixed(2)}</td>
                        <td className="p-3.5 text-right">{(b.discount || 0).toFixed(2)}</td>
                        <td className="p-3.5 text-right text-[#00A770] font-black">{(b.amount_received || 0).toFixed(2)}</td>
                        <td className={`p-3.5 text-right font-black ${b.balance_due > 0 ? "text-red-500" : "text-[#00A770]"}`}>
                          {(b.balance_due || 0).toFixed(2)}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                            b.status === "Paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                          }`}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 3. Expenses Tab View */}
          {activeSubTab === "expenses" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[10.5px]">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] border-b border-slate-150 font-black tracking-wider">
                  <tr>
                    <th className="p-3.5 pl-6">EXPENSE ID</th>
                    <th className="p-3.5">TITLE</th>
                    <th className="p-3.5">CATEGORY</th>
                    <th className="p-3.5 text-right">AMOUNT</th>
                    <th className="p-3.5">PAYMENT METHOD</th>
                    <th className="p-3.5">DESCRIPTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filterExpenses().length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No expenses logged on this date.
                      </td>
                    </tr>
                  ) : (
                    filterExpenses().map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50/40">
                        <td className="p-3.5 pl-6 font-mono text-slate-450">{e.id}</td>
                        <td className="p-3.5 font-extrabold text-slate-800">{e.description}</td>
                        <td className="p-3.5"><span className="bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-md text-[9.5px] font-bold">{e.category}</span></td>
                        <td className="p-3.5 text-right font-black text-red-500">Rs. {e.amount.toFixed(2)}</td>
                        <td className="p-3.5"><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[9px]">{e.payment_method || "Cash"}</span></td>
                        <td className="p-3.5 font-normal text-slate-450">-</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              
              {/* Footer */}
              <div className="bg-slate-50/50 p-4 border-t border-slate-150 flex justify-between items-center text-xs">
                <span className="text-slate-400">Total Expenses:</span>
                <strong className="text-red-500 font-black text-sm">Rs. {totalExpenses.toFixed(2)}</strong>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* --- POPUPS AND DIALOGS --- */}

      {/* 1. Add Cashier Popup Dialog */}
      {cashierModalOpen && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center p-4 z-50 print:hidden animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-2xl max-w-sm w-full space-y-4 animate-in zoom-in-95 duration-200 text-slate-700">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-xs uppercase tracking-widest text-[#062A22]">Add Diagnostic Cashier</h3>
              <button onClick={() => setCashierModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            
            <form onSubmit={handleAddCashier} className="space-y-4">
              <div>
                <label className="block text-[9.5px] text-slate-450 uppercase font-black mb-1">Cashier Full Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={cashierName}
                  onChange={(e) => setCashierName(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00A770] text-xs font-semibold"
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-2 text-[10px] font-black uppercase tracking-wider">
                <button 
                  type="button"
                  onClick={() => setCashierModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4.5 py-2 bg-[#00A770] hover:bg-[#009060] text-white rounded-xl shadow-md"
                >
                  Register Cashier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Business Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center p-4 z-50 print:hidden animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-2xl max-w-md w-full space-y-4 animate-in zoom-in-95 duration-200 text-slate-700">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-xs uppercase tracking-widest text-[#062A22] flex items-center space-x-1.5">
                <FileText className="h-4 w-4 text-[#00A770]" />
                <span>Daily Business Summary Report</span>
              </h3>
              <button onClick={() => setReportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            
            <div className="space-y-3 font-semibold text-slate-600 border-t border-b border-slate-100 py-4 font-mono text-[11px]">
              <div className="flex justify-between">
                <span>REPORT DATE:</span>
                <span>{formatDateString(selectedDate)}</span>
              </div>
              <div className="flex justify-between">
                <span>TOTAL INCOME:</span>
                <span className="text-[#00A770]">Rs. {totalIncome.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>TOTAL EXPENSES:</span>
                <span className="text-red-500">Rs. {totalExpenses.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-dashed border-slate-200 pt-2 font-black text-xs">
                <span>NET SETTLED INCOME:</span>
                <span className={netIncome >= 0 ? "text-[#00A770]" : "text-red-500"}>Rs. {netIncome.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="flex justify-end pt-2 text-[10px] font-black uppercase tracking-wider">
              <button 
                onClick={() => setReportModalOpen(false)}
                className="px-5 py-2 bg-[#00A770] hover:bg-[#009060] text-white rounded-xl shadow-md"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Monthly Overview (BETA) Modal */}
      {monthlyModalOpen && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center p-4 z-50 print:hidden animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-2xl max-w-md w-full space-y-4 animate-in zoom-in-95 duration-200 text-slate-700">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-xs uppercase tracking-widest text-[#062A22] flex items-center space-x-1.5">
                <TrendingUp className="h-4 w-4 text-[#00A770]" />
                <span>Monthly business collection (BETA)</span>
              </h3>
              <button onClick={() => setMonthlyModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            
            <div className="space-y-4 text-center py-4">
              <div className="text-sm font-black text-slate-800">July 2026 Collections Chart</div>
              
              {/* Simulated Chart Bars */}
              <div className="flex justify-around items-end h-32 border-b border-slate-200 pb-2">
                <div className="w-8 bg-slate-200 hover:bg-[#00A770]/80 rounded-t-md h-[40%]" title="Week 1: Rs. 14,500"></div>
                <div className="w-8 bg-slate-200 hover:bg-[#00A770]/80 rounded-t-md h-[60%]" title="Week 2: Rs. 22,000"></div>
                <div className="w-8 bg-[#00A770] rounded-t-md h-[85%]" title="Week 3 (Current): Rs. 31,450"></div>
                <div className="w-8 bg-slate-100 rounded-t-md h-[10%]" title="Week 4: Rs. 2,000"></div>
              </div>
              <div className="flex justify-around text-[9px] font-black text-slate-450 uppercase">
                <span>Wk 1</span>
                <span>Wk 2</span>
                <span>Wk 3</span>
                <span>Wk 4</span>
              </div>
            </div>
            
            <div className="flex justify-end pt-2 text-[10px] font-black uppercase tracking-wider">
              <button 
                onClick={() => setMonthlyModalOpen(false)}
                className="px-5 py-2 bg-[#00A770] hover:bg-[#009060] text-white rounded-xl shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
