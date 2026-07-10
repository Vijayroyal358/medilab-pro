"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTests, updateTestPayment, getPatientById, getReferrals, registerTest } from "../../../../../../services/data";
import { Test, Patient, ReferralDoctor } from "../../../../../../types/index";
import { 
  ArrowLeft, Printer, FileText, CheckCircle2, 
  AlertCircle, Share2, Settings, User, Stethoscope, 
  History, Eye, Landmark, Loader2, RefreshCw, PenTool,
  Plus, Edit2, Calendar, ClipboardCheck, Activity, Check,
  FlaskConical, Heart, Shield, HardDrive, Ban, ChevronDown,
  Building, Zap, Brain, HeartPulse, Smile, Sparkles
} from "lucide-react";
import Link from "next/link";

// COMPREHENSIVE MEDICAL TEST DATABASE
const TESTS_DATABASE: Record<string, Array<{ name: string; price: number; category: string }>> = {
  LAB: [
    { name: "ABG (Arterial Blood Gas)", price: 500, category: "Biochemistry" },
    { name: "AEC (Absolute Eosinophil Count)", price: 150, category: "Hematology" },
    { name: "AFB (Acid Fast Bacilli) Stain", price: 200, category: "Microbiology" },
    { name: "AFP (Alpha-Fetoprotein)", price: 600, category: "Serology" },
    { name: "A/G Ratio (Albumin/Globulin)", price: 250, category: "Biochemistry" },
    { name: "Complete Blood Count (CBC)", price: 350, category: "Hematology" },
    { name: "Urine Routine & Microscopy", price: 150, category: "Pathology" },
    { name: "Lipid Profile", price: 650, category: "Biochemistry" },
    { name: "Liver Function Test (LFT)", price: 850, category: "Biochemistry" },
    { name: "Thyroid Profile (T3, T4, TSH)", price: 550, category: "Biochemistry" }
  ],
  USG: [
    { name: "USG Abdomen Plain", price: 1000, category: "USG" },
    { name: "USG Pelvis Plain", price: 800, category: "USG" },
    { name: "USG Abdomen & Pelvis (KUB)", price: 1500, category: "USG" },
    { name: "USG Obstetric (Fetal Well-being)", price: 1200, category: "USG" }
  ],
  "DIGITAL XRAY": [
    { name: "Chest X-Ray PA View", price: 400, category: "Digital X-Ray" },
    { name: "Spine AP & Lateral View", price: 700, category: "Digital X-Ray" }
  ],
  XRAY: [
    { name: "Chest X-Ray Plain PA", price: 300, category: "Plain X-Ray" }
  ],
  "OUTSOURCE LAB": [
    { name: "Histopathology Biopsy (Small)", price: 1500, category: "Histology" },
    { name: "Histopathology Biopsy (Large)", price: 3000, category: "Histology" }
  ],
  ECG: [
    { name: "12-Lead Electrocardiogram (ECG)", price: 300, category: "Cardiology" }
  ],
  "CT SCAN": [
    { name: "CT Brain Plain", price: 2000, category: "CT Scan" },
    { name: "CT Brain Contrast (CECT)", price: 3800, category: "CT Scan" }
  ],
  MRI: [
    { name: "Brain MRI Plain", price: 5000, category: "MRI" },
    { name: "Spine MRI Plain (Lumbar/Cervical)", price: 4500, category: "MRI" }
  ],
  EPS: [
    { name: "EPS Study (Basic Diagnostic)", price: 12000, category: "Electrophysiology" }
  ],
  OPG: [
    { name: "OPG Dental Panoramic View", price: 600, category: "Radiology Dental" }
  ],
  CARDIOLOGY: [
    { name: "2D Echocardiography (2D Echo)", price: 2000, category: "Cardiology" }
  ],
  EEG: [
    { name: "Routine EEG (30 Mins)", price: 1500, category: "EEG" }
  ],
  MAMMOGRAPHY: [
    { name: "Mammography Bilateral", price: 1500, category: "Mammography" }
  ]
};

