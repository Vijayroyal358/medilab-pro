"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTests, updateTestPayment, getPatientById, getLabSetup } from "../../../../../services/data";
import { Test, Patient } from "../../../../../types/index";
import { 
  ArrowLeft, Printer, FileText, CheckCircle2, 
  AlertCircle, Share2, Settings, User, Stethoscope, 
  History, Eye, Landmark, Loader2, RefreshCw,
  Mail, Phone, Globe, MapPin, ChevronDown, Edit2,
  Trash2, ShieldAlert, Copy, Check, Plus, MessageSquare, Heart,
  HelpCircle, ExternalLink, CalendarDays, Clipboard, ShieldCheck, Download,
  Microscope, Ban, Package, Search, ArrowRight
} from "lucide-react";
import Link from "next/link";

// Number-to-words currency converter (Indian Rupees)
function amountToWords(amount: number): string {
  const ones = [
    "", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
    "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"
  ];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  
  if (amount === 0) return "Zero rupees only";
  
  function convert(n: number): string {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
    if (n < 1000) return ones[Math.floor(n / 105)] + " hundred" + (n % 100 !== 0 ? " and " + convert(n % 100) : "");
    if (n < 100000) return convert(Math.floor(n / 1000)) + " thousand" + (n % 1000 !== 0 ? " " + convert(n % 1000) : "");
    return "";
  }
  
  const rupees = Math.floor(amount);
  const words = convert(rupees);
  if (!words) return `${rupees} rupees only`;
  return (words.charAt(0).toUpperCase() + words.slice(1) + " rupees only").trim();
}

interface LabBranding {
  // KYC
  ownerName: string;
  ownerMobile: string;
  name: string; // mapped from labName
  address: string; // mapped from labAddress

  // Center Details
  email: string;
  phone: string;
  website: string;
  pathologistName: string;
  pathologistTitle: string;
  accountantName: string;
  accountantTitle: string;

  // Letterhead
  logoUrl: string;
  tagline: string;
  watermarkEnabled: boolean;
  watermarkOpacity: number;
  showHeaderOnPrint: boolean;
  marginTop: number;
  marginBottom: number;
}

const DEFAULT_BRANDING: LabBranding = {
  ownerName: "Dr. Sarah Jenkins",
  ownerMobile: "+91 9876543210",
  name: "DRLOGY PATHOLOGY LAB SOFTWARE",
  address: "105 -108, SMART VISION COMPLEX, MUMBAI - 400001",
  
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

// Custom Barcode Renderer
const Barcode = ({ value }: { value: string }) => {
  const getBars = () => {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = value.charCodeAt(i) + ((hash << 5) - hash);
    }
    const bars = [];
    for (let i = 0; i < 35; i++) {
      const isBlack = ((hash >> (i % 32)) & 1) === 1;
      const width = (i * 3 + hash) % 3 === 0 ? 2 : 1;
      bars.push({ isBlack, width });
    }
    return bars;
  };
  
  const bars = getBars();
  return (
    <div className="flex flex-col items-end">
      <div className="flex h-10 items-end bg-white py-1">
        {bars.map((bar, idx) => (
          <div 
            key={idx} 
            className="h-full bg-slate-900" 
            style={{ 
              width: `${bar.width}px`, 
              marginLeft: idx > 0 ? "1px" : "0", 
              opacity: bar.isBlack ? 1 : 0 
            }} 
          />
        ))}
      </div>
    </div>
  );
};

