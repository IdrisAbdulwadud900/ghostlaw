"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { signup, login, socialLogin } from "@/lib/api";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google?: any;
  }
}

/* ═══════════════════════════════════════════════════════════
   AUTH MODAL — dark terminal style + Social Login
   ═══════════════════════════════════════════════════════════ */

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

interface AuthModalProps {
  mode: "login" | "signup";
  onClose: () => void;
  onSuccess: () => void;
  onSwitchMode: () => void;
}

export default function AuthModal({ mode, onClose, onSuccess, onSwitchMode }: AuthModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // ── Load Google Identity Services SDK ──────────────────────
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const existing = document.getElementById("google-gsi-script");
    if (existing) {
      // Script already loaded — re-init
      initGoogle();
      return;
    }
    const script = document.createElement("script");
    script.id = "google-gsi-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = initGoogle;
    document.head.appendChild(script);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function initGoogle() {
    if (!window.google || !GOOGLE_CLIENT_ID) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      callback: async (response: any) => {
        setSocialLoading("google");
        setError("");
        try {
          await socialLogin("google", response.credential);
          onSuccess();
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : "Google sign-in failed");
        } finally {
          setSocialLoading(null);
        }
      },
    });
  }

  // ── Google Sign-In click handler ───────────────────────────
  function handleGoogleClick() {
    if (!window.google || !GOOGLE_CLIENT_ID) {
      setError("Google Sign-In is not configured yet. Use email signup.");
      return;
    }
    // Trigger the One Tap / popup flow
    window.google.accounts.id.prompt();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "signup") {
        await signup(email, password, name);
      } else {
        await login(email, password);
      }
      onSuccess();
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : "Something went wrong";
      // Map common backend errors to user-friendly messages
      if (raw.toLowerCase().includes("wrong password")) {
        setError("Wrong password — double-check and try again");
      } else if (raw.toLowerCase().includes("no account found")) {
        setError("No account with this email — sign up first!");
      } else if (raw.toLowerCase().includes("already registered")) {
        setError("This email is already registered — try signing in");
      } else {
        setError(raw);
      }
    } finally {
      setLoading(false);
    }
  }

  const mono = "var(--font-ibm-plex-mono), monospace";
  const display = "var(--font-bebas-neue), sans-serif";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        {/* Red top line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--red)]" />

        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] bg-[var(--surface2)]">
          <div className="flex items-center gap-2.5">
            <div className="dot-group">
              <div className="dot-r" />
              <div className="dot-y" />
              <div className="dot-g" />
            </div>
            <span style={{ fontFamily: mono, fontSize: 12, color: "var(--muted)", letterSpacing: "0.05em" }}>
              {mode === "signup" ? "ghostlaw — sign up" : "ghostlaw — sign in"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--muted)] hover:text-white transition-colors"
            style={{ fontFamily: mono, fontSize: 14 }}
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-6">
          {/* Title */}
          <div className="text-center mb-5">
            <div style={{ fontFamily: display, fontSize: 32, letterSpacing: "0.03em" }}>
              Ghost<span style={{ color: "var(--red)" }}>Law</span>
            </div>
            <p style={{ fontFamily: mono, fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
              {mode === "signup" ? "Create your account — start fighting back" : "Welcome back — pick up the fight"}
            </p>
          </div>

          {/* ── Social Login Buttons ───────────────────── */}
          <div className="space-y-2.5 mb-5">
            {/* Google */}
            <button
              onClick={handleGoogleClick}
              disabled={!!socialLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 transition-all hover:brightness-110 disabled:opacity-50"
              style={{ background: "#ffffff", border: "1px solid #dadce0", borderRadius: 0, cursor: socialLoading === "google" ? "wait" : "pointer" }}
            >
              {socialLoading === "google" ? (
                <span className="spinner-sm" style={{ width: 18, height: 18, borderColor: "#4285f4 transparent transparent transparent" }} />
              ) : (
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
              )}
              <span style={{ fontFamily: "'Roboto', Arial, sans-serif", fontSize: 14, fontWeight: 500, color: "#3c4043" }}>
                {mode === "signup" ? "Sign up with Google" : "Sign in with Google"}
              </span>
            </button>

            {/* Hidden Google One-Tap anchor */}
            <div ref={googleBtnRef} style={{ display: "none" }} />
          </div>

          {/* ── Divider ────────────────────────────────── */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            <span style={{ fontFamily: mono, fontSize: 10, color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>or</span>
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <div>
                <label
                  className="block mb-1.5"
                  style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--muted)" }}
                >
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-ghost"
                  placeholder="Your name"
                  required
                />
              </div>
            )}

            <div>
              <label
                className="block mb-1.5"
                style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--muted)" }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-ghost"
                placeholder="you@email.com"
                required
              />
            </div>

            <div>
              <label
                className="block mb-1.5"
                style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--muted)" }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-ghost pr-10"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-white transition-colors"
                  style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.05em" }}
                  tabIndex={-1}
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-[var(--red-dim)] border border-[rgba(232,25,44,0.3)] flex items-center gap-2.5">
                <span style={{ fontSize: 16, flexShrink: 0 }}>
                  {error.includes("Wrong password") ? "🔒" : error.includes("No account") ? "👤" : error.includes("already registered") ? "📧" : "⚠️"}
                </span>
                <p style={{ fontFamily: mono, fontSize: 12, color: "var(--red)" }}>
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              style={{ padding: "14px 36px" }}
            >
              {loading && <span className="spinner-sm" />}
              {mode === "signup" ? "Create Account" : "Sign In"}
            </button>
          </form>

          <p className="text-center mt-5" style={{ fontFamily: mono, fontSize: 11, color: "var(--muted)" }}>
            {mode === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
            <button onClick={onSwitchMode} className="text-[var(--red)] hover:underline transition-colors">
              {mode === "signup" ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
