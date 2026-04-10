const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Auth state ──────────────────────────────────────────────
let authToken: string | null = null;

export function setToken(token: string) {
  authToken = token;
  if (typeof window !== "undefined") {
    localStorage.setItem("ghostlaw_token", token);
  }
}

export function getToken(): string | null {
  if (authToken) return authToken;
  if (typeof window !== "undefined") {
    authToken = localStorage.getItem("ghostlaw_token");
  }
  return authToken;
}

export function clearToken() {
  authToken = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem("ghostlaw_token");
    localStorage.removeItem("ghostlaw_user");
  }
}

export function getUser() {
  if (typeof window !== "undefined") {
    const u = localStorage.getItem("ghostlaw_user");
    return u ? JSON.parse(u) : null;
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setUser(user: Record<string, any>) {
  if (typeof window !== "undefined") {
    localStorage.setItem("ghostlaw_user", JSON.stringify(user));
  }
}

// ── Local History (persists across Vercel cold starts) ──────
const HISTORY_KEY = "ghostlaw_history";

interface HistoryStore {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scans: Record<string, any>[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  disputes: Record<string, any>[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  calls: Record<string, any>[];
  outcomes: Record<string, { status: string; actual_savings?: number; notes?: string }>;
}

function getHistory(): HistoryStore {
  if (typeof window === "undefined") return { scans: [], disputes: [], calls: [], outcomes: {} };
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { scans: [], disputes: [], calls: [], outcomes: {} };
}

function saveHistory(h: HistoryStore) {
  if (typeof window !== "undefined") {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function addScanToHistory(scan: Record<string, any>) {
  const h = getHistory();
  // Avoid duplicates
  h.scans = h.scans.filter(s => s.scan_id !== scan.scan_id);
  h.scans.unshift(scan);
  // Keep last 50
  h.scans = h.scans.slice(0, 50);
  saveHistory(h);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function addDisputeToHistory(dispute: Record<string, any>) {
  const h = getHistory();
  h.disputes = h.disputes.filter(d => d.dispute_id !== dispute.dispute_id);
  h.disputes.unshift(dispute);
  h.disputes = h.disputes.slice(0, 50);
  saveHistory(h);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function addCallToHistory(call: Record<string, any>) {
  const h = getHistory();
  h.calls = h.calls.filter(c => c.call_id !== call.call_id);
  h.calls.unshift(call);
  h.calls = h.calls.slice(0, 50);
  saveHistory(h);
}

export function getLocalHistory(): HistoryStore {
  return getHistory();
}

export function saveOutcome(scanId: string, status: string, actualSavings?: number, notes?: string) {
  const h = getHistory();
  h.outcomes[scanId] = { status, actual_savings: actualSavings, notes };
  saveHistory(h);
}

export function getOutcome(scanId: string) {
  return getHistory().outcomes[scanId] || null;
}

export function getLocalStats() {
  const h = getHistory();
  const confirmedSavings = Object.values(h.outcomes)
    .filter(o => o.status === "won" || o.status === "partial")
    .reduce((sum, o) => sum + (o.actual_savings || 0), 0);
  const estimatedSavings = h.disputes.reduce((sum, d) => sum + (d.estimated_savings || 0), 0);
  return {
    total_scans: h.scans.length,
    total_disputes: h.disputes.length,
    total_calls: h.calls.length,
    estimated_savings: estimatedSavings,
    confirmed_savings: confirmedSavings,
    outcomes: h.outcomes,
  };
}

// ── Fetch wrapper ───────────────────────────────────────────
async function api(path: string, options: RequestInit = {}) {
  const token = getToken();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const headers: any = { ...options.headers };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    // Network error, timeout, or CORS failure ("Load failed" on mobile Safari)
    throw new Error("Connection failed — check your internet and try again");
  }

  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    throw new Error("Session expired — please sign in again");
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("Server error — please try again in a moment");
  }

  if (!res.ok) {
    throw new Error(data.detail || "Something went wrong");
  }

  return data;
}

// ── Auth ────────────────────────────────────────────────────
export async function signup(email: string, password: string, name: string) {
  const data = await api("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
  setToken(data.access_token);
  setUser({ user_id: data.user_id, email: data.email, name: data.name });
  return data;
}

export async function login(email: string, password: string) {
  const data = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(data.access_token);
  setUser({ user_id: data.user_id, email: data.email, name: data.name });
  return data;
}

export async function socialLogin(provider: "google" | "apple", idToken: string) {
  const data = await api("/auth/social", {
    method: "POST",
    body: JSON.stringify({ provider, id_token: idToken }),
  });
  setToken(data.access_token);
  setUser({ user_id: data.user_id, email: data.email, name: data.name });
  return data;
}

export async function getProfile() {
  return api("/auth/me");
}

// ── Scan ────────────────────────────────────────────────────
export async function scanDocument(file: File, context: string = "", country: string = "US") {
  const form = new FormData();
  form.append("file", file);
  if (context) form.append("context", context);
  form.append("country", country);

  return api("/scan/upload", {
    method: "POST",
    body: form,
  });
}

export async function scanText(documentText: string, context: string = "", country: string = "US") {
  const form = new FormData();
  form.append("document_text", documentText);
  if (context) form.append("context", context);
  form.append("country", country);

  return api("/scan/text", {
    method: "POST",
    body: form,
  });
}

export async function getScanHistory() {
  return api("/scan/history");
}

export async function getScan(scanId: string) {
  return api(`/scan/${scanId}`);
}

// ── Dispute ─────────────────────────────────────────────────
export async function generateDispute(
  scanId: string,
  issuesToDispute: number[] = [],
  tone: string = "firm_but_polite",
  customContext: string = "",
  country: string = "US"
) {
  return api("/dispute/generate", {
    method: "POST",
    body: JSON.stringify({
      scan_id: scanId,
      issues_to_dispute: issuesToDispute,
      tone,
      custom_context: customContext,
      country,
    }),
  });
}

export async function getDisputeHistory() {
  return api("/dispute/history");
}

export async function getDispute(disputeId: string) {
  return api(`/dispute/${disputeId}`);
}

// ── Call Ghost ──────────────────────────────────────────────
export async function requestCall(
  scanId: string,
  companyName: string,
  objective: string,
  disputeId: string = "",
  phoneNumber: string = "",
  country: string = "US"
) {
  return api("/call/request", {
    method: "POST",
    body: JSON.stringify({
      scan_id: scanId,
      dispute_id: disputeId || undefined,
      company_name: companyName,
      phone_number: phoneNumber,
      objective,
      country,
    }),
  });
}

export async function getCallHistory() {
  return api("/call/history");
}

export async function getCall(callId: string) {
  return api(`/call/${callId}`);
}

// ── Dashboard ───────────────────────────────────────────────
export async function getDashboardStats() {
  return api("/dashboard/stats");
}

// ── Regulatory Complaints ───────────────────────────────────
export async function generateComplaint(
  scanId: string,
  agency: string = "cfpb",
  disputeId: string = "",
  companyName: string = "",
  state: string = "",
  customContext: string = "",
  country: string = "US"
) {
  return api("/complaint/generate", {
    method: "POST",
    body: JSON.stringify({
      scan_id: scanId,
      agency,
      dispute_id: disputeId || undefined,
      company_name: companyName,
      state,
      custom_context: customContext,
      country,
    }),
  });
}
