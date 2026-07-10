"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  LayoutDashboard, FlaskConical, Users, CreditCard, History, Settings,
  Search, Bell, ChevronDown, MoreVertical, Building2, ClipboardCheck, ShieldCheck,
  CheckCircle2, XCircle
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // Data States
  const [stats, setStats] = useState({
    total_laboratories: 0,
    total_staff: 0,
    total_tests: 0,
    tests_processed: 0,
    active_services: 0
  });
  const [labs, setLabs] = useState<any[]>([]);
  const [recentStaff, setRecentStaff] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    const t = localStorage.getItem("medilab_access_token");
    const up = JSON.parse(localStorage.getItem("medilab_user") || "{}");
    if (!t || up.role !== "Software Admin") { router.push("/auth/login"); return; }
    setToken(t);
    setUserProfile(up);
    fetchData(t);
  }, []);

  const headers = (t: string) => ({ Authorization: `Bearer ${t}`, "Content-Type": "application/json" });

  const fetchData = async (t: string) => {
    setLoading(true);
    try {
      const [statsRes, labsRes, staffRes, activityRes] = await Promise.all([
        fetch(`${API}/superadmin/dashboard-stats`, { headers: headers(t) }),
        fetch(`${API}/superadmin/labs`, { headers: headers(t) }),
        fetch(`${API}/superadmin/recent-staff`, { headers: headers(t) }),
        fetch(`${API}/superadmin/recent-activity`, { headers: headers(t) })
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (labsRes.ok) setLabs(await labsRes.json());
      if (staffRes.ok) setRecentStaff(await staffRes.json());
      if (activityRes.ok) setActivity(await activityRes.json());
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    router.push("/auth/login");
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] text-slate-800 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#00A770] rounded-xl flex items-center justify-center text-white shrink-0">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <div className="font-extrabold text-[#00A770] text-lg leading-tight tracking-tight">MediLab Pro</div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Lab Management System</div>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          <SidebarItem icon={<LayoutDashboard size={18} />} label="Dashboard" active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} />
          <SidebarItem icon={<FlaskConical size={18} />} label="Laboratories" active={activeTab === "labs"} onClick={() => setActiveTab("labs")} />
          <SidebarItem icon={<Users size={18} />} label="Staff Management" active={activeTab === "staff"} onClick={() => setActiveTab("staff")} />
          <SidebarItem icon={<CreditCard size={18} />} label="Plans & Billing" active={activeTab === "billing"} onClick={() => setActiveTab("billing")} />
          <SidebarItem icon={<History size={18} />} label="Activity Log" active={activeTab === "activity"} onClick={() => setActiveTab("activity")} />
        </nav>
        
        <div className="p-4 mt-auto">
          <SidebarItem icon={<Settings size={18} />} label="Settings" active={activeTab === "settings"} onClick={() => setActiveTab("settings")} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800">Welcome back, {userProfile?.name?.split(" ")[0] || "Admin"} <span className="text-2xl">👋</span></h1>
            <p className="text-sm text-slate-500 mt-1">Here's what's happening across your network today.</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-9 pr-12 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00A770]/20 focus:border-[#00A770] transition-all w-64"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-400 shadow-sm">
                ⌘K
              </div>
            </div>
            
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200 cursor-pointer" onClick={logout}>
              <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border border-slate-300">
                <img src="https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff" alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800 leading-tight">{userProfile?.name || "Admin User"}</div>
                <div className="text-xs text-slate-500">{userProfile?.role || "Super Admin"}</div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </header>

        {/* Dashboard Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex h-full items-center justify-center text-slate-400">Loading dashboard data...</div>
          ) : (
            <div className="space-y-8 max-w-7xl mx-auto">
              
              {/* Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <MetricCard 
                  icon={<Building2 className="w-5 h-5 text-emerald-600" />} 
                  iconBg="bg-emerald-100"
                  label="Total Laboratories" 
                  value={stats.total_laboratories} 
                  subtext="All labs in network" 
                />
                <MetricCard 
                  icon={<Users className="w-5 h-5 text-purple-600" />} 
                  iconBg="bg-purple-100"
                  label="Total Staff" 
                  value={stats.total_staff} 
                  subtext="Across all laboratories" 
                />
                <MetricCard 
                  icon={<FlaskConical className="w-5 h-5 text-blue-600" />} 
                  iconBg="bg-blue-100"
                  label="Total Tests" 
                  value={stats.total_tests.toLocaleString()} 
                  subtext="Total tests created" 
                />
                <MetricCard 
                  icon={<ClipboardCheck className="w-5 h-5 text-orange-600" />} 
                  iconBg="bg-orange-100"
                  label="Tests Processed" 
                  value={stats.tests_processed.toLocaleString()} 
                  subtext="Completed tests" 
                />
                <MetricCard 
                  icon={<ShieldCheck className="w-5 h-5 text-[#00A770]" />} 
                  iconBg="bg-emerald-100"
                  label="Active Services" 
                  value={stats.active_services} 
                  subtext="Active subscriptions" 
                />
              </div>

              {/* Tables Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Laboratories Table */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
                    <h2 className="text-base font-extrabold text-slate-800">Laboratories Overview</h2>
                    <button className="text-xs font-bold text-slate-500 hover:text-[#00A770] px-3 py-1.5 border border-slate-200 rounded-lg hover:border-[#00A770]/30 transition-all">View all</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="px-6 py-3 font-bold">Laboratory</th>
                          <th className="px-6 py-3 font-bold">Owner</th>
                          <th className="px-6 py-3 font-bold text-center">Staff</th>
                          <th className="px-6 py-3 font-bold text-center">Status</th>
                          <th className="px-6 py-3 font-bold text-center">Plan</th>
                          <th className="px-6 py-3 font-bold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {labs.slice(0, 5).map(lab => (
                          <tr key={lab.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                                  <Building2 className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="font-bold text-slate-800">{lab.name}</div>
                                  <div className="text-xs text-slate-500">{lab.address || "Location unavailable"}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-800">{lab.owner_name || "—"}</div>
                              <div className="text-xs text-slate-500">{lab.owner_email || "—"}</div>
                            </td>
                            <td className="px-6 py-4 text-center font-bold text-slate-700">{lab.staff_count}</td>
                            <td className="px-6 py-4 text-center">
                              <StatusBadge active={lab.is_active} />
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-xs font-semibold text-slate-600">{lab.subscription_plan}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Staff Directory */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
                    <h2 className="text-base font-extrabold text-slate-800">Staff Directory</h2>
                    <button className="text-xs font-bold text-slate-500 hover:text-[#00A770] px-3 py-1.5 border border-slate-200 rounded-lg hover:border-[#00A770]/30 transition-all">View all</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="px-6 py-3 font-bold">Staff Member</th>
                          <th className="px-6 py-3 font-bold">Role</th>
                          <th className="px-6 py-3 font-bold">Laboratory</th>
                          <th className="px-6 py-3 font-bold text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {recentStaff.map(staff => (
                          <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                                  <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(staff.name)}&background=random`} alt={staff.name} />
                                </div>
                                <div>
                                  <div className="font-bold text-slate-800">{staff.name}</div>
                                  <div className="text-xs text-slate-500">{staff.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs font-semibold text-slate-600">{staff.role}</span>
                            </td>
                            <td className="px-6 py-4 text-slate-600 text-xs font-medium">{staff.lab_name}</td>
                            <td className="px-6 py-4 text-center">
                              <StatusBadge active={staff.is_active} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* Recent Activity */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-8">
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
                  <h2 className="text-base font-extrabold text-slate-800">Recent Activity</h2>
                  <button className="text-xs font-bold text-slate-500 hover:text-[#00A770] px-3 py-1.5 border border-slate-200 rounded-lg hover:border-[#00A770]/30 transition-all">View all</button>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    {activity.map((act, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            act.type === 'lab_created' ? 'bg-emerald-50 text-emerald-600' :
                            act.type === 'staff_added' ? 'bg-blue-50 text-blue-600' :
                            'bg-purple-50 text-purple-600'
                          }`}>
                            {act.type === 'lab_created' ? <Building2 className="w-4 h-4" /> :
                             act.type === 'staff_added' ? <Users className="w-4 h-4" /> :
                             <History className="w-4 h-4" />}
                          </div>
                          {i !== activity.length - 1 && <div className="w-px h-full bg-slate-100 mt-2"></div>}
                        </div>
                        <div className="pb-2 flex-1 flex justify-between items-start">
                          <div>
                            <div className="text-sm font-bold text-slate-800">{act.title}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{act.description}</div>
                          </div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {new Date(act.timestamp).toLocaleDateString()} {new Date(act.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                      </div>
                    ))}
                    {activity.length === 0 && <div className="text-sm text-slate-500">No recent activity found.</div>}
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === "settings" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm max-w-2xl">
                <h2 className="text-xl font-extrabold text-slate-800 mb-6 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-slate-400" />
                  Account Settings
                </h2>
                
                <div className="border-t border-slate-100 pt-6">
                  <h3 className="text-sm font-bold text-slate-700 mb-4">Change Password</h3>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const old_password = (form.elements.namedItem('old_password') as HTMLInputElement).value;
                    const new_password = (form.elements.namedItem('new_password') as HTMLInputElement).value;
                    
                    try {
                      const res = await fetch(`${API}/auth/me/password`, {
                        method: 'PATCH',
                        headers: headers(token!),
                        body: JSON.stringify({ old_password, new_password })
                      });
                      if (res.ok) {
                        alert("Password updated successfully!");
                        form.reset();
                      } else {
                        const data = await res.json();
                        alert(data.detail || "Failed to update password");
                      }
                    } catch (err) {
                      alert("An error occurred");
                    }
                  }} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Current Password</label>
                      <input name="old_password" type="password" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A770]/20 focus:border-[#00A770]" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">New Password</label>
                      <input name="new_password" type="password" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A770]/20 focus:border-[#00A770]" />
                    </div>
                    <button type="submit" className="px-6 py-2.5 bg-[#00A770] hover:bg-[#009060] text-white font-extrabold text-xs rounded-xl shadow-md transition-all uppercase tracking-wider mt-2">
                      Update Password
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  </div>
);
}

// Helper Components

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        active 
          ? "bg-emerald-50 text-[#00A770] font-extrabold" 
          : "text-slate-500 font-semibold hover:bg-slate-50 hover:text-slate-700"
      }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
}

function MetricCard({ icon, iconBg, label, value, subtext }: { icon: React.ReactNode, iconBg: string, label: string, value: string | number, subtext: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          {icon}
        </div>
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</div>
          <div className="text-2xl font-extrabold text-slate-800 leading-none">{value}</div>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-slate-100 text-xs font-medium text-slate-500">
        {subtext}
      </div>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  if (active) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-extrabold tracking-wide uppercase border border-emerald-100/50">
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-extrabold tracking-wide uppercase border border-red-100/50">
      Inactive
    </span>
  );
}
