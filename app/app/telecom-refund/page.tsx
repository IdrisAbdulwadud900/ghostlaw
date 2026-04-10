"use client";

import NigeriaLanding from "@/components/NigeriaLanding";

const faqData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Why does my MTN data finish so fast in Nigeria?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Common causes include background app usage, but many Nigerians report data depletion even with background data turned off. MTN and other telecoms have faced NCC investigations for alleged data zapping. GhostLaw helps you file a formal NCC complaint.",
      },
    },
    {
      "@type": "Question",
      name: "Can I get a refund for auto-subscriptions I didn't authorize?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Under the NCC Consumer Code of Practice, telecom companies cannot subscribe you to value-added services without explicit opt-in consent. GhostLaw generates your refund demand letter and NCC complaint.",
      },
    },
    {
      "@type": "Question",
      name: "How do I file a complaint against MTN/Airtel/Glo with NCC?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "GhostLaw generates a ready-to-file NCC Consumer Affairs complaint citing the specific Consumer Code provisions the telecom violated. You can file online at consumer.ncc.gov.ng or via email.",
      },
    },
  ],
};

export default function TelecomRefundPage() {
  return (
    <NigeriaLanding
      pageId="telecom-refund"
      structuredData={[faqData]}
      hero={
        <section className="min-h-screen flex flex-col justify-center px-4 sm:px-6 md:px-12 pt-24 sm:pt-32 pb-12 sm:pb-16 relative overflow-hidden">
          <div
            className="photo-backdrop"
            style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1523961131990-5ea7c61b2107?auto=format&fit=crop&w=1600&q=80")' }}
          />
          <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(232,25,44,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(232,25,44,0.03) 1px, transparent 1px)", backgroundSize: "80px 80px", animation: "grid-drift 20s linear infinite" }} />
          <div className="absolute -top-[200px] -right-[200px] w-[800px] h-[800px]" style={{ background: "radial-gradient(circle, rgba(232,25,44,0.06) 0%, transparent 65%)", animation: "radial-breathe 6s ease-in-out infinite" }} />
          <div className="glow-orb hidden md:block" style={{ width: 200, height: 200, top: "50%", left: "8%", background: "rgba(232,25,44,0.12)", animation: "glow-pulse 6s ease-in-out infinite" }} />

          <div className="relative z-10 max-w-[760px] glass-panel p-6 md:p-10">
            <div className="fade-up flex items-center gap-3 mb-6" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--red)" }}>
              <span className="w-10 h-[1px] bg-[var(--red)]" />
              🇳🇬 Telecom & Data Refund
            </div>

            <h1 className="fade-up-1 leading-[0.92] mb-4" style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: "clamp(56px, 9vw, 115px)", letterSpacing: "0.01em" }}>
              MTN IS<br />
              <span style={{ color: "var(--red)" }}>EATING YOUR</span><br />
              <span style={{ WebkitTextStroke: "1px rgba(255,255,255,0.3)", color: "transparent" }}>DATA?</span>
            </h1>

            <p className="fade-up-2 max-w-[560px] mb-10" style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif", fontSize: 18, fontWeight: 300, color: "var(--muted2)", lineHeight: 1.7 }}>
              You bought 3GB. It vanished in 2 hours. Or they subscribed you to &ldquo;CallTunes&rdquo; you never asked for and charged ₦200 weekly. GhostLaw writes your <span style={{ color: "var(--white)", fontWeight: 500 }}>NCC complaint</span> citing the exact <span style={{ color: "var(--white)", fontWeight: 500 }}>Consumer Code</span> they violated. Free.
            </p>

            <div className="fade-up-3 flex flex-wrap gap-4 items-center">
              <button onClick={() => document.dispatchEvent(new CustomEvent("ghostlaw:auth", { detail: "signup" }))} className="btn-primary" style={{ cursor: "none" }}>
                Get My Data Refund — Free
              </button>
            </div>

            <div className="fade-up-4 flex flex-wrap gap-8 md:gap-12 mt-16 pt-10 border-t border-[rgba(255,255,255,0.1)] stats-4">
              {[
                { num: <><span style={{ color: "var(--red)" }}>NCC</span></>, label: "Regulator" },
                { num: <>60<span style={{ color: "var(--red)" }}>s</span></>, label: "Complaint ready" },
                { num: <><span style={{ color: "var(--red)" }}>₦0</span></>, label: "Cost" },
                { num: <><span style={{ color: "var(--red)" }}>4</span> telecoms</>, label: "Covered" },
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
            You Know This Story
          </div>
          <h2 style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: "clamp(44px, 6vw, 76px)", lineHeight: 1 }}>
            THE DATA THEFT<br />
            <span style={{ WebkitTextStroke: "1px rgba(255,255,255,0.2)", color: "transparent" }}>EVERYONE COMPLAINS ABOUT</span>
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
            {[
              {
                emoji: "📉",
                title: "3GB gone in 2 hours — phone was on WiFi",
                desc: "You bought a 3GB weekly plan at 11am. By 1pm it's finished. Your phone was connected to WiFi the entire time. Background data was off. Still vanished.",
                law: "NCC Consumer Code — Right to accurate billing",
              },
              {
                emoji: "🔔",
                title: "Auto-subscribed to services you never requested",
                desc: "₦200 deducted for \"MTN CallTunes.\" ₦100 for \"Daily News Alert.\" ₦150 for \"Music+.\" You never subscribed to any of these. They just take your airtime.",
                law: "NCC Code — Explicit opt-in consent required",
              },
              {
                emoji: "💸",
                title: "Airtime deducted for no reason",
                desc: "You recharged ₦1,000. Before you could even buy data, ₦400 was already gone to unknown services. You dial *310# — ₦600 remaining. Where did ₦400 go?",
                law: "FCCPA s.115 — Unauthorized charges",
              },
              {
                emoji: "🌙",
                title: "Night plan used up during the day",
                desc: "You bought the 1GB night plan (12am-5am). You fell asleep at 1am. By morning the plan shows 0MB. You barely streamed 200MB. The math doesn't add up.",
                law: "NCC Consumer Code — Fair usage transparency",
              },
              {
                emoji: "🔄",
                title: "Data auto-renewal you can't stop",
                desc: "You bought a weekly 1.5GB plan. It auto-renewed when it expired, deducting ₦500 from your airtime. You tried to cancel — the USSD code doesn't work.",
                law: "NCC Code — Right to easy cancellation",
              },
              {
                emoji: "📶",
                title: "Paying for data but getting 2G speeds",
                desc: "You're paying for a 4G data plan but getting speeds slower than WhatsApp can load. \"Network issues in your area\" — for the last 6 months. But they keep billing you.",
                law: "NCC QoS Regulations — Minimum service standards",
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
        <div className="glow-orb hidden md:block" style={{ width: 300, height: 300, top: "10%", right: "-5%", background: "rgba(232,25,44,0.05)", animation: "glow-pulse 8s ease-in-out infinite" }} />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-4" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--red)" }}>
            <span className="w-5 h-[1px] bg-[var(--red)]" />
            What GhostLaw Does
          </div>
          <h2 style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: "clamp(44px, 6vw, 76px)", lineHeight: 1 }}>
            YOUR DATA,<br />
            <span style={{ WebkitTextStroke: "1px rgba(255,255,255,0.2)", color: "transparent" }}>YOUR MONEY</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-8 mt-10">
            <div className="space-y-0">
              {[
                { num: "01", title: "Tell us what happened — plain English is fine", desc: "\"MTN took my 3GB data in 2 hours\" or \"Airtel keeps subscribing me to services I didn't ask for and deducting my airtime.\" That's all we need." },
                { num: "02", title: "AI finds the exact NCC code they violated", desc: "GhostLaw references the NCC Consumer Code of Practice, NCC Quality of Service regulations, and FCCPA provisions to identify every violation." },
                { num: "03", title: "Get your NCC complaint + refund demand", desc: "A formal complaint letter for NCC Consumer Affairs Bureau (consumer.ncc.gov.ng) plus a direct demand letter to the telecom company requesting a refund or data reinstatement." },
                { num: "04", title: "Cancel the rogue subscriptions", desc: "GhostLaw gives you the exact USSD codes and steps to cancel all active subscriptions, plus the text to demand refund for past unauthorized charges." },
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
                  ⚡ NCC Complaint Generated
                </div>
              </div>
              <div className="p-5" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, lineHeight: 1.9, color: "var(--muted2)" }}>
                <span style={{ color: "var(--muted2)" }}>April 10, 2026</span><br /><br />
                <span style={{ color: "var(--muted)" }}>Consumer Affairs Bureau</span><br />
                <span style={{ color: "var(--muted)" }}>Nigerian Communications Commission</span><br /><br />
                <span style={{ color: "var(--white)", fontWeight: 600 }}>RE: FORMAL COMPLAINT — Unauthorized Data Depletion &amp; Auto-Subscription</span><br />
                <span style={{ color: "var(--white)", fontWeight: 600 }}>Against: <span style={{ color: "var(--red)" }}>MTN Nigeria Communications Plc</span></span><br /><br />
                Dear Bureau,<br /><br />
                I write to formally complain about <span className="highlight-text">repeated unauthorized data depletion</span> and <span className="highlight-text">auto-subscription to value-added services without my consent</span>.<br /><br />
                On 8th April 2026, I purchased a 3GB weekly data plan (₦1,500). Within 2 hours, the data was fully depleted despite my device being connected to WiFi. Additionally, I have been charged ₦200/week for &ldquo;MTN CallTunes&rdquo; — a service I <span className="highlight-text">never opted into</span>.<br /><br />
                These actions violate the <span className="highlight-text">NCC Consumer Code of Practice, Section 4.3</span> (right to accurate billing) and <span className="highlight-text">Section 5.1</span> (explicit opt-in for VAS).
                <span className="letter-cursor" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TELECOMS COVERED ═════════════════════════════ */}
      <section className="py-14 md:py-18 px-4 sm:px-6 md:px-12 bg-[var(--black)] reveal">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--red)" }}>
            <span className="w-5 h-[1px] bg-[var(--red)]" />
            Works For Any Nigerian Telecom
          </div>
          <div className="flex flex-wrap gap-3">
            {["MTN Nigeria", "Airtel Nigeria", "Globacom (Glo)", "9mobile", "Smile Communications", "Spectranet", "Ntel", "Swift Networks"].map((telecom) => (
              <span key={telecom} className="trust-tile" style={{ padding: "0.75rem 1.25rem", minHeight: "auto" }}>
                <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, fontWeight: 500 }}>{telecom}</span>
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-6">
            <span className="proof-pill" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11 }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--red)]" />
              Dial *310# to check subscriptions (MTN)
            </span>
            <span className="proof-pill" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11 }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--red)]" />
              Dial *141# to cancel all subs (MTN)
            </span>
            <span className="proof-pill" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11 }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--red)]" />
              Text STOP to 2442 (Airtel)
            </span>
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
            DATA & AIRTIME<br />
            <span style={{ WebkitTextStroke: "1px rgba(255,255,255,0.2)", color: "transparent" }}>QUESTIONS</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4 mt-10">
            {[
              ["Why does my MTN data finish so fast?", "Common causes include background app usage, but many Nigerians report data vanishing even with background data off. NCC has investigated this. GhostLaw helps you file a formal complaint backed by the NCC Consumer Code."],
              ["Can I get a refund for auto-subscriptions?", "Yes. Under the NCC Consumer Code, telecoms need explicit opt-in consent for value-added services. If you were subscribed without consenting, you're entitled to a refund. GhostLaw drafts the demand."],
              ["How do I file a complaint with NCC?", "GhostLaw generates a ready-to-file complaint for NCC Consumer Affairs Bureau. You can submit it at consumer.ncc.gov.ng, via email, or by visiting any NCC zonal office."],
              ["What if the telecom ignores my complaint?", "If the telecom doesn't resolve within 4 weeks of your NCC complaint, you can escalate to the NCC Board. GhostLaw generates the escalation letter with the full non-compliance timeline."],
              ["Does this work for NERC electricity complaints too?", "Yes! GhostLaw also handles estimated billing disputes, IKEDC/EKEDC overcharges, and prepaid meter complaints citing NERC regulations. Just describe your issue."],
              ["Can I dispute old charges?", "Yes, though recent charges are easier to pursue. GhostLaw can generate complaints for charges within the last 6 months. Include dates and amounts for the strongest case."],
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
