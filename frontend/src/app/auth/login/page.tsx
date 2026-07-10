"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { forgotPassword, resetPassword } from "../../../services/auth";
import { apiFetch } from "../../../services/api";
import {
  ShieldAlert, Mail, Lock, Phone, ChevronRight,
  Loader2, Eye, EyeOff, ArrowLeft, CheckCircle2, AlertCircle
} from "lucide-react";

type AuthMode = "login" | "forgot" | "reset";
type LoginTab = "email" | "otp" | "google";

// ── Declare google global (added by the GSI script) ──────────────────────────
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          renderButton: (el: HTMLElement, opts: object) => void;
          prompt: () => void;
        };
      };
    };
  }
}

// ── Helper: call backend Google endpoint ─────────────────────────────────────
async function googleAuthBackend(idToken: string, labSlug: string) {
  return apiFetch<any>(`/auth/google?lab_slug=${labSlug}`, {
    method: "POST",
    body: JSON.stringify({ id_token: idToken }),
  });
}

async function otpSend(phone: string, labSlug: string) {
  return apiFetch<{ message: string }>(`/auth/otp/send?lab_slug=${labSlug}`, {
    method: "POST",
    body: JSON.stringify({ phone }),
  });
}

async function otpVerify(phone: string, otp: string, labSlug: string) {
  return apiFetch<any>(`/auth/otp/verify?lab_slug=${labSlug}`, {
    method: "POST",
    body: JSON.stringify({ phone, otp }),
  });
}

