"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { 
  Shield, Building2, ClipboardList, FileText, Mail, 
  History, Microscope, Activity, Zap, HardDrive, 
  HeartPulse, Cog, Brain, Smile, Check, ChevronRight, Landmark
} from "lucide-react";

const SETUP_STEPS = [
  { id: "kyc", label: "KYC", icon: Shield, href: "/dashboard/setup/kyc" },
  { id: "center", label: "Center details", icon: Building2, href: "/dashboard/setup/center" },
  { id: "ratelist", label: "Ratelist", icon: ClipboardList, active: true, href: "/dashboard/setup/ratelist" },
  { id: "letterhead", label: "Letterhead", icon: FileText, href: "/dashboard/setup/letterhead" },
  { id: "review", label: "Google review", icon: Mail, href: "/dashboard/setup/review" },
  { id: "panels", label: "Panels", icon: ClipboardList, href: "/dashboard/setup/panels" }
];

const MODALITIES = [
  { id: "LAB", label: "LAB", icon: Microscope, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/40" },
  { id: "USG", label: "USG", icon: Activity, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40" },
  { id: "DIGITAL XRAY", label: "DIGITAL X-RAY", icon: Zap, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/40" },
  { id: "XRAY", label: "X-RAY", icon: HardDrive, color: "text-purple-500 bg-purple-50 dark:bg-purple-950/40" },
  { id: "OUTSOURCE LAB", label: "OUTSOURCE LAB", icon: Building2, color: "text-slate-500 bg-slate-50 dark:bg-slate-950/40" },
  { id: "ECG", label: "ECG", icon: HeartPulse, color: "text-rose-500 bg-rose-50 dark:bg-rose-950/40" },
  { id: "CT SCAN", label: "CT SCAN", icon: Cog, color: "text-orange-500 bg-orange-50 dark:bg-orange-950/40" },
  { id: "MRI", label: "MRI", icon: Brain, color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40" },
  { id: "EPS", label: "EPS", icon: Shield, color: "text-cyan-500 bg-cyan-50 dark:bg-cyan-950/40" },
  { id: "OPG", label: "OPG", icon: Smile, color: "text-teal-500 bg-teal-50 dark:bg-teal-950/40" },
  { id: "CARDIOLOGY", label: "CARDIOLOGY", icon: HeartPulse, color: "text-red-500 bg-red-50 dark:bg-red-950/40" },
  { id: "EEG", label: "EEG", icon: Brain, color: "text-violet-500 bg-violet-50 dark:bg-violet-950/40" },
  { id: "MAMMOGRAPHY", label: "MAMMOGRAPHY", icon: Smile, color: "text-pink-500 bg-pink-50 dark:bg-pink-950/40" }
];

export default function RatelistSelectPage() {
  const router = useRouter();

  return (
    <div className="flex bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-darkBorders shadow-xl min-h-[calc(100vh-8rem)] overflow-hidden">
      
      {/* Left Sidebar Setup Guide */}
      <div className="w-64 bg-[#051F19] text-[#A3B899] p-6 flex flex-col justify-between border-r border-[#031510] shrink-0">
        <div className="space-y-6">
          <div className="flex items-center space-x-2 border-b border-[#093027] pb-4">
            <Landmark className="h-5 w-5 text-emerald-400" />
            <h2 className="text-sm font-black text-white tracking-widest uppercase">Setup Guide</h2>
          </div>
          <nav className="space-y-1 text-xs font-bold">
            {SETUP_STEPS.map(step => (
              <div 
                key={step.id} 
                onClick={() => router.push(step.href)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                  step.active 
                    ? "bg-[#00A770] text-white font-extrabold shadow-md shadow-[#00A770]/10 scale-[1.02]" 
                    : "hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <step.icon className={`h-4 w-4 ${step.active ? "text-white" : "text-[#758E6B]"}`} />
                  <span>{step.label}</span>
                </div>
                <ChevronRight className={`h-3.5 w-3.5 transition-opacity ${step.active ? "opacity-100" : "opacity-40"}`} />
              </div>
            ))}
          </nav>
        </div>

        <div className="space-y-3 pt-6 border-t border-[#093027] text-[10px] font-black uppercase tracking-wider">
          <button 
            type="button" 
            onClick={() => router.push("/dashboard")}
            className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-center border border-white/10 hover:border-white/20 transition-all cursor-pointer"
          >
            Skip setup &raquo;
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="py-2.5 border border-white/10 hover:bg-white/5 text-center rounded-xl text-slate-350 hover:text-white transition-colors cursor-pointer">&lt; Prev</button>
            <button type="button" className="py-2.5 border border-white/10 hover:bg-white/5 text-center rounded-xl text-slate-355 hover:text-white transition-colors cursor-pointer">Next &gt;</button>
          </div>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-grow p-8 bg-white dark:bg-darkCard overflow-y-auto">
        <div className="border-b border-slate-100 dark:border-darkBorders pb-5 mb-8">
          <h1 className="text-xl font-extrabold text-slate-850 dark:text-white leading-none uppercase tracking-tight">Select ratelist for</h1>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-2">Choose a modality directory to configure pricing catalog</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {MODALITIES.map(mod => (
            <div
              key={mod.id}
              onClick={() => router.push(`/dashboard/setup/ratelist/${encodeURIComponent(mod.id)}`)}
              className="bg-white dark:bg-slate-900/45 p-5 rounded-2xl border border-slate-200 dark:border-darkBorders hover:border-emerald-450 dark:hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-0.5 cursor-pointer transition-all duration-200 flex items-center space-x-4 group"
            >
              <div className={`p-3 rounded-xl transition-all group-hover:scale-105 shrink-0 ${mod.color}`}>
                <mod.icon className="h-6 w-6" />
              </div>
              <div className="truncate">
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-white truncate group-hover:text-[#00A770] transition-colors">{mod.label}</h3>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mt-0.5">Ratelist</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
