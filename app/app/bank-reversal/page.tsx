"use client";

import NigeriaLanding from "@/components/NigeriaLanding";

const faqData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How long should a bank reversal take in Nigeria?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "CBN mandates that banks resolve failed transfer claims within 24-72 hours. If your bank hasn't reversed after 72 hours, you have grounds for a formal complaint to CBN and FCCPC.",
      },
    },
    {
      "@type": "Question",
      name: "Can I get a refund for a failed ATM withdrawal?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. If an ATM debited your account but didn't dispense cash, the bank is required to reverse within 3-5 business days. GhostLaw generates the formal dispute letter citing CBN guidelines.",
      },
    },
    {
      "@type": "Question",
      name: "What if my bank ignores my reversal request?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "GhostLaw generates an escalation letter to CBN's Consumer Protection Department and a parallel FCCPC complaint. Banks respond fast when regulators get involved.",
      },
    },
  ],
};

export default function BankReversalPage() {
  return (
    <NigeriaLanding
      pageId="bank-reversal"
      structuredData={[faqData]}
      hero={
        <section className="min-h-screen flex flex-col justify-center px-4 sm:px-6 md:px-12 pt-24 sm:pt-32 pb-12 sm:pb-16 relative overflow-hidden">
          <div
            className="photo-backdrop"
            style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1600&q=80")' }}
          />
          <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(232,25,44,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(232,25,44,0.03) 1px, transparent 1px)", backgroundSize: "80px 80px", animation: "grid-drift 20s linear infinite" }} />
          <div className="absolute -top-[200px] -right-[200px] w-[800px] h-[800px]" style={{ background: "radial-gradient(circle, rgba(232,25,44,0.06) 0%, transparent 65%)", animation: "radial-breathe 6s ease-in-out infinite" }} />
          <div className="glow-orb hidden md:block" style={{ width: 200, height: 200, top: "60%", left: "10%", background: "rgba(232,25,44,0.12)", animation: "glow-pulse 6s ease-in-out infinite" }} />

          <div className="relative z-10 max-w-[760px] glass-panel p-6 md:p-10">
            <div className="fade-up flex items-center gap-3 mb-6" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--red)" }}>
              <span className="w-10 h-[1px] bg-[var(--red)]" />
              🇳🇬 Bank Reversal Claims
            </div>

            <h1 className="fade-up-1 leading-[0.92] mb-4" style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: "clamp(60px, 9vw, 120px)", letterSpacing: "0.01em" }}>
              YOUR BANK<br />
              <span style={{ color: "var(--red)" }}>TOOK YOUR</span><br />
              <span style={{ WebkitTextStroke: "1px rgba(255,255,255,0.3)", color: "transparent" }}>MONEY?</span>
            </h1>

            <p className="fade-up-2 max-w-[560px] mb-10" style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif", fontSize: 18, fontWeight: 300, color: "var(--muted2)", lineHeight: 1.7 }}>
              Transfer failed but they debited you. ATM didn&apos;t dispense but your balance dropped. GhostLaw writes your <span style={{ color: "var(--white)", fontWeight: 500 }}>CBN chargeback letter</span> and <span style={{ color: "var(--white)", fontWeight: 500 }}>FCCPC complaint</span> in 60 seconds. Free.
            </p>

            <div className="fade-up-3 flex flex-wrap gap-4 items-center">
              <button onClick={() => document.dispatchEvent(new CustomEvent("ghostlaw:auth", { detail: "signup" }))} className="btn-primary" style={{ cursor: "none" }}>
                Get My Bank Reversal — Free
              </button>
            </div>

            <div className="fade-up-4 flex flex-wrap gap-8 md:gap-12 mt-16 pt-10 border-t border-[rgba(255,255,255,0.1)] stats-4">
              {[
                { num: <>72<span style={{ color: "var(--red)" }}>hrs</span></>, label: "CBN deadline" },
                { num: <>60<span style={{ color: "var(--red)" }}>s</span></>, label: "Letter ready" },
                { num: <><span style={{ color: "var(--red)" }}>₦0</span></>, label: "Cost" },
                { num: <><span style={{ color: "var(--red)" }}>0</span> lawyers</>, label: "Needed" },
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
            Sound Familiar?
          </div>
          <h2 style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: "clamp(44px, 6vw, 76px)", lineHeight: 1 }}>
            EVERY NIGERIAN<br />
            <span style={{ WebkitTextStroke: "1px rgba(255,255,255,0.2)", color: "transparent" }}>KNOWS THIS PAIN</span>
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
            {[
              {
                emoji: "🏧",
                title: "ATM didn't dispense but debited",
                desc: "You went to the ATM, it swallowed the transaction, balance dropped ₦50k. Bank says \"log a complaint and wait 5-7 business days.\" Meanwhile your rent is due.",
                law: "CBN Circular BPS/DIR/GEN/CIR/04/010",
              },
              {
                emoji: "📲",
                title: "Transfer sent, recipient says nothing came",
                desc: "You transferred ₦200k to a supplier via the app. Your account shows debit but the person didn't receive. Bank tells you to wait. Nobody calls back.",
                law: "CBN Consumer Protection Framework 2019",
              },
              {
                emoji: "💳",
                title: "POS charged twice for one transaction",
                desc: "You bought fuel for ₦30k. POS said \"transaction failed, try again.\" You did. Both went through. Now you're out ₦60k and the merchant says talk to your bank.",
                law: "FCCPA s.123 — Unfair charge prohibition",
              },
              {
                emoji: "🏦",
                title: "Mysterious debit you didn't authorize",
                desc: "You woke up to a debit alert for ₦15k to a company you've never heard of. SMS says \"WEB-POS-PURCHASE\". Your card was in your pocket all day.",
                law: "CBN Framework — Unauthorized transaction liability",
              },
              {
                emoji: "⏰",
                title: "Bank says \"it takes 14 working days\"",
                desc: "Their website says 24 hours. Their Twitter says 48 hours. Customer service says 14 working days. You've been waiting 3 weeks. Nobody is accountable.",
                law: "CBN mandates 72-hour resolution window",
              },
              {
                emoji: "📧",
                title: "They asked for reversal form, then ghosted",
                desc: "You went to the branch, filled their reversal form, got a reference number. That was 2 months ago. Emails bounce. Branch says \"escalated to head office.\"",
                law: "FCCPC Act — Right to timely resolution",
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

      {/* ═══ HOW GHOSTLAW HANDLES IT ══════════════════════ */}
      <section className="py-20 md:py-28 px-4 sm:px-6 md:px-12 bg-[var(--obsidian)] reveal relative overflow-hidden">
        <div className="glow-orb hidden md:block" style={{ width: 300, height: 300, top: "10%", right: "-5%", background: "rgba(232,25,44,0.05)", animation: "glow-pulse 8s ease-in-out infinite" }} />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-4" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--red)" }}>
            <span className="w-5 h-[1px] bg-[var(--red)]" />
            What GhostLaw Does
          </div>
          <h2 style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: "clamp(44px, 6vw, 76px)", lineHeight: 1 }}>
            FROM PAIN TO<br />
            <span style={{ WebkitTextStroke: "1px rgba(255,255,255,0.2)", color: "transparent" }}>REFUND</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-8 mt-10">
            {/* Steps */}
            <div className="space-y-0">
              {[
                { num: "01", title: "Paste your debit alert or describe what happened", desc: "Screenshot the SMS, paste the app notification, or just type \"GTBank debited me ₦50k for a transfer that didn't go through.\" That's enough." },
                { num: "02", title: "AI identifies the violation and your rights", desc: "GhostLaw cross-references CBN Consumer Protection Framework, FCCPA, and the bank's own published TAT commitments. It finds the exact clause they broke." },
                { num: "03", title: "Get your demand letter + CBN complaint", desc: "A formal reversal demand letter citing the exact regulation, plus a ready-to-file CBN Consumer Protection Department complaint. Copy, send, done." },
                { num: "04", title: "Escalate if they ignore you", desc: "If the bank doesn't respond within the CBN window, GhostLaw generates a follow-up escalation to FCCPC with a timeline of their non-compliance." },
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
                  ⚡ Bank Reversal Letter Generated
                </div>
              </div>
              <div className="p-5" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, lineHeight: 1.9, color: "var(--muted2)" }}>
                <span style={{ color: "var(--muted2)" }}>April 10, 2026</span><br /><br />
                <span style={{ color: "var(--muted)" }}>Customer Service Unit</span><br />
                <span style={{ color: "var(--muted)" }}>Guaranty Trust Bank Plc</span><br /><br />
                <span style={{ color: "var(--white)", fontWeight: 600 }}>RE: FORMAL REQUEST FOR REVERSAL — Acct ****4821</span><br />
                <span style={{ color: "var(--white)", fontWeight: 600 }}>Failed Transfer Amount: <span style={{ color: "var(--red)" }}>₦200,000</span></span><br /><br />
                Dear Sir/Madam,<br /><br />
                I write to formally request an immediate reversal of the above amount debited from my account on 8th April 2026 at 14:32 WAT for a transfer to [Recipient] that was <span className="highlight-text">never received by the beneficiary</span>.<br /><br />
                Under the <span className="highlight-text">CBN Consumer Protection Framework (2019)</span>, your institution is mandated to resolve failed electronic transfer complaints within <span className="highlight-text">72 hours</span>. It has been 48 hours with no resolution.<br /><br />
                If this amount is not credited back within 24 hours, I shall escalate to the <span className="highlight-text">CBN Consumer Protection Department</span> and <span className="highlight-text">FCCPC</span>.
                <span className="letter-cursor" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ BANKS COVERED ════════════════════════════════ */}
      <section className="py-14 md:py-18 px-4 sm:px-6 md:px-12 bg-[var(--black)] reveal">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--red)" }}>
            <span className="w-5 h-[1px] bg-[var(--red)]" />
            Works For Any Nigerian Bank
          </div>
          <div className="flex flex-wrap gap-3">
            {["GTBank", "Access Bank", "First Bank", "UBA", "Zenith Bank", "Fidelity Bank", "Sterling Bank", "Wema / ALAT", "Stanbic IBTC", "FCMB", "Union Bank", "Polaris Bank", "Kuda", "OPay", "PalmPay", "Moniepoint"].map((bank) => (
              <span key={bank} className="trust-tile" style={{ padding: "0.75rem 1.25rem", minHeight: "auto" }}>
                <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, fontWeight: 500 }}>{bank}</span>
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
            BANK REVERSAL<br />
            <span style={{ WebkitTextStroke: "1px rgba(255,255,255,0.2)", color: "transparent" }}>QUESTIONS</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4 mt-10">
            {[
              ["How long should a bank reversal take in Nigeria?", "CBN mandates that banks resolve failed transfer claims within 24-72 hours. If your bank hasn't reversed after 72 hours, you have grounds for a formal complaint to CBN and FCCPC."],
              ["Can I get a refund for a failed ATM withdrawal?", "Yes. If an ATM debited your account but didn't dispense cash, the bank is required to reverse within 3-5 business days. GhostLaw generates the formal dispute letter citing CBN guidelines."],
              ["What if my bank ignores my reversal request?", "GhostLaw generates an escalation letter to CBN's Consumer Protection Department and a parallel FCCPC complaint. Banks respond fast when regulators get involved."],
              ["Does this work for POS double-charge?", "Yes. If you were charged twice for a single POS transaction, you can dispute both the duplicate charge and any related fees. GhostLaw cites FCCPA unfair charge prohibitions."],
              ["What information do I need to file?", "Just the debit alert (SMS or app notification), date, amount, and the recipient info if it was a transfer. GhostLaw handles the legal language and regulatory references."],
              ["Is this actually free?", "Yes. GhostLaw is 100% free. No hidden charges, no premium tier for bank reversals. You get the demand letter, call script, and regulator complaint — all free."],
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
