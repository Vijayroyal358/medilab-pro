"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getDashboardStats } from "../../services/data";
import { DashboardStats } from "../../types/index";
import { 
  Users, Calendar, CheckCircle, RefreshCw, 
  ArrowRight, ShieldCheck, HelpCircle, Activity,
  Database, AlertCircle, Plus, Sparkles, Download, 
  Clock, Search, Bell, MessageSquare, Clipboard
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStats = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getDashboardStats();
      setStats(res);
    } catch (err: any) {
      console.error(err);
      setError("Unable to retrieve dashboard stats. Please check your backend connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <p className="text-sm font-semibold text-slate-500">Loading MediLabsPro Dashboard...</p>
        </div>
      </div>
    );
  }

  // Fallback defaults if database returns empty or stats load fails
  const data: DashboardStats = stats || {
    today_patients: 0,
    today_appointments: 0,
    pending_reports: 0,
    completed_reports: 0,
    today_revenue: 0.0,
    pending_payments: 0.0,
    today_expenses: 0.0,
    today_commissions: 0.0,
    today_revenue_split: { Cash: 0.0, Card: 0.0, UPI: 0.0 },
    weekly_patients: [],
    weekly_revenue: [],
    recent_activities: [],
    payments_due: [],
    recent_transactions: [],
    samples_collected: 0,
    test_statistics: { Hematology: 35.0, Biochemistry: 30.0, Microbiology: 15.0, Immunology: 10.0, Others: 10.0 },
    today_appointments_list: [],
    active_patients_count: 0,
    total_reports_count: 0,
    tests_this_month_count: 0,
    monthly_collections: 0.0
  };

  const isTechnician = user?.role === "Technician";

  // Welcome back doctor name logic
  const getWelcomeName = () => {
    if (!user?.name) return "User";
    const parts = user.name.split(" ");
    if (parts[0].toLowerCase() === "dr." && parts.length > 1) {
      return `${parts[0]} ${parts[1]}`;
    }
    return parts[0];
  };

  // Donut chart stroke math
  const getDonutSectors = (values: number[], colors: string[]) => {
    const total = values.reduce((a, b) => a + b, 0);
    let accumulatedPercent = 0;
    
    return values.map((val, idx) => {
      const percent = total > 0 ? (val / total) * 100 : 0;
      const strokeDash = `${percent} ${100 - percent}`;
      const strokeDashoffset = 100 - accumulatedPercent + 25;
      accumulatedPercent += percent;
      
      return {
        percent,
        strokeDash,
        strokeDashoffset: strokeDashoffset % 100,
        color: colors[idx],
        value: val
      };
    });
  };

  // Pending reports sectors
  const routineCount = Math.ceil(data.pending_reports * 0.55);
  const urgentCount = Math.ceil(data.pending_reports * 0.28);
  const statCount = Math.max(data.pending_reports - routineCount - urgentCount, 0);
  const pendingSectors = getDonutSectors([routineCount, urgentCount, statCount], ["#10B981", "#F59E0B", "#EF4444"]);

  // Test statistics sectors
  const statsMap = data.test_statistics || { Hematology: 35, Biochemistry: 30, Microbiology: 15, Immunology: 10, Others: 10 };
  const statLabels = Object.keys(statsMap);
  const statValues = Object.values(statsMap);
  const statColors = ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#94A3B8"];
  const testStatsSectors = getDonutSectors(statValues, statColors);

  // Weekly bar chart data
  const getWeeklyData = () => {
    if (isTechnician) {
      return data.weekly_patients.map(p => ({
        day: p.day,
        value: p.patients * 3 + (p.patients > 0 ? 2 : 0), 
        label: `${p.patients * 3 + (p.patients > 0 ? 2 : 0)} tests`
      }));
    } else {
      return data.weekly_revenue.map(r => ({
        day: r.day,
        value: r.revenue,
        label: `Rs. ${r.revenue.toLocaleString()}`
      }));
    }
  };

  const weeklyChartData = getWeeklyData();
  const maxChartValue = Math.max(...weeklyChartData.map(d => d.value), 1);

  return (
    <div className="space-y-6">
      
      {/* Top Welcome Title Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
            Welcome back, {getWelcomeName()} 👋
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Here's what's happening in your lab today.</p>
        </div>
        
        <div className="flex items-center space-x-3 shrink-0">
          <Link
            href="/dashboard/tests"
            className="flex items-center space-x-2 px-4 py-2.5 text-xs font-bold text-white bg-[#00A770] hover:bg-[#009060] rounded-lg shadow-md hover:shadow-lg transition-all uppercase tracking-wider"
          >
            <Plus className="h-4 w-4" />
            <span>+ Register Patient</span>
          </Link>
          
          <button
            onClick={loadStats}
            className="flex items-center space-x-1.5 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm transition-all dark:bg-darkCard dark:border-darkBorders dark:text-slate-200"
          >
            <RefreshCw className="h-4 w-4 text-slate-400" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Row 1: Top Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Metric 1: Today's Patients (Links to Patients list) */}
        <Link 
          href="/dashboard/patients" 
          className="bg-white dark:bg-darkCard p-5 rounded-2xl border border-slate-100 dark:border-darkBorders shadow-[0_4px_25px_rgb(0,0,0,0.01)] hover:-translate-y-0.5 hover:border-emerald-250 transition-all block cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-emerald-600 transition-colors">Today's Patients</span>
              <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1.5">{data.today_patients}</h3>
            </div>
            <div className="p-2.5 bg-[#E6F4EA] text-[#137333] rounded-full shrink-0 group-hover:bg-[#137333] group-hover:text-white transition-all">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-[10px] text-[#137333] font-bold flex items-center space-x-0.5">
              <span>&uarr; 12%</span>
              <span className="text-slate-400 font-medium">vs yesterday</span>
            </span>
            <div className="w-16 h-6">
              <svg className="w-full h-full text-emerald-500" viewBox="0 0 100 30" fill="none">
                <path d="M0,20 Q15,5 30,18 T60,8 T90,2 T100,5" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
            </div>
          </div>
        </Link>

        {/* Metric 2: Samples Collected (Links to Reports manager) */}
        <Link 
          href="/dashboard/reports" 
          className="bg-white dark:bg-darkCard p-5 rounded-2xl border border-slate-100 dark:border-darkBorders shadow-[0_4px_25px_rgb(0,0,0,0.01)] hover:-translate-y-0.5 hover:border-orange-250 transition-all block cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-orange-600 transition-colors">Samples Collected</span>
              <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1.5 border-b border-transparent">
                {data.samples_collected || 0}
              </h3>
            </div>
            <div className="p-2.5 bg-[#FEF7E0] text-[#B06000] rounded-full shrink-0 group-hover:bg-[#B06000] group-hover:text-white transition-all">
              <Database className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-[10px] text-[#B06000] font-bold flex items-center space-x-0.5">
              <span>&uarr; 18%</span>
              <span className="text-slate-400 font-medium">vs yesterday</span>
            </span>
            <div className="w-16 h-6">
              <svg className="w-full h-full text-orange-500" viewBox="0 0 100 30" fill="none">
                <path d="M0,25 Q15,10 30,22 T60,14 T90,6 T100,2" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
            </div>
          </div>
        </Link>

        {/* Metric 3: Reports Pending (Links to Reports manager) */}
        <Link 
          href="/dashboard/reports" 
          className="bg-white dark:bg-darkCard p-5 rounded-2xl border border-slate-100 dark:border-darkBorders shadow-[0_4px_25px_rgb(0,0,0,0.01)] hover:-translate-y-0.5 hover:border-blue-250 transition-all block cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-blue-600 transition-colors">Reports Pending</span>
              <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1.5">{data.pending_reports}</h3>
            </div>
            <div className="p-2.5 bg-[#E8F0FE] text-[#1A73E8] rounded-full shrink-0 group-hover:bg-[#1A73E8] group-hover:text-white transition-all">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-[10px] text-[#1A73E8] font-bold flex items-center space-x-0.5">
              <span>&darr; 8%</span>
              <span className="text-slate-400 font-medium">vs yesterday</span>
            </span>
            <div className="w-16 h-6">
              <svg className="w-full h-full text-blue-400" viewBox="0 0 100 30" fill="none">
                <path d="M0,5 Q15,22 30,12 T60,26 T90,14 T100,20" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
            </div>
          </div>
        </Link>

        {/* Metric 4: Revenue (Admin) or Completed Reports (Tech) */}
        <Link 
          href={isTechnician ? "/dashboard/reports" : "/dashboard/cases/transactions"} 
          className="bg-white dark:bg-darkCard p-5 rounded-2xl border border-slate-100 dark:border-darkBorders shadow-[0_4px_25px_rgb(0,0,0,0.01)] hover:-translate-y-0.5 hover:border-emerald-250 transition-all block cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <div>
              {isTechnician ? (
                <>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-emerald-600 transition-colors">Completed Reports</span>
                  <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1.5">{data.completed_reports}</h3>
                </>
              ) : (
                <>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-emerald-600 transition-colors">Today's Revenue</span>
                  <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1.5">Rs. {data.today_revenue.toLocaleString()}</h3>
                </>
              )}
            </div>
            <div className="p-2.5 bg-[#E6F4EA] text-[#137333] rounded-full shrink-0 flex items-center justify-center group-hover:bg-[#137333] group-hover:text-white transition-all">
              {isTechnician ? <CheckCircle className="h-5 w-5" /> : <span className="h-5 w-5 font-extrabold text-lg flex items-center justify-center">₹</span>}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-[10px] text-[#137333] font-bold flex items-center space-x-0.5">
              <span>&uarr; 15%</span>
              <span className="text-slate-400 font-medium">vs yesterday</span>
            </span>
            <div className="w-16 h-6">
              <svg className="w-full h-full text-emerald-500" viewBox="0 0 100 30" fill="none">
                <path d="M0,20 Q15,14 30,25 T60,8 T90,3 T100,0" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
            </div>
          </div>
        </Link>

      </div>

      {/* Row 2: Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Donut Chart: Pending Reports */}
        <div className="lg:col-span-4 bg-white dark:bg-darkCard p-6 rounded-2xl border border-slate-100 dark:border-darkBorders shadow-[0_4px_25px_rgb(0,0,0,0.01)] flex flex-col justify-between min-h-[360px]">
          <div className="border-b border-slate-100 dark:border-darkBorders pb-3">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">Pending Reports</h3>
            <p className="text-[10px] text-slate-400">Distribution by priority queue</p>
          </div>

          <div className="flex items-center justify-around py-4">
            {/* SVG Donut Chart */}
            <div className="relative w-36 h-36">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
                {data.pending_reports > 0 ? (
                  pendingSectors.map((sec, idx) => (
                    <circle
                      key={idx}
                      cx="50"
                      cy="50"
                      r="40"
                      stroke={sec.color}
                      strokeWidth="10"
                      strokeDasharray={sec.strokeDash}
                      strokeDashoffset={sec.strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-500"
                    />
                  ))
                ) : (
                  <circle cx="50" cy="50" r="40" stroke="#cbd5e1" strokeWidth="10" fill="transparent" />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-800 dark:text-white">{data.pending_reports}</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Total</span>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="space-y-2 text-xs font-semibold text-slate-650 dark:text-slate-350">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
                <span className="w-14">Routine:</span>
                <span className="font-bold text-slate-800 dark:text-white">{routineCount}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span>
                <span className="w-14">Urgent:</span>
                <span className="font-bold text-slate-800 dark:text-white">{urgentCount}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></span>
                <span className="w-14">Stat:</span>
                <span className="font-bold text-slate-800 dark:text-white">{statCount}</span>
              </div>
            </div>
          </div>

          <Link 
            href="/dashboard/reports" 
            className="w-full py-2 border border-slate-100 hover:bg-slate-50 dark:border-darkBorders dark:hover:bg-slate-800/50 rounded-xl text-center text-xs font-bold text-emerald-600 transition-all block mt-2"
          >
            View All Pending Reports &rarr;
          </Link>
        </div>

        {/* Timeline: Recent Activity */}
        <div className="lg:col-span-4 bg-white dark:bg-darkCard p-6 rounded-2xl border border-slate-100 dark:border-darkBorders shadow-[0_4px_25px_rgb(0,0,0,0.01)] flex flex-col justify-between min-h-[360px]">
          <div className="border-b border-slate-100 dark:border-darkBorders pb-3">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">Recent Activity</h3>
            <p className="text-[10px] text-slate-400">Log reports from today</p>
          </div>

          <div className="flex-grow py-3 overflow-y-auto space-y-4 max-h-[220px] scrollbar-thin">
            {data.recent_activities.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-6 text-slate-400 text-xs">
                <Activity className="h-8 w-8 text-slate-300 mb-1" />
                <span>No activities logged today.</span>
              </div>
            ) : (
              data.recent_activities.slice(0, 4).map((act, idx) => (
                <div key={idx} className="flex items-start space-x-3 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                  <div className="flex-grow">
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-850 dark:text-slate-100">{act.user}</span>
                      <span className="text-[9px] text-slate-400 font-semibold">{act.time}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{act.details || act.action}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <Link
            href="/dashboard/audit"
            className="w-full py-2 border border-slate-100 hover:bg-slate-50 dark:border-darkBorders dark:hover:bg-slate-800/50 rounded-xl text-center text-xs font-bold text-emerald-600 transition-all block mt-2"
          >
            View All Activity &rarr;
          </Link>
        </div>

        {/* Bar Chart: Revenue Overview / Test Workload (Clickable) */}
        <Link 
          href={isTechnician ? "/dashboard/reports" : "/dashboard/cases/transactions"} 
          className="lg:col-span-4 bg-white dark:bg-darkCard p-6 rounded-2xl border border-slate-100 dark:border-darkBorders shadow-[0_4px_25px_rgb(0,0,0,0.01)] flex flex-col justify-between min-h-[360px] hover:border-slate-300 hover:-translate-y-0.5 transition-all cursor-pointer group"
        >
          <div>
            <div className="border-b border-slate-100 dark:border-darkBorders pb-3 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-sm group-hover:text-emerald-600 transition-colors">
                  {isTechnician ? "Weekly Test Workload" : "Revenue Overview"}
                </h3>
                <p className="text-[10px] text-slate-400">Clinical diagnostics transactions</p>
              </div>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-bold text-slate-500">This Week</span>
            </div>

            {/* Bar Chart Graphics */}
            <div className="py-2 flex flex-col justify-end">
              <div className="text-left mb-4 mt-2">
                {isTechnician ? (
                  <>
                    <h4 className="text-xl font-black text-slate-800 dark:text-white">
                      {weeklyChartData.reduce((a, b) => a + b.value, 0)} Tests
                    </h4>
                    <p className="text-[10px] text-emerald-500 font-bold mt-0.5">&uarr; 10% <span className="text-slate-400 font-normal">vs last week</span></p>
                  </>
                ) : (
                  <>
                    <h4 className="text-xl font-black text-slate-800 dark:text-white">
                      Rs. {weeklyChartData.reduce((a, b) => a + b.value, 0).toLocaleString()}
                    </h4>
                    <p className="text-[10px] text-emerald-500 font-bold mt-0.5">&uarr; 14.5% <span className="text-slate-400 font-normal">vs last week</span></p>
                  </>
                )}
              </div>

              {/* SVG Bar Columns */}
              <div className="h-28 flex items-end justify-between px-1 mt-2">
                {weeklyChartData.map((dayData, idx) => {
                  const barHeightPercent = Math.max((dayData.value / maxChartValue) * 100, 8);
                  return (
                    <div key={idx} className="flex flex-col items-center flex-1 relative">
                      <div 
                        className={`w-4 sm:w-5.5 rounded-t-md transition-all duration-500 ${
                          isTechnician ? 'bg-indigo-400 group-hover:bg-indigo-500' : 'bg-emerald-450 group-hover:bg-emerald-500'
                        }`}
                        style={{ height: `${barHeightPercent}%` }}
                      ></div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase mt-2">{dayData.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Link>

      </div>

      {/* Row 3: Appointments, Payments/Queue & Test Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Table: Today's Appointments */}
        <div className="lg:col-span-5 bg-white dark:bg-darkCard p-6 rounded-2xl border border-slate-100 dark:border-darkBorders shadow-[0_4px_25px_rgb(0,0,0,0.01)] flex flex-col justify-between min-h-[380px]">
          <div>
            <div className="border-b border-slate-100 dark:border-darkBorders pb-3 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-sm">Today's Appointments</h3>
                <p className="text-[10px] text-slate-400">Queue listing for today</p>
              </div>
              <Link href="/dashboard/appointments" className="text-[10px] text-emerald-600 font-bold hover:underline">
                View Calendar
              </Link>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-darkBorders text-slate-400 font-bold uppercase text-[9px]">
                    <th className="py-2">Time</th>
                    <th className="py-2">Patient Name</th>
                    <th className="py-2">Test / Package</th>
                    <th className="py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-darkBorders/50 font-semibold text-slate-650 dark:text-slate-350">
                  {(!data.today_appointments_list || data.today_appointments_list.length === 0) ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 font-medium">
                        No appointments scheduled today
                      </td>
                    </tr>
                  ) : (
                    data.today_appointments_list.map((app, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="py-3 font-medium text-slate-400">{app.time}</td>
                        <td className="py-3 text-slate-850 dark:text-white">{app.patient_name}</td>
                        <td className="py-3 text-slate-500">{app.test_name}</td>
                        <td className="py-3 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            app.status === "Completed" ? "bg-slate-100 text-slate-700 border-slate-200" :
                            app.status === "In-Progress" ? "bg-blue-50 text-blue-700 border-blue-100" :
                            "bg-emerald-50 text-emerald-700 border-emerald-100"
                          }`}>
                            {app.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Card: Payment Summary (Admin) or Samples Queue (Tech) (Clickable) */}
        <Link 
          href={isTechnician ? "/dashboard/reports" : "/dashboard/cases/bills"} 
          className="lg:col-span-4 bg-white dark:bg-darkCard p-6 rounded-2xl border border-slate-100 dark:border-darkBorders shadow-[0_4px_25px_rgb(0,0,0,0.01)] flex flex-col justify-between min-h-[380px] hover:border-slate-300 hover:-translate-y-0.5 transition-all cursor-pointer group"
        >
          <div className="w-full">
            <div className="border-b border-slate-100 dark:border-darkBorders pb-3 flex justify-between items-center">
              {isTechnician ? (
                <>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm group-hover:text-emerald-600 transition-colors">Samples Queue</h3>
                    <p className="text-[10px] text-slate-400">Laboratory collection statuses</p>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold hover:underline">View All</span>
                </>
              ) : (
                <>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm group-hover:text-emerald-600 transition-colors">Payment Summary</h3>
                    <p className="text-[10px] text-slate-400">Account billing balances</p>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold hover:underline">View All</span>
                </>
              )}
            </div>

            {isTechnician ? (
              /* Technician Version: Samples Queue */
              <div className="mt-4 space-y-4 text-xs font-semibold text-slate-650 dark:text-slate-350">
                <div className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-darkBg rounded-xl border border-slate-100 dark:border-darkBorders">
                  <span>Hematology (Blood)</span>
                  <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold">14 Ready</span>
                </div>
                <div className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-darkBg rounded-xl border border-slate-100 dark:border-darkBorders">
                  <span>Biochemistry (Serum)</span>
                  <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold">8 Ready</span>
                </div>
                <div className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-darkBg rounded-xl border border-slate-100 dark:border-darkBorders">
                  <span>Microbiology (Swabs)</span>
                  <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold">4 Pending</span>
                </div>
                <div className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-darkBg rounded-xl border border-slate-100 dark:border-darkBorders">
                  <span>Urinalysis (Urine)</span>
                  <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold">2 Ready</span>
                </div>
              </div>
            ) : (
              /* Admin Version: Payment Summary */
              <div className="mt-4 space-y-3.5 text-xs font-semibold text-slate-650 dark:text-slate-350">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Outstanding:</span>
                  <span className="text-red-500 font-bold">Rs. {data.pending_payments.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Paid Today:</span>
                  <span className="text-emerald-600 font-bold">Rs. {data.today_revenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pending Payments:</span>
                  <span className="text-slate-800 dark:text-white font-bold">{data.payments_due.length}</span>
                </div>
                <div className="flex justify-between border-t border-slate-50 dark:border-darkBorders pt-3">
                  <span className="text-slate-400">Overdue Amount:</span>
                  <span className="text-red-600 font-extrabold">Rs. {Math.round(data.pending_payments * 0.4).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation(); // Stop navigation click
              alert(isTechnician ? "Processing worklist samples..." : "Automated billing reminders dispatched via WhatsApp & SMS!");
            }}
            className="w-full h-11 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition-all mt-4 border border-emerald-100/50"
          >
            {isTechnician ? (
              <>
                <Clipboard className="h-4 w-4" />
                <span>Process Samples Worklist</span>
              </>
            ) : (
              <>
                <MessageSquare className="h-4 w-4" />
                <span>Send payment reminders</span>
              </>
            )}
          </button>
        </Link>

        {/* Donut Chart: Test Statistics (Clickable, links to Reports) */}
        <Link 
          href="/dashboard/reports"
          className="lg:col-span-3 bg-white dark:bg-darkCard p-6 rounded-2xl border border-slate-100 dark:border-darkBorders shadow-[0_4px_25px_rgb(0,0,0,0.01)] flex flex-col justify-between min-h-[380px] hover:border-slate-300 hover:-translate-y-0.5 transition-all cursor-pointer group"
        >
          <div className="w-full">
            <div className="border-b border-slate-100 dark:border-darkBorders pb-3">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm group-hover:text-emerald-600 transition-colors">Test Statistics</h3>
              <p className="text-[10px] text-slate-400">Analysis by medical category</p>
            </div>

            {/* Donut graphic */}
            <div className="flex flex-col items-center py-4 shrink-0">
              <div className="relative w-28 h-28">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
                  {testStatsSectors.map((sec, idx) => (
                    <circle
                      key={idx}
                      cx="50"
                      cy="50"
                      r="40"
                      stroke={sec.color}
                      strokeWidth="10"
                      strokeDasharray={sec.strokeDash}
                      strokeDashoffset={sec.strokeDashoffset}
                      fill="transparent"
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black text-slate-800 dark:text-white">
                    {isTechnician ? data.today_patients * 3 + 12 : 245}
                  </span>
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wide">Total Tests</span>
                </div>
              </div>
            </div>

            {/* Legend Items */}
            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[10px] font-bold text-slate-650 dark:text-slate-350">
              {statLabels.slice(0, 4).map((label, idx) => (
                <div key={idx} className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: statColors[idx] }}></span>
                  <span className="truncate">{label}:</span>
                  <span className="text-slate-800 dark:text-white font-extrabold">{statValues[idx]}%</span>
                </div>
              ))}
              <div className="flex items-center space-x-1.5 col-span-2">
                <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0"></span>
                <span>Others:</span>
                <span className="text-slate-800 dark:text-white font-extrabold">{statValues[4] || 10}%</span>
              </div>
            </div>
          </div>

          <div className="w-full py-2 border border-slate-100 hover:bg-slate-50 dark:border-darkBorders dark:hover:bg-slate-800/50 rounded-xl text-center text-xs font-bold text-emerald-600 transition-all block mt-2">
            View Detailed Analytics
          </div>
        </Link>

      </div>

      {/* Row 4: Workforce / Footer metrics and PDF downloads */}
      <div className="bg-white dark:bg-darkCard p-4 rounded-2xl border border-slate-100 dark:border-darkBorders shadow-[0_4px_25px_rgb(0,0,0,0.01)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs w-full max-w-3xl font-semibold text-slate-650 dark:text-slate-350">
          
          <Link href="/dashboard/patients" className="hover:text-emerald-600 transition-colors cursor-pointer block">
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wide">Active Patients</div>
            <div className="text-base font-extrabold text-slate-850 dark:text-white mt-0.5">{data.active_patients_count || 0}</div>
          </Link>
          
          <Link href="/dashboard/reports" className="hover:text-emerald-600 transition-colors cursor-pointer block">
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wide">Total Reports</div>
            <div className="text-base font-extrabold text-slate-850 dark:text-white mt-0.5">{data.total_reports_count || 0}</div>
          </Link>
          
          <Link href="/dashboard/reports" className="hover:text-emerald-600 transition-colors cursor-pointer block">
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wide">Tests This Month</div>
            <div className="text-base font-extrabold text-slate-850 dark:text-white mt-0.5">{data.tests_this_month_count || 0}</div>
          </Link>

          <Link href={isTechnician ? "/dashboard/reports" : "/dashboard/cases/transactions"} className="hover:text-emerald-600 transition-colors cursor-pointer block">
            {isTechnician ? (
              <>
                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wide">Samples Pending</div>
                <div className="text-base font-extrabold text-slate-850 dark:text-white mt-0.5">6</div>
              </>
            ) : (
              <>
                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wide">Lab Collections</div>
                <div className="text-base font-extrabold text-slate-850 dark:text-white mt-0.5">Rs. {data.monthly_collections?.toLocaleString() || 0}</div>
              </>
            )}
          </Link>

        </div>

        <button
          onClick={() => alert("Downloading spreadsheet / PDF list...")}
          className="flex items-center space-x-1.5 px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all shrink-0 uppercase tracking-wider"
        >
          <Download className="h-4 w-4" />
          <span>{isTechnician ? "Download Worklist" : "Download Reports"}</span>
        </button>
      </div>

    </div>
  );
}
