"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { Activity, ShieldCheck, Database, CalendarDays, HeartPulse } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "Patient") {
        router.push("/portal");
      } else {
        router.push("/dashboard");
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background dark:bg-darkBg">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm font-medium text-mutedText">Loading MediLabsPro...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background dark:bg-darkBg transition-colors duration-300">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-borders dark:border-darkBorders bg-white/80 dark:bg-darkCard/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HeartPulse className="h-7 w-7 text-primary" />
            <span className="font-bold text-xl tracking-tight text-slate-800 dark:text-white">
              MediLabs<span className="text-primary font-semibold">Pro</span>
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              href="/auth/login?portal=true"
              className="text-sm font-medium text-slate-600 hover:text-primary dark:text-slate-300 dark:hover:text-primary transition-colors"
            >
              Patient Portal
            </Link>
            <Link
              href="/auth/login"
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/95 rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              Staff Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col justify-center max-w-7xl mx-auto px-6 py-12 lg:py-24">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary">
              <Activity className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Enterprise LIMS SaaS</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-800 dark:text-white leading-tight">
              Modern Laboratory <br />
              <span className="text-primary">Information Management</span>
            </h1>
            <p className="text-lg text-mutedText dark:text-slate-300 max-w-xl">
              MediLabsPro provides secure multi-tenant diagnostic LIMS systems for patient registration, test orders, real-time queues, technician workflows, and clinical report sign-offs.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/auth/login"
                className="px-6 py-3 font-semibold text-white bg-primary hover:bg-primary/95 rounded-lg shadow-lg hover:shadow-xl transition-all"
              >
                Launch Laboratory Staff Portal
              </Link>
              <Link
                href="/auth/login?portal=true"
                className="px-6 py-3 font-semibold text-slate-700 bg-white border border-borders hover:bg-slate-50 dark:bg-darkCard dark:text-slate-200 dark:border-darkBorders dark:hover:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-all"
              >
                Access Patient Portal
              </Link>
            </div>
          </div>
          
          <div className="lg:col-span-5 relative">
            <div className="w-full h-80 md:h-96 rounded-2xl bg-gradient-to-tr from-primary/10 to-accent/10 border border-borders dark:border-darkBorders shadow-xl flex items-center justify-center p-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-[1px] -z-10"></div>
              {/* Graphic Element */}
              <div className="flex flex-col space-y-4 w-full max-w-sm bg-white dark:bg-darkCard p-6 rounded-xl border border-borders dark:border-darkBorders shadow-2xl relative transition-transform duration-300 group-hover:scale-105">
                <div className="flex items-center justify-between border-b border-borders dark:border-darkBorders pb-3">
                  <div className="flex items-center space-x-2">
                    <HeartPulse className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-sm">Today's Patient Status</span>
                  </div>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Live Queue</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-mutedText">Pending Reports</span>
                    <span className="font-bold text-yellow-600 dark:text-yellow-400">14 Orders</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-mutedText">Completed Reports</span>
                    <span className="font-bold text-primary">82 Signed</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-mutedText">Revenue Today</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">$2,450.00</span>
                  </div>
                </div>
                <div className="pt-2">
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-4/5 bg-primary rounded-full"></div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-mutedText pt-1">
                    <span>80% Processing completed</span>
                    <span>16 remaining</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <section className="grid md:grid-cols-3 gap-8 mt-16 lg:mt-32">
          <div className="bg-white dark:bg-darkCard p-6 rounded-xl border border-borders dark:border-darkBorders shadow-md hover:shadow-lg transition-shadow">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-lg text-slate-800 dark:text-white mb-2">Role-Based Access</h3>
            <p className="text-sm text-mutedText dark:text-slate-300">
              Granular workflows for Lab Admins, Receptionists, Technicians, Doctors, and Patients with HIPAA-ready audit trails.
            </p>
          </div>

          <div className="bg-white dark:bg-darkCard p-6 rounded-xl border border-borders dark:border-darkBorders shadow-md hover:shadow-lg transition-shadow">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
              <Database className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-lg text-slate-800 dark:text-white mb-2">Multi-Tenant Isolation</h3>
            <p className="text-sm text-mutedText dark:text-slate-300">
              Each laboratory operates in a secure sandbox. Patients and records are tied strictly to subscribing tenants.
            </p>
          </div>

          <div className="bg-white dark:bg-darkCard p-6 rounded-xl border border-borders dark:border-darkBorders shadow-md hover:shadow-lg transition-shadow">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
              <CalendarDays className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-lg text-slate-800 dark:text-white mb-2">Live Appointments</h3>
            <p className="text-sm text-mutedText dark:text-slate-300">
              Queue tracking, calendar planning, and real-time report delivery directly into patient portals.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-borders dark:border-darkBorders py-8 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-xs text-mutedText space-y-4 md:space-y-0">
          <span>&copy; 2026 MediLabsPro. All rights reserved.</span>
          <div className="flex space-x-6">
            <span className="hover:text-primary cursor-pointer">Privacy Policy</span>
            <span className="hover:text-primary cursor-pointer">Terms of Service</span>
            <span className="hover:text-primary cursor-pointer">Security Compliance</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
