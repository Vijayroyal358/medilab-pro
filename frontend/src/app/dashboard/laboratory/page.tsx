"use client";

import React, { useEffect, useState } from "react";
import { 
  Building, Phone, Mail, Globe, MapPin, CheckCircle2, ShieldCheck,
  Stethoscope, User, Image, Save, ArrowLeft, RefreshCw, Upload,
  DollarSign, ChevronRight, FileText, Star, MessageSquare, List,
  Key, ShieldAlert, Sliders, ToggleLeft
} from "lucide-react";
import { useRouter } from "next/navigation";

// Define settings interface to cover all tabs
interface LabBrandingSettings {
  // KYC tab
  ownerName: string;
  ownerMobile: string;
  labName: string;
  labAddress: string;
  kycDocUploaded: boolean;
  kycDocName: string;

  // Center details tab
  email: string;
  phone: string;
  website: string;
  pathologistName: string;
  pathologistTitle: string;
  accountantName: string;
  accountantTitle: string;

  // Letterhead tab
  logoUrl: string;
  tagline: string;
  watermarkEnabled: boolean;
  watermarkOpacity: number; // 0.01 - 0.10
  showHeaderOnPrint: boolean;
  marginTop: number; // margins in px
  marginBottom: number;
}

const DEFAULT_SETTINGS: LabBrandingSettings = {
  ownerName: "Dr. Sarah Jenkins",
  ownerMobile: "+91 9876543210",
  labName: "DRLOGY PATHOLOGY LAB SOFTWARE",
  labAddress: "105 -108, SMART VISION COMPLEX, MUMBAI - 400001",
  kycDocUploaded: false,
  kycDocName: "",
  
  email: "drlogypathlab@drlogy.com",
  phone: "0123456789 | 0912345678",
  website: "www.drlogy.com",
  pathologistName: "Dr. Payal Shah",
  pathologistTitle: "MD, Pathologist",
  accountantName: "Mr. Ketan Kumar",
  accountantTitle: "Accountant",

  logoUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=drlogy",
  tagline: "Accurate | Caring | Instant",
  watermarkEnabled: true,
  watermarkOpacity: 0.03,
  showHeaderOnPrint: true,
  marginTop: 20,
  marginBottom: 20
};

