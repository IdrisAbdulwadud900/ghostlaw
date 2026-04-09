"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import AuthModal from "@/components/AuthModal";
import AppDashboard from "@/components/AppDashboard";
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
        className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-6 md:px-12 py-5"
        style={{
          background: "linear-gradient(to bottom, rgba(6,6,8,0.95), transparent)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div className="flex items-center gap-2.5" style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: 28, letterSpacing: "0.05em" }}>
          Ghost<span style={{ color: "var(--red)" }}>Law</span>
          <span className="logo-dot" />
        </div>

        <ul className="hidden md:flex gap-8 list-none" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" as const }}>
          <li><button onClick={() => scrollTo("scanner")} className="text-[var(--muted)] hover:text-white transition-colors" style={{ cursor: "none" }}>Scanner</button></li>
          <li><button onClick={() => scrollTo("features")} className="text-[var(--muted)] hover:text-white transition-colors" style={{ cursor: "none" }}>Arsenal</button></li>
          <li><button onClick={() => scrollTo("how")} className="text-[var(--muted)] hover:text-white transition-colors" style={{ cursor: "none" }}>How It Works</button></li>
        </ul>

        <button
          onClick={() => openAuth("signup")}
          className="text-[var(--black)] bg-[var(--red)] hover:bg-[#ff2d42] px-5 py-2.5 transition-all hover:-translate-y-[1px]"
          style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, cursor: "none" }}
        >
          Fight Back — Free
        </button>
      </nav>

      {/* ═══ HERO ══════════════════════════════════════════ */}
      <section className="min-h-screen flex flex-col justify-center px-6 md:px-12 pt-32 pb-16 relative overflow-hidden" id="home">
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

        <div className="relative z-10">
          <div
            className="fade-up flex items-center gap-3 mb-6"
            style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: "var(--red)" }}
          >
            <span className="w-10 h-[1px] bg-[var(--red)]" />
            AI Consumer Protection
          </div>

          <h1
            className="fade-up-1 leading-[0.92] mb-4"
            style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: "clamp(72px, 10vw, 140px)", letterSpacing: "0.01em" }}
          >
            STOP<br />
            GETTING<br />
            <span style={{ color: "var(--red)" }}>RIPPED</span><br />
            <span style={{ WebkitTextStroke: "1px rgba(255,255,255,0.3)", color: "transparent" }}>OFF</span>
          </h1>

          <p
            className="fade-up-2 max-w-[540px] mb-10"
            style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif", fontSize: 18, fontWeight: 300, color: "var(--muted2)", lineHeight: 1.7 }}
          >
            GhostLaw scans your contracts, bills, and policies for illegal clauses and hidden fees — then generates the legal firepower to fight back. No lawyer needed. No cost. Ever.
          </p>

          <div className="fade-up-3 flex flex-wrap gap-4 items-center">
            <button onClick={() => scrollTo("scanner")} className="btn-primary" style={{ cursor: "none" }}>
              Scan a Document
            </button>
            <button onClick={() => scrollTo("how")} className="btn-ghost" style={{ cursor: "none" }}>
              See How It Works
            </button>
          </div>

          <div className="fade-up-4 flex flex-wrap gap-8 md:gap-12 mt-16 pt-10 border-t border-[var(--border)] stats-4">
            {[
              { num: <>$2.<span style={{ color: "var(--red)" }}>4</span>B</>, label: "Disputed for users" },
              { num: <>94<span style={{ color: "var(--red)" }}>%</span></>, label: "Win rate on disputes" },
              { num: <>1.<span style={{ color: "var(--red)" }}>2</span>M</>, label: "Fights filed" },
              { num: <><span style={{ color: "var(--red)" }}>$0</span></>, label: "Cost to you" },
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
              {["Medical Bill Disputes", "Lease Clause Analysis", "CFPB Complaints", "Hidden Fee Detection", "Call Scripts", "FTC Filings", "Illegal Clause Flags", "Subscription Cancellations", "Insurance Disputes"].map((text) => (
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
      <section className="py-20 md:py-32 px-6 md:px-12 bg-[var(--obsidian)] reveal" id="scanner">
        <div className="max-w-6xl mx-auto">
          <div
            className="flex items-center gap-3 mb-4"
            style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: "var(--red)" }}
          >
            <span className="w-5 h-[1px] bg-[var(--red)]" />
            Core Weapon
          </div>
          <h2 style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: "clamp(48px, 6vw, 80px)", lineHeight: 1 }}>
            DOCUMENT<br />
            <span style={{ WebkitTextStroke: "1px rgba(255,255,255,0.2)", color: "transparent" }}>SCANNER</span>
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
                  className="flex-1 bg-[var(--surface2)] border border-[var(--border)] p-4 min-h-[200px]"
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
                  Analyze & Generate Dispute
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
      <section className="py-20 md:py-32 px-6 md:px-12 bg-[var(--black)] reveal" id="features">
        <div className="max-w-6xl mx-auto">
          <div
            className="flex items-center gap-3 mb-4"
            style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: "var(--red)" }}
          >
            <span className="w-5 h-[1px] bg-[var(--red)]" />
            Your Arsenal
          </div>
          <h2 style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: "clamp(48px, 6vw, 80px)", lineHeight: 1 }}>
            EVERY WEAPON<br />
            <span style={{ WebkitTextStroke: "1px rgba(255,255,255,0.2)", color: "transparent" }}>YOU NEED</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-[1px] bg-[var(--border)] mt-10 border border-[var(--border)] features-grid-3">
            {[
              { num: "01", icon: "📄", title: "Dispute Letters", desc: "Word-for-word legal demand letters customized to your situation, citing the exact laws that protect you." },
              { num: "02", icon: "📞", title: "Call Scripts", desc: "Exact scripts for every call — what to say, what to demand, and what to do if they push back." },
              { num: "03", icon: "🏛️", title: "Regulatory Filings", desc: "File formal complaints to CFPB, FCC, FTC, and state AGs with step-by-step guidance." },
              { num: "04", icon: "⏱️", title: "Post-Dispute Guidance", desc: "Deadlines, follow-up steps, escalation paths. Know exactly what to do after you send each letter." },
              { num: "05", icon: "📊", title: "Case Tracker", desc: "Every dispute tracked. Every win logged. Monitor your cases and see how much you've recovered." },
              { num: "06", icon: "⚡", title: "Quick Templates", desc: "Jump straight into common fights. Medical bills, leases, phone contracts — pre-loaded and ready." },
            ].map((f) => (
              <div key={f.num} className="feature-card group">
                <div
                  className="absolute top-3 right-5 group-hover:text-[rgba(232,25,44,0.08)] transition-colors"
                  style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: 80, lineHeight: 1, color: "rgba(255,255,255,0.03)" }}
                >
                  {f.num}
                </div>
                <div className="w-10 h-10 border border-[var(--border)] group-hover:border-[var(--red)] flex items-center justify-center mb-5 relative z-10 transition-colors text-lg">
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
      <section className="py-20 md:py-32 px-6 md:px-12 bg-[var(--obsidian)] reveal" id="how">
        <div className="max-w-6xl mx-auto">
          <div
            className="flex items-center gap-3 mb-4"
            style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: "var(--red)" }}
          >
            <span className="w-5 h-[1px] bg-[var(--red)]" />
            Process
          </div>
          <h2 style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: "clamp(48px, 6vw, 80px)", lineHeight: 1 }}>
            HOW YOU<br />
            <span style={{ WebkitTextStroke: "1px rgba(255,255,255,0.2)", color: "transparent" }}>WIN</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-start mt-10 flow-grid-2">
            <div>
              {[
                { num: "01", label: "Input", title: "Paste or Describe", desc: "Drop in your bill, contract, or just describe the situation in plain English. GhostLaw handles the rest." },
                { num: "02", label: "AI Analysis", title: "Deep Legal Scan", desc: "AI cross-references your document against consumer protection law, billing codes, and known company violations." },
                { num: "03", label: "Weapons", title: "Get Your Arsenal", desc: "Receive a dispute letter, call script, and regulatory filing instructions — ready to send in minutes." },
                { num: "04", label: "Execute", title: "Send & Track", desc: "Deploy your dispute and track the outcome. GhostLaw guides you through every follow-up step until you win." },
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
      <section className="py-20 md:py-32 px-6 md:px-12 bg-[var(--black)] reveal">
        <div className="max-w-6xl mx-auto">
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

      {/* ═══ CTA ═══════════════════════════════════════════ */}
      <section className="py-20 md:py-32 px-6 md:px-12 bg-[var(--obsidian)] text-center relative overflow-hidden reveal">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(232,25,44,0.08) 0%, transparent 70%)" }} />
        <div className="relative z-10">
          <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: "var(--red)", marginBottom: "1.5rem" }}>
            No Lawyers. No Fees. No Mercy.
          </div>
          <h2 style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: "clamp(56px, 8vw, 100px)", lineHeight: 0.95, marginBottom: "1.5rem" }}>
            FIGHT<br />
            <span style={{ WebkitTextStroke: "1px rgba(255,255,255,0.15)", color: "transparent" }}>BACK</span><br />
            NOW
          </h2>
          <p className="max-w-[500px] mx-auto mb-10" style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif", fontSize: 16, fontWeight: 300, color: "var(--muted2)", lineHeight: 1.7 }}>
            Regular people shouldn&apos;t need a lawyer to stop getting ripped off. GhostLaw levels the playing field. Free. Forever.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={() => openAuth("signup")} className="btn-primary" style={{ cursor: "none" }}>
              Start Your First Dispute
            </button>
            <button onClick={() => openAuth("login")} className="btn-ghost" style={{ cursor: "none" }}>
              Sign In
            </button>
          </div>
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-2 border border-[var(--border)] px-4 py-2" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--muted)" }}>
              <span className="w-1.5 h-1.5 bg-[#41e866] rounded-full" style={{ animation: "blink 2s ease-in-out infinite" }} />
              100% Free · No Account Required · No Paywall
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ════════════════════════════════════════ */}
      <footer className="px-6 md:px-12 py-6 border-t border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-3">
        <div style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: 24, letterSpacing: "0.05em" }}>
          Ghost<span style={{ color: "var(--red)" }}>Law</span>
        </div>
        <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, color: "var(--muted)", letterSpacing: "0.05em" }}>
          AI-powered consumer protection · Fight back for free
        </div>
        <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, color: "var(--surface3)" }}>
          © 2025 GhostLaw
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
