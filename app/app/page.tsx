"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import AuthModal from "@/components/AuthModal";
import AppDashboard from "../components/AppDashboard";
import { getToken } from "@/lib/api";

/* ═══════════════════════════════════════════════════════════
   LANDING PAGE — matches ghostlaw.html design
   ═══════════════════════════════════════════════════════════ */

export default function Home() {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window !== "undefined") return !!getToken();
    return false;
  });

  // ── Custom cursor ──────────────────────────────────────
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia("(pointer: coarse)").matches) return;

    let mx = 0, my = 0, rx = 0, ry = 0;
    const move = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      if (cursorRef.current) {
        cursorRef.current.style.left = mx + "px";
        cursorRef.current.style.top = my + "px";
      }
    };
    const raf = () => {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      if (ringRef.current) {
        ringRef.current.style.left = rx + "px";
        ringRef.current.style.top = ry + "px";
      }
      requestAnimationFrame(raf);
    };
    document.addEventListener("mousemove", move);
    requestAnimationFrame(raf);
    return () => document.removeEventListener("mousemove", move);
  }, [isLoggedIn]);

  // ── Scroll reveal ──────────────────────────────────────
  useEffect(() => {
    if (isLoggedIn) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll(".reveal").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [isLoggedIn]);

  // ── Logged in → Dashboard ─────────────────────────────
  if (isLoggedIn) {
    return <AppDashboard onLogout={() => setIsLoggedIn(false)} />;
  }

  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setShowAuth(true);
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative" style={{ cursor: "none" }}>
      {/* Cursor */}
      <div ref={cursorRef} className="cursor-dot hidden md:block" />
      <div ref={ringRef} className="cursor-ring hidden md:block" />

      {/* ═══ NAV ═══════════════════════════════════════════ */}
      <nav
        className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-4 sm:px-4 sm:px-6 md:px-12 py-4 md:py-5"
        style={{
          background: "linear-gradient(to bottom, rgba(6,6,8,0.95), transparent)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: 28, letterSpacing: "0.05em", cursor: "none" }}
        >
          Ghost<span style={{ color: "var(--red)" }}>Law</span>
          <span className="logo-dot" />
        </div>

        <ul className="hidden md:flex gap-8 list-none" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" as const }}>
          <li><button onClick={() => scrollTo("how")} className="text-[var(--muted)] hover:text-white transition-colors" style={{ cursor: "none" }}>How It Works</button></li>
          <li><button onClick={() => scrollTo("features")} className="text-[var(--muted)] hover:text-white transition-colors" style={{ cursor: "none" }}>What You Get</button></li>
          <li><button onClick={() => scrollTo("guide")} className="text-[var(--muted)] hover:text-white transition-colors" style={{ cursor: "none" }}>Who It&apos;s For</button></li>
          <li><button onClick={() => scrollTo("scanner")} className="text-[var(--muted)] hover:text-white transition-colors" style={{ cursor: "none" }}>Try It</button></li>
        </ul>

        <button
          onClick={() => openAuth("signup")}
          className="text-[var(--black)] bg-[var(--red)] hover:bg-[#ff2d42] px-3 sm:px-5 py-2 sm:py-2.5 transition-all hover:-translate-y-[1px]"
          style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, cursor: "none", whiteSpace: "nowrap" }}
        >
          Get My Money Back
        </button>
      </nav>

      {/* ═══ HERO ══════════════════════════════════════════ */}
      <section className="min-h-screen flex flex-col justify-center px-4 sm:px-4 sm:px-6 md:px-12 pt-24 sm:pt-32 pb-12 sm:pb-16 relative overflow-hidden" id="home">
        <div
          className="photo-backdrop"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80")',
          }}
        />
        {/* Grid background */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "linear-gradient(rgba(232,25,44,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(232,25,44,0.03) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
            animation: "grid-drift 20s linear infinite",
          }}
        />
        {/* Radial glow */}
        <div
          className="absolute -top-[200px] -right-[200px] w-[800px] h-[800px]"
          style={{
            background: "radial-gradient(circle, rgba(232,25,44,0.06) 0%, transparent 65%)",
            animation: "radial-breathe 6s ease-in-out infinite",
          }}
        />

        {/* ── Floating decorative shapes ── */}
        {/* Shield icon — top right */}
        <div className="float-shape hidden md:block" style={{ top: "12%", right: "8%", width: 120, height: 140, opacity: 0.06, animation: "float-slow 8s ease-in-out infinite" }}>
          <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 5L90 25V60C90 85 70 105 50 115C30 105 10 85 10 60V25L50 5Z" stroke="currentColor" strokeWidth="2" fill="rgba(232,25,44,0.15)" />
            <path d="M35 58L45 68L65 48" stroke="var(--red)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        {/* Document icon — left */}
        <div className="float-shape hidden md:block" style={{ top: "30%", left: "5%", width: 90, height: 110, opacity: 0.05, animation: "float-reverse 10s ease-in-out infinite" }}>
          <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="5" width="60" height="90" rx="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M50 5V25H70" stroke="currentColor" strokeWidth="1.5" />
            <line x1="15" y1="40" x2="55" y2="40" stroke="var(--red)" strokeWidth="1" opacity="0.5" />
            <line x1="15" y1="50" x2="50" y2="50" stroke="currentColor" strokeWidth="1" opacity="0.3" />
            <line x1="15" y1="60" x2="45" y2="60" stroke="currentColor" strokeWidth="1" opacity="0.3" />
            <line x1="15" y1="70" x2="52" y2="70" stroke="currentColor" strokeWidth="1" opacity="0.3" />
          </svg>
        </div>
        {/* Scales of justice — center right */}
        <div className="float-shape hidden lg:block" style={{ bottom: "20%", right: "15%", width: 100, height: 100, opacity: 0.04, animation: "float-drift 12s ease-in-out infinite" }}>
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="50" y1="10" x2="50" y2="80" stroke="currentColor" strokeWidth="1.5" />
            <line x1="20" y1="30" x2="80" y2="30" stroke="currentColor" strokeWidth="1.5" />
            <path d="M20 30L10 55H30L20 30Z" stroke="var(--red)" strokeWidth="1" fill="rgba(232,25,44,0.1)" />
            <path d="M80 30L70 55H90L80 30Z" stroke="var(--red)" strokeWidth="1" fill="rgba(232,25,44,0.1)" />
            <rect x="40" y="80" width="20" height="5" rx="1" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>
        {/* Floating red orbs */}
        <div className="glow-orb hidden md:block" style={{ width: 200, height: 200, top: "60%", left: "10%", background: "rgba(232,25,44,0.12)", animation: "glow-pulse 6s ease-in-out infinite" }} />
        <div className="glow-orb hidden lg:block" style={{ width: 300, height: 300, top: "10%", right: "20%", background: "rgba(232,25,44,0.06)", animation: "glow-pulse 8s ease-in-out 2s infinite" }} />
        {/* Small orbiting dots */}
        <div className="float-shape hidden md:block" style={{ top: "45%", right: "25%", width: 6, height: 6, animation: "orbit 15s linear infinite" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--red)", opacity: 0.4 }} />
        </div>
        <div className="float-shape hidden md:block" style={{ top: "25%", left: "18%", width: 4, height: 4, animation: "orbit 20s linear reverse infinite" }}>
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--red)", opacity: 0.3 }} />
        </div>
        {/* Dashed circuit line */}
        <div className="float-shape hidden lg:block" style={{ top: "65%", left: "25%", width: 200, height: 60, opacity: 0.06 }}>
          <svg viewBox="0 0 200 60" fill="none">
            <path d="M0 30 H60 L80 10 H140 L160 30 H200" stroke="var(--red)" strokeWidth="1" strokeDasharray="8 6" style={{ animation: "dash-flow 4s linear infinite" }} />
            <circle cx="80" cy="10" r="3" fill="var(--red)" opacity="0.5" />
            <circle cx="160" cy="30" r="3" fill="var(--red)" opacity="0.5" />
          </svg>
        </div>

        <div className="relative z-10 max-w-[760px] glass-panel p-6 md:p-10">
          <div
            className="fade-up flex items-center gap-3 mb-6"
            style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: "var(--red)" }}
          >
            <span className="w-10 h-[1px] bg-[var(--red)]" />
            The App That Stops You From Being Cheated
          </div>

          <h1
            className="fade-up-1 leading-[0.92] mb-4"
            style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: "clamp(72px, 10vw, 140px)", letterSpacing: "0.01em" }}
          >
            GET YOUR<br />
            <span style={{ color: "var(--red)" }}>MONEY</span><br />
            <span style={{ WebkitTextStroke: "1px rgba(255,255,255,0.3)", color: "transparent" }}>BACK</span>
          </h1>

          <p
            className="fade-up-2 max-w-[560px] mb-10"
            style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif", fontSize: 18, fontWeight: 300, color: "var(--muted2)", lineHeight: 1.7 }}
          >
            Paste your bill. Tap one button. GhostLaw finds what they owe you, writes the demand letter, and files the complaint — all in under 60 seconds. Works in <span style={{ color: "var(--white)", fontWeight: 500 }}>Nigeria 🇳🇬</span> and the <span style={{ color: "var(--white)", fontWeight: 500 }}>US 🇺🇸</span>. No lawyer. No cost. Real results.
          </p>

          <div className="fade-up-3 flex flex-wrap gap-4 items-center">
            <button onClick={() => openAuth("signup")} className="btn-primary" style={{ cursor: "none" }}>
              Get My Money Back — Free
            </button>
            <button onClick={() => scrollTo("how")} className="btn-ghost" style={{ cursor: "none" }}>
              See How It Works
            </button>
          </div>

          <div className="fade-up-4 flex flex-wrap gap-8 md:gap-12 mt-16 pt-10 border-t border-[rgba(255,255,255,0.1)] stats-4">
            {[
              { num: <>94<span style={{ color: "var(--red)" }}>%</span></>, label: "Win rate" },
              { num: <>60<span style={{ color: "var(--red)" }}>s</span></>, label: "Paste to complaint" },
              { num: <><span style={{ color: "var(--red)" }}>0</span> lawyers</>, label: "Needed" },
              { num: <><span style={{ color: "var(--red)" }}>$0</span></>, label: "Forever free" },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: 42, lineHeight: 1 }}>{s.num}</div>
                <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" as const, marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ MARQUEE ═══════════════════════════════════════ */}
      <div className="marquee-wrap">
        <div className="marquee-track">
          {[...Array(2)].map((_, rep) => (
            <span key={rep} className="flex">
              {["Bank Refund Claims 🇳🇬", "Medical Bill Recovery 🇺🇸", "One-Tap FCCPC Complaints 🇳🇬", "CFPB Filing in 60s 🇺🇸", "Overcharge Detection", "Loan App Harassment 🇳🇬", "Demand Letters That Work", "NERC Light Bill Disputes 🇳🇬", "Insurance Claim Recovery 🇺🇸", "MTN/Airtel Data Refunds 🇳🇬", "Money Back Guarantee Scripts", "Subscription Cancellation 🇺🇸"].map((text) => (
                <span key={`${rep}-${text}`} className="flex">
                  <span className="marquee-item">{text}</span>
                  <span className="marquee-item marquee-sep">{"///"}</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ═══ SCANNER DEMO ══════════════════════════════════ */}
      <section className="py-20 md:py-32 px-4 sm:px-6 md:px-12 bg-[var(--obsidian)] reveal relative overflow-hidden" id="scanner">
        <div
          className="photo-side-panel hidden lg:block"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1400&q=80")',
          }}
        />
        {/* Magnifying glass decoration */}
        <div className="float-shape hidden lg:block" style={{ top: "5%", right: "4%", width: 80, height: 80, opacity: 0.05, animation: "float-slow 10s ease-in-out infinite" }}>
          <svg viewBox="0 0 80 80" fill="none">
            <circle cx="35" cy="35" r="22" stroke="var(--red)" strokeWidth="1.5" />
            <line x1="50" y1="50" x2="70" y2="70" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="35" cy="35" r="12" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3" />
          </svg>
        </div>
        <div className="glow-orb hidden md:block" style={{ width: 280, height: 280, top: "30%", left: "-5%", background: "rgba(232,25,44,0.04)", animation: "glow-pulse 8s ease-in-out 1s infinite" }} />
        <div className="max-w-6xl mx-auto relative z-10">
          <div
            className="flex items-center gap-3 mb-4"
            style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: "var(--red)" }}
          >
            <span className="w-5 h-[1px] bg-[var(--red)]" />
            Core Weapon
          </div>
          <h2 style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: "clamp(48px, 6vw, 80px)", lineHeight: 1 }}>
            PASTE. CLICK.<br />
            <span style={{ WebkitTextStroke: "1px rgba(255,255,255,0.2)", color: "transparent" }}>DONE.</span>
          </h2>

          <div className="scanner-chrome mt-10">
            <div className="scanner-header-bar">
              <div className="dot-group">
                <div className="dot-r" />
                <div className="dot-y" />
                <div className="dot-g" />
              </div>
              <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, color: "var(--muted)", letterSpacing: "0.05em" }}>
                ghostlaw_scanner — v2.4.1
              </div>
              <div className="status-indicator">
                <div className="status-dot" />
                AI Ready
              </div>
            </div>

            <div className="grid md:grid-cols-2 scanner-body-grid" style={{ minHeight: 420 }}>
              {/* Input side */}
              <div className="p-6 md:border-r border-[var(--border)] flex flex-col gap-5">
                <div>
                  <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--muted)", marginBottom: 10 }}>
                    Quick Start
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["Medical Bill", "Lease", "Phone Contract", "Insurance", "Subscription"].map((t, i) => (
                      <span key={t} className={`template-chip ${i === 0 ? "active" : ""}`}>{t}</span>
                    ))}
                  </div>
                </div>

                <div
                  className="flex-1 glass-card p-4 min-h-[200px]"
                  style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 13, lineHeight: 1.7, color: "var(--muted2)" }}
                >
                  <span style={{ color: "var(--white)" }}>ITEMIZED MEDICAL BILL — Memorial Hospital</span><br /><br />
                  Emergency Room Visit (Level 3)...........$850.00<br />
                  Facility Fee (undisclosed).....................$420.00<br />
                  Blood Panel — Comprehensive...............$230.00<br />
                  Physician Consultation (CPT 99213).......$145.00<br />
                  Physician Consultation (CPT 99213).......$145.00{" "}
                  <span style={{ color: "var(--red)" }}>← DUPLICATE</span><br /><br />
                  AMOUNT DUE: <span style={{ color: "var(--white)" }}>$1,335.00</span>
                </div>

                <button
                  onClick={() => openAuth("signup")}
                  className="btn-primary flex items-center justify-center gap-2.5 w-full py-4"
                  style={{ cursor: "none" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                  Analyze & Find What They Owe Me
                </button>
              </div>

              {/* Results side */}
              <div className="p-6 flex flex-col gap-3">
                <div className="flex items-center justify-between mb-1">
                  <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--muted2)" }}>
                    Findings — 3 Issues
                  </div>
                  <span className="badge badge-critical">Critical</span>
                </div>

                <div className="finding-card critical">
                  <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--red)", marginBottom: 6 }}>Critical · Hidden Charge</div>
                  <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Facility Fee Not Disclosed</div>
                  <div style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif", fontSize: 12, color: "var(--muted2)", lineHeight: 1.6 }}>
                    A $420 &ldquo;facility fee&rdquo; was added without prior disclosure, violating the No Surprises Act. This charge is legally disputable.
                  </div>
                  <div style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: 24, color: "var(--red)", marginTop: 8 }}>−$420</div>
                </div>

                <div className="finding-card warning">
                  <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "#e8c541", marginBottom: 6 }}>Warning · Billing Code</div>
                  <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Duplicate Procedure Code</div>
                  <div style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif", fontSize: 12, color: "var(--muted2)", lineHeight: 1.6 }}>
                    CPT code 99213 appears twice on the same date of service. This is a known billing error that is almost always reversed.
                  </div>
                  <div style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: 24, color: "#e8c541", marginTop: 8 }}>−$185</div>
                </div>

                <div className="finding-card info">
                  <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "#4178e8", marginBottom: 6 }}>Info · Coverage Gap</div>
                  <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Medicare-Covered Service Billed</div>
                  <div style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif", fontSize: 12, color: "var(--muted2)", lineHeight: 1.6 }}>
                    The blood panel (CPT 80053) is covered under Medicare Part B with zero patient liability.
                  </div>
                  <div style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: 24, color: "#4178e8", marginTop: 8 }}>−$230</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ══════════════════════════════════════ */}
      <section className="py-20 md:py-32 px-4 sm:px-6 md:px-12 bg-[var(--black)] reveal relative overflow-hidden" id="features">
        {/* Decorative background elements */}
        <div className="glow-orb hidden md:block" style={{ width: 400, height: 400, top: "-10%", right: "-5%", background: "rgba(232,25,44,0.04)", animation: "glow-pulse 10s ease-in-out infinite" }} />
        <div className="float-shape hidden lg:block" style={{ top: "15%", right: "5%", width: 80, height: 80, opacity: 0.04, animation: "float-slow 9s ease-in-out infinite" }}>
          <svg viewBox="0 0 80 80" fill="none"><rect x="5" y="5" width="70" height="70" rx="2" stroke="var(--red)" strokeWidth="1" strokeDasharray="6 4" /><rect x="20" y="20" width="40" height="40" rx="1" stroke="currentColor" strokeWidth="0.5" /></svg>
        </div>
        <div className="float-shape hidden md:block" style={{ bottom: "10%", left: "3%", width: 60, height: 60, opacity: 0.05, animation: "float-reverse 11s ease-in-out infinite" }}>
          <svg viewBox="0 0 60 60" fill="none"><polygon points="30,5 55,50 5,50" stroke="var(--red)" strokeWidth="1" fill="rgba(232,25,44,0.05)" /></svg>
        </div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div
            className="flex items-center gap-3 mb-4"
            style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: "var(--red)" }}
          >
            <span className="w-5 h-[1px] bg-[var(--red)]" />
            What You Get
          </div>
          <h2 style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: "clamp(48px, 6vw, 80px)", lineHeight: 1 }}>
            EVERYTHING<br />
            <span style={{ WebkitTextStroke: "1px rgba(255,255,255,0.2)", color: "transparent" }}>YOU NEED TO WIN</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-[1px] bg-[var(--border)] mt-10 border border-[var(--border)] features-grid-3">
            {[
              { num: "01", icon: "�", title: "Demand Letters", desc: "AI writes a legal demand letter that sounds like it came from a lawyer. Companies take these seriously." },
              { num: "02", icon: "📞", title: "Call Scripts", desc: "Exactly what to say when you call. Word-for-word. Including what to do when they try to shut you down." },
              { num: "03", icon: "🏛️", title: "One-Tap Complaints", desc: "File directly to CFPB, FCCPC, CBN, NCC, NERC — with pre-filled text. One tap. Companies respond FAST." },
              { num: "04", icon: "⏱️", title: "Escalation Deadlines", desc: "\"If unresolved in 7 days, this escalates to [REGULATOR].\" Fear factor that actually works." },
              { num: "05", icon: "💰", title: "Money Recovery Tracker", desc: "Track every naira and dollar you recover. See your total savings. Share your wins on WhatsApp and Twitter." },
              { num: "06", icon: "⚡", title: "60-Second Setup", desc: "Pick your issue. Answer 2 questions. Get your demand letter, call script, and complaint — all generated instantly." },
            ].map((f) => (
              <div key={f.num} className="feature-card group">
                <div
                  className="absolute top-3 right-5 group-hover:text-[rgba(232,25,44,0.08)] transition-colors"
                  style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: 80, lineHeight: 1, color: "rgba(255,255,255,0.03)" }}
                >
                  {f.num}
                </div>
                <div className="w-10 h-10 border border-[rgba(255,255,255,0.12)] group-hover:border-[var(--red)] flex items-center justify-center mb-5 relative z-10 transition-colors text-lg glass-card">
                  {f.icon}
                </div>
                <div className="relative z-10" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 14, fontWeight: 600, marginBottom: "0.75rem", letterSpacing: "0.02em" }}>
                  {f.title}
                </div>
                <div className="relative z-10 group-hover:text-[var(--muted2)] transition-colors" style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif", fontSize: 13, fontWeight: 300, color: "var(--muted)", lineHeight: 1.7 }}>
                  {f.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ══════════════════════════════════ */}
      <section className="py-20 md:py-32 px-4 sm:px-6 md:px-12 bg-[var(--obsidian)] reveal relative overflow-hidden" id="how">
        {/* Floating gavel icon */}
        <div className="float-shape hidden lg:block" style={{ top: "8%", right: "6%", width: 100, height: 100, opacity: 0.05, animation: "float-drift 14s ease-in-out infinite" }}>
          <svg viewBox="0 0 100 100" fill="none">
            <rect x="35" y="10" width="30" height="14" rx="3" stroke="var(--red)" strokeWidth="1.5" transform="rotate(-30 50 17)" fill="rgba(232,25,44,0.08)" />
            <line x1="50" y1="24" x2="50" y2="65" stroke="currentColor" strokeWidth="1.5" />
            <ellipse cx="50" cy="70" rx="20" ry="5" stroke="currentColor" strokeWidth="1" fill="rgba(232,25,44,0.05)" />
          </svg>
        </div>
        {/* Animated connector line */}
        <div className="float-shape hidden md:block" style={{ top: "50%", left: "2%", width: 150, height: 100, opacity: 0.04 }}>
          <svg viewBox="0 0 150 100" fill="none">
            <path d="M10 10 Q75 50 140 10 Q75 -30 10 10" stroke="var(--red)" strokeWidth="0.8" strokeDasharray="4 4" style={{ animation: "dash-flow 6s linear infinite" }} />
          </svg>
        </div>
        <div className="glow-orb hidden md:block" style={{ width: 250, height: 250, bottom: "5%", left: "15%", background: "rgba(232,25,44,0.05)", animation: "glow-pulse 9s ease-in-out 1s infinite" }} />
        <div className="max-w-6xl mx-auto relative z-10">
          <div
            className="flex items-center gap-3 mb-4"
            style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: "var(--red)" }}
          >
            <span className="w-5 h-[1px] bg-[var(--red)]" />
            Process
          </div>
          <h2 style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: "clamp(48px, 6vw, 80px)", lineHeight: 1 }}>
            THREE STEPS TO<br />
            <span style={{ WebkitTextStroke: "1px rgba(255,255,255,0.2)", color: "transparent" }}>YOUR MONEY</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-start mt-10 flow-grid-2">
            <div>
              {[
                { num: "01", label: "Paste", title: "Tell Us What Happened", desc: "Paste your bill, screenshot a receipt, or just describe the problem in plain English. \"MTN debited me \u20a63,000 for data I never used.\" That's all we need." },
                { num: "02", label: "AI Finds It", title: "We Find What They Owe You", desc: "AI checks your case against consumer protection law. If there's a real violation, you'll know in seconds — with the exact law they broke and how much you're owed." },
                { num: "03", label: "Take Action", title: "Demand Letter + Complaint = Filed", desc: "Get a professional demand letter, a phone call script, and a pre-filled government complaint — all in one tap. Companies respond fast when regulators get involved." },
                { num: "04", label: "Get Paid", title: "Track Your Recovery", desc: "Track your case, mark your win, and share it. Most people get their money back within 7-30 days. Your first one is the hardest — after that you'll never let them cheat you again." },
              ].map((step) => (
                <div key={step.num} className="flow-step group">
                  <div
                    className="group-hover:text-[var(--red-dim)] transition-colors min-w-[50px]"
                    style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: 48, lineHeight: 1, color: "rgba(255,255,255,0.05)" }}
                  >
                    {step.num}
                  </div>
                  <div className="flex-1">
                    <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" as const, color: "var(--red)", marginBottom: 6 }}>
                      {step.label}
                    </div>
                    <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
                      {step.title}
                    </div>
                    <div style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif", fontSize: 13, fontWeight: 300, color: "var(--muted)", lineHeight: 1.6 }}>
                      {step.desc}
                    </div>
                  </div>
                  <div className="text-[var(--muted)] text-lg self-center group-hover:text-[var(--red)] group-hover:translate-x-1 transition-all">→</div>
                </div>
              ))}
            </div>

            {/* Letter preview */}
            <div className="letter-preview">
              <div className="bg-[var(--surface2)] px-5 py-3 border-b border-[var(--border)] flex items-center justify-between">
                <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--red)" }}>
                  ⚡ Dispute Letter Generated
                </div>
                <div className="flex gap-2">
                  <span className="btn-sm">Copy</span>
                  <span className="btn-sm">Download</span>
                </div>
              </div>
              <div className="p-5" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, lineHeight: 1.9, color: "var(--muted2)" }}>
                <span style={{ color: "var(--muted2)" }}>March 15, 2025</span><br /><br />
                <span style={{ color: "var(--muted)" }}>Billing Department</span><br />
                <span style={{ color: "var(--muted)" }}>Memorial Hospital System</span><br /><br />
                <span style={{ color: "var(--white)", fontWeight: 600 }}>RE: FORMAL DISPUTE — Account #88274-X</span><br />
                <span style={{ color: "var(--white)", fontWeight: 600 }}>Disputed Amount: <span style={{ color: "var(--red)" }}>$835.00</span></span><br /><br />
                To Whom It May Concern,<br /><br />
                I am writing to formally dispute charges on the above account.
                Under the <span className="highlight-text">No Surprises Act (42 U.S.C. § 300gg-131)</span>, patients must
                receive advance notice of facility fees. No such notice was provided.<br /><br />
                Additionally, CPT code 99213 appears <span className="highlight-text">twice on the same date of service</span> — a billing error I am disputing under
                the <span className="highlight-text">Fair Debt Collection Practices Act</span>.<br /><br />
                Total correction required: <span style={{ color: "var(--red)", fontWeight: 600 }}>$835</span>
                <span className="letter-cursor" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ HISTORY TABLE ═════════════════════════════════ */}
      <section className="py-20 md:py-32 px-4 sm:px-6 md:px-12 bg-[var(--black)] reveal relative overflow-hidden">
        {/* Dollar sign watermark */}
        <div className="float-shape hidden lg:block" style={{ top: "8%", left: "3%", width: 100, height: 120, opacity: 0.03, animation: "float-reverse 13s ease-in-out infinite" }}>
          <svg viewBox="0 0 100 120" fill="none">
            <text x="50" y="90" textAnchor="middle" fill="var(--red)" fontFamily="var(--font-bebas-neue)" fontSize="100" opacity="0.4">$</text>
          </svg>
        </div>
        <div className="glow-orb hidden md:block" style={{ width: 300, height: 300, bottom: "-10%", right: "10%", background: "rgba(232,25,44,0.03)", animation: "glow-pulse 7s ease-in-out 2s infinite" }} />
        <div className="max-w-6xl mx-auto relative z-10">
          <div
            className="flex items-center gap-3 mb-4"
            style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: "var(--red)" }}
          >
            <span className="w-5 h-[1px] bg-[var(--red)]" />
            Case Files
          </div>
          <h2 style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: "clamp(48px, 6vw, 80px)", lineHeight: 1 }}>
            YOUR WINS<br />
            <span style={{ WebkitTextStroke: "1px rgba(255,255,255,0.2)", color: "transparent" }}>ON RECORD</span>
          </h2>

          <div className="mt-10 border border-[var(--border)] overflow-hidden">
            {/* Header */}
            <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] bg-[var(--surface2)] border-b border-[var(--border)]">
              {["Case", "Company", "Amount", "Filed", "Status"].map((h) => (
                <div key={h} className="px-5 py-3 border-r border-[var(--border)] last:border-r-0" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" as const, color: "var(--muted)" }}>
                  {h}
                </div>
              ))}
            </div>
            {/* Rows */}
            {[
              { case_: "Medical Bill — Facility Fee", co: "St. Mary's Hospital", amt: "$835", date: "Mar 12", status: "won" },
              { case_: "Unauthorized Subscription", co: "StreamMax Inc.", amt: "$156", date: "Mar 8", status: "won" },
              { case_: "Lease — Illegal Late Fee", co: "Arbor Property Mgmt", amt: "$300", date: "Feb 28", status: "pending" },
              { case_: "Insurance Claim Denial", co: "BlueCross Shield", amt: "$2,400", date: "Feb 19", status: "sent" },
              { case_: "Phone Overcharge — Data", co: "Verizon Wireless", amt: "$89", date: "Feb 11", status: "won" },
            ].map((r, i) => (
              <div key={i} className="grid grid-cols-[2fr_1fr_1fr] md:grid-cols-[2fr_1.5fr_1fr_1fr_1fr] border-b border-[var(--border)] hover:bg-[var(--surface)] transition-colors" style={{ animation: `row-in 0.5s ease ${i * 0.1}s both` }}>
                <div className="px-5 py-3.5 border-r border-[var(--border)]" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, fontWeight: 500 }}>
                  {r.case_}
                </div>
                <div className="hidden md:flex items-center px-5 py-3.5 border-r border-[var(--border)]" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, color: "var(--muted2)" }}>
                  {r.co}
                </div>
                <div className="px-5 py-3.5 border-r border-[var(--border)]" style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: 16, color: "var(--red)" }}>
                  {r.amt}
                </div>
                <div className="hidden md:flex items-center px-5 py-3.5 border-r border-[var(--border)]" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, color: "var(--muted)" }}>
                  {r.date}
                </div>
                <div className="px-5 py-3.5 flex items-center">
                  <span className={`pill ${r.status === "won" ? "pill-won" : r.status === "pending" ? "pill-pending" : "pill-sent"}`}>
                    {r.status === "won" ? "Won ✓" : r.status === "pending" ? "Pending" : "Sent"}
                  </span>
                </div>
              </div>
            ))}
            {/* Summary */}
            <div className="bg-[var(--surface2)] px-5 py-3 flex flex-wrap items-center justify-between gap-3">
              <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, color: "var(--muted)" }}>
                5 cases · 3 wins · 1 pending · 1 sent
              </div>
              <div style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: 22, color: "var(--red)" }}>
                $1,380 recovered
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ WHO IT'S FOR — DUAL MARKET ═════════════════ */}
      <section className="py-20 md:py-32 px-4 sm:px-6 md:px-12 bg-[var(--obsidian)] reveal relative overflow-hidden" id="guide">
        <div
          className="photo-spotlight hidden xl:block"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80")',
          }}
        />
        {/* Globe-like decoration */}
        <div className="float-shape hidden lg:block" style={{ top: "10%", left: "4%", width: 140, height: 140, opacity: 0.04, animation: "float-slow 12s ease-in-out infinite" }}>
          <svg viewBox="0 0 140 140" fill="none">
            <circle cx="70" cy="70" r="60" stroke="currentColor" strokeWidth="1" />
            <ellipse cx="70" cy="70" rx="35" ry="60" stroke="var(--red)" strokeWidth="0.8" />
            <ellipse cx="70" cy="70" rx="60" ry="25" stroke="currentColor" strokeWidth="0.5" />
            <line x1="70" y1="10" x2="70" y2="130" stroke="currentColor" strokeWidth="0.5" />
            <line x1="10" y1="70" x2="130" y2="70" stroke="currentColor" strokeWidth="0.5" />
          </svg>
        </div>
        <div className="glow-orb hidden md:block" style={{ width: 350, height: 350, top: "20%", right: "-5%", background: "rgba(232,25,44,0.04)", animation: "glow-pulse 11s ease-in-out 3s infinite" }} />
        <div className="float-shape hidden md:block" style={{ bottom: "8%", right: "8%", width: 5, height: 5, animation: "orbit 18s linear infinite" }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--red)", opacity: 0.35 }} />
        </div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div
            className="flex items-center gap-3 mb-4"
            style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: "var(--red)" }}
          >
            <span className="w-5 h-[1px] bg-[var(--red)]" />
            Who It&apos;s For
          </div>
          <h2 style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: "clamp(48px, 6vw, 80px)", lineHeight: 1 }}>
            BUILT FOR<br />
            <span style={{ WebkitTextStroke: "1px rgba(255,255,255,0.2)", color: "transparent" }}>REAL PEOPLE</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-6 mt-10">
            {/* Nigeria card */}
            <div className="p-8 relative overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="absolute top-4 right-5" style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: 100, lineHeight: 1, color: "rgba(255,255,255,0.02)" }}>🇳🇬</div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <span style={{ fontSize: 32 }}>🇳🇬</span>
                  <div>
                    <h3 style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 16, fontWeight: 600 }}>For Nigerians</h3>
                    <p style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>FCCPA · CBN · NCC · NERC · NDPA</p>
                  </div>
                </div>
                <div className="space-y-3 mb-6">
                  {[
                    { icon: "🏦", title: "Bank debited you but money didn't arrive?", desc: "GhostLaw cites CBN's 24-72 hour refund mandate and writes the formal complaint." },
                    { icon: "📱", title: "MTN/Airtel eating your data & auto-subscribing you?", desc: "We draft your NCC complaint citing the Consumer Code of Practice." },
                    { icon: "⚡", title: "NEPA estimated billing you ₦47k for a 1-bedroom?", desc: "We reference NERC regulations on your right to metering and fair billing." },
                    { icon: "🚨", title: "Loan app harassing your contacts?", desc: "We build your case using NDPA 2023 data privacy violations + FCCPA defamation protections." },
                    { icon: "🏠", title: "Landlord trying to eject you illegally?", desc: "We cite Lagos Tenancy Law notice periods and self-help eviction illegality." },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span style={{ fontSize: 16, marginTop: 2 }}>{item.icon}</span>
                      <div>
                        <p style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{item.title}</p>
                        <p style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif", fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {["GTBank", "MTN", "IKEDC", "OKash", "Jumia", "DSTV", "Access Bank"].map((co) => (
                    <span key={co} className="px-2.5 py-1" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, color: "var(--muted)", border: "1px solid var(--border)", letterSpacing: "0.05em" }}>{co}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* USA card */}
            <div className="p-8 relative overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="absolute top-4 right-5" style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: 100, lineHeight: 1, color: "rgba(255,255,255,0.02)" }}>🇺🇸</div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <span style={{ fontSize: 32 }}>🇺🇸</span>
                  <div>
                    <h3 style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 16, fontWeight: 600 }}>For Americans</h3>
                    <p style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>FDCPA · FCRA · FCBA · FTC ACT</p>
                  </div>
                </div>
                <div className="space-y-3 mb-6">
                  {[
                    { icon: "🏥", title: "Hospital hit you with a surprise $420 facility fee?", desc: "GhostLaw cites the No Surprises Act and drafts a formal dispute letter with exact legal references." },
                    { icon: "📞", title: "Phone company cramming fees onto your bill?", desc: "We build your FCC complaint and generate a call script to the retention department." },
                    { icon: "🏠", title: "Lease has illegal late fees or waived-rights clauses?", desc: "We flag every unenforceable clause and draft a letter citing your state tenant protections." },
                    { icon: "💳", title: "Credit card charging you for a cancelled subscription?", desc: "We cite FCBA and Regulation Z, draft the chargeback dispute, and guide you through CFPB filing." },
                    { icon: "🛡️", title: "Insurance denied your claim as 'not medically necessary'?", desc: "We build your appeal referencing your policy terms and state insurance regulations." },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span style={{ fontSize: 16, marginTop: 2 }}>{item.icon}</span>
                      <div>
                        <p style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{item.title}</p>
                        <p style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif", fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {["CFPB", "FCC", "FTC", "State AG", "Medicare", "Comcast", "Chase"].map((co) => (
                    <span key={co} className="px-2.5 py-1" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, color: "var(--muted)", border: "1px solid var(--border)", letterSpacing: "0.05em" }}>{co}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ HOW TO USE — STEP BY STEP GUIDE ═══════════════ */}
      <section className="py-20 md:py-32 px-4 sm:px-6 md:px-12 bg-[var(--black)] reveal">
        <div className="max-w-6xl mx-auto">
          <div
            className="flex items-center gap-3 mb-4"
            style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: "var(--red)" }}
          >
            <span className="w-5 h-[1px] bg-[var(--red)]" />
            User Guide
          </div>
          <h2 style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: "clamp(48px, 6vw, 80px)", lineHeight: 1, marginBottom: 12 }}>
            HOW TO<br />
            <span style={{ WebkitTextStroke: "1px rgba(255,255,255,0.2)", color: "transparent" }}>USE IT</span>
          </h2>
          <p style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif", fontSize: 15, color: "var(--muted2)", lineHeight: 1.7, maxWidth: 600, marginBottom: 40 }}>
            Whether you&apos;re in Lagos or Los Angeles, the process is the same. Here&apos;s how to get your money back in minutes.
          </p>

          <div className="space-y-6">
            {/* Step 1 */}
            <div className="p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="flex items-start gap-5">
                <div style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: 48, lineHeight: 1, color: "rgba(232,25,44,0.15)", minWidth: 50 }}>01</div>
                <div className="flex-1">
                  <h3 style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
                    Sign Up Free & Pick Your Country
                  </h3>
                  <p style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif", fontSize: 13, color: "var(--muted)", lineHeight: 1.7, marginBottom: 12 }}>
                    Create a free account (email + password, takes 10 seconds). Then use the <span style={{ color: "var(--white)" }}>🇺🇸/🇳🇬 toggle</span> in the sidebar to switch between US and Nigeria mode. This tells the AI which laws and agencies apply to your situation.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
                      <p style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, color: "var(--red)", letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 4 }}>🇳🇬 Nigeria Mode</p>
                      <p style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, color: "var(--muted)" }}>Cites FCCPA, CBN Framework, NCC Code, NERC Standards, NDPA 2023, Lagos Tenancy Law</p>
                    </div>
                    <div className="p-3" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
                      <p style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, color: "#4178e8", letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 4 }}>🇺🇸 USA Mode</p>
                      <p style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, color: "var(--muted)" }}>Cites FDCPA, FCRA, FCBA, No Surprises Act, FTC Act, state-level protections</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="flex items-start gap-5">
                <div style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: 48, lineHeight: 1, color: "rgba(232,25,44,0.15)", minWidth: 50 }}>02</div>
                <div className="flex-1">
                  <h3 style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
                    Paste Your Bill, Contract, or Describe What Happened
                  </h3>
                  <p style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif", fontSize: 13, color: "var(--muted)", lineHeight: 1.7, marginBottom: 12 }}>
                    Use a <span style={{ color: "var(--white)" }}>Quick Template</span> to get started fast, or paste your actual document/bill text, or just describe your situation in plain English. You can also upload a photo or PDF.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="template-chip">🇳🇬 Bank Reversal</span>
                    <span className="template-chip">🇳🇬 Loan App</span>
                    <span className="template-chip">🇳🇬 Light Bill</span>
                    <span className="template-chip">🇺🇸 Medical Bill</span>
                    <span className="template-chip">🇺🇸 Lease</span>
                    <span className="template-chip">🇺🇸 Insurance</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="flex items-start gap-5">
                <div style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: 48, lineHeight: 1, color: "rgba(232,25,44,0.15)", minWidth: 50 }}>03</div>
                <div className="flex-1">
                  <h3 style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
                    AI Scans & Finds Every Problem
                  </h3>
                  <p style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif", fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>
                    Hit <span style={{ color: "var(--red)", fontWeight: 600 }}>&ldquo;Analyze & Generate Dispute&rdquo;</span> and the AI cross-references your document against consumer protection laws specific to your country. It flags hidden fees, illegal clauses, overcharges, and tells you exactly how much you can recover.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="flex items-start gap-5">
                <div style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: 48, lineHeight: 1, color: "rgba(232,25,44,0.15)", minWidth: 50 }}>04</div>
                <div className="flex-1">
                  <h3 style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
                    Get Your Weapons — Dispute Letter, Call Script, Complaint
                  </h3>
                  <p style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif", fontSize: 13, color: "var(--muted)", lineHeight: 1.7, marginBottom: 12 }}>
                    GhostLaw generates three powerful tools, all customized to your specific situation:
                  </p>
                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="p-3" style={{ background: "var(--surface2)", borderLeft: "2px solid var(--red)" }}>
                      <p style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, fontWeight: 600, marginBottom: 4 }}>✉ Dispute Letter</p>
                      <p style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, color: "var(--muted)" }}>Legal demand letter citing exact laws. Download as PDF, send via Email or WhatsApp.</p>
                    </div>
                    <div className="p-3" style={{ background: "var(--surface2)", borderLeft: "2px solid #4178e8" }}>
                      <p style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, fontWeight: 600, marginBottom: 4 }}>☎ Call Script</p>
                      <p style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, color: "var(--muted)" }}>Word-for-word script for calling the company. Opening, key points, escalation phrases.</p>
                    </div>
                    <div className="p-3" style={{ background: "var(--surface2)", borderLeft: "2px solid #e8c541" }}>
                      <p style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, fontWeight: 600, marginBottom: 4 }}>⚖ Regulatory Complaint</p>
                      <p style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, color: "var(--muted)" }}>File with FCCPC/CBN/NCC (🇳🇬) or CFPB/FCC/FTC (🇺🇸). Includes filing steps.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 5 */}
            <div className="p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="flex items-start gap-5">
                <div style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: 48, lineHeight: 1, color: "rgba(232,25,44,0.15)", minWidth: 50 }}>05</div>
                <div className="flex-1">
                  <h3 style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
                    Send, Share & Track Your Win
                  </h3>
                  <p style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif", fontSize: 13, color: "var(--muted)", lineHeight: 1.7, marginBottom: 12 }}>
                    Send your dispute via <span style={{ color: "var(--white)" }}>Email</span>, share via <span style={{ color: "#25D366" }}>WhatsApp</span>, or download as <span style={{ color: "var(--red)" }}>PDF</span>. Track all your cases in the History tab and mark outcomes as they resolve. GhostLaw shows you how much you&apos;ve saved.
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="pill pill-won">Won ✓</span>
                    <span className="pill pill-pending">Pending</span>
                    <span className="pill pill-sent">Sent</span>
                    <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, color: "var(--muted)" }}>← Track every case</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══════════════════════════════════════════ */}
      <section className="py-20 md:py-32 px-4 sm:px-6 md:px-12 bg-[var(--obsidian)] text-center relative overflow-hidden reveal">
        <div
          className="photo-backdrop"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80")',
            opacity: 0.26,
          }}
        />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(232,25,44,0.08) 0%, transparent 70%)" }} />
        {/* Converging arrows / energy lines */}
        <div className="float-shape hidden md:block" style={{ top: "15%", left: "8%", width: 160, height: 80, opacity: 0.06, animation: "float-slow 7s ease-in-out infinite" }}>
          <svg viewBox="0 0 160 80" fill="none">
            <path d="M0 40 H50 L70 20 H120" stroke="var(--red)" strokeWidth="1.5" strokeDasharray="6 4" style={{ animation: "dash-flow 3s linear infinite" }} />
            <path d="M0 60 H40 L60 40 H110" stroke="currentColor" strokeWidth="0.8" strokeDasharray="4 4" style={{ animation: "dash-flow 4s linear infinite" }} />
            <polygon points="120,20 130,17 130,23" fill="var(--red)" opacity="0.6" />
          </svg>
        </div>
        <div className="float-shape hidden md:block" style={{ top: "15%", right: "8%", width: 160, height: 80, opacity: 0.06, animation: "float-reverse 7s ease-in-out infinite", transform: "scaleX(-1)" }}>
          <svg viewBox="0 0 160 80" fill="none">
            <path d="M0 40 H50 L70 20 H120" stroke="var(--red)" strokeWidth="1.5" strokeDasharray="6 4" style={{ animation: "dash-flow 3s linear infinite" }} />
            <path d="M0 60 H40 L60 40 H110" stroke="currentColor" strokeWidth="0.8" strokeDasharray="4 4" style={{ animation: "dash-flow 4s linear infinite" }} />
            <polygon points="120,20 130,17 130,23" fill="var(--red)" opacity="0.6" />
          </svg>
        </div>
        {/* Large bottom glow */}
        <div className="glow-orb" style={{ width: 500, height: 300, bottom: "-10%", left: "50%", transform: "translateX(-50%)", background: "rgba(232,25,44,0.08)", animation: "glow-pulse 5s ease-in-out infinite" }} />
        {/* Floating corner diamonds */}
        <div className="float-shape hidden md:block" style={{ bottom: "20%", left: "5%", width: 30, height: 30, opacity: 0.08, animation: "float-drift 9s ease-in-out infinite" }}>
          <svg viewBox="0 0 30 30" fill="none"><rect x="5" y="5" width="20" height="20" stroke="var(--red)" strokeWidth="1" transform="rotate(45 15 15)" /></svg>
        </div>
        <div className="float-shape hidden md:block" style={{ bottom: "25%", right: "5%", width: 24, height: 24, opacity: 0.08, animation: "float-drift 11s ease-in-out 2s infinite" }}>
          <svg viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" stroke="var(--red)" strokeWidth="1" transform="rotate(45 12 12)" /></svg>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto glass-panel px-6 py-10 md:px-10 md:py-14">
          <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: "var(--red)", marginBottom: "1.5rem" }}>
            No Lawyers. No Fees. Real Results.
          </div>
          <h2 style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: "clamp(56px, 8vw, 100px)", lineHeight: 0.95, marginBottom: "1.5rem" }}>
            GET YOUR<br />
            <span style={{ WebkitTextStroke: "1px rgba(255,255,255,0.15)", color: "transparent" }}>MONEY</span><br />
            BACK
          </h2>
          <p className="max-w-[540px] mx-auto mb-10" style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif", fontSize: 16, fontWeight: 300, color: "var(--muted2)", lineHeight: 1.7 }}>
            Whether it&apos;s a hospital in Houston or a bank in Lagos — you shouldn&apos;t need a lawyer to stop getting cheated. GhostLaw finds what they owe you and helps you get it back. In 60 seconds. Free. Forever.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={() => openAuth("signup")} className="btn-primary" style={{ cursor: "none" }}>
              Get My Money Back — Free
            </button>
            <button onClick={() => openAuth("login")} className="btn-ghost" style={{ cursor: "none" }}>
              Sign In
            </button>
          </div>
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-2 border border-[var(--border)] px-4 py-2" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--muted)" }}>
              <span className="w-1.5 h-1.5 bg-[#41e866] rounded-full" style={{ animation: "blink 2s ease-in-out infinite" }} />
              100% Free · 60 Seconds · No Lawyer Needed
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ════════════════════════════════════════ */}
      <footer className="px-4 sm:px-6 md:px-12 py-6 border-t border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-3">
        <div
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: 24, letterSpacing: "0.05em" }}
        >
          Ghost<span style={{ color: "var(--red)" }}>Law</span>
        </div>
        <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, color: "var(--muted)", letterSpacing: "0.05em" }}>
          Get your money back · Free forever
        </div>
        <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, color: "var(--surface3)" }}>
          © 2026 GhostLaw
        </div>
      </footer>

      {/* ═══ AUTH MODAL ════════════════════════════════════ */}
      <AnimatePresence>
        {showAuth && (
          <AuthModal
            mode={authMode}
            onClose={() => setShowAuth(false)}
            onSuccess={() => { setShowAuth(false); setIsLoggedIn(true); }}
            onSwitchMode={() => setAuthMode(authMode === "login" ? "signup" : "login")}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