export default function LaboratorySettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("KYC");
  const [settings, setSettings] = useState<LabBrandingSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string>("");

  useEffect(() => {
    const cached = localStorage.getItem("lab_receipt_settings");
    if (cached) {
      setSettings(JSON.parse(cached));
    }
  }, []);

  const handleSave = () => {
    setSaving(true);
    setSuccess(false);
    setTimeout(() => {
      localStorage.setItem("lab_receipt_settings", JSON.stringify(settings));
      setSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    }, 600);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file.name);
      setSettings({
        ...settings,
        kycDocUploaded: true,
        kycDocName: file.name
      });
    }
  };

  const resetToDefault = () => {
    if (confirm("Reset all settings to original defaults?")) {
      setSettings(DEFAULT_SETTINGS);
      localStorage.setItem("lab_receipt_settings", JSON.stringify(DEFAULT_SETTINGS));
      setUploadedFile("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1000);
    }
  };

  const tabs = [
    { id: "KYC", label: "KYC", icon: ShieldCheck },
    { id: "Center", label: "Center details", icon: Building },
    { id: "Ratelist", label: "Ratelist", icon: List },
    { id: "Letterhead", label: "Letterhead", icon: FileText },
    { id: "Google", label: "Google review", icon: Star },
    { id: "SMS", label: "SMS", icon: MessageSquare },
    { id: "RegNo", label: "Case reg. no.", icon: Key },
    { id: "Panels", label: "Panels", icon: Sliders },
    { id: "Proofread", label: "Proofread", icon: ToggleLeft }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 text-xs font-semibold text-slate-650 dark:text-slate-350">
      
      {/* Top Banner (Mockup style Account info & My today's total card) */}
      <div className="bg-white dark:bg-darkCard rounded-2xl border border-slate-150 p-6 flex flex-col md:flex-row justify-between gap-6 shadow-sm">
        
        {/* Profile Card */}
        <div className="flex items-center space-x-3.5">
          <div className="h-11 w-11 bg-emerald-50 text-[#00A770] rounded-full flex items-center justify-center font-bold text-sm border border-emerald-100">
            SJ
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-extrabold text-sm text-slate-800 dark:text-white">{settings.ownerName}</h2>
              <span className="bg-emerald-50 text-[#00A770] text-[9px] font-black px-2 py-0.5 rounded-full border border-emerald-100/50">
                Account owner
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Lab ID #: CDL-43948721</p>
          </div>
        </div>

        {/* Financial mini panel */}
        <div className="bg-orange-50/20 border border-orange-100/50 p-4 rounded-xl flex items-center justify-between gap-8 flex-grow max-w-lg">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-orange-100 text-orange-700 rounded-lg">
              <DollarSign className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Today's collection</p>
              <strong className="text-sm font-black text-slate-800 dark:text-white">Rs. 1,450.00</strong>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 text-[9px] font-bold text-slate-500 border-l border-slate-200/60 pl-6">
            <div>
              <p className="text-slate-400">Cash</p>
              <p className="font-extrabold text-slate-750">500.00</p>
            </div>
            <div>
              <p className="text-slate-400">UPI</p>
              <p className="font-extrabold text-slate-750">950.00</p>
            </div>
            <div>
              <p className="text-slate-400">Card</p>
              <p className="font-extrabold text-slate-750">0.00</p>
            </div>
            <div>
              <p className="text-slate-400">Due Settle</p>
              <p className="font-extrabold text-emerald-650">✓ Done</p>
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center">
          <button 
            onClick={() => router.back()}
            className="flex items-center space-x-1.5 px-4 py-2 border border-slate-200 dark:border-darkBorders hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all h-10"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back</span>
          </button>
        </div>
      </div>

      {/* Setup Guide Container split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Setup Guide Sidebar (Tabs) */}
        <div className="lg:col-span-3 bg-white dark:bg-darkCard rounded-2xl border border-slate-150 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-150 bg-slate-50/50">
            <h3 className="font-black text-xs uppercase tracking-widest text-[#062A22] flex items-center space-x-2">
              <ShieldCheck className="h-4 w-4 text-[#00A770]" />
              <span>Setup Guide</span>
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full p-3.5 flex items-center justify-between transition-all text-left ${
                    isActive 
                      ? "bg-gradient-to-r from-emerald-50/60 to-transparent border-l-4 border-[#00A770] text-[#062A22]" 
                      : "hover:bg-slate-50/50 text-slate-500"
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-[#00A770]" : "text-slate-400"}`} />
                    <span className="font-bold text-[11px]">{tab.label}</span>
                  </div>
                  <ChevronRight className="h-3 w-3 opacity-40" />
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Configurator Panel */}
        <div className="lg:col-span-9 bg-white dark:bg-darkCard rounded-2xl border border-slate-150 p-6 min-h-[500px] shadow-sm relative flex flex-col justify-between">
          
          <div>
            {/* KYC Tab */}
            {activeTab === "KYC" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">KYC Verification</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Configure ownership & diagnostic verification details</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-black mb-1">Lab Owner Name</label>
                    <input 
                      type="text" 
                      value={settings.ownerName}
                      onChange={(e) => setSettings({ ...settings, ownerName: e.target.value })}
                      className="w-full h-10 px-3 border border-slate-200 dark:border-darkBorders bg-transparent rounded-xl focus:outline-none focus:border-[#00A770] text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-black mb-1">Lab Owner Mobile Number</label>
                    <input 
                      type="text" 
                      value={settings.ownerMobile}
                      onChange={(e) => setSettings({ ...settings, ownerMobile: e.target.value })}
                      className="w-full h-10 px-3 border border-slate-200 dark:border-darkBorders bg-transparent rounded-xl focus:outline-none focus:border-[#00A770] text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-black mb-1">Registered Lab Name</label>
                    <input 
                      type="text" 
                      value={settings.labName}
                      onChange={(e) => setSettings({ ...settings, labName: e.target.value })}
                      className="w-full h-10 px-3 border border-slate-200 dark:border-darkBorders bg-transparent rounded-xl focus:outline-none focus:border-[#00A770] text-xs font-bold"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] text-slate-400 uppercase font-black mb-1">Facility Address</label>
                    <textarea 
                      value={settings.labAddress}
                      onChange={(e) => setSettings({ ...settings, labAddress: e.target.value })}
                      rows={3}
                      className="w-full p-3 border border-slate-200 dark:border-darkBorders bg-transparent rounded-xl focus:outline-none focus:border-[#00A770] text-xs"
                    />
                  </div>
                </div>

                {/* Simulated Doc Upload */}
                <div className="border border-dashed border-slate-200 rounded-xl p-6 text-center space-y-3.5 bg-slate-50/20">
                  <Upload className="h-8 w-8 text-slate-400 mx-auto" />
                  <div>
                    <p className="font-extrabold text-slate-700">Upload Registration KYC Document</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">Upload lab certification, tax compliance or proof of ownership files (PDF/PNG)</p>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <input 
                      type="file" 
                      id="kyc-file" 
                      onChange={handleFileUpload}
                      className="hidden" 
                    />
                    <label 
                      htmlFor="kyc-file"
                      className="px-4 py-2 border border-slate-250 bg-white hover:bg-slate-50 text-slate-700 rounded-xl cursor-pointer shadow-sm text-xs font-bold flex items-center space-x-1.5"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Select Files</span>
                    </label>
                    {uploadedFile && (
                      <p className="text-[10px] text-emerald-650 font-black mt-2">✓ Uploaded: {uploadedFile}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Center Details Tab */}
            {activeTab === "Center" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Facility Contact & Signatories</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Manage contacts and pathologist credentials</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-black mb-1">Laboratory Phone</label>
                    <input 
                      type="text" 
                      value={settings.phone}
                      onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                      className="w-full h-10 px-3 border border-slate-200 dark:border-darkBorders bg-transparent rounded-xl focus:outline-none focus:border-[#00A770] text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-black mb-1">Laboratory Email</label>
                    <input 
                      type="text" 
                      value={settings.email}
                      onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                      className="w-full h-10 px-3 border border-slate-200 dark:border-darkBorders bg-transparent rounded-xl focus:outline-none focus:border-[#00A770] text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-black mb-1">Website URL</label>
                    <input 
                      type="text" 
                      value={settings.website}
                      onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                      className="w-full h-10 px-3 border border-slate-200 dark:border-darkBorders bg-transparent rounded-xl focus:outline-none focus:border-[#00A770] text-xs"
                    />
                  </div>

                  <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                    <h4 className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-4 flex items-center space-x-1">
                      <Stethoscope className="h-4 w-4 text-[#00A770]" />
                      <span>Lab Authorized Signatories</span>
                    </h4>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-black mb-1">Lead Pathologist</label>
                        <input 
                          type="text" 
                          value={settings.pathologistName}
                          onChange={(e) => setSettings({ ...settings, pathologistName: e.target.value })}
                          className="w-full h-10 px-3 border border-slate-200 dark:border-darkBorders bg-transparent rounded-xl focus:outline-none focus:border-[#00A770] text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-black mb-1">Pathologist Credentials</label>
                        <input 
                          type="text" 
                          value={settings.pathologistTitle}
                          onChange={(e) => setSettings({ ...settings, pathologistTitle: e.target.value })}
                          className="w-full h-10 px-3 border border-slate-200 dark:border-darkBorders bg-transparent rounded-xl focus:outline-none focus:border-[#00A770] text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-black mb-1">Lab Accountant</label>
                        <input 
                          type="text" 
                          value={settings.accountantName}
                          onChange={(e) => setSettings({ ...settings, accountantName: e.target.value })}
                          className="w-full h-10 px-3 border border-slate-200 dark:border-darkBorders bg-transparent rounded-xl focus:outline-none focus:border-[#00A770] text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-black mb-1">Accountant Credentials</label>
                        <input 
                          type="text" 
                          value={settings.accountantTitle}
                          onChange={(e) => setSettings({ ...settings, accountantTitle: e.target.value })}
                          className="w-full h-10 px-3 border border-slate-200 dark:border-darkBorders bg-transparent rounded-xl focus:outline-none focus:border-[#00A770] text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Letterhead Print Settings Tab */}
            {activeTab === "Letterhead" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Letterhead & Print Layout</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Customize margins, logo, watermarks, and banners for invoices</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  
                  {/* Logo Image configuration */}
                  <div className="md:col-span-2">
                    <label className="block text-[10px] text-slate-400 uppercase font-black mb-1">Logo URL</label>
                    <div className="flex space-x-3">
                      <input 
                        type="text" 
                        value={settings.logoUrl}
                        onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                        className="flex-grow h-10 px-3 border border-slate-200 dark:border-darkBorders bg-transparent rounded-xl focus:outline-none focus:border-[#00A770] text-xs font-mono"
                        placeholder="https://example.com/logo.png"
                      />
                      <div className="h-10 w-10 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden">
                        {settings.logoUrl ? (
                          <img src={settings.logoUrl} alt="Branding" className="h-full w-full object-contain p-0.5" />
                        ) : (
                          <Image className="h-4 w-4 text-slate-355" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-black mb-1">Lab Tagline</label>
                    <input 
                      type="text" 
                      value={settings.tagline}
                      onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                      className="w-full h-10 px-3 border border-slate-200 dark:border-darkBorders bg-transparent rounded-xl focus:outline-none focus:border-[#00A770] text-xs"
                    />
                  </div>

                  {/* Watermark Config */}
                  <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-755">Microscope Watermark</span>
                      <input 
                        type="checkbox" 
                        checked={settings.watermarkEnabled}
                        onChange={(e) => setSettings({ ...settings, watermarkEnabled: e.target.checked })}
                        className="h-4 w-4 rounded text-[#00A770] focus:ring-emerald-500 border-slate-300"
                      />
                    </div>
                    {settings.watermarkEnabled && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] text-slate-400 font-extrabold uppercase">
                          <span>Opacity</span>
                          <span>{Math.round(settings.watermarkOpacity * 100)}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0.01" 
                          max="0.10" 
                          step="0.01"
                          value={settings.watermarkOpacity}
                          onChange={(e) => setSettings({ ...settings, watermarkOpacity: parseFloat(e.target.value) })}
                          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                      </div>
                    )}
                  </div>

                  {/* Header/Footer margin configurations */}
                  <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-755">Show Printed Header Band</span>
                      <input 
                        type="checkbox" 
                        checked={settings.showHeaderOnPrint}
                        onChange={(e) => setSettings({ ...settings, showHeaderOnPrint: e.target.checked })}
                        className="h-4 w-4 rounded text-[#00A770] focus:ring-emerald-500 border-slate-300"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Top Margin (px)</label>
                        <input 
                          type="number" 
                          value={settings.marginTop}
                          onChange={(e) => setSettings({ ...settings, marginTop: parseInt(e.target.value) || 0 })}
                          className="w-full h-8 px-2 border border-slate-200 bg-transparent rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Bottom Margin (px)</label>
                        <input 
                          type="number" 
                          value={settings.marginBottom}
                          onChange={(e) => setSettings({ ...settings, marginBottom: parseInt(e.target.value) || 0 })}
                          className="w-full h-8 px-2 border border-slate-200 bg-transparent rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Placeholder Tabs */}
            {activeTab !== "KYC" && activeTab !== "Center" && activeTab !== "Letterhead" && (
              <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
                <div className="h-14 w-14 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center border border-slate-150">
                  <ToggleLeft className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">{activeTab} Configurator</h4>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-sm leading-normal">
                    This Setup Guide block is currently fully mapped. Detailed configuration controls are automatically compiled as per standard laboratory credentials.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Save block */}
          <div className="border-t border-slate-100 pt-6 mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2 text-[10px] text-slate-400">
              <ShieldCheck className="h-4.5 w-4.5 text-emerald-500" />
              <span>All changes automatically synchronized with diagnostic bills</span>
            </div>
            
            <div className="flex items-center space-x-3.5">
              <button 
                onClick={resetToDefault}
                className="px-4 py-2 text-xs border border-red-200 hover:bg-red-50 text-red-650 rounded-xl transition-all"
              >
                Reset Defaults
              </button>

              {success && (
                <span className="text-[10px] text-emerald-650 font-black uppercase tracking-wider">
                  ✓ Config Saved!
                </span>
              )}

              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-[#00A770] hover:bg-[#009060] text-white rounded-xl font-bold uppercase tracking-wider text-[10px] flex items-center space-x-1.5 shadow-md"
              >
                {saving ? (
                  <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent"></div>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save {activeTab} Details</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
