"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getPatients, registerTest, getReferrals } from "../../../../../services/data";
import { Patient, ReferralDoctor } from "../../../../../types/index";
import {
  ArrowLeft, Plus, Trash2, Search, User, CheckCircle2,
  ChevronDown, Loader2, AlertCircle, IndianRupee, FileText
} from "lucide-react";
import Link from "next/link";

interface TestItem {
  key: string;
  test_name: string;
  category: string;
  price: number;
  discount: number;
  discount_type: "fixed" | "percentage";
  sample_type: string;
}

const COMMON_TESTS = [
  { test_name: "Complete Blood Count (CBC)", category: "Haematology", sample_type: "Blood" },
  { test_name: "Lipid Profile", category: "Biochemistry", sample_type: "Blood" },
  { test_name: "HbA1c", category: "Biochemistry", sample_type: "Blood" },
  { test_name: "Urine Routine", category: "Urine", sample_type: "Urine" },
  { test_name: "Malaria Antigen", category: "Serology", sample_type: "Blood" },
  { test_name: "Blood Sugar Fasting", category: "Biochemistry", sample_type: "Blood" },
  { test_name: "Thyroid Profile (T3/T4/TSH)", category: "Biochemistry", sample_type: "Blood" },
  { test_name: "Liver Function Test (LFT)", category: "Biochemistry", sample_type: "Blood" },
  { test_name: "Kidney Function Test (KFT)", category: "Biochemistry", sample_type: "Blood" },
  { test_name: "Serum Electrolytes", category: "Biochemistry", sample_type: "Blood" },
  { test_name: "COVID-19 RT-PCR", category: "Microbiology", sample_type: "Swab" },
  { test_name: "Dengue NS1 Antigen", category: "Serology", sample_type: "Blood" },
  { test_name: "Widal Test", category: "Serology", sample_type: "Blood" },
  { test_name: "Chest X-Ray", category: "Radiology", sample_type: "N/A" },
  { test_name: "Arterial Blood Gas (ABG)", category: "Biochemistry", sample_type: "Blood" },
];

const PAYMENT_METHODS = ["Cash", "UPI", "Card", "Online", "Insurance", "Mixed"];