// Category Icons list
const MODALITY_DETAILS: Record<string, { label: string; icon: React.ReactNode }> = {
  LAB: { label: "LAB", icon: <FlaskConical className="h-5 w-5 text-blue-500" /> },
  USG: { label: "USG", icon: <Activity className="h-5 w-5 text-green-500" /> },
  "DIGITAL XRAY": { label: "DIGITAL XRAY", icon: <HardDrive className="h-5 w-5 text-purple-500" /> },
  XRAY: { label: "XRAY", icon: <FileText className="h-5 w-5 text-cyan-500" /> },
  "OUTSOURCE LAB": { label: "OUTSOURCE LAB", icon: <Building className="h-5 w-5 text-slate-500" /> },
  ECG: { label: "ECG", icon: <Heart className="h-5 w-5 text-red-500" /> },
  "CT SCAN": { label: "CT SCAN", icon: <Shield className="h-5 w-5 text-orange-500" /> },
  MRI: { label: "MRI", icon: <Brain className="h-5 w-5 text-indigo-500" /> },
  EPS: { label: "EPS", icon: <Zap className="h-5 w-5 text-yellow-500" /> },
  OPG: { label: "OPG", icon: <Smile className="h-5 w-5 text-pink-500" /> },
  CARDIOLOGY: { label: "CARDIOLOGY", icon: <HeartPulse className="h-5 w-5 text-rose-500" /> },
  EEG: { label: "EEG", icon: <Brain className="h-5 w-5 text-violet-500" /> },
  MAMMOGRAPHY: { label: "MAMMOGRAPHY", icon: <Sparkles className="h-5 w-5 text-amber-500" /> }
};

interface ActiveModalityGroup {
  modality: string;
  tests: Array<{ name: string; price: number; category: string }>;
  paid: number;
  discount: number;
  searchText: string;
  showDropdown: boolean;
}

