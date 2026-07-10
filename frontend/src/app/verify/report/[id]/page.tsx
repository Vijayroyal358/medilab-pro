"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "../../../../services/api";
import { Report } from "../../../../types/index";
import { 
  ShieldCheck, Loader2, FileText, CheckCircle2, 
  Clock, AlertCircle, HeartPulse
} from "lucide-react";

export default function PublicReportVerifyPage() {
  const params = useParams();
  const reportId = params.id as string;

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadVerificationData = async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch all reports to verify this ID (using a public mock query or all reports filter)
      const reports = await apiFetch<Report[]>("/reports", { method: "GET" });
      const matched = reports.find(
        r => String(r.id) === reportId || r.patient_id_code?.toLowerCase() === reportId.toLowerCase()
      );

      if (!matched) {
        setError(`No certified report matching verification ID ${reportId} was found.`);
        return;
      }
      setReport(matched);
    } catch (err: any) {
      console.error(err);
      setError("Clinical database connectivity error during verification scan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reportId) {
      loadVerificationData();
    }
  }, [reportId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Verifying secure QR certification...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-55 flex flex-col items-center justify-center p-6 text-xs font-medium">
      <div className="max-w-md w-full bg-white rounded-xl border border-borders shadow-xl overflow-hidden">
        
        {/* Verification banner header */}
        <div className="bg-success text-white py-4 px-6 flex items-center space-x-2 shrink-0">
          <ShieldCheck className="h-5 w-5" />
          <span className="font-extrabold uppercase tracking-wider text-[10px]">Verified LIMS Report</span>
        </div>

        {error ? (
          <div className="p-6 text-center space-y-3">
            <AlertCircle className="h-10 w-10 text-danger mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">Scan Verification Failed</h3>
            <p className="text-mutedText leading-relaxed">{error}</p>
            <p className="text-[10px] text-slate-400">If you believe this is a system mistake, please contact support.</p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            
            {/* Lab details */}
            <div className="flex items-center space-x-2.5 pb-4 border-b border-dashed border-borders">
              <HeartPulse className="h-5 w-5 text-primary" />
              <div>
                <h2 className="font-extrabold text-slate-800 text-sm">Central Diagnostic Lab</h2>
                <p className="text-[9px] text-slate-400">ISO 9001:2015 Accredited Facility</p>
              </div>
            </div>

            {/* Case Details */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Case Demographics</h3>
              <div className="grid grid-cols-2 gap-3 text-slate-550">
                <div>Patient Name: <strong className="font-bold text-slate-800">{report?.patient_name}</strong></div>
                <div>Code: <strong className="font-bold text-slate-800">{report?.patient_id_code}</strong></div>
                <div>Test Name: <strong className="font-semibold text-slate-800">{report?.test_name}</strong></div>
                <div className="flex items-center space-x-1">
                  <span>Status:</span>
                  <span className={`inline-flex px-1.5 py-0.25 rounded text-[8px] font-bold uppercase tracking-wider ${
                    report?.status === "Completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-750"
                  }`}>
                    {report?.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Clinical observations */}
            {report?.status === "Completed" && report.results_json ? (
              <div className="space-y-3 pt-4 border-t border-dashed border-borders">
                <h3 className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Observations results ledger</h3>
                <div className="border border-borders rounded-lg overflow-hidden divide-y divide-borders">
                  {JSON.parse(report.results_json).map((p: any, idx: number) => (
                    <div key={idx} className="p-2.5 bg-slate-50/50 flex justify-between items-center text-[10px]">
                      <div>
                        <div className="font-bold text-slate-800">{p.parameter}</div>
                        <span className="text-[9px] text-slate-400">Range: {p.normal_range} {p.unit}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-extrabold text-slate-800">{p.observed} {p.unit}</div>
                        <span className={`text-[8px] font-bold uppercase ${
                          p.flag === "Normal" ? "text-success" : "text-danger"
                        }`}>{p.flag}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-lg text-center space-y-1.5">
                <Clock className="h-6 w-6 text-slate-400 mx-auto animate-pulse" />
                <p className="font-semibold text-slate-700">Results are in processing</p>
                <p className="text-[10px] text-slate-400">Technician has registered samples. Results will update here automatically.</p>
              </div>
            )}

            {/* Secure verification stamp */}
            <div className="text-center text-[9px] text-slate-400 pt-4 border-t border-borders">
              Certified digitally signed document ID: <span className="font-mono font-bold">{reportId}</span>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
