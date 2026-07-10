"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, FlaskConical, Users, CreditCard, History, Settings,
  Search, Bell, ChevronDown, MoreVertical, Building2, ClipboardCheck, ShieldCheck,
  Plus, X, CheckCircle, XCircle, ChevronRight, Trash2, Menu
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
const PLANS = ["Trial", "Basic", "Professional", "Enterprise"];
const ROLES = ["Lab Owner", "Lab Admin", "Receptionist", "Technician", "Doctor"];

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Data
  const [stats, setStats] = useState({ total_laboratories: 0, total_staff: 0, total_tests: 0, tests_processed: 0, active_services: 0 });
  const [labs, setLabs] = useState<any[]>([]);
  const [allStaff, setAllStaff] = useState<any[]>([]);
  const [recentStaff, setRecentStaff] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modals
  const [showCreateLab, setShowCreateLab] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [labForm, setLabForm] = useState({ name: "", address: "", phone: "", email: "", owner_name: "", owner_email: "", owner_phone: "" });
  const [staffForm, setStaffForm] = useState({ name: "", email: "", phone: "", role: "Receptionist", lab_id: "" });
  const [formMsg, setFormMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Dropdown (... menu)
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Search
  const [labSearch, setLabSearch] = useState("");
  const [staffSearch, setStaffSearch] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("medilab_access_token");
    const up = JSON.parse(localStorage.getItem("medilab_user") || "{}");
    if (!t || up.role !== "Software Admin") { router.push("/auth/login"); return; }
    setToken(t);
    setUserProfile(up);
    fetchData(t);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const hdr = (t: string) => ({ Authorization: `Bearer ${t}`, "Content-Type": "application/json" });

  const fetchData = async (t: string) => {
    setLoading(true);
    try {
      const [s, l, st, a, allSt] = await Promise.all([
        fetch(`${API}/superadmin/dashboard-stats`, { headers: hdr(t) }),
        fetch(`${API}/superadmin/labs`, { headers: hdr(t) }),
        fetch(`${API}/superadmin/recent-staff`, { headers: hdr(t) }),
        fetch(`${API}/superadmin/recent-activity`, { headers: hdr(t) }),
        fetch(`${API}/superadmin/recent-staff`, { headers: hdr(t) }), // reuse for now
      ]);
      if (s.ok) setStats(await s.json());
      if (l.ok) setLabs(await l.json());
      if (st.ok) { const d = await st.json(); setRecentStaff(d); setAllStaff(d); }
      if (a.ok) setActivity(await a.json());
    } catch (err) {
      console.error("Failed to load dashboard", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLabs = async () => {
    const res = await fetch(`${API}/superadmin/labs`, { headers: hdr(token!) });
    if (res.ok) setLabs(await res.json());
  };

  const createLab = async () => {
    setSubmitting(true); setFormMsg(null);
    const res = await fetch(`${API}/superadmin/labs`, {
      method: "POST", headers: hdr(token!), body: JSON.stringify(labForm),
    });
    const data = await res.json();
    if (res.ok) {
      setFormMsg({ text: `Lab created! Owner temp password: ${data.temp_password}`, ok: true });
      setLabForm({ name: "", address: "", phone: "", email: "", owner_name: "", owner_email: "", owner_phone: "" });
      fetchLabs();
    } else {
      setFormMsg({ text: data.detail || "Failed to create lab", ok: false });
    }
    setSubmitting(false);
  };

  const addStaff = async () => {
    if (!staffForm.lab_id) { setFormMsg({ text: "Please select a lab.", ok: false }); return; }
    setSubmitting(true); setFormMsg(null);
    const res = await fetch(`${API}/superadmin/labs/${staffForm.lab_id}/staff`, {
      method: "POST", headers: hdr(token!), body: JSON.stringify(staffForm),
    });
    const data = await res.json();
    if (res.ok) {
      setFormMsg({ text: `Staff added! Temp password: ${staffForm.name.split(" ")[0]}@Staff1`, ok: true });
      setStaffForm({ name: "", email: "", phone: "", role: "Receptionist", lab_id: "" });
      fetchData(token!);
    } else {
      setFormMsg({ text: data.detail || "Failed to add staff", ok: false });
    }
    setSubmitting(false);
  };

  const toggleLabActive = async (lab: any) => {
    await fetch(`${API}/superadmin/labs/${lab.id}`, {
      method: "PATCH", headers: hdr(token!), body: JSON.stringify({ is_active: !lab.is_active }),
    });
    fetchLabs();
    setOpenDropdown(null);
  };

  const updateLabPlan = async (lab: any, plan: string) => {
    await fetch(`${API}/superadmin/labs/${lab.id}`, {
      method: "PATCH", headers: hdr(token!), body: JSON.stringify({ subscription_plan: plan }),
    });
    fetchLabs();
    setOpenDropdown(null);
  };

  const toggleStaffActive = async (staff: any) => {
    await fetch(`${API}/superadmin/labs/${staff.lab_id}/staff/${staff.id}`, {
      method: "PATCH", headers: hdr(token!), body: JSON.stringify({ is_active: !staff.is_active }),
    });
    fetchData(token!);
  };

  const deleteLab = async (lab: any) => {
    if (!confirm(`Are you sure you want to completely delete "${lab.name}" and all of its associated data (patients, staff, tests, reports)? This action CANNOT be undone.`)) return;
    
    try {
      const res = await fetch(`${API}/superadmin/labs/${lab.id}`, {
        method: "DELETE",
        headers: hdr(token!),
      });
      if (res.ok) {
        alert("Laboratory and all associated data deleted successfully.");
        fetchLabs();
        setOpenDropdown(null);
      } else {
        const d = await res.json();
        alert(d.detail || "Failed to delete laboratory.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while deleting the laboratory.");
    }
  };

  const deleteStaff = async (staff: any) => {
    if (!confirm(`Are you sure you want to delete staff member "${staff.name}"?`)) return;
    
    try {
      const res = await fetch(`${API}/superadmin/labs/${staff.lab_id}/staff/${staff.id}`, {
        method: "DELETE",
        headers: hdr(token!),
      });
      if (res.ok) {
        alert("Staff member deleted successfully.");
        fetchData(token!);
      } else {
        const d = await res.json();
        alert(d.detail || "Failed to delete staff member.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while deleting the staff member.");
    }
  };

  const logout = () => { localStorage.clear(); router.push("/auth/login"); };

  const filteredLabs = labs.filter(l =>
    l.name.toLowerCase().includes(labSearch.toLowerCase()) ||
    (l.owner_name || "").toLowerCase().includes(labSearch.toLowerCase())
  );

  const filteredStaff = allStaff.filter(s =>
    s.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(staffSearch.toLowerCase()) ||
    s.role.toLowerCase().includes(staffSearch.toLowerCase()) ||
    s.lab_name.toLowerCase().includes(staffSearch.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] text-slate-800 font-sans relative">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#00A770] rounded-xl flex items-center justify-center text-white shrink-0">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <div className="font-extrabold text-[#00A770] text-lg leading-tight">MediLab Pro</div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Lab Management System</div>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          <SidebarItem icon={<LayoutDashboard size={18} />} label="Dashboard" active={activeTab === "dashboard"} onClick={() => { setActiveTab("dashboard"); setSidebarOpen(false); }} />
          <SidebarItem icon={<FlaskConical size={18} />} label="Laboratories" active={activeTab === "labs"} onClick={() => { setActiveTab("labs"); setSidebarOpen(false); }} />
          <SidebarItem icon={<Users size={18} />} label="Staff Management" active={activeTab === "staff"} onClick={() => { setActiveTab("staff"); setSidebarOpen(false); }} />
          <SidebarItem icon={<CreditCard size={18} />} label="Plans & Billing" active={activeTab === "billing"} onClick={() => { setActiveTab("billing"); setSidebarOpen(false); }} />
          <SidebarItem icon={<History size={18} />} label="Activity Log" active={activeTab === "activity"} onClick={() => { setActiveTab("activity"); setSidebarOpen(false); }} />
        </nav>
        <div className="p-4 mt-auto">
          <SidebarItem icon={<Settings size={18} />} label="Settings" active={activeTab === "settings"} onClick={() => { setActiveTab("settings"); setSidebarOpen(false); }} />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-auto min-h-[5rem] py-4 md:py-0 md:h-20 bg-white border-b border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between px-8 gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg md:hidden">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 flex items-center gap-2">
                Welcome back, {userProfile?.name?.split(" ")[0] || "Admin"} 👋
              </h1>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">Here's what's happening across your network today.</p>
            </div>
          </div>
          <div className="flex items-center justify-between w-full md:w-auto gap-6">
            <button className="relative p-2 text-slate-400 hover:text-slate-600">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200 cursor-pointer text-left flex-shrink-0" onClick={logout}>
              <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border border-slate-300">
                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.name || "Admin")}&background=0D8ABC&color=fff`} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-bold text-slate-800 leading-tight">{userProfile?.name || "Admin"}</div>
                <div className="text-xs text-slate-500">{userProfile?.role || "Super Admin"}</div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex h-full items-center justify-center text-slate-400">Loading...</div>
          ) : (
            <div className="space-y-8 max-w-7xl mx-auto">

              {/* ── DASHBOARD ── */}
              {activeTab === "dashboard" && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <MetricCard icon={<Building2 className="w-5 h-5 text-emerald-600" />} iconBg="bg-emerald-100" label="Total Laboratories" value={stats.total_laboratories} subtext="All labs in network" />
                    <MetricCard icon={<Users className="w-5 h-5 text-purple-600" />} iconBg="bg-purple-100" label="Total Staff" value={stats.total_staff} subtext="Across all laboratories" />
                    <MetricCard icon={<FlaskConical className="w-5 h-5 text-blue-600" />} iconBg="bg-blue-100" label="Total Tests" value={stats.total_tests.toLocaleString()} subtext="Total tests created" />
                    <MetricCard icon={<ClipboardCheck className="w-5 h-5 text-orange-600" />} iconBg="bg-orange-100" label="Tests Processed" value={stats.tests_processed.toLocaleString()} subtext="Completed tests" />
                    <MetricCard icon={<ShieldCheck className="w-5 h-5 text-[#00A770]" />} iconBg="bg-emerald-100" label="Active Services" value={stats.active_services} subtext="Active subscriptions" />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Labs preview */}
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                      <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                        <h2 className="text-base font-extrabold text-slate-800">Laboratories Overview</h2>
                        <button onClick={() => setActiveTab("labs")} className="text-xs font-bold text-[#00A770] flex items-center gap-1">View all <ChevronRight className="w-3 h-3" /></button>
                      </div>
                      <LabTable labs={labs.slice(0, 5)} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} dropdownRef={dropdownRef} onToggle={toggleLabActive} onPlan={updateLabPlan} plans={PLANS} onDelete={deleteLab} />
                    </div>
                    {/* Staff preview */}
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                      <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                        <h2 className="text-base font-extrabold text-slate-800">Staff Directory</h2>
                        <button onClick={() => setActiveTab("staff")} className="text-xs font-bold text-[#00A770] flex items-center gap-1">View all <ChevronRight className="w-3 h-3" /></button>
                      </div>
                      <StaffTable staff={recentStaff.slice(0, 5)} onToggle={toggleStaffActive} onDelete={deleteStaff} />
                    </div>
                  </div>

                  {/* Activity */}
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-8">
                    <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                      <h2 className="text-base font-extrabold text-slate-800">Recent Activity</h2>
                    </div>
                    <div className="p-6 space-y-6">
                      {activity.length === 0 && <p className="text-sm text-slate-500">No recent activity.</p>}
                      {activity.map((act, i) => (
                        <div key={i} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${act.type === "lab_created" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"}`}>
                              {act.type === "lab_created" ? <Building2 className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                            </div>
                            {i !== activity.length - 1 && <div className="w-px flex-1 bg-slate-100 mt-2" />}
                          </div>
                          <div className="pb-2 flex-1 flex justify-between items-start">
                            <div>
                              <div className="text-sm font-bold text-slate-800">{act.title}</div>
                              <div className="text-xs text-slate-500 mt-0.5">{act.description}</div>
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">
                              {new Date(act.timestamp).toLocaleDateString()} {new Date(act.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ── LABORATORIES TAB ── */}
              {activeTab === "labs" && (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-lg font-extrabold text-slate-800">All Laboratories <span className="text-slate-400 font-normal text-sm">({labs.length})</span></h2>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input value={labSearch} onChange={e => setLabSearch(e.target.value)} placeholder="Search labs..." className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#00A770] w-full sm:w-56" />
                      </div>
                      <button onClick={() => { setShowCreateLab(true); setFormMsg(null); }} className="flex items-center justify-center gap-2 bg-[#00A770] hover:bg-[#009060] text-white font-bold text-sm px-4 py-2 rounded-xl transition-all">
                        <Plus className="w-4 h-4" /> New Lab
                      </button>
                    </div>
                  </div>
                  {filteredLabs.length === 0 ? (
                    <div className="flex flex-col items-center py-16 text-slate-400">
                      <Building2 className="w-12 h-12 mb-3 opacity-30" />
                      <p className="font-semibold">No laboratories found</p>
                      <p className="text-sm mt-1">Create your first lab using the button above.</p>
                    </div>
                  ) : (
                    <LabTable labs={filteredLabs} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} dropdownRef={dropdownRef} onToggle={toggleLabActive} onPlan={updateLabPlan} plans={PLANS} onDelete={deleteLab} />
                  )}
                </div>
              )}

              {/* ── STAFF MANAGEMENT TAB ── */}
              {activeTab === "staff" && (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-lg font-extrabold text-slate-800">Staff Management <span className="text-slate-400 font-normal text-sm">({allStaff.length})</span></h2>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input value={staffSearch} onChange={e => setStaffSearch(e.target.value)} placeholder="Search staff..." className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#00A770] w-full sm:w-56" />
                      </div>
                      <button onClick={() => { setShowAddStaff(true); setFormMsg(null); }} className="flex items-center justify-center gap-2 bg-[#00A770] hover:bg-[#009060] text-white font-bold text-sm px-4 py-2 rounded-xl transition-all">
                        <Plus className="w-4 h-4" /> Add Staff
                      </button>
                    </div>
                  </div>
                  {filteredStaff.length === 0 ? (
                    <div className="flex flex-col items-center py-16 text-slate-400">
                      <Users className="w-12 h-12 mb-3 opacity-30" />
                      <p className="font-semibold">No staff members found</p>
                    </div>
                  ) : (
                    <StaffTable staff={filteredStaff} onToggle={toggleStaffActive} onDelete={deleteStaff} />
                  )}
                </div>
              )}

              {/* ── ACTIVITY LOG TAB ── */}
              {activeTab === "activity" && (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-6 py-5 border-b border-slate-100">
                    <h2 className="text-lg font-extrabold text-slate-800">Activity Log</h2>
                  </div>
                  <div className="p-6 space-y-6">
                    {activity.length === 0 && <p className="text-sm text-slate-500">No activity recorded yet.</p>}
                    {activity.map((act, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${act.type === "lab_created" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"}`}>
                            {act.type === "lab_created" ? <Building2 className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                          </div>
                          {i !== activity.length - 1 && <div className="w-px flex-1 bg-slate-100 mt-2" />}
                        </div>
                        <div className="pb-2 flex-1 flex justify-between items-start">
                          <div>
                            <div className="text-sm font-bold text-slate-800">{act.title}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{act.description}</div>
                          </div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">
                            {new Date(act.timestamp).toLocaleDateString()} {new Date(act.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── SETTINGS TAB ── */}
              {activeTab === "settings" && (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm max-w-2xl">
                  <h2 className="text-xl font-extrabold text-slate-800 mb-6 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-slate-400" /> Account Settings
                  </h2>
                  <div className="border-t border-slate-100 pt-6">
                    <h3 className="text-sm font-bold text-slate-700 mb-4">Change Password</h3>
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const old_password = (form.elements.namedItem("old_password") as HTMLInputElement).value;
                      const new_password = (form.elements.namedItem("new_password") as HTMLInputElement).value;
                      try {
                        const res = await fetch(`${API}/auth/me/password`, { method: "PATCH", headers: hdr(token!), body: JSON.stringify({ old_password, new_password }) });
                        if (res.ok) { alert("Password updated!"); form.reset(); }
                        else { const d = await res.json(); alert(d.detail || "Failed"); }
                      } catch { alert("An error occurred"); }
                    }} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Current Password</label>
                        <input name="old_password" type="password" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00A770]" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">New Password</label>
                        <input name="new_password" type="password" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00A770]" />
                      </div>
                      <button type="submit" className="px-6 py-2.5 bg-[#00A770] hover:bg-[#009060] text-white font-extrabold text-xs rounded-xl transition-all uppercase tracking-wider">
                        Update Password
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* ── BILLING PLACEHOLDER ── */}
              {activeTab === "billing" && (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 shadow-sm flex flex-col items-center text-center">
                  <CreditCard className="w-14 h-14 text-slate-300 mb-4" />
                  <h2 className="text-xl font-extrabold text-slate-700 mb-2">Plans & Billing</h2>
                  <p className="text-slate-400 text-sm">Billing management is coming soon. You can currently update each lab's plan from the Laboratories tab.</p>
                </div>
              )}

            </div>
          )}
        </div>
      </main>

      {/* ── CREATE LAB MODAL ── */}
      {showCreateLab && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-slate-800">Create New Laboratory</h3>
              <button onClick={() => setShowCreateLab(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {formMsg && <div className={`p-3 rounded-xl text-sm font-medium ${formMsg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{formMsg.text}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Lab Name *</label>
                  <input value={labForm.name} onChange={e => setLabForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Central Diagnostics" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00A770] text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Phone</label>
                  <input value={labForm.phone} onChange={e => setLabForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 ..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00A770] text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Email</label>
                  <input value={labForm.email} onChange={e => setLabForm(f => ({ ...f, email: e.target.value }))} placeholder="lab@example.com" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00A770] text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Address</label>
                  <input value={labForm.address} onChange={e => setLabForm(f => ({ ...f, address: e.target.value }))} placeholder="Street, City, State" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00A770] text-sm" />
                </div>
                <div className="col-span-2 border-t border-slate-100 pt-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Lab Owner Account</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Owner Name *</label>
                  <input value={labForm.owner_name} onChange={e => setLabForm(f => ({ ...f, owner_name: e.target.value }))} placeholder="Dr. John Smith" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00A770] text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Owner Email *</label>
                  <input value={labForm.owner_email} onChange={e => setLabForm(f => ({ ...f, owner_email: e.target.value }))} placeholder="owner@lab.com" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00A770] text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Owner Phone</label>
                  <input value={labForm.owner_phone} onChange={e => setLabForm(f => ({ ...f, owner_phone: e.target.value }))} placeholder="+91 ..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00A770] text-sm" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowCreateLab(false)} className="px-5 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={createLab} disabled={submitting || !labForm.name || !labForm.owner_name || !labForm.owner_email} className="px-5 py-2 bg-[#00A770] hover:bg-[#009060] disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all">
                {submitting ? "Creating..." : "Create Lab"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD STAFF MODAL ── */}
      {showAddStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-slate-800">Add Staff Member</h3>
              <button onClick={() => setShowAddStaff(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {formMsg && <div className={`p-3 rounded-xl text-sm font-medium ${formMsg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{formMsg.text}</div>}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Laboratory *</label>
                <select value={staffForm.lab_id} onChange={e => setStaffForm(f => ({ ...f, lab_id: e.target.value }))} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00A770] text-sm">
                  <option value="">Select lab...</option>
                  {labs.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Full Name *</label>
                <input value={staffForm.name} onChange={e => setStaffForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Doe" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00A770] text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Email *</label>
                <input value={staffForm.email} onChange={e => setStaffForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@lab.com" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00A770] text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Phone</label>
                <input value={staffForm.phone} onChange={e => setStaffForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 ..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00A770] text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Role *</label>
                <select value={staffForm.role} onChange={e => setStaffForm(f => ({ ...f, role: e.target.value }))} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00A770] text-sm">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowAddStaff(false)} className="px-5 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={addStaff} disabled={submitting || !staffForm.lab_id || !staffForm.name || !staffForm.email} className="px-5 py-2 bg-[#00A770] hover:bg-[#009060] disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all">
                {submitting ? "Adding..." : "Add Staff"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ── Shared Table Components ────────────────────────────────────────────────────

function LabTable({ labs, openDropdown, setOpenDropdown, dropdownRef, onToggle, onPlan, plans, onDelete }: any) {
  return (
    <div className="overflow-x-auto" ref={dropdownRef}>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <th className="px-6 py-3">Laboratory</th>
            <th className="px-6 py-3">Owner</th>
            <th className="px-6 py-3 text-center">Staff</th>
            <th className="px-6 py-3 text-center">Status</th>
            <th className="px-6 py-3 text-center">Plan</th>
            <th className="px-6 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {labs.map((lab: any) => (
            <tr key={lab.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0"><Building2 className="w-4 h-4" /></div>
                  <div>
                    <div className="font-bold text-slate-800">{lab.name}</div>
                    <div className="text-xs text-slate-500">{lab.address || "—"}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="font-bold text-slate-800">{lab.owner_name || "—"}</div>
                <div className="text-xs text-slate-500">{lab.owner_email || "—"}</div>
              </td>
              <td className="px-6 py-4 text-center font-bold text-slate-700">{lab.staff_count}</td>
              <td className="px-6 py-4 text-center"><StatusBadge active={lab.is_active} /></td>
              <td className="px-6 py-4 text-center text-xs font-semibold text-slate-600">{lab.subscription_plan}</td>
              <td className="px-6 py-4 text-right">
                <div className="relative inline-block text-left">
                  <button
                    onClick={() => { setOpenDropdown(openDropdown === lab.id ? null : lab.id); }}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {openDropdown === lab.id && (
                    <div className="absolute right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 min-w-[180px] py-1 text-slate-700">
                      <button
                        onClick={() => onToggle(lab)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                      >
                        {lab.is_active ? <XCircle className="w-4 h-4 text-red-500" /> : <CheckCircle className="w-4 h-4 text-emerald-500" />}
                        {lab.is_active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => onDelete(lab)}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-b border-slate-100 pb-2"
                      >
                        <Trash2 className="w-4 h-4" /> Delete Lab
                      </button>
                      <div className="px-4 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider pt-2">Change Plan</div>
                      {plans.map((p: string) => (
                        <button key={p} onClick={() => onPlan(lab, p)} className={`w-full px-4 py-1.5 text-left text-xs hover:bg-slate-50 flex items-center justify-between ${lab.subscription_plan === p ? "text-[#00A770] font-bold" : "text-slate-600"}`}>
                          <span>{p} Plan</span>
                          {lab.subscription_plan === p && <span className="w-1.5 h-1.5 rounded-full bg-[#00A770]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StaffTable({ staff, onToggle, onDelete }: { staff: any[]; onToggle: (s: any) => void; onDelete: (s: any) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <th className="px-6 py-3">Staff Member</th>
            <th className="px-6 py-3">Role</th>
            <th className="px-6 py-3">Laboratory</th>
            <th className="px-6 py-3 text-center">Status</th>
            <th className="px-6 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {staff.map((s: any) => (
            <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=random`} alt={s.name} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{s.name}</div>
                    <div className="text-xs text-slate-500">{s.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-xs font-semibold text-slate-600">{s.role}</td>
              <td className="px-6 py-4 text-xs font-medium text-slate-600">{s.lab_name}</td>
              <td className="px-6 py-4 text-center"><StatusBadge active={s.is_active} /></td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onToggle(s)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all border ${s.is_active ? "text-red-600 bg-red-50 border-red-100 hover:bg-red-100" : "text-emerald-600 bg-emerald-50 border-emerald-100 hover:bg-emerald-100"}`}
                  >
                    {s.is_active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => onDelete(s)}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                    title="Delete Staff"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Simple Helpers ─────────────────────────────────────────────────────────────

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${active ? "bg-emerald-50 text-[#00A770] font-extrabold" : "text-slate-500 font-semibold hover:bg-slate-50 hover:text-slate-700"}`}>
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
}

function MetricCard({ icon, iconBg, label, value, subtext }: { icon: React.ReactNode; iconBg: string; label: string; value: string | number; subtext: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>{icon}</div>
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</div>
          <div className="text-2xl font-extrabold text-slate-800 leading-none">{value}</div>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-slate-100 text-xs font-medium text-slate-500">{subtext}</div>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-extrabold uppercase border border-emerald-100/50">Active</span>
  ) : (
    <span className="inline-flex items-center px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-extrabold uppercase border border-red-100/50">Inactive</span>
  );
}
