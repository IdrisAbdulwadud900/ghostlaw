"use client";

import { useState, useRef, useCallback } from "react";
import {
  Ghost, Scan, FileText, Phone, LayoutDashboard,
  Upload, Camera, Copy, CheckCircle,
  AlertTriangle, AlertCircle, Info, Loader2,
  LogOut, ChevronRight, DollarSign, History,
  MessageSquare, ClipboardList
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

  // Scan state
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanContext, setScanContext] = useState("");
  const [textInput, setTextInput] = useState("");
  const [scanMode, setScanMode] = useState<"upload" | "text">("upload");
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
      alert("Please paste more document text (at least 20 characters)");
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
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    clearToken();
    onLogout();
  };

  const severityIcon = (s: string) => {
    switch (s) {
      case "critical": return <AlertCircle className="w-5 h-5 text-red-400" />;
      case "high": return <AlertTriangle className="w-5 h-5 text-orange-400" />;
      case "medium": return <Info className="w-5 h-5 text-blue-400" />;
      default: return <CheckCircle className="w-5 h-5 text-green-400" />;
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0d0d1a] border-r border-[#1a1a2e] flex flex-col">
        <div className="p-4 border-b border-[#1a1a2e]">
          <div className="flex items-center gap-2">
            <Ghost className="w-7 h-7 text-purple-400" />
            <span className="text-lg font-bold">Ghost<span className="text-purple-400">Law</span></span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {[
            { id: "scan" as Tab, icon: <Scan className="w-5 h-5" />, label: "Scan Document" },
            { id: "results" as Tab, icon: <ClipboardList className="w-5 h-5" />, label: "Analysis", disabled: !scanResult },
            { id: "dispute" as Tab, icon: <FileText className="w-5 h-5" />, label: "Dispute Letter", disabled: !scanResult },
            { id: "call" as Tab, icon: <Phone className="w-5 h-5" />, label: "Ghost Call", disabled: !scanResult },
            { id: "dashboard" as Tab, icon: <LayoutDashboard className="w-5 h-5" />, label: "Dashboard" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === "dashboard") loadDashboard();
                setActiveTab(item.id);
              }}
              disabled={item.disabled}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                ${activeTab === item.id ? "bg-purple-500/15 text-purple-300 border border-purple-500/20" : "text-gray-400 hover:bg-[#1a1a2e] hover:text-gray-200"}
                ${item.disabled ? "opacity-30 cursor-not-allowed" : ""}
              `}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#1a1a2e]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-sm font-bold">
              {user?.name?.[0] || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email || ""}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        {loading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="glass-card p-8 text-center">
              <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
              <p className="text-lg font-semibold">AI is analyzing...</p>
              <p className="text-gray-400 text-sm mt-1">This usually takes 5-15 seconds</p>
            </div>
          </div>
        )}

        {/* ═══ SCAN TAB ═══ */}
        {activeTab === "scan" && (
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Scan a Document</h1>
            <p className="text-gray-400 mb-8">Upload a photo or paste the text of any bill, contract, or document.</p>

            <div className="flex gap-2 mb-6">
              <button onClick={() => setScanMode("upload")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${scanMode === "upload" ? "bg-purple-500/15 text-purple-300 border border-purple-500/20" : "text-gray-400 hover:bg-[#1a1a2e]"}`}>
                <Upload className="w-4 h-4 inline mr-2" />Upload Image
              </button>
              <button onClick={() => setScanMode("text")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${scanMode === "text" ? "bg-purple-500/15 text-purple-300 border border-purple-500/20" : "text-gray-400 hover:bg-[#1a1a2e]"}`}>
                <MessageSquare className="w-4 h-4 inline mr-2" />Paste Text
              </button>
            </div>

            {scanMode === "upload" ? (
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) handleFileUpload(file);
                }}
                className="glass-card p-12 text-center cursor-pointer hover:border-purple-500/30 transition-colors"
              >
                <Camera className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <p className="text-lg font-semibold mb-2">Drop a photo here or click to upload</p>
                <p className="text-gray-400 text-sm">Supports JPG, PNG, WebP • Max 10MB</p>
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
            ) : (
              <div className="space-y-4">
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Paste your bill, contract, or document text here..."
                  className="w-full h-64 px-4 py-3 rounded-lg bg-[#1a1a2e] border border-[#2a2a3e] focus:border-purple-500 focus:outline-none text-white resize-none"
                />
                <button onClick={handleTextScan} className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2">
                  <Scan className="w-5 h-5" />
                  Analyze Document
                </button>
              </div>
            )}

            <div className="mt-6">
              <label className="block text-sm text-gray-400 mb-2">Additional context (optional)</label>
              <input
                type="text"
                value={scanContext}
                onChange={(e) => setScanContext(e.target.value)}
                placeholder="e.g., 'This is from my dentist visit last month' or 'I never agreed to this fee'"
                className="w-full px-4 py-3 rounded-lg bg-[#1a1a2e] border border-[#2a2a3e] focus:border-purple-500 focus:outline-none text-white text-sm"
              />
            </div>
          </div>
        )}

        {/* ═══ RESULTS TAB ═══ */}
        {activeTab === "results" && scanResult && (
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-1">Analysis Results</h1>
                <p className="text-gray-400">Document type: <span className="text-purple-300">{scanResult.document_type?.replace(/_/g, " ")}</span></p>
              </div>
              <div className={`px-4 py-2 rounded-lg font-bold text-lg ${scanResult.risk_level === "critical" ? "severity-critical" : scanResult.risk_level === "high" ? "severity-high" : "severity-medium"}`}>
                {scanResult.risk_level?.toUpperCase()} RISK
              </div>
            </div>

            {/* Summary */}
            <div className="glass-card p-6 mb-6">
              <h3 className="font-semibold text-lg mb-2">📄 Summary</h3>
              <p className="text-gray-300">{scanResult.summary}</p>
            </div>

            {/* Plain English */}
            <div className="glass-card p-6 mb-6">
              <h3 className="font-semibold text-lg mb-2">🗣️ In Plain English</h3>
              <p className="text-gray-300 leading-relaxed">{scanResult.plain_english}</p>
            </div>

            {/* Issues Found */}
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-4">🚨 Issues Found ({scanResult.issues_found?.length || 0})</h3>
              <div className="space-y-3">
                {scanResult.issues_found?.map((issue: any, i: number) => (
                  <div key={i} className={`glass-card p-5 border-l-4 ${issue.severity === "critical" ? "border-l-red-500" : issue.severity === "high" ? "border-l-orange-500" : issue.severity === "medium" ? "border-l-blue-500" : "border-l-green-500"}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        {severityIcon(issue.severity)}
                        <div>
                          <p className="font-semibold">{issue.issue}</p>
                          <p className="text-gray-400 text-sm mt-1">{issue.explanation}</p>
                        </div>
                      </div>
                      {issue.potential_savings > 0 && (
                        <span className="text-green-400 font-bold whitespace-nowrap">
                          Save ${issue.potential_savings.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Savings */}
            {scanResult.total_potential_savings > 0 && (
              <div className="glass-card p-6 mb-6 bg-green-500/5 border-green-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-8 h-8 text-green-400" />
                    <div>
                      <p className="text-sm text-gray-400">Total Potential Savings</p>
                      <p className="text-3xl font-bold text-green-400">${scanResult.total_potential_savings.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Your Rights */}
            <div className="glass-card p-6 mb-6">
              <h3 className="font-semibold text-lg mb-3">⚖️ Your Legal Rights</h3>
              <ul className="space-y-2">
                {scanResult.your_rights?.map((right: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                    {right}
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="glass-card p-6 mb-6">
              <h3 className="font-semibold text-lg mb-3">📋 Recommended Actions</h3>
              <ol className="space-y-2">
                {scanResult.recommended_actions?.map((action: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-gray-300">
                    <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    {action}
                  </li>
                ))}
              </ol>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button onClick={handleGenerateDispute} className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2">
                <FileText className="w-5 h-5" />
                Generate Dispute Letter
              </button>
              <button onClick={() => setActiveTab("call")} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2">
                <Phone className="w-5 h-5" />
                Generate Call Script
              </button>
            </div>
          </div>
        )}

        {/* ═══ DISPUTE TAB ═══ */}
        {activeTab === "dispute" && (
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Dispute Letter</h1>
            <p className="text-gray-400 mb-6">AI-generated letter ready to send.</p>

            {!disputeResult ? (
              <div className="glass-card p-8">
                <h3 className="font-semibold text-lg mb-4">Choose your tone:</h3>
                <div className="space-y-3 mb-6">
                  {[
                    { id: "firm_but_polite", label: "Firm but Polite", desc: "Professional, cites laws and rights" },
                    { id: "aggressive", label: "Aggressive", desc: "Demanding, mentions legal action" },
                    { id: "friendly", label: "Friendly", desc: "Cooperative but clear about issues" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setDisputeTone(t.id)}
                      className={`w-full text-left p-4 rounded-lg border transition-colors ${disputeTone === t.id ? "border-purple-500 bg-purple-500/10" : "border-[#2a2a3e] hover:border-gray-600"}`}
                    >
                      <p className="font-semibold">{t.label}</p>
                      <p className="text-gray-400 text-sm">{t.desc}</p>
                    </button>
                  ))}
                </div>
                <button onClick={handleGenerateDispute} disabled={!scanResult} className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-semibold transition-colors disabled:opacity-30 flex items-center justify-center gap-2">
                  <FileText className="w-5 h-5" />
                  Generate Dispute Letter
                </button>
              </div>
            ) : (
              <div>
                <div className="glass-card p-6 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-400">Subject</p>
                      <p className="font-semibold">{disputeResult.subject_line}</p>
                    </div>
                    <div className="text-green-400 font-bold">
                      Est. savings: ${disputeResult.estimated_savings?.toLocaleString()}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">Send to: {disputeResult.send_to}</p>
                </div>

                <div className="glass-card p-6 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Letter Content</h3>
                    <button
                      onClick={() => copyToClipboard(disputeResult.letter_body)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 text-sm"
                    >
                      {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap text-gray-300 text-sm leading-relaxed font-sans">
                    {disputeResult.letter_body}
                  </pre>
                </div>

                <div className="flex gap-4">
                  <button onClick={() => setActiveTab("call")} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2">
                    <Phone className="w-5 h-5" />
                    Generate Call Script
                  </button>
                  <button onClick={() => { setDisputeResult(null); setDisputeTone("firm_but_polite"); }} className="px-4 py-3 rounded-lg border border-[#2a2a3e] text-gray-400 hover:text-white transition-colors">
                    Regenerate
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ CALL TAB ═══ */}
        {activeTab === "call" && (
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">👻 Ghost Call</h1>
            <p className="text-gray-400 mb-6">AI generates a complete call script and negotiation strategy.</p>

            {!callResult ? (
              <div className="glass-card p-8">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Company Name *</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-[#1a1a2e] border border-[#2a2a3e] focus:border-purple-500 focus:outline-none text-white"
                      placeholder="e.g., Metro General Hospital, Comcast, AT&T..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">What do you want to achieve?</label>
                    <input
                      type="text"
                      value={callObjective}
                      onChange={(e) => setCallObjective(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-[#1a1a2e] border border-[#2a2a3e] focus:border-purple-500 focus:outline-none text-white"
                      placeholder="e.g., Reduce my bill, remove the late fee, cancel without penalty..."
                    />
                  </div>
                  <button
                    onClick={handleRequestCall}
                    disabled={!companyName || !scanResult}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-colors disabled:opacity-30 flex items-center justify-center gap-2"
                  >
                    <Phone className="w-5 h-5" />
                    Generate Call Strategy
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {callResult.script && (
                  <>
                    <div className="glass-card p-6">
                      <h3 className="font-semibold text-lg mb-3 text-purple-300">📞 Opening Script</h3>
                      <p className="text-gray-300 bg-[#1a1a2e] rounded-lg p-4 italic">&ldquo;{callResult.script.opening_script}&rdquo;</p>
                    </div>

                    <div className="glass-card p-6">
                      <h3 className="font-semibold text-lg mb-3 text-blue-300">🎯 Key Points to Make</h3>
                      <ul className="space-y-2">
                        {callResult.script.key_points?.map((p: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-gray-300">
                            <ChevronRight className="w-4 h-4 text-blue-400 mt-1" />{p}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="glass-card p-6">
                      <h3 className="font-semibold text-lg mb-3 text-orange-300">🥊 Negotiation Tactics</h3>
                      <ul className="space-y-2">
                        {callResult.script.negotiation_tactics?.map((t: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-gray-300">
                            <ChevronRight className="w-4 h-4 text-orange-400 mt-1" />{t}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="glass-card p-6">
                      <h3 className="font-semibold text-lg mb-3 text-red-300">🔥 If They Push Back</h3>
                      <ul className="space-y-2">
                        {callResult.script.escalation_phrases?.map((p: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-gray-300">
                            <AlertTriangle className="w-4 h-4 text-red-400 mt-1" />{p}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="glass-card p-6">
                      <h3 className="font-semibold text-lg mb-3 text-green-300">✅ Closing Script</h3>
                      <p className="text-gray-300 bg-[#1a1a2e] rounded-lg p-4 italic">&ldquo;{callResult.script.closing_script}&rdquo;</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="glass-card p-4">
                        <p className="text-sm text-gray-400">Target Outcome</p>
                        <p className="font-semibold text-green-400">{callResult.script.target_outcome}</p>
                      </div>
                      <div className="glass-card p-4">
                        <p className="text-sm text-gray-400">Estimated Duration</p>
                        <p className="font-semibold">{callResult.script.estimated_call_duration}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const full = [
                          `CALL SCRIPT — ${companyName}`,
                          `\nOPENING:\n"${callResult.script.opening_script}"`,
                          `\nKEY POINTS:\n${callResult.script.key_points?.map((p: string) => `• ${p}`).join("\n")}`,
                          `\nNEGOTIATION TACTICS:\n${callResult.script.negotiation_tactics?.map((t: string) => `• ${t}`).join("\n")}`,
                          `\nIF THEY PUSH BACK:\n${callResult.script.escalation_phrases?.map((p: string) => `• ${p}`).join("\n")}`,
                          `\nCLOSING:\n"${callResult.script.closing_script}"`,
                          `\nTARGET: ${callResult.script.target_outcome}`,
                        ].join("\n");
                        copyToClipboard(full);
                      }}
                      className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      {copied ? "Copied Full Script!" : "Copy Full Script"}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══ DASHBOARD TAB ═══ */}
        {activeTab === "dashboard" && (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

            {stats ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: "Documents Scanned", value: stats.total_scans, icon: <Scan className="w-5 h-5" />, color: "text-purple-400" },
                    { label: "Disputes Generated", value: stats.total_disputes, icon: <FileText className="w-5 h-5" />, color: "text-blue-400" },
                    { label: "Call Scripts", value: stats.total_calls, icon: <Phone className="w-5 h-5" />, color: "text-green-400" },
                    { label: "Total Saved", value: `$${stats.total_saved?.toLocaleString() || "0"}`, icon: <DollarSign className="w-5 h-5" />, color: "text-green-400" },
                  ].map((s, i) => (
                    <div key={i} className="glass-card p-5">
                      <div className={`${s.color} mb-2`}>{s.icon}</div>
                      <p className="text-2xl font-bold">{s.value}</p>
                      <p className="text-gray-400 text-sm">{s.label}</p>
                    </div>
                  ))}
                </div>

                {stats.recent_activity?.length > 0 && (
                  <div className="glass-card p-6">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <History className="w-5 h-5 text-purple-400" />
                      Recent Activity
                    </h3>
                    <div className="space-y-3">
                      {stats.recent_activity.map((a: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[#0d0d1a]">
                          {a.type === "scan" ? <Scan className="w-5 h-5 text-purple-400" /> : <FileText className="w-5 h-5 text-blue-400" />}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{a.title}</p>
                            <p className="text-gray-500 text-xs truncate">{a.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="glass-card p-12 text-center">
                <Ghost className="w-16 h-16 text-purple-400 mx-auto mb-4 opacity-30" />
                <p className="text-gray-400">No activity yet. Scan your first document!</p>
                <button onClick={() => setActiveTab("scan")} className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-semibold transition-colors text-sm">
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
