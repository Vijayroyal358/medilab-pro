"use client";

import React, { useState } from "react";
import { Loader2, Share2, Search, ArrowUpRight, FolderHeart } from "lucide-react";

export default function OutsourceCasesPage() {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const mockOutsourceCases = [
    { id: "OS-9081", patient_name: "Mr. Sundhar Reddy", test_name: "Biopsy Histopathology", partner_lab: "Metro Pathology Lab", status: "Sent", sent_date: "29/01/2026", cost: 1200 },
    { id: "OS-9080", patient_name: "Mrs. Alice Smith", test_name: "Karyotyping Cytogenetics", partner_lab: "Quest Genomics", status: "Completed", sent_date: "28/01/2026", cost: 2400 }
  ];

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">Outsourced Cases</h1>
        <p className="text-[10px] text-mutedText font-medium">Diagnostic case investigations referred to external partner laboratories</p>
      </div>

      {/* Search Input */}
      <div className="bg-white dark:bg-darkCard p-4 rounded-xl border border-borders dark:border-darkBorders shadow-sm text-xs flex items-center justify-between gap-4">
        <div className="relative flex-grow max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-3 pr-10 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-xs focus:outline-none"
            placeholder="Search outsourced patient or test..."
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
                <th className="py-3 px-4">Investigation Test</th>
                <th className="py-3 px-4">Partner Laboratory</th>
                <th className="py-3 px-4">Sent Date</th>
                <th className="py-3 px-4 text-right">Outsource Cost</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borders dark:divide-darkBorders">
              {mockOutsourceCases.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-4 text-slate-500 font-mono">{c.id}</td>
                  <td className="py-4 px-4 font-bold text-slate-800 dark:text-white">{c.patient_name}</td>
                  <td className="py-4 px-4 text-slate-700 dark:text-slate-300 font-semibold">{c.test_name}</td>
                  <td className="py-4 px-4 text-slate-655 font-bold">{c.partner_lab}</td>
                  <td className="py-4 px-4 text-slate-500">{c.sent_date}</td>
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
