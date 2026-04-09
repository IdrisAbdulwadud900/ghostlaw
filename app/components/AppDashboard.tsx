"use client";

import { useState, useRef, useCallback } from "react";
import {
  Ghost, Scan, FileText, Phone, LayoutDashboard,
  Upload, Camera, Copy, CheckCircle,
  AlertTriangle, AlertCircle, Info, Loader2,
  LogOut, ChevronRight, DollarSign, History,
  MessageSquare, ClipboardList, ArrowRight,
  Menu, X, Sparkles, RotateCcw
} from "lucide-react";
import { clearToken, getUser, scanDocument, scanText, generateDispute, requestCall, getDashboardStats } from "@/lib/api";

type Tab = "scan" | "results" | "dispute" | "call" | "dashboard";

interface AppDashboardProps {
  onLogout: () => void;
}

export default function AppDashboard({ onLogout }: AppDashboardProps) {
  const user = getUser();
  const [activeTab, setActiveTab] = useState<Tab>("scan");
  const [loading, setLoading] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  // Scan state
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanContext, setScanContext] = useState("");
  const [textInput, setTextInput] = useState("");
  const [scanMode, setScanMode] = useState<"upload" | "text">("text");
  const fileRef = useRef<HTMLInputElement>(null);

  // Dispute state
  const [disputeResult, setDisputeResult] = useState<any>(null);
  const [disputeTone, setDisputeTone] = useState("firm_but_polite");
  const [copied, setCopied] = useState(false);

  // Call state
  const [callResult, setCallResult] = useState<any>(null);
  const [companyName, setCompanyName] = useState("");
  const [callObjective, setCallObjective] = useState("");

  // Dashboard state
  const [stats, setStats] = useState<any>(null);

  const handleFileUpload = useCallback(async (file: File) => {
    setLoading(true);
    try {
      const result = await scanDocument(file, scanContext);
      setScanResult(result);
      setActiveTab("results");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Scan failed";
      alert(msg);
    } finally {
      setLoading(false);
    }
  }, [scanContext]);

  const handleTextScan = useCallback(async () => {
    if (textInput.length < 20) {
      alert("Paste more text — we need at least a few lines to analyze.");
      return;
    }
    setLoading(true);
    try {
      const result = await scanText(textInput, scanContext);
      setScanResult(result);
      setActiveTab("results");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Scan failed";
      alert(msg);
    } finally {
      setLoading(false);
    }
  }, [textInput, scanContext]);

  const handleGenerateDispute = useCallback(async () => {
    if (!scanResult?.scan_id) return;
    setLoading(true);
    try {
      const result = await generateDispute(scanResult.scan_id, [], disputeTone);
      setDisputeResult(result);
      setActiveTab("dispute");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate dispute";
      alert(msg);
    } finally {
      setLoading(false);
    }
  }, [scanResult, disputeTone]);

  const handleRequestCall = useCallback(async () => {
    if (!scanResult?.scan_id || !companyName) return;
    setLoading(true);
    try {
      const result = await requestCall(
        scanResult.scan_id,
        companyName,
        callObjective || "Dispute overcharges and negotiate a reduction",
        disputeResult?.dispute_id || ""
      );
      setCallResult(result);
      setActiveTab("call");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate call script";
      alert(msg);
    } finally {
      setLoading(false);
    }
  }, [scanResult, companyName, callObjective, disputeResult]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const s = await getDashboardStats();
      setStats(s);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => { clearToken(); onLogout(); };

  const navigate = (tab: Tab) => {
    if (tab === "dashboard") loadDashboard();
    setActiveTab(tab);
    setMobileNav(false);
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
    { id: "dashboard" as Tab, icon: <LayoutDashboard className="w-[18px] h-[18px]" />, label: "Dashboard" },
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

        <nav className="flex-1 px-2.5 py-3 space-y-0.5">
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
              <p className="text-sm font-medium">Analyzing your document...</p>
              <p className="text-gray-600 text-xs mt-1">Usually takes 5-15 seconds</p>
            </div>
          </div>
        )}

        {/* ═══ SCAN TAB ═══ */}
        {activeTab === "scan" && (
          <div className="max-w-2xl mx-auto fade-in">
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-1">What do you want to scan?</h1>
              <p className="text-gray-500 text-sm">Paste the text from any bill, contract, or document. We&apos;ll find everything that&apos;s wrong with it.</p>
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
                  <p className="text-gray-600 text-xs">JPG, PNG, or WebP • Max 10MB</p>
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
          </div>
        )}

        {/* ═══ RESULTS TAB ═══ */}
        {activeTab === "results" && scanResult && (
          <div className="max-w-3xl mx-auto fade-in">
            {/* Header */}
            <div className="flex items-start justify-between mb-6 gap-4">
              <div>
                <h1 className="text-2xl font-bold mb-1">Here&apos;s what we found</h1>
                <p className="text-gray-500 text-sm">
                  {scanResult.document_type?.replace(/_/g, " ")} analysis • {scanResult.issues_found?.length || 0} issues
                </p>
              </div>
              {scanResult.risk_level && (
                <span className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap
                  ${scanResult.risk_level === "critical" ? "severity-critical" 
                  : scanResult.risk_level === "high" ? "severity-high" 
                  : scanResult.risk_level === "medium" ? "severity-medium"
                  : "severity-low"}`}
                >
                  {scanResult.risk_level} risk
                </span>
              )}
            </div>

            {/* Summary */}
            {scanResult.summary && (
              <div className="glass-card p-5 mb-4">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Summary</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{scanResult.summary}</p>
              </div>
            )}

            {/* Plain English */}
            {scanResult.plain_english && (
              <div className="glass-card p-5 mb-4">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">In plain english</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{scanResult.plain_english}</p>
              </div>
            )}

            {/* Issues Found */}
            {scanResult.issues_found?.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Issues found</h3>
                <div className="space-y-2">
                  {scanResult.issues_found.map((issue: any, i: number) => (
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
                          {severityIcon(issue.severity)}
                          <div className="min-w-0">
                            <p className="font-medium text-sm">{issue.issue}</p>
                            <p className="text-gray-500 text-xs mt-1 leading-relaxed">{issue.explanation}</p>
                          </div>
                        </div>
                        {issue.potential_savings > 0 && (
                          <span className="text-green-400 font-bold text-sm whitespace-nowrap">
                            +${issue.potential_savings.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total Savings */}
            {scanResult.total_potential_savings > 0 && (
              <div className="glass-card p-5 mb-4 bg-green-500/3 border-green-500/15">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">You could save</p>
                    <p className="text-2xl font-bold gradient-text-green">${scanResult.total_potential_savings.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Your Rights */}
            {scanResult.your_rights?.length > 0 && (
              <div className="glass-card p-5 mb-4">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Your rights</h3>
                <ul className="space-y-2">
                  {scanResult.your_rights.map((right: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <CheckCircle className="w-3.5 h-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="leading-relaxed">{right}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            {scanResult.recommended_actions?.length > 0 && (
              <div className="glass-card p-5 mb-6">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">What to do next</h3>
                <ol className="space-y-2">
                  {scanResult.recommended_actions.map((action: string, i: number) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                      <span className="w-5 h-5 rounded-full bg-purple-500/15 text-purple-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                      <span className="leading-relaxed">{action}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button 
                onClick={handleGenerateDispute} 
                className="flex-1 py-3 btn-primary rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Write dispute letter
              </button>
              <button 
                onClick={() => setActiveTab("call")} 
                className="flex-1 py-3 rounded-xl text-sm font-semibold border border-blue-500/20 text-blue-300 hover:bg-blue-500/8 transition-all flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                Get call script
              </button>
            </div>
          </div>
        )}

        {/* ═══ DISPUTE TAB ═══ */}
        {activeTab === "dispute" && (
          <div className="max-w-3xl mx-auto fade-in">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-1">Dispute letter</h1>
              <p className="text-gray-500 text-sm">Copy this, paste it into an email, and hit send. That&apos;s it.</p>
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
                      <p className="font-medium text-sm truncate">{disputeResult.subject_line}</p>
                    </div>
                    {disputeResult.estimated_savings > 0 && (
                      <span className="text-green-400 font-bold text-sm whitespace-nowrap ml-3">
                        ~${disputeResult.estimated_savings?.toLocaleString()}
                      </span>
                    )}
                  </div>
                  {disputeResult.send_to && (
                    <p className="text-xs text-gray-600 mt-2">Send to: <span className="text-gray-400">{disputeResult.send_to}</span></p>
                  )}
                </div>

                {/* Letter body */}
                <div className="glass-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Letter</h3>
                    <button
                      onClick={() => copyToClipboard(disputeResult.letter_body)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/8 text-purple-300 hover:bg-purple-500/15 text-xs transition-colors"
                    >
                      {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap text-gray-300 text-sm leading-relaxed font-sans">
                    {disputeResult.letter_body}
                  </pre>
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
                    onClick={() => { setDisputeResult(null); setDisputeTone("firm_but_polite"); }} 
                    className="px-4 py-3 rounded-xl border border-white/5 text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1.5 text-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Redo
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ CALL TAB ═══ */}
        {activeTab === "call" && (
          <div className="max-w-3xl mx-auto fade-in">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-1">Call script</h1>
              <p className="text-gray-500 text-sm">Exactly what to say when you call them. Follow it step by step.</p>
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
                {callResult.script && (
                  <>
                    {callResult.script.opening_script && (
                      <div className="glass-card p-5">
                        <h3 className="text-xs font-medium text-purple-400 uppercase tracking-wide mb-2.5">Start with this</h3>
                        <p className="text-sm text-gray-200 bg-[#0a0a14] rounded-xl p-4 leading-relaxed italic border border-white/3">
                          &ldquo;{callResult.script.opening_script}&rdquo;
                        </p>
                      </div>
                    )}

                    {callResult.script.key_points?.length > 0 && (
                      <div className="glass-card p-5">
                        <h3 className="text-xs font-medium text-blue-400 uppercase tracking-wide mb-2.5">Points to make</h3>
                        <ul className="space-y-1.5">
                          {callResult.script.key_points.map((p: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                              <ChevronRight className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                              <span className="leading-relaxed">{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {callResult.script.negotiation_tactics?.length > 0 && (
                      <div className="glass-card p-5">
                        <h3 className="text-xs font-medium text-orange-400 uppercase tracking-wide mb-2.5">Negotiation moves</h3>
                        <ul className="space-y-1.5">
                          {callResult.script.negotiation_tactics.map((t: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                              <ChevronRight className="w-3.5 h-3.5 text-orange-400 mt-0.5 flex-shrink-0" />
                              <span className="leading-relaxed">{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {callResult.script.escalation_phrases?.length > 0 && (
                      <div className="glass-card p-5">
                        <h3 className="text-xs font-medium text-red-400 uppercase tracking-wide mb-2.5">If they push back</h3>
                        <ul className="space-y-1.5">
                          {callResult.script.escalation_phrases.map((p: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                              <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                              <span className="leading-relaxed">{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {callResult.script.closing_script && (
                      <div className="glass-card p-5">
                        <h3 className="text-xs font-medium text-green-400 uppercase tracking-wide mb-2.5">End with this</h3>
                        <p className="text-sm text-gray-200 bg-[#0a0a14] rounded-xl p-4 leading-relaxed italic border border-white/3">
                          &ldquo;{callResult.script.closing_script}&rdquo;
                        </p>
                      </div>
                    )}

                    {(callResult.script.target_outcome || callResult.script.estimated_call_duration) && (
                      <div className="grid grid-cols-2 gap-3">
                        {callResult.script.target_outcome && (
                          <div className="glass-card p-3.5">
                            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-0.5">Target outcome</p>
                            <p className="text-sm font-medium text-green-400">{callResult.script.target_outcome}</p>
                          </div>
                        )}
                        {callResult.script.estimated_call_duration && (
                          <div className="glass-card p-3.5">
                            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-0.5">Estimated time</p>
                            <p className="text-sm font-medium">{callResult.script.estimated_call_duration}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      onClick={() => {
                        const full = [
                          `CALL SCRIPT — ${companyName}`,
                          callResult.script.opening_script ? `\nOPENING:\n"${callResult.script.opening_script}"` : "",
                          callResult.script.key_points?.length ? `\nKEY POINTS:\n${callResult.script.key_points.map((p: string) => `• ${p}`).join("\n")}` : "",
                          callResult.script.negotiation_tactics?.length ? `\nNEGOTIATION:\n${callResult.script.negotiation_tactics.map((t: string) => `• ${t}`).join("\n")}` : "",
                          callResult.script.escalation_phrases?.length ? `\nIF THEY PUSH BACK:\n${callResult.script.escalation_phrases.map((p: string) => `• ${p}`).join("\n")}` : "",
                          callResult.script.closing_script ? `\nCLOSING:\n"${callResult.script.closing_script}"` : "",
                          callResult.script.target_outcome ? `\nTARGET: ${callResult.script.target_outcome}` : "",
                        ].filter(Boolean).join("\n");
                        copyToClipboard(full);
                      }}
                      className="w-full py-3 btn-primary rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                    >
                      {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? "Copied full script" : "Copy full script"}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══ DASHBOARD TAB ═══ */}
        {activeTab === "dashboard" && (
          <div className="max-w-3xl mx-auto fade-in">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-1">Your dashboard</h1>
              <p className="text-gray-500 text-sm">Everything you&apos;ve scanned and fought so far.</p>
            </div>

            {stats ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {[
                    { label: "Scanned", value: stats.total_scans, icon: <Scan className="w-4 h-4" />, color: "text-purple-400" },
                    { label: "Disputes", value: stats.total_disputes, icon: <FileText className="w-4 h-4" />, color: "text-blue-400" },
                    { label: "Call scripts", value: stats.total_calls, icon: <Phone className="w-4 h-4" />, color: "text-orange-400" },
                    { label: "Total saved", value: `$${stats.total_saved?.toLocaleString() || "0"}`, icon: <DollarSign className="w-4 h-4" />, color: "text-green-400" },
                  ].map((s, i) => (
                    <div key={i} className="glass-card p-4">
                      <div className={`${s.color} mb-1.5`}>{s.icon}</div>
                      <p className="text-xl font-bold">{s.value}</p>
                      <p className="text-gray-600 text-xs">{s.label}</p>
                    </div>
                  ))}
                </div>

                {stats.recent_activity?.length > 0 && (
                  <div className="glass-card p-5">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5" />Recent activity
                    </h3>
                    <div className="space-y-2">
                      {stats.recent_activity.map((a: any, i: number) => (
                        <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#0a0a14]">
                          {a.type === "scan" ? <Scan className="w-4 h-4 text-purple-400" /> : <FileText className="w-4 h-4 text-blue-400" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{a.title}</p>
                            <p className="text-gray-600 text-xs truncate">{a.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
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
