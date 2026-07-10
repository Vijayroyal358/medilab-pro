"use client";

import React, { useState } from "react";
import { Search, Loader2, Sparkles, Stethoscope } from "lucide-react";

export default function CtScanCasesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const mockCtCases = [
    { id: "CT-3021", patient_name: "Mr. Sundhar Reddy", scan_type: "HRCT Chest Contrast", scanner: "GE Optima 64-slice", status: "Completed", date: "29/01/2026", cost: 3500 },
    { id: "CT-3022", patient_name: "Mrs. Alice Smith", scan_type: "CT Brain Plain", scanner: "Siemens Somatom", status: "Pending Analysis", date: "30/06/2026", cost: 1800 }
  ];

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">CT Scan Cases</h1>
        <p className="text-[10px] text-mutedText font-medium">Radiology CT scan imaging registers, slice counts, and clinical status</p>
      </div>

      {/* Search Input */}
      <div className="bg-white dark:bg-darkCard p-4 rounded-xl border border-borders dark:border-darkBorders shadow-sm text-xs flex items-center justify-between gap-4">
        <div className="relative flex-grow max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-3 pr-10 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-xs focus:outline-none"
            placeholder="Search CT patient or scan type..."
          />
          <Search className="h-4 w-4 text-slate-400 absolute right-3 top-3" />
        </div>
      </div>

      {/* Grid Table */}
      <div className="bg-white dark:bg-darkCard rounded-xl border border-borders dark:border-darkBorders shadow-sm overflow-hidden text-xs font-medium">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-borders dark:border-darkBorders text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Case ID</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">CT Scan Type</th>
                <th className="py-3 px-4">Scanner Machine</th>
                <th className="py-3 px-4">Scan Date</th>
                <th className="py-3 px-4 text-right">Cost</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borders dark:divide-darkBorders">
              {mockCtCases.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-4 text-slate-500 font-mono">{c.id}</td>
                  <td className="py-4 px-4 font-bold text-slate-800 dark:text-white">{c.patient_name}</td>
                  <td className="py-4 px-4 text-slate-700 dark:text-slate-300 font-semibold">{c.scan_type}</td>
                  <td className="py-4 px-4 text-slate-655 font-bold">{c.scanner}</td>
                  <td className="py-4 px-4 text-slate-500">{c.date}</td>
                  <td className="py-4 px-4 text-right font-extrabold text-slate-800 dark:text-white">Rs. {c.cost}</td>
                  <td className="py-4 px-4 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      c.status === "Completed" 
                        ? "bg-green-50 text-success dark:bg-green-950/20 dark:text-green-400" 
                        : "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/20 dark:text-yellow-400"
                    }`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
