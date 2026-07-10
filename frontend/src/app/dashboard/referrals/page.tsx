"use client";

import React, { useEffect, useState } from "react";
import { getReferrals, createReferral, getReferralBusiness, deleteReferral } from "../../../services/data";
import { ReferralDoctor, ReferralBusinessReport } from "../../../types/index";
import { 
  Plus, Users, Stethoscope, ChevronRight, Loader2, 
  Trash2, FileText, CheckCircle2, TrendingUp, DollarSign
} from "lucide-react";

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<ReferralDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState<ReferralBusinessReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [commission, setCommission] = useState(15);

  const [toastMsg, setToastMsg] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getReferrals();
      setReferrals(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegisterDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const doc = await createReferral({
        name,
        email: email || null,
        phone: phone || null,
        commission_percentage: Number(commission)
      });
      setReferrals([...referrals, doc]);
      setName("");
      setEmail("");
      setPhone("");
      setCommission(15);
      showToast("Referral doctor registered successfully!");
    } catch (err: any) {
      console.error(err);
      alert("Failed to create referral doctor.");
    }
  };

  const handleSelectDoc = async (docId: number) => {
    setLoadingReport(true);
    try {
      const rep = await getReferralBusiness(docId);
      setActiveReport(rep);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleDeleteDoc = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete Dr. ${name}?`)) return;
    try {
      await deleteReferral(id);
      setReferrals(referrals.filter(d => d.id !== id));
      if (activeReport?.doctor_name === name) {
        setActiveReport(null);
      }
      showToast(`Dr. ${name} removed.`);
    } catch (err: any) {
      console.error(err);
      alert("Failed to delete doctor.");
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 bg-success rounded-lg shadow-lg text-white font-medium text-xs">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">Referral Doctors</h1>
        <p className="text-[10px] text-mutedText">Manage external referral commission percentages and referred business cases</p>
      </div>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-3 gap-8 text-xs font-medium">
        
        {/* Left Side: Register Form & List */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Register Form */}
          <div className="bg-white dark:bg-darkCard p-6 rounded-xl border border-borders dark:border-darkBorders shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white text-xs border-b border-borders dark:border-slate-855 pb-2">Register referral doctor</h3>
            
            <form onSubmit={handleRegisterDoc} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[10px] text-slate-500 mb-1">Doctor Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="px-3 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-xs focus:outline-none"
                  placeholder="e.g. Dr. Amanda Jones"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="px-3 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-xs focus:outline-none"
                  placeholder="doctor@hospital.com"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="px-3 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-xs focus:outline-none"
                  placeholder="Mobile number"
                />
              </div>

              <div className="col-span-2 grid grid-cols-3 gap-4 items-end">
                <div className="col-span-2">
                  <label className="block text-[10px] text-slate-500 mb-1">Commission Percentage (%)</label>
                  <input
                    type="number"
                    value={commission}
                    onChange={(e) => setCommission(Number(e.target.value))}
                    className="px-3 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-xs focus:outline-none font-bold"
                    min={0}
                    max={100}
                  />
                </div>
                <button
                  type="submit"
                  className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-all"
                >
                  Add Doctor
                </button>
              </div>

            </form>
          </div>

          {/* Doctors List */}
          <div className="bg-white dark:bg-darkCard rounded-xl border border-borders dark:border-darkBorders shadow-sm overflow-hidden">
            <h3 className="px-5 py-4 font-bold text-slate-800 dark:text-white text-xs border-b border-borders dark:border-darkBorders">Referral doctors directory</h3>
            <div className="divide-y divide-borders dark:divide-darkBorders">
              {referrals.length === 0 ? (
                <div className="p-6 text-center text-mutedText">No referral doctors registered yet.</div>
              ) : (
                referrals.map(doc => (
                  <div 
                    key={doc.id}
                    className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer flex justify-between items-center transition-colors"
                    onClick={() => handleSelectDoc(doc.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg dark:bg-blue-950/20"><Stethoscope className="h-4 w-4" /></div>
                      <div>
                        <div className="font-bold text-slate-800 dark:text-white">Dr. {doc.name}</div>
                        <div className="text-[10px] text-slate-400">{doc.phone || "No phone"} &bull; {doc.email || "No email"}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4" onClick={(e) => e.stopPropagation()}>
                      <div className="text-right">
                        <div className="font-extrabold text-blue-600">{doc.commission_percentage}%</div>
                        <span className="text-[9px] text-slate-400">Commission rate</span>
                      </div>
                      <button 
                        onClick={() => handleDeleteDoc(doc.id, doc.name)}
                        className="p-1.5 text-slate-400 hover:text-danger rounded hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors"
                        title="Delete Doctor"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Side: Commission Business Report details */}
        <div>
          {loadingReport ? (
            <div className="bg-white dark:bg-darkCard p-6 rounded-xl border border-borders dark:border-darkBorders shadow-sm h-72 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : activeReport ? (
            <div className="bg-white dark:bg-darkCard p-6 rounded-xl border border-borders dark:border-darkBorders shadow-sm space-y-4">
              <div className="border-b border-borders dark:border-slate-855 pb-2">
                <h3 className="font-bold text-slate-850 dark:text-white text-xs">Dr. {activeReport.doctor_name}</h3>
                <p className="text-[9px] text-slate-400">Accrued Commission business report</p>
              </div>

              {/* Stats Summary cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-borders dark:border-darkBorders">
                  <div className="text-[9px] text-slate-400 uppercase font-bold">Total Cases</div>
                  <div className="text-lg font-bold text-slate-800 dark:text-white mt-0.5">{activeReport.cases_referred}</div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-borders dark:border-darkBorders">
                  <div className="text-[9px] text-slate-400 uppercase font-bold">Total Business</div>
                  <div className="text-lg font-bold text-slate-855 dark:text-white mt-0.5">Rs. {activeReport.total_business}</div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-borders dark:border-darkBorders col-span-2 text-center">
                  <div className="text-[9px] text-slate-400 uppercase font-bold">Earned Commission ({activeReport.commission_percentage}%)</div>
                  <div className="text-xl font-extrabold text-success mt-0.5">Rs. {activeReport.total_commission}</div>
                </div>
              </div>

              {/* List of referred cases */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Referred cases ledger</h4>
                <div className="max-h-48 overflow-y-auto divide-y divide-borders dark:divide-darkBorders pr-1">
                  {activeReport.cases.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic py-2">No business cases recorded yet.</p>
                  ) : (
                    activeReport.cases.map((c, idx) => (
                      <div key={idx} className="py-2.5 first:pt-0 flex justify-between items-start text-[10px]">
                        <div>
                          <div className="font-bold text-slate-800 dark:text-white">{c.patient_name}</div>
                          <div className="text-slate-400">{c.test_name} ({c.invoice_number})</div>
                          <div className="text-[8px] text-slate-400">{c.date}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold text-slate-800 dark:text-white">Rs. {c.net_amount}</div>
                          <span className="text-[8px] text-success font-semibold">Comm: Rs. {c.commission}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white dark:bg-darkCard p-6 rounded-xl border border-borders dark:border-darkBorders shadow-sm h-72 flex flex-col items-center justify-center text-center text-mutedText">
              <TrendingUp className="h-10 w-10 text-slate-200 dark:text-slate-800 mb-2" />
              <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300">No referrer selected</h4>
              <p className="text-[9px] text-slate-400 mt-0.5">Click any doctor on left to inspect their commission ledger report.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
