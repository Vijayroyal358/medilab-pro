"use client";

import React, { useState, useEffect } from "react";
import { getPatients, createPatient, getReferrals, createReferral, registerTest } from "../../../services/data";
import { Patient, ReferralDoctor } from "../../../types/index";
import { 
  Plus, FileText, CheckCircle2, RefreshCw, AlertCircle, 
  DollarSign, Receipt, ArrowLeft, Loader2, Search, Edit2, 
  FolderLock, Stethoscope, Briefcase, Eye, Calendar, Sparkles, 
  Cog, FlaskConical, Activity, HardDrive, Heart, Building, 
  Zap, Brain, HeartPulse, Smile, Shield, Check, Ban, X, PlusCircle, Trash2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function calculateAgeFromDob(dobStr: string) {
  if (!dobStr) return { years: 0, months: 0, days: 0 };
  const birth = new Date(dobStr);
  const now = new Date();
  if (isNaN(birth.getTime())) return { years: 0, months: 0, days: 0 };
  
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();
  
  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  
  return {
    years: Math.max(years, 0),
    months: Math.max(months, 0),
    days: Math.max(days, 0)
  };
}

function calculateDobFromAge(years: number, months: number, days: number) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - (years || 0));
  d.setMonth(d.getMonth() - (months || 0));
  d.setDate(d.getDate() - (days || 0));
  
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const TITLE_OPTIONS = [
  "Mr.", "Mrs.", "Smt.", "Kumari", "Shri.", "Miss.", "Master", 
  "Mohd.", "Baby", "Baby of", "Wife of", "Mother of", "Ms.", 
  "Miss./Mrs.", "Selvi", "Sk.", "PROF", "Dr.", "Child"
];

import { DEFAULT_TESTS_DATABASE } from "../../../utils/tests_catalog";

// COMPREHENSIVE MEDICAL TEST DATABASE
const TESTS_DATABASE: Record<string, Array<{ name: string; price: number; category: string; revenue_share?: number; gender?: string; active?: boolean }>> = JSON.parse(JSON.stringify(DEFAULT_TESTS_DATABASE));

// Category Icons list
const MODALITY_DETAILS: Record<string, { label: string; icon: React.ReactNode }> = {
  LAB: { label: "LAB", icon: <FlaskConical className="h-4.5 w-4.5 text-blue-500" /> },
  USG: { label: "USG", icon: <Activity className="h-4.5 w-4.5 text-green-500" /> },
  "DIGITAL XRAY": { label: "DIGITAL XRAY", icon: <HardDrive className="h-4.5 w-4.5 text-purple-500" /> },
  XRAY: { label: "XRAY", icon: <FileText className="h-4.5 w-4.5 text-cyan-500" /> },
  "OUTSOURCE LAB": { label: "OUTSOURCE LAB", icon: <Building className="h-4.5 w-4.5 text-slate-500" /> },
  ECG: { label: "ECG", icon: <Heart className="h-4.5 w-4.5 text-red-500" /> },
  "CT SCAN": { label: "CT SCAN", icon: <Shield className="h-4.5 w-4.5 text-orange-500" /> },
  MRI: { label: "MRI", icon: <Brain className="h-4.5 w-4.5 text-indigo-500" /> },
  EPS: { label: "EPS", icon: <Zap className="h-4.5 w-4.5 text-yellow-500" /> },
  OPG: { label: "OPG", icon: <Smile className="h-4.5 w-4.5 text-pink-500" /> },
  CARDIOLOGY: { label: "CARDIOLOGY", icon: <HeartPulse className="h-4.5 w-4.5 text-rose-500" /> },
  EEG: { label: "EEG", icon: <Brain className="h-4.5 w-4.5 text-violet-500" /> },
  MAMMOGRAPHY: { label: "MAMMOGRAPHY", icon: <Sparkles className="h-4.5 w-4.5 text-amber-500" /> }
};

interface ActiveModalityGroup {
  modality: string;
  tests: Array<{ name: string; price: number; category: string }>;
  paid: number;
  discount: number;
  searchText: string;
  showDropdown: boolean;
  sampleCollectedAt?: string;
}

