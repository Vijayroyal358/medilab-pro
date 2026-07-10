"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import Link from "next/link";
import { 
  HeartPulse, LayoutDashboard, Users, TestTube2, 
  CalendarDays, FileSpreadsheet, Menu, X, Sun, Moon, 
  LogOut, ChevronRight, User, ChevronDown, Plus, 
  Briefcase, FolderOpen, Stethoscope, Cog, History,
  ShieldCheck, Landmark, HardDrive, Shield,
  Microscope, PlusCircle, CircleDollarSign, ClipboardCopy, Check, Mail,
  Bell, Crown, ClipboardList, FileText, Package, Building2, Layers
} from "lucide-react";
import { getDashboardStats } from "../../services/data";
import { DashboardStats } from "../../types/index";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, darkMode, toggleDarkMode } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isSetupRoute = pathname?.startsWith("/dashboard/setup") || pathname?.startsWith("/dashboard/laboratory");
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  
  // Custom Profile states
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsExpanded, setStatsExpanded] = useState(true);
  const [newNavigationEnabled, setNewNavigationEnabled] = useState(true);
  const [copied, setCopied] = useState(false);

  // Load stats for profile dropdown
  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await getDashboardStats();
        setStats(res);
      } catch (err) {
        console.error("Failed to load stats for profile dropdown", err);
      }
    };
    if (user && user.role !== "Patient") {
      loadStats();
    }
  }, [user]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (profileOpen && !target.closest(".profile-dropdown-container")) {
        setProfileOpen(false);
      }
      if (setupOpen && !target.closest(".setup-dropdown-container")) {
        setSetupOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileOpen, setupOpen]);

  const handleCopyLabId = () => {
    const idText = user.lab_id ? String(43948720 + user.lab_id) : "43948729";
    navigator.clipboard.writeText(idText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Collapsible Sidebar Menus (Accordion style matching mockup)
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [billingOpen, setBillingOpen] = useState(false);
  const [businessOpen, setBusinessOpen] = useState(true);

  // Check login session
  useEffect(() => {
    const storedUser = localStorage.getItem("medilab_user");
    if (!storedUser) {
      router.push("/auth/login");
    }
  }, [router]);

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background dark:bg-darkBg">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const getBreadcrumbs = () => {
    const parts = pathname.split("/").filter(p => p);
    return parts.map((part, index) => {
      const href = "/" + parts.slice(0, index + 1).join("/");
      const name = part.charAt(0).toUpperCase() + part.slice(1);
      return { name, href, isLast: index === parts.length - 1 };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="min-h-screen flex bg-background dark:bg-darkBg transition-colors duration-300">
      
      {/* Sidebar Overlay (Mobile) */}
      {!sidebarOpen && !isSetupRoute && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(true)}
        ></div>
      )}

      {/* Sidebar Panel */}
      {!isSetupRoute && (
        <aside 
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#062A22] text-[#A3B899] border-r border-[#051F19] flex flex-col transform transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen shrink-0 ${
            sidebarOpen ? "-translate-x-full" : "translate-x-0"
          }`}
        >
        {/* Sidebar Header */}
        <div className="h-16 flex flex-col justify-center px-6 border-b border-[#051F19] shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-1 bg-[#00A770] rounded-lg text-white">
                <Microscope className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-base text-white tracking-tight leading-none">MediLabs</span>
                  <span className="bg-[#00A770] text-white text-[9px] font-black px-1 rounded-sm uppercase scale-90">PRO</span>
                </div>
                <span className="text-[9px] text-[#A3B899] font-semibold tracking-wide">Lab Management System</span>
              </div>
            </div>
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-400 hover:text-white lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-grow px-3 py-4 space-y-1.5 overflow-y-auto text-xs font-semibold scrollbar-thin">
          
          {/* Dashboard */}
          <Link
            href="/dashboard"
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${
              pathname === "/dashboard" 
                ? "bg-[#00A770] text-white font-bold shadow-md" 
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <LayoutDashboard className="h-4.5 w-4.5" />
            <span>Dashboard</span>
          </Link>

          {/* Register Patient */}
          <Link
            href="/dashboard/tests"
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${
              pathname === "/dashboard/tests" 
                ? "bg-[#00A770] text-white font-bold shadow-md" 
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Users className="h-4.5 w-4.5" />
            <span>Register Patient</span>
          </Link>

          {/* Patients List */}
          <Link
            href="/dashboard/patients"
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${
              pathname === "/dashboard/patients" 
                ? "bg-[#00A770] text-white font-bold shadow-md" 
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <ClipboardList className="h-4.5 w-4.5" />
            <span>Patients List</span>
          </Link>

          {/* Reports Dropdown */}
          <div>
            <button
              onClick={() => setReportsOpen(!reportsOpen)}
              className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-all text-slate-300 hover:bg-white/5 hover:text-white`}
            >
              <div className="flex items-center space-x-3">
                <FileText className="h-4.5 w-4.5" />
                <span>Reports</span>
              </div>
              <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${reportsOpen ? "rotate-180" : ""}`} />
            </button>
            {reportsOpen && (
              <div className="pl-9 pr-2 py-1 space-y-1 text-slate-400 border-l border-white/5 ml-5 mt-1">
                <Link href="/dashboard/reports" className={`block py-1 hover:text-white transition-colors ${pathname === "/dashboard/reports" ? "text-white font-bold" : ""}`}>Today's reports</Link>
                <Link href="/dashboard/reports?search=true" className={`block py-1 hover:text-white transition-colors ${pathname === "/dashboard/reports?search=true" ? "text-white font-bold" : ""}`}>Search reports</Link>
              </div>
            )}
          </div>

          {/* Billing Dropdown */}
          <div>
            <button
              onClick={() => setBillingOpen(!billingOpen)}
              className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-all text-slate-300 hover:bg-white/5 hover:text-white`}
            >
              <div className="flex items-center space-x-3">
                <CircleDollarSign className="h-4.5 w-4.5" />
                <span>Billing</span>
              </div>
              <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${billingOpen ? "rotate-180" : ""}`} />
            </button>
            {billingOpen && (
              <div className="pl-9 pr-2 py-1 space-y-1 text-slate-400 border-l border-white/5 ml-5 mt-1">
                <Link href="/dashboard/cases/bills" className={`block py-1 hover:text-white transition-colors ${pathname === "/dashboard/cases/bills" ? "text-white font-bold" : ""}`}>Bills List</Link>
                <Link href="/dashboard/cases/transactions" className={`block py-1 hover:text-white transition-colors ${pathname === "/dashboard/cases/transactions" ? "text-white font-bold" : ""}`}>Transactions</Link>
              </div>
            )}
          </div>

          {/* Referrals */}
          <Link
            href="/dashboard/referrals"
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${
              pathname === "/dashboard/referrals" 
                ? "bg-[#00A770] text-white font-bold shadow-md" 
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Briefcase className="h-4.5 w-4.5" />
            <span>Referrals</span>
          </Link>

          {/* Calendar */}
          <Link
            href="/dashboard/appointments"
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${
              pathname === "/dashboard/appointments" 
                ? "bg-[#00A770] text-white font-bold shadow-md" 
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <CalendarDays className="h-4.5 w-4.5" />
            <span>Calendar</span>
          </Link>

          {/* SECTION HEADER: OTHER */}
          <div className="pt-4 pb-1">
            <span className="text-[10px] font-bold text-[#A3B899] uppercase tracking-wider px-3">Other</span>
          </div>

          {/* Audit Logs */}
          <Link
            href="/dashboard/audit"
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${
              pathname === "/dashboard/audit" 
                ? "bg-[#00A770] text-white font-bold shadow-md" 
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <History className="h-4.5 w-4.5" />
            <span>Audit Logs</span>
          </Link>

          {/* Operations Hub */}
          <Link
            href="/dashboard/stack"
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${
              pathname === "/dashboard/stack" 
                ? "bg-[#00A770] text-white font-bold shadow-md" 
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Layers className="h-4.5 w-4.5" />
            <span>Operations Hub</span>
          </Link>

        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#093d31] bg-[#05231c]/30 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5 truncate">
            <div className="h-8 w-8 rounded-full bg-[#00A770] flex items-center justify-center font-bold text-white uppercase text-xs">
              {user.name.charAt(0)}
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-white truncate">{user.name}</div>
              <div className="text-[10px] text-[#A3B899] uppercase font-bold tracking-wider">{user.role}</div>
            </div>
          </div>
          <button 
            onClick={logout}
            className="text-[#A3B899] hover:text-[#EF4444] p-1 rounded-md transition-colors"
            title="Log Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>
      )}

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Header */}
        <header className="h-16 sticky top-0 z-30 bg-white dark:bg-darkCard border-b border-borders dark:border-darkBorders px-6 flex items-center justify-between shrink-0">
          
          <div className="flex items-center space-x-4">
            {!isSetupRoute && (
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-slate-600 dark:text-slate-350 hover:text-slate-900 focus:outline-none"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}

            {/* Breadcrumbs */}
            <nav className="hidden sm:flex items-center space-x-1.5 text-xs text-mutedText dark:text-slate-400">
              <span className="hover:text-primary cursor-pointer">LIMS</span>
              <ChevronRight className="h-3 w-3" />
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.href}>
                  {index > 0 && <ChevronRight className="h-3 w-3" />}
                  {crumb.isLast ? (
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{crumb.name}</span>
                  ) : (
                    <Link href={crumb.href} className="hover:text-primary">
                      {crumb.name}
                    </Link>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg border border-borders dark:border-darkBorders text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Sun className="h-4 w-4" />
            </button>
 
            {/* Setup Dropdown */}
            <div className="relative setup-dropdown-container">
              <button
                onClick={() => setSetupOpen(!setupOpen)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-250 dark:border-emerald-900 rounded-xl text-[#00A770] font-extrabold text-xs transition-colors hover:bg-emerald-100/50"
              >
                <Cog className="h-4 w-4" />
                <span>Setup</span>
                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${setupOpen ? "rotate-180" : ""}`} />
              </button>
 
              {setupOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-darkCard border border-slate-200 dark:border-darkBorders rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="py-1 text-xs font-bold text-slate-700 dark:text-slate-200">
                    <Link 
                      href="/dashboard/setup/kyc" 
                      onClick={() => setSetupOpen(false)}
                      className={`flex items-center space-x-2.5 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${pathname === "/dashboard/setup/kyc" ? "text-[#00A770] font-extrabold" : ""}`}
                    >
                      <Shield className={`h-4 w-4 ${pathname === "/dashboard/setup/kyc" ? "text-[#00A770]" : "text-slate-400"}`} />
                      <span>KYC</span>
                    </Link>
                    <Link 
                      href="/dashboard/setup/center" 
                      onClick={() => setSetupOpen(false)}
                      className={`flex items-center space-x-2.5 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${pathname === "/dashboard/setup/center" ? "text-[#00A770] font-extrabold" : ""}`}
                    >
                      <Building2 className={`h-4 w-4 ${pathname === "/dashboard/setup/center" ? "text-[#00A770]" : "text-slate-400"}`} />
                      <span>Center details</span>
                    </Link>
                    <Link 
                      href="/dashboard/setup/ratelist" 
                      onClick={() => setSetupOpen(false)}
                      className={`flex items-center space-x-2.5 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${pathname?.startsWith("/dashboard/setup/ratelist") ? "text-[#00A770] font-extrabold" : ""}`}
                    >
                      <ClipboardList className={`h-4 w-4 ${pathname?.startsWith("/dashboard/setup/ratelist") ? "text-[#00A770]" : "text-slate-400"}`} />
                      <span>Ratelist</span>
                    </Link>
                    <Link 
                      href="/dashboard/setup/letterhead" 
                      onClick={() => setSetupOpen(false)}
                      className={`flex items-center space-x-2.5 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${pathname === "/dashboard/setup/letterhead" ? "text-[#00A770] font-extrabold" : ""}`}
                    >
                      <FileText className={`h-4 w-4 ${pathname === "/dashboard/setup/letterhead" ? "text-[#00A770]" : "text-slate-400"}`} />
                      <span>Letterhead</span>
                    </Link>
                    <Link 
                      href="/dashboard/setup/review" 
                      onClick={() => setSetupOpen(false)}
                      className={`flex items-center space-x-2.5 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${pathname === "/dashboard/setup/review" ? "text-[#00A770] font-extrabold" : ""}`}
                    >
                      <Mail className={`h-4 w-4 ${pathname === "/dashboard/setup/review" ? "text-[#00A770]" : "text-slate-400"}`} />
                      <span>Build google review</span>
                    </Link>
                    <Link 
                      href="/dashboard/setup/panels" 
                      onClick={() => setSetupOpen(false)}
                      className={`flex items-center space-x-2.5 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${pathname === "/dashboard/setup/panels" ? "text-[#00A770] font-extrabold" : ""}`}
                    >
                      <ClipboardList className={`h-4 w-4 ${pathname === "/dashboard/setup/panels" ? "text-[#00A770]" : "text-slate-400"}`} />
                      <span>Panels</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="relative profile-dropdown-container">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="h-9 w-9 rounded-full border border-slate-200 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors bg-white dark:bg-darkCard dark:border-darkBorders"
              >
                <User className="h-5 w-5" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-darkCard border border-borders dark:border-darkBorders rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-darkBorders">
                  {/* User details header */}
                  <div className="p-4 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-800 dark:text-white truncate">{user.name}</span>
                      <span className="bg-emerald-100 dark:bg-emerald-950/45 text-emerald-700 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded-full text-[10px] tracking-wide shrink-0">
                        {user.role === "Lab Admin" ? "Account owner" : user.role}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1.5 mt-2 text-slate-500 dark:text-slate-400 font-medium">
                      <span>Lab ID #: {user.lab_id ? String(43948720 + user.lab_id) : "43948729"}</span>
                      <button 
                        onClick={handleCopyLabId}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        title="Copy Lab ID"
                      >
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Today's total (Rupee stats) */}
                  {user.role !== "Patient" && (
                    <div className="text-xs">
                      <div 
                        onClick={() => setStatsExpanded(!statsExpanded)}
                        className="flex items-center justify-between px-4 py-2.5 bg-[#FFF9F6] dark:bg-orange-950/20 text-[#C2410C] dark:text-orange-400 cursor-pointer select-none font-semibold"
                      >
                        <div className="flex items-center space-x-1.5">
                          <span className="h-5 w-5 rounded-full bg-[#FFEBE0] dark:bg-orange-900/30 flex items-center justify-center font-bold text-[#C2410C] dark:text-orange-400 text-[10px]">₹</span>
                          <span>My today's total : Rs.{stats?.today_revenue || 0}</span>
                        </div>
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${statsExpanded ? 'rotate-180' : ''}`} />
                      </div>

                      {statsExpanded && (
                        <div className="px-9 py-2 bg-[#FFF9F6] dark:bg-orange-950/10 space-y-1.5 text-[11px] font-semibold text-[#C2410C] dark:text-orange-400/90 border-t border-[#FFEBE0]/50 dark:border-orange-950/30">
                          <div className="flex justify-between">
                            <span>Cash:</span>
                            <span>Rs.{stats?.today_revenue_split?.Cash || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>UPI:</span>
                            <span>Rs.{stats?.today_revenue_split?.UPI || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Card:</span>
                            <span>Rs.{stats?.today_revenue_split?.Card || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Insurance:</span>
                            <span>Rs.0</span>
                          </div>
                          <div className="flex justify-between pt-1.5 border-t border-[#FFEBE0]/50 dark:border-orange-950/30">
                            <span>Transaction count:</span>
                            <span>{stats?.recent_transactions?.length || 0}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Menu Options */}
                  <div className="py-1 text-slate-600 dark:text-slate-350 text-xs">
                    <button 
                      onClick={() => alert("My account is coming soon!")}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center space-x-2.5 font-medium transition-colors text-slate-600 dark:text-slate-300"
                    >
                      <User className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                      <span>My account</span>
                    </button>

                    <button 
                      onClick={() => alert("Lab account settings are coming soon!")}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center space-x-2.5 font-medium transition-colors text-slate-600 dark:text-slate-300"
                    >
                      <Microscope className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                      <span>Lab account</span>
                    </button>

                    <button 
                      onClick={() => alert("Setup a new lab is coming soon!")}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center space-x-2.5 font-medium transition-colors text-slate-600 dark:text-slate-300"
                    >
                      <PlusCircle className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                      <span>Setup a new lab</span>
                    </button>

                    <button 
                      onClick={() => alert("Referral program is coming soon!")}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center space-x-2.5 font-medium transition-colors text-slate-600 dark:text-slate-300"
                    >
                      <CircleDollarSign className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                      <span>Referral program</span>
                    </button>

                    <button 
                      onClick={() => alert("Subscription preferences are coming soon!")}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center space-x-2.5 font-medium transition-colors text-slate-600 dark:text-slate-300"
                    >
                      <Mail className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                      <span>Email subscription preferences</span>
                    </button>
                  </div>

                  {/* Navigation Switch */}
                  <div className="px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-605 dark:text-slate-350">
                    <span>Enable new navigation</span>
                    <button 
                      onClick={() => setNewNavigationEnabled(!newNavigationEnabled)}
                      className={`w-10 h-5.5 flex items-center rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${newNavigationEnabled ? 'bg-[#22C55E]' : 'bg-slate-200 dark:bg-slate-700'}`}
                    >
                      <div className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform duration-200 ${newNavigationEnabled ? 'translate-x-[18px]' : 'translate-x-0'}`}></div>
                    </button>
                  </div>

                  {/* Logout Option */}
                  <div className="py-1">
                    <button
                      onClick={logout}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-danger dark:hover:text-red-400 flex items-center space-x-2.5 transition-colors"
                    >
                      <LogOut className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </header>

        {/* Page contents */}
        <main className="flex-grow overflow-y-auto p-6 md:p-8 bg-slate-50 dark:bg-slate-900/50">
          {children}
        </main>
      </div>

    </div>
  );
}
