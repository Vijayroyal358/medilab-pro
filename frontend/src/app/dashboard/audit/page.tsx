"use client";

import React, { useEffect, useState } from "react";
import { getAuditLogs } from "../../../services/data";
import { AuditLog } from "../../../types/index";
import { 
  ShieldCheck, Loader2, FileText, CheckCircle2, 
  Search, RefreshCw, Calendar
} from "lucide-react";

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await getAuditLogs();
      setLogs(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(
    l => 
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (l.details && l.details.toLowerCase().includes(searchTerm.toLowerCase())) || 
      l.user_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-borders dark:border-darkBorders pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Audit Logs</h1>
          <p className="text-[10px] text-mutedText">Monitor user modifications, billing actions, and security status logs</p>
        </div>
        <button
          onClick={loadLogs}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs bg-white border border-borders dark:bg-darkCard dark:border-darkBorders hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg shadow-sm font-semibold transition-all"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Reload Logs</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white dark:bg-darkCard p-4 rounded-xl border border-borders dark:border-darkBorders shadow-sm text-xs flex items-center space-x-3">
        <div className="relative flex-grow">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-3 pr-10 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-xs focus:outline-none"
            placeholder="Search logs by action, details, user name..."
          />
          <Search className="h-4 w-4 text-slate-400 absolute right-3 top-3" />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-darkCard rounded-xl border border-borders dark:border-darkBorders shadow-sm overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-borders dark:border-darkBorders text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borders dark:divide-darkBorders">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-mutedText">
                    <ShieldCheck className="h-10 w-10 text-slate-200 dark:text-slate-800 mx-auto mb-2" />
                    <p className="font-semibold">No audit logs found</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors font-medium">
                    <td className="py-4 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-800 dark:text-white">
                      {log.user_name}
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 rounded-full font-bold uppercase tracking-wider text-[9px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-655 font-semibold">
                      {log.details || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
