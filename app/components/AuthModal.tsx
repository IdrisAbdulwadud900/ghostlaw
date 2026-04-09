"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { signup, login } from "@/lib/api";

/* ═══════════════════════════════════════════════════════════
   AUTH MODAL — dark terminal style
   ═══════════════════════════════════════════════════════════ */

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
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

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
        className="relative w-full max-w-sm"
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
            <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, color: "var(--muted)", letterSpacing: "0.05em" }}>
              {mode === "signup" ? "ghostlaw — sign up" : "ghostlaw — sign in"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--muted)] hover:text-white transition-colors"
            style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 14 }}
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-6">
          {/* Title */}
          <div className="text-center mb-6">
            <div style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: 32, letterSpacing: "0.03em" }}>
              Ghost<span style={{ color: "var(--red)" }}>Law</span>
            </div>
            <p style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
              {mode === "signup" ? "Create your account — start fighting back" : "Welcome back — pick up the fight"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <div>
                <label
                  className="block mb-1.5"
                  style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--muted)" }}
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
                style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--muted)" }}
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
                style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--muted)" }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-ghost"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="p-3 bg-[var(--red-dim)] border border-[rgba(232,25,44,0.3)]">
                <p style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, color: "var(--red)", textAlign: "center" }}>
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

          <p className="text-center mt-5" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, color: "var(--muted)" }}>
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
