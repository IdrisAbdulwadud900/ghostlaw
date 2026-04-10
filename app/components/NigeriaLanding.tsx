"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import AuthModal from "@/components/AuthModal";
import AppDashboard from "@/components/AppDashboard";
import { getToken } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";

/* ═══════════════════════════════════════════════════════════
   SHARED NIGERIA LANDING LAYOUT
   Reusable shell for all Nigeria-specific SEO landing pages
   ═══════════════════════════════════════════════════════════ */

interface NigeriaLandingProps {
  /** page identifier for analytics */
  pageId: string;
  /** hero section — receives openAuth so CTA buttons work */
  heroRender: (openAuth: (mode: "login" | "signup") => void) => ReactNode;
  /** main content sections */
  children: ReactNode;
  /** structured data JSON-LD objects */
  structuredData?: object[];
}

export default function NigeriaLanding({ pageId, heroRender, children, structuredData }: NigeriaLandingProps) {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window !== "undefined") return !!getToken();
    return false;
  });

  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia("(pointer: coarse)").matches) return;
    let mx = 0, my = 0, rx = 0, ry = 0;
    const move = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      if (cursorRef.current) { cursorRef.current.style.left = mx + "px"; cursorRef.current.style.top = my + "px"; }
    };
    const raf = () => {
      rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12;
      if (ringRef.current) { ringRef.current.style.left = rx + "px"; ringRef.current.style.top = ry + "px"; }
      requestAnimationFrame(raf);
    };
    document.addEventListener("mousemove", move);
    requestAnimationFrame(raf);
    return () => document.removeEventListener("mousemove", move);
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll(".reveal").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [isLoggedIn]);

  if (isLoggedIn) {
    return <AppDashboard onLogout={() => setIsLoggedIn(false)} />;
  }

  const openAuth = (mode: "login" | "signup") => {
    trackEvent("open_auth_modal", { mode, page: pageId });
    setAuthMode(mode);
    setShowAuth(true);
  };

  return (
    <div className="relative" style={{ cursor: "none" }}>
      {structuredData?.map((sd, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(sd) }} />
      ))}

      <div ref={cursorRef} className="cursor-dot hidden md:block" />
      <div ref={ringRef} className="cursor-ring hidden md:block" />

      {/* NAV */}
      <nav
        className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-4 sm:px-6 md:px-12 py-4 md:py-5"
        style={{ background: "linear-gradient(to bottom, rgba(6,6,8,0.95), transparent)", backdropFilter: "blur(10px)" }}
      >
        <Link
          href="/"
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity no-underline"
          style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: 28, letterSpacing: "0.05em", cursor: "none", color: "var(--white)", textDecoration: "none" }}
        >
          Ghost<span style={{ color: "var(--red)" }}>Law</span>
          <span className="logo-dot" />
        </Link>

        <ul className="hidden md:flex gap-8 list-none" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          <li><Link href="/#how" className="text-[var(--muted)] hover:text-white transition-colors no-underline" style={{ cursor: "none" }}>How It Works</Link></li>
          <li><Link href="/#features" className="text-[var(--muted)] hover:text-white transition-colors no-underline" style={{ cursor: "none" }}>What You Get</Link></li>
          <li><Link href="/#scanner" className="text-[var(--muted)] hover:text-white transition-colors no-underline" style={{ cursor: "none" }}>Try It</Link></li>
        </ul>

        <button
          onClick={() => openAuth("signup")}
          className="text-[var(--black)] bg-[var(--red)] hover:bg-[#ff2d42] px-3 sm:px-5 py-2 sm:py-2.5 transition-all hover:-translate-y-[1px]"
          style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "none", whiteSpace: "nowrap" }}
        >
          Get My Money Back
        </button>
      </nav>

      {/* HERO */}
      {heroRender(openAuth)}

      {/* MARQUEE */}
      <div className="marquee-wrap">
        <div className="marquee-track">
          {[...Array(2)].map((_, rep) => (
            <span key={rep} className="flex">
              {["Bank Refund Claims 🇳🇬", "One-Tap FCCPC Complaints", "Loan App Harassment 🇳🇬", "NERC Light Bill Disputes", "MTN/Airtel Data Refunds 🇳🇬", "CBN Chargeback Letters", "NCC Consumer Code", "Get Your Money Back"].map((text) => (
                <span key={`${rep}-${text}`} className="flex">
                  <span className="marquee-item">{text}</span>
                  <span className="marquee-item marquee-sep">{"///"}</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* PAGE CONTENT */}
      {children}

      {/* CTA */}
      <section className="py-20 md:py-32 px-4 sm:px-6 md:px-12 bg-[var(--obsidian)] text-center relative overflow-hidden reveal">
        <div className="photo-backdrop" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80")', opacity: 0.22 }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(232,25,44,0.08) 0%, transparent 70%)" }} />
        <div className="glow-orb" style={{ width: 500, height: 300, bottom: "-10%", left: "50%", transform: "translateX(-50%)", background: "rgba(232,25,44,0.08)", animation: "glow-pulse 5s ease-in-out infinite" }} />

        <div className="relative z-10 max-w-4xl mx-auto glass-panel px-6 py-10 md:px-10 md:py-14">
          <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--red)", marginBottom: "1.5rem" }}>
            No Lawyers. No Fees. Real Results. 🇳🇬
          </div>
          <h2 style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: "clamp(48px, 8vw, 90px)", lineHeight: 0.95, marginBottom: "1.5rem" }}>
            COLLECT YOUR<br />
            <span style={{ WebkitTextStroke: "1px rgba(255,255,255,0.15)", color: "transparent" }}>MONEY</span><br />
            TODAY
          </h2>
          <p className="max-w-[540px] mx-auto mb-10" style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif", fontSize: 16, fontWeight: 300, color: "var(--muted2)", lineHeight: 1.7 }}>
            Whether it&apos;s GTBank, MTN, IKEDC, or a loan app — you don&apos;t need a lawyer. GhostLaw finds what they owe you and generates the demand letter and FCCPC complaint. Free. 60 seconds.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={() => openAuth("signup")} className="btn-primary" style={{ cursor: "none" }}>Get My Money Back — Free</button>
            <button onClick={() => openAuth("login")} className="btn-ghost" style={{ cursor: "none" }}>Sign In</button>
          </div>
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-2 border border-[var(--border)] px-4 py-2" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)" }}>
              <span className="w-1.5 h-1.5 bg-[#41e866] rounded-full" style={{ animation: "blink 2s ease-in-out infinite" }} />
              100% Free · 60 Seconds · Works in Nigeria
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-4 sm:px-6 md:px-12 py-6 border-t border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-3">
        <Link href="/" className="hover:opacity-80 transition-opacity no-underline" style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: 24, letterSpacing: "0.05em", color: "var(--white)", textDecoration: "none" }}>
          Ghost<span style={{ color: "var(--red)" }}>Law</span>
        </Link>
        <div className="flex flex-wrap gap-4" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, color: "var(--muted)", letterSpacing: "0.05em" }}>
          <Link href="/bank-reversal" className="hover:text-white transition-colors no-underline" style={{ color: "var(--muted)", textDecoration: "none" }}>Bank Reversals</Link>
          <Link href="/loan-app" className="hover:text-white transition-colors no-underline" style={{ color: "var(--muted)", textDecoration: "none" }}>Loan App Abuse</Link>
          <Link href="/telecom-refund" className="hover:text-white transition-colors no-underline" style={{ color: "var(--muted)", textDecoration: "none" }}>Telecom Refunds</Link>
        </div>
        <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, color: "var(--surface3)" }}>© 2026 GhostLaw</div>
      </footer>

      {/* AUTH MODAL */}
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
