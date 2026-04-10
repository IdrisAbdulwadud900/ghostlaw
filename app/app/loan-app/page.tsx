"use client";

import NigeriaLanding from "@/components/NigeriaLanding";

const faqData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is it legal for loan apps to call my contacts in Nigeria?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Under the Nigeria Data Protection Act (NDPA) 2023 and the FCCPA, loan apps cannot contact your family, friends, or colleagues about your loan. This is a clear data privacy violation and defamation. GhostLaw helps you file the complaint.",
      },
    },
    {
      "@type": "Question",
      name: "Can I report a loan app for threatening messages?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Threatening messages from loan apps violate FCCPA provisions against harassment and intimidation. GhostLaw generates a formal complaint to FCCPC and helps you document the evidence.",
      },
    },
    {
      "@type": "Question",
      name: "What is the maximum legal interest rate for loan apps in Nigeria?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "CBN-licensed lenders must follow approved interest rate guidelines. Many loan apps charge 30-40% for 7-day loans, which may constitute usury. GhostLaw identifies illegal interest rates and generates the regulatory complaint.",
      },
    },
  ],
};

export default function LoanAppPage() {
  return (
    <NigeriaLanding
      pageId="loan-app"
      structuredData={[faqData]}
      hero={
        <section className="min-h-screen flex flex-col justify-center px-4 sm:px-6 md:px-12 pt-24 sm:pt-32 pb-12 sm:pb-16 relative overflow-hidden">
          <div
            className="photo-backdrop"
            style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1600&q=80")' }}
          />
          <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(232,25,44,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(232,25,44,0.03) 1px, transparent 1px)", backgroundSize: "80px 80px", animation: "grid-drift 20s linear infinite" }} />
          <div className="absolute -top-[200px] -right-[200px] w-[800px] h-[800px]" style={{ background: "radial-gradient(circle, rgba(232,25,44,0.06) 0%, transparent 65%)", animation: "radial-breathe 6s ease-in-out infinite" }} />
          <div className="glow-orb hidden md:block" style={{ width: 200, height: 200, top: "55%", left: "12%", background: "rgba(232,25,44,0.12)", animation: "glow-pulse 6s ease-in-out infinite" }} />

          <div className="relative z-10 max-w-[760px] glass-panel p-6 md:p-10">
            <div className="fade-up flex items-center gap-3 mb-6" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--red)" }}>
              <span className="w-10 h-[1px] bg-[var(--red)]" />
              🇳🇬 Loan App Harassment
            </div>

            <h1 className="fade-up-1 leading-[0.92] mb-4" style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: "clamp(56px, 9vw, 115px)", letterSpacing: "0.01em" }}>
              LOAN APP<br />
              <span style={{ color: "var(--red)" }}>CALLING YOUR</span><br />
              <span style={{ WebkitTextStroke: "1px rgba(255,255,255,0.3)", color: "transparent" }}>CONTACTS?</span>
            </h1>

            <p className="fade-up-2 max-w-[560px] mb-10" style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif", fontSize: 18, fontWeight: 300, color: "var(--muted2)", lineHeight: 1.7 }}>
              They&apos;re messaging your family. Posting your name in groups. Calling your boss. This is <span style={{ color: "var(--white)", fontWeight: 500 }}>illegal under NDPA 2023</span>. GhostLaw generates your <span style={{ color: "var(--white)", fontWeight: 500 }}>FCCPC complaint</span> and <span style={{ color: "var(--white)", fontWeight: 500 }}>NDPA violation report</span>. Free. 60 seconds.
            </p>

            <div className="fade-up-3 flex flex-wrap gap-4 items-center">
              <button onClick={() => document.dispatchEvent(new CustomEvent("ghostlaw:auth", { detail: "signup" }))} className="btn-primary" style={{ cursor: "none" }}>
                Stop The Harassment — Free
              </button>
            </div>

            <div className="fade-up-4 flex flex-wrap gap-8 md:gap-12 mt-16 pt-10 border-t border-[rgba(255,255,255,0.1)] stats-4">
              {[
                { num: <><span style={{ color: "var(--red)" }}>NDPA</span></>, label: "They're violating" },
                { num: <>60<span style={{ color: "var(--red)" }}>s</span></>, label: "Complaint ready" },
                { num: <><span style={{ color: "var(--red)" }}>₦0</span></>, label: "Cost" },
                { num: <><span style={{ color: "var(--red)" }}>3</span> agencies</>, label: "You can report to" },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: 42, lineHeight: 1 }}>{s.num}</div>
                  <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      }
    >
      {/* ═══ SCENARIOS ════════════════════════════════════ */}
      <section className="py-20 md:py-28 px-4 sm:px-6 md:px-12 bg-[var(--black)] reveal">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--red)" }}>
            <span className="w-5 h-[1px] bg-[var(--red)]" />
            We Know What They Do
          </div>
          <h2 style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: "clamp(44px, 6vw, 76px)", lineHeight: 1 }}>
            THIS IS WHAT<br />
            <span style={{ WebkitTextStroke: "1px rgba(255,255,255,0.2)", color: "transparent" }}>THEY GET AWAY WITH</span>
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
            {[
              {
                emoji: "📞",
                title: "Calling your contacts about your loan",
                desc: "They pulled your phone contacts during install. Now they're calling your pastor, your boss, and your mum telling them you owe money. Shame as a business model.",
                law: "NDPA 2023 — Unlawful processing of personal data",
              },
              {
                emoji: "💬",
                title: "WhatsApp threats and defamation",
                desc: "\"Pay now or we post your name and photo in all groups.\" Some apps actually do it — creating broadcast lists of \"defaulters\" and sending to your contacts.",
                law: "FCCPA — Prohibition of harassment & intimidation",
              },
              {
                emoji: "📈",
                title: "Interest rates of 30-40% per week",
                desc: "You borrowed ₦20k for 7 days. They want ₦28k back. That's 40% in one week — over 2,000% APR. Most countries would call this criminal usury.",
                law: "CBN Moneylenders guidelines — Usury prohibition",
              },
              {
                emoji: "🔒",
                title: "Locking your phone until you pay",
                desc: "Some apps install device-locking malware that blocks you from using your phone. They literally hold your device hostage. This is illegal on multiple levels.",
                law: "Cybercrimes Act 2015 s.16 — Unauthorized modification",
              },
              {
                emoji: "📱",
                title: "Accessing your photos, SMS, and files",
                desc: "The app asked for \"permissions\" on install. Now they have your photos, messages, and contacts. They threaten to use your personal data against you.",
                law: "NDPA 2023 — Data processing without consent",
              },
              {
                emoji: "🚫",
                title: "Refusing to delete your data after you paid",
                desc: "You paid off the loan. But they still have your contacts, your photos, your employment info. And they won't delete it. They'll use it when you \"need\" another loan.",
                law: "NDPA 2023 s.36 — Right to data erasure",
              },
            ].map((item) => (
              <div key={item.title} className="feature-card group">
                <div className="text-2xl mb-4">{item.emoji}</div>
                <div className="relative z-10" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                  {item.title}
                </div>
                <div className="relative z-10" style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif", fontSize: 13, color: "var(--muted)", lineHeight: 1.7, marginBottom: 12 }}>
                  {item.desc}
                </div>
                <div className="relative z-10 px-2.5 py-1 inline-block" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, color: "var(--red)", background: "var(--red-dim)", letterSpacing: "0.04em" }}>
                  {item.law}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW GHOSTLAW HANDLES IT ═════════════════════ */}
      <section className="py-20 md:py-28 px-4 sm:px-6 md:px-12 bg-[var(--obsidian)] reveal relative overflow-hidden">
        <div className="glow-orb hidden md:block" style={{ width: 300, height: 300, top: "15%", right: "-5%", background: "rgba(232,25,44,0.05)", animation: "glow-pulse 8s ease-in-out infinite" }} />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-4" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--red)" }}>
            <span className="w-5 h-[1px] bg-[var(--red)]" />
            What GhostLaw Does
          </div>
          <h2 style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: "clamp(44px, 6vw, 76px)", lineHeight: 1 }}>
            FIGHT BACK<br />
            <span style={{ WebkitTextStroke: "1px rgba(255,255,255,0.2)", color: "transparent" }}>LEGALLY</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-8 mt-10">
            <div className="space-y-0">
              {[
                { num: "01", title: "Describe the harassment or paste screenshots", desc: "Tell GhostLaw what happened: \"OKash called my mother and told her I owe ₦15k. They also sent messages to my WhatsApp contacts.\" Paste screenshots if you have them." },
                { num: "02", title: "AI identifies every law they broke", desc: "GhostLaw cross-references NDPA 2023 (data privacy), FCCPA (consumer protection), and Cybercrimes Act. It builds your legal case with specific section citations." },
                { num: "03", title: "Get your FCCPC + NDPC complaint letters", desc: "Ready-to-file complaints for FCCPC (harassment, intimidation, unfair practices) and NDPC (data privacy violations). Plus a cease-and-desist letter to the loan company." },
                { num: "04", title: "Report to Google Play Store", desc: "GhostLaw also gives you the exact text to report the app on Google Play Store for policy violations — which can get the app removed entirely." },
              ].map((step) => (
                <div key={step.num} className="flow-step group">
                  <div className="group-hover:text-[var(--red-dim)] transition-colors min-w-[50px]" style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: 48, lineHeight: 1, color: "rgba(255,255,255,0.05)" }}>
                    {step.num}
                  </div>
                  <div className="flex-1">
                    <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{step.title}</div>
                    <div style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif", fontSize: 13, fontWeight: 300, color: "var(--muted)", lineHeight: 1.6 }}>{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sample letter */}
            <div className="letter-preview">
              <div className="bg-[var(--surface2)] px-5 py-3 border-b border-[var(--border)] flex items-center justify-between">
                <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--red)" }}>
                  ⚡ FCCPC Complaint Generated
                </div>
              </div>
              <div className="p-5" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, lineHeight: 1.9, color: "var(--muted2)" }}>
                <span style={{ color: "var(--muted2)" }}>April 10, 2026</span><br /><br />
                <span style={{ color: "var(--muted)" }}>Federal Competition &amp; Consumer Protection Commission</span><br />
                <span style={{ color: "var(--muted)" }}>Abuja, Nigeria</span><br /><br />
                <span style={{ color: "var(--white)", fontWeight: 600 }}>RE: FORMAL COMPLAINT — Harassment &amp; Data Privacy Violation</span><br />
                <span style={{ color: "var(--white)", fontWeight: 600 }}>Against: <span style={{ color: "var(--red)" }}>OKash Digital Finance Ltd</span></span><br /><br />
                Dear Commission,<br /><br />
                I write to report ongoing <span className="highlight-text">harassment, intimidation, and unlawful disclosure of personal data</span> by OKash loan application.<br /><br />
                On 5th April 2026, the company contacted multiple individuals on my phone contact list — including my employer and family members — disclosing that I had an outstanding loan balance, in violation of the <span className="highlight-text">Nigeria Data Protection Act 2023, Section 25</span> (unlawful processing) and <span className="highlight-text">FCCPA Section 123</span>.<br /><br />
                I request the Commission to investigate and take enforcement action.
                <span className="letter-cursor" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ COMMON LOAN APPS ════════════════════════════ */}
      <section className="py-14 md:py-18 px-4 sm:px-6 md:px-12 bg-[var(--black)] reveal">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--red)" }}>
            <span className="w-5 h-[1px] bg-[var(--red)]" />
            Report Any Loan App
          </div>
          <div className="flex flex-wrap gap-3">
            {["OKash", "FairMoney", "Carbon", "Branch", "Palmcredit", "QuickCheck", "Aella", "Renmoney", "KreditBee", "Sokoloan", "GoCash", "EasyMoni", "9Credit", "LCredit", "CashLion", "Kashkash"].map((app) => (
              <span key={app} className="trust-tile" style={{ padding: "0.75rem 1.25rem", minHeight: "auto" }}>
                <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, fontWeight: 500 }}>{app}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQ ══════════════════════════════════════════ */}
      <section className="py-20 md:py-28 px-4 sm:px-6 md:px-12 bg-[var(--obsidian)] reveal">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--red)" }}>
            <span className="w-5 h-[1px] bg-[var(--red)]" />
            FAQ
          </div>
          <h2 style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: "clamp(44px, 6vw, 70px)", lineHeight: 1 }}>
            LOAN APP<br />
            <span style={{ WebkitTextStroke: "1px rgba(255,255,255,0.2)", color: "transparent" }}>QUESTIONS</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4 mt-10">
            {[
              ["Is it legal for loan apps to call my contacts?", "No. Under NDPA 2023, loan apps cannot share your personal information (including loan status) with third parties without your explicit consent. Calling your contacts about your loan is a clear violation."],
              ["Can they really lock my phone?", "Some apps install device administrator access that locks your phone. This violates the Cybercrimes Act 2015. GhostLaw generates the complaint citing the specific criminal provision."],
              ["What if I actually owe them money?", "Owing a debt does NOT give them the right to harass you, contact your family, post your photo, or lock your phone. Debt collection must follow legal channels. GhostLaw protects your rights regardless of debt status."],
              ["Where do I report loan app harassment?", "FCCPC (consumer protection), NDPC (data privacy), and Google Play Store (app policy). GhostLaw generates all three complaint texts for you."],
              ["Can they come to my house?", "Legitimate debt recovery must follow legal procedures. Sending agents to intimidate you at home without a court order can constitute harassment under FCCPA. Document everything and use GhostLaw to file."],
              ["What interest rate is illegal?", "While Nigeria doesn't have a universal usury cap, CBN-licensed lenders must follow approved guidelines. Rates of 30-40% per week (2,000%+ APR) may constitute usury and can be challenged."],
            ].map(([q, a]) => (
              <div key={q} className="faq-card">
                <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{q}</div>
                <div style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif", fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>{a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </NigeriaLanding>
  );
}
