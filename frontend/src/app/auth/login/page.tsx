"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

type Tab = "email" | "otp" | "google";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("email");
  const [labSlug, setLabSlug] = useState("");
  const [labName, setLabName] = useState("");
  const [labChecked, setLabChecked] = useState(false);
  const [labError, setLabError] = useState("");

  // Email tab
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // OTP tab
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Check if already logged in
  useEffect(() => {
    const t = localStorage.getItem("medilab_access_token");
    const user = JSON.parse(localStorage.getItem("medilab_user") || "{}");
    if (t) {
      if (user.role === "Software Admin") router.push("/superadmin");
      else router.push("/dashboard");
    }
  }, []);

  // Load saved lab slug
  useEffect(() => {
    const saved = localStorage.getItem("medilab_lab_slug");
    if (saved) { setLabSlug(saved); verifySlug(saved); }
  }, []);

  // Google GSI
  useEffect(() => {
    if (tab !== "google" || !GOOGLE_CLIENT_ID || !labChecked) return;
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
  }, [tab, labChecked]);

  const verifySlug = async (slug: string) => {
    if (!slug.trim()) return;
    // Software Admin bypasses slug check
    if (slug === "superadmin") { setLabName("Software Admin"); setLabChecked(true); return; }
    setLabError("");
    const res = await fetch(`${API}/auth/verify-slug?slug=${slug}`);
    if (res.ok) {
      const d = await res.json();
      setLabName(d.lab_name);
      setLabChecked(true);
      localStorage.setItem("medilab_lab_slug", slug);
    } else {
      setLabError("Lab not found. Check your Lab ID.");
      setLabChecked(false);
      setLabName("");
    }
  };

  const saveAuth = (data: any) => {
    localStorage.setItem("medilab_access_token", data.access_token);
    localStorage.setItem("medilab_refresh_token", data.refresh_token);
    localStorage.setItem("medilab_user", JSON.stringify({ name: data.name, role: data.role, lab_id: data.lab_id }));
    localStorage.setItem("medilab_lab_name", data.lab_name);
    if (data.role === "Software Admin") router.push("/superadmin");
    else router.push("/dashboard");
  };

  const loginEmail = async () => {
    setLoading(true); setError("");
    try {
      const slug = email === "superadmin@medilab.pro" ? "" : labSlug;
      const res = await fetch(`${API}/auth/login?lab_slug=${slug}`, {
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
    setLoading(true); setError("");
    const res = await fetch(`${API}/auth/otp/send?lab_slug=${labSlug}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.detail || "Failed to send OTP"); setLoading(false); return; }
    setOtpSent(true); setLoading(false);
  };

  const verifyOtp = async () => {
    setLoading(true); setError("");
    const res = await fetch(`${API}/auth/otp/verify?lab_slug=${labSlug}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, otp_code: otp.join("") }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.detail || "Invalid OTP"); setLoading(false); return; }
    saveAuth(data);
  };

  const handleGoogleToken = async (resp: any) => {
    setLoading(true); setError("");
    const res = await fetch(`${API}/auth/google?lab_slug=${labSlug}`, {
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

  const inp: React.CSSProperties = {
    width: "100%", background: "#1e293b", border: "1px solid #334155",
    borderRadius: 10, padding: "12px 14px", color: "#f1f5f9", fontSize: 14,
    outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
  };
  const btn: React.CSSProperties = {
    width: "100%", background: "linear-gradient(135deg,#10b981,#059669)",
    color: "#fff", border: "none", padding: "13px", borderRadius: 10,
    fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
    opacity: loading ? 0.7 : 1, transition: "opacity 0.2s",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: 52, height: 52, background: "linear-gradient(135deg,#10b981,#059669)", borderRadius: 14, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "0.75rem", boxShadow: "0 0 30px rgba(16,185,129,0.3)" }}>
            <span style={{ fontSize: 24 }}>🧬</span>
          </div>
          <h1 style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 700, margin: 0 }}>MediLabs Pro</h1>
          <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>Laboratory Information System</p>
        </div>

        <div style={{ background: "#1e293b", borderRadius: 16, border: "1px solid #334155", padding: "1.75rem" }}>
          {/* Lab ID Input */}
          {!labChecked ? (
            <div>
              <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 0, marginBottom: "1.25rem", textAlign: "center" }}>
                Enter your Lab ID to continue
              </p>
              <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 6 }}>Lab ID</label>
              <input
                value={labSlug}
                onChange={e => setLabSlug(e.target.value)}
                onKeyDown={e => e.key === "Enter" && verifySlug(labSlug)}
                placeholder="e.g. central-lab or superadmin"
                style={inp}
                autoFocus
              />
              {labError && <p style={{ color: "#ef4444", fontSize: 12, margin: "6px 0 0" }}>{labError}</p>}
              <button onClick={() => verifySlug(labSlug)} style={{ ...btn, marginTop: "1rem" }}>Continue →</button>
            </div>
          ) : (
            <>
              {/* Lab Badge */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", background: "#0f172a", borderRadius: 8, padding: "8px 12px" }}>
                <div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Logging into</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#10b981" }}>{labName}</div>
                </div>
                <button onClick={() => { setLabChecked(false); setLabName(""); setLabSlug(""); }} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 12 }}>Change</button>
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", background: "#0f172a", borderRadius: 8, padding: 4, marginBottom: "1.25rem", gap: 2 }}>
                {(["email", "otp", "google"] as Tab[]).map(t => (
                  <button key={t} onClick={() => { setTab(t); setError(""); }}
                    style={{ flex: 1, padding: "8px 4px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                      background: tab === t ? "#1e293b" : "transparent",
                      color: tab === t ? "#10b981" : "#64748b",
                      boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.3)" : "none",
                    }}>
                    {t === "email" ? "📧 Email" : t === "otp" ? "📱 Mobile" : "🔵 Google"}
                  </button>
                ))}
              </div>

              {error && <div style={{ background: "#450a0a", border: "1px solid #ef4444", color: "#fca5a5", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: "1rem" }}>{error}</div>}

              {/* Email Tab */}
              {tab === "email" && (
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  <div>
                    <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 6 }}>Email Address</label>
                    <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@example.com" style={inp} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 6 }}>Password</label>
                    <div style={{ position: "relative" }}>
                      <input value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && loginEmail()}
                        type={showPass ? "text" : "password"} placeholder="••••••••" style={{ ...inp, paddingRight: 44 }} />
                      <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 16 }}>
                        {showPass ? "🙈" : "👁"}
                      </button>
                    </div>
                  </div>
                  <button onClick={loginEmail} style={{ ...btn, marginTop: 4 }}>
                    {loading ? "Signing in..." : "Sign In"}
                  </button>
                </div>
              )}

              {/* OTP Tab */}
              {tab === "otp" && (
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  {!otpSent ? (
                    <>
                      <div>
                        <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 6 }}>Mobile Number</label>
                        <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder="+91 98765 43210" style={inp} />
                      </div>
                      <button onClick={sendOtp} style={{ ...btn, marginTop: 4 }}>{loading ? "Sending..." : "Send OTP"}</button>
                    </>
                  ) : (
                    <>
                      <p style={{ color: "#64748b", fontSize: 13, textAlign: "center", margin: "0 0 0.5rem" }}>Enter the 6-digit OTP sent to <strong style={{ color: "#f1f5f9" }}>{phone}</strong></p>
                      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                        {otp.map((d, i) => (
                          <input key={i} ref={el => { otpRefs.current[i] = el; }} value={d}
                            onChange={e => otpInput(e.target.value, i)}
                            maxLength={1} inputMode="numeric"
                            style={{ width: 44, height: 52, textAlign: "center", fontSize: 20, fontWeight: 700, background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9", outline: "none" }} />
                        ))}
                      </div>
                      <button onClick={verifyOtp} style={{ ...btn, marginTop: 4 }}>{loading ? "Verifying..." : "Verify OTP"}</button>
                      <button onClick={() => { setOtpSent(false); setOtp(["","","","","",""]); }} style={{ background: "none", border: "none", color: "#64748b", fontSize: 12, cursor: "pointer", textAlign: "center" }}>Resend OTP</button>
                    </>
                  )}
                </div>
              )}

              {/* Google Tab */}
              {tab === "google" && (
                <div style={{ textAlign: "center" }}>
                  {GOOGLE_CLIENT_ID ? (
                    <>
                      <p style={{ color: "#64748b", fontSize: 13, marginBottom: "1rem" }}>Sign in with your registered Google account.</p>
                      <div ref={googleBtnRef} style={{ display: "flex", justifyContent: "center" }} />
                    </>
                  ) : (
                    <div style={{ background: "#172033", border: "1px solid #334155", borderRadius: 10, padding: "1rem", fontSize: 13, color: "#64748b" }}>
                      Google login is not configured.<br />Set <code style={{ color: "#10b981" }}>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> to enable it.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <p style={{ textAlign: "center", color: "#475569", fontSize: 12, marginTop: "1.5rem" }}>
          Patient portal? <a href="/portal" style={{ color: "#10b981", textDecoration: "none" }}>Click here →</a>
        </p>
      </div>
    </div>
  );
}
