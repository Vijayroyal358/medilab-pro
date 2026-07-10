"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

const ROLES = ["Lab Owner", "Lab Admin", "Receptionist", "Technician", "Doctor"];

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [labs, setLabs] = useState<any[]>([]);
  const [selectedLab, setSelectedLab] = useState<any | null>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"labs" | "staff">("labs");

  // Modals
  const [showCreateLab, setShowCreateLab] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [labForm, setLabForm] = useState({ name: "", address: "", phone: "", email: "", owner_name: "", owner_email: "", owner_phone: "" });
  const [staffForm, setStaffForm] = useState({ name: "", email: "", phone: "", role: "Receptionist" });
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("medilab_access_token");
    const role = JSON.parse(localStorage.getItem("medilab_user") || "{}").role;
    if (!t || role !== "Software Admin") { router.push("/auth/login"); return; }
    setToken(t);
    fetchLabs(t);
  }, []);

  const headers = (t: string) => ({ Authorization: `Bearer ${t}`, "Content-Type": "application/json" });

  const fetchLabs = async (t: string) => {
    setLoading(true);
    const res = await fetch(`${API}/superadmin/labs`, { headers: headers(t) });
    if (res.ok) setLabs(await res.json());
    setLoading(false);
  };

  const fetchStaff = async (labId: number) => {
    const res = await fetch(`${API}/superadmin/labs/${labId}/staff`, { headers: headers(token!) });
    if (res.ok) setStaff(await res.json());
  };

  const openLab = (lab: any) => {
    setSelectedLab(lab);
    fetchStaff(lab.id);
    setView("staff");
  };

  const createLab = async () => {
    const res = await fetch(`${API}/superadmin/labs`, {
      method: "POST", headers: headers(token!), body: JSON.stringify(labForm),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg({ text: `Lab created! Owner temp password: ${data.temp_password}`, type: "success" });
      setShowCreateLab(false);
      setLabForm({ name: "", address: "", phone: "", email: "", owner_name: "", owner_email: "", owner_phone: "" });
      fetchLabs(token!);
    } else {
      setMsg({ text: data.detail || "Failed to create lab", type: "error" });
    }
  };

  const addStaff = async () => {
    const res = await fetch(`${API}/superadmin/labs/${selectedLab.id}/staff`, {
      method: "POST", headers: headers(token!), body: JSON.stringify(staffForm),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg({ text: `Staff added! Temp password: ${staffForm.name.split(" ")[0]}@Staff1`, type: "success" });
      setShowAddStaff(false);
      setStaffForm({ name: "", email: "", phone: "", role: "Receptionist" });
      fetchStaff(selectedLab.id);
    } else {
      setMsg({ text: data.detail || "Failed to add staff", type: "error" });
    }
  };

  const toggleStaff = async (userId: number, isActive: boolean) => {
    await fetch(`${API}/superadmin/labs/${selectedLab.id}/staff/${userId}`, {
      method: "PATCH", headers: headers(token!), body: JSON.stringify({ is_active: !isActive }),
    });
    fetchStaff(selectedLab.id);
  };

  const logout = () => {
    localStorage.clear();
    router.push("/auth/login");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#e2e8f0", fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#1e293b", borderBottom: "1px solid #334155", padding: "0 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: "60px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#10b981,#059669)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>M</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>MediLabs Pro</div>
            <div style={{ fontSize: 11, color: "#10b981" }}>Software Admin Console</div>
          </div>
        </div>
        <button onClick={logout} style={{ background: "transparent", border: "1px solid #475569", color: "#94a3b8", padding: "6px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>
          Sign Out
        </button>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1rem" }}>
        {/* Alert */}
        {msg && (
          <div style={{ background: msg.type === "success" ? "#064e3b" : "#7f1d1d", border: `1px solid ${msg.type === "success" ? "#10b981" : "#ef4444"}`, color: "#f1f5f9", padding: "0.75rem 1rem", borderRadius: 10, marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
            {msg.text}
            <button onClick={() => setMsg(null)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 16 }}>×</button>
          </div>
        )}

        {view === "labs" ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#f1f5f9" }}>Laboratories</h1>
                <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>{labs.length} labs registered</p>
              </div>
              <button onClick={() => setShowCreateLab(true)} style={{ background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
                + New Lab
              </button>
            </div>

            {loading ? (
              <p style={{ color: "#64748b", textAlign: "center", marginTop: "4rem" }}>Loading...</p>
            ) : labs.length === 0 ? (
              <div style={{ textAlign: "center", marginTop: "4rem", color: "#64748b" }}>
                <div style={{ fontSize: 40, marginBottom: "1rem" }}>🏥</div>
                <p style={{ fontSize: 16 }}>No labs yet. Create your first lab.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "1rem" }}>
                {labs.map((lab) => (
                  <div key={lab.id} onClick={() => openLab(lab)} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: "1.25rem 1.5rem", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "border-color 0.2s" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "#10b981")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "#334155")}>
                    <div>
                      <div style={{ fontWeight: 600, color: "#f1f5f9", fontSize: 15 }}>{lab.name}</div>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                        slug: <span style={{ color: "#10b981" }}>{lab.slug}</span>
                        {lab.owner_name && <> &bull; Owner: {lab.owner_name} ({lab.owner_email})</>}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: "#10b981" }}>{lab.staff_count}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>Staff</div>
                      </div>
                      <span style={{ background: lab.is_active ? "#064e3b" : "#450a0a", color: lab.is_active ? "#10b981" : "#ef4444", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                        {lab.is_active ? "Active" : "Suspended"}
                      </span>
                      <span style={{ color: "#475569", fontSize: 18 }}>›</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div>
                <button onClick={() => setView("labs")} style={{ background: "none", border: "none", color: "#10b981", cursor: "pointer", fontSize: 13, padding: 0, marginBottom: 4 }}>← Back to Labs</button>
                <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#f1f5f9" }}>{selectedLab?.name}</h1>
                <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0" }}>slug: {selectedLab?.slug}</p>
              </div>
              <button onClick={() => setShowAddStaff(true)} style={{ background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
                + Add Staff
              </button>
            </div>

            <div style={{ background: "#1e293b", borderRadius: 12, border: "1px solid #334155", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #334155" }}>
                    {["Name", "Email", "Phone", "Role", "Status", "Action"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {staff.map((s) => (
                    <tr key={s.id} style={{ borderBottom: "1px solid #1e293b" }}>
                      <td style={{ padding: "12px 16px", fontSize: 14, color: "#f1f5f9", fontWeight: 500 }}>{s.name}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#94a3b8" }}>{s.email}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#94a3b8" }}>{s.phone || "—"}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ background: "#1e3a5f", color: "#60a5fa", padding: "2px 10px", borderRadius: 20, fontSize: 12 }}>{s.role}</span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ background: s.is_active ? "#064e3b" : "#450a0a", color: s.is_active ? "#10b981" : "#ef4444", padding: "2px 10px", borderRadius: 20, fontSize: 12 }}>
                          {s.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <button onClick={() => toggleStaff(s.id, s.is_active)} style={{ background: "none", border: "1px solid #475569", color: "#94a3b8", padding: "4px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>
                          {s.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {staff.length === 0 && (
                    <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "#64748b", fontSize: 14 }}>No staff members yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Create Lab Modal */}
      {showCreateLab && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 16, padding: "2rem", width: "90%", maxWidth: 520 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9", marginTop: 0 }}>Create New Lab</h2>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {[
                { label: "Lab Name *", key: "name", ph: "e.g. City Diagnostic Center" },
                { label: "Address", key: "address", ph: "Full address" },
                { label: "Lab Phone", key: "phone", ph: "+91..." },
                { label: "Lab Email", key: "email", ph: "lab@example.com" },
                { label: "Owner Full Name *", key: "owner_name", ph: "Dr. Vijay Kumar" },
                { label: "Owner Email *", key: "owner_email", ph: "owner@example.com" },
                { label: "Owner Phone", key: "owner_phone", ph: "+91..." },
              ].map(({ label, key, ph }) => (
                <div key={key}>
                  <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>{label}</label>
                  <input value={(labForm as any)[key]} onChange={e => setLabForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={ph} style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "8px 12px", color: "#f1f5f9", fontSize: 13, boxSizing: "border-box" }} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button onClick={() => setShowCreateLab(false)} style={{ flex: 1, background: "none", border: "1px solid #475569", color: "#94a3b8", padding: "10px", borderRadius: 8, cursor: "pointer" }}>Cancel</button>
              <button onClick={createLab} style={{ flex: 1, background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", border: "none", padding: "10px", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>Create Lab</button>
            </div>
            <p style={{ fontSize: 11, color: "#64748b", marginTop: "0.75rem", textAlign: "center" }}>Owner will receive a temporary password shown after creation</p>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddStaff && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 16, padding: "2rem", width: "90%", maxWidth: 420 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9", marginTop: 0 }}>Add Staff to {selectedLab?.name}</h2>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {[
                { label: "Full Name *", key: "name", ph: "Dr. Ravi Kumar" },
                { label: "Email *", key: "email", ph: "staff@example.com" },
                { label: "Phone", key: "phone", ph: "+91..." },
              ].map(({ label, key, ph }) => (
                <div key={key}>
                  <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>{label}</label>
                  <input value={(staffForm as any)[key]} onChange={e => setStaffForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={ph} style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "8px 12px", color: "#f1f5f9", fontSize: 13, boxSizing: "border-box" }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Role *</label>
                <select value={staffForm.role} onChange={e => setStaffForm(f => ({ ...f, role: e.target.value }))}
                  style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "8px 12px", color: "#f1f5f9", fontSize: 13 }}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button onClick={() => setShowAddStaff(false)} style={{ flex: 1, background: "none", border: "1px solid #475569", color: "#94a3b8", padding: "10px", borderRadius: 8, cursor: "pointer" }}>Cancel</button>
              <button onClick={addStaff} style={{ flex: 1, background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", border: "none", padding: "10px", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>Add Staff</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