// ── Main LoginForm ────────────────────────────────────────────────────────────
function LoginForm() {
  const { login, user, loading, setAuthFromToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPatientPortal = searchParams.get("portal") === "true";
  const urlLab = searchParams.get("lab");

  const [mode, setMode] = useState<AuthMode>("login");
  const [loginTab, setLoginTab] = useState<LoginTab>("email");

  // Email/pass
  const [labSlug, setLabSlug] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // OTP flow
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [otpStep, setOtpStep] = useState<"phone" | "code">("phone");
  const [otpCountdown, setOtpCountdown] = useState(0);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Forgot / Reset
  const [forgotEmail, setForgotEmail] = useState("");
  const [demoResetToken, setDemoResetToken] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // UX
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Google button div ref
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  // ── Guard: enforce lab slug ─────────────────────────────────────────────────
  useEffect(() => {
    const storedLab = localStorage.getItem("medilab_lab_slug");
    const activeLab = urlLab || storedLab;
    if (!activeLab) {
      const portalParam = isPatientPortal ? "?portal=true" : "";
      router.push(`/auth/select-lab${portalParam}`);
    } else {
      setLabSlug(activeLab);
      if (urlLab) localStorage.setItem("medilab_lab_slug", urlLab);
    }
  }, [urlLab, router, isPatientPortal]);

  // ── Redirect if already logged in ──────────────────────────────────────────
  useEffect(() => {
    if (!loading && user) {
      router.push(user.role === "Patient" ? "/portal" : "/dashboard");
    }
  }, [user, loading, router]);

  // ── OTP Countdown ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setTimeout(() => setOtpCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  // ── Load Google Identity Services script ────────────────────────────────────
  useEffect(() => {
    if (loginTab !== "google" || !GOOGLE_CLIENT_ID || !googleBtnRef.current) return;

    const initGoogle = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: any) => {
          setSubmitting(true);
          setFormError("");
          try {
            const data = await googleAuthBackend(response.credential, labSlug);
            handleAuthSuccess(data);
          } catch (err: any) {
            setFormError(err.message || "Google login failed.");
          } finally {
            setSubmitting(false);
          }
        },
      });
      if (googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          type: "standard",
          shape: "rectangular",
          theme: "outline",
          text: "signin_with",
          size: "large",
          logo_alignment: "left",
          width: 320,
        });
      }
    };

    if (window.google) {
      initGoogle();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.body.appendChild(script);
    }
  }, [loginTab, GOOGLE_CLIENT_ID, labSlug]);

  // ── Auth success handler (shared by all methods) ────────────────────────────
  const handleAuthSuccess = (data: any) => {
    localStorage.setItem("medilab_access_token", data.access_token);
    localStorage.setItem("medilab_refresh_token", data.refresh_token);
    localStorage.setItem("medilab_user", JSON.stringify({
      name: data.name,
      role: data.role,
      lab_id: data.lab_id,
    }));
    if (setAuthFromToken) setAuthFromToken(data);
    router.push(data.role === "Patient" ? "/portal" : "/dashboard");
  };

  // ── Email/Password login ────────────────────────────────────────────────────
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!email || !password || !labSlug) { setFormError("All fields are required."); return; }
    setSubmitting(true);
    try {
      await login({ email, password, remember_me: rememberMe }, labSlug);
    } catch (err: any) {
      setFormError(err.message || "Failed to log in. Please verify credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── OTP: Send ───────────────────────────────────────────────────────────────
  const handleOtpSend = async () => {
    if (!phone.trim()) { setFormError("Please enter a mobile number."); return; }
    setFormError("");
    setSubmitting(true);
    try {
      await otpSend(phone, labSlug);
      setOtpStep("code");
      setOtpCountdown(30);
      setSuccessMsg("OTP sent! (Check backend console in dev mode)");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setFormError(err.message || "Failed to send OTP.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── OTP: Verify ─────────────────────────────────────────────────────────────
  const handleOtpVerify = async () => {
    const code = otpCode.join("");
    if (code.length < 6) { setFormError("Enter the 6-digit OTP."); return; }
    setFormError("");
    setSubmitting(true);
    try {
      const data = await otpVerify(phone, code, labSlug);
      handleAuthSuccess(data);
    } catch (err: any) {
      setFormError(err.message || "Incorrect OTP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── OTP digit input handler ──────────────────────────────────────────────────
  const handleOtpDigit = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otpCode];
    next[idx] = val;
    setOtpCode(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpCode[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  // ── Forgot/Reset ─────────────────────────────────────────────────────────────
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(""); setSuccessMsg("");
    if (!forgotEmail || !labSlug) { setFormError("Email and lab identifier are required."); return; }
    setSubmitting(true);
    try {
      const res = await forgotPassword({ email: forgotEmail, lab_slug: labSlug });
      setSuccessMsg("Reset link generated.");
      if (res.demo_token) { setDemoResetToken(res.demo_token); setResetToken(res.demo_token); }
    } catch (err: any) {
      setFormError(err.message || "Failed to request password reset.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(""); setSuccessMsg("");
    if (!resetToken || !newPassword) { setFormError("Token and new password are required."); return; }
    if (newPassword.length < 6) { setFormError("Password must be at least 6 characters."); return; }
    setSubmitting(true);
    try {
      await resetPassword({ token: resetToken, new_password: newPassword });
      setSuccessMsg("Password updated. You can now log in.");
      setTimeout(() => { setMode("login"); setFormError(""); setSuccessMsg(""); }, 2000);
    } catch (err: any) {
      setFormError(err.message || "Failed to reset password.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Quick demo login ─────────────────────────────────────────────────────────
  const handleQuickLogin = (role: string) => {
    const map: Record<string, [string, string]> = {
      admin: ["admin@medilab.pro", "Admin@123"],
      receptionist: ["receptionist@medilab.pro", "Reception@123"],
      technician: ["technician@medilab.pro", "Tech@123"],
      doctor: ["doctor@medilab.pro", "Doctor@123"],
    };
    if (map[role]) { setEmail(map[role][0]); setPassword(map[role][1]); setLoginTab("email"); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  // ── Common left-side branding panel ─────────────────────────────────────────
  const BrandPanel = () => (
    <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-black text-lg leading-none">MediLabs</p>
          <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">PRO LIMS</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black leading-snug">
            Staff access<br />
            <span className="text-emerald-400">secured &amp; isolated</span><br />
            per laboratory.
          </h1>
          <p className="mt-3 text-slate-300 text-sm leading-relaxed">
            Each lab has its own tenant. Only registered staff can log in.
            Patients have a separate portal login.
          </p>
        </div>

        <div className="space-y-3">
          {[
            { icon: "🔒", text: "Email / Password login" },
            { icon: "📱", text: "Mobile OTP — no password needed" },
            { icon: "🔵", text: "Sign in with Google" },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/10">
              <span className="text-lg">{f.icon}</span>
              <span className="text-sm font-semibold">{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-slate-500 text-xs">© 2026 MediLabsPro · Lab Management System</p>
    </div>
  );

  // ── FORGOT PASSWORD FORM ──────────────────────────────────────────────────────
  if (mode === "forgot" || mode === "reset") {
    return (
      <div className="min-h-screen grid lg:grid-cols-2">
        <BrandPanel />
        <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-darkBg min-h-screen lg:min-h-0">
          <div className="w-full max-w-md space-y-7">
            <button onClick={() => { setMode("login"); setFormError(""); setSuccessMsg(""); }}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to login
            </button>

            <div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white">
                {mode === "forgot" ? "Reset your password" : "Set new password"}
              </h2>
              <p className="text-xs text-slate-400 font-semibold mt-1">
                {mode === "forgot"
                  ? "Enter your staff email address and we'll generate a reset link."
                  : "Enter the token from the reset link and choose a new password."}
              </p>
            </div>

            {formError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-xs font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0" /> {formError}
              </div>
            )}
            {successMsg && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-xs font-semibold">
                <CheckCircle2 className="h-4 w-4 shrink-0" /> {successMsg}
              </div>
            )}

            {mode === "forgot" ? (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <Field label="Staff Email" icon={<Mail className="h-4 w-4" />}>
                  <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                    placeholder="you@lab.com"
                    className="input-field" />
                </Field>
                {demoResetToken && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                    <p className="font-black mb-1">⚠️ Dev Mode Token (check console in production)</p>
                    <code className="break-all text-[10px]">{demoResetToken}</code>
                    <button type="button" onClick={() => setMode("reset")}
                      className="mt-2 w-full py-1.5 bg-amber-500 text-white rounded-lg font-bold text-xs">
                      Proceed to Reset Password →
                    </button>
                  </div>
                )}
                <button type="submit" disabled={submitting}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : "Send Reset Link"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <Field label="Reset Token">
                  <input type="text" value={resetToken} onChange={e => setResetToken(e.target.value)}
                    className="input-field font-mono text-xs" />
                </Field>
                <Field label="New Password" icon={<Lock className="h-4 w-4" />}>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters" className="input-field" />
                </Field>
                <button type="submit" disabled={submitting}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : "Update Password"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN LOGIN ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <BrandPanel />

      <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-darkBg min-h-screen lg:min-h-0">
        <div className="w-full max-w-md space-y-7">

          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-4 lg:hidden">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center">
                <ShieldAlert className="w-4 w-4 text-white" />
              </div>
              <span className="font-black text-slate-800 dark:text-white">MediLabs PRO</span>
            </div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white">Staff Login</h2>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              Lab: <span className="text-emerald-600 font-bold">{labSlug || "…"}</span>
              {" · "}
              <button onClick={() => router.push("/auth/select-lab")}
                className="text-slate-400 hover:text-slate-600 underline transition-colors">Switch lab</button>
            </p>
          </div>

          {/* Login method tabs */}
          <div className="flex rounded-xl border border-slate-200 dark:border-darkBorders overflow-hidden text-xs font-bold">
            {(["email", "otp", "google"] as LoginTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => { setLoginTab(tab); setFormError(""); }}
                className={`flex-1 py-2.5 transition-all ${
                  loginTab === tab
                    ? "bg-emerald-600 text-white"
                    : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {tab === "email" ? "📧 Email" : tab === "otp" ? "📱 Mobile OTP" : "🔵 Google"}
              </button>
            ))}
          </div>

          {/* Error / success */}
          {formError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-xs font-semibold">
              <AlertCircle className="h-4 w-4 shrink-0" /> {formError}
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-xs font-semibold">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> {successMsg}
            </div>
          )}

          {/* ── TAB: Email / Password ─────────────────────────────────────────── */}
          {loginTab === "email" && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <Field label="Email Address" icon={<Mail className="h-4 w-4" />}>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@lab.com" autoComplete="username" className="input-field" />
              </Field>

              <Field label="Password" icon={<Lock className="h-4 w-4" />}>
                <div className="relative">
                  <input type={showPwd ? "text" : "password"} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" autoComplete="current-password"
                    className="input-field pr-10" />
                  <button type="button" onClick={() => setShowPwd(p => !p)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>

              <div className="flex items-center justify-between text-xs font-semibold">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 dark:text-slate-300">
                  <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                    className="rounded" />
                  Remember me
                </label>
                <button type="button" onClick={() => { setMode("forgot"); setFormError(""); setSuccessMsg(""); }}
                  className="text-emerald-600 hover:underline">
                  Forgot password?
                </button>
              </div>

              <button type="submit" disabled={submitting}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-md">
                {submitting
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</>
                  : <>Sign in <ChevronRight className="h-4 w-4" /></>}
              </button>

              {/* Demo quick-fill */}
              {!isPatientPortal && (
                <div className="border-t border-slate-100 dark:border-darkBorders pt-4">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Demo accounts</p>
                  <div className="flex flex-wrap gap-2">
                    {["admin", "receptionist", "technician", "doctor"].map(role => (
                      <button key={role} type="button" onClick={() => handleQuickLogin(role)}
                        className="px-2.5 py-1.5 text-[10px] font-bold uppercase border border-slate-200 dark:border-darkBorders rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors capitalize">
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          )}

          {/* ── TAB: Mobile OTP ──────────────────────────────────────────────── */}
          {loginTab === "otp" && (
            <div className="space-y-5">
              {otpStep === "phone" ? (
                <>
                  <Field label="Mobile Number" icon={<Phone className="h-4 w-4" />}>
                    <input type="tel" value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="input-field"
                      onKeyDown={e => e.key === "Enter" && handleOtpSend()} />
                  </Field>
                  <p className="text-[11px] text-slate-400 font-semibold -mt-2">
                    Must be the number registered with your lab account.
                  </p>
                  <button onClick={handleOtpSend} disabled={submitting}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-md">
                    {submitting
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending OTP...</>
                      : <>Send OTP <ChevronRight className="h-4 w-4" /></>}
                  </button>
                </>
              ) : (
                <>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-bold text-slate-700 dark:text-white">Enter 6-digit OTP</p>
                    <p className="text-xs text-slate-400 font-semibold">Sent to {phone}</p>
                  </div>

                  {/* OTP digit boxes */}
                  <div className="flex justify-center gap-2">
                    {otpCode.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={el => { otpRefs.current[idx] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpDigit(idx, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(idx, e)}
                        className="w-11 h-13 text-center text-xl font-black border-2 rounded-xl border-slate-200 dark:border-darkBorders bg-slate-50 dark:bg-darkBg focus:border-emerald-500 focus:outline-none transition-colors"
                      />
                    ))}
                  </div>

                  <button onClick={handleOtpVerify} disabled={submitting || otpCode.join("").length < 6}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-md">
                    {submitting
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</>
                      : <>Verify & Sign in <ChevronRight className="h-4 w-4" /></>}
                  </button>

                  <div className="flex items-center justify-between text-xs font-semibold">
                    <button onClick={() => { setOtpStep("phone"); setOtpCode(["","","","","",""]); setFormError(""); }}
                      className="flex items-center gap-1 text-slate-500 hover:text-slate-700">
                      <ArrowLeft className="h-3.5 w-3.5" /> Change number
                    </button>
                    {otpCountdown > 0 ? (
                      <span className="text-slate-400">Resend in {otpCountdown}s</span>
                    ) : (
                      <button onClick={handleOtpSend} className="text-emerald-600 hover:underline">
                        Resend OTP
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── TAB: Google ────────────────────────────────────────────────────── */}
          {loginTab === "google" && (
            <div className="space-y-5">
              {GOOGLE_CLIENT_ID ? (
                <>
                  <p className="text-xs text-slate-500 font-semibold text-center">
                    Sign in with the Google account registered for this lab.
                    Only active staff emails are accepted.
                  </p>
                  <div className="flex justify-center">
                    <div ref={googleBtnRef} id="google-signin-btn" />
                  </div>
                  {submitting && (
                    <div className="flex justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center space-y-3">
                  <p className="text-2xl">🔵</p>
                  <p className="text-sm font-black text-amber-800">Google Login Not Configured</p>
                  <p className="text-xs text-amber-700 font-semibold leading-relaxed">
                    Set <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> in your{" "}
                    <code className="bg-amber-100 px-1 rounded">.env.local</code> file.
                  </p>
                  <div className="text-left bg-white rounded-xl border border-amber-100 p-3 text-[11px] font-mono text-slate-600 space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Setup Steps:</p>
                    <p>1. Go to console.cloud.google.com</p>
                    <p>2. Create project → Enable Google Identity API</p>
                    <p>3. Create OAuth 2.0 Client ID (Web Application)</p>
                    <p>4. Add <span className="text-emerald-600">http://localhost:3000</span> as Authorized Origin</p>
                    <p>5. Copy Client ID → paste in .env.local</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Patient portal link */}
          {!isPatientPortal && (
            <p className="text-center text-xs text-slate-400 font-semibold">
              Patient?{" "}
              <a href="/auth/login?portal=true" className="text-emerald-600 font-bold hover:underline">
                Go to Patient Portal →
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Field wrapper helper ──────────────────────────────────────────────────────
function Field({ label, icon, children }: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
        {icon && <span className="text-slate-400">{icon}</span>}
        {label}
      </label>
      {children}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
