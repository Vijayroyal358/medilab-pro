"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getTests, getPatientById, getLabSetup } from "../../../../services/data";
import { Test, Patient } from "../../../../types/index";
import { 
  AlertCircle, Phone, Mail, Globe, MapPin, Microscope, Heart
} from "lucide-react";

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
    if (n < 1000) return ones[Math.floor(n / 100)] + " hundred" + (n % 100 !== 0 ? " and " + convert(n % 100) : "");
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

export default function PublicBillVerificationPage() {
  const params = useParams();
  const invoiceId = params.id as string;

  const qrUrl = typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.host}/verify/bill/${invoiceId}`
    : `http://localhost:3000/verify/bill/${invoiceId}`;

  const [tests, setTests] = useState<Test[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [branding, setBranding] = useState<LabBranding>(DEFAULT_BRANDING);

  const [billTotal, setBillTotal] = useState(0);
  const [billPaid, setBillPaid] = useState(0);
  const [billDiscount, setBillDiscount] = useState(0);
  const [billBalance, setBillBalance] = useState(0);
  const [billStatus, setBillStatus] = useState("No due");
  const [collectionAgent, setCollectionAgent] = useState("Reddy");
  const [billDate, setBillDate] = useState("");

  useEffect(() => {
    const loadBillDetails = async () => {
      setLoading(true);
      setError("");
      try {
        const allTests = await getTests();
        const invoiceTests = allTests.filter(
          t => t.invoice_number.toLowerCase() === invoiceId.toLowerCase()
        );

        if (invoiceTests.length === 0) {
          setError(`Invoice with reference number ${invoiceId} was not found.`);
          setLoading(false);
          return;
        }

        setTests(invoiceTests);

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
        setCollectionAgent(invoiceTests[0].collection_agent || "Reddy");
        setBillDate(date);

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
          console.error("Failed to load db lab details for verify bill branding", e);
        }
        setBranding(currentBranding);
      } catch (err: any) {
        console.error(err);
        setError("Failed to compile bill information.");
      } finally {
        setLoading(false);
      }
    };

    loadBillDetails();
  }, [invoiceId]);

  const formatDateShort = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <p className="text-xs font-semibold text-slate-500 font-mono">Retrieving digital bill receipt...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-100 p-6 rounded-2xl text-center space-y-4 max-w-sm w-full shadow-lg">
          <AlertCircle className="h-10 w-10 mx-auto text-red-500" />
          <h3 className="font-extrabold text-sm text-slate-800 font-mono uppercase tracking-wider">Verification Error</h3>
          <p className="text-xs font-semibold text-slate-500 leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 flex flex-col items-center justify-center print:bg-white print:p-0">
      
      {/* Receipt container */}
      <div 
        className="bg-white text-slate-900 rounded-2xl border border-slate-150 shadow-[0_10px_40px_rgba(0,0,0,0.03)] p-8 font-sans w-full max-w-2xl print:p-0 print:border-none print:shadow-none print:rounded-none relative"
        style={{
          marginTop: `${branding.marginTop ?? 20}px`,
          marginBottom: `${branding.marginBottom ?? 20}px`
        }}
      >
        
        {/* Verification badge — hidden on print */}
        <div className="bg-emerald-50 text-emerald-700 border border-emerald-100/50 py-2.5 px-4 font-bold text-[10px] uppercase tracking-wider text-center flex items-center justify-center space-x-1.5 rounded-xl mb-6 print:hidden">
          <span>✓ Verified Patient Bill Receipt</span>
        </div>

        {/* ── HEADER: Lab name + address on left, logo on right ── */}
        <div className="flex justify-between items-start pb-3">
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
            <img src={branding.logoUrl} alt="Lab Logo" className="h-14 object-contain shrink-0" />
          )}
        </div>

        {/* Solid Divider */}
        <hr className="border-t-2 border-slate-800 mb-5" />

        {/* ── METADATA: barcode+patient | counter badge | booking details+QR ── */}
        <div className="grid grid-cols-3 gap-4 mb-6 text-xs font-semibold">
          
          {/* Left: Barcode + Patient Info */}
          <div className="space-y-3 col-span-2 md:col-span-1">
            <div className="flex flex-col items-start font-mono text-[9px] text-slate-700">
              <div className="flex h-7 items-end space-x-[1.5px] mb-1">
                {[1,2,1,3,1,2,4,1,2,1,3,1,2,1,4,2,1,1,3,2,1,2,1,3].map((w, idx) => (
                  <div key={idx} className="bg-black" style={{ width: `${w * 0.75}px`, height: '100%' }} />
                ))}
              </div>
              <span className="font-bold text-[9px]">Bill / Reg. No. {invoiceId.split("-").pop() || "1005"}</span>
            </div>
            
            <div className="space-y-0.5">
              <div><span className="text-slate-500">Name :</span> <strong className="font-bold text-slate-800">{patient?.name}</strong></div>
              <div><span className="text-slate-500">Age / Sex :</span> <span className="text-slate-700">{patient?.age} YRS / {patient?.gender?.toUpperCase()?.startsWith("F") ? "F" : patient?.gender?.toUpperCase()?.startsWith("M") ? "M" : "O"}</span></div>
              <div><span className="text-slate-500">Mobile number :</span> <span className="text-slate-700">{patient?.phone}</span></div>
            </div>
          </div>

          {/* Middle: Counter Abbreviation Badge */}
          <div className="hidden md:flex items-start justify-center pt-2">
            <div className="border border-slate-300 px-3.5 py-1.5 rounded-lg text-xs font-black text-slate-700 bg-slate-50">
              {((tests[0]?.collection_centre || "Main").split(" ").map((w: string) => w[0]).join("") || "C1").toUpperCase()}
            </div>
          </div>

          {/* Right: Booking details + QR */}
          <div className="space-y-1 text-right self-start">
            <div><span className="text-slate-500">Referred by :</span> <span className="text-slate-700">{tests[0]?.referral_doctor_name || "Self"}</span></div>
            <div><span className="text-slate-500">Date :</span> <span className="text-slate-700">{formatDateShort(billDate)}</span></div>

            {/* Scannable QR — links to this same verified page */}
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

        {/* ── PARTICULARS TABLE ── */}
        <table className="w-full text-xs text-left border-collapse mb-2">
          <thead>
            <tr className="border-y-2 border-slate-800 text-[10px] font-black uppercase text-slate-800 tracking-wider">
              <th className="py-2 w-14">S. NO.</th>
              <th className="py-2">INVESTIGATIONS</th>
              <th className="py-2 text-right w-32">AMOUNT</th>
            </tr>
          </thead>
          <tbody className="font-semibold text-slate-750">
            {tests.map((t, index) => (
              <tr key={t.id} className="border-b border-slate-100">
                <td className="py-2.5">{index + 1}.</td>
                <td className="py-2.5 uppercase">{t.test_name}</td>
                <td className="py-2.5 text-right">Rs.{t.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            ))}
            
            {/* Summary rows */}
            <tr className="border-t-2 border-slate-300">
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
              <tr className="border-b border-slate-200">
                <td colSpan={2} className="py-2 text-right text-red-600 font-bold">Balance due</td>
                <td className="py-2 text-right font-extrabold text-red-600">Rs.{billBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            )}
            <tr className="border-t border-slate-200">
              <td colSpan={2} className="py-2 text-slate-600 font-semibold text-[11px]">Amount Paid (in words):</td>
              <td className="py-2 text-right font-bold text-slate-700 italic text-[11px]">{amountToWords(billPaid)}</td>
            </tr>
          </tbody>
        </table>

        {/* ── FOOTER ── */}
        <div className="border-t border-slate-200 mt-6 pt-4 text-center text-xs font-bold text-slate-400">
          ~~~ Thank You ~~~
        </div>

      </div>

    </div>
  );
}