export default function NewBillPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [referrals, setReferrals] = useState<ReferralDoctor[]>([]);
  const [loading, setLoading] = useState(true);

  // Patient Info Form States
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [mobileSearch, setMobileSearch] = useState("");
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  
  const [mobileCountryCode, setMobileCountryCode] = useState("+91");
  const [mainMobileNumber, setMainMobileNumber] = useState("");
  const mobile = mobileCountryCode + mainMobileNumber;

  // Collection Agent Dynamic options
  const [collectionAgents, setCollectionAgents] = useState<string[]>([]);
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [newAgentName, setNewAgentName] = useState("");

  // Collection Centre Dynamic options
  const [collectionCentres, setCollectionCentres] = useState<string[]>(["Main", "Home"]);
  const [showAddCentreModal, setShowAddCentreModal] = useState(false);
  const [newCentreName, setNewCentreName] = useState("");

  // Add Dynamic test/investigation Modal States
  const [showAddTestModal, setShowAddTestModal] = useState(false);
  const [addTestModality, setAddTestModality] = useState("LAB");
  const [newTestName, setNewTestName] = useState("");
  const [newTestFee, setNewTestFee] = useState("");
  const [newTestGender, setNewTestGender] = useState("Both");
  const [title, setTitle] = useState("Mr.");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("MALE");
  const [ageYears, setAgeYears] = useState("");
  const [ageMonths, setAgeMonths] = useState("");
  const [ageDays, setAgeDays] = useState("");
  const [onlineReport, setOnlineReport] = useState(true);
  const [dob, setDob] = useState("");

  const handleDobChange = (dobVal: string) => {
    setDob(dobVal);
    if (dobVal) {
      const { years, months, days } = calculateAgeFromDob(dobVal);
      setAgeYears(String(years));
      setAgeMonths(String(months));
      setAgeDays(String(days));
    }
  };

  const handleAgeYearsChange = (val: string) => {
    setAgeYears(val);
    const yrs = Number(val) || 0;
    const mths = Number(ageMonths) || 0;
    const dys = Number(ageDays) || 0;
    const computedDob = calculateDobFromAge(yrs, mths, dys);
    setDob(computedDob);
  };

  const handleAgeMonthsChange = (val: string) => {
    setAgeMonths(val);
    const yrs = Number(ageYears) || 0;
    const mths = Number(val) || 0;
    const dys = Number(ageDays) || 0;
    const computedDob = calculateDobFromAge(yrs, mths, dys);
    setDob(computedDob);
  };

  const handleAgeDaysChange = (val: string) => {
    setAgeDays(val);
    const yrs = Number(ageYears) || 0;
    const mths = Number(ageMonths) || 0;
    const dys = Number(val) || 0;
    const computedDob = calculateDobFromAge(yrs, mths, dys);
    setDob(computedDob);
  };

  // Extra Patient Details toggles
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [showAddress, setShowAddress] = useState(false);
  const [address, setAddress] = useState("");
  const [showAadhaar, setShowAadhaar] = useState(false);
  const [aadhaar, setAadhaar] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState("");

  // Case Details States
  const [referredByDocId, setReferredByDocId] = useState<string>("self");
  
  // Custom Add Referrer Modal States
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("Dr.");
  const [newDocFirstName, setNewDocFirstName] = useState("");
  const [newDocLastName, setNewDocLastName] = useState("");
  const [newDocDegree, setNewDocDegree] = useState("");
  const [newDocMobile, setNewDocMobile] = useState("+91");
  const [newDocEmail, setNewDocEmail] = useState("");
  const [newDocAddress, setNewDocAddress] = useState("");
  const [newDocActive, setNewDocActive] = useState(true);

  const [collectionCentre, setCollectionCentre] = useState("Main");
  const [collectionAgent, setCollectionAgent] = useState("Reddy");
  const [registeredOn, setRegisteredOn] = useState("");

  // Active Modalities Billing Groups (LAB is active by default)
  const [activeGroups, setActiveGroups] = useState<Record<string, ActiveModalityGroup>>({
    LAB: { modality: "LAB", tests: [], paid: 0, discount: 0, searchText: "", showDropdown: false }
  });

  // Global Grand Bill Panel
  const [generalDiscount, setGeneralDiscount] = useState(0);
  const [isDiscountPercent, setIsDiscountPercent] = useState(false);
  const [collectionCharge, setCollectionCharge] = useState(0);
  const [remarks, setRemarks] = useState("");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [mixedCash, setMixedCash] = useState<number>(0);
  const [mixedUpi, setMixedUpi] = useState<number>(0);

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "danger"; msg: string } | null>(null);

  const loadInitialData = async () => {
    try {
      const [patientList, referralList, staffRes] = await Promise.all([
        getPatients(),
        getReferrals(),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://medilab-pro.onrender.com"}/setup/staff`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("medilab_access_token")}` }
        }).then(r => r.ok ? r.json() : [])
      ]);
      setPatients(patientList);
      setReferrals(referralList);
      if (Array.isArray(staffRes)) setCollectionAgents(staffRes.map((s: any) => s.name));
      setRegisteredOn(new Date().toISOString().slice(0, 16));
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("medilab_ratelist");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        Object.keys(parsed).forEach(k => {
          TESTS_DATABASE[k] = parsed[k];
        });
      } catch (e) {
        console.error("Failed to load saved ratelist", e);
      }
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.closest(".search-container")) {
        return;
      }
      setShowPatientDropdown(false);
      setActiveGroups(prev => {
        const next = { ...prev };
        let changed = false;
        for (const mod in next) {
          if (next[mod].showDropdown) {
            next[mod] = { ...next[mod], showDropdown: false };
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  const showToast = (type: "success" | "danger", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  // Searching by Mobile / Name
  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMainMobileNumber(val);
    setMobileSearch(val);
    setShowPatientDropdown(val.length >= 3);
  };

  const selectExistingPatient = (p: Patient) => {
    setSelectedPatientId(p.id);
    
    if (p.phone.startsWith("+91")) {
      setMobileCountryCode("+91");
      setMainMobileNumber(p.phone.slice(3));
    } else {
      setMobileCountryCode("+91");
      setMainMobileNumber(p.phone);
    }
    
    // Split full name if possible
    const parts = p.name.split(" ");
    if (parts.length > 0) {
      const first = parts[0];
      const matchTitle = ["mr.", "mrs.", "ms.", "dr."].includes(first.toLowerCase());
      if (matchTitle) {
        setTitle(first.charAt(0).toUpperCase() + first.slice(1).toLowerCase());
        setFirstName(parts[1] || "");
        setLastName(parts.slice(2).join(" "));
      } else {
        setTitle("Mr.");
        setFirstName(parts[0]);
        setLastName(parts.slice(1).join(" "));
      }
    }

    setGender(p.gender.toUpperCase());
    setDob(p.dob || "");
    if (p.dob) {
      const { years, months, days } = calculateAgeFromDob(p.dob);
      setAgeYears(String(years));
      setAgeMonths(String(months));
      setAgeDays(String(days));
    } else {
      setAgeYears(String(p.age));
      setAgeMonths(String(p.age_months || 0));
      setAgeDays(String(p.age_days || 0));
    }
    setOnlineReport(p.online_report_requested);
    
    if (p.email) {
      setEmail(p.email);
      setShowEmail(true);
    }
    if (p.address) {
      setAddress(p.address);
      setShowAddress(true);
    }
    if (p.aadhaar_number) {
      setAadhaar(p.aadhaar_number);
      setShowAadhaar(true);
    }
    if (p.medical_history) {
      setHistory(p.medical_history);
      setShowHistory(true);
    }

    setShowPatientDropdown(false);
  };

  const handleAddAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName.trim()) {
      showToast("danger", "Agent name is required.");
      return;
    }
    const name = newAgentName.trim();
    if (!collectionAgents.includes(name)) {
      setCollectionAgents(prev => [...prev, name]);
    }
    setCollectionAgent(name);
    setShowAddAgentModal(false);
    showToast("success", `Agent "${name}" added.`);
  };

  const handleAddCentre = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCentreName.trim()) {
      showToast("danger", "Centre name is required.");
      return;
    }
    const name = newCentreName.trim();
    if (!collectionCentres.includes(name)) {
      setCollectionCentres(prev => [...prev, name]);
    }
    setCollectionCentre(name);
    setShowAddCentreModal(false);
    showToast("success", `Collection centre "${name}" added.`);
  };

  const handleAddNewTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestName.trim()) {
      showToast("danger", "Test name is required.");
      return;
    }
    const fee = Number(newTestFee);
    if (isNaN(fee) || fee <= 0) {
      showToast("danger", "Please enter a valid fee.");
      return;
    }
    
    if (!TESTS_DATABASE[addTestModality]) {
      TESTS_DATABASE[addTestModality] = [];
    }
    
    const newTestObj = {
      name: newTestName.trim(),
      price: fee,
      category: addTestModality
    };
    
    if (!TESTS_DATABASE[addTestModality].some(t => t.name.toLowerCase() === newTestObj.name.toLowerCase())) {
      TESTS_DATABASE[addTestModality].push(newTestObj);
    }
    
    addTestToGroup(addTestModality, newTestObj);
    setShowAddTestModal(false);
    showToast("success", `New ${addTestModality} test added successfully!`);
  };

  // Toggle modality sections on/off
  const toggleModalityGroup = (mod: string) => {
    setActiveGroups(prev => {
      const next = { ...prev };
      if (next[mod]) {
        delete next[mod];
      } else {
        next[mod] = {
          modality: mod,
          tests: [],
          paid: 0,
          discount: 0,
          searchText: "",
          showDropdown: false
        };
      }
      return next;
    });
  };

  // Add referrer through backend sync
  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const fullDocName = `${newDocTitle} ${newDocFirstName} ${newDocLastName}`.trim();
      const newDoc = await createReferral({
        name: fullDocName,
        email: newDocEmail || null,
        phone: newDocMobile || null,
        commission_percentage: 15
      });
      
      setReferrals(prev => [...prev, newDoc]);
      setReferredByDocId(String(newDoc.id));
      showToast("success", `Referral doctor ${fullDocName} added successfully.`);
      
      // Reset doc modal states
      setNewDocFirstName("");
      setNewDocLastName("");
      setNewDocEmail("");
      setNewDocMobile("+91");
      setNewDocAddress("");
      setShowAddDocModal(false);
    } catch (err: any) {
      showToast("danger", "Could not register referral doctor.");
    }
  };

  // Specific Modality changes
  const handleTestSearchTextChange = (mod: string, text: string) => {
    setActiveGroups(prev => ({
      ...prev,
      [mod]: { ...prev[mod], searchText: text, showDropdown: true }
    }));
  };

  const addTestToGroup = (mod: string, test: { name: string; price: number; category: string }) => {
    setActiveGroups(prev => {
      const next = { ...prev };
      const group = next[mod];
      // Avoid duplicate tests within the same modality group
      if (!group.tests.some(t => t.name === test.name)) {
        group.tests = [...group.tests, test];
      }
      const subtotal = group.tests.reduce((sum, t) => sum + t.price, 0);
      group.paid = Math.max(subtotal - group.discount, 0);
      group.searchText = "";
      group.showDropdown = false;
      return next;
    });
  };

  const removeTestFromGroup = (mod: string, testName: string) => {
    setActiveGroups(prev => {
      const next = { ...prev };
      const group = next[mod];
      group.tests = group.tests.filter(t => t.name !== testName);
      const subtotal = group.tests.reduce((sum, t) => sum + t.price, 0);
      group.paid = Math.max(subtotal - group.discount, 0);
      return next;
    });
  };

  const updateGroupPaid = (mod: string, val: number) => {
    setActiveGroups(prev => ({
      ...prev,
      [mod]: { ...prev[mod], paid: Math.max(val, 0) }
    }));
  };

  const updateGroupDiscount = (mod: string, val: number) => {
    setActiveGroups(prev => {
      const next = { ...prev };
      const group = next[mod];
      group.discount = Math.max(val, 0);
      const subtotal = group.tests.reduce((sum, t) => sum + t.price, 0);
      group.paid = Math.max(subtotal - group.discount, 0);
      return next;
    });
  };

  const toggleSampleCollected = (mod: string) => {
    setActiveGroups(prev => {
      const next = { ...prev };
      const group = next[mod];
      if (group.sampleCollectedAt !== undefined) {
        delete group.sampleCollectedAt;
      } else {
        group.sampleCollectedAt = new Date().toISOString().slice(0, 16);
      }
      return next;
    });
  };

  const handleSampleDateChange = (mod: string, val: string) => {
    setActiveGroups(prev => ({
      ...prev,
      [mod]: { ...prev[mod], sampleCollectedAt: val }
    }));
  };

  // Grand totals Calculations
  const calculateGrandTotal = () => {
    return Object.values(activeGroups).reduce((sum, g) => {
      return sum + g.tests.reduce((s, t) => s + t.price, 0);
    }, 0);
  };

  const calculateTotalDiscounts = () => {
    const sumModalityDiscounts = Object.values(activeGroups).reduce((sum, g) => sum + g.discount, 0);
    if (isDiscountPercent) {
      return sumModalityDiscounts + (calculateGrandTotal() * (generalDiscount / 100));
    }
    return sumModalityDiscounts + generalDiscount;
  };

  const calculateGrandNetTotal = () => {
    const base = calculateGrandTotal() - calculateTotalDiscounts();
    return Math.max(base + collectionCharge, 0);
  };

  const calculateGrandPaid = () => {
    if (paymentMode === "mixed") {
      return Number(mixedCash) + Number(mixedUpi);
    }
    return Object.values(activeGroups).reduce((sum, g) => sum + g.paid, 0);
  };

  const calculateGrandBalance = () => {
    return Math.max(calculateGrandNetTotal() - calculateGrandPaid(), 0);
  };

  // Submit dynamic bill + patient registration
  const handleCreateBill = async () => {
    if (!firstName.trim()) {
      showToast("danger", "First Name is required to register patient.");
      return;
    }

    const totalTestsCount = Object.values(activeGroups).reduce((sum, g) => sum + g.tests.length, 0);
    if (totalTestsCount === 0) {
      showToast("danger", "Please add at least one medical investigation test.");
      return;
    }

    setSubmitting(true);
    try {
      let patientId = selectedPatientId;
      
      // 1. Register patient if new
      if (!patientId) {
        // Double check: does a patient with this phone, email, or name already exist?
        const searchMobile = (mobileCountryCode + mainMobileNumber).trim();
        const searchEmail = email.trim().toLowerCase();
        const searchName = `${title} ${firstName} ${lastName}`.trim().toLowerCase();
        const searchNameNoTitle = `${firstName} ${lastName}`.trim().toLowerCase();
        
        const existingPatient = patients.find(p => 
          p.phone === searchMobile || 
          (searchEmail && p.email?.toLowerCase() === searchEmail) ||
          p.name.toLowerCase() === searchName ||
          p.name.toLowerCase() === searchNameNoTitle
        );
        
        if (existingPatient) {
          patientId = existingPatient.id;
        } else {
          const newPat = await createPatient({
            title,
            first_name: firstName,
            last_name: lastName,
            name: `${title} ${firstName} ${lastName}`.trim(),
            age: Number(ageYears) || 0,
            age_years: Number(ageYears) || 0,
            age_months: Number(ageMonths) || 0,
            age_days: Number(ageDays) || 0,
            gender: gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase(),
            dob: dob || new Date(new Date().getFullYear() - (Number(ageYears) || 0), 0, 1).toISOString().slice(0, 10),
            phone: mobile || "000-0000",
            email: email || `${firstName.toLowerCase()}@medilab.pro`,
            address: address || "",
            aadhaar_number: aadhaar || "",
            medical_history: history || "",
            online_report_requested: onlineReport
          });
          patientId = newPat.id;
        }
      }

      // 2. Submit test records proportionally
      const netTotal = calculateGrandNetTotal();
      const balance = calculateGrandBalance();
      const grandTotal = calculateGrandTotal();
      let sharedInvoiceNumber = "";

      for (const group of Object.values(activeGroups)) {
        for (const t of group.tests) {
          const proportion = t.price / (grandTotal || 1);
          const res = await registerTest({
            patient_id: patientId,
            invoice_number: sharedInvoiceNumber || undefined,
            category: t.category,
            test_name: t.name,
            price: t.price,
            discount: (calculateTotalDiscounts() * proportion),
            discount_type: "fixed",
            tax: 0.0,
            sample_type: "Blood",
            payment_status: balance <= 0 ? "Paid" : "Pending",
            payment_method: paymentMode === "mixed"
              ? `Cash: ${Number(mixedCash)} | UPI: ${Number(mixedUpi)}`
              : paymentMode.charAt(0).toUpperCase() + paymentMode.slice(1),
            amount_received: (calculateGrandPaid() * proportion),
            balance_due: (balance * proportion),
            remarks: remarks,
            collection_centre: collectionCentre,
            collection_agent: collectionAgent,
            modality: group.modality,
            referral_doctor_id: referredByDocId !== "self" ? Number(referredByDocId) : undefined,
            status: balance <= 0 ? "No due" : "Has due"
          });

          if (res && res.invoice_number && !sharedInvoiceNumber) {
            sharedInvoiceNumber = res.invoice_number;
          }
        }
      }

      showToast("success", "Bill generated successfully!");
      
      // Reset Form fields
      setSelectedPatientId(null);
      setMobileCountryCode("+91");
      setMainMobileNumber("");
      setFirstName("");
      setLastName("");
      setAgeYears("");
      setAgeMonths("");
      setAgeDays("");
      setDob("");
      setActiveGroups({
        LAB: { modality: "LAB", tests: [], paid: 0, discount: 0, searchText: "", showDropdown: false }
      });
      setGeneralDiscount(0);
      setCollectionCharge(0);
      setRemarks("");
      setMixedCash(0);
      setMixedUpi(0);
      setPaymentMode("cash");
      loadInitialData();
    } catch (err: any) {
      showToast("danger", err.message || "Failed to submit bill.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPatients = patients.filter(
    p => p.phone.includes(mobileSearch) || p.name.toLowerCase().includes(mobileSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#00A770]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 text-xs font-semibold text-slate-650 dark:text-slate-350">
      
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white font-medium text-xs ${
          toast.type === "success" ? "bg-success" : "bg-danger"
        }`}>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-150 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-white">New bill</h1>
          <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-bold uppercase mt-1">
            <span>Last Reg. no. CDL-1005</span>
            <span>&bull;</span>
            <span className="text-[#00A770]">Courtesy limit: 200 patients/day</span>
          </div>
        </div>
      </div>

      {/* Grid Form layout */}
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Columns (Patient details & modality groups) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* SECTION 1: Patient details */}
          <div className={`bg-white dark:bg-darkCard p-6 rounded-2xl border border-slate-150 shadow-sm space-y-4 relative ${
            showPatientDropdown ? "z-30" : "z-10"
          }`}>
            <div className="flex items-center space-x-2 font-bold text-slate-700 dark:text-slate-350 border-b border-slate-100 pb-2">
              <span className="h-5 w-5 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-[10px]">1</span>
              <span>Patient details</span>
            </div>

            <div className="relative search-container">
              <label className="block text-[10px] text-slate-455 uppercase font-black mb-1">Mobile number</label>
              <div className="relative flex items-center rounded-xl border border-slate-200 dark:border-darkBorders bg-transparent overflow-hidden focus-within:border-[#00A770] h-10" onClick={(e) => e.stopPropagation()}>
                <select
                  value={mobileCountryCode}
                  onChange={(e) => setMobileCountryCode(e.target.value)}
                  className="px-3 bg-slate-50 dark:bg-slate-800 h-full text-xs font-semibold text-slate-500 dark:text-slate-400 border-none outline-none focus:ring-0 cursor-pointer shrink-0"
                >
                  <option value="+91">+91</option>
                  <option value="+1">+1</option>
                  <option value="+44">+44</option>
                </select>
                <div className="h-5 w-[1px] bg-slate-250 shrink-0" />
                <div className="relative flex-grow h-full">
                  <input
                    type="text"
                    value={mainMobileNumber}
                    onClick={(e) => e.stopPropagation()}
                    onChange={handleMobileChange}
                    className="px-3 w-full h-full bg-transparent text-sm focus:outline-none"
                    placeholder="Enter mobile..."
                  />
                  <div className="absolute right-3 top-3 cursor-pointer text-slate-400">
                    <Search className="h-4 w-4" />
                  </div>
                </div>
              </div>
              {showPatientDropdown && mobileSearch.length >= 3 && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute w-full mt-1 bg-white dark:bg-darkCard border border-slate-200 dark:border-darkBorders rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800"
                >
                  {filteredPatients.length === 0 ? (
                    <div className="p-3 text-slate-400 text-center">No matches found. Enter details below.</div>
                  ) : (
                    filteredPatients.map(p => (
                      <div 
                        key={p.id} 
                        onClick={() => selectExistingPatient(p)}
                        className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex justify-between items-center"
                      >
                        <div>
                          <div className="font-bold text-slate-800 dark:text-white">{p.name}</div>
                          <div className="text-[10px] text-slate-400">{p.phone} &bull; {p.gender} &bull; {p.age} Yrs</div>
                        </div>
                        <span className="text-[9px] bg-emerald-50 text-[#00A770] font-black px-1.5 py-0.5 rounded">Match</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-6 gap-4">
              <div className="col-span-2">
                <label className="block text-[10px] text-slate-450 uppercase font-black mb-1">Title *</label>
                <select
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="px-3 w-full h-10 rounded-xl border border-slate-200 bg-transparent text-xs focus:outline-none focus:border-[#00A770] max-h-40 overflow-y-auto"
                >
                  {TITLE_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] text-slate-455 uppercase font-black mb-1">First name *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="px-3 w-full h-10 rounded-xl border border-slate-200 bg-transparent text-sm focus:outline-none focus:border-[#00A770]"
                  placeholder="First name"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] text-slate-455 uppercase font-black mb-1">Last name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="px-3 w-full h-10 rounded-xl border border-slate-200 bg-transparent text-sm focus:outline-none focus:border-[#00A770]"
                  placeholder="Last name"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] text-slate-450 uppercase font-black mb-1.5">Sex *</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {["MALE", "FEMALE", "OTHER"].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`py-2 rounded-xl border text-[9px] font-black transition-all text-center ${
                        gender === g 
                          ? "bg-slate-800 border-slate-800 text-white dark:bg-slate-700 dark:border-slate-700 shadow-sm" 
                          : "border-slate-200 hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      {g === "MALE" ? "M ♂" : g === "FEMALE" ? "F ♀" : "O ⚦"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-450 uppercase font-black mb-1.5">Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => handleDobChange(e.target.value)}
                  className="px-2 w-full h-10 rounded-xl border border-slate-200 bg-transparent text-xs focus:outline-none focus:border-[#00A770]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-450 uppercase font-black mb-1.5">Age (Y / M / D) *</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <input
                    type="number"
                    value={ageYears}
                    onChange={(e) => handleAgeYearsChange(e.target.value)}
                    className="px-1 w-full h-10 rounded-xl border border-slate-200 bg-transparent text-xs focus:outline-none text-center focus:border-[#00A770]"
                    placeholder="Y"
                  />
                  <input
                    type="number"
                    value={ageMonths}
                    onChange={(e) => handleAgeMonthsChange(e.target.value)}
                    className="px-1 w-full h-10 rounded-xl border border-slate-200 bg-transparent text-xs focus:outline-none text-center focus:border-[#00A770]"
                    placeholder="M"
                  />
                  <input
                    type="number"
                    value={ageDays}
                    onChange={(e) => handleAgeDaysChange(e.target.value)}
                    className="px-1 w-full h-10 rounded-xl border border-slate-200 bg-transparent text-xs focus:outline-none text-center focus:border-[#00A770]"
                    placeholder="D"
                  />
                </div>
              </div>
            </div>

            <label className="flex items-center space-x-2 cursor-pointer font-bold py-1 text-slate-700">
              <input
                type="checkbox"
                checked={onlineReport}
                onChange={(e) => setOnlineReport(e.target.checked)}
                className="rounded border-slate-350 text-[#00A770] focus:ring-emerald-500 h-4 w-4"
              />
              <span>Online report requested</span>
            </label>

            {/* Optional Field Buttons */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-dashed border-slate-200">
              <button type="button" onClick={() => setShowEmail(!showEmail)} className={`px-3.5 py-1.5 rounded-full border text-[10px] font-black uppercase transition-all ${showEmail ? "bg-emerald-50 border-[#00A770] text-[#00A770]" : "border-slate-200 text-slate-500"}`}>+ Email</button>
              <button type="button" onClick={() => setShowAddress(!showAddress)} className={`px-3.5 py-1.5 rounded-full border text-[10px] font-black uppercase transition-all ${showAddress ? "bg-emerald-50 border-[#00A770] text-[#00A770]" : "border-slate-200 text-slate-500"}`}>+ Address</button>
              <button type="button" onClick={() => setShowAadhaar(!showAadhaar)} className={`px-3.5 py-1.5 rounded-full border text-[10px] font-black uppercase transition-all ${showAadhaar ? "bg-emerald-50 border-[#00A770] text-[#00A770]" : "border-slate-200 text-slate-500"}`}>+ Aadhaar</button>
              <button type="button" onClick={() => setShowHistory(!showHistory)} className={`px-3.5 py-1.5 rounded-full border text-[10px] font-black uppercase transition-all ${showHistory ? "bg-emerald-50 border-[#00A770] text-[#00A770]" : "border-slate-200 text-slate-500"}`}>+ Patient history</button>
            </div>

            {/* Toggled Field inputs */}
            <div className="space-y-3 pt-1">
              {showEmail && (
                <div>
                  <label className="block text-[9px] text-slate-400 uppercase">Contact Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="px-3 w-full h-10 rounded-xl border border-slate-200 bg-transparent text-xs focus:outline-none focus:border-[#00A770]"
                    placeholder="Email address"
                  />
                </div>
              )}
              {showAddress && (
                <div>
                  <label className="block text-[9px] text-slate-400 uppercase">Home Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="px-3 w-full h-10 rounded-xl border border-slate-200 bg-transparent text-xs focus:outline-none focus:border-[#00A770]"
                    placeholder="Home address"
                  />
                </div>
              )}
              {showAadhaar && (
                <div>
                  <label className="block text-[9px] text-slate-400 uppercase">Aadhaar Identification ID</label>
                  <input
                    type="text"
                    value={aadhaar}
                    onChange={(e) => setAadhaar(e.target.value)}
                    className="px-3 w-full h-10 rounded-xl border border-slate-200 bg-transparent text-xs focus:outline-none focus:border-[#00A770]"
                    placeholder="Aadhaar ID"
                  />
                </div>
              )}
              {showHistory && (
                <div>
                  <label className="block text-[9px] text-slate-400 uppercase">Clinical Patient History</label>
                  <textarea
                    value={history}
                    onChange={(e) => setHistory(e.target.value)}
                    rows={2}
                    className="p-3 w-full rounded-xl border border-slate-200 bg-transparent text-xs focus:outline-none focus:border-[#00A770]"
                    placeholder="Add patient history, allergies or medical notes..."
                  />
                </div>
              )}
            </div>

          </div>

          {/* SECTION 2: Case details */}
          <div className="bg-white dark:bg-darkCard p-6 rounded-2xl border border-slate-150 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 font-bold text-slate-700 dark:text-slate-350 border-b border-slate-100 pb-2">
              <span className="h-5 w-5 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-[10px]">2</span>
              <span>Case details</span>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              
              {/* Referred By */}
              <div className="md:col-span-2 space-y-1">
                <label className="block text-[10px] text-slate-450 uppercase font-black mb-1">* Referred By</label>
                <div className="flex space-x-2">
                  <select
                    value={referredByDocId}
                    onChange={(e) => setReferredByDocId(e.target.value)}
                    className="px-3 w-full h-10 rounded-xl border border-slate-200 bg-transparent text-xs focus:outline-none flex-grow focus:border-[#00A770]"
                  >
                    <option value="self">Self (No Referral)</option>
                    {referrals.map(doc => (
                      <option key={doc.id} value={doc.id}>{doc.name} ({doc.commission_percentage}%)</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowAddDocModal(true)}
                    className="px-4.5 bg-white text-slate-700 border border-slate-250 hover:bg-slate-50 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center space-x-1"
                  >
                    <span>+ Add New</span>
                  </button>
                </div>
                <div className="pt-1.5">
                  <button 
                    onClick={() => router.push("/dashboard/referrals")}
                    className="text-[#00A770] hover:underline text-[9.5px] font-bold uppercase tracking-wide block"
                  >
                    ☷ Manage referrers
                  </button>
                </div>
              </div>

              {/* Collection centre */}
              <div>
                <label className="block text-[10px] text-slate-450 uppercase font-black mb-1">* Collection centre</label>
                <select
                  value={collectionCentre}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "add-new-centre") {
                      setNewCentreName("");
                      setShowAddCentreModal(true);
                    } else {
                      setCollectionCentre(val);
                    }
                  }}
                  className="px-3 w-full h-10 rounded-xl border border-slate-200 bg-transparent text-xs focus:outline-none focus:border-[#00A770]"
                >
                  {collectionCentres.map(centre => (
                    <option key={centre} value={centre}>{centre} Centre</option>
                  ))}
                  <option value="add-new-centre" className="text-[#00A770] font-bold">+ Others (Add new...)</option>
                </select>
              </div>

              {/* Collection Agent */}
              <div>
                <label className="block text-[10px] text-slate-455 uppercase font-black mb-1">Sample collection agent</label>
                <select
                  value={collectionAgent}
                  onChange={(e) => setCollectionAgent(e.target.value)}
                  className="px-3 w-full h-10 rounded-xl border border-slate-200 bg-transparent text-xs focus:outline-none focus:border-[#00A770]"
                >
                  {collectionAgents.length === 0
                    ? <option value="">No staff available</option>
                    : collectionAgents.map(agent => (
                    <option key={agent} value={agent}>{agent}</option>
                  ))}
                </select>
                <div className="flex space-x-2 mt-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-wide">
                  <button 
                    type="button" 
                    onClick={() => {
                      setNewAgentName("");
                      setShowAddAgentModal(true);
                    }}
                    className="text-[#00A770] hover:underline"
                  >
                    + Add new
                  </button>
                  <span>&bull;</span>
                  <button type="button" className="hover:underline">Edit</button>
                </div>
              </div>

            </div>
          </div>

          {/* SECTION 3: Modality buttons grid */}
          <div className="bg-white dark:bg-darkCard p-6 rounded-2xl border border-slate-150 shadow-sm space-y-4">
            <div className="font-extrabold text-slate-800 dark:text-white text-xs border-b border-slate-100 pb-2">
              Select Modalities to add Investigation Blocks
            </div>
            
            {/* Modal Selector Tabs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {Object.entries(MODALITY_DETAILS).map(([key, details]) => {
                const isActive = !!activeGroups[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleModalityGroup(key)}
                    className={`p-3 rounded-xl border text-[10px] font-black uppercase transition-all tracking-wider flex flex-col items-center justify-center space-y-1.5 text-center ${
                      isActive 
                        ? "bg-[#062A22] border-[#062A22] text-[#00A770] shadow-md scale-[1.02]" 
                        : "border-slate-150 bg-white dark:bg-darkCard hover:bg-slate-50 text-slate-655"
                    }`}
                  >
                    <div className={isActive ? "text-[#00A770]" : "opacity-80"}>
                      {details.icon}
                    </div>
                    <span>{details.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 4: Active Modality investigation blocks (Rendered dynamically) */}
          {Object.values(activeGroups).map((group) => {
            const modalityTests = (TESTS_DATABASE[group.modality] || []).filter(t => t.active !== false);
            
            // Search filter for dropdown
            const filteredTests = modalityTests.filter(
              t => t.name.toLowerCase().includes(group.searchText.toLowerCase())
            );

            const groupSubtotal = group.tests.reduce((sum, t) => sum + t.price, 0);
            const groupDue = Math.max(groupSubtotal - group.discount - group.paid, 0);

            return (
              <div 
                key={group.modality}
                className={`bg-white dark:bg-darkCard p-6 rounded-2xl border border-slate-150 shadow-sm space-y-4 relative ${
                  group.showDropdown ? "z-30" : "z-10"
                }`}
              >
                
                {/* Block header */}
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <div className="flex items-center space-x-2">
                    {MODALITY_DETAILS[group.modality]?.icon}
                    <h3 className="font-extrabold text-slate-800 dark:text-white text-xs uppercase tracking-wide">{group.modality} Investigations</h3>
                  </div>
                  <button 
                    onClick={() => toggleModalityGroup(group.modality)}
                    className="text-slate-400 hover:text-red-500 font-black text-sm"
                    title="Remove Modality Group"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Main fields split */}
                <div className="grid md:grid-cols-6 gap-4 items-start">
                  
                  {/* Left Col: Scrollable dropdown input search */}
                  <div className="md:col-span-4 space-y-2 relative search-container">
                    <label className="block text-[10px] text-slate-450 uppercase font-black">Investigations Search</label>
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={group.searchText}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleTestSearchTextChange(group.modality, e.target.value)}
                        onFocus={(e) => {
                          e.stopPropagation();
                          setActiveGroups(prev => ({
                            ...prev,
                            [group.modality]: { ...prev[group.modality], showDropdown: true }
                          }));
                        }}
                        className="px-3 w-full h-10 rounded-xl border border-slate-200 bg-transparent text-xs focus:outline-none focus:border-[#00A770]"
                        placeholder={`Search ${group.modality} tests...`}
                      />
                      {group.searchText && (
                        <button 
                          type="button"
                          onClick={() => handleTestSearchTextChange(group.modality, "")}
                          className="absolute right-3 top-3 text-slate-400"
                        >
                          &times;
                        </button>
                      )}
                    </div>

                    {/* Scrollable dropdown tests list */}
                    {group.showDropdown && filteredTests.length > 0 && (
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className="absolute left-0 right-0 w-full mt-1 bg-white dark:bg-darkCard border border-slate-200 dark:border-darkBorders rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800"
                      >
                        {filteredTests.map((test, idx) => (
                          <div 
                            key={idx}
                            onClick={() => addTestToGroup(group.modality, test)}
                            className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex justify-between items-center transition-colors text-xs"
                          >
                            <span className="font-bold text-slate-700 dark:text-slate-200">{test.name}</span>
                            <span className="font-extrabold text-[#00A770]">Rs. {test.price}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tags container of selected tests */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {group.tests.map((t, tidx) => (
                        <div 
                          key={tidx}
                          className="px-2.5 py-1 bg-slate-50 border border-slate-150 rounded-lg flex items-center space-x-1.5 font-bold text-[10px]"
                        >
                          <span className="text-slate-800">{t.name} (Rs.{t.price})</span>
                          <button 
                            onClick={() => removeTestFromGroup(group.modality, t.name)}
                            className="text-slate-400 hover:text-red-500 font-bold"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 font-black uppercase tracking-wider">
                      <div className="flex space-x-2 text-[#00A770] font-black">
                        <button 
                          type="button"
                          onClick={() => {
                            setAddTestModality(group.modality);
                            setNewTestName("");
                            setNewTestFee("");
                            setNewTestGender("Both");
                            setShowAddTestModal(true);
                          }}
                          className="hover:underline"
                        >
                          + Add New
                        </button>
                        <span>&bull;</span>
                        <button 
                          type="button"
                          onClick={() => router.push(`/dashboard/setup/ratelist/${encodeURIComponent(group.modality)}`)}
                          className="hover:underline"
                        >
                          Ratelist
                        </button>
                        <span>&bull;</span>
                        <button 
                          onClick={() => toggleSampleCollected(group.modality)} 
                          className="hover:underline text-slate-500"
                        >
                          {group.sampleCollectedAt !== undefined ? "Remove Sample Date" : "+ Sample collected date"}
                        </button>
                      </div>
                      <div>Total: Rs. {groupSubtotal} &bull; Due: <span className={groupDue > 0 ? "text-red-500" : "text-[#00A770]"}>Rs. {groupDue}</span></div>
                    </div>

                    {/* Optional sample datepicker input */}
                    {group.sampleCollectedAt !== undefined && (
                      <div className="pt-2">
                        <label className="block text-[9px] text-slate-450 uppercase mb-1">Sample Collected At</label>
                        <input
                          type="datetime-local"
                          value={group.sampleCollectedAt}
                          onChange={(e) => handleSampleDateChange(group.modality, e.target.value)}
                          className="px-3 h-8.5 rounded-lg border border-slate-200 bg-transparent text-xs focus:outline-none"
                        />
                      </div>
                    )}

                  </div>

                  {/* Right Col: Paid & Discount inputs */}
                  <div className="md:col-span-2 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-slate-450 uppercase font-black mb-1">* Paid</label>
                      <input
                        type="number"
                        value={group.paid || ""}
                        onChange={(e) => updateGroupPaid(group.modality, Number(e.target.value))}
                        className="px-3 w-full h-10 rounded-xl border border-slate-200 bg-transparent text-xs focus:outline-none font-bold focus:border-[#00A770]"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-450 uppercase font-black mb-1">* Discount</label>
                      <input
                        type="number"
                        value={group.discount || ""}
                        onChange={(e) => updateGroupDiscount(group.modality, Number(e.target.value))}
                        className="px-3 w-full h-10 rounded-xl border border-slate-200 bg-transparent text-xs focus:outline-none font-bold focus:border-[#00A770]"
                        placeholder="0"
                      />
                    </div>
                  </div>

                </div>

              </div>
            );
          })}

        </div>

        {/* Right Side: Grand Billing Panel */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-darkCard p-6 rounded-2xl border border-slate-150 shadow-sm space-y-4">
            <h3 className="font-extrabold text-[#062A22] text-xs border-b border-slate-100 pb-2">Grand Billing Summary</h3>
            
            <div className="space-y-3">
              
              <div className="flex justify-between items-center text-slate-500 text-[10px] font-black uppercase">
                <span>Total subtotal:</span>
                <span className="font-extrabold text-slate-800 dark:text-white">Rs. {calculateGrandTotal().toLocaleString()}</span>
              </div>

              {/* General Discount */}
              <div>
                <label className="block text-[10px] text-slate-450 uppercase font-black mb-1">Global General Discount</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={generalDiscount || ""}
                    onChange={(e) => setGeneralDiscount(Number(e.target.value))}
                    className="px-3 w-full h-10 rounded-xl border border-slate-200 bg-transparent text-xs focus:outline-none flex-grow focus:border-[#00A770]"
                    placeholder="Discount"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsDiscountPercent(!isDiscountPercent);
                      setGeneralDiscount(0);
                    }}
                    className="px-3 h-10 bg-slate-100 hover:bg-slate-200 border border-slate-250 rounded-xl font-black text-xs uppercase"
                  >
                    {isDiscountPercent ? "%" : "Cash"}
                  </button>
                </div>
              </div>

              {/* Collection Charge */}
              <div>
                <label className="block text-[10px] text-slate-450 uppercase font-black mb-1">Collection Charge</label>
                <input
                  type="number"
                  value={collectionCharge || ""}
                  onChange={(e) => setCollectionCharge(Number(e.target.value))}
                  className="px-3 w-full h-10 rounded-xl border border-slate-200 bg-transparent text-xs focus:outline-none focus:border-[#00A770]"
                  placeholder="Collection charge amount"
                />
              </div>

              <div className="flex justify-between items-center text-slate-500 py-1.5 border-t border-dashed border-slate-200 text-[10px] font-black uppercase">
                <span>Total Net Billed:</span>
                <span className="font-black text-slate-800">Rs. {calculateGrandNetTotal().toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-[#00A770] py-1.5 border-t border-dashed border-slate-200 text-[10px] font-black uppercase">
                <span>Total Paid:</span>
                <span className="font-black">Rs. {calculateGrandPaid().toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-t border-dashed border-slate-200 text-xs font-black uppercase">
                <span>Balance Dues:</span>
                <span className={`font-black text-sm ${calculateGrandBalance() > 0 ? "text-red-500 animate-pulse" : "text-[#00A770]"}`}>
                  Rs. {calculateGrandBalance().toLocaleString()}
                </span>
              </div>

              <div>
                <label className="block text-[10px] text-slate-450 uppercase font-black mb-1">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="px-3 w-full h-10 rounded-xl border border-slate-200 bg-transparent text-xs focus:outline-none focus:border-[#00A770]"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="insurance">Insurance</option>
                  <option value="mixed">Mixed (Cash + UPI)</option>
                </select>
                {paymentMode === "mixed" && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <label className="block text-[9px] text-slate-400 font-black uppercase mb-1">Cash Paid</label>
                      <input
                        type="number"
                        value={mixedCash || ""}
                        onChange={(e) => setMixedCash(Math.max(Number(e.target.value), 0))}
                        className="px-2 w-full h-8 rounded-lg border border-slate-200 bg-transparent text-[11px] focus:outline-none focus:border-[#00A770] font-bold"
                        placeholder="Cash"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-400 font-black uppercase mb-1">UPI Paid</label>
                      <input
                        type="number"
                        value={mixedUpi || ""}
                        onChange={(e) => setMixedUpi(Math.max(Number(e.target.value), 0))}
                        className="px-2 w-full h-8 rounded-lg border border-slate-200 bg-transparent text-[11px] focus:outline-none focus:border-[#00A770] font-bold"
                        placeholder="UPI"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] text-slate-450 uppercase font-black mb-1">Remarks</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="px-3 w-full h-10 rounded-xl border border-slate-200 bg-transparent text-xs focus:outline-none focus:border-[#00A770]"
                  placeholder="Case notes"
                />
              </div>

            </div>

            {/* Bottom buttons */}
            <div className="pt-3 flex space-x-2 text-[10px] font-black uppercase tracking-wider">
              <button
                type="button"
                onClick={handleCreateBill}
                disabled={submitting}
                className="flex-grow py-3 bg-[#00A770] hover:bg-[#009060] disabled:opacity-50 text-white rounded-xl shadow-md flex items-center justify-center space-x-1.5"
              >
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <span>Create Bill</span>}
              </button>
              
              <button className="px-3 bg-white border border-slate-250 hover:bg-slate-50 rounded-xl text-slate-650">
                <Cog className="h-4.5 w-4.5" />
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* --- ADD NEW REFERRER MODAL POP-UP DIALOG --- */}
      {showAddDocModal && (
        <div className="fixed inset-0 z-60 bg-black/55 flex items-center justify-center p-4 print:hidden animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-2xl max-w-xl w-full space-y-5 animate-in zoom-in-95 duration-200 text-slate-700">
            
            {/* Modal header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-xs uppercase tracking-widest text-[#062A22]">Add new referrer</h3>
              <button onClick={() => setShowAddDocModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddDoctor} className="space-y-4">
              
              <div className="grid grid-cols-6 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] text-slate-450 uppercase font-black mb-1">Title *</label>
                  <select
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    className="px-3 w-full h-10 rounded-xl border border-slate-200 bg-transparent text-xs focus:outline-none"
                  >
                    <option value="Dr.">Dr.</option>
                    <option value="Mr.">Mr.</option>
                    <option value="Mrs.">Mrs.</option>
                    <option value="Ms.">Ms.</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] text-slate-455 uppercase font-black mb-1">First name *</label>
                  <input
                    type="text"
                    required
                    value={newDocFirstName}
                    onChange={(e) => setNewDocFirstName(e.target.value)}
                    className="px-3 w-full h-10 rounded-xl border border-slate-200 bg-transparent text-xs focus:outline-none"
                    placeholder="Enter first name"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] text-slate-455 uppercase font-black mb-1">Last name</label>
                  <input
                    type="text"
                    value={newDocLastName}
                    onChange={(e) => setNewDocLastName(e.target.value)}
                    className="px-3 w-full h-10 rounded-xl border border-slate-200 bg-transparent text-xs focus:outline-none"
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-450 uppercase font-black mb-1">Degree</label>
                  <input
                    type="text"
                    value={newDocDegree}
                    onChange={(e) => setNewDocDegree(e.target.value)}
                    className="px-3 w-full h-10 rounded-xl border border-slate-200 bg-transparent text-xs focus:outline-none"
                    placeholder="e.g. MD, MBBS"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-450 uppercase font-black mb-1">Mobile number</label>
                  <input
                    type="text"
                    value={newDocMobile}
                    onChange={(e) => setNewDocMobile(e.target.value)}
                    className="px-3 w-full h-10 rounded-xl border border-slate-200 bg-transparent text-xs focus:outline-none"
                    placeholder="+91 Mobile number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-450 uppercase font-black mb-1">Contact email</label>
                  <input
                    type="email"
                    value={newDocEmail}
                    onChange={(e) => setNewDocEmail(e.target.value)}
                    className="px-3 w-full h-10 rounded-xl border border-slate-200 bg-transparent text-xs focus:outline-none"
                    placeholder="doctor@example.com"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center space-x-2 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={newDocActive}
                      onChange={(e) => setNewDocActive(e.target.checked)}
                      className="rounded border-slate-350 text-[#00A770] focus:ring-emerald-500 h-4 w-4"
                    />
                    <span>Active</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-450 uppercase font-black mb-1">Address</label>
                <textarea
                  value={newDocAddress}
                  onChange={(e) => setNewDocAddress(e.target.value)}
                  rows={2}
                  className="p-3 w-full rounded-xl border border-slate-200 bg-transparent text-xs focus:outline-none"
                  placeholder="Clinic or office address"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 text-[10px] font-black uppercase tracking-wider">
                <button 
                  type="button"
                  onClick={() => setShowAddDocModal(false)}
                  className="px-4.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 bg-[#00A770] hover:bg-[#009060] text-white rounded-xl shadow-md"
                >
                  Create Referrer
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 1. Add Agent Modal */}
      {showAddAgentModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-2xl max-w-md w-full space-y-5 animate-in zoom-in-95 duration-200 text-slate-700">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-xs uppercase tracking-widest text-[#062A22]">Add new sample collection agent</h3>
              <button onClick={() => setShowAddAgentModal(false)} className="text-slate-400 hover:text-slate-650">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddAgent} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-450 uppercase font-black mb-1">* Name</label>
                <input
                  type="text"
                  required
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  className="px-3 w-full h-10 rounded-xl border border-slate-200 bg-transparent text-xs focus:outline-none focus:border-[#00A770]"
                  placeholder="Enter agent name"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2 text-[10px] font-black uppercase tracking-wider">
                <button 
                  type="button"
                  onClick={() => setShowAddAgentModal(false)}
                  className="px-4.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md font-bold"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Add Centre Modal */}
      {showAddCentreModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-2xl max-w-md w-full space-y-5 animate-in zoom-in-95 duration-200 text-slate-700">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-xs uppercase tracking-widest text-[#062A22]">Add new collection centre</h3>
              <button onClick={() => setShowAddCentreModal(false)} className="text-slate-400 hover:text-slate-650">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddCentre} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-450 uppercase font-black mb-1">* Centre Name</label>
                <input
                  type="text"
                  required
                  value={newCentreName}
                  onChange={(e) => setNewCentreName(e.target.value)}
                  className="px-3 w-full h-10 rounded-xl border border-slate-200 bg-transparent text-xs focus:outline-none focus:border-[#00A770]"
                  placeholder="Enter centre name"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2 text-[10px] font-black uppercase tracking-wider">
                <button 
                  type="button"
                  onClick={() => setShowAddCentreModal(false)}
                  className="px-4.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md font-bold"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Add Test Modal */}
      {showAddTestModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-2xl max-w-xl w-full space-y-5 animate-in zoom-in-95 duration-200 text-slate-700">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-xs uppercase tracking-widest text-[#062A22]">Add new {addTestModality} investigation</h3>
              <button onClick={() => setShowAddTestModal(false)} className="text-slate-400 hover:text-slate-650">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddNewTest} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-[10px] text-slate-455 uppercase font-black mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={newTestName}
                    onChange={(e) => setNewTestName(e.target.value)}
                    className="px-3 w-full h-10 rounded-xl border border-slate-200 bg-transparent text-xs focus:outline-none focus:border-[#00A770]"
                    placeholder="Enter test name"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] text-slate-455 uppercase font-black mb-1">* Fee</label>
                  <input
                    type="number"
                    required
                    value={newTestFee}
                    onChange={(e) => setNewTestFee(e.target.value)}
                    className="px-3 w-full h-10 rounded-xl border border-slate-200 bg-transparent text-xs focus:outline-none focus:border-[#00A770]"
                    placeholder="Enter fee amount"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] text-slate-455 uppercase font-black mb-1">For gender</label>
                  <select
                    value={newTestGender}
                    onChange={(e) => setNewTestGender(e.target.value)}
                    className="px-3 w-full h-10 rounded-xl border border-slate-200 bg-transparent text-xs focus:outline-none focus:border-[#00A770]"
                  >
                    <option value="Both">Both</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-start pt-2 text-[10px] font-black uppercase tracking-wider">
                <button 
                  type="submit"
                  className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md font-bold"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