export default function BillDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const qrUrl = typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.host}/verify/bill/${invoiceId}`
    : `http://localhost:3000/verify/bill/${invoiceId}`;

  const [tests, setTests] = useState<Test[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [settling, setSettling] = useState(false);
  const [branding, setBranding] = useState<LabBranding>(DEFAULT_BRANDING);
  const [logoInputOpen, setLogoInputOpen] = useState(false);
  const [newLogoUrl, setNewLogoUrl] = useState("");

  const handleUpdateLogo = (url: string) => {
    const updated = { ...branding, logoUrl: url };
    setBranding(updated);
    localStorage.setItem("lab_receipt_settings", JSON.stringify(updated));
    setLogoInputOpen(false);
  };

  const handleDeleteLogo = () => {
    if (confirm("Are you sure you want to delete the lab branding logo?")) {
      const updated = { ...branding, logoUrl: "" };
      setBranding(updated);
      localStorage.setItem("lab_receipt_settings", JSON.stringify(updated));
    }
  };

  // Grouped Bill parameters
  const [billTotal, setBillTotal] = useState(0);
  const [billPaid, setBillPaid] = useState(0);
  const [billDiscount, setBillDiscount] = useState(0);
  const [billBalance, setBillBalance] = useState(0);
  const [billStatus, setBillStatus] = useState("No due");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [collectionAgent, setCollectionAgent] = useState("Reddy");
  const [billDate, setBillDate] = useState("");

  // Internal bill notes
  const [billNote, setBillNote] = useState("");
  const [savedNotes, setSavedNotes] = useState<string[]>([]);

  // Premium Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm?: () => void;
    isConfirm: boolean;
    type?: "info" | "success" | "warning";
  }>({
    isOpen: false,
    title: "",
    message: "",
    isConfirm: false,
    type: "info"
  });

  const loadBillDetails = async () => {
    setLoading(true);
    setError("");
    try {
      const allTests = await getTests();
      const invoiceTests = allTests.filter(
        t => t.invoice_number.toLowerCase() === invoiceId.toLowerCase()
      );

      if (invoiceTests.length === 0) {
        setError(`Invoice bill with registration number ${invoiceId} was not found.`);
        setLoading(false);
        return;
      }

      setTests(invoiceTests);

      // Sum values
      let total = 0;
      let paid = 0;
      let discount = 0;
      let status = "No due";
      let date = invoiceTests[0].created_at;

      invoiceTests.forEach(t => {
        total += t.price;
        paid += t.amount_received;
        discount += t.discount;
        if (t.status === "Has due") status = "Has due";
        else if (t.status === "Canceled" && status !== "Has due") status = "Canceled";
      });

      setBillTotal(total);
      setBillPaid(paid);
      setBillDiscount(discount);
      setBillBalance(Math.max(total - discount - paid, 0));
      setBillStatus(status);
      setPaymentMethod(invoiceTests[0].payment_method || "Cash");
      setCollectionAgent(invoiceTests[0].collection_agent || "Reddy");
      setBillDate(date);

      // Get patient details
      const pat = await getPatientById(invoiceTests[0].patient_id);
      setPatient(pat);

      // Load branding settings
      const cachedBranding = localStorage.getItem("lab_receipt_settings");
      let currentBranding = { ...DEFAULT_BRANDING };
      if (cachedBranding) {
        const parsed = JSON.parse(cachedBranding);
        currentBranding = {
          ...DEFAULT_BRANDING,
          ...parsed,
          name: parsed.labName || parsed.name || DEFAULT_BRANDING.name,
          address: parsed.labAddress || parsed.address || DEFAULT_BRANDING.address,
        };
      }

      try {
        const dbLab = await getLabSetup();
        currentBranding = {
          ...currentBranding,
          name: dbLab.name || currentBranding.name,
          email: dbLab.email || currentBranding.email,
          phone: dbLab.phone || currentBranding.phone,
          website: dbLab.website || currentBranding.website,
          address: dbLab.address || currentBranding.address,
          logoUrl: dbLab.logo_path || currentBranding.logoUrl,
        };
      } catch (e) {
        console.error("Failed to load db lab details for bill branding", e);
      }
      setBranding(currentBranding);

      // Load saved notes from local storage if any
      const cached = localStorage.getItem(`notes_${invoiceId}`);
      if (cached) {
        setSavedNotes(JSON.parse(cached));
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to compile bill information.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBillDetails();
  }, [invoiceId]);

  // Settle Outstanding Balance
  const handleSettleBill = async () => {
    setSettling(true);
    try {
      for (const t of tests) {
        if (t.status === "Has due") {
          await updateTestPayment(t.id, "Paid");
        }
      }
      setModalConfig({
        isOpen: true,
        title: "Dues Settled",
        message: "Payment of outstanding balance has been recorded and updated successfully.",
        isConfirm: false,
        type: "success"
      });
      loadBillDetails();
    } catch (err: any) {
      console.error(err);
      setModalConfig({
        isOpen: true,
        title: "Error",
        message: "Failed to settle dues. Please check your backend connection.",
        isConfirm: false,
        type: "warning"
      });
    } finally {
      setSettling(false);
    }
  };

  // Cancel bill operation
  const handleCancelBill = () => {
    setModalConfig({
      isOpen: true,
      title: "Cancel Bill Confirmation",
      message: `Are you sure you want to cancel bill ${invoiceId}? This action is permanent and will cancel all laboratory test orders.`,
      isConfirm: true,
      type: "warning",
      onConfirm: async () => {
        try {
          for (const t of tests) {
            await updateTestPayment(t.id, "Canceled");
          }
          loadBillDetails();
        } catch (err) {
          console.error(err);
          setTimeout(() => {
            setModalConfig({
              isOpen: true,
              title: "Error",
              message: "Failed to cancel bill. Please check your backend connection.",
              isConfirm: false,
              type: "warning"
            });
          }, 100);
        }
      }
    });
  };

  // Add bill note
  const handleAddNote = () => {
    if (!billNote.trim()) return;
    const newNotes = [...savedNotes, billNote.trim()];
    setSavedNotes(newNotes);
    localStorage.setItem(`notes_${invoiceId}`, JSON.stringify(newNotes));
    setBillNote("");
    setModalConfig({
      isOpen: true,
      title: "Note Saved",
      message: "Internal reference note added to the bill successfully.",
      isConfirm: false,
      type: "success"
    });
  };

  // Duplicate Bill action
  const handleDuplicateBill = () => {
    setModalConfig({
      isOpen: true,
      title: "Duplicate Bill",
      message: `A duplicate record of bill ${invoiceId} has been generated. Standard printing parameters are pre-filled.`,
      isConfirm: false,
      type: "success"
    });
  };

  const sanitizeWhatsAppPhone = (phoneStr: string) => {
    let digits = phoneStr.replace(/[^\d]/g, "");
    if (digits.startsWith("910") && digits.length === 13) {
      digits = "91" + digits.slice(3);
    } else if (digits.startsWith("0") && digits.length === 11) {
      digits = "91" + digits.slice(1);
    } else if (digits.length === 10) {
      digits = "91" + digits;
    }
    return digits;
  };

  // Share Bill Link copy action
  const handleShareLink = () => {
    const shareUrl = qrUrl;
    navigator.clipboard.writeText(shareUrl);
    setModalConfig({
      isOpen: true,
      title: "Link Copied",
      message: "Direct link to this diagnostic bill (view-only) has been copied to your clipboard.",
      isConfirm: false,
      type: "success"
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDateShort = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateLong = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    
    return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <p className="text-sm font-semibold text-slate-500">Retrieving bill invoice data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-2xl text-center space-y-4 max-w-md mx-auto my-12 shadow-md">
        <AlertCircle className="h-10 w-10 mx-auto text-red-650" />
        <h3 className="font-bold text-sm">Invoice Not Found</h3>
        <p className="text-xs font-semibold">{error}</p>
        <button 
          onClick={() => router.push("/dashboard/cases/bills")} 
          className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-md tracking-wide"
        >
          Back to all bills
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-12 max-w-7xl mx-auto px-0">
      
      {/* Top Breadcrumb and Alerts Bar */}
      <div className="flex flex-col gap-3 border-b border-slate-100 dark:border-darkBorders pb-4 print:hidden">
        {/* Row 1: breadcrumb */}
        <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider flex-wrap">
          <Link href="/dashboard" className="hover:text-emerald-600">Dashboard</Link>
          <span>&gt;</span>
          <Link href="/dashboard/cases/bills" className="hover:text-emerald-600">Bills</Link>
          <span>&gt;</span>
          <span className="text-slate-500">Bill #{invoiceId.split("-").pop()}</span>
        </div>

        {/* Row 2: back + title + status + SMS badges */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button 
            onClick={() => router.push("/dashboard/cases/bills")}
            className="p-2 rounded-lg border border-slate-200 dark:border-darkBorders bg-white dark:bg-darkCard hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">Bill #{invoiceId.split("-").pop()}</h1>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border shrink-0 ${
            billStatus === "Paid" ? "bg-emerald-50 text-emerald-700 border-emerald-100 uppercase" :
            billStatus === "Canceled" ? "bg-red-50 text-red-750 border-red-100 uppercase" :
            "bg-amber-50 text-amber-700 border-amber-100 uppercase"
          }`}>
            {billStatus}
          </span>
          {/* SMS badges pushed to end on wider screens, wrap naturally on mobile */}
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <span className="flex items-center space-x-1 text-emerald-650 bg-emerald-50 px-2 sm:px-2.5 py-1 rounded-full border border-emerald-100/50 text-[9px] sm:text-[10px] font-bold whitespace-nowrap">
              <ShieldCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>Welcome SMS sent</span>
            </span>
            <span className="flex items-center space-x-1 text-emerald-650 bg-emerald-50 px-2 sm:px-2.5 py-1 rounded-full border border-emerald-100/50 text-[9px] sm:text-[10px] font-bold whitespace-nowrap">
              <ShieldCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>Bill SMS sent</span>
            </span>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 font-semibold -mt-1">Generated on {formatDateLong(billDate)}</p>
      </div>

      {/* Configuration bar */}
      <div className="bg-white dark:bg-darkCard p-3 sm:p-3.5 rounded-2xl border border-slate-100 dark:border-darkBorders shadow-[0_4px_25px_rgb(0,0,0,0.01)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden text-xs">
        {/* Config chips — scrollable on mobile */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 font-semibold text-slate-500 scrollbar-none">
          <div className="px-2.5 py-1.5 bg-slate-50 dark:bg-darkBg border border-slate-100 dark:border-darkBorders rounded-xl shrink-0">
            <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Bill Version</span>
            <span className="text-slate-800 dark:text-white font-extrabold mt-0.5 block text-xs">2</span>
          </div>
          <div className="px-2.5 py-1.5 bg-slate-50 dark:bg-darkBg border border-slate-100 dark:border-darkBorders rounded-xl shrink-0">
            <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Print Size</span>
            <span className="text-slate-800 dark:text-white font-extrabold mt-0.5 block text-xs">A5</span>
          </div>
          <div className="px-2.5 py-1.5 bg-slate-50 dark:bg-darkBg border border-slate-100 dark:border-darkBorders rounded-xl shrink-0">
            <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Orientation</span>
            <span className="text-slate-800 dark:text-white font-extrabold mt-0.5 block text-xs">Portrait</span>
          </div>
          <div className="px-2.5 py-1.5 bg-slate-50 dark:bg-darkBg border border-slate-100 dark:border-darkBorders rounded-xl shrink-0">
            <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Print Settings</span>
            <span className="text-slate-800 dark:text-white font-extrabold mt-0.5 block text-xs">Default</span>
          </div>
        </div>

        {/* Action buttons — full-width row on mobile, inline on sm+ */}
        <div className="flex items-center gap-2 font-bold tracking-wide shrink-0">
          <Link
            href={`/dashboard/cases/bills/${invoiceId}/edit`}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 border border-slate-200 dark:border-darkBorders hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all text-[11px] sm:text-xs whitespace-nowrap"
          >
            <Edit2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>Edit Bill</span>
          </Link>

          <button
            onClick={() => alert("Standard clinical audit logs exported.")}
            className="flex items-center gap-1 px-3 sm:px-4 py-2 border border-slate-200 dark:border-darkBorders hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all text-[11px] sm:text-xs whitespace-nowrap"
          >
            <span>More Actions</span>
            <ChevronDown className="h-3 w-3" />
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-[#00A770] hover:bg-[#009060] text-white rounded-xl shadow-md transition-all uppercase tracking-wider text-[10px] sm:text-[11px] whitespace-nowrap"
          >
            <Printer className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden xs:inline">Print /</span> <span>Download</span>
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Grid Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 text-xs font-semibold text-slate-650 dark:text-slate-350">
        {/* LEFT COLUMN: receipt */}
        <div className="lg:col-span-5 space-y-4 sm:space-y-6 print:col-span-12">
          
          <div 
            className="bg-white text-slate-900 rounded-2xl border border-slate-150 shadow-[0_10px_40px_rgba(0,0,0,0.02)] p-8 font-sans print:p-0 print:border-none print:shadow-none relative"
            style={{
              marginTop: `${branding.marginTop ?? 20}px`,
              marginBottom: `${branding.marginBottom ?? 20}px`
            }}
          >
            {/* 1. Header Block */}
            <div className="flex justify-between items-start pb-4">
              <div className="flex-1 pr-4">
                <h1 className="text-xl font-bold text-slate-800 tracking-wide leading-tight">{branding.name}</h1>
                {branding.address && (
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed whitespace-pre-line">{branding.address}</p>
                )}
                <p className="text-[11px] font-semibold text-slate-500 mt-1">
                  {branding.phone && <>Ph: {branding.phone}</>}
                  {branding.email && <> | {branding.email}</>}
                </p>
              </div>
              {branding.logoUrl && (
                <div className="relative group">
                  <img src={branding.logoUrl} alt="Logo" className="h-12 object-contain" />
                  <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1 print:hidden bg-white/80 p-1 rounded-lg">
                    <button 
                      onClick={() => setLogoInputOpen(true)}
                      className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-sm"
                      title="Update Logo"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    {branding.logoUrl && (
                      <button 
                        onClick={handleDeleteLogo}
                        className="p-1 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-sm"
                        title="Delete Logo"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Inline Logo Input Popover Dialog */}
            {logoInputOpen && (
              <div className="absolute left-0 top-16 bg-white border border-slate-200 p-4 rounded-2xl shadow-xl z-50 w-72 print:hidden space-y-3.5 animate-in fade-in zoom-in-95 duration-100">
                <div>
                  <h4 className="text-[10px] text-slate-800 font-extrabold uppercase tracking-wider">Configure Logo Link</h4>
                  <p className="text-[9px] text-slate-455 mt-0.5">Paste a public URL of your laboratory logo</p>
                </div>
                <input 
                  type="text" 
                  value={newLogoUrl}
                  onChange={(e) => setNewLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full h-9 px-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-[10px] font-mono"
                />
                <div className="flex justify-end space-x-1.5">
                  <button 
                    onClick={() => setLogoInputOpen(false)}
                    className="px-3 py-1.5 text-[10px] border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-650 font-bold"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleUpdateLogo(newLogoUrl)}
                    className="px-3.5 py-1.5 text-[10px] bg-[#00A770] text-white rounded-xl hover:bg-[#009060] font-black uppercase tracking-wider shadow-sm"
                  >
                    Apply Logo
                  </button>
                </div>
              </div>
            )}

            {/* Solid Divider */}
            <hr className="border-t border-slate-300 mb-6" />

            {/* 2. Metadata block */}
            <div className="grid grid-cols-3 gap-6 mb-6 text-xs font-semibold">
              
              {/* Left Column: Barcode and Reg details */}
              <div className="space-y-4">
                <div className="flex flex-col items-start font-mono text-[9px] text-slate-700">
                  <div className="flex h-7 items-end space-x-[1.5px] mb-1">
                    {[1,2,1,3,1,2,4,1,2,1,3,1,2,1,4,2,1,1,3,2,1,2,1,3].map((w, idx) => (
                      <div key={idx} className="bg-black" style={{ width: `${w * 0.75}px`, height: '100%' }} />
                    ))}
                  </div>
                  <span className="font-bold">Bill / Reg. No. {invoiceId.split("-").pop() || "1005"}</span>
                </div>
                
                <div className="space-y-1">
                  <div><span className="text-slate-500">Name :</span> <strong className="font-bold text-slate-800">{patient?.name || "Mr. Sundhar Reddy"}</strong></div>
                  <div><span className="text-slate-500">Age / Sex :</span> <span className="text-slate-700">{patient?.age || "33"} YRS / {patient?.gender?.toUpperCase()?.startsWith("F") ? "F" : patient?.gender?.toUpperCase()?.startsWith("M") ? "M" : "O"}</span></div>
                  <div><span className="text-slate-500">Mobile number :</span> <span className="text-slate-700">{patient?.phone || "8555053215"}</span></div>
                </div>
              </div>

              {/* Middle Column: Boxed Counter Indicator */}
              <div className="flex items-start justify-center pt-2">
                <div className="border border-slate-300 px-3.5 py-1.5 rounded-lg text-xs font-black text-slate-700 bg-slate-50">
                  {((tests[0]?.collection_centre || "Main").split(" ").map(w => w[0]).join("") || "C1").toUpperCase()}
                </div>
              </div>

              {/* Right Column: Booking details + QR */}
              <div className="space-y-1 text-right self-start">
                <div><span className="text-slate-500">Referred by :</span> <span className="text-slate-700">{tests[0]?.referral_doctor_name || "Self"}</span></div>
                <div><span className="text-slate-500">Date :</span> <span className="text-slate-700">{formatDateShort(billDate)}</span></div>
                <div className="flex justify-end mt-2">
                  <div className="flex flex-col items-center">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=72x72&data=${encodeURIComponent(qrUrl)}&color=062A22&bgcolor=FFFFFF`}
                      alt="Scan to view bill online"
                      className="w-[72px] h-[72px] border border-slate-200 rounded-md"
                    />
                    <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Scan to Verify</span>
                  </div>
                </div>
              </div>

            </div>

            {/* 3. Particulars Table */}
            <table className="w-full text-xs text-left border-collapse mb-8">
              <thead>
                <tr className="border-y-2 border-slate-800 text-[10px] font-black uppercase text-slate-805 tracking-wider">
                  <th className="py-2.5 w-16">S. NO.</th>
                  <th className="py-2.5">INVESTIGATIONS</th>
                  <th className="py-2.5 text-right w-32">AMOUNT</th>
                </tr>
              </thead>
              <tbody className="font-semibold text-slate-750">
                {tests.map((t, index) => (
                  <tr key={t.id} className="border-b border-slate-100">
                    <td className="py-3">{index + 1}.</td>
                    <td className="py-3 uppercase">{t.test_name}</td>
                    <td className="py-3 text-right">Rs.{t.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                
                {/* Summary Block */}
                <tr className="border-t border-slate-350">
                  <td colSpan={2} className="py-2 text-right text-slate-600 font-bold">Total amount</td>
                  <td className="py-2 text-right font-extrabold text-slate-800">Rs.{billTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                {billDiscount > 0 && (
                  <tr className="border-b border-slate-100">
                    <td colSpan={2} className="py-2 text-right text-slate-600 font-bold">Discount</td>
                    <td className="py-2 text-right font-extrabold text-slate-800">Rs.{billDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                )}
                <tr className="border-b border-slate-100">
                  <td colSpan={2} className="py-2 text-right text-slate-600 font-bold">Amount paid</td>
                  <td className="py-2 text-right font-extrabold text-slate-800">Rs.{billPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                {billBalance > 0 && (
                  <tr className="border-b border-slate-100">
                    <td colSpan={2} className="py-2 text-right text-slate-600 font-bold">Balance amount</td>
                    <td className="py-2 text-right font-extrabold text-red-655">Rs.{billBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                )}
                <tr className="border-b border-slate-200">
                  <td colSpan={2} className="py-2 text-slate-600 font-bold">Amount Paid (in words):</td>
                  <td className="py-2 text-right font-bold text-slate-700 italic">{amountToWords(billPaid)}</td>
                </tr>
              </tbody>
            </table>

            {/* 4. Footer */}
            <div className="text-center text-xs font-bold text-slate-500 py-4 mt-6">
              ~~~ Thank You ~~~
            </div>

          </div>

          {/* Receipt Actions panel */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 print:hidden font-bold tracking-wider text-[10px] uppercase mt-3 sm:mt-4">
            
            <button
              onClick={handlePrint}
              className="w-full py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all flex items-center justify-center sm:justify-between gap-1.5 px-2.5 sm:px-3"
            >
              <Printer className="h-4 w-4 shrink-0" />
              <span>Print</span>
            </button>

            <button
              onClick={handlePrint}
              className="w-full py-2.5 sm:py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
            >
              <FileText className="h-4 w-4 text-slate-400 shrink-0" />
              <span>PDF</span>
            </button>

            <a
              href={`https://api.whatsapp.com/send?phone=${sanitizeWhatsAppPhone(patient?.phone || "")}&text=${encodeURIComponent(
                `Hello ${patient?.name || ""}, your MediLabsPro diagnostics bill invoice ${invoiceId} is ready. Patient ID: ${patient?.patient_id || ""}. View your bill receipt and reports here: ${qrUrl}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 sm:py-3 bg-[#00A770] hover:bg-[#009060] text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="h-4 w-4 shrink-0" />
              <span>WhatsApp</span>
            </a>

            <button
              onClick={() => alert("Opened print settings dialogue.")}
              className="w-full py-2.5 sm:py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
            >
              <Settings className="h-4 w-4 text-slate-400 shrink-0" />
              <span>Settings</span>
            </button>

          </div>

        </div>

        {/* MIDDLE COLUMN: Transaction History & Activity Tracker */}
        <div className="lg:col-span-4 space-y-4 sm:space-y-6 print:hidden">
          
          {/* Transaction History card */}
          <div className="bg-white dark:bg-darkCard p-6 rounded-2xl border border-slate-100 dark:border-darkBorders shadow-[0_4px_25px_rgb(0,0,0,0.015)]">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-3.5">
              <h3 className="font-extrabold text-slate-800 dark:text-white text-xs uppercase tracking-wider">Transaction History</h3>
              <button className="text-[10px] text-emerald-600 font-bold hover:underline">View All</button>
            </div>

            <div className="overflow-x-auto text-[10px] -mx-1">
              <table className="w-full min-w-[360px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[8px]">
                    <th className="pb-1.5 pr-2">Date</th>
                    <th className="pb-1.5 pr-2">Time</th>
                    <th className="pb-1.5 pr-2">Amount</th>
                    <th className="pb-1.5 pr-2">Rcvd By</th>
                    <th className="pb-1.5 text-right">Mode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 font-bold text-slate-700 dark:text-slate-300">
                  {billPaid > 0 && (
                    <tr className="uppercase">
                      <td className="py-2.5 pr-2 text-slate-800 dark:text-white font-bold whitespace-nowrap">{formatDateShort(billDate)}</td>
                      <td className="py-2.5 pr-2 text-slate-400 font-medium whitespace-nowrap">{new Date(billDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="py-2.5 pr-2 text-emerald-600 font-extrabold whitespace-nowrap">+ Rs.{billPaid.toLocaleString()}</td>
                      <td className="py-2.5 pr-2 text-slate-500 whitespace-nowrap">{collectionAgent}</td>
                      <td className="py-2.5 text-right whitespace-nowrap">{paymentMethod}</td>
                    </tr>
                  )}
                  {billBalance > 0 && (
                    <tr>
                      <td colSpan={4} className="py-2.5 pr-2 text-red-500 font-bold italic text-[10px]">
                        Balance due: Rs.{billBalance.toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={handleSettleBill}
                          disabled={settling}
                          className="px-2 py-1 bg-red-600 text-white rounded-lg text-[9px] uppercase tracking-wider font-extrabold whitespace-nowrap"
                        >
                          Settle
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activities Tracker card */}
          <div className="bg-white dark:bg-darkCard p-6 rounded-2xl border border-slate-100 dark:border-darkBorders shadow-[0_4px_25px_rgb(0,0,0,0.015)]">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-3.5">
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-slate-800 dark:text-white text-xs uppercase tracking-wider">Activities</h3>
                <span className="bg-amber-50 text-amber-700 text-[8px] font-black px-1.5 py-0.5 rounded border border-amber-100/50 uppercase">Advanced plan feature</span>
              </div>
            </div>

            {/* Empty activities view matching mockup */}
            <div className="flex flex-col items-center justify-center text-center py-10">
              <div className="h-16 w-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600 mb-4 border border-slate-100 dark:border-slate-800 shadow-[inset_0_4px_10px_rgba(0,0,0,0.02)]">
                <Search className="h-8 w-8" />
              </div>
              <p className="text-xs text-slate-400 font-bold">No recent activities to show.</p>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Quick Access, Shortcuts & Notes */}
        <div className="lg:col-span-3 space-y-4 sm:space-y-6 print:hidden">
          
          {/* Quick Access links */}
          <div className="bg-white dark:bg-darkCard p-5 rounded-2xl border border-slate-100 dark:border-darkBorders shadow-[0_4px_25px_rgb(0,0,0,0.015)] space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <h3 className="font-extrabold text-slate-850 dark:text-white text-xs uppercase tracking-wider">Quick Access</h3>
            </div>
            
            <div className="space-y-3 font-bold text-xs text-slate-650 dark:text-slate-350">
              
              <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-darkBg rounded-xl border border-slate-100/50 dark:border-darkBorders">
                <span className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-indigo-500" />
                  <span>Patient Info</span>
                </span>
                <div className="flex items-center space-x-2 shrink-0">
                  <Link href="/dashboard/patients" className="p-1 text-slate-400 hover:text-indigo-650 rounded border border-slate-200 bg-white">
                    <Edit2 className="h-3 w-3" />
                  </Link>
                  <Link href="/dashboard/patients" className="p-1 text-slate-400 hover:text-indigo-650 rounded border border-slate-200 bg-white">
                    <Eye className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-darkBg rounded-xl border border-slate-100/50 dark:border-darkBorders">
                <span className="flex items-center space-x-2">
                  <Stethoscope className="h-4 w-4 text-amber-500" />
                  <span>Doctor Info</span>
                </span>
                <div className="flex items-center space-x-2 shrink-0">
                  <Link href="/dashboard/referrals" className="p-1 text-slate-400 hover:text-amber-650 rounded border border-slate-200 bg-white">
                    <Edit2 className="h-3 w-3" />
                  </Link>
                  <Link href="/dashboard/referrals" className="p-1 text-slate-400 hover:text-amber-650 rounded border border-slate-200 bg-white">
                    <Eye className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-darkBg rounded-xl border border-slate-100/50 dark:border-darkBorders">
                <span className="flex items-center space-x-2">
                  <History className="h-4 w-4 text-pink-500" />
                  <span>Patient History</span>
                </span>
                <Link href="/dashboard/patients" className="p-1 text-slate-400 hover:text-pink-650 rounded border border-slate-200 bg-white">
                  <Edit2 className="h-3 w-3" />
                </Link>
              </div>

              <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-darkBg rounded-xl border border-slate-100/50 dark:border-darkBorders">
                <span className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-emerald-500" />
                  <span>Recent Lab Reports</span>
                </span>
                <Link href="/dashboard/reports" className="p-1 text-slate-400 hover:text-emerald-650 rounded border border-slate-200 bg-white">
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

            </div>
          </div>

          {/* Shortcuts panel */}
          <div className="bg-white dark:bg-darkCard p-5 rounded-2xl border border-slate-100 dark:border-darkBorders shadow-[0_4px_25px_rgb(0,0,0,0.015)] space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <h3 className="font-extrabold text-slate-850 dark:text-white text-xs uppercase tracking-wider">Shortcuts</h3>
            </div>

            <div className="space-y-2 font-bold text-xs text-slate-650 dark:text-slate-350">
              
              <button 
                onClick={handleDuplicateBill}
                className="w-full flex items-center space-x-3 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all text-left"
              >
                <Clipboard className="h-4.5 w-4.5 text-slate-400" />
                <span>Duplicate Bill</span>
              </button>

              <button 
                onClick={handleShareLink}
                className="w-full flex items-center space-x-3 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all text-left"
              >
                <Share2 className="h-4.5 w-4.5 text-slate-400" />
                <span>Share Bill Link</span>
              </button>

              <button 
                onClick={handlePrint}
                className="w-full flex items-center space-x-3 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all text-left"
              >
                <Download className="h-4.5 w-4.5 text-slate-400" />
                <span>Download Receipt</span>
              </button>

              <button 
                onClick={() => {
                  if (billStatus === "Paid") {
                    setModalConfig({
                      isOpen: true,
                      title: "Mark as Unpaid",
                      message: "Change bill payment status to Pending?",
                      isConfirm: true,
                      onConfirm: async () => {
                        try {
                          for (const t of tests) {
                            await updateTestPayment(t.id, "Pending");
                          }
                          loadBillDetails();
                        } catch (err) {
                          alert("Failed to update status.");
                        }
                      }
                    });
                  } else {
                    handleSettleBill();
                  }
                }}
                className="w-full flex items-center space-x-3 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all text-left"
              >
                <CheckCircle2 className="h-4.5 w-4.5 text-slate-400" />
                <span>{billStatus === "Paid" ? "Mark as Unpaid" : "Mark as Paid"}</span>
              </button>

              {billStatus !== "Canceled" && (
                <button 
                  onClick={handleCancelBill}
                  className="w-full flex items-center space-x-3 p-2.5 text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all text-left"
                >
                  <Ban className="h-4.5 w-4.5 text-red-400" />
                  <span>Cancel Bill</span>
                </button>
              )}

            </div>
          </div>

          {/* Bill Notes card */}
          <div className="bg-white dark:bg-darkCard p-5 rounded-2xl border border-slate-100 dark:border-darkBorders shadow-[0_4px_25px_rgb(0,0,0,0.015)] space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <h3 className="font-extrabold text-slate-850 dark:text-white text-xs uppercase tracking-wider">Bill Notes</h3>
            </div>

            <div className="space-y-3">
              <textarea
                value={billNote}
                onChange={(e) => setBillNote(e.target.value)}
                placeholder="Add internal notes about this bill..."
                rows={3}
                className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-150 dark:border-darkBorders rounded-xl focus:outline-none focus:border-emerald-500 font-semibold"
              ></textarea>

              <button
                onClick={handleAddNote}
                className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-bold text-xs rounded-xl transition-all border border-emerald-100/50"
              >
                Add Note
              </button>

              {savedNotes.length > 0 && (
                <div className="space-y-2 mt-2 pt-2 border-t border-slate-100 border-dashed max-h-[140px] overflow-y-auto scrollbar-thin">
                  {savedNotes.map((note, idx) => (
                    <div key={idx} className="p-2 bg-slate-50/50 rounded-lg text-[10px] text-slate-650 leading-normal border border-slate-100/30">
                      {note}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Premium Dialogue Box Modal */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm transition-all duration-300 animate-fadeIn">
          <div className="bg-white dark:bg-darkCard border border-slate-100 dark:border-darkBorders rounded-2xl p-6 w-full max-w-sm shadow-[0_20px_50px_rgba(0,0,0,0.15)] transform scale-100 transition-all">
            <div className={`flex items-center space-x-3 mb-4 ${
              modalConfig.type === "success" ? "text-emerald-500" :
              modalConfig.type === "warning" ? "text-red-500" :
              "text-amber-500"
            }`}>
              <ShieldAlert className="h-6 w-6 shrink-0" />
              <h3 className="text-base font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">{modalConfig.title}</h3>
            </div>
            
            <p className="text-xs font-semibold text-slate-650 dark:text-slate-350 leading-relaxed">
              {modalConfig.message}
            </p>

            <div className="mt-6 flex justify-end space-x-3 font-bold text-xs uppercase tracking-wider">
              {modalConfig.isConfirm && (
                <button
                  onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}
                  className="px-4 py-2.5 text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 rounded-lg transition-all"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={() => {
                  setModalConfig({ ...modalConfig, isOpen: false });
                  if (modalConfig.onConfirm) modalConfig.onConfirm();
                }}
                className={`px-5 py-2.5 text-white rounded-lg shadow-md hover:shadow-lg transition-all ${
                  modalConfig.type === "warning" ? "bg-red-650 hover:bg-red-750" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {modalConfig.isConfirm ? "Confirm" : "Ok"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
