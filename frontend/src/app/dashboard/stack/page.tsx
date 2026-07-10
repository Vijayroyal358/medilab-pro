"use client";

import React, { useEffect, useState, useRef } from "react";
import Script from "next/script";

export default function TechStackShowcasePage() {
  const [jqueryLoaded, setJqueryLoaded] = useState(false);
  const [jqueryUiLoaded, setJqueryUiLoaded] = useState(false);
  const [select2Loaded, setSelect2Loaded] = useState(false);
  const [momentLoaded, setMomentLoaded] = useState(false);
  const [chartLoaded, setChartLoaded] = useState(false);
  const [tinyMceLoaded, setTinyMceLoaded] = useState(false);
  const [foundationLoaded, setFoundationLoaded] = useState(false);
  const [turboLoaded, setTurboLoaded] = useState(false);
  const [alpineLoaded, setAlpineLoaded] = useState(false);

  const [libsLoaded, setLibsLoaded] = useState(false);

  // Component States
  const [activeTab, setActiveTab] = useState("overview");
  const [currentTime, setCurrentTime] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTest, setSelectedTest] = useState("");
  const [editorContent, setEditorContent] = useState("<p>Enter clinic lab notes here...</p>");
  const [priorityQueue, setPriorityQueue] = useState([
    "Complete Blood Count (CBC) - Urgent",
    "Lipid Profile Test - Routine",
    "Thyroid Profile (T3, T4, TSH) - Stat",
    "Kidney Function Test (KFT) - Routine",
    "Liver Function Test (LFT) - Urgent"
  ]);
  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  
  // Turbo Simulator States
  const [turboStatus, setTurboStatus] = useState("Idle");
  const [turboLogs, setTurboLogs] = useState<string[]>([]);

  // Refs for jQuery / external plugin wrappers
  const dateInputRef = useRef<HTMLInputElement>(null);
  const select2Ref = useRef<HTMLSelectElement>(null);
  const sortableRef = useRef<HTMLUListElement>(null);
  const chartRef1 = useRef<HTMLCanvasElement>(null);
  const chartRef2 = useRef<HTMLCanvasElement>(null);

  // Dynamic CSS Injector
  useEffect(() => {
    const styles = [
      { id: "jquery-ui-css", href: "https://code.jquery.com/ui/1.14.1/themes/base/jquery-ui.css" },
      { id: "select2-css", href: "https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css" },
      { id: "foundation-css", href: "https://cdn.jsdelivr.net/npm/foundation-sites@6.6.2/dist/css/foundation.min.css" },
      { id: "tabler-icons-css", href: "https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.36.0/tabler-icons.min.css" }
    ];

    styles.forEach(s => {
      if (!document.getElementById(s.id)) {
        const link = document.createElement("link");
        link.id = s.id;
        link.rel = "stylesheet";
        link.href = s.href;
        document.head.appendChild(link);
      }
    });

    return () => {
      styles.forEach(s => {
        const link = document.getElementById(s.id);
        if (link) link.remove();
      });
    };
  }, []);

  // Check if libraries are already loaded globally on mount
  useEffect(() => {
    const checkLibs = () => {
      const w = window as any;
      if (w.jQuery) {
        setJqueryLoaded(true);
        if (w.jQuery.ui) setJqueryUiLoaded(true);
        if (w.jQuery.fn && w.jQuery.fn.select2) setSelect2Loaded(true);
        if (w.Foundation) setFoundationLoaded(true);
      }
      if (w.moment) setMomentLoaded(true);
      if (w.Chart) setChartLoaded(true);
      if (w.tinymce) setTinyMceLoaded(true);
      if (w.Turbo) setTurboLoaded(true);
      if (w.Alpine) setAlpineLoaded(true);
    };

    checkLibs();
    const timer = setTimeout(checkLibs, 100);
    const timer2 = setTimeout(checkLibs, 500);
    const timer3 = setTimeout(checkLibs, 1500);
    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  // Determine if all scripts are loaded
  useEffect(() => {
    if (
      jqueryLoaded &&
      jqueryUiLoaded &&
      select2Loaded &&
      momentLoaded &&
      chartLoaded &&
      tinyMceLoaded &&
      foundationLoaded &&
      turboLoaded
    ) {
      setLibsLoaded(true);
    }
  }, [
    jqueryLoaded,
    jqueryUiLoaded,
    select2Loaded,
    momentLoaded,
    chartLoaded,
    tinyMceLoaded,
    foundationLoaded,
    turboLoaded
  ]);

  // Moment.js ticking clock
  useEffect(() => {
    if (!libsLoaded) return;

    const moment = (window as any).moment;
    if (moment) {
      setCurrentTime(moment().format("MMMM Do YYYY, h:mm:ss a"));
      const interval = setInterval(() => {
        setCurrentTime(moment().format("MMMM Do YYYY, h:mm:ss a"));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [libsLoaded]);

  // Initialize jQuery, JQuery UI, Select2, Chart.js, TinyMCE & ZURB Foundation
  useEffect(() => {
    if (!libsLoaded) return;

    const $ = (window as any).jQuery;
    if (!$) return;

    // 1. Initialize jQuery UI Datepicker
    if (dateInputRef.current) {
      $(dateInputRef.current).datepicker({
        dateFormat: "yy-mm-dd",
        onSelect: (dateText: string) => {
          setSelectedDate(dateText);
        }
      });
    }

    // 2. Initialize Select2
    if (select2Ref.current) {
      $(select2Ref.current).select2({
        placeholder: "Select a test profile...",
        allowClear: true
      }).on("change", (e: any) => {
        setSelectedTest($(e.target).val());
      });
    }

    // 3. Initialize jQuery UI Sortable
    if (sortableRef.current) {
      $(sortableRef.current).sortable({
        update: () => {
          const items: string[] = [];
          $(sortableRef.current).find("li").each(function(this: any) {
            items.push($(this).text().trim());
          });
          setPriorityQueue(items);
        }
      });
      $(sortableRef.current).disableSelection();
    }

    // 4. Initialize ZURB Foundation
    if ((window as any).Foundation) {
      try {
        $(document).foundation();
      } catch (err) {
        console.error("ZURB Foundation Init Error", err);
      }
    }

    // 5. Initialize Chart.js
    let chart1: any = null;
    let chart2: any = null;

    if (chartRef1.current && (window as any).Chart) {
      const Chart = (window as any).Chart;
      chart1 = new Chart(chartRef1.current, {
        type: "bar",
        data: {
          labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          datasets: [
            {
              label: "Registered Patients",
              data: [35, 45, 62, 55, 78, 40, 25],
              backgroundColor: "rgba(0, 167, 112, 0.7)",
              borderColor: "rgba(0, 167, 112, 1)",
              borderWidth: 1.5,
              borderRadius: 4
            },
            {
              label: "Completed Reports",
              data: [28, 40, 52, 48, 70, 32, 20],
              backgroundColor: "rgba(59, 130, 246, 0.7)",
              borderColor: "rgba(59, 130, 246, 1)",
              borderWidth: 1.5,
              borderRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "top" }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }

    if (chartRef2.current && (window as any).Chart) {
      const Chart = (window as any).Chart;
      chart2 = new Chart(chartRef2.current, {
        type: "doughnut",
        data: {
          labels: ["Urgent (Stat)", "High Priority", "Routine Checks"],
          datasets: [
            {
              data: [18, 25, 57],
              backgroundColor: [
                "rgba(239, 68, 68, 0.85)", // red
                "rgba(245, 158, 11, 0.85)", // orange
                "rgba(16, 185, 129, 0.85)" // green
              ],
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom" }
          }
        }
      });
    }

    // 6. Initialize TinyMCE 5
    if ((window as any).tinymce) {
      (window as any).tinymce.init({
        target: document.getElementById("tinymce-editor"),
        height: 220,
        menubar: false,
        branding: false,
        plugins: "lists link wordcount",
        toolbar: "bold italic underline | alignleft aligncenter alignright | bullist numlist | removeformat",
        setup: (editor: any) => {
          editor.on("ChangeKeyup Change", () => {
            setEditorContent(editor.getContent());
          });
        }
      });
    }

    return () => {
      if (chart1) chart1.destroy();
      if (chart2) chart2.destroy();
      if ((window as any).tinymce) {
        (window as any).tinymce.remove("#tinymce-editor");
      }
    };
  }, [libsLoaded]);

  // Handle TinyMCE template injection
  const injectTemplate = (type: string) => {
    const tinymce = (window as any).tinymce;
    if (!tinymce) return;
    const editor = tinymce.get("tinymce-editor");
    if (!editor) return;

    if (type === "cbc") {
      editor.setContent(`
        <h4>COMPLETE BLOOD COUNT (CBC) REPORT SUMMARY</h4>
        <table border="1" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr><th>Parameter</th><th>Result</th><th>Reference Range</th></tr>
          </thead>
          <tbody>
            <tr><td>Hemoglobin</td><td>14.2 g/dL</td><td>13.0 - 17.0 g/dL</td></tr>
            <tr><td>Total WBC Count</td><td>7,500 /cumm</td><td>4,000 - 11,000 /cumm</td></tr>
            <tr><td>Platelet Count</td><td>250,000 /cumm</td><td>150,000 - 450,000 /cumm</td></tr>
          </tbody>
        </table>
        <p><strong>Clinical Notes:</strong> CBC parameters appear normal. No abnormalities detected.</p>
      `);
    } else {
      editor.setContent(`
        <h4>LIPID PROFILE ANALYSIS</h4>
        <table border="1" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr><th>Test Component</th><th>Result</th><th>Reference Value</th></tr>
          </thead>
          <tbody>
            <tr><td>Total Cholesterol</td><td>190 mg/dL</td><td>Desirable: &lt; 200 mg/dL</td></tr>
            <tr><td>Triglycerides</td><td>145 mg/dL</td><td>Normal: &lt; 150 mg/dL</td></tr>
            <tr><td>HDL (Good Cholesterol)</td><td>48 mg/dL</td><td>Optimal: &gt; 40 mg/dL</td></tr>
            <tr><td>LDL (Bad Cholesterol)</td><td>113 mg/dL</td><td>Desirable: &lt; 100 mg/dL</td></tr>
          </tbody>
        </table>
        <p><strong>Recommendation:</strong> LDL is borderline. Advised balanced low-fat diet and exercise.</p>
      `);
    }
  };

  // WhatsApp Business Chat flow trigger
  const sendWhatsAppMsg = () => {
    if (!chatMessage.trim()) return;
    const encodedText = encodeURIComponent(chatMessage);
    const link = `https://wa.me/919999999999?text=${encodedText}`;
    window.open(link, "_blank");
    setChatMessage("");
    setWhatsappOpen(false);
  };

  // Turbo simulation loader
  const triggerTurboSim = () => {
    setTurboStatus("Transitioning...");
    const moment = (window as any).moment;
    const timestamp = moment ? moment().format("hh:mm:ss a") : new Date().toLocaleTimeString();
    
    setTurboLogs(prev => [`[${timestamp}] Turbo: intercepted click to /dashboard/reports`, ...prev]);
    
    setTimeout(() => {
      setTurboStatus("Caching DOM...");
      setTurboLogs(prev => [`[${timestamp}] Turbo: fetching assets asynchronously`, ...prev]);
    }, 400);

    setTimeout(() => {
      setTurboStatus("Active (Rendered)");
      setTurboLogs(prev => [`[${timestamp}] Turbo: replaced body content container in 12ms (instantaneous)`, ...prev]);
    }, 850);
  };

  // Alpine.js billing calculator markup code string (injected safely as raw html)
  const alpineBillingCalculatorHtml = `
    <div x-data="{ 
      selectedTests: [], 
      discount: 0, 
      get total() { 
        let sum = this.selectedTests.reduce((a, b) => a + Number(b), 0);
        return sum * (1 - this.discount / 100);
      } 
    }" class="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
      <div class="flex justify-between items-center mb-4">
        <h4 class="font-bold text-slate-800 dark:text-white flex items-center">
          <i class="ti ti-calculator text-emerald-500 mr-2 text-xl"></i> Alpine.js Billing Panel
        </h4>
        <span class="text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded font-black tracking-wide">ALPINE.JS 3.10.0</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Check Panels to Order</label>
          <div class="space-y-3">
            <label class="flex items-center space-x-2 text-sm text-slate-700 dark:text-slate-250 cursor-pointer">
              <input type="checkbox" value="1200" x-model="selectedTests" class="rounded text-emerald-500 focus:ring-emerald-500 w-4 h-4 border-slate-300">
              <span>Complete Blood Count - Rs. 1,200</span>
            </label>
            <label class="flex items-center space-x-2 text-sm text-slate-700 dark:text-slate-250 cursor-pointer">
              <input type="checkbox" value="2500" x-model="selectedTests" class="rounded text-emerald-500 focus:ring-emerald-500 w-4 h-4 border-slate-300">
              <span>Lipid Profile Panel - Rs. 2,500</span>
            </label>
            <label class="flex items-center space-x-2 text-sm text-slate-700 dark:text-slate-250 cursor-pointer">
              <input type="checkbox" value="1800" x-model="selectedTests" class="rounded text-emerald-500 focus:ring-emerald-500 w-4 h-4 border-slate-300">
              <span>Liver Function Test - Rs. 1,800</span>
            </label>
            <label class="flex items-center space-x-2 text-sm text-slate-700 dark:text-slate-250 cursor-pointer">
              <input type="checkbox" value="3200" x-model="selectedTests" class="rounded text-emerald-500 focus:ring-emerald-500 w-4 h-4 border-slate-300">
              <span>Thyroid Profile - Rs. 3,200</span>
            </label>
          </div>
        </div>
        <div>
          <div class="mb-4">
            <label class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Apply Promo Discount (%)</label>
            <input type="number" min="0" max="100" x-model="discount" class="w-full px-3 py-2 border rounded-lg bg-white dark:bg-darkCard dark:border-slate-700 text-sm focus:ring-1 focus:ring-emerald-500 outline-none text-slate-800 dark:text-white">
          </div>
          <div class="bg-emerald-500/10 dark:bg-emerald-500/5 p-4 rounded-lg border border-emerald-500/20">
            <div class="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Subtotal:</span>
              <span class="font-bold text-slate-700 dark:text-slate-200">Rs. <span x-text="selectedTests.reduce((a, b) => a + Number(b), 0)">0</span></span>
            </div>
            <div class="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              <span>Discounted Rate:</span>
              <span class="font-bold text-red-500"><span x-text="discount">0</span>% Off</span>
            </div>
            <div class="flex justify-between text-sm font-black text-slate-800 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-2.5 mt-2.5">
              <span>Total Payable:</span>
              <span class="text-emerald-600 dark:text-emerald-450 text-base">Rs. <span x-text="total.toFixed(2)">0.00</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  return (
    <div className="space-y-6">
      {/* 1. Loading Scripts */}
      <Script
        src="https://code.jquery.com/jquery-3.7.1.min.js"
        strategy="afterInteractive"
        onLoad={() => setJqueryLoaded(true)}
      />
      {jqueryLoaded && (
        <>
          <Script
            src="https://code.jquery.com/ui/1.14.1/jquery-ui.min.js"
            strategy="afterInteractive"
            onLoad={() => setJqueryUiLoaded(true)}
          />
          <Script
            src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"
            strategy="afterInteractive"
            onLoad={() => setSelect2Loaded(true)}
          />
          <Script
            src="https://cdn.jsdelivr.net/npm/foundation-sites@6.6.2/dist/js/foundation.min.js"
            strategy="afterInteractive"
            onLoad={() => setFoundationLoaded(true)}
          />
        </>
      )}
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.18.1/moment.min.js"
        strategy="afterInteractive"
        onLoad={() => setMomentLoaded(true)}
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/chart.js"
        strategy="afterInteractive"
        onLoad={() => setChartLoaded(true)}
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/tinymce@5.10.7/tinymce.min.js"
        strategy="afterInteractive"
        onLoad={() => setTinyMceLoaded(true)}
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/@hotwired/turbo@7.3.0/dist/turbo.es2017-umd.js"
        strategy="afterInteractive"
        onLoad={() => setTurboLoaded(true)}
      />
      {libsLoaded && (
        <Script
          src="https://cdn.jsdelivr.net/npm/alpinejs@3.10.0/dist/cdn.min.js"
          strategy="afterInteractive"
          onLoad={() => setAlpineLoaded(true)}
        />
      )}

      {/* 2. Top Header Showcase */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 dark:border-darkBorders pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Fully Integrated Tech Stack
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white mt-1.5 flex items-center">
            <i className="ti ti-layers-difference text-emerald-500 mr-2 text-2xl"></i> Operations Stack Hub
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            This module combines legacy and modern technologies (Alpine, jQuery, Foundation, Turbo, Chart.js, TinyMCE, Tabler) to power clinical diagnostics.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <div className="bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-right">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Moment.js Timestamp</div>
            <div className="text-xs font-bold text-slate-750 dark:text-slate-200 font-mono mt-0.5">
              {currentTime ? (
                <>
                  <i className="ti ti-clock text-emerald-500 mr-1"></i>
                  {currentTime}
                </>
              ) : (
                "Formatting date..."
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Script Loading Status Checker */}
      {!libsLoaded && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900 p-6 rounded-2xl flex items-center space-x-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <div>
            <h4 className="font-bold text-sm text-slate-800 dark:text-white">Connecting Stack Components...</h4>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${jqueryLoaded ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>jQuery</span>
              <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${jqueryUiLoaded ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>jQuery UI</span>
              <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${select2Loaded ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>Select2</span>
              <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${momentLoaded ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>Moment.js</span>
              <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${chartLoaded ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>Chart.js</span>
              <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${tinyMceLoaded ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>TinyMCE 5</span>
              <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${foundationLoaded ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>ZURB Foundation</span>
              <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${turboLoaded ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>Turbo (Hotwire)</span>
            </div>
          </div>
        </div>
      )}

      {libsLoaded && (
        <div className="space-y-8">
          {/* ZURB Foundation container wrapping Tabs */}
          <div className="grid-container full">
            <div className="grid-x grid-margin-x">
              
              {/* Foundation styled sidebar tabs */}
              <div className="cell small-12 medium-3">
                <div className="bg-white dark:bg-darkCard border border-slate-150 dark:border-slate-700/60 p-4 rounded-2xl space-y-2">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2.5 mb-3">Navigator</h5>
                  
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                      activeTab === "overview"
                        ? "bg-emerald-500 text-white shadow-md"
                        : "text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className="flex items-center"><i className="ti ti-chart-bar mr-2 text-sm"></i> 1. Chart.js & Moment</span>
                    <i className="ti ti-chevron-right text-xs"></i>
                  </button>

                  <button
                    onClick={() => setActiveTab("intake")}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                      activeTab === "intake"
                        ? "bg-emerald-500 text-white shadow-md"
                        : "text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className="flex items-center"><i className="ti ti-user-plus mr-2 text-sm"></i> 2. Select2 & JQuery UI</span>
                    <i className="ti ti-chevron-right text-xs"></i>
                  </button>

                  <button
                    onClick={() => setActiveTab("editor")}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                      activeTab === "editor"
                        ? "bg-emerald-500 text-white shadow-md"
                        : "text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className="flex items-center"><i className="ti ti-file-text mr-2 text-sm"></i> 3. TinyMCE Editor</span>
                    <i className="ti ti-chevron-right text-xs"></i>
                  </button>

                  <button
                    onClick={() => setActiveTab("alpine-turbo")}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                      activeTab === "alpine-turbo"
                        ? "bg-emerald-500 text-white shadow-md"
                        : "text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className="flex items-center"><i className="ti ti-rocket mr-2 text-sm"></i> 4. Alpine & Turbo</span>
                    <i className="ti ti-chevron-right text-xs"></i>
                  </button>
                </div>
              </div>

              {/* Main Tab Content */}
              <div className="cell small-12 medium-9">
                
                {/* TAB 1: Chart.js & Moment */}
                {activeTab === "overview" && (
                  <div className="bg-white dark:bg-darkCard border border-slate-150 dark:border-slate-700/60 p-6 rounded-2xl space-y-6">
                    <div className="border-b border-slate-100 dark:border-slate-700/60 pb-3 flex justify-between items-center">
                      <div>
                        <h3 className="font-extrabold text-slate-850 dark:text-white text-base">Analytical Graphics</h3>
                        <p className="text-[10px] text-slate-400">Rendering live statistics using Chart.js</p>
                      </div>
                      <span className="text-[10px] bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded font-black tracking-wide">CHART.JS</span>
                    </div>

                    <div className="grid-x grid-margin-x">
                      {/* Bar Chart */}
                      <div className="cell small-12 large-7">
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-750">
                          <h4 className="font-bold text-slate-800 dark:text-white text-xs mb-3 flex items-center">
                            <i className="ti ti-chart-bar text-emerald-500 mr-1.5"></i> Daily Registrations & Completion Rates
                          </h4>
                          <div className="h-64 relative">
                            <canvas ref={chartRef1}></canvas>
                          </div>
                        </div>
                      </div>

                      {/* Doughnut Chart */}
                      <div className="cell small-12 large-5">
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-750">
                          <h4 className="font-bold text-slate-800 dark:text-white text-xs mb-3 flex items-center">
                            <i className="ti ti-chart-donut text-emerald-500 mr-1.5"></i> Report Urgency Distribution
                          </h4>
                          <div className="h-64 relative">
                            <canvas ref={chartRef2}></canvas>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: Patient Intake (Select2 & jQuery UI) */}
                {activeTab === "intake" && (
                  <div className="bg-white dark:bg-darkCard border border-slate-150 dark:border-slate-700/60 p-6 rounded-2xl space-y-6">
                    <div className="border-b border-slate-100 dark:border-slate-700/60 pb-3 flex justify-between items-center">
                      <div>
                        <h3 className="font-extrabold text-slate-850 dark:text-white text-base">Diagnostic Register (jQuery & Select2)</h3>
                        <p className="text-[10px] text-slate-400">Searchable selectors, calendar dates, and sortable queues</p>
                      </div>
                      <div className="flex space-x-2">
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded font-black tracking-wide">JQUERY UI</span>
                        <span className="text-[10px] bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded font-black tracking-wide">SELECT2</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        {/* Select2 */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Select2 Diagnostic Test Panel
                          </label>
                          <select ref={select2Ref} className="w-full text-slate-800">
                            <option value=""></option>
                            <option value="Complete Blood Count (CBC)">Complete Blood Count (CBC) - Rs. 1,200</option>
                            <option value="Lipid Profile Analysis">Lipid Profile Analysis - Rs. 2,500</option>
                            <option value="Liver Function Test (LFT)">Liver Function Test (LFT) - Rs. 1,800</option>
                            <option value="Thyroid Stimulating Hormone (TSH)">Thyroid Profile (T3, T4, TSH) - Rs. 3,200</option>
                            <option value="Kidney Function Test (KFT)">Kidney Function Test (KFT) - Rs. 2,100</option>
                            <option value="HbA1c Blood Glucose">HbA1c Blood Glucose - Rs. 850</option>
                          </select>
                          {selectedTest && (
                            <div className="mt-2 text-xs text-emerald-600 font-semibold">
                              Selected via Select2: {selectedTest}
                            </div>
                          )}
                        </div>

                        {/* JQuery UI Datepicker */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            jQuery UI Datepicker Appointment Date
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              ref={dateInputRef}
                              placeholder="Click to select date..."
                              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-darkCard dark:border-slate-700 text-sm outline-none text-slate-850 dark:text-white"
                              readOnly
                            />
                            <i className="ti ti-calendar absolute right-3 top-2.5 text-slate-400"></i>
                          </div>
                          {selectedDate && (
                            <div className="mt-2 text-xs text-emerald-600 font-semibold">
                              Date Selected: {selectedDate}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* JQuery UI Sortable */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                          jQuery UI Sortable: Drag to Prioritize Report Queue
                        </label>
                        <ul ref={sortableRef} className="space-y-2 cursor-grab">
                          {priorityQueue.map((item, idx) => (
                            <li
                              key={idx}
                              className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center shadow-sm hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                            >
                              <i className="ti ti-drag-drop text-slate-450 mr-3 text-base"></i>
                              {item}
                            </li>
                          ))}
                        </ul>
                        <span className="text-[10px] text-slate-400 italic block mt-2">
                          * Click and drag the handles to sort items on screen.
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: TinyMCE Editor */}
                {activeTab === "editor" && (
                  <div className="bg-white dark:bg-darkCard border border-slate-150 dark:border-slate-700/60 p-6 rounded-2xl space-y-6">
                    <div className="border-b border-slate-100 dark:border-slate-700/60 pb-3 flex justify-between items-center">
                      <div>
                        <h3 className="font-extrabold text-slate-850 dark:text-white text-base">Clinical Report Writer (TinyMCE 5)</h3>
                        <p className="text-[10px] text-slate-400">Generate rich text reports instantly from templates</p>
                      </div>
                      <span className="text-[10px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded font-black tracking-wide">TINYMCE 5</span>
                    </div>

                    <div className="flex space-x-3 mb-4">
                      <button
                        onClick={() => injectTemplate("cbc")}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-lg transition-all"
                      >
                        Load CBC Template
                      </button>
                      <button
                        onClick={() => injectTemplate("lipid")}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-lg transition-all"
                      >
                        Load Lipid Profile Template
                      </button>
                    </div>

                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden text-slate-800">
                      <textarea id="tinymce-editor" defaultValue={editorContent}></textarea>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-750">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Live Output (HTML)</div>
                      <div
                        className="text-xs text-slate-700 dark:text-slate-350 max-h-40 overflow-y-auto font-mono bg-white dark:bg-darkCard p-3 rounded-lg border border-slate-150 dark:border-slate-850"
                        dangerouslySetInnerHTML={{ __html: editorContent }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* TAB 4: Alpine.js & Turbo */}
                {activeTab === "alpine-turbo" && (
                  <div className="bg-white dark:bg-darkCard border border-slate-150 dark:border-slate-700/60 p-6 rounded-2xl space-y-6">
                    
                    {/* Render Alpine.js Billing Panel using dangerouslySetInnerHTML */}
                    <div dangerouslySetInnerHTML={{ __html: alpineBillingCalculatorHtml }}></div>

                    {/* Turbo simulation */}
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-slate-850 dark:text-white flex items-center">
                          <i className="ti ti-rocket text-emerald-500 mr-2 text-xl"></i> Hotwire Turbo Navigator
                        </h4>
                        <span className="text-[10px] bg-sky-500/10 text-sky-600 px-2 py-0.5 rounded font-black tracking-wide">HOTWIRE TURBO</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                        <div className="md:col-span-4 text-center">
                          <button
                            onClick={triggerTurboSim}
                            className="w-full px-5 py-3 bg-[#00A770] hover:bg-[#009060] text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all uppercase tracking-wider"
                          >
                            Execute Fast Navigation
                          </button>
                          <div className="mt-3 text-xs">
                            Status: <span className="font-bold text-emerald-600">{turboStatus}</span>
                          </div>
                        </div>

                        <div className="md:col-span-8">
                          <div className="bg-slate-900 text-slate-300 p-4 rounded-xl font-mono text-[10px] h-32 overflow-y-auto space-y-1">
                            {turboLogs.length === 0 ? (
                              <span className="text-slate-500">// Logs will appear here after clicking navigation...</span>
                            ) : (
                              turboLogs.map((log, idx) => <div key={idx}>{log}</div>)
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>

            </div>
          </div>
        </div>
      )}

      {/* 4. ZURB Foundation Callout for Stack Info */}
      {libsLoaded && (
        <div className="callout success bg-emerald-50 dark:bg-emerald-950/20 border-emerald-350 dark:border-emerald-900 rounded-2xl p-5 text-slate-700 dark:text-slate-300">
          <h5 className="font-bold text-slate-850 dark:text-white mb-2 flex items-center text-sm">
            <i className="ti ti-info-circle text-emerald-600 mr-2 text-base"></i> ZURB Foundation Callout Information
          </h5>
          <p className="text-xs leading-normal">
            This module confirms coexistence of Tailwind CSS (sizing/spacing) and ZURB Foundation (styles, grids, Callouts). Both frameworks run synchronously without breaking existing layouts, as verified in our container isolation.
          </p>
        </div>
      )}

      {/* 5. WhatsApp Floating Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Floating Button */}
        <button
          onClick={() => setWhatsappOpen(!whatsappOpen)}
          className="h-14 w-14 rounded-full bg-[#25D366] text-white shadow-2xl hover:scale-110 transition-transform flex items-center justify-center relative hover:shadow-[#25D366]/40"
        >
          <i className="ti ti-brand-whatsapp text-3xl"></i>
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-red-500 rounded-full border-2 border-white animate-ping"></span>
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        {/* WhatsApp Window Chat */}
        {whatsappOpen && (
          <div className="absolute bottom-16 right-0 w-80 bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-[#075E54] text-white p-4 flex items-center space-x-3">
              <div className="h-10 w-10 bg-[#128C7E] rounded-full flex items-center justify-center text-white font-bold uppercase">
                ML
              </div>
              <div>
                <h4 className="font-bold text-xs">MediLabsPro Helpdesk</h4>
                <p className="text-[10px] text-emerald-200 flex items-center mt-0.5">
                  <span className="h-2 w-2 bg-emerald-400 rounded-full inline-block mr-1"></span>
                  Typically replies instantly
                </p>
              </div>
            </div>

            {/* Messages body */}
            <div className="p-4 bg-[#ece5dd] dark:bg-slate-900 h-48 overflow-y-auto space-y-3">
              <div className="bg-white dark:bg-darkCard text-slate-800 dark:text-slate-200 p-3 rounded-lg text-xs max-w-[85%] rounded-tl-none shadow-sm">
                Hello there! Welcome to MediLabsPro. How can we assist you with test booking or reports?
              </div>
            </div>

            {/* Input area */}
            <div className="p-3 bg-white dark:bg-darkCard border-t border-slate-100 dark:border-slate-700 flex items-center space-x-2">
              <input
                type="text"
                placeholder="Type a message..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendWhatsAppMsg()}
                className="flex-grow px-3 py-2 border rounded-full bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-xs focus:ring-1 focus:ring-emerald-500 outline-none text-slate-850 dark:text-white"
              />
              <button
                onClick={sendWhatsAppMsg}
                className="h-8 w-8 bg-[#075E54] text-white rounded-full flex items-center justify-center shadow hover:bg-[#128C7E]"
              >
                <i className="ti ti-send text-sm"></i>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
