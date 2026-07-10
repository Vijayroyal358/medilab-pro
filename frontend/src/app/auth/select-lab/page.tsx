"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifySlug } from "../../../services/auth";
import { ShieldAlert, Building, MessageSquare, Youtube, Facebook, Instagram, Linkedin } from "lucide-react";

function SelectLabForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPatientPortal = searchParams.get("portal") === "true";

  const [slug, setSlug] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!slug.trim()) {
      setErrorMsg("Please enter a laboratory slug.");
      return;
    }

    setLoading(true);
    try {
      const res = await verifySlug(slug.trim().toLowerCase());
      localStorage.setItem("medilab_lab_slug", res.lab_slug);
      localStorage.setItem("medilab_lab_name", res.lab_name);
      
      const portalParam = isPatientPortal ? "&portal=true" : "";
      router.push(`/auth/login?lab=${res.lab_slug}${portalParam}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Laboratory tenant not found. Try 'central-lab'.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-between bg-slate-50 overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Slanted Parallelograms (Mockup Style) */}
      <div className="absolute top-[20%] left-[-10%] w-[45%] h-[120px] bg-sky-200/40 rotate-[14deg] -skew-x-[24deg] rounded-3xl pointer-events-none -z-10"></div>
      <div className="absolute top-[32%] left-[-15%] w-[45%] h-[90px] bg-blue-300/40 rotate-[14deg] -skew-x-[24deg] rounded-3xl pointer-events-none -z-10"></div>
      
      <div className="absolute top-[10%] right-[-10%] w-[40%] h-[140px] bg-blue-300/50 rotate-[14deg] -skew-x-[24deg] rounded-3xl pointer-events-none -z-10"></div>
      <div className="absolute top-[24%] right-[-5%] w-[35%] h-[95px] bg-sky-200/40 rotate-[14deg] -skew-x-[24deg] rounded-3xl pointer-events-none -z-10"></div>

      {/* Main Header / Brand */}
      <div className="flex flex-col items-center text-center shrink-0 mb-6 mt-4">
        {/* Custom Logo (Labsmart / MediLabsPro Style circular arrow swoosh) */}
        <div className="flex items-center space-x-2 text-blue-600 mb-2">
          <svg className="h-9 w-9 text-blue-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M18.5 7.5L21.5 10.5L24.5 7.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 6C8.686 6 6 8.686 6 12C6 15.314 8.686 18 12 18C15.314 18 18 15.314 18 12C18 10.5 17.5 9 16.5 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="font-bold text-3xl tracking-tight text-slate-800">MediLabsPro</span>
        </div>
        <p className="text-sm text-slate-500 font-medium">Effortless Laboratory Management</p>
      </div>

      {/* Form Card */}
      <div className="w-full max-w-[460px] mx-auto bg-white p-10 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-300">
        <div className="text-left mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Find your laboratory</h2>
          <p className="text-xs text-slate-400 mt-1.5">
            Enter your laboratory slug (tenant identifier) to proceed to your sign in portal.
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-center space-x-2 p-3.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold mb-5 border border-red-100">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Laboratory Slug</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Building className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="pl-10 pr-4 w-full h-11 rounded-lg border border-slate-200 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 placeholder-slate-400 text-slate-800 transition-all font-medium"
                placeholder="e.g. central-lab"
                required
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-all flex items-center justify-center disabled:opacity-50"
          >
            {loading ? "Searching..." : "Continue"}
          </button>
        </form>

        <div className="mt-8 border-t border-slate-100 pt-5 text-center">
          <p className="text-[11px] text-slate-400 font-medium">
            Demo labs for evaluation: <span className="font-semibold text-blue-600 font-mono">central-lab</span> or <span className="font-semibold text-blue-600 font-mono">metro-lab</span>
          </p>
        </div>
      </div>

      {/* Footer Support Info */}
      <div className="flex flex-col items-center text-center mt-8 shrink-0 space-y-4">
        {/* Sign up prompt */}
        <p className="text-xs text-slate-500 font-semibold">
          Don't have an account ? <span className="text-blue-600 hover:underline cursor-pointer">Sign up</span>
        </p>

        {/* WhatsApp & Time */}
        <div className="space-y-1 text-center">
          <div className="flex items-center justify-center space-x-1.5 text-xs text-slate-500 font-semibold">
            <span>Speak to an expert</span>
            <span className="text-emerald-500 font-bold inline-flex items-center">
              <MessageSquare className="h-3.5 w-3.5 fill-emerald-500 text-emerald-500 mr-1" />
              9318313723
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">Monday to Friday 11:00 am - 5:00 pm</p>
        </div>

        {/* Social Follow */}
        <div className="flex flex-col items-center space-y-2 pt-2">
          <div className="flex items-center space-x-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <span>Follow us on:</span>
          </div>
          <div className="flex items-center space-x-4">
            <a href="#" className="text-red-500 hover:opacity-80 transition-opacity"><Youtube className="h-4.5 w-4.5 fill-red-500 text-red-500" /></a>
            <a href="#" className="text-blue-700 hover:opacity-80 transition-opacity"><Facebook className="h-4.5 w-4.5 fill-blue-700 text-blue-700" /></a>
            <a href="#" className="text-pink-600 hover:opacity-80 transition-opacity"><Instagram className="h-4.5 w-4.5" /></a>
            <a href="#" className="text-blue-800 hover:opacity-80 transition-opacity"><Linkedin className="h-4.5 w-4.5 fill-blue-800 text-blue-800" /></a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SelectLabPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    }>
      <SelectLabForm />
    </Suspense>
  );
}
