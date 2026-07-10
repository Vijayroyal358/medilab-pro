"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, FlaskConical, Phone, Mail, Chrome } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

type Tab = "email" | "otp" | "google";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("email");

  // Email tab
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  // OTP tab
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Redirect if already logged in
  useEffect(() => {
    const t = localStorage.getItem("medilab_access_token");
    const user = JSON.parse(localStorage.getItem("medilab_user") || "{}");
    if (t) {
      router.push(user.role === "Software Admin" ? "/superadmin" : "/dashboard");
    }
  }, []);

  // Google GSI
  useEffect(() => {
    if (tab !== "google" || !GOOGLE_CLIENT_ID) return;
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.onload = () => {
      (window as any).google?.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleToken,
      });
      (window as any).google?.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline", size: "large", width: "100%", text: "signin_with",
      });
    };
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, [tab]);

  const saveAuth = (data: any) => {
    localStorage.setItem("medilab_access_token", data.access_token);
    localStorage.setItem("medilab_refresh_token", data.refresh_token);
    localStorage.setItem("medilab_user", JSON.stringify({ name: data.name, role: data.role, lab_id: data.lab_id }));
    localStorage.setItem("medilab_lab_name", data.lab_name);
    router.push(data.role === "Software Admin" ? "/superadmin" : "/dashboard");
  };

  const loginEmail = async () => {
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "Invalid credentials"); return; }
      saveAuth(data);
    } catch { setError("Connection failed. Please try again."); }
    finally { setLoading(false); }
  };

  const sendOtp = async () => {
    if (!phone) { setError("Enter your phone number."); return; }
    setLoading(true); setError("");
    const res = await fetch(`${API}/auth/otp/send`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.detail || "Failed to send OTP"); setLoading(false); return; }
    setOtpSent(true); setLoading(false);
  };

  const verifyOtp = async () => {
    setLoading(true); setError("");
    const res = await fetch(`${API}/auth/otp/verify`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, otp_code: otp.join("") }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.detail || "Invalid OTP"); setLoading(false); return; }
    saveAuth(data);
  };

  const handleGoogleToken = async (resp: any) => {
    setLoading(true); setError("");
    const res = await fetch(`${API}/auth/google`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: resp.credential }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.detail || "Google login failed"); setLoading(false); return; }
    saveAuth(data);
  };

  const otpInput = (val: string, idx: number) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[idx] = val;
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
    if (!val && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "email", label: "Email", icon: <Mail className="w-4 h-4" /> },
    { id: "otp", label: "Mobile OTP", icon: <Phone className="w-4 h-4" /> },
    { id: "google", label: "Google", icon: <Chrome className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl inline-flex items-center justify-center mb-4 shadow-lg shadow-emerald-900/40">
            <FlaskConical className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">MediLabs Pro</h1>
          <p className="text-slate-500 text-sm mt-1">Laboratory Information System</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-7 shadow-2xl">
          <h2 className="text-lg font-bold text-white mb-1">Welcome back</h2>
          <p className="text-slate-400 text-sm mb-6">Sign in to your account to continue</p>

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-900 rounded-xl p-1 mb-6">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setError(""); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  tab === t.id
                    ? "bg-emerald-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          {/* Email Tab */}
          {tab === "email" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && loginEmail()}
                  placeholder="you@example.com"
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && loginEmail()}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 pr-11 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                onClick={loginEmail}
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </div>
          )}

          {/* OTP Tab */}
          {tab === "otp" && (
            <div className="space-y-4">
              {!otpSent ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Mobile Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && sendOtp()}
                      placeholder="+91 98765 43210"
                      className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={sendOtp}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-md disabled:opacity-60"
                  >
                    {loading ? "Sending…" : "Send OTP"}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-slate-400 text-sm text-center">Enter the 6-digit OTP sent to <span className="text-white font-bold">{phone}</span></p>
                  <div className="flex gap-2 justify-center">
                    {otp.map((d, i) => (
                      <input
                        key={i}
                        ref={el => { otpRefs.current[i] = el; }}
                        type="text" inputMode="numeric" maxLength={1} value={d}
                        onChange={e => otpInput(e.target.value, i)}
                        className="w-11 h-12 bg-slate-900 border border-slate-600 rounded-xl text-center text-white text-lg font-bold focus:outline-none focus:border-emerald-500 transition-all"
                      />
                    ))}
                  </div>
                  <button
                    onClick={verifyOtp}
                    disabled={loading || otp.some(d => !d)}
                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-md disabled:opacity-60"
                  >
                    {loading ? "Verifying…" : "Verify & Sign In"}
                  </button>
                  <button onClick={() => { setOtpSent(false); setOtp(["","","","","",""]); }} className="w-full text-slate-500 text-sm hover:text-slate-300 transition-colors">
                    ← Change number
                  </button>
                </>
              )}
            </div>
          )}

          {/* Google Tab */}
          {tab === "google" && (
            <div className="flex flex-col items-center gap-4">
              <p className="text-slate-400 text-sm text-center">Sign in with your Google account linked to your MediLabs profile.</p>
              <div ref={googleBtnRef} className="w-full" />
              {!GOOGLE_CLIENT_ID && (
                <p className="text-yellow-500 text-xs text-center">Google login is not configured for this instance.</p>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          © {new Date().getFullYear()} MediLabs Pro. All rights reserved.
        </p>
      </div>
    </div>
  );
}
