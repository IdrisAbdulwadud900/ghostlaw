"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { jsPDF } from "jspdf";
import {
  clearToken, getUser,
  scanDocument, scanText, generateDispute, requestCall,
  generateComplaint,
  addScanToHistory, addDisputeToHistory, addCallToHistory,
  getLocalHistory, getLocalStats, saveOutcome, getOutcome,
} from "@/lib/api";

// ── Types ────────────────────────────────────────────────────
type Tab = "scan" | "results" | "dispute" | "call" | "complaint" | "history";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiResult = Record<string, any>;

interface QuickTemplate {
  label: string;
  prompt: string;
  context: string;
}

// ── Templates ────────────────────────────────────────────────
const TEMPLATES: QuickTemplate[] = [
  {
    label: "Medical Bill",
    prompt: `ITEMIZED MEDICAL BILL — Memorial Hospital System\nPatient: [Name], DOB: [Date], Account #: 88274-X\n\nService Date: February 14, 2025\n\nCHARGES:\n- Emergency Room Visit (Level 3)...........$850.00\n- Facility Fee (undisclosed)....................$420.00\n- Blood Panel — Comprehensive (CPT 80053)...$230.00\n- IV Administration...............................$185.00\n- Physician Consultation (CPT 99213).........$145.00\n- Physician Consultation (CPT 99213).........$145.00  ← DUPLICATE\n\nSUBTOTAL: $1,975.00\nInsurance Adjustment: -$640.00\nAMOUNT DUE: $1,335.00`,
    context: "Medical bill — look for upcoding, surprise billing, and charges above Medicare rates",
  },
  {
    label: "Lease",
    prompt: `RESIDENTIAL LEASE AGREEMENT\n\nTenant agrees to pay a late fee of $150 for any payment received after the 1st of the month. Additionally, tenant waives right to 24-hour notice before landlord entry. Tenant is responsible for all repairs under $500. Lease auto-renews unless cancelled 90 days prior...`,
    context: "Lease agreement — look for illegal clauses, excessive fees, and tenant rights violations",
  },
  {
    label: "Phone Contract",
    prompt: `Your monthly charges include: Plan fee $65, Device payment $42, Regulatory fees $8.99, Administrative fee $3.99, Network access charge $9.99 (NEW), Premium data throttling protection $4.99 (NEW), Paper statement fee $3.50...`,
    context: "Phone/wireless bill — look for cramming, unauthorized charges, and FCC violations",
  },
  {
    label: "Insurance",
    prompt: `EXPLANATION OF BENEFITS — Claim Denied\nClaim #: INS-2025-88421\nService: MRI Lumbar Spine without contrast\nDenial Reason: "Not medically necessary"\nAmount billed: $2,400. Your responsibility: $2,400.\nAppeal deadline: 60 days from this notice.`,
    context: "Insurance document — look for wrongful denial, bad faith practices, and coverage gaps",
  },
  {
    label: "Subscription",
    prompt: `Your account has been charged $29.99/month for the past 8 months for GymFlex Premium. You may cancel at any time — however please note that cancellation requires written notice 30 days in advance and cancellation fees may apply...`,
    context: "Subscription — look for dark patterns, hidden auto-renewal, and FTC violations",
  },
  {
    label: "Parking Ticket",
    prompt: `CITY PARKING VIOLATION NOTICE\nTicket #: PKG-2025-44182\nDate: March 12, 2025, 3:47 PM\nLocation: 450 Main St (metered zone)\nViolation: Expired meter\nFine: $85.00 (doubles to $170 after 30 days)\n\nNotes: Meter #2241. No photo evidence attached. Sign partially obscured by tree branch. Meter was reported broken by 3 other drivers same week.`,
    context: "Parking ticket — look for procedural defects, signage issues, meter malfunctions, missing evidence, and appeal deadlines",
  },
  {
    label: "Bank/Credit Card",
    prompt: `CREDIT CARD STATEMENT — Chase Visa\nStatement Period: Feb 1-28, 2025\n\nDisputed charges:\n- Feb 3: RECURRING CHARGE - StreamMax Plus $14.99 (cancelled in January)\n- Feb 8: INTL FEE - Amazon UK $4.50 (I never authorized international purchase)\n- Feb 15: ANNUAL FEE $95.00 (was told this would be waived)\n- Feb 22: OVERLIMIT FEE $39.00 (limit was $5000, balance was $4,800 before annual fee pushed it over)`,
    context: "Credit card/bank charges — look for FCBA violations, unauthorized charges, and chargeback rights under Regulation Z",
  },
];

// ── Nigerian Templates ─────────────────────────────────────────
const NG_TEMPLATES: QuickTemplate[] = [
  {
    label: "🏦 Bank Reversal",
    prompt: `TRANSACTION ALERT \u2014 GTBank\nAcct: 0123456789\nDate: March 15, 2025, 2:47 PM\n\nDebit: \u20a685,000.00\nRef: NIP/250315/GTB/087234\nRemarks: Transfer to 2087654321/Access Bank\n\nBUT: The recipient NEVER received the money. I've waited 5 days. Bank says "it's being investigated" but no reversal. This was my rent money.`,
    context: "Failed bank transfer — debited but not credited to recipient. Look for CBN Consumer Protection Framework violations, 24-72hr resolution mandate",
  },
  {
    label: "🚨 Loan App",
    prompt: `I borrowed \u20a630,000 from OKash loan app 3 months ago. I repaid \u20a645,000 (the full amount with interest). Now they say I still owe \u20a622,000 in "processing fees" and "late penalties". They have:\n- Sent threatening SMS to all my phone contacts\n- Called my employer saying I'm a debtor\n- Posted my photo on a WhatsApp group calling me a thief\n- They accessed my contacts without permission when I installed the app`,
    context: "Predatory loan app harassment — look for NDPA 2023 violations (unauthorized data access), FCCPA defamation, and CBN lending regulations",
  },
  {
    label: "⚡ Light Bill",
    prompt: `ELECTRICITY BILL \u2014 Ikeja Electric (IKEDC)\nAccount: 04/12/01/0456-01\nMonth: February 2025\n\nEstimated Consumption: 890 kWh\nAmount Due: \u20a647,500.00\nBilling Type: ESTIMATED (no meter installed)\n\nBut: I've applied for a prepaid meter 8 months ago. My apartment is a 1-bedroom, usually empty during the day. There's no way I'm using 890 kWh. My neighbor with same apartment size and a meter pays \u20a68,000-12,000/month.`,
    context: "Estimated electricity billing — look for NERC regulation violations, right to metering, estimated billing complaints handling standards",
  },
  {
    label: "📱 Data/Airtime",
    prompt: `MTN NIGERIA — Line: 0803 XXX XXXX\n\nMy 10GB monthly data plan (\u20a63,500) activated on March 1st was completely depleted by March 8th. I barely use data — no streaming, no downloads. Also:\n- Auto-subscribed to "MTN Caller Tunez" at \u20a6100/week (never requested)\n- Auto-subscribed to "Daily News Alert" at \u20a650/day (never requested)  \n- \u20a62,400 deducted in the last month from these "services"\n\nI've called 180 three times. Each time they say "it has been escalated" but nothing happens.`,
    context: "Telecom data depletion and unauthorized VAS subscriptions — look for NCC Consumer Code violations, right to opt-in only services",
  },
  {
    label: "📺 DSTV/GoTV",
    prompt: `DSTV SUBSCRIPTION \u2014 MultiChoice\nSmartcard: 7032XXXXXX\nPackage: DStv Compact (\u20a615,700/month)\n\nIssues:\n- Service was down for 12 days in February (decoder showed "No Signal")\n- Called 08039003788 multiple times, told it was "area maintenance"\n- Was auto-renewed on March 1 for full \u20a615,700 despite 12 days downtime\n- Requested pro-rata credit/refund — denied\n- Channels keep getting removed from my package but price keeps going UP`,
    context: "Pay TV subscription dispute — look for FCCPA consumer rights, right to service paid for, pro-rata refund for downtime",
  },
  {
    label: "🏠 Rent/Landlord",
    prompt: `My landlord at [Address], Lagos, gave me a 1-week "quit notice" to vacate my apartment. I paid \u20a61,200,000 for a 1-year rent starting June 2024. The lease expires June 2025. He says he wants to renovate and has already showed the apartment to new tenants. He also:\n- Changed the gate lock last week\n- Cut off my water supply\n- Threatened to remove my belongings if I don't leave by Friday`,
    context: "Illegal ejection — look for Lagos Tenancy Law 2011 violations, required notice periods, tenant rights, self-help eviction illegality",
  },
  {
    label: "🛒 Online Order",
    prompt: `JUMIA ORDER #JUM-NG-885721\nOrdered: Samsung Galaxy A54 (\u20a6189,000)\nPaid via: Paystack — Card ending 4521\nOrder Date: Feb 20, 2025\nDelivery Date: "Feb 25-28"\n\nWhat arrived on March 5:\n- A clearly used/refurbished phone (scratches on screen, old software)\n- IMEI doesn't match what's on the box\n- Requested return/refund on March 5\n- Jumia says "return window expired" (it was only 5 days late!)\n- \u20a6189,000 gone.`,
    context: "E-commerce fraud/defective product — look for FCCPA consumer protection, right to refund for non-conforming goods, Jumia marketplace liability",
  },
];

