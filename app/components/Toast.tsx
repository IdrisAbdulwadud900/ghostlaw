"use client";

import { useState, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════
   TOAST NOTIFICATION SYSTEM — Legal Noir style
   Usage:
     const { toast, ToastContainer } = useToast();
     toast("Message", "error");   // or "success" | "info" | "warning"
   ═══════════════════════════════════════════════════════════ */

type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  leaving: boolean;
}

const ICONS: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  warning: "⚠",
  info: "ℹ",
};

const COLORS: Record<ToastType, { bg: string; border: string; text: string; icon: string }> = {
  success: { bg: "rgba(65,232,102,0.08)", border: "rgba(65,232,102,0.25)", text: "#41e866", icon: "#41e866" },
  error:   { bg: "rgba(232,25,44,0.08)",  border: "rgba(232,25,44,0.25)",  text: "#ff6b7a", icon: "var(--red)" },
  warning: { bg: "rgba(232,197,65,0.08)", border: "rgba(232,197,65,0.25)", text: "#e8c541", icon: "#e8c541" },
  info:    { bg: "rgba(65,120,232,0.08)", border: "rgba(65,120,232,0.25)", text: "#4178e8", icon: "#4178e8" },
};

let _nextId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++_nextId;
    setToasts(prev => [...prev, { id, message, type, leaving: false }]);
    // Auto-dismiss after 4s
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t));
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 400);
    }, 4000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 400);
  }, []);

  const ToastContainer = useCallback(() => (
    <div style={{
      position: "fixed", top: 16, right: 16, zIndex: 9999,
      display: "flex", flexDirection: "column", gap: 8,
      pointerEvents: "none", maxWidth: 420, width: "calc(100vw - 32px)",
    }}>
      {toasts.map(t => {
        const c = COLORS[t.type];
        return (
          <div
            key={t.id}
            onClick={() => dismiss(t.id)}
            style={{
              pointerEvents: "auto",
              display: "flex", alignItems: "flex-start", gap: 10,
              padding: "12px 16px",
              background: c.bg,
              border: `1px solid ${c.border}`,
              backdropFilter: "blur(12px)",
              cursor: "pointer",
              animation: t.leaving ? "toast-out 0.4s ease forwards" : "toast-in 0.4s ease",
              fontFamily: "var(--font-ibm-plex-mono), monospace",
            }}
          >
            <span style={{
              fontSize: 14, fontWeight: 700, color: c.icon,
              width: 20, height: 20, display: "flex",
              alignItems: "center", justifyContent: "center",
              flexShrink: 0, marginTop: 1,
            }}>
              {ICONS[t.type]}
            </span>
            <span style={{ fontSize: 12, color: c.text, lineHeight: 1.5 }}>
              {t.message}
            </span>
          </div>
        );
      })}
    </div>
  ), [toasts, dismiss]);

  return { toast, ToastContainer };
}