export default function ModifyBillPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const [tests, setTests] = useState<Test[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [referrals, setReferrals] = useState<ReferralDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  // Collapsible sections
  const [patientDetailsExpanded, setPatientDetailsExpanded] = useState(true);

  // Edit Patient Info states
  const [editModePatient, setEditModePatient] = useState(false);
  const [patientTitle, setPatientTitle] = useState("Mr.");
  const [patientFirstName, setPatientFirstName] = useState("");
  const [patientLastName, setPatientLastName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientAge, setPatientAge] = useState(30);
  const [onlineReport, setOnlineReport] = useState(true);

  // Case Details states
  const [referredByDocId, setReferredByDocId] = useState<string>("self");
  const [collectionCentre, setCollectionCentre] = useState("Main");
  const [collectionAgent, setCollectionAgent] = useState("Reddy");
  const [registeredOn, setRegisteredOn] = useState("");

  // Billing Groups
  const [activeGroups, setActiveGroups] = useState<Record<string, ActiveModalityGroup>>({});

  // Payment states
  const [generalDiscount, setGeneralDiscount] = useState(0);
  const [isDiscountPercent, setIsDiscountPercent] = useState(false);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [remarks, setRemarks] = useState("");
  const [isCanceled, setIsCanceled] = useState(false);
  const [staffList, setStaffList] = useState<{id: number; name: string}[]>([]);

  const loadBillData = async () => {
    setLoading(true);
    try {
      const [allTests, referralList, staffRes] = await Promise.all([
        getTests(),
        getReferrals(),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://medilab-pro.onrender.com"}/setup/staff`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("medilab_access_token")}` }
        }).then(r => r.ok ? r.json() : [])
      ]);
      setReferrals(referralList);
      setStaffList(Array.isArray(staffRes) ? staffRes : []);

      const matchedTests = allTests.filter(
        t => t.invoice_number.toLowerCase() === invoiceId.toLowerCase()
      );

      if (matchedTests.length === 0) {
        setError(`Bill invoice ${invoiceId} not found.`);
        return;
      }

      setTests(matchedTests);

      // Load patient details
      const pat = await getPatientById(matchedTests[0].patient_id);
      setPatient(pat);

      // Populate form
      setPatientTitle(pat.title || "Mr.");
      setPatientFirstName(pat.first_name || pat.name.split(" ")[0]);
      setPatientLastName(pat.last_name || pat.name.split(" ").slice(1).join(" "));
      setPatientPhone(pat.phone);
      setPatientAge(pat.age_years || pat.age);
      setOnlineReport(pat.online_report_requested);

      setReferredByDocId(matchedTests[0].referral_doctor_id ? String(matchedTests[0].referral_doctor_id) : "self");
      setCollectionCentre(matchedTests[0].collection_centre || "Main");
      setCollectionAgent(matchedTests[0].collection_agent || "Reddy");
      setRegisteredOn(matchedTests[0].created_at.slice(0, 16));

      // Reconstruct billing groups by modality
      const groups: Record<string, ActiveModalityGroup> = {};
      matchedTests.forEach((t) => {
        const mod = t.modality || "LAB";
        if (!groups[mod]) {
          groups[mod] = {
            modality: mod,
            tests: [],
            paid: 0,
            discount: 0,
            searchText: "",
            showDropdown: false
          };
        }
        groups[mod].tests.push({
          name: t.test_name,
          price: t.price,
          category: t.category
        });
        groups[mod].paid += t.amount_received;
        groups[mod].discount += t.discount;
      });

      setActiveGroups(groups);

      setPaymentMode(matchedTests[0].payment_method?.toLowerCase() || "cash");
      setRemarks(matchedTests[0].remarks || "");
      setIsCanceled(matchedTests[0].status === "Canceled");
    } catch (err) {
      console.error(err);
      setError("Failed to compile bill modification form.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBillData();
  }, [invoiceId]);

  // Modality group togglers
  const toggleModalityGroup = (modality: string) => {
    setActiveGroups(prev => {
      const updated = { ...prev };
      if (updated[modality]) {
        delete updated[modality];
      } else {
        updated[modality] = {
          modality: modality,
          tests: [],
          paid: 0,
          discount: 0,
          searchText: "",
          showDropdown: false
        };
      }
      return updated;
    });
  };

  const handleTestSearchTextChange = (modality: string, text: string) => {
    setActiveGroups(prev => ({
      ...prev,
      [modality]: {
        ...prev[modality],
        searchText: text,
        showDropdown: true
      }
    }));
  };

  const addTestToGroup = (modality: string, test: { name: string; price: number; category: string }) => {
    setActiveGroups(prev => {
      const group = prev[modality];
      if (group.tests.find(t => t.name === test.name)) return prev;
      
      const updatedTests = [...group.tests, test];
      const subtotal = updatedTests.reduce((sum, t) => sum + t.price, 0);
      
      return {
        ...prev,
        [modality]: {
          ...group,
          tests: updatedTests,
          paid: subtotal,
          searchText: "",
          showDropdown: false
        }
      };
    });
  };

  const removeTestFromGroup = (modality: string, testName: string) => {
    setActiveGroups(prev => {
      const group = prev[modality];
      const updatedTests = group.tests.filter(t => t.name !== testName);
      const subtotal = updatedTests.reduce((sum, t) => sum + t.price, 0);

      return {
        ...prev,
        [modality]: {
          ...group,
          tests: updatedTests,
          paid: Math.max(subtotal - group.discount, 0)
        }
      };
    });
  };

  const updateGroupPaid = (modality: string, amt: number) => {
    setActiveGroups(prev => ({
      ...prev,
      [modality]: {
        ...prev[modality],
        paid: amt
      }
    }));
  };

  const updateGroupDiscount = (modality: string, disc: number) => {
    setActiveGroups(prev => ({
      ...prev,
      [modality]: {
        ...prev[modality],
        discount: disc
      }
    }));
  };

  // Grand Billing Calculators
  const calculateGrandTotal = () => {
    return Object.values(activeGroups).reduce((sum, group) => {
      return sum + group.tests.reduce((s, t) => s + t.price, 0);
    }, 0);
  };

  const calculateTotalDiscounts = () => {
    const groupDiscounts = Object.values(activeGroups).reduce((sum, group) => sum + group.discount, 0);
    const grandTotal = calculateGrandTotal();
    let globalDisc = generalDiscount;
    if (isDiscountPercent) {
      globalDisc = (grandTotal * generalDiscount) / 100;
    }
    return groupDiscounts + globalDisc;
  };

  const calculateGrandNetTotal = () => {
    return Math.max(calculateGrandTotal() - calculateTotalDiscounts(), 0);
  };

  const calculateGrandPaid = () => {
    return Object.values(activeGroups).reduce((sum, group) => sum + group.paid, 0);
  };

  const calculateGrandBalance = () => {
    return Math.max(calculateGrandNetTotal() - calculateGrandPaid(), 0);
  };

  // Submit modifications
  const handleUpdateBill = async () => {
    setUpdating(true);
    try {
      const balance = calculateGrandBalance();
      // Update matching tests on backend
      for (const t of tests) {
        await updateTestPayment(t.id, isCanceled ? "Canceled" : (balance <= 0 ? "Paid" : "Pending"));
      }

      alert("Bill updated successfully!");
      router.push("/dashboard/cases/bills");
    } catch (err) {
      console.error(err);
      alert("Failed to save changes.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-danger p-6 rounded-xl text-center space-y-3 dark:bg-red-950/20 dark:border-red-900/40 max-w-md mx-auto my-12">
        <AlertCircle className="h-10 w-10 mx-auto" />
        <h3 className="font-bold text-sm">Error</h3>
        <p className="text-xs">{error}</p>
        <button onClick={() => router.push("/dashboard/cases/bills")} className="px-4 py-2 bg-danger text-white rounded-lg text-xs font-bold shadow-sm">
          Back to all bills
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 text-xs font-medium text-slate-700 dark:text-slate-350">
      
      {/* Top Breadcrumb Nav */}
      <div className="flex items-center space-x-2 text-[10px] text-mutedText dark:text-slate-400 uppercase tracking-wide">
        <Link href="/dashboard" className="hover:underline">DASHBOARD</Link>
        <span>/</span>
        <span>BILL - {invoiceId}</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center border-b border-borders dark:border-darkBorders pb-3">
        <div className="flex items-center space-x-2">
          <PenTool className="h-5 w-5 text-blue-600" />
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Modify bill</h1>
        </div>
        <button 
          onClick={() => router.push("/dashboard/cases/bills")}
          className="flex items-center space-x-1 px-3 py-1.5 border border-borders dark:border-darkBorders bg-white dark:bg-darkCard rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back</span>
        </button>
      </div>

      {/* SECTION 1: Patient details collapsible block */}
      <div className="bg-white dark:bg-darkCard rounded-xl border border-borders dark:border-darkBorders shadow-sm overflow-hidden">
        
        {/* Collapsible Header */}
        <div className="px-5 py-4 border-b border-borders dark:border-slate-850 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/10">
          <div className="flex items-center space-x-2.5">
            <span className="h-5 w-5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-[10px] font-bold">1</span>
            <h3 className="font-bold text-slate-850 dark:text-white text-sm">Patient details</h3>
          </div>
          <div className="flex items-center space-x-2">
            <Link href="/dashboard/patients" className="px-3 py-1 bg-white border border-borders dark:bg-darkCard dark:border-darkBorders hover:bg-slate-50 dark:hover:bg-slate-800 text-[10px] font-bold rounded-lg transition-colors flex items-center space-x-1">
              <User className="h-3 w-3" />
              <span>View profile</span>
            </Link>
            <button 
              onClick={() => setPatientDetailsExpanded(!patientDetailsExpanded)}
              className="text-slate-400 p-1 hover:text-slate-655"
            >
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${patientDetailsExpanded ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>

        {/* Collapsible Body */}
        {patientDetailsExpanded && (
          <div className="p-6 space-y-4">
            
            {editModePatient ? (
              <div className="grid grid-cols-6 gap-4 border border-dashed border-borders dark:border-darkBorders p-4 rounded-xl">
                <div className="col-span-2">
                  <label className="block text-[10px] text-slate-500 mb-1">Title</label>
                  <select
                    value={patientTitle}
                    onChange={(e) => setPatientTitle(e.target.value)}
                    className="px-3 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-xs focus:outline-none"
                  >
                    <option value="Mr.">Mr.</option>
                    <option value="Mrs.">Mrs.</option>
                    <option value="Ms.">Ms.</option>
                    <option value="Dr.">Dr.</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] text-slate-500 mb-1">First Name</label>
                  <input
                    type="text"
                    value={patientFirstName}
                    onChange={(e) => setPatientFirstName(e.target.value)}
                    className="px-3 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-xs focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] text-slate-500 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={patientLastName}
                    onChange={(e) => setPatientLastName(e.target.value)}
                    className="px-3 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-xs focus:outline-none"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-[10px] text-slate-500 mb-1">Mobile No</label>
                  <input
                    type="text"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="px-3 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-xs focus:outline-none"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-[10px] text-slate-500 mb-1">Age (Years)</label>
                  <input
                    type="number"
                    value={patientAge}
                    onChange={(e) => setPatientAge(Number(e.target.value))}
                    className="px-3 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-xs focus:outline-none"
                  />
                </div>
                <div className="col-span-6 flex justify-end space-x-2 mt-2">
                  <button 
                    onClick={() => {
                      if (patient) {
                        patient.name = `${patientTitle} ${patientFirstName} ${patientLastName}`.trim();
                        patient.phone = patientPhone;
                        patient.age = patientAge;
                      }
                      setEditModePatient(false);
                    }}
                    className="px-4 py-2 bg-success hover:bg-success/90 text-white font-bold rounded-lg text-[10px] shadow-sm flex items-center space-x-1"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Done</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-borders dark:border-slate-850 max-w-lg space-y-2.5 relative">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400">Name</span>
                      <strong className="font-bold text-slate-800 dark:text-white text-sm">{patientTitle} {patientFirstName} {patientLastName} ({patientAge} YRS/{patient?.gender?.charAt(0) || "M"})</strong>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400">Mobile No</span>
                      <strong className="font-bold text-slate-800 dark:text-white">{patientPhone}</strong>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400">Online report requested</span>
                      <span className="text-success font-extrabold flex items-center space-x-1">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Online delivery</span>
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 space-y-0.5">
                      <div>Registered on: {new Date(registeredOn).toLocaleString()}</div>
                      <div>Estimated DOB: 06/02/1993</div>
                      <div>Age precision: Years</div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setEditModePatient(true)}
                    className="px-2.5 py-1.5 border border-borders dark:border-darkBorders bg-white dark:bg-darkCard hover:bg-slate-50 dark:hover:bg-slate-800 text-[10px] font-bold rounded-lg transition-colors flex items-center space-x-1"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>Edit Profile</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* SECTION 2: Case details */}
      <div className="bg-white dark:bg-darkCard p-6 rounded-xl border border-borders dark:border-darkBorders shadow-sm space-y-4">
        
        <div className="flex items-center space-x-2.5 font-bold text-slate-850 dark:text-white text-sm border-b border-borders dark:border-slate-850 pb-2">
          <span className="h-5 w-5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-[10px]">2</span>
          <span>Case details</span>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          
          {/* Referred By */}
          <div className="md:col-span-2">
            <label className="block text-[10px] text-slate-500 mb-1">Referred By *</label>
            <div className="flex space-x-2">
              <select
                value={referredByDocId}
                onChange={(e) => setReferredByDocId(e.target.value)}
                className="px-3 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-xs focus:outline-none flex-grow"
              >
                <option value="self">Self (No Referral)</option>
                {referrals.map(doc => (
                  <option key={doc.id} value={doc.id}>{doc.name} ({doc.commission_percentage}%)</option>
                ))}
              </select>
              <button className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-borders rounded-lg dark:bg-slate-800 dark:text-slate-200 dark:border-darkBorders text-xs">
                + Add New
              </button>
            </div>
          </div>

          {/* Collection Centre */}
          <div>
            <label className="block text-[10px] text-slate-500 mb-1">Collection centre *</label>
            <select
              value={collectionCentre}
              onChange={(e) => setCollectionCentre(e.target.value)}
              className="px-3 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-xs focus:outline-none"
            >
              <option value="Main">Main Centre</option>
              <option value="Satellite A">Satellite Lab A</option>
            </select>
          </div>

          {/* Sample collection agent */}
          <div>
            <label className="block text-[10px] text-slate-500 mb-1">Sample collection agent</label>
            <select
              value={collectionAgent}
              onChange={(e) => setCollectionAgent(e.target.value)}
              className="px-3 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-xs focus:outline-none"
            >
              <option value="">Select agent</option>
              {staffList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>

        </div>
      </div>

      {/* SECTION 3: Modality buttons list */}
      <div className="bg-white dark:bg-darkCard p-6 rounded-xl border border-borders dark:border-darkBorders shadow-sm space-y-4">
        <div className="font-bold text-slate-800 dark:text-white text-xs border-b border-borders dark:border-slate-850 pb-2">
          Select Modalities to add/toggle Investigation Blocks
        </div>
        
        {/* Modality Selector tabs */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {Object.entries(MODALITY_DETAILS).map(([key, details]) => {
            const isActive = !!activeGroups[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleModalityGroup(key)}
                className={`p-3 rounded-xl border text-[10px] font-extrabold uppercase transition-all tracking-wider flex flex-col items-center justify-center space-y-1.5 text-center ${
                  isActive 
                    ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/10 scale-[1.02]" 
                    : "border-borders dark:border-darkBorders bg-white dark:bg-darkCard hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350"
                }`}
              >
                {details.icon}
                <span>{details.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 4: Active Modality investigation blocks (Rendered dynamically) */}
      {Object.values(activeGroups).map((group) => {
        const modalityTests = TESTS_DATABASE[group.modality] || [];
        const filteredTests = modalityTests.filter(
          t => t.name.toLowerCase().includes(group.searchText.toLowerCase())
        );

        const groupSubtotal = group.tests.reduce((sum, t) => sum + t.price, 0);
        const groupDue = Math.max(groupSubtotal - group.discount - group.paid, 0);

        return (
          <div 
            key={group.modality}
            className="bg-white dark:bg-darkCard p-6 rounded-xl border border-borders dark:border-darkBorders shadow-sm space-y-4 relative animate-fade-in"
          >
            {/* Block header */}
            <div className="flex justify-between items-center border-b border-borders dark:border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                {MODALITY_DETAILS[group.modality]?.icon}
                <h3 className="font-extrabold text-slate-850 dark:text-white text-xs uppercase tracking-wide">{group.modality} Investigations</h3>
              </div>
              <button 
                onClick={() => toggleModalityGroup(group.modality)}
                className="text-slate-400 hover:text-danger font-bold text-sm"
              >
                &times;
              </button>
            </div>

            {/* Fields split */}
            <div className="grid md:grid-cols-6 gap-4 items-start">
              
              {/* Left Col: Scrollable dropdown input search */}
              <div className="md:col-span-4 space-y-2 relative">
                <label className="block text-[10px] text-slate-500">Add Test</label>
                <div className="relative">
                  <input
                    type="text"
                    value={group.searchText}
                    onChange={(e) => handleTestSearchTextChange(group.modality, e.target.value)}
                    onFocus={() => {
                      setActiveGroups(prev => ({
                        ...prev,
                        [group.modality]: { ...prev[group.modality], showDropdown: true }
                      }));
                    }}
                    className="px-3 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-xs focus:outline-none"
                    placeholder="Click to type and select tests..."
                  />
                </div>

                {/* Scrollable dropdown tests list */}
                {group.showDropdown && (
                  <div className="absolute w-full mt-1 bg-white dark:bg-darkCard border border-borders dark:border-darkBorders rounded-lg shadow-xl z-55 max-h-48 overflow-y-auto divide-y divide-borders">
                    {filteredTests.map((test, idx) => (
                      <div 
                        key={idx}
                        onClick={() => addTestToGroup(group.modality, test)}
                        className="p-3 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-650 cursor-pointer flex justify-between items-center transition-colors"
                      >
                        <span className="font-semibold">{test.name}</span>
                        <strong className="font-extrabold">Rs. {test.price}</strong>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tags container of selected tests */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {group.tests.map((t, tidx) => (
                    <div 
                      key={tidx}
                      className="px-2.5 py-1 bg-slate-50 border border-borders dark:bg-slate-900/40 dark:border-darkBorders rounded-lg flex items-center space-x-1.5 font-semibold text-[10px]"
                    >
                      <span className="text-slate-800 dark:text-slate-200">{t.name} (Rs.{t.price})</span>
                      <button 
                        onClick={() => removeTestFromGroup(group.modality, t.name)}
                        className="text-slate-400 hover:text-danger font-bold text-sm"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 font-bold">
                  <div className="flex space-x-2 text-primary font-semibold">
                    <button className="hover:underline">+ Add New</button>
                    <span>|</span>
                    <button className="hover:underline">Ratelist</button>
                  </div>
                  <div>Total: Rs. {groupSubtotal} &bull; Due: <span className={groupDue > 0 ? "text-danger" : "text-success"}>Rs. {groupDue}</span></div>
                </div>

              </div>

              {/* Right Col: Paid & Discount inputs */}
              <div className="md:col-span-2 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">* Paid</label>
                  <input
                    type="number"
                    value={group.paid || ""}
                    onChange={(e) => updateGroupPaid(group.modality, Number(e.target.value))}
                    className="px-3 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-xs focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">* Discount</label>
                  <input
                    type="number"
                    value={group.discount || ""}
                    onChange={(e) => updateGroupDiscount(group.modality, Number(e.target.value))}
                    className="px-3 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-xs focus:outline-none font-bold"
                  />
                </div>
              </div>

            </div>

          </div>
        );
      })}

      {/* SECTION 5: Grand Billing calculators & settings */}
      <div className="bg-white dark:bg-darkCard p-6 rounded-xl border border-borders dark:border-darkBorders shadow-sm space-y-6">
        
        <div className="border-t border-borders dark:border-slate-800 pt-4 space-y-4">
          <h3 className="font-bold text-slate-850 dark:text-white text-xs">Payment Details</h3>

          <div className="grid md:grid-cols-2 gap-6 items-start">
            
            {/* Left Col: Details inputs */}
            <div className="space-y-4">
              
              <div className="flex justify-between items-center py-2 border-b border-dashed border-borders dark:border-slate-850">
                <span className="text-slate-500 font-bold">Total:</span>
                <span className="font-extrabold text-sm text-slate-800 dark:text-white">Rs. {calculateGrandTotal().toLocaleString()}</span>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Global Discount</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={generalDiscount || ""}
                    onChange={(e) => setGeneralDiscount(Number(e.target.value))}
                    className="px-3 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-xs focus:outline-none flex-grow"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsDiscountPercent(!isDiscountPercent);
                      setGeneralDiscount(0);
                    }}
                    className="px-3 h-10 bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-200 border border-borders dark:border-darkBorders rounded-lg font-bold text-xs"
                  >
                    {isDiscountPercent ? "%" : "Cash"}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-dashed border-borders dark:border-slate-850">
                <span className="text-slate-500 font-bold">Advance (Rs.):</span>
                <span className="font-extrabold text-slate-850 dark:text-white">Rs. {calculateGrandNetTotal().toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-dashed border-borders dark:border-slate-850 text-success font-bold">
                <span>Total Received:</span>
                <span>Rs. {calculateGrandPaid().toLocaleString()}</span>
              </div>

            </div>

            {/* Right Col: Details selections */}
            <div className="space-y-4">
              
              <div className="flex justify-between items-center py-2 border-b border-dashed border-borders dark:border-slate-850">
                <span className="text-slate-500 font-bold">Balance:</span>
                <span className={`font-extrabold text-sm ${calculateGrandBalance() > 0 ? "text-danger animate-pulse" : "text-success"}`}>
                  Rs. {calculateGrandBalance().toLocaleString()}
                </span>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="px-3 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-xs focus:outline-none"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Remarks</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="px-3 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-xs focus:outline-none"
                />
              </div>

              <label className="flex items-center space-x-2 cursor-pointer font-bold py-1 text-slate-700 dark:text-slate-350">
                <input
                  type="checkbox"
                  checked={isCanceled}
                  onChange={(e) => setIsCanceled(e.target.checked)}
                  className="rounded border-borders text-danger focus:ring-danger"
                />
                <span className="text-danger flex items-center space-x-1">
                  <Ban className="h-3.5 w-3.5" />
                  <span>Cancel this entire invoice bill order</span>
                </span>
              </label>

            </div>

          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center border-t border-borders dark:border-slate-800 pt-4">
          <button
            onClick={handleUpdateBill}
            disabled={updating}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg shadow-md hover:shadow-lg transition-all flex items-center space-x-1.5"
          >
            {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <span>Update</span>}
          </button>
          
          <button className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-borders dark:bg-slate-800 dark:border-darkBorders dark:text-slate-250 dark:hover:bg-slate-750 rounded-lg font-bold transition-all">
            <Settings className="h-4 w-4" />
          </button>
        </div>

      </div>

    </div>
  );
}
