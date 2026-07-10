"use client";

import React, { useState } from "react";
import { Search, MapPin, Phone, Award, UserCheck } from "lucide-react";

export default function AgentsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const mockAgents = [
    { id: "AGT-101", name: "Agent Reddy", phone: "8555053215", area: "Queens, NY", status: "Active", collections_today: 4 },
    { id: "AGT-102", name: "Agent Smith", phone: "555-0391", area: "Brooklyn, NY", status: "Active", collections_today: 2 },
    { id: "AGT-103", name: "Agent Rivera", phone: "555-0392", area: "Manhattan, NY", status: "On Leave", collections_today: 0 }
  ];

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">Sample Collection Agents</h1>
        <p className="text-[10px] text-mutedText font-medium">Manage diagnostics home/satellite collection agents, contact details, and routing areas</p>
      </div>

      {/* Search Input */}
      <div className="bg-white dark:bg-darkCard p-4 rounded-xl border border-borders dark:border-darkBorders shadow-sm text-xs flex items-center justify-between gap-4">
        <div className="relative flex-grow max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-3 pr-10 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-xs focus:outline-none"
            placeholder="Search agent name or area..."
          />
          <Search className="h-4 w-4 text-slate-400 absolute right-3 top-3" />
        </div>
      </div>

      {/* Grid Cards of Agents */}
      <div className="grid sm:grid-cols-3 gap-6 text-xs">
        {mockAgents.map((agent) => (
          <div key={agent.id} className="bg-white dark:bg-darkCard p-5 rounded-xl border border-borders dark:border-darkBorders shadow-sm flex flex-col justify-between space-y-4">
            
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-850 dark:text-white text-sm">{agent.name}</h3>
                <span className="text-[9px] text-slate-400 font-mono">Agent ID: {agent.id}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                agent.status === "Active" 
                  ? "bg-green-50 text-success dark:bg-green-950/20 dark:text-green-400" 
                  : "bg-slate-50 text-slate-500 dark:bg-slate-900/20 dark:text-slate-400"
              }`}>
                {agent.status}
              </span>
            </div>

            <div className="space-y-1.5 text-slate-655 font-semibold">
              <div className="flex items-center space-x-2">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span>Zone: {agent.area}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span>Phone: {agent.phone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                <span>Collections Today: <strong className="font-extrabold text-blue-600">{agent.collections_today} cases</strong></span>
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
