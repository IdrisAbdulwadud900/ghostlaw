"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Ghost, Scan, FileText, Phone, LayoutDashboard,
  Upload, Camera, Copy, CheckCircle,
  AlertTriangle, AlertCircle, Info, Loader2,
  LogOut, ChevronRight, DollarSign, History,
  MessageSquare, ClipboardList, ArrowRight,
  Menu, X, Sparkles, RotateCcw, Download,
  Shield, ExternalLink, ChevronDown, Trophy,
  Clock, Zap, BookOpen
} from "lucide-react";
import {
  clearToken, getUser,
  scanDocument, scanText, generateDispute, requestCall,
  generateComplaint,
  addScanToHistory, addDisputeToHistory, addCallToHistory,
  getLocalHistory, getLocalStats, saveOutcome, getOutcome,
} from "@/lib/api";

// ── Types ────────────────────────────────────────────────────
type Tab = "scan" | "results" | "dispute" | "call" | "complaint" | "history";

interface QuickTemplate {
  label: string;
  icon: React.ReactNode;
  prompt: string;
  context: string;
}

// ── Quick-start templates ────────────────────────────────────
const TEMPLATES: QuickTemplate[] = [
  {
    label: "Medical bill",
    icon: <span className="text-lg">🏥</span>,
    prompt: `Paste your medical bill text here. Include:\n- Provider name\n- Date of service\n- Each line item and charge\n- Total amount due\n- Insurance applied (if any)`,
    context: "Medical bill — look for upcoding, surprise billing, and charges above Medicare rates",
  },
  {
    label: "Cable / internet",
    icon: <span className="text-lg">📡</span>,
    prompt: `Paste your cable or internet bill here. Include:\n- Provider (Comcast, AT&T, etc.)\n- Monthly charges\n- Any fees (broadcast, regional sports, etc.)\n- Promotional rate vs current rate`,
    context: "Cable/internet bill — look for hidden fees, rate hikes after promo, and services charged but not used",
  },
  {
    label: "Lease / rental",
    icon: <span className="text-lg">🏠</span>,
    prompt: `Paste your lease or rental agreement text. Include:\n- Key terms (rent, deposits, penalties)\n- Any clauses that seem unfair\n- Late fee policies\n- Maintenance responsibilities`,
    context: "Lease agreement — look for illegal clauses, excessive fees, habitability issues, and tenant rights violations",
  },
  {
    label: "Insurance claim",
    icon: <span className="text-lg">🛡️</span>,
    prompt: `Paste your insurance document. This could be:\n- A claim denial letter\n- A policy excerpt\n- An EOB (Explanation of Benefits)\n- A premium increase notice`,
    context: "Insurance document — look for wrongful denial, bad faith practices, and coverage the insurer is trying to avoid",
  },
  {
    label: "Phone bill",
    icon: <span className="text-lg">📱</span>,
    prompt: `Paste your phone/wireless bill. Include:\n- Carrier name\n- Plan details and monthly charge\n- All additional fees and surcharges\n- Any international or overage charges`,
    context: "Phone/wireless bill — look for cramming, unauthorized charges, misleading plan costs, and FCC violations",
  },
  {
    label: "Subscription",
    icon: <span className="text-lg">🔄</span>,
    prompt: `Paste the subscription terms, billing email, or receipt. Include:\n- Service name\n- What you're being charged\n- Cancellation terms\n- Any auto-renewal language`,
    context: "Subscription — look for dark patterns, hidden auto-renewal, difficult cancellation, and FTC violations",
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type ApiResult = Record<string, any>;

  // Scan state
  const [scanResult, setScanResult] = useState<ApiResult | null>(null);
  const [scanContext, setScanContext] = useState("");
  const [textInput, setTextInput] = useState("");
  const [scanMode, setScanMode] = useState<"upload" | "text">("text");
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

  // Refresh local data
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
      const msg = err instanceof Error ? err.message : "Scan failed";
      alert(msg);
    } finally {
      setLoading(false);
    }
  }, [scanContext, refreshLocal]);

  const handleTextScan = useCallback(async () => {
    if (textInput.length < 20) {
      alert("Paste more text — we need at least a few lines to analyze.");
      return;
    }
    setLoading(true);
    setLoadingMsg("Analyzing your document...");
    try {
      const result = await scanText(textInput, scanContext);
      setScanResult(result);
      addScanToHistory(result);
      refreshLocal();
      setActiveTab("results");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Scan failed";
      alert(msg);
    } finally {
      setLoading(false);
    }
  }, [textInput, scanContext, refreshLocal]);

  const handleGenerateDispute = useCallback(async () => {
    if (!scanResult?.scan_id) return;
    setLoading(true);
    setLoadingMsg("Writing your dispute letter...");
    try {
      const result = await generateDispute(scanResult.scan_id as string, [], disputeTone);
      setDisputeResult(result);
      addDisputeToHistory(result);
      refreshLocal();
      setActiveTab("dispute");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate dispute";
      alert(msg);
    } finally {
      setLoading(false);
    }
  }, [scanResult, disputeTone, refreshLocal]);

  const handleRequestCall = useCallback(async () => {
    if (!scanResult?.scan_id || !companyName) return;
    setLoading(true);
    setLoadingMsg("Building your call script...");
    try {
      const result = await requestCall(
        scanResult.scan_id as string,
        companyName,
        callObjective || "Dispute overcharges and negotiate a reduction",
        (disputeResult?.dispute_id as string) || ""
      );
      setCallResult(result);
      addCallToHistory(result);
      refreshLocal();
      setActiveTab("call");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate call script";
      alert(msg);
    } finally {
      setLoading(false);
    }
  }, [scanResult, companyName, callObjective, disputeResult, refreshLocal]);

  const handleGenerateComplaint = useCallback(async () => {
    if (!scanResult?.scan_id) return;
    setLoading(true);
    setLoadingMsg("Drafting your regulatory complaint...");
    try {
      const result = await generateComplaint(
        scanResult.scan_id as string,
        complaintAgency,
        (disputeResult?.dispute_id as string) || "",
        companyName,
      );
      setComplaintResult(result);
      setActiveTab("complaint");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate complaint";
      alert(msg);
    } finally {
      setLoading(false);
    }
  }, [scanResult, complaintAgency, disputeResult, companyName]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadText = (text: string, filename: string) => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLogout = () => { clearToken(); onLogout(); };

  const navigate = (tab: Tab) => {
    if (tab === "history") refreshLocal();
    setActiveTab(tab);
    setMobileNav(false);
  };

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
    setScanMode("text");
  };

  const severityIcon = (s: string) => {
    switch (s) {
      case "critical": return <AlertCircle className="w-4 h-4 text-red-400" />;
      case "high": return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      case "medium": return <Info className="w-4 h-4 text-blue-400" />;
      default: return <CheckCircle className="w-4 h-4 text-green-400" />;
    }
  };

  const navItems = [
    { id: "scan" as Tab, icon: <Scan className="w-[18px] h-[18px]" />, label: "Scan" },
    { id: "results" as Tab, icon: <ClipboardList className="w-[18px] h-[18px]" />, label: "Results", disabled: !scanResult },
    { id: "dispute" as Tab, icon: <FileText className="w-[18px] h-[18px]" />, label: "Dispute", disabled: !scanResult },
    { id: "call" as Tab, icon: <Phone className="w-[18px] h-[18px]" />, label: "Call Script", disabled: !scanResult },
    { id: "complaint" as Tab, icon: <Shield className="w-[18px] h-[18px]" />, label: "File Complaint", disabled: !scanResult },
    { id: "history" as Tab, icon: <History className="w-[18px] h-[18px]" />, label: "History" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* ── Sidebar (desktop) ─────────────── */}
      <aside className="hidden md:flex w-56 bg-[#0a0a14] border-r border-white/5 flex-col">
        <div className="px-4 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Ghost className="w-6 h-6 text-purple-400" />
            <span className="text-base font-bold tracking-tight">Ghost<span className="text-purple-400">Law</span></span>
          </div>
        </div>

        <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              disabled={item.disabled}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all
                ${activeTab === item.id
                  ? "bg-purple-500/10 text-purple-300 tab-active"
                  : "text-gray-500 hover:bg-white/3 hover:text-gray-300"}
                ${item.disabled ? "opacity-20 cursor-not-allowed" : ""}
              `}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Quick stats */}
        {localStats.total_scans > 0 && (
          <div className="px-3 pb-2 border-t border-white/5 pt-2">
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-[10px] text-gray-600 uppercase tracking-wider">Your stats</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 px-1">
              <div className="text-center p-1.5 rounded-lg bg-purple-500/5">
                <p className="text-sm font-bold text-purple-300">{localStats.total_scans}</p>
                <p className="text-[9px] text-gray-600">scans</p>
              </div>
              <div className="text-center p-1.5 rounded-lg bg-green-500/5">
                <p className="text-sm font-bold text-green-300">${localStats.confirmed_savings || localStats.estimated_savings}</p>
                <p className="text-[9px] text-gray-600">{localStats.confirmed_savings > 0 ? "saved" : "potential"}</p>
              </div>
            </div>
          </div>
        )}

        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-2.5 px-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-purple-500/15 flex items-center justify-center text-purple-400 text-xs font-bold">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user?.name || "User"}</p>
              <p className="text-[10px] text-gray-600 truncate">{user?.email || ""}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-red-500/8 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile header ─────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 backdrop-blur-xl bg-[#080810]/80 border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Ghost className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-bold">Ghost<span className="text-purple-400">Law</span></span>
          </div>
          <button onClick={() => setMobileNav(!mobileNav)} className="p-1.5 rounded-lg hover:bg-white/5">
            {mobileNav ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {mobileNav && (
          <div className="px-3 pb-3 space-y-0.5 border-b border-white/5 bg-[#0a0a14]">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                disabled={item.disabled}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm
                  ${activeTab === item.id ? "bg-purple-500/10 text-purple-300" : "text-gray-500"}
                  ${item.disabled ? "opacity-20" : ""}
                `}
              >
                {item.icon}{item.label}
              </button>
            ))}
            <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:text-red-400">
              <LogOut className="w-[18px] h-[18px]" />Sign out
            </button>
          </div>
        )}
      </div>

      {/* ── Main Content ──────────────────── */}
      <main className="flex-1 overflow-auto md:p-8 p-4 pt-16 md:pt-8">
        {/* Loading overlay */}
        {loading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="glass-card p-6 text-center max-w-xs">
              <div className="relative mx-auto w-10 h-10 mb-3">
                <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
              </div>
              <p className="text-sm font-medium">{loadingMsg}</p>
              <p className="text-gray-600 text-xs mt-1">Usually takes 5-15 seconds</p>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            SCAN TAB
        ═══════════════════════════════════════════════════════════ */}
        {activeTab === "scan" && (
          <div className="max-w-2xl mx-auto fade-in">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-1">What do you want to scan?</h1>
              <p className="text-gray-500 text-sm">Paste the text from any bill, contract, or document. We&apos;ll find everything that&apos;s wrong with it.</p>
            </div>

            {/* Quick-start templates */}
            <div className="mb-5">
              <p className="text-[11px] text-gray-600 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Zap className="w-3 h-3" />Quick start — pick your document type
              </p>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.label}
                    onClick={() => applyTemplate(t)}
                    className="glass-card p-3 text-center hover:border-purple-500/20 transition-all group"
                  >
                    <div className="mb-1">{t.icon}</div>
                    <p className="text-[11px] text-gray-500 group-hover:text-gray-300 transition-colors leading-tight">{t.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-1.5 p-1 bg-[#0a0a14] rounded-xl mb-5 w-fit">
              <button
                onClick={() => setScanMode("text")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${scanMode === "text" ? "bg-purple-500/15 text-purple-300" : "text-gray-500 hover:text-gray-300"}`}
              >
                <MessageSquare className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />Paste text
              </button>
              <button
                onClick={() => setScanMode("upload")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${scanMode === "upload" ? "bg-purple-500/15 text-purple-300" : "text-gray-500 hover:text-gray-300"}`}
              >
                <Camera className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />Upload photo
              </button>
            </div>

            {scanMode === "text" ? (
              <div className="space-y-4">
                <div>
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={`Paste your bill or document here...\n\nExample: "Patient: John Doe. Emergency Room Visit 3/15/2026. Facility Fee: $2,100. CT Scan: $1,800. Aspirin (2 tablets): $50. Room Charge: $900. Insurance Applied: $0. Total Due: $4,850. Payment due within 30 days."`}
                    className="w-full h-56 px-4 py-3 input-base text-sm resize-none leading-relaxed"
                  />
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[11px] text-gray-700">
                      {textInput.length > 0 ? `${textInput.length} characters` : "Tip: the more detail you paste, the better the analysis"}
                    </span>
                    {textInput.length > 0 && (
                      <button onClick={() => { setTextInput(""); setScanContext(""); }} className="text-[11px] text-gray-600 hover:text-gray-400">
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1.5">Anything we should know? (optional)</label>
                  <input
                    type="text"
                    value={scanContext}
                    onChange={(e) => setScanContext(e.target.value)}
                    placeholder="e.g., 'I only stayed 2 hours' or 'I already paid $500'"
                    className="w-full px-4 py-2.5 input-base text-sm"
                  />
                </div>

                <button
                  onClick={handleTextScan}
                  disabled={textInput.length < 20}
                  className="w-full py-3 btn-primary rounded-xl text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Analyze this document
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file) handleFileUpload(file);
                  }}
                  className="glass-card p-10 text-center cursor-pointer hover:border-purple-500/20 transition-all"
                >
                  <Upload className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="font-medium text-sm mb-1">Drop a photo or click to upload</p>
                  <p className="text-gray-600 text-xs">JPG, PNG, WebP, or PDF • Max 10MB</p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1.5">Anything we should know? (optional)</label>
                  <input
                    type="text"
                    value={scanContext}
                    onChange={(e) => setScanContext(e.target.value)}
                    placeholder="e.g., 'This is my dentist bill from last month'"
                    className="w-full px-4 py-2.5 input-base text-sm"
                  />
                </div>
              </div>
            )}

            {/* How it works mini-guide (only if no scans yet) */}
            {localStats.total_scans === 0 && (
              <div className="mt-8 glass-card p-5">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />How it works
                </h3>
                <div className="space-y-3">
                  {[
                    { step: "1", title: "Paste or upload", desc: "Any bill, contract, lease, or document you think might be screwing you over." },
                    { step: "2", title: "AI finds the problems", desc: "We check for overcharges, hidden fees, illegal clauses, and violations of your rights." },
                    { step: "3", title: "Get your weapons", desc: "Dispute letter, call script, and regulatory complaint — all ready to send." },
                    { step: "4", title: "Track your wins", desc: "Mark outcomes and see how much you've saved over time." },
                  ].map((s) => (
                    <div key={s.step} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-purple-500/15 text-purple-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{s.step}</span>
                      <div>
                        <p className="text-sm font-medium">{s.title}</p>
                        <p className="text-gray-600 text-xs">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            RESULTS TAB
        ═══════════════════════════════════════════════════════════ */}
        {activeTab === "results" && scanResult && (
          <div className="max-w-3xl mx-auto fade-in">
            {/* Header */}
            <div className="flex items-start justify-between mb-6 gap-4">
              <div>
                <h1 className="text-2xl font-bold mb-1">Here&apos;s what we found</h1>
                <p className="text-gray-500 text-sm">
                  {(scanResult.document_type as string)?.replace(/_/g, " ")} analysis • {(scanResult.issues_found as Array<Record<string, unknown>>)?.length || 0} issues
                </p>
              </div>
              {scanResult.risk_level && (
                <span className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap
                  ${scanResult.risk_level === "critical" ? "severity-critical"
                  : scanResult.risk_level === "high" ? "severity-high"
                  : scanResult.risk_level === "medium" ? "severity-medium"
                  : "severity-low"}`}
                >
                  {scanResult.risk_level as string} risk
                </span>
              )}
            </div>

            {/* Summary */}
            {scanResult.summary && (
              <div className="glass-card p-5 mb-4">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Summary</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{scanResult.summary as string}</p>
              </div>
            )}

            {/* Plain English */}
            {scanResult.plain_english && (
              <div className="glass-card p-5 mb-4">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">In plain english</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{scanResult.plain_english as string}</p>
              </div>
            )}

            {/* Issues Found */}
            {(scanResult.issues_found as Array<Record<string, unknown>>)?.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Issues found</h3>
                <div className="space-y-2">
                  {(scanResult.issues_found as Array<Record<string, unknown>>).map((issue, i: number) => (
                    <div
                      key={i}
                      className={`glass-card p-4 border-l-[3px] ${
                        issue.severity === "critical" ? "border-l-red-500"
                        : issue.severity === "high" ? "border-l-orange-500"
                        : issue.severity === "medium" ? "border-l-blue-500"
                        : "border-l-green-500"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 min-w-0">
                          {severityIcon(issue.severity as string)}
                          <div className="min-w-0">
                            <p className="font-medium text-sm">{issue.issue as string}</p>
                            <p className="text-gray-500 text-xs mt-1 leading-relaxed">{issue.explanation as string}</p>
                          </div>
                        </div>
                        {(issue.potential_savings as number) > 0 && (
                          <span className="text-green-400 font-bold text-sm whitespace-nowrap">
                            +${(issue.potential_savings as number).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total Savings */}
            {(scanResult.total_potential_savings as number) > 0 && (
              <div className="glass-card p-5 mb-4 bg-green-500/3 border-green-500/15">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">You could save</p>
                    <p className="text-2xl font-bold gradient-text-green">${(scanResult.total_potential_savings as number).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Your Rights */}
            {(scanResult.your_rights as string[])?.length > 0 && (
              <div className="glass-card p-5 mb-4">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Your rights</h3>
                <ul className="space-y-2">
                  {(scanResult.your_rights as string[]).map((right: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <CheckCircle className="w-3.5 h-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="leading-relaxed">{right}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* What to do next */}
            {(scanResult.recommended_actions as string[])?.length > 0 && (
              <div className="glass-card p-5 mb-6">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">What to do next</h3>
                <ol className="space-y-2">
                  {(scanResult.recommended_actions as string[]).map((action: string, i: number) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                      <span className="w-5 h-5 rounded-full bg-purple-500/15 text-purple-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                      <span className="leading-relaxed">{action}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Outcome tracking */}
            {scanResult.scan_id && (
              <div className="glass-card p-4 mb-4">
                {(() => {
                  const existing = getOutcome(scanResult.scan_id as string);
                  if (existing) {
                    return (
                      <div className="flex items-center gap-3">
                        <Trophy className="w-5 h-5 text-yellow-400" />
                        <div>
                          <p className="text-sm font-medium">
                            Outcome: <span className={existing.status === "won" ? "text-green-400" : existing.status === "partial" ? "text-blue-400" : existing.status === "lost" ? "text-red-400" : "text-yellow-400"}>
                              {existing.status === "won" ? "Won! 🎉" : existing.status === "partial" ? "Partial win" : existing.status === "lost" ? "Denied" : "Pending..."}
                            </span>
                          </p>
                          {existing.actual_savings ? <p className="text-xs text-green-400">Saved ${existing.actual_savings.toLocaleString()}</p> : null}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div>
                      <button
                        onClick={() => setOutcomeOpen(!outcomeOpen)}
                        className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
                      >
                        <Trophy className="w-4 h-4" />
                        Track the outcome of this dispute
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${outcomeOpen ? "rotate-180" : ""}`} />
                      </button>
                      {outcomeOpen && (
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                          <button onClick={() => handleSaveOutcome("won", scanResult.total_potential_savings as number)} className="py-2 rounded-lg text-xs font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors">
                            Won! 🎉
                          </button>
                          <button onClick={() => handleSaveOutcome("partial")} className="py-2 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors">
                            Partial win
                          </button>
                          <button onClick={() => handleSaveOutcome("pending")} className="py-2 rounded-lg text-xs font-medium bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-colors">
                            Still pending
                          </button>
                          <button onClick={() => handleSaveOutcome("lost")} className="py-2 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                            Denied
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={handleGenerateDispute}
                className="py-3 btn-primary rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Write dispute letter
              </button>
              <button
                onClick={() => setActiveTab("call")}
                className="py-3 rounded-xl text-sm font-semibold border border-blue-500/20 text-blue-300 hover:bg-blue-500/8 transition-all flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                Get call script
              </button>
              <button
                onClick={() => setActiveTab("complaint")}
                className="py-3 rounded-xl text-sm font-semibold border border-orange-500/20 text-orange-300 hover:bg-orange-500/8 transition-all flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4" />
                File complaint
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            DISPUTE TAB
        ═══════════════════════════════════════════════════════════ */}
        {activeTab === "dispute" && (
          <div className="max-w-3xl mx-auto fade-in">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-1">Dispute letter</h1>
              <p className="text-gray-500 text-sm">Copy this, paste it into an email, and hit send. Or download it.</p>
            </div>

            {!disputeResult ? (
              <div className="glass-card p-6">
                <h3 className="text-sm font-medium mb-4">Pick a tone:</h3>
                <div className="space-y-2 mb-5">
                  {[
                    { id: "firm_but_polite", label: "Firm but polite", desc: "Professional. Cites specific laws and regulations." },
                    { id: "aggressive", label: "Aggressive", desc: "Demanding. References legal action if unresolved." },
                    { id: "friendly", label: "Friendly", desc: "Cooperative but clear about what's wrong." },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setDisputeTone(t.id)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                        disputeTone === t.id
                          ? "border-purple-500/30 bg-purple-500/8"
                          : "border-white/5 hover:border-white/10"
                      }`}
                    >
                      <p className="font-medium text-sm">{t.label}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{t.desc}</p>
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleGenerateDispute}
                  disabled={!scanResult}
                  className="w-full py-3 btn-primary rounded-xl text-sm font-semibold disabled:opacity-30 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate letter
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Letter metadata */}
                <div className="glass-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-gray-600 mb-0.5">Subject line</p>
                      <p className="font-medium text-sm truncate">{disputeResult.subject_line as string}</p>
                    </div>
                    {(disputeResult.estimated_savings as number) > 0 && (
                      <span className="text-green-400 font-bold text-sm whitespace-nowrap ml-3">
                        ~${(disputeResult.estimated_savings as number)?.toLocaleString()}
                      </span>
                    )}
                  </div>
                  {disputeResult.send_to && (
                    <p className="text-xs text-gray-600 mt-2">Send to: <span className="text-gray-400">{disputeResult.send_to as string}</span></p>
                  )}
                </div>

                {/* Letter body */}
                <div className="glass-card p-5">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Letter</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(disputeResult.letter_body as string)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/8 text-purple-300 hover:bg-purple-500/15 text-xs transition-colors"
                      >
                        {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                      <button
                        onClick={() => downloadText(
                          `Subject: ${disputeResult.subject_line}\nTo: ${disputeResult.send_to}\n\n${disputeResult.letter_body}`,
                          `GhostLaw_Dispute_${new Date().toISOString().slice(0,10)}.txt`
                        )}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/8 text-blue-300 hover:bg-blue-500/15 text-xs transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </button>
                    </div>
                  </div>
                  <pre className="whitespace-pre-wrap text-gray-300 text-sm leading-relaxed font-sans">
                    {disputeResult.letter_body as string}
                  </pre>
                </div>

                {/* Next steps */}
                <div className="glass-card p-4 bg-blue-500/3 border-blue-500/10">
                  <h3 className="text-xs font-medium text-blue-400 uppercase tracking-wide mb-2">After you send this</h3>
                  <ol className="space-y-1.5 text-xs text-gray-400">
                    <li className="flex items-start gap-2"><span className="text-blue-400 font-bold">1.</span> Send by email AND certified mail if the amount is over $500</li>
                    <li className="flex items-start gap-2"><span className="text-blue-400 font-bold">2.</span> They have 30 days to respond (federal requirement for billing disputes)</li>
                    <li className="flex items-start gap-2"><span className="text-blue-400 font-bold">3.</span> If they don&apos;t respond, file a complaint with CFPB or your State AG</li>
                    <li className="flex items-start gap-2"><span className="text-blue-400 font-bold">4.</span> Come back here and mark the outcome so we can track your wins</li>
                  </ol>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setActiveTab("call")}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold border border-blue-500/20 text-blue-300 hover:bg-blue-500/8 transition-all flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    Get call script too
                  </button>
                  <button
                    onClick={handleGenerateComplaint}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold border border-orange-500/20 text-orange-300 hover:bg-orange-500/8 transition-all flex items-center justify-center gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    File complaint
                  </button>
                  <button
                    onClick={() => { setDisputeResult(null); setDisputeTone("firm_but_polite"); }}
                    className="px-4 py-3 rounded-xl border border-white/5 text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1.5 text-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            CALL SCRIPT TAB
        ═══════════════════════════════════════════════════════════ */}
        {activeTab === "call" && (
          <div className="max-w-3xl mx-auto fade-in">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-1">Call script</h1>
              <p className="text-gray-500 text-sm">Exactly what to say when you call them. Follow it step by step — you&apos;ve got this.</p>
            </div>

            {!callResult ? (
              <div className="glass-card p-6">
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">Who are you calling?</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-4 py-2.5 input-base text-sm"
                      placeholder="e.g., Metro General Hospital, Comcast, AT&T"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">What do you want them to do?</label>
                    <input
                      type="text"
                      value={callObjective}
                      onChange={(e) => setCallObjective(e.target.value)}
                      className="w-full px-4 py-2.5 input-base text-sm"
                      placeholder="e.g., Reduce my bill, waive the late fee, remove the charge"
                    />
                  </div>

                  {/* Pro tips */}
                  <div className="p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
                    <p className="text-[11px] text-yellow-400/80 font-medium mb-1.5">📞 Call tips that actually work</p>
                    <ul className="text-[11px] text-gray-500 space-y-0.5">
                      <li>• Call early morning (Tue-Thu) — shorter hold times, reps less burned out</li>
                      <li>• Ask for the &ldquo;retention&rdquo; or &ldquo;loyalty&rdquo; department — they have authority to cut deals</li>
                      <li>• Always get the rep&apos;s name and employee ID before discussing your issue</li>
                    </ul>
                  </div>

                  <button
                    onClick={handleRequestCall}
                    disabled={!companyName || !scanResult}
                    className="w-full py-3 btn-primary rounded-xl text-sm font-semibold disabled:opacity-30 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Generate call script
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {callResult?.script && (() => {
                  const script = callResult.script as ApiResult;
                  return (
                    <>
                      {script.opening_script && (
                        <div className="glass-card p-5">
                          <h3 className="text-xs font-medium text-purple-400 uppercase tracking-wide mb-2.5">Start with this</h3>
                          <p className="text-sm text-gray-200 bg-[#0a0a14] rounded-xl p-4 leading-relaxed italic border border-white/3">
                            &ldquo;{script.opening_script as string}&rdquo;
                          </p>
                        </div>
                      )}

                      {(script.key_points as string[])?.length > 0 && (
                        <div className="glass-card p-5">
                          <h3 className="text-xs font-medium text-blue-400 uppercase tracking-wide mb-2.5">Points to make</h3>
                          <ul className="space-y-1.5">
                            {(script.key_points as string[]).map((p: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                <ChevronRight className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                                <span className="leading-relaxed">{p}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {(script.negotiation_tactics as string[])?.length > 0 && (
                        <div className="glass-card p-5">
                          <h3 className="text-xs font-medium text-orange-400 uppercase tracking-wide mb-2.5">Negotiation moves</h3>
                          <ul className="space-y-1.5">
                            {(script.negotiation_tactics as string[]).map((t: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                <ChevronRight className="w-3.5 h-3.5 text-orange-400 mt-0.5 flex-shrink-0" />
                                <span className="leading-relaxed">{t}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {(script.escalation_phrases as string[])?.length > 0 && (
                        <div className="glass-card p-5">
                          <h3 className="text-xs font-medium text-red-400 uppercase tracking-wide mb-2.5">If they push back</h3>
                          <ul className="space-y-1.5">
                            {(script.escalation_phrases as string[]).map((p: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                                <span className="leading-relaxed">{p}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {script.closing_script && (
                        <div className="glass-card p-5">
                          <h3 className="text-xs font-medium text-green-400 uppercase tracking-wide mb-2.5">End with this</h3>
                          <p className="text-sm text-gray-200 bg-[#0a0a14] rounded-xl p-4 leading-relaxed italic border border-white/3">
                            &ldquo;{script.closing_script as string}&rdquo;
                          </p>
                        </div>
                      )}

                      {(script.target_outcome || script.estimated_call_duration) && (
                        <div className="grid grid-cols-2 gap-3">
                          {script.target_outcome && (
                            <div className="glass-card p-3.5">
                              <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-0.5">Target outcome</p>
                              <p className="text-sm font-medium text-green-400">{script.target_outcome as string}</p>
                            </div>
                          )}
                          {script.estimated_call_duration && (
                            <div className="glass-card p-3.5">
                              <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-0.5">Estimated time</p>
                              <p className="text-sm font-medium">{script.estimated_call_duration as string}</p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            const full = [
                              `CALL SCRIPT — ${companyName}`,
                              script.opening_script ? `\nOPENING:\n"${script.opening_script}"` : "",
                              (script.key_points as string[])?.length ? `\nKEY POINTS:\n${(script.key_points as string[]).map((p: string) => `• ${p}`).join("\n")}` : "",
                              (script.negotiation_tactics as string[])?.length ? `\nNEGOTIATION:\n${(script.negotiation_tactics as string[]).map((t: string) => `• ${t}`).join("\n")}` : "",
                              (script.escalation_phrases as string[])?.length ? `\nIF THEY PUSH BACK:\n${(script.escalation_phrases as string[]).map((p: string) => `• ${p}`).join("\n")}` : "",
                              script.closing_script ? `\nCLOSING:\n"${script.closing_script}"` : "",
                              script.target_outcome ? `\nTARGET: ${script.target_outcome}` : "",
                            ].filter(Boolean).join("\n");
                            copyToClipboard(full);
                          }}
                          className="flex-1 py-3 btn-primary rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                        >
                          {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {copied ? "Copied" : "Copy full script"}
                        </button>
                        <button
                          onClick={() => {
                            const full = [
                              `CALL SCRIPT — ${companyName}`,
                              script.opening_script ? `\nOPENING:\n"${script.opening_script}"` : "",
                              (script.key_points as string[])?.length ? `\nKEY POINTS:\n${(script.key_points as string[]).map((p: string) => `• ${p}`).join("\n")}` : "",
                              (script.negotiation_tactics as string[])?.length ? `\nNEGOTIATION:\n${(script.negotiation_tactics as string[]).map((t: string) => `• ${t}`).join("\n")}` : "",
                              (script.escalation_phrases as string[])?.length ? `\nIF THEY PUSH BACK:\n${(script.escalation_phrases as string[]).map((p: string) => `• ${p}`).join("\n")}` : "",
                              script.closing_script ? `\nCLOSING:\n"${script.closing_script}"` : "",
                              script.target_outcome ? `\nTARGET: ${script.target_outcome}` : "",
                            ].filter(Boolean).join("\n");
                            downloadText(full, `GhostLaw_CallScript_${companyName.replace(/\s+/g, "_")}.txt`);
                          }}
                          className="px-4 py-3 rounded-xl border border-blue-500/20 text-blue-300 hover:bg-blue-500/8 transition-all flex items-center gap-1.5 text-sm"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            FILE COMPLAINT TAB
        ═══════════════════════════════════════════════════════════ */}
        {activeTab === "complaint" && (
          <div className="max-w-3xl mx-auto fade-in">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-1">File a regulatory complaint</h1>
              <p className="text-gray-500 text-sm">The nuclear option. File with a government agency and watch how fast they respond.</p>
            </div>

            {!complaintResult ? (
              <div className="space-y-4">
                <div className="glass-card p-5">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Pick an agency</h3>
                  <div className="space-y-2">
                    {[
                      {
                        id: "cfpb",
                        name: "CFPB",
                        full: "Consumer Financial Protection Bureau",
                        desc: "Best for: medical bills, debt collection, banking fees, credit card disputes",
                        stat: "97% response rate — companies HAVE to respond",
                      },
                      {
                        id: "fcc",
                        name: "FCC",
                        full: "Federal Communications Commission",
                        desc: "Best for: phone bills, internet, cable, wireless carrier issues",
                        stat: "Companies respond within days, not weeks",
                      },
                      {
                        id: "state_ag",
                        name: "State AG",
                        full: "State Attorney General",
                        desc: "Best for: local businesses, price gouging, fraud, deceptive practices",
                        stat: "Can investigate and sue companies on your behalf",
                      },
                      {
                        id: "ftc",
                        name: "FTC",
                        full: "Federal Trade Commission",
                        desc: "Best for: scams, fraud, deceptive advertising, subscription traps",
                        stat: "Builds cases from multiple complaints — yours adds to the pile",
                      },
                    ].map((a) => (
                      <button
                        key={a.id}
                        onClick={() => setComplaintAgency(a.id)}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                          complaintAgency === a.id
                            ? "border-orange-500/30 bg-orange-500/5"
                            : "border-white/5 hover:border-white/10"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-orange-300">{a.name}</span>
                          <span className="text-[10px] text-gray-600">— {a.full}</span>
                        </div>
                        <p className="text-xs text-gray-400">{a.desc}</p>
                        <p className="text-[10px] text-green-400/70 mt-1">{a.stat}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Company name for complaint */}
                {!companyName && (
                  <div className="glass-card p-4">
                    <label className="block text-xs text-gray-500 mb-1.5">Company you&apos;re complaining about</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-4 py-2.5 input-base text-sm"
                      placeholder="e.g., Metro General Hospital"
                    />
                  </div>
                )}

                <button
                  onClick={handleGenerateComplaint}
                  disabled={!scanResult}
                  className="w-full py-3 btn-primary rounded-xl text-sm font-semibold disabled:opacity-30 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate complaint
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Agency info */}
                <div className="glass-card p-4 bg-orange-500/3 border-orange-500/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{(complaintResult.agency_full_name as string) || complaintAgency.toUpperCase()}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Ready to file</p>
                    </div>
                    {complaintResult.filing_url && (
                      <a
                        href={complaintResult.filing_url as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-300 hover:bg-orange-500/20 text-xs font-medium transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Go to filing page
                      </a>
                    )}
                  </div>
                </div>

                {/* Complaint text */}
                {complaintResult.complaint_text && (
                  <div className="glass-card p-5">
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Complaint text</h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(complaintResult.complaint_text as string)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/8 text-purple-300 hover:bg-purple-500/15 text-xs transition-colors"
                        >
                          {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copied ? "Copied" : "Copy"}
                        </button>
                        <button
                          onClick={() => downloadText(
                            complaintResult.complaint_text as string,
                            `GhostLaw_Complaint_${complaintAgency.toUpperCase()}_${new Date().toISOString().slice(0,10)}.txt`
                          )}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/8 text-blue-300 hover:bg-blue-500/15 text-xs transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </button>
                      </div>
                    </div>
                    <pre className="whitespace-pre-wrap text-gray-300 text-sm leading-relaxed font-sans max-h-96 overflow-auto">
                      {complaintResult.complaint_text as string}
                    </pre>
                  </div>
                )}

                {/* Filing steps */}
                {(complaintResult.filing_steps as string[])?.length > 0 && (
                  <div className="glass-card p-5">
                    <h3 className="text-xs font-medium text-orange-400 uppercase tracking-wide mb-3">How to file — step by step</h3>
                    <ol className="space-y-2">
                      {(complaintResult.filing_steps as string[]).map((step: string, i: number) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                          <span className="w-5 h-5 rounded-full bg-orange-500/15 text-orange-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                          <span className="leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Pro tips */}
                {(complaintResult.pro_tips as string[])?.length > 0 && (
                  <div className="glass-card p-5 bg-green-500/3 border-green-500/10">
                    <h3 className="text-xs font-medium text-green-400 uppercase tracking-wide mb-2.5">Pro tips</h3>
                    <ul className="space-y-1.5">
                      {(complaintResult.pro_tips as string[]).map((tip: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                          <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="leading-relaxed">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  onClick={() => setComplaintResult(null)}
                  className="w-full py-3 rounded-xl text-sm font-medium border border-white/5 text-gray-500 hover:text-gray-300 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Try a different agency
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            HISTORY TAB
        ═══════════════════════════════════════════════════════════ */}
        {activeTab === "history" && (
          <div className="max-w-3xl mx-auto fade-in">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-1">Your history</h1>
              <p className="text-gray-500 text-sm">Everything you&apos;ve scanned and fought so far.</p>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { label: "Scanned", value: localStats.total_scans, icon: <Scan className="w-4 h-4" />, color: "text-purple-400" },
                { label: "Disputes", value: localStats.total_disputes, icon: <FileText className="w-4 h-4" />, color: "text-blue-400" },
                { label: "Call scripts", value: localStats.total_calls, icon: <Phone className="w-4 h-4" />, color: "text-orange-400" },
                {
                  label: localStats.confirmed_savings > 0 ? "Confirmed saved" : "Potential savings",
                  value: `$${(localStats.confirmed_savings || localStats.estimated_savings).toLocaleString()}`,
                  icon: <DollarSign className="w-4 h-4" />,
                  color: "text-green-400"
                },
              ].map((s, i) => (
                <div key={i} className="glass-card p-4">
                  <div className={`${s.color} mb-1.5`}>{s.icon}</div>
                  <p className="text-xl font-bold">{s.value}</p>
                  <p className="text-gray-600 text-xs">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Scan history */}
            {localHistory.scans.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />Past scans
                </h3>
                <div className="space-y-2">
                  {localHistory.scans.map((scan, i) => {
                    const outcome = getOutcome(scan.scan_id);
                    return (
                      <button
                        key={scan.scan_id || i}
                        onClick={() => loadHistoryScan(scan)}
                        className="w-full text-left glass-card p-4 hover:border-purple-500/15 transition-all group"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <Scan className="w-4 h-4 text-purple-400 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate group-hover:text-purple-300 transition-colors">
                                {(scan.document_type as string)?.replace(/_/g, " ") || "Document"} scan
                              </p>
                              <p className="text-gray-600 text-xs truncate">{scan.summary as string}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {outcome && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                outcome.status === "won" ? "bg-green-500/10 text-green-400"
                                : outcome.status === "partial" ? "bg-blue-500/10 text-blue-400"
                                : outcome.status === "pending" ? "bg-yellow-500/10 text-yellow-400"
                                : "bg-red-500/10 text-red-400"
                              }`}>
                                {outcome.status}
                              </span>
                            )}
                            {(scan.total_potential_savings as number) > 0 && (
                              <span className="text-green-400 text-xs font-medium">${(scan.total_potential_savings as number).toLocaleString()}</span>
                            )}
                            <ArrowRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-purple-400 transition-colors" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="glass-card p-10 text-center">
                <Ghost className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm mb-1">Nothing here yet</p>
                <p className="text-gray-700 text-xs mb-4">Scan a bill to get started</p>
                <button
                  onClick={() => setActiveTab("scan")}
                  className="px-5 py-2 btn-primary rounded-xl text-sm font-medium inline-flex items-center gap-1.5"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  Scan something
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