// ── Component ────────────────────────────────────────────────
interface AppDashboardProps {
  onLogout: () => void;
}

export default function AppDashboard({ onLogout }: AppDashboardProps) {
  const user = getUser();
  const [activeTab, setActiveTab] = useState<Tab>("scan");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Analyzing your document...");
  const [mobileNav, setMobileNav] = useState(false);

  // Country state (persisted)
  const [country, setCountry] = useState<"US" | "NG">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("ghostlaw_country") as "US" | "NG") || "US";
    }
    return "US";
  });
  const switchCountry = (c: "US" | "NG") => {
    setCountry(c);
    if (typeof window !== "undefined") localStorage.setItem("ghostlaw_country", c);
    // Reset complaint agency to first of new country
    setComplaintAgency(c === "NG" ? "fccpc" : "cfpb");
  };
  const currencySymbol = country === "NG" ? "₦" : "$";

  // Scan state
  const [scanResult, setScanResult] = useState<ApiResult | null>(null);
  const [scanContext, setScanContext] = useState("");
  const [textInput, setTextInput] = useState("");
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Dispute state
  const [disputeResult, setDisputeResult] = useState<ApiResult | null>(null);
  const [disputeTone, setDisputeTone] = useState("firm_but_polite");
  const [copied, setCopied] = useState(false);

  // Call state
  const [callResult, setCallResult] = useState<ApiResult | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [callObjective, setCallObjective] = useState("");

  // Complaint state
  const [complaintResult, setComplaintResult] = useState<ApiResult | null>(null);
  const [complaintAgency, setComplaintAgency] = useState("cfpb");

  // History state
  const [localStats, setLocalStats] = useState(getLocalStats());
  const [localHistory, setLocalHistory] = useState(getLocalHistory());

  // Outcome tracking
  const [outcomeOpen, setOutcomeOpen] = useState(false);

  const refreshLocal = useCallback(() => {
    setLocalStats(getLocalStats());
    setLocalHistory(getLocalHistory());
  }, []);

  useEffect(() => { refreshLocal(); }, [refreshLocal]);

  // ── Handlers ─────────────────────────────────────────────
  const handleFileUpload = useCallback(async (file: File) => {
    setLoading(true);
    setLoadingMsg("Reading your document...");
    try {
      const result = await scanDocument(file, scanContext);
      setScanResult(result);
      addScanToHistory(result);
      refreshLocal();
      setActiveTab("results");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Scan failed");
    } finally { setLoading(false); }
  }, [scanContext, refreshLocal]);

  const handleTextScan = useCallback(async () => {
    if (textInput.length < 20) {
      alert("Paste more text — we need at least a few lines to analyze.");
      return;
    }
    setLoading(true);
    setLoadingMsg("Analyzing your document...");
    try {
      const result = await scanText(textInput, scanContext, country);
      setScanResult(result);
      addScanToHistory(result);
      refreshLocal();
      setActiveTab("results");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Scan failed");
    } finally { setLoading(false); }
  }, [textInput, scanContext, refreshLocal, country]);

  const handleGenerateDispute = useCallback(async () => {
    if (!scanResult?.scan_id) return;
    setLoading(true);
    setLoadingMsg("Writing your dispute letter...");
    try {
      const result = await generateDispute(scanResult.scan_id as string, [], disputeTone, "", country);
      setDisputeResult(result);
      addDisputeToHistory(result);
      refreshLocal();
      setActiveTab("dispute");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to generate dispute");
    } finally { setLoading(false); }
  }, [scanResult, disputeTone, refreshLocal, country]);

  const handleRequestCall = useCallback(async () => {
    if (!scanResult?.scan_id || !companyName) return;
    setLoading(true);
    setLoadingMsg("Building your call script...");
    try {
      const result = await requestCall(
        scanResult.scan_id as string, companyName,
        callObjective || "Dispute overcharges and negotiate a reduction",
        (disputeResult?.dispute_id as string) || "", "", country
      );
      setCallResult(result);
      addCallToHistory(result);
      refreshLocal();
      setActiveTab("call");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to generate call script");
    } finally { setLoading(false); }
  }, [scanResult, companyName, callObjective, disputeResult, refreshLocal, country]);

  const handleGenerateComplaint = useCallback(async () => {
    if (!scanResult?.scan_id) return;
    setLoading(true);
    setLoadingMsg("Drafting your regulatory complaint...");
    try {
      const result = await generateComplaint(
        scanResult.scan_id as string, complaintAgency,
        (disputeResult?.dispute_id as string) || "", companyName, "", "", country
      );
      setComplaintResult(result);
      setActiveTab("complaint");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to generate complaint");
    } finally { setLoading(false); }
  }, [scanResult, complaintAgency, disputeResult, companyName, country]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadText = (text: string, filename: string) => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = (title: string, body: string, filename: string) => {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    // Header
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Generated by GhostLaw — ghostlaw.app", pageW / 2, 12, { align: "center" });
    doc.setDrawColor(200);
    doc.line(15, 16, pageW - 15, 16);
    // Title
    doc.setFontSize(18);
    doc.setTextColor(30);
    doc.text(title, 15, 28);
    // Date
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 15, 35);
    // Body
    doc.setFontSize(11);
    doc.setTextColor(40);
    const lines = doc.splitTextToSize(body, pageW - 30);
    let y = 44;
    for (const line of lines) {
      if (y > 275) { doc.addPage(); y = 20; }
      doc.text(line, 15, y);
      y += 6;
    }
    // Footer
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(170);
      doc.text(`Page ${i} of ${pages}`, pageW / 2, 290, { align: "center" });
    }
    doc.save(filename);
  };

  const sendViaEmail = (to: string, subject: string, body: string) => {
    const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailto, "_blank");
  };

  const handleLogout = () => { clearToken(); onLogout(); };
  const navigate = (tab: Tab) => { if (tab === "history") refreshLocal(); setActiveTab(tab); setMobileNav(false); };

  const loadHistoryScan = (scan: Record<string, unknown>) => {
    setScanResult(scan);
    setActiveTab("results");
  };

  const handleSaveOutcome = (status: string, savings?: number) => {
    if (!scanResult?.scan_id) return;
    saveOutcome(scanResult.scan_id as string, status, savings);
    refreshLocal();
    setOutcomeOpen(false);
  };

  const applyTemplate = (t: QuickTemplate) => {
    setTextInput(t.prompt);
    setScanContext(t.context);
    setActiveTemplate(t.label);
  };

  // ── Font helpers ───────────────────────────────────────────
  const mono = "var(--font-ibm-plex-mono), monospace";
  const sans = "var(--font-ibm-plex-sans), sans-serif";
  const display = "var(--font-bebas-neue), sans-serif";

  // ── Nav items ──────────────────────────────────────────────
  const navItems: { id: Tab; label: string; icon: string; disabled?: boolean }[] = [
    { id: "scan", label: "Scanner", icon: "⌕" },
    { id: "results", label: "Results", icon: "◉", disabled: !scanResult },
    { id: "dispute", label: "Dispute", icon: "✉", disabled: !scanResult },
    { id: "call", label: "Call Script", icon: "☎", disabled: !scanResult },
    { id: "complaint", label: "File Complaint", icon: "⚖", disabled: !scanResult },
    { id: "history", label: "History", icon: "▤" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* ═══ SIDEBAR ═══════════════════════════════════════ */}
      <aside
        className="hidden md:flex w-56 flex-col flex-shrink-0"
        style={{ background: "var(--obsidian)", borderRight: "1px solid var(--border)" }}
      >
        {/* Logo */}
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2.5">
            <span style={{ fontFamily: display, fontSize: 22, letterSpacing: "0.05em" }}>
              Ghost<span style={{ color: "var(--red)" }}>Law</span>
            </span>
            <span className="logo-dot" />
          </div>
        </div>

        {/* Country toggle */}
        <div className="px-3 py-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 6 }}>Region</div>
          <div className="flex gap-1">
            {([["US", "🇺🇸", "USA"], ["NG", "🇳🇬", "Nigeria"]] as const).map(([code, flag, label]) => (
              <button
                key={code}
                onClick={() => switchCountry(code)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 transition-all"
                style={{
                  fontFamily: mono,
                  fontSize: 11,
                  fontWeight: country === code ? 600 : 400,
                  color: country === code ? "var(--white)" : "var(--muted)",
                  background: country === code ? "var(--red-dim)" : "transparent",
                  border: `1px solid ${country === code ? "rgba(232,25,44,0.3)" : "var(--border)"}`,
                }}
              >
                <span style={{ fontSize: 14 }}>{flag}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              disabled={item.disabled}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 transition-all"
              style={{
                fontFamily: mono,
                fontSize: 12,
                letterSpacing: "0.04em",
                color: activeTab === item.id ? "var(--red)" : "var(--muted)",
                background: activeTab === item.id ? "var(--red-dim)" : "transparent",
                borderLeft: activeTab === item.id ? "2px solid var(--red)" : "2px solid transparent",
                opacity: item.disabled ? 0.2 : 1,
                cursor: item.disabled ? "not-allowed" : "pointer",
              }}
            >
              <span style={{ fontSize: 14, width: 18, textAlign: "center" }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Stats */}
        {localStats.total_scans > 0 && (
          <div className="px-3 py-3" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="text-center p-2" style={{ background: "var(--surface)" }}>
                <p style={{ fontFamily: display, fontSize: 22, color: "var(--white)" }}>{localStats.total_scans}</p>
                <p style={{ fontFamily: mono, fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>scans</p>
              </div>
              <div className="text-center p-2" style={{ background: "var(--surface)" }}>
                <p style={{ fontFamily: display, fontSize: 22, color: "var(--red)" }}>{currencySymbol}{localStats.confirmed_savings || localStats.estimated_savings}</p>
                <p style={{ fontFamily: mono, fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{localStats.confirmed_savings > 0 ? "saved" : "potential"}</p>
              </div>
            </div>
          </div>
        )}

        {/* User */}
        <div className="px-3 py-3" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2.5 px-2 mb-2">
            <div className="w-7 h-7 flex items-center justify-center" style={{ background: "var(--red-dim)", border: "1px solid rgba(232,25,44,0.3)", fontFamily: mono, fontSize: 11, color: "var(--red)", fontWeight: 600 }}>
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ fontFamily: mono, fontSize: 11, fontWeight: 500 }} className="truncate">{user?.name || "User"}</p>
              <p style={{ fontFamily: mono, fontSize: 9, color: "var(--muted)" }} className="truncate">{user?.email || ""}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-1.5 transition-colors hover:bg-[var(--red-dim)]"
            style={{ fontFamily: mono, fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}
          >
            ↗ Sign out
          </button>
        </div>
      </aside>

      {/* ═══ MOBILE HEADER ═════════════════════════════════ */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40" style={{ background: "rgba(6,6,8,0.95)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between px-4 py-3">
          <span style={{ fontFamily: display, fontSize: 20, letterSpacing: "0.05em" }}>
            Ghost<span style={{ color: "var(--red)" }}>Law</span>
          </span>
          <button onClick={() => setMobileNav(!mobileNav)} style={{ fontFamily: mono, fontSize: 18, color: "var(--muted2)" }}>
            {mobileNav ? "✕" : "☰"}
          </button>
        </div>
        {mobileNav && (
          <div className="px-3 pb-3 space-y-0.5" style={{ background: "var(--obsidian)", borderBottom: "1px solid var(--border)" }}>
            {/* Mobile country toggle */}
            <div className="flex gap-1 mb-2">
              {([["US", "🇺🇸", "USA"], ["NG", "🇳🇬", "Nigeria"]] as const).map(([code, flag, label]) => (
                <button
                  key={code}
                  onClick={() => switchCountry(code)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2"
                  style={{
                    fontFamily: mono,
                    fontSize: 11,
                    fontWeight: country === code ? 600 : 400,
                    color: country === code ? "var(--white)" : "var(--muted)",
                    background: country === code ? "var(--red-dim)" : "transparent",
                    border: `1px solid ${country === code ? "rgba(232,25,44,0.3)" : "var(--border)"}`,
                  }}
                >
                  <span style={{ fontSize: 14 }}>{flag}</span>
                  {label}
                </button>
              ))}
            </div>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                disabled={item.disabled}
                className="w-full flex items-center gap-2.5 px-3 py-2.5"
                style={{
                  fontFamily: mono, fontSize: 12,
                  color: activeTab === item.id ? "var(--red)" : "var(--muted)",
                  background: activeTab === item.id ? "var(--red-dim)" : "transparent",
                  opacity: item.disabled ? 0.2 : 1,
                }}
              >
                <span style={{ fontSize: 14, width: 18, textAlign: "center" }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2.5"
              style={{ fontFamily: mono, fontSize: 12, color: "var(--muted)" }}
            >
              ↗ Sign out
            </button>
          </div>
        )}
      </div>

      {/* ═══ MAIN CONTENT ══════════════════════════════════ */}
      <main className="flex-1 overflow-auto p-4 pt-16 md:p-8 md:pt-8" style={{ background: "var(--black)" }}>
        {/* Loading overlay */}
        {loading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
            <div className="text-center p-8" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="spinner-sm mx-auto mb-4" style={{ width: 24, height: 24, borderWidth: 2 }} />
              <p style={{ fontFamily: mono, fontSize: 13, fontWeight: 500 }}>{loadingMsg}</p>
              <p style={{ fontFamily: mono, fontSize: 11, color: "var(--muted)", marginTop: 4 }}>Usually takes 5-15 seconds</p>
            </div>
          </div>
        )}

        {/* Progress pipeline — shows when a scan exists */}
        {scanResult && (
          <div className="mb-6 hidden md:block">
            <div className="flex items-center gap-0 max-w-4xl mx-auto" style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {[
                { id: "scan" as Tab, label: "Scanned", done: !!scanResult },
                { id: "results" as Tab, label: "Issues Found", done: !!scanResult?.issues_found },
                { id: "dispute" as Tab, label: "Letter Sent", done: !!disputeResult },
                { id: "call" as Tab, label: "Call Made", done: !!callResult },
                { id: "complaint" as Tab, label: "Filed", done: !!complaintResult },
              ].map((step, i) => (
                <div key={step.id} className="flex items-center flex-1">
                  <button
                    onClick={() => navigate(step.id)}
                    className="flex items-center gap-1.5 transition-colors"
                    style={{ color: step.done ? "#41e866" : activeTab === step.id ? "var(--red)" : "var(--muted)", cursor: "pointer" }}
                  >
                    <span style={{
                      display: "inline-flex", width: 18, height: 18, alignItems: "center", justifyContent: "center",
                      border: `1.5px solid ${step.done ? "#41e866" : activeTab === step.id ? "var(--red)" : "var(--border)"}`,
                      background: step.done ? "rgba(65,232,102,0.1)" : "transparent",
                      fontSize: 10,
                    }}>
                      {step.done ? "✓" : i + 1}
                    </span>
                    {step.label}
                  </button>
                  {i < 4 && (
                    <div className="flex-1 mx-2" style={{ height: 1, background: step.done ? "rgba(65,232,102,0.3)" : "var(--border)" }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ SCAN TAB ════════════════════════════════════ */}
        {activeTab === "scan" && (
          <div className="max-w-4xl mx-auto">
            <div className="scanner-chrome">
              <div className="scanner-header-bar">
                <div className="dot-group">
                  <div className="dot-r" />
                  <div className="dot-y" />
                  <div className="dot-g" />
                </div>
                <div style={{ fontFamily: mono, fontSize: 12, color: "var(--muted)", letterSpacing: "0.05em" }}>
                  ghostlaw_scanner — ready
                </div>
                <div className="status-indicator">
                  <div className="status-dot" />
                  AI Active
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Templates */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)" }}>
                      Quick Start {country === "NG" ? "🇳🇬" : "🇺🇸"}
                    </div>
                    <button
                      onClick={() => switchCountry(country === "US" ? "NG" : "US")}
                      style={{ fontFamily: mono, fontSize: 10, color: "var(--red)", cursor: "pointer", background: "none", border: "none" }}
                    >
                      Switch to {country === "US" ? "Nigeria 🇳🇬" : "USA 🇺🇸"}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(country === "NG" ? NG_TEMPLATES : TEMPLATES).map((t) => (
                      <button
                        key={t.label}
                        onClick={() => applyTemplate(t)}
                        className={`template-chip ${activeTemplate === t.label ? "active" : ""}`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Textarea */}
                <textarea
                  value={textInput}
                  onChange={(e) => { setTextInput(e.target.value); setActiveTemplate(null); }}
                  placeholder={country === "NG" 
                    ? `Paste your document, bill, or message here...\n\nOr describe the situation:\n'GTBank debited me ₦85,000 for a transfer that \nnever reached the recipient. It's been 5 days.'\n\nGhostLaw will scan for:\n• Hidden fees & overcharges\n• Illegal or unenforceable clauses\n• Violations of Nigerian consumer protection law\n• Your rights and dispute options`
                    : `Paste your document, bill, or contract here...\n\nOr describe the situation:\n'My medical bill has a $450 charge for a blood test \nthat Medicare covers. The hospital is saying I owe it.'\n\nGhostLaw will scan for:\n• Hidden fees & overcharges\n• Illegal or unenforceable clauses\n• Violations of consumer protection law\n• Your rights and dispute options`}
                  className="input-ghost resize-none w-full"
                  style={{ minHeight: 260 }}
                />

                {/* Context */}
                <div>
                  <label style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: 6 }}>
                    Additional context (optional)
                  </label>
                  <input
                    type="text"
                    value={scanContext}
                    onChange={(e) => setScanContext(e.target.value)}
                    placeholder={country === "NG" ? "e.g., 'I already complained to the bank' or 'No meter installed'" : "e.g., 'I only stayed 2 hours' or 'I already paid $500'"}
                    className="input-ghost"
                    style={{ padding: "0.75rem 1rem" }}
                  />
                </div>

                {/* Upload option */}
                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileUpload(f); }}
                  className="p-6 text-center cursor-pointer transition-colors hover:bg-[var(--surface2)]"
                  style={{ border: "1px dashed var(--border)" }}
                >
                  <p style={{ fontFamily: mono, fontSize: 12, color: "var(--muted2)" }}>
                    Or drop a photo / PDF here
                  </p>
                  <p style={{ fontFamily: mono, fontSize: 10, color: "var(--muted)", marginTop: 4 }}>
                    JPG, PNG, WebP, or PDF · Max 10MB
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
                  />
                </div>

                {/* Scan button */}
                <button
                  onClick={handleTextScan}
                  disabled={textInput.length < 20}
                  className="btn-primary w-full flex items-center justify-center gap-2.5 py-4"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                  Analyze & Generate Dispute
                </button>
              </div>
            </div>

            {/* How it works (if no scans) */}
            {localStats.total_scans === 0 && (
              <div className="mt-8 space-y-4">
                {/* Welcome banner */}
                <div className="p-6" style={{ background: "var(--red-dim)", border: "1px solid rgba(232,25,44,0.2)" }}>
                  <div className="flex items-start gap-4">
                    <span style={{ fontSize: 32 }}>👻</span>
                    <div>
                      <h3 style={{ fontFamily: display, fontSize: 24, lineHeight: 1, marginBottom: 8 }}>
                        Welcome to Ghost<span style={{ color: "var(--red)" }}>Law</span>
                      </h3>
                      <p style={{ fontFamily: sans, fontSize: 13, color: "var(--muted2)", lineHeight: 1.7, marginBottom: 10 }}>
                        {country === "NG"
                          ? "GhostLaw fights for you. Paste your bank alert, electricity bill, loan app message, or any document — and the AI will find every violation of Nigerian consumer protection law and generate weapons to fight back."
                          : "GhostLaw fights for you. Paste your medical bill, lease, phone contract, or any document — and the AI will find every violation of consumer protection law and generate weapons to fight back."
                        }
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5" style={{ fontFamily: mono, fontSize: 10, color: "#41e866" }}>
                          <span className="w-1.5 h-1.5 bg-[#41e866] rounded-full" /> 100% Free
                        </span>
                        <span style={{ fontFamily: mono, fontSize: 10, color: "var(--muted)" }}>·</span>
                        <span style={{ fontFamily: mono, fontSize: 10, color: "var(--muted2)" }}>
                          {country === "NG" ? "🇳🇬 Nigeria mode active — citing FCCPA, CBN, NCC, NERC, NDPA" : "🇺🇸 USA mode active — citing FDCPA, FCRA, FCBA, No Surprises Act"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick steps */}
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1.5rem" }}>
                  <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--red)", marginBottom: 16 }}>
                    How it works
                  </div>
                  <div className="space-y-4">
                    {(country === "NG" ? [
                      { n: "01", t: "Pick a template or paste your document", d: "Bank alerts, NEPA bills, loan app messages, DSTV issues, landlord notices — anything you need to fight." },
                      { n: "02", t: "AI scans against Nigerian law", d: "We check for violations of FCCPA, CBN Framework, NCC Code, NERC Standards, NDPA 2023, and more." },
                      { n: "03", t: "Get your weapons", d: "Dispute letter, call script, and regulatory complaint to FCCPC, CBN, NCC, or NERC — ready to send." },
                      { n: "04", t: "Send via Email or WhatsApp", d: "Share via WhatsApp, download as PDF, or send by email. Track outcomes in your History." },
                    ] : [
                      { n: "01", t: "Paste or upload any document", d: "Medical bills, leases, phone contracts, insurance claims — anything you think might be screwing you over." },
                      { n: "02", t: "AI finds the problems", d: "We check for overcharges, hidden fees, illegal clauses, and violations of your consumer rights." },
                      { n: "03", t: "Get your weapons", d: "Dispute letter, call script, and regulatory complaint to CFPB, FCC, FTC — all ready to send." },
                      { n: "04", t: "Track your wins", d: "Mark outcomes and see how much you've saved over time." },
                    ]).map((s) => (
                    <div key={s.n} className="flex items-start gap-4">
                      <span style={{ fontFamily: display, fontSize: 28, lineHeight: 1, color: "rgba(255,255,255,0.05)", minWidth: 32 }}>{s.n}</span>
                      <div>
                        <p style={{ fontFamily: mono, fontSize: 13, fontWeight: 600 }}>{s.t}</p>
                        <p style={{ fontFamily: sans, fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>{s.d}</p>
                      </div>
                    </div>
                  ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ RESULTS TAB ═════════════════════════════════ */}
        {activeTab === "results" && scanResult && (
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--red)", marginBottom: 6 }}>
                  <span className="inline-block w-4 h-[1px] bg-[var(--red)] mr-2 align-middle" />
                  Analysis Complete
                </div>
                <h1 style={{ fontFamily: display, fontSize: "clamp(36px, 5vw, 56px)", lineHeight: 1 }}>
                  FINDINGS
                </h1>
                <p style={{ fontFamily: mono, fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
                  {(scanResult.document_type as string)?.replace(/_/g, " ")} · {(scanResult.issues_found as Array<ApiResult>)?.length || 0} issues detected
                </p>
              </div>
              {scanResult.risk_level && (
                <span className={`badge ${
                  scanResult.risk_level === "critical" ? "badge-critical"
                  : scanResult.risk_level === "high" ? "badge-warn"
                  : scanResult.risk_level === "medium" ? "badge-info"
                  : "badge-success"
                }`}>
                  {scanResult.risk_level as string} risk
                </span>
              )}
            </div>

            {/* Summary */}
            {scanResult.summary && (
              <div className="card-surface p-5">
                <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>Summary</div>
                <p style={{ fontFamily: sans, fontSize: 13, color: "var(--muted2)", lineHeight: 1.7 }}>{scanResult.summary as string}</p>
              </div>
            )}

            {/* Plain English */}
            {scanResult.plain_english && (
              <div className="card-surface p-5">
                <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>In plain english</div>
                <p style={{ fontFamily: sans, fontSize: 13, color: "var(--muted2)", lineHeight: 1.7 }}>{scanResult.plain_english as string}</p>
              </div>
            )}

            {/* Issues */}
            {(scanResult.issues_found as Array<ApiResult>)?.length > 0 && (
              <div>
                <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 12 }}>Issues Found</div>
                <div className="space-y-3">
                  {(scanResult.issues_found as Array<ApiResult>).map((issue, i: number) => (
                    <div
                      key={i}
                      className={`finding-card ${
                        issue.severity === "critical" ? "critical"
                        : issue.severity === "high" ? "warning"
                        : issue.severity === "medium" ? "info"
                        : "low"
                      }`}
                    >
                      <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: issue.severity === "critical" ? "var(--red)" : issue.severity === "high" ? "#e8c541" : issue.severity === "medium" ? "#4178e8" : "#41e866", marginBottom: 6 }}>
                        {issue.severity as string} · {issue.category as string || "Issue"}
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div style={{ fontFamily: mono, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{issue.issue as string}</div>
                          <div style={{ fontFamily: sans, fontSize: 12, color: "var(--muted2)", lineHeight: 1.6 }}>{issue.explanation as string}</div>
                        </div>
                        {(issue.potential_savings as number) > 0 && (
                          <div style={{ fontFamily: display, fontSize: 24, color: "var(--red)", whiteSpace: "nowrap" }}>
                            −${(issue.potential_savings as number).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total savings */}
            {(scanResult.total_potential_savings as number) > 0 && (
              <div className="card-surface p-5 flex items-center gap-4" style={{ background: "rgba(65,232,102,0.03)", borderColor: "rgba(65,232,102,0.15)" }}>
                <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)" }}>You could save</div>
                <div style={{ fontFamily: display, fontSize: 36, color: "#41e866" }}>
                  ${(scanResult.total_potential_savings as number).toLocaleString()}
                </div>
              </div>
            )}

            {/* Rights */}
            {(scanResult.your_rights as string[])?.length > 0 && (
              <div className="card-surface p-5">
                <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 10 }}>Your Rights</div>
                <ul className="space-y-2">
                  {(scanResult.your_rights as string[]).map((right: string, i: number) => (
                    <li key={i} className="flex items-start gap-2" style={{ fontFamily: sans, fontSize: 12, color: "var(--muted2)", lineHeight: 1.6 }}>
                      <span style={{ color: "#41e866" }}>✓</span>
                      {right}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            {(scanResult.recommended_actions as string[])?.length > 0 && (
              <div className="card-surface p-5">
                <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 10 }}>What To Do Next</div>
                <ol className="space-y-2">
                  {(scanResult.recommended_actions as string[]).map((action: string, i: number) => (
                    <li key={i} className="flex items-start gap-3" style={{ fontFamily: sans, fontSize: 12, color: "var(--muted2)", lineHeight: 1.6 }}>
                      <span style={{ fontFamily: display, fontSize: 18, color: "rgba(255,255,255,0.1)", minWidth: 20 }}>0{i + 1}</span>
                      {action}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Outcome tracking */}
            {scanResult.scan_id && (
              <div className="card-surface p-4">
                {(() => {
                  const existing = getOutcome(scanResult.scan_id as string);
                  if (existing) {
                    return (
                      <div className="flex items-center gap-3">
                        <span style={{ fontSize: 18 }}>🏆</span>
                        <div>
                          <p style={{ fontFamily: mono, fontSize: 12, fontWeight: 500 }}>
                            Outcome:{" "}
                            <span style={{ color: existing.status === "won" ? "#41e866" : existing.status === "partial" ? "#4178e8" : existing.status === "lost" ? "var(--red)" : "#e8c541" }}>
                              {existing.status === "won" ? "Won! 🎉" : existing.status === "partial" ? "Partial win" : existing.status === "lost" ? "Denied" : "Pending..."}
                            </span>
                          </p>
                          {existing.actual_savings ? <p style={{ fontFamily: mono, fontSize: 11, color: "#41e866" }}>Saved ${existing.actual_savings.toLocaleString()}</p> : null}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div>
                      <button
                        onClick={() => setOutcomeOpen(!outcomeOpen)}
                        className="flex items-center gap-2 transition-colors"
                        style={{ fontFamily: mono, fontSize: 12, color: "var(--muted)", cursor: "pointer" }}
                      >
                        🏆 Track the outcome of this dispute
                        <span style={{ transition: "transform 0.2s", transform: outcomeOpen ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
                      </button>
                      {outcomeOpen && (
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                          {[
                            { s: "won", l: "Won! 🎉", c: "rgba(65,232,102,0.1)", tc: "#41e866" },
                            { s: "partial", l: "Partial win", c: "rgba(65,120,232,0.1)", tc: "#4178e8" },
                            { s: "pending", l: "Still pending", c: "rgba(232,197,65,0.1)", tc: "#e8c541" },
                            { s: "lost", l: "Denied", c: "rgba(232,25,44,0.1)", tc: "var(--red)" },
                          ].map((o) => (
                            <button
                              key={o.s}
                              onClick={() => handleSaveOutcome(o.s, o.s === "won" ? scanResult.total_potential_savings as number : undefined)}
                              className="py-2 transition-colors"
                              style={{ fontFamily: mono, fontSize: 11, fontWeight: 500, background: o.c, color: o.tc, border: "1px solid transparent" }}
                            >
                              {o.l}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Action buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <button onClick={handleGenerateDispute} className="btn-primary flex items-center justify-center gap-2 py-3.5">
                ✉ Write Dispute Letter
              </button>
              <button
                onClick={() => setActiveTab("call")}
                className="py-3.5 flex items-center justify-center gap-2 transition-all"
                style={{ fontFamily: mono, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#4178e8", background: "rgba(65,120,232,0.08)", border: "1px solid rgba(65,120,232,0.2)" }}
              >
                ☎ Get Call Script
              </button>
              <button
                onClick={() => setActiveTab("complaint")}
                className="py-3.5 flex items-center justify-center gap-2 transition-all"
                style={{ fontFamily: mono, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#e8c541", background: "rgba(232,197,65,0.08)", border: "1px solid rgba(232,197,65,0.2)" }}
              >
                ⚖ File Complaint
              </button>
            </div>
          </div>
        )}

        {/* ═══ DISPUTE TAB ═════════════════════════════════ */}
        {activeTab === "dispute" && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div>
              <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--red)", marginBottom: 6 }}>
                <span className="inline-block w-4 h-[1px] bg-[var(--red)] mr-2 align-middle" />
                Weapon Ready
              </div>
              <h1 style={{ fontFamily: display, fontSize: "clamp(36px, 5vw, 56px)", lineHeight: 1 }}>
                DISPUTE<br /><span style={{ WebkitTextStroke: "1px rgba(255,255,255,0.2)", color: "transparent" }}>LETTER</span>
              </h1>
            </div>

            {!disputeResult ? (
              <div className="card-surface p-6">
                <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 12 }}>Pick a tone</div>
                <div className="space-y-2 mb-5">
                  {[
                    { id: "firm_but_polite", label: "Firm but polite", desc: "Professional. Cites specific laws and regulations." },
                    { id: "aggressive", label: "Aggressive", desc: "Demanding. References legal action if unresolved." },
                    { id: "friendly", label: "Friendly", desc: "Cooperative but clear about what's wrong." },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setDisputeTone(t.id)}
                      className="w-full text-left p-4 transition-all"
                      style={{
                        background: disputeTone === t.id ? "var(--red-dim)" : "var(--surface2)",
                        border: `1px solid ${disputeTone === t.id ? "rgba(232,25,44,0.3)" : "var(--border)"}`,
                      }}
                    >
                      <p style={{ fontFamily: mono, fontSize: 13, fontWeight: 600 }}>{t.label}</p>
                      <p style={{ fontFamily: sans, fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{t.desc}</p>
                    </button>
                  ))}
                </div>
                <button onClick={handleGenerateDispute} disabled={!scanResult} className="btn-primary w-full py-4 flex items-center justify-center gap-2">
                  ⚡ Generate Letter
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Letter chrome */}
                <div className="letter-preview">
                  <div className="flex items-center justify-between px-5 py-3" style={{ background: "var(--surface2)", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--red)" }}>
                      ⚡ Dispute Letter — {disputeResult.subject_line as string}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => copyToClipboard(disputeResult.letter_body as string)} className="btn-sm">
                        {copied ? "✓ Copied" : "Copy"}
                      </button>
                      <button
                        onClick={() => downloadText(
                          `Subject: ${disputeResult.subject_line}\nTo: ${disputeResult.send_to}\n\n${disputeResult.letter_body}`,
                          `GhostLaw_Dispute_${new Date().toISOString().slice(0, 10)}.txt`
                        )}
                        className="btn-sm"
                      >
                        ↓ TXT
                      </button>
                      <button
                        onClick={() => downloadPDF(
                          `Dispute Letter — ${disputeResult.subject_line}`,
                          `To: ${disputeResult.send_to}\n\n${disputeResult.letter_body}`,
                          `GhostLaw_Dispute_${new Date().toISOString().slice(0, 10)}.pdf`
                        )}
                        className="btn-sm"
                        style={{ color: "var(--red)", borderColor: "rgba(232,25,44,0.3)" }}
                      >
                        ↓ PDF
                      </button>
                      <button
                        onClick={() => sendViaEmail(
                          (disputeResult.send_to as string) || "",
                          `Formal Dispute: ${disputeResult.subject_line}`,
                          disputeResult.letter_body as string
                        )}
                        className="btn-sm"
                        style={{ color: "#4178e8", borderColor: "rgba(65,120,232,0.3)" }}
                      >
                        ✉ Email
                      </button>
                      <button
                        onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`*Dispute Letter — ${disputeResult.subject_line}*\n\n${disputeResult.letter_body}`)}`, "_blank")}
                        className="btn-sm"
                        style={{ color: "#25D366", borderColor: "rgba(37,211,102,0.3)" }}
                      >
                        📱 WhatsApp
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    {disputeResult.send_to && (
                      <p style={{ fontFamily: mono, fontSize: 11, color: "var(--muted)", marginBottom: 12 }}>Send to: {disputeResult.send_to as string}</p>
                    )}
                    <pre style={{ fontFamily: sans, fontSize: 13, color: "var(--muted2)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                      {disputeResult.letter_body as string}
                    </pre>
                    <span className="letter-cursor" />
                  </div>
                </div>

                {/* Post-dispute guidance */}
                <div className="card-surface p-5" style={{ background: "rgba(65,120,232,0.03)", borderColor: "rgba(65,120,232,0.15)" }}>
                  <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4178e8", marginBottom: 10 }}>After you send this</div>
                  <ol className="space-y-1.5" style={{ fontFamily: mono, fontSize: 11, color: "var(--muted2)" }}>
                    {country === "NG" ? (
                      <>
                        <li><span style={{ color: "#4178e8", fontWeight: 600 }}>1.</span> Send by email AND keep a screenshot of the delivery confirmation</li>
                        <li><span style={{ color: "#4178e8", fontWeight: 600 }}>2.</span> Banks must respond within 24-72 hours (CBN mandate)</li>
                        <li><span style={{ color: "#4178e8", fontWeight: 600 }}>3.</span> If no response, file with FCCPC or the relevant regulator (CBN, NCC, NERC)</li>
                        <li><span style={{ color: "#4178e8", fontWeight: 600 }}>4.</span> Come back and mark the outcome to track your wins</li>
                      </>
                    ) : (
                      <>
                        <li><span style={{ color: "#4178e8", fontWeight: 600 }}>1.</span> Send by email AND certified mail if the amount is over $500</li>
                        <li><span style={{ color: "#4178e8", fontWeight: 600 }}>2.</span> They have 30 days to respond (federal requirement)</li>
                        <li><span style={{ color: "#4178e8", fontWeight: 600 }}>3.</span> If no response, file a complaint with CFPB or your State AG</li>
                        <li><span style={{ color: "#4178e8", fontWeight: 600 }}>4.</span> Come back and mark the outcome to track your wins</li>
                      </>
                    )}
                  </ol>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setActiveTab("call")}
                    className="flex-1 py-3 flex items-center justify-center gap-2 transition-all"
                    style={{ fontFamily: mono, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#4178e8", background: "rgba(65,120,232,0.08)", border: "1px solid rgba(65,120,232,0.2)" }}
                  >
                    ☎ Get call script too
                  </button>
                  <button
                    onClick={handleGenerateComplaint}
                    className="flex-1 py-3 flex items-center justify-center gap-2 transition-all"
                    style={{ fontFamily: mono, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#e8c541", background: "rgba(232,197,65,0.08)", border: "1px solid rgba(232,197,65,0.2)" }}
                  >
                    ⚖ File complaint
                  </button>
                  <button
                    onClick={() => { setDisputeResult(null); setDisputeTone("firm_but_polite"); }}
                    className="py-3 px-4 transition-colors"
                    style={{ fontFamily: mono, fontSize: 12, color: "var(--muted)", border: "1px solid var(--border)" }}
                  >
                    ↺
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ CALL SCRIPT TAB ═════════════════════════════ */}
        {activeTab === "call" && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div>
              <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--red)", marginBottom: 6 }}>
                <span className="inline-block w-4 h-[1px] bg-[var(--red)] mr-2 align-middle" />
                Phone Weapon
              </div>
              <h1 style={{ fontFamily: display, fontSize: "clamp(36px, 5vw, 56px)", lineHeight: 1 }}>
                CALL<br /><span style={{ WebkitTextStroke: "1px rgba(255,255,255,0.2)", color: "transparent" }}>SCRIPT</span>
              </h1>
            </div>

            {!callResult ? (
              <div className="card-surface p-6 space-y-4">
                <div>
                  <label style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: 6 }}>
                    Who are you calling?
                  </label>
                  <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="input-ghost" style={{ padding: "0.75rem 1rem" }} placeholder={country === "NG" ? "e.g., GTBank, MTN, Ikeja Electric, OKash" : "e.g., Metro General Hospital, Comcast, AT&T"} />
                </div>
                <div>
                  <label style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: 6 }}>
                    What do you want them to do?
                  </label>
                  <input type="text" value={callObjective} onChange={(e) => setCallObjective(e.target.value)} className="input-ghost" style={{ padding: "0.75rem 1rem" }} placeholder="e.g., Reduce my bill, waive the late fee" />
                </div>

                {/* Call tips */}
                <div className="p-4" style={{ background: "rgba(232,197,65,0.05)", border: "1px solid rgba(232,197,65,0.1)" }}>
                  <p style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#e8c541", marginBottom: 8 }}>📞 Call tips that actually work</p>
                  <ul style={{ fontFamily: mono, fontSize: 11, color: "var(--muted)", lineHeight: 1.8 }}>
                    <li>• Call early morning (Tue-Thu) — shorter hold times</li>
                    <li>• Ask for the &ldquo;retention&rdquo; department — they can cut deals</li>
                    <li>• Always get the rep&apos;s name and employee ID first</li>
                  </ul>
                </div>

                <button onClick={handleRequestCall} disabled={!companyName || !scanResult} className="btn-primary w-full py-4 flex items-center justify-center gap-2">
                  ⚡ Generate Call Script
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {callResult?.script && (() => {
                  const script = callResult.script as ApiResult;
                  const buildFullScript = () => [
                    `CALL SCRIPT — ${companyName}`,
                    script.opening_script ? `\nOPENING:\n"${script.opening_script}"` : "",
                    (script.key_points as string[])?.length ? `\nKEY POINTS:\n${(script.key_points as string[]).map((p: string) => `• ${p}`).join("\n")}` : "",
                    (script.negotiation_tactics as string[])?.length ? `\nNEGOTIATION:\n${(script.negotiation_tactics as string[]).map((t: string) => `• ${t}`).join("\n")}` : "",
                    (script.escalation_phrases as string[])?.length ? `\nIF THEY PUSH BACK:\n${(script.escalation_phrases as string[]).map((p: string) => `• ${p}`).join("\n")}` : "",
                    script.closing_script ? `\nCLOSING:\n"${script.closing_script}"` : "",
                    script.target_outcome ? `\nTARGET: ${script.target_outcome}` : "",
                  ].filter(Boolean).join("\n");

                  return (
                    <>
                      {script.opening_script && (
                        <div className="card-surface p-5">
                          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--red)", marginBottom: 10 }}>Start with this</div>
                          <p className="p-4" style={{ fontFamily: mono, fontSize: 13, color: "var(--white)", background: "var(--surface2)", border: "1px solid var(--border)", lineHeight: 1.7, fontStyle: "italic" }}>
                            &ldquo;{script.opening_script as string}&rdquo;
                          </p>
                        </div>
                      )}
                      {(script.key_points as string[])?.length > 0 && (
                        <div className="card-surface p-5">
                          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4178e8", marginBottom: 10 }}>Points to make</div>
                          <ul className="space-y-2">
                            {(script.key_points as string[]).map((p: string, i: number) => (
                              <li key={i} className="flex items-start gap-2" style={{ fontFamily: sans, fontSize: 12, color: "var(--muted2)", lineHeight: 1.6 }}>
                                <span style={{ color: "#4178e8" }}>→</span> {p}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {(script.negotiation_tactics as string[])?.length > 0 && (
                        <div className="card-surface p-5">
                          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#e8c541", marginBottom: 10 }}>Negotiation moves</div>
                          <ul className="space-y-2">
                            {(script.negotiation_tactics as string[]).map((t: string, i: number) => (
                              <li key={i} className="flex items-start gap-2" style={{ fontFamily: sans, fontSize: 12, color: "var(--muted2)", lineHeight: 1.6 }}>
                                <span style={{ color: "#e8c541" }}>→</span> {t}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {(script.escalation_phrases as string[])?.length > 0 && (
                        <div className="card-surface p-5">
                          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--red)", marginBottom: 10 }}>If they push back</div>
                          <ul className="space-y-2">
                            {(script.escalation_phrases as string[]).map((p: string, i: number) => (
                              <li key={i} className="flex items-start gap-2" style={{ fontFamily: sans, fontSize: 12, color: "var(--muted2)", lineHeight: 1.6 }}>
                                <span style={{ color: "var(--red)" }}>⚠</span> {p}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {script.closing_script && (
                        <div className="card-surface p-5">
                          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#41e866", marginBottom: 10 }}>End with this</div>
                          <p className="p-4" style={{ fontFamily: mono, fontSize: 13, color: "var(--white)", background: "var(--surface2)", border: "1px solid var(--border)", lineHeight: 1.7, fontStyle: "italic" }}>
                            &ldquo;{script.closing_script as string}&rdquo;
                          </p>
                        </div>
                      )}
                      {(script.target_outcome || script.estimated_call_duration) && (
                        <div className="grid grid-cols-2 gap-3">
                          {script.target_outcome && (
                            <div className="card-surface p-4">
                              <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 4 }}>Target outcome</div>
                              <p style={{ fontFamily: mono, fontSize: 13, color: "#41e866" }}>{script.target_outcome as string}</p>
                            </div>
                          )}
                          {script.estimated_call_duration && (
                            <div className="card-surface p-4">
                              <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 4 }}>Estimated time</div>
                              <p style={{ fontFamily: mono, fontSize: 13 }}>{script.estimated_call_duration as string}</p>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex gap-3 flex-wrap">
                        <button onClick={() => copyToClipboard(buildFullScript())} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                          {copied ? "✓ Copied" : "Copy Full Script"}
                        </button>
                        <button
                          onClick={() => downloadText(buildFullScript(), `GhostLaw_CallScript_${companyName.replace(/\s+/g, "_")}.txt`)}
                          className="py-3 px-5 transition-colors"
                          style={{ fontFamily: mono, fontSize: 12, color: "#4178e8", background: "rgba(65,120,232,0.08)", border: "1px solid rgba(65,120,232,0.2)" }}
                        >
                          ↓ TXT
                        </button>
                        <button
                          onClick={() => downloadPDF(
                            `Call Script — ${companyName}`,
                            buildFullScript(),
                            `GhostLaw_CallScript_${companyName.replace(/\s+/g, "_")}.pdf`
                          )}
                          className="py-3 px-5 transition-colors"
                          style={{ fontFamily: mono, fontSize: 12, color: "var(--red)", background: "rgba(232,25,44,0.08)", border: "1px solid rgba(232,25,44,0.2)" }}
                        >
                          ↓ PDF
                        </button>
                        <button
                          onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(buildFullScript())}`, "_blank")}
                          className="py-3 px-5 transition-colors"
                          style={{ fontFamily: mono, fontSize: 12, color: "#25D366", background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.2)" }}
                        >
                          📱 WhatsApp
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ═══ COMPLAINT TAB ═══════════════════════════════ */}
        {activeTab === "complaint" && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div>
              <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--red)", marginBottom: 6 }}>
                <span className="inline-block w-4 h-[1px] bg-[var(--red)] mr-2 align-middle" />
                Nuclear Option
              </div>
              <h1 style={{ fontFamily: display, fontSize: "clamp(36px, 5vw, 56px)", lineHeight: 1 }}>
                REGULATORY<br /><span style={{ WebkitTextStroke: "1px rgba(255,255,255,0.2)", color: "transparent" }}>COMPLAINT</span>
              </h1>
            </div>

            {!complaintResult ? (
              <div className="space-y-4">
                <div className="card-surface p-5">
                  <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 12 }}>Pick an agency {country === "NG" ? "🇳🇬" : "🇺🇸"}</div>
                  <div className="space-y-2">
                    {(country === "NG" ? [
                      { id: "fccpc", name: "FCCPC", full: "Federal Competition & Consumer Protection Commission", desc: "General consumer complaints — products, services, unfair practices", stat: "Primary consumer body" },
                      { id: "cbn", name: "CBN", full: "Central Bank of Nigeria", desc: "Bank charges, failed transfers, loan issues, unauthorized debits", stat: "24-72hr resolution mandate" },
                      { id: "ncc", name: "NCC", full: "Nigerian Communications Commission", desc: "MTN, Airtel, Glo, 9mobile — data, airtime, billing, service quality", stat: "Enforces Consumer Code" },
                      { id: "nerc", name: "NERC", full: "Nigerian Electricity Regulatory Commission", desc: "EKEDC, IKEDC, AEDC — estimated billing, metering, outages", stat: "Metering is your right" },
                      { id: "ndpc", name: "NDPC", full: "Nigeria Data Protection Commission", desc: "Data privacy violations, unauthorized contact access, spam", stat: "NDPA 2023 enforcement" },
                      { id: "efcc", name: "EFCC", full: "Economic & Financial Crimes Commission", desc: "Fraud, scams, financial crimes, online fraud", stat: "Criminal investigations" },
                    ] : [
                      { id: "cfpb", name: "CFPB", full: "Consumer Financial Protection Bureau", desc: "Medical bills, debt collection, banking fees, credit card disputes", stat: "97% response rate" },
                      { id: "fcc", name: "FCC", full: "Federal Communications Commission", desc: "Phone bills, internet, cable, wireless carrier issues", stat: "Companies respond within days" },
                      { id: "state_ag", name: "State AG", full: "State Attorney General", desc: "Local businesses, price gouging, fraud, deceptive practices", stat: "Can investigate and sue" },
                      { id: "ftc", name: "FTC", full: "Federal Trade Commission", desc: "Scams, fraud, deceptive advertising, subscription traps", stat: "Builds cases from complaints" },
                    ]).map((a) => (
                      <button
                        key={a.id}
                        onClick={() => setComplaintAgency(a.id)}
                        className="w-full text-left p-4 transition-all"
                        style={{
                          background: complaintAgency === a.id ? "rgba(232,197,65,0.05)" : "var(--surface2)",
                          border: `1px solid ${complaintAgency === a.id ? "rgba(232,197,65,0.2)" : "var(--border)"}`,
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 700, color: "#e8c541" }}>{a.name}</span>
                          <span style={{ fontFamily: mono, fontSize: 10, color: "var(--muted)" }}>— {a.full}</span>
                        </div>
                        <p style={{ fontFamily: sans, fontSize: 12, color: "var(--muted2)" }}>{a.desc}</p>
                        <p style={{ fontFamily: mono, fontSize: 10, color: "#41e866", marginTop: 4, opacity: 0.7 }}>{a.stat}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {!companyName && (
                  <div className="card-surface p-4">
                    <label style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: 6 }}>
                      Company you&apos;re complaining about
                    </label>
                    <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="input-ghost" style={{ padding: "0.75rem 1rem" }} placeholder="e.g., Metro General Hospital" />
                  </div>
                )}

                <button onClick={handleGenerateComplaint} disabled={!scanResult} className="btn-primary w-full py-4 flex items-center justify-center gap-2">
                  ⚡ Generate Complaint
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Agency info */}
                <div className="card-surface p-4 flex items-center justify-between flex-wrap gap-3" style={{ background: "rgba(232,197,65,0.03)", borderColor: "rgba(232,197,65,0.15)" }}>
                  <div>
                    <p style={{ fontFamily: mono, fontSize: 13, fontWeight: 600 }}>{(complaintResult.agency_full_name as string) || complaintAgency.toUpperCase()}</p>
                    <p style={{ fontFamily: mono, fontSize: 11, color: "var(--muted)", marginTop: 2 }}>Ready to file</p>
                  </div>
                  {complaintResult.filing_url && (
                    <a
                      href={complaintResult.filing_url as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-sm"
                      style={{ color: "#e8c541", borderColor: "rgba(232,197,65,0.3)", background: "rgba(232,197,65,0.1)" }}
                    >
                      ↗ Go to filing page
                    </a>
                  )}
                </div>

                {/* Complaint text */}
                {complaintResult.complaint_text && (
                  <div className="letter-preview">
                    <div className="flex items-center justify-between px-5 py-3" style={{ background: "var(--surface2)", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#e8c541" }}>
                        ⚖ Complaint Text
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => copyToClipboard(complaintResult.complaint_text as string)} className="btn-sm">{copied ? "✓ Copied" : "Copy"}</button>
                        <button onClick={() => downloadText(complaintResult.complaint_text as string, `GhostLaw_Complaint_${complaintAgency.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.txt`)} className="btn-sm">↓ TXT</button>
                        <button
                          onClick={() => downloadPDF(
                            `${complaintAgency.toUpperCase()} Complaint`,
                            complaintResult.complaint_text as string,
                            `GhostLaw_Complaint_${complaintAgency.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.pdf`
                          )}
                          className="btn-sm"
                          style={{ color: "var(--red)", borderColor: "rgba(232,25,44,0.3)" }}
                        >
                          ↓ PDF
                        </button>
                        <button
                          onClick={() => sendViaEmail(
                            "",
                            `${(complaintResult.agency_full_name as string) || complaintAgency.toUpperCase()} Complaint`,
                            complaintResult.complaint_text as string
                          )}
                          className="btn-sm"
                          style={{ color: "#4178e8", borderColor: "rgba(65,120,232,0.3)" }}
                        >
                          ✉ Email
                        </button>
                        <button
                          onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`*${(complaintResult.agency_full_name as string) || complaintAgency.toUpperCase()} Complaint*\n\n${complaintResult.complaint_text}`)}`, "_blank")}
                          className="btn-sm"
                          style={{ color: "#25D366", borderColor: "rgba(37,211,102,0.3)" }}
                        >
                          📱 WhatsApp
                        </button>
                      </div>
                    </div>
                    <pre className="p-6 max-h-96 overflow-auto" style={{ fontFamily: sans, fontSize: 13, color: "var(--muted2)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                      {complaintResult.complaint_text as string}
                    </pre>
                  </div>
                )}

                {/* Filing steps */}
                {(complaintResult.filing_steps as string[])?.length > 0 && (
                  <div className="card-surface p-5">
                    <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#e8c541", marginBottom: 10 }}>How to file — step by step</div>
                    <ol className="space-y-2">
                      {(complaintResult.filing_steps as string[]).map((step: string, i: number) => (
                        <li key={i} className="flex items-start gap-3" style={{ fontFamily: sans, fontSize: 12, color: "var(--muted2)", lineHeight: 1.6 }}>
                          <span style={{ fontFamily: display, fontSize: 18, color: "rgba(232,197,65,0.3)", minWidth: 20 }}>0{i + 1}</span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Pro tips */}
                {(complaintResult.pro_tips as string[])?.length > 0 && (
                  <div className="card-surface p-5" style={{ background: "rgba(65,232,102,0.03)", borderColor: "rgba(65,232,102,0.15)" }}>
                    <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#41e866", marginBottom: 10 }}>Pro tips</div>
                    <ul className="space-y-1.5">
                      {(complaintResult.pro_tips as string[]).map((tip: string, i: number) => (
                        <li key={i} className="flex items-start gap-2" style={{ fontFamily: mono, fontSize: 11, color: "var(--muted2)", lineHeight: 1.6 }}>
                          <span style={{ color: "#41e866" }}>✓</span> {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  onClick={() => setComplaintResult(null)}
                  className="w-full py-3 text-center transition-colors"
                  style={{ fontFamily: mono, fontSize: 12, color: "var(--muted)", border: "1px solid var(--border)" }}
                >
                  ↺ Try a different agency
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══ HISTORY TAB ═════════════════════════════════ */}
        {activeTab === "history" && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div>
              <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--red)", marginBottom: 6 }}>
                <span className="inline-block w-4 h-[1px] bg-[var(--red)] mr-2 align-middle" />
                Case Files
              </div>
              <h1 style={{ fontFamily: display, fontSize: "clamp(36px, 5vw, 56px)", lineHeight: 1 }}>
                YOUR WINS<br /><span style={{ WebkitTextStroke: "1px rgba(255,255,255,0.2)", color: "transparent" }}>ON RECORD</span>
              </h1>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Scanned", value: localStats.total_scans, color: "var(--red)" },
                { label: "Disputes", value: localStats.total_disputes, color: "#4178e8" },
                { label: "Call Scripts", value: localStats.total_calls, color: "#e8c541" },
                { label: localStats.confirmed_savings > 0 ? "Confirmed Saved" : "Potential Savings", value: `${currencySymbol}${(localStats.confirmed_savings || localStats.estimated_savings).toLocaleString()}`, color: "#41e866" },
              ].map((s, i) => (
                <div key={i} className="card-surface p-4">
                  <div style={{ fontFamily: display, fontSize: 28, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Scan history table */}
            {localHistory.scans.length > 0 ? (
              <div style={{ border: "1px solid var(--border)" }}>
                {/* Header */}
                <div className="hidden md:grid grid-cols-[2fr_1fr_1fr] bg-[var(--surface2)] border-b border-[var(--border)]">
                  {["Case", "Amount", "Status"].map((h) => (
                    <div key={h} className="px-5 py-3 border-r border-[var(--border)] last:border-r-0" style={{ fontFamily: mono, fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)" }}>
                      {h}
                    </div>
                  ))}
                </div>
                {localHistory.scans.map((scan, i) => {
                  const outcome = getOutcome(scan.scan_id);
                  return (
                    <button
                      key={scan.scan_id || i}
                      onClick={() => loadHistoryScan(scan)}
                      className="w-full grid grid-cols-[2fr_1fr_1fr] border-b border-[var(--border)] hover:bg-[var(--surface)] transition-colors text-left"
                      style={{ animation: `row-in 0.5s ease ${i * 0.05}s both` }}
                    >
                      <div className="px-5 py-3.5 border-r border-[var(--border)]">
                        <p style={{ fontFamily: mono, fontSize: 12, fontWeight: 500 }}>
                          {(scan.document_type as string)?.replace(/_/g, " ") || "Document"} scan
                        </p>
                        <p style={{ fontFamily: mono, fontSize: 10, color: "var(--muted)", marginTop: 2 }} className="truncate">
                          {scan.summary as string}
                        </p>
                      </div>
                      <div className="px-5 py-3.5 border-r border-[var(--border)] flex items-center" style={{ fontFamily: display, fontSize: 16, color: "var(--red)" }}>
                        {(scan.total_potential_savings as number) > 0 ? `${currencySymbol}${(scan.total_potential_savings as number).toLocaleString()}` : "—"}
                      </div>
                      <div className="px-5 py-3.5 flex items-center">
                        {outcome ? (
                          <span className={`pill ${outcome.status === "won" ? "pill-won" : outcome.status === "partial" ? "pill-partial" : outcome.status === "pending" ? "pill-pending" : "pill-denied"}`}>
                            {outcome.status === "won" ? "Won ✓" : outcome.status}
                          </span>
                        ) : (
                          <span style={{ fontFamily: mono, fontSize: 10, color: "var(--muted)" }}>—</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 40, opacity: 0.15, marginBottom: 16 }}>👻</div>
                <p style={{ fontFamily: mono, fontSize: 13, color: "var(--muted2)", marginBottom: 4 }}>Nothing here yet</p>
                <p style={{ fontFamily: mono, fontSize: 11, color: "var(--muted)", marginBottom: 16 }}>Scan a bill to get started</p>
                <button onClick={() => setActiveTab("scan")} className="btn-primary py-3 px-8">
                  Start Scanning
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
