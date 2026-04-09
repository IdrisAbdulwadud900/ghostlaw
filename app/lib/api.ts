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

export function setUser(user: any) {
  if (typeof window !== "undefined") {
    localStorage.setItem("ghostlaw_user", JSON.stringify(user));
  }
}

// ── Fetch wrapper ───────────────────────────────────────────
async function api(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: any = { ...options.headers };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    throw new Error("Unauthorized");
  }

  const data = await res.json();

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

export async function getProfile() {
  return api("/auth/me");
}

// ── Scan ────────────────────────────────────────────────────
export async function scanDocument(file: File, context: string = "") {
  const form = new FormData();
  form.append("file", file);
  if (context) form.append("context", context);

  return api("/scan/upload", {
    method: "POST",
    body: form,
  });
}

export async function scanText(documentText: string, context: string = "") {
  const form = new FormData();
  form.append("document_text", documentText);
  if (context) form.append("context", context);

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
  customContext: string = ""
) {
  return api("/dispute/generate", {
    method: "POST",
    body: JSON.stringify({
      scan_id: scanId,
      issues_to_dispute: issuesToDispute,
      tone,
      custom_context: customContext,
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
  phoneNumber: string = ""
) {
  return api("/call/request", {
    method: "POST",
    body: JSON.stringify({
      scan_id: scanId,
      dispute_id: disputeId || undefined,
      company_name: companyName,
      phone_number: phoneNumber,
      objective,
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