export default function NewBillPage() {
  const router = useRouter();

  // ── Patient selection ───────────────────────────────────────
  const [patientSearch, setPatientSearch] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  // ── Tests / Items ────────────────────────────────────────────
  const [testItems, setTestItems] = useState<TestItem[]>([
    { key: crypto.randomUUID(), test_name: "", category: "Haematology", price: 0, discount: 0, discount_type: "fixed", sample_type: "Blood" }
  ]);
  const [testInput, setTestInput] = useState("");
  const [showTestSuggest, setShowTestSuggest] = useState(false);

  // ── Billing ─────────────────────────────────────────────────
  const [referrals, setReferrals] = useState<ReferralDoctor[]>([]);
  const [referralDoctorId, setReferralDoctorId] = useState<number | "">("");
  const [collectionDate, setCollectionDate] = useState(new Date().toISOString().split("T")[0]);
  const [collectionCentre, setCollectionCentre] = useState("Main");
  const [collectionAgent, setCollectionAgent] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [cashAmount, setCashAmount] = useState(0);
  const [upiAmount, setUpiAmount] = useState(0);
  const [remarks, setRemarks] = useState("");

  // ── UI state ─────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getPatients().then(setPatients).catch(() => {});
    getReferrals().then(setReferrals).catch(() => {});
  }, []);

  // Patient search filter
  useEffect(() => {
    if (!patientSearch.trim()) { setSearchResults([]); return; }
    const q = patientSearch.toLowerCase();
    setSearchResults(
      patients.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.patient_id.toLowerCase().includes(q) ||
        p.phone.includes(q)
      ).slice(0, 8)
    );
  }, [patientSearch, patients]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Computed totals ──────────────────────────────────────────
  const subtotal = testItems.reduce((s, t) => s + t.price, 0);
  const totalDiscount = testItems.reduce((s, t) => {
    return s + (t.discount_type === "percentage" ? t.price * t.discount / 100 : t.discount);
  }, 0);
  const netTotal = Math.max(subtotal - totalDiscount, 0);
  const amountPaid = paymentMethod === "Mixed" ? cashAmount + upiAmount : (paymentMethod === "Cash" ? cashAmount : upiAmount);
  const balance = Math.max(netTotal - amountPaid, 0);

  // ── Handlers ─────────────────────────────────────────────────
  const addTest = (suggestion?: typeof COMMON_TESTS[0]) => {
    setTestItems(prev => [...prev, {
      key: crypto.randomUUID(),
      test_name: suggestion?.test_name ?? "",
      category: suggestion?.category ?? "Haematology",
      price: 0,
      discount: 0,
      discount_type: "fixed",
      sample_type: suggestion?.sample_type ?? "Blood",
    }]);
    setTestInput("");
    setShowTestSuggest(false);
  };

  const updateTestItem = (key: string, field: keyof TestItem, value: string | number) => {
    setTestItems(prev => prev.map(t => t.key === key ? { ...t, [field]: value } : t));
  };

  const removeTest = (key: string) => {
    setTestItems(prev => prev.filter(t => t.key !== key));
  };

  const handleSubmit = async () => {
    if (!selectedPatient) { setError("Please select a patient."); return; }
    const valid = testItems.filter(t => t.test_name.trim() && t.price > 0);
    if (!valid.length) { setError("Add at least one test with a name and price."); return; }
    setError("");
    setSubmitting(true);
    try {
      // Each test item becomes a separate row (grouped by same invoice_number from backend)
      let lastTest: any = null;
      for (const t of valid) {
        const effectiveDiscount = t.discount_type === "percentage"
          ? (t.price * t.discount / 100)
          : t.discount;
        const itemNet = t.price - effectiveDiscount;
        const itemPaidRatio = netTotal > 0 ? itemNet / netTotal : 0;
        // ponytail: proportional split per item; good enough for billing
        const itemPaid = paymentMethod === "Mixed"
          ? amountPaid * itemPaidRatio
          : amountPaid * itemPaidRatio;

        lastTest = await registerTest({
          patient_id: selectedPatient.id,
          test_name: t.test_name,
          category: t.category,
          price: t.price,
          discount: t.discount,
          discount_type: t.discount_type,
          sample_type: t.sample_type,
          collection_date: collectionDate,
          payment_method: paymentMethod === "Mixed" ? "Cash+UPI" : paymentMethod,
          amount_received: itemPaid,
          collection_centre: collectionCentre,
          collection_agent: collectionAgent,
          referral_doctor_id: referralDoctorId ? Number(referralDoctorId) : undefined,
          remarks: remarks || undefined,
        });
      }
      // Navigate to the new bill's page using the invoice_number of the last registered test
      if (lastTest?.invoice_number) {
        router.push(`/dashboard/cases/bills/${lastTest.invoice_number}`);
      } else {
        router.push("/dashboard/cases/bills");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create bill. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const testSuggestions = COMMON_TESTS.filter(t =>
    testInput.trim() && t.test_name.toLowerCase().includes(testInput.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 dark:border-darkBorders pb-4">
        <Link
          href="/dashboard/cases/bills"
          className="p-2 rounded-lg border border-slate-200 dark:border-darkBorders bg-white dark:bg-darkCard hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">New Bill</h1>
          <p className="text-[11px] text-slate-400 font-semibold">Register tests and generate an invoice</p>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-semibold">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT: Patient + Tests ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Patient Search */}
          <div className="bg-white dark:bg-darkCard rounded-2xl border border-slate-100 dark:border-darkBorders shadow-sm p-5 space-y-3">
            <h2 className="text-xs font-extrabold text-slate-700 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-indigo-500" />
              Patient
            </h2>

            {selectedPatient ? (
              <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-white">{selectedPatient.name}</p>
                  <p className="text-[11px] text-slate-500 font-semibold">{selectedPatient.patient_id} · {selectedPatient.phone}</p>
                  <p className="text-[11px] text-slate-400">{selectedPatient.age} yrs · {selectedPatient.gender}</p>
                </div>
                <button
                  onClick={() => { setSelectedPatient(null); setPatientSearch(""); }}
                  className="text-xs text-indigo-600 font-bold hover:underline"
                >
                  Change
                </button>
              </div>
            ) : (
              <div ref={dropRef} className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={e => { setPatientSearch(e.target.value); setShowDropdown(true); }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Search by name, Patient ID or phone..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkBorders bg-slate-50 dark:bg-darkBg text-sm focus:outline-none focus:border-indigo-400 transition-colors"
                  />
                </div>
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-darkCard border border-slate-100 dark:border-darkBorders rounded-xl shadow-xl z-20 overflow-hidden">
                    {searchResults.map(p => (
                      <button
                        key={p.id}
                        onClick={() => { setSelectedPatient(p); setShowDropdown(false); setPatientSearch(""); }}
                        className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-50 dark:border-slate-800 last:border-0 transition-colors"
                      >
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{p.name}</p>
                        <p className="text-[11px] text-slate-400 font-semibold">{p.patient_id} · {p.phone} · {p.age} yrs, {p.gender}</p>
                      </button>
                    ))}
                  </div>
                )}
                {showDropdown && patientSearch && searchResults.length === 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-darkCard border border-slate-100 dark:border-darkBorders rounded-xl shadow-xl z-20 px-4 py-3 text-xs text-slate-500 font-semibold">
                    No patients found.{" "}
                    <Link href="/dashboard/patients/register" className="text-indigo-600 font-bold hover:underline">Register new patient →</Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Test Items */}
          <div className="bg-white dark:bg-darkCard rounded-2xl border border-slate-100 dark:border-darkBorders shadow-sm p-5 space-y-4">
            <h2 className="text-xs font-extrabold text-slate-700 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-emerald-500" />
              Investigations / Tests
            </h2>

            {/* Quick-add search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={testInput}
                onChange={e => { setTestInput(e.target.value); setShowTestSuggest(true); }}
                onFocus={() => setShowTestSuggest(true)}
                placeholder="Search common tests to add..."
                className="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-200 dark:border-darkBorders bg-slate-50 dark:bg-darkBg text-xs focus:outline-none focus:border-emerald-400 transition-colors"
              />
              {showTestSuggest && testSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-darkCard border border-slate-100 dark:border-darkBorders rounded-xl shadow-xl z-20 overflow-hidden max-h-52 overflow-y-auto">
                  {testSuggestions.map((t, i) => (
                    <button
                      key={i}
                      onClick={() => addTest(t)}
                      className="w-full px-3 py-2.5 text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border-b border-slate-50 dark:border-slate-800 last:border-0 transition-colors"
                    >
                      <p className="text-xs font-bold text-slate-800 dark:text-white">{t.test_name}</p>
                      <p className="text-[10px] text-slate-400">{t.category} · {t.sample_type}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Test rows */}
            <div className="space-y-2">
              {testItems.map((t, idx) => (
                <div key={t.key} className="grid grid-cols-12 gap-2 items-start bg-slate-50 dark:bg-darkBg rounded-xl p-3 border border-slate-100 dark:border-darkBorders">
                  <span className="col-span-1 text-[10px] text-slate-400 font-bold pt-2.5">{idx + 1}.</span>

                  <div className="col-span-5">
                    <label className="text-[9px] text-slate-400 font-bold uppercase">Test Name</label>
                    <input
                      value={t.test_name}
                      onChange={e => updateTestItem(t.key, "test_name", e.target.value)}
                      placeholder="e.g. CBC"
                      className="w-full mt-0.5 px-2.5 py-1.5 bg-white dark:bg-darkCard border border-slate-200 dark:border-darkBorders rounded-lg text-xs focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-[9px] text-slate-400 font-bold uppercase">Price (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={t.price || ""}
                      onChange={e => updateTestItem(t.key, "price", parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full mt-0.5 px-2.5 py-1.5 bg-white dark:bg-darkCard border border-slate-200 dark:border-darkBorders rounded-lg text-xs focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-[9px] text-slate-400 font-bold uppercase">Disc.</label>
                    <div className="flex gap-1 mt-0.5">
                      <input
                        type="number"
                        min={0}
                        value={t.discount || ""}
                        onChange={e => updateTestItem(t.key, "discount", parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full px-2 py-1.5 bg-white dark:bg-darkCard border border-slate-200 dark:border-darkBorders rounded-lg text-xs focus:outline-none focus:border-emerald-400"
                      />
                      <select
                        value={t.discount_type}
                        onChange={e => updateTestItem(t.key, "discount_type", e.target.value as "fixed" | "percentage")}
                        className="px-1 py-1.5 bg-white dark:bg-darkCard border border-slate-200 dark:border-darkBorders rounded-lg text-xs focus:outline-none"
                      >
                        <option value="fixed">₹</option>
                        <option value="percentage">%</option>
                      </select>
                    </div>
                  </div>

                  <div className="col-span-1">
                    <label className="text-[9px] text-slate-400 font-bold uppercase invisible">Del</label>
                    <button
                      onClick={() => removeTest(t.key)}
                      disabled={testItems.length === 1}
                      className="mt-0.5 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors disabled:opacity-30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => addTest()}
              className="w-full py-2.5 border border-dashed border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" /> Add Another Test
            </button>
          </div>

          {/* Billing Details */}
          <div className="bg-white dark:bg-darkCard rounded-2xl border border-slate-100 dark:border-darkBorders shadow-sm p-5 space-y-4">
            <h2 className="text-xs font-extrabold text-slate-700 dark:text-white uppercase tracking-wider">Billing Details</h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase">Collection Date</label>
                <input
                  type="date"
                  value={collectionDate}
                  onChange={e => setCollectionDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-darkBg border border-slate-200 dark:border-darkBorders rounded-xl text-xs focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase">Referred By</label>
                <select
                  value={referralDoctorId}
                  onChange={e => setReferralDoctorId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-darkBg border border-slate-200 dark:border-darkBorders rounded-xl text-xs focus:outline-none focus:border-emerald-400"
                >
                  <option value="">Self / Walk-in</option>
                  {referrals.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase">Collection Centre</label>
                <input
                  value={collectionCentre}
                  onChange={e => setCollectionCentre(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-darkBg border border-slate-200 dark:border-darkBorders rounded-xl text-xs focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase">Collection Agent</label>
                <input
                  value={collectionAgent}
                  onChange={e => setCollectionAgent(e.target.value)}
                  placeholder="Name of staff..."
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-darkBg border border-slate-200 dark:border-darkBorders rounded-xl text-xs focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            {/* Payment */}
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase">Payment Mode</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {PAYMENT_METHODS.map(m => (
                  <button
                    key={m}
                    onClick={() => setPaymentMethod(m)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      paymentMethod === m
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-white dark:bg-darkBg border-slate-200 dark:border-darkBorders text-slate-600 dark:text-slate-300 hover:border-emerald-300"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === "Mixed" ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Cash Amount (₹)</label>
                  <input type="number" min={0} value={cashAmount || ""} onChange={e => setCashAmount(parseFloat(e.target.value) || 0)}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-darkBg border border-slate-200 dark:border-darkBorders rounded-xl text-xs focus:outline-none focus:border-emerald-400" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase">UPI Amount (₹)</label>
                  <input type="number" min={0} value={upiAmount || ""} onChange={e => setUpiAmount(parseFloat(e.target.value) || 0)}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-darkBg border border-slate-200 dark:border-darkBorders rounded-xl text-xs focus:outline-none focus:border-emerald-400" />
                </div>
              </div>
            ) : paymentMethod === "Cash" ? (
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase">Cash Received (₹)</label>
                <input type="number" min={0} value={cashAmount || ""} onChange={e => setCashAmount(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-darkBg border border-slate-200 dark:border-darkBorders rounded-xl text-xs focus:outline-none focus:border-emerald-400" />
              </div>
            ) : paymentMethod === "UPI" ? (
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase">UPI Amount (₹)</label>
                <input type="number" min={0} value={upiAmount || ""} onChange={e => setUpiAmount(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-darkBg border border-slate-200 dark:border-darkBorders rounded-xl text-xs focus:outline-none focus:border-emerald-400" />
              </div>
            ) : null}

            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase">Remarks</label>
              <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={2}
                placeholder="Optional internal notes..."
                className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-darkBg border border-slate-200 dark:border-darkBorders rounded-xl text-xs focus:outline-none focus:border-emerald-400 resize-none" />
            </div>
          </div>
        </div>

        {/* ── RIGHT: Summary ── */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-darkCard rounded-2xl border border-slate-100 dark:border-darkBorders shadow-sm p-5 space-y-4 sticky top-6">
            <h2 className="text-xs font-extrabold text-slate-700 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <IndianRupee className="h-3.5 w-3.5 text-amber-500" />
              Bill Summary
            </h2>

            <div className="space-y-2 text-xs font-semibold">
              {testItems.map((t, idx) => t.test_name && (
                <div key={t.key} className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span className="truncate pr-2">{idx + 1}. {t.test_name || "Unnamed"}</span>
                  <span className="shrink-0">₹{t.price.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 dark:border-darkBorders pt-3 space-y-1.5 text-xs font-semibold">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>- ₹{totalDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-800 dark:text-white font-extrabold text-sm border-t border-slate-100 dark:border-darkBorders pt-2">
                <span>Net Total</span>
                <span>₹{netTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Amount Paid</span>
                <span className="text-emerald-600 font-bold">₹{amountPaid.toFixed(2)}</span>
              </div>
              {balance > 0 && (
                <div className="flex justify-between text-red-600 font-bold">
                  <span>Balance Due</span>
                  <span>₹{balance.toFixed(2)}</span>
                </div>
              )}
            </div>

            {selectedPatient && (
              <div className="bg-slate-50 dark:bg-darkBg rounded-xl p-3 text-[11px] font-semibold text-slate-500 space-y-0.5">
                <p className="font-bold text-slate-700 dark:text-white">{selectedPatient.name}</p>
                <p>{selectedPatient.patient_id} · {selectedPatient.age} yrs, {selectedPatient.gender}</p>
                <p>{selectedPatient.phone}</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting || !selectedPatient || testItems.every(t => !t.test_name || !t.price)}
              className="w-full py-3 bg-[#00A770] hover:bg-[#009060] disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              {submitting
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating Bill...</>
                : <><CheckCircle2 className="h-4 w-4" /> Generate Bill</>
              }
            </button>

            <Link
              href="/dashboard/cases/bills"
              className="block text-center text-xs text-slate-400 hover:text-slate-600 font-semibold"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
