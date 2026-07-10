"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Shield, Building2, ClipboardList, FileText, Mail, 
  Check, ChevronRight, Landmark, Upload, Link2, 
  Save, Sparkles, Building, Phone, Globe, Star, ExternalLink
} from "lucide-react";
import { getLabSetup, updateLabSetup, LabSetupData } from "../../../../services/data";

const SUPABASE_URL = "https://tkswveavhhgpijpjrvls.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrc3d2ZWF2aGhncGlqcGpydmxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MDQ4NjUsImV4cCI6MjA5ODM4MDg2NX0.tnfiGx0ujEpWyZ3k4zUwPU5ijY9JoXsLpEw8hz5apWk";

async function uploadToSupabase(file: File): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/assets/${filePath}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "apikey": SUPABASE_ANON_KEY,
      "Content-Type": file.type
    },
    body: file
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed: ${errorText}`);
  }

  return `${SUPABASE_URL}/storage/v1/object/public/assets/${filePath}`;
}

const SETUP_STEPS = [
  { id: "kyc", label: "KYC", icon: Shield, href: "/dashboard/setup/kyc" },
  { id: "center", label: "Center details", icon: Building2, href: "/dashboard/setup/center" },
  { id: "ratelist", label: "Ratelist", icon: ClipboardList, href: "/dashboard/setup/ratelist" },
  { id: "letterhead", label: "Letterhead", icon: FileText, href: "/dashboard/setup/letterhead" },
  { id: "review", label: "Google review", icon: Mail, href: "/dashboard/setup/review" },
  { id: "panels", label: "Panels", icon: ClipboardList, href: "/dashboard/setup/panels" }
];

export default function SetupStepPage() {
  const params = useParams();
  const router = useRouter();
  const step = params.step as string;

  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [labData, setLabData] = useState<LabSetupData>({
    name: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    gstin: "",
    pan: "",
    license_path: "",
    google_review_url: "",
    logo_path: ""
  });

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchSetup = async () => {
      try {
        const res = await getLabSetup();
        setLabData({
          name: res.name || "",
          email: res.email || "",
          phone: res.phone || "",
          website: res.website || "",
          address: res.address || "",
          gstin: res.gstin || "",
          pan: res.pan || "",
          license_path: res.license_path || "",
          google_review_url: res.google_review_url || "",
          logo_path: res.logo_path || ""
        });
      } catch (err) {
        console.error("Failed to load lab setup", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSetup();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateLabSetup(labData);
      triggerToast("Details saved to database successfully!");
    } catch (err: any) {
      triggerToast(err.message || "Failed to save details");
    }
  };

  const handleInputChange = (field: keyof LabSetupData, val: string) => {
    setLabData(prev => ({ ...prev, [field]: val }));
  };

  const handleLicenseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploading(true);
      try {
        const publicUrl = await uploadToSupabase(file);
        handleInputChange("license_path", publicUrl);
        triggerToast("License uploaded to Supabase Storage!");
      } catch (err: any) {
        triggerToast(err.message || "Failed to upload file");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploading(true);
      try {
        const publicUrl = await uploadToSupabase(file);
        handleInputChange("logo_path", publicUrl);
        triggerToast("Logo uploaded to Supabase Storage!");
      } catch (err: any) {
        triggerToast(err.message || "Failed to upload logo");
      } finally {
        setUploading(false);
      }
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex h-64 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      );
    }

    switch (step) {
      case "kyc":
        return (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="border-b border-slate-100 dark:border-darkBorders pb-4">
              <h1 className="text-xl font-extrabold text-slate-800 dark:text-white uppercase tracking-tight">KYC Verification</h1>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1.5">Verify your business credentials to enable full invoicing capabilities</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-darkBorders space-y-4">
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">Business Identification</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">GSTIN / Tax ID Number</label>
                    <input 
                      type="text" 
                      value={labData.gstin || ""} 
                      onChange={(e) => handleInputChange("gstin", e.target.value)}
                      placeholder="e.g. 27AAAAA1111A1Z1" 
                      className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-darkBorders rounded-xl focus:outline-none focus:ring-1 focus:ring-primary dark:bg-darkCard dark:text-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">PAN Card Number</label>
                    <input 
                      type="text" 
                      value={labData.pan || ""} 
                      onChange={(e) => handleInputChange("pan", e.target.value)}
                      placeholder="e.g. ABCDE1234F" 
                      className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-darkBorders rounded-xl focus:outline-none focus:ring-1 focus:ring-primary dark:bg-darkCard dark:text-white" 
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-darkBorders space-y-4">
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">License & Certification Documents</h3>
                <label className="block border-2 border-dashed border-slate-200 dark:border-darkBorders rounded-2xl p-6 text-center hover:border-primary transition-colors cursor-pointer group">
                  <input 
                    type="file" 
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleLicenseUpload}
                    className="hidden" 
                  />
                  <Upload className="h-8 w-8 text-slate-400 dark:text-slate-500 mx-auto group-hover:scale-105 transition-transform" />
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-200 mt-3">
                    {uploading ? "Uploading..." : labData.license_path ? "License Uploaded!" : "Upload Laboratory License"}
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-1">
                    {labData.license_path ? "Click to replace file" : "PDF, JPG, or PNG (Max 5MB)"}
                  </span>
                </label>
                {labData.license_path && (
                  <div className="mt-3 text-center">
                    <a 
                      href={labData.license_path} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs font-bold text-[#00A770] hover:underline flex items-center justify-center space-x-1"
                    >
                      <span>View Uploaded Document</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                type="submit"
                className="flex items-center space-x-2 px-6 py-2.5 bg-[#00A770] hover:bg-[#009060] text-white font-extrabold text-xs rounded-xl shadow-md transition-all uppercase tracking-wider"
              >
                <Save className="h-4 w-4" />
                <span>Save KYC Details</span>
              </button>
            </div>
          </form>
        );

      case "center":
        return (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="border-b border-slate-100 dark:border-darkBorders pb-4">
              <h1 className="text-xl font-extrabold text-slate-800 dark:text-white uppercase tracking-tight">Center Details</h1>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1.5">Manage your lab profile information and contact details</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-darkBorders space-y-4">
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">General Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Lab / Center Name</label>
                    <input 
                      type="text" 
                      value={labData.name || ""} 
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Lab Name"
                      className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-darkBorders rounded-xl focus:outline-none focus:ring-1 focus:ring-primary dark:bg-darkCard dark:text-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                    <input 
                      type="email" 
                      value={labData.email || ""} 
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="contact@email.com"
                      className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-darkBorders rounded-xl focus:outline-none focus:ring-1 focus:ring-primary dark:bg-darkCard dark:text-white" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Phone Number</label>
                      <input 
                        type="tel" 
                        value={labData.phone || ""} 
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="Phone Number"
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-darkBorders rounded-xl focus:outline-none focus:ring-1 focus:ring-primary dark:bg-darkCard dark:text-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Website</label>
                      <input 
                        type="text" 
                        value={labData.website || ""} 
                        onChange={(e) => handleInputChange("website", e.target.value)}
                        placeholder="e.g. www.lab.com"
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-darkBorders rounded-xl focus:outline-none focus:ring-1 focus:ring-primary dark:bg-darkCard dark:text-white" 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Laboratory Logo</label>
                    <div className="flex items-center space-x-3">
                      {labData.logo_path ? (
                        <div className="relative shrink-0">
                          <img 
                            src={labData.logo_path} 
                            alt="Logo preview" 
                            className="w-12 h-12 rounded-xl object-contain bg-white border border-slate-200 p-1" 
                          />
                          <button
                            type="button"
                            onClick={() => handleInputChange("logo_path", "")}
                            className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 shadow-sm text-[8px] font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <label className="w-12 h-12 border border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 rounded-xl flex flex-col items-center justify-center cursor-pointer group transition-all shrink-0 bg-white dark:bg-darkCard">
                          <Upload className="h-4 w-4 text-slate-400 group-hover:scale-105 transition-transform" />
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleLogoUpload} 
                            className="hidden" 
                          />
                        </label>
                      )}
                      
                      <div className="flex-1">
                        <input 
                          type="text" 
                          value={labData.logo_path || ""} 
                          onChange={(e) => handleInputChange("logo_path", e.target.value)}
                          placeholder="Or paste a public Logo URL here..."
                          className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-darkBorders rounded-xl focus:outline-none focus:ring-1 focus:ring-primary dark:bg-darkCard dark:text-white" 
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-darkBorders space-y-4">
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">Location Address</h3>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full Address</label>
                  <textarea 
                    rows={4} 
                    value={labData.address || ""} 
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="Full Lab Address"
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-darkBorders rounded-xl focus:outline-none focus:ring-1 focus:ring-primary dark:bg-darkCard dark:text-white resize-none" 
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                type="submit"
                className="flex items-center space-x-2 px-6 py-2.5 bg-[#00A770] hover:bg-[#009060] text-white font-extrabold text-xs rounded-xl shadow-md transition-all uppercase tracking-wider"
              >
                <Save className="h-4 w-4" />
                <span>Save Center Details</span>
              </button>
            </div>
          </form>
        );

      case "letterhead":
        return (
          <div className="space-y-6">
            <div className="border-b border-slate-100 dark:border-darkBorders pb-4">
              <h1 className="text-xl font-extrabold text-slate-800 dark:text-white uppercase tracking-tight">Letterhead Design</h1>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1.5">Upload and customize your official digital report letterheads</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-darkBorders space-y-4">
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">Letterhead Image Options</h3>
                <div className="border-2 border-dashed border-slate-200 dark:border-darkBorders rounded-2xl p-6 text-center hover:border-primary transition-colors cursor-pointer group">
                  <Upload className="h-8 w-8 text-slate-400 dark:text-slate-500 mx-auto group-hover:scale-105 transition-transform" />
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-200 mt-3">Upload Header Image</span>
                  <span className="block text-[10px] text-slate-400 mt-1">Recommended width: 1200px (JPG, PNG)</span>
                </div>
                <div className="border-2 border-dashed border-slate-200 dark:border-darkBorders rounded-2xl p-6 text-center hover:border-primary transition-colors cursor-pointer group">
                  <Upload className="h-8 w-8 text-slate-400 dark:text-slate-500 mx-auto group-hover:scale-105 transition-transform" />
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-200 mt-3">Upload Footer Image</span>
                  <span className="block text-[10px] text-slate-400 mt-1">Recommended width: 1200px (JPG, PNG)</span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-darkBorders space-y-4">
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">Report Margin Spacing</h3>
                <div className="space-y-4">
                  <div>
                    <label className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      <span>Header Spacing (Top Margin)</span>
                      <span className="text-[#00A770]">80px</span>
                    </label>
                    <input type="range" min="0" max="200" defaultValue="80" className="w-full accent-[#00A770]" />
                  </div>
                  <div>
                    <label className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      <span>Footer Spacing (Bottom Margin)</span>
                      <span className="text-[#00A770]">60px</span>
                    </label>
                    <input type="range" min="0" max="200" defaultValue="60" className="w-full accent-[#00A770]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                onClick={() => triggerToast("Letterhead layout saved successfully!")}
                className="flex items-center space-x-2 px-6 py-2.5 bg-[#00A770] hover:bg-[#009060] text-white font-extrabold text-xs rounded-xl shadow-md transition-all uppercase tracking-wider"
              >
                <Save className="h-4 w-4" />
                <span>Save Letterhead</span>
              </button>
            </div>
          </div>
        );

      case "review":
        return (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="border-b border-slate-100 dark:border-darkBorders pb-4">
              <h1 className="text-xl font-extrabold text-slate-800 dark:text-white uppercase tracking-tight">Google Review Builder</h1>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1.5">Configure your Google Business link to automatically collect reviews from patients</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-darkBorders space-y-4">
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">Business Review Integration</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Google Business Review URL</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 bg-slate-200 dark:bg-slate-800 border border-r-0 border-slate-200 dark:border-darkBorders rounded-l-xl text-slate-400"><Link2 className="h-4 w-4" /></span>
                      <input 
                        type="url" 
                        value={labData.google_review_url || ""} 
                        onChange={(e) => handleInputChange("google_review_url", e.target.value)}
                        placeholder="https://g.page/r/YOUR_BUSINESS_ID/review" 
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-darkBorders rounded-r-xl focus:outline-none focus:ring-1 focus:ring-primary dark:bg-darkCard dark:text-white" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-darkBorders flex flex-col justify-center items-center p-6 text-center">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl text-[#00A770] mb-3">
                  <Star className="h-10 w-10 fill-current" />
                </div>
                <h4 className="font-extrabold text-xs text-slate-800 dark:text-white">Patient Review QR Code</h4>
                <p className="text-[10px] text-slate-400 max-w-xs mt-1">A dynamic QR code will be generated on reports and invoices linking directly to your Google reviews.</p>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                type="submit"
                className="flex items-center space-x-2 px-6 py-2.5 bg-[#00A770] hover:bg-[#009060] text-white font-extrabold text-xs rounded-xl shadow-md transition-all uppercase tracking-wider"
              >
                <Save className="h-4 w-4" />
                <span>Save Review Link</span>
              </button>
            </div>
          </form>
        );

      case "panels":
        return (
          <div className="space-y-6">
            <div className="border-b border-slate-100 dark:border-darkBorders pb-4">
              <h1 className="text-xl font-extrabold text-slate-800 dark:text-white uppercase tracking-tight">Panels Management</h1>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1.5">Group multiple clinical tests into diagnostic panels and bundles</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-darkBorders space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-darkBorders pb-3">
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">Configured Panels</h3>
                <button 
                  onClick={() => triggerToast("Add panel wizard coming soon!")}
                  className="px-3 py-1.5 bg-[#00A770]/10 hover:bg-[#00A770]/20 text-[#00A770] font-extrabold text-[10px] rounded-lg uppercase tracking-wider transition-colors"
                >
                  + Add New Panel
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                <div className="py-3 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-xs text-slate-800 dark:text-white">Complete Blood Count (CBC) Panel</div>
                    <span className="text-[10px] text-slate-400 font-semibold mt-0.5">Includes 18 parameters (RBC, WBC, Platelets, etc.)</span>
                  </div>
                  <span className="bg-emerald-50 dark:bg-emerald-950/30 text-[#00A770] text-[10px] font-bold px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-900">Active</span>
                </div>
                <div className="py-3 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-xs text-slate-800 dark:text-white">Lipid Profile</div>
                    <span className="text-[10px] text-slate-400 font-semibold mt-0.5">Includes Cholesterol, Triglycerides, HDL, LDL, VLDL</span>
                  </div>
                  <span className="bg-emerald-50 dark:bg-emerald-950/30 text-[#00A770] text-[10px] font-bold px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-900">Active</span>
                </div>
                <div className="py-3 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-xs text-slate-800 dark:text-white">Liver Function Test (LFT)</div>
                    <span className="text-[10px] text-slate-400 font-semibold mt-0.5">Includes Bilirubin, SGOT, SGPT, Alkaline Phosphatase</span>
                  </div>
                  <span className="bg-emerald-50 dark:bg-emerald-950/30 text-[#00A770] text-[10px] font-bold px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-900">Active</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        router.push("/dashboard/setup/ratelist");
        return null;
    }
  };

  return (
    <div className="flex bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-darkBorders shadow-xl min-h-[calc(100vh-8rem)] overflow-hidden">
      
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white font-medium text-xs bg-success">
          <span>{toast}</span>
        </div>
      )}

      {/* Left Sidebar Setup Guide */}
      <div className="w-64 bg-[#051F19] text-[#A3B899] p-6 flex flex-col justify-between border-r border-[#031510] shrink-0">
        <div className="space-y-6">
          <div className="flex items-center space-x-2 border-b border-[#093027] pb-4">
            <Landmark className="h-5 w-5 text-emerald-400" />
            <h2 className="text-sm font-black text-white tracking-widest uppercase">Setup Guide</h2>
          </div>
          <nav className="space-y-1 text-xs font-bold">
            {SETUP_STEPS.map(s => {
              const active = s.id === step;
              return (
                <div 
                  key={s.id} 
                  onClick={() => router.push(s.href)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                    active 
                      ? "bg-[#00A770] text-white font-extrabold shadow-md shadow-[#00A770]/10 scale-[1.02]" 
                      : "hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <s.icon className={`h-4 w-4 ${active ? "text-white" : "text-[#758E6B]"}`} />
                    <span>{s.label}</span>
                  </div>
                  <ChevronRight className={`h-3.5 w-3.5 transition-opacity ${active ? "opacity-100" : "opacity-40"}`} />
                </div>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3 pt-6 border-t border-[#093027] text-[10px] font-black uppercase tracking-wider">
          <button 
            type="button" 
            onClick={() => router.push("/dashboard")}
            className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-center border border-white/10 hover:border-white/20 transition-all cursor-pointer"
          >
            Skip setup &raquo;
          </button>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-grow p-8 bg-white dark:bg-darkCard overflow-y-auto">
        {renderContent()}
      </div>

    </div>
  );
}
