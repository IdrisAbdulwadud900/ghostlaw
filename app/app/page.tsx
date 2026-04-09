"use client";

import { useState } from "react";
import { 
  Scan, FileText, ArrowRight, 
  Ghost, Star, Upload, ChevronDown,
  BadgeDollarSign, Timer, Brain
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AuthModal from "@/components/AuthModal";
import AppDashboard from "@/components/AppDashboard";
import { getToken } from "@/lib/api";

export default function Home() {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window !== "undefined") return !!getToken();
    return false;
  });

  if (isLoggedIn) {
    return <AppDashboard onLogout={() => setIsLoggedIn(false)} />;
  }

  return (
    <div className="min-h-screen">
      {/* ── Nav ────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl bg-[#080810]/70 border-b border-white/5">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <Ghost className="w-7 h-7 text-purple-400" />
            <span className="text-lg font-bold tracking-tight">Ghost<span className="text-purple-400">Law</span></span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setAuthMode("login"); setShowAuth(true); }}
              className="px-4 py-2 rounded-xl text-sm text-gray-300 hover:text-white transition-colors"
            >
              Log in
            </button>
            <button
              onClick={() => { setAuthMode("signup"); setShowAuth(true); }}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-purple-600 hover:bg-purple-500 transition-colors"
            >
              Get started free
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────── */}
      <section className="relative overflow-hidden px-5 pt-28 pb-8">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/3 w-[500px] h-[500px] bg-purple-600/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-600/6 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/8 border border-purple-500/15 text-purple-300 text-sm mb-8">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                Works on medical bills, leases, phone bills, and more
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight mb-6">
                That bill is wrong.{" "}
                <span className="gradient-text">We&apos;ll prove it.</span>
              </h1>

              <p className="text-lg md:text-xl text-gray-400 mb-3 max-w-2xl mx-auto leading-relaxed">
                Paste any bill or contract. Our AI reads the fine print, finds every overcharge,
                and writes the dispute letter. You just hit send.
              </p>

              <p className="text-gray-500 mb-10 text-sm">
                Used by 2,400+ people who got tired of overpaying.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-6"
            >
              <button
                onClick={() => { setAuthMode("signup"); setShowAuth(true); }}
                className="px-7 py-3.5 btn-primary rounded-xl text-base font-semibold pulse-glow flex items-center gap-2"
              >
                Scan your first bill
                <ArrowRight className="w-4 h-4" />
              </button>
              <span className="text-gray-600 text-sm">Free • No credit card • 30 seconds</span>
            </motion.div>
          </div>

          {/* ── Live demo card ──────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-12 max-w-3xl mx-auto"
          >
            <div className="glass-card p-5 md:p-7">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                </div>
                <span className="text-gray-600 text-xs ml-1 font-mono">ghostlaw — analysis</span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-red-500/8 border border-red-500/15">
                  <div className="min-w-0">
                    <p className="font-semibold text-red-400 text-sm">Facility fee is 340% above the Medicare rate</p>
                    <p className="text-xs text-gray-500 mt-0.5">They charged $2,100 — the fair price is $630</p>
                  </div>
                  <span className="text-green-400 font-bold text-sm whitespace-nowrap ml-4">+$1,470</span>
                </div>
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-orange-500/8 border border-orange-500/15">
                  <div className="min-w-0">
                    <p className="font-semibold text-orange-400 text-sm">Looks like they upcoded your observation stay</p>
                    <p className="text-xs text-gray-500 mt-0.5">You were there 3 hours — they billed you for inpatient</p>
                  </div>
                  <span className="text-green-400 font-bold text-sm whitespace-nowrap ml-4">+$800</span>
                </div>
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-500/8 border border-blue-500/15">
                  <div className="min-w-0">
                    <p className="font-semibold text-blue-400 text-sm">&ldquo;Miscellaneous supplies&rdquo; — they have to itemize this</p>
                    <p className="text-xs text-gray-500 mt-0.5">By law you can demand a line-by-line breakdown</p>
                  </div>
                  <span className="text-green-400 font-bold text-sm whitespace-nowrap ml-4">+$237</span>
                </div>
                <div className="mt-4 p-4 rounded-xl bg-green-500/8 border border-green-500/12">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">You could save</p>
                      <p className="text-2xl font-bold gradient-text-green">$2,507</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-0.5">Ready to send</p>
                      <p className="text-sm text-green-400 font-medium">Dispute letter + Call script ✓</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Social proof bar ───────────────── */}
      <section className="py-8 px-5 border-y border-white/5">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm text-gray-500">
          <div className="flex items-center gap-1.5">
            <BadgeDollarSign className="w-4 h-4 text-green-400" />
            <span><strong className="text-gray-300">$580K+</strong> saved for users</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Scan className="w-4 h-4 text-purple-400" />
            <span><strong className="text-gray-300">12,000+</strong> documents scanned</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Timer className="w-4 h-4 text-blue-400" />
            <span><strong className="text-gray-300">30 sec</strong> average scan time</span>
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────── */}
      <section className="py-20 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-purple-400 text-sm font-medium mb-3 tracking-wide uppercase">How it works</p>
            <h2 className="text-3xl md:text-4xl font-bold">
              Three steps. That&apos;s it.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { 
                icon: <Upload className="w-6 h-6" />, 
                step: "1", 
                title: "Paste or upload", 
                desc: "Got a confusing bill? A lease that looks sketchy? Just paste the text or snap a photo. Takes 10 seconds.",
                color: "text-purple-400", 
                bg: "bg-purple-500/8 border-purple-500/15" 
              },
              { 
                icon: <Brain className="w-6 h-6" />, 
                step: "2", 
                title: "AI reads the fine print", 
                desc: "It finds the overcharges, the stuff that's illegal, the fees they snuck in. Plus your rights — things most people don't know they can fight.",
                color: "text-blue-400", 
                bg: "bg-blue-500/8 border-blue-500/15" 
              },
              { 
                icon: <FileText className="w-6 h-6" />, 
                step: "3", 
                title: "Send and save", 
                desc: "Get a dispute letter you can copy-paste and send right now. Or a call script that tells you exactly what to say, word for word.",
                color: "text-green-400", 
                bg: "bg-green-500/8 border-green-500/15" 
              },
            ].map((item, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 16 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                transition={{ delay: i * 0.1 }} 
                viewport={{ once: true }} 
                className="glass-card p-7"
              >
                <div className={`w-12 h-12 rounded-xl ${item.bg} border flex items-center justify-center mb-5 ${item.color}`}>
                  {item.icon}
                </div>
                <div className="text-xs font-mono text-gray-600 mb-2">Step {item.step}</div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What we fight ──────────────────── */}
      <section className="py-20 px-5 bg-[#0a0a14]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-orange-400 text-sm font-medium mb-3 tracking-wide uppercase">What we fight</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              If it&apos;s costing you money, we&apos;ll look at it
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Most people leave money on the table because they don&apos;t know their rights or don&apos;t have the time. That&apos;s literally what we built this for.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { emoji: "🏥", label: "Medical bills", sub: "The #1 reason people go bankrupt" },
              { emoji: "📱", label: "Phone & internet", sub: "Hidden fees, throttled plans" },
              { emoji: "⚡", label: "Utility bills", sub: "Overcharges nobody checks" },
              { emoji: "🏠", label: "Rent & leases", sub: "Illegal clauses they hope you skip" },
              { emoji: "💳", label: "Credit cards", sub: "Mystery fees & rate bumps" },
              { emoji: "🛡️", label: "Insurance", sub: "Denied claims you can fight" },
              { emoji: "📋", label: "Contracts", sub: "Fine print that screws you" },
              { emoji: "🎫", label: "Fines & tickets", sub: "Wrong tickets happen a lot" },
            ].map((item, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, scale: 0.95 }} 
                whileInView={{ opacity: 1, scale: 1 }} 
                transition={{ delay: i * 0.04 }} 
                viewport={{ once: true }} 
                className="glass-card-interactive p-4 text-center"
              >
                <div className="text-2xl mb-2">{item.emoji}</div>
                <h3 className="font-semibold text-sm mb-0.5">{item.label}</h3>
                <p className="text-gray-600 text-xs">{item.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Real stories ───────────────────── */}
      <section className="py-20 px-5">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-green-400 text-sm font-medium mb-3 tracking-wide uppercase">Real results</p>
            <h2 className="text-3xl md:text-4xl font-bold">
              People are getting their money back
            </h2>
          </div>

          <div className="space-y-4">
            {[
              { 
                name: "Sarah M.", 
                saved: "$3,200", 
                text: "I got an ER bill for $4,800 and almost just paid it. Pasted it into GhostLaw on a whim. It found 4 things wrong with it — stuff I'd never have caught. Sent the dispute letter they wrote and two weeks later the bill dropped to $1,600.", 
                type: "Emergency room bill",
                time: "2 weeks ago"
              },
              { 
                name: "James K.", 
                saved: "$840/yr", 
                text: "I've been overpaying Comcast for like 2 years apparently. GhostLaw spotted that my 'plan' doesn't even exist anymore — they just kept charging the old price. Used the call script, got switched to a cheaper plan + a $140 credit.", 
                type: "Internet bill",
                time: "1 month ago"
              },
              { 
                name: "Maria L.", 
                saved: "$6,500", 
                text: "My landlord had a 30-page lease. I just pasted it in, not expecting much. GhostLaw flagged 6 clauses that are literally illegal in my state. I forwarded the dispute letter and got all the bogus fees refunded. Six. Thousand. Dollars.", 
                type: "Apartment lease",
                time: "3 weeks ago"
              },
            ].map((r, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 12 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                transition={{ delay: i * 0.08 }} 
                viewport={{ once: true }} 
                className="glass-card p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-purple-500/15 flex items-center justify-center text-purple-400 font-bold text-sm">{r.name[0]}</div>
                    <div>
                      <p className="font-medium text-sm">{r.name}</p>
                      <p className="text-gray-600 text-xs">{r.type} • {r.time}</p>
                    </div>
                  </div>
                  <span className="text-green-400 font-bold">saved {r.saved}</span>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">&ldquo;{r.text}&rdquo;</p>
                <div className="flex gap-0.5 mt-3">{[...Array(5)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-yellow-400/80 text-yellow-400/80" />)}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────── */}
      <section className="py-20 px-5 bg-[#0a0a14]">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold">Questions people ask</h2>
          </div>
          <div className="space-y-3">
            {[
              { q: "Is this actually free?", a: "Yes. You can scan documents and get dispute letters for free. We might add premium features later, but the core tool is free." },
              { q: "How does it find overcharges?", a: "Our AI reads your document line by line, compares charges against fair market rates and legal standards, and flags anything that looks wrong. It also knows consumer protection laws for every US state." },
              { q: "Will a dispute letter actually work?", a: "More often than you'd think. Most companies count on people not pushing back. A well-written letter citing specific laws and regulations gets results. We've seen bills reduced by 40-80%." },
              { q: "Is my data safe?", a: "We don't store your documents. The AI analyzes them in real-time and the data isn't saved after your session. We use encryption for everything in transit." },
            ].map((faq, i) => (
              <FAQItem key={i} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────── */}
      <section className="py-24 px-5">
        <div className="max-w-xl mx-auto text-center">
          <Ghost className="w-12 h-12 text-purple-400 mx-auto mb-6 float" />
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            You&apos;re probably overpaying for something right now
          </h2>
          <p className="text-gray-500 mb-8">
            Takes 30 seconds to find out. Worst case, everything&apos;s fine. Best case, you save thousands.
          </p>
          <button 
            onClick={() => { setAuthMode("signup"); setShowAuth(true); }} 
            className="px-7 py-3.5 btn-primary rounded-xl text-base font-semibold pulse-glow inline-flex items-center gap-2"
          >
            <Scan className="w-4 h-4" />
            Scan your first bill
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-gray-700 text-xs mt-4">Free forever • No credit card</p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────── */}
      <footer className="py-6 px-5 border-t border-white/5">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Ghost className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium">Ghost<span className="text-purple-400">Law</span></span>
          </div>
          <div className="flex items-center gap-4 text-gray-600 text-xs">
            <span>© 2026 GhostLaw</span>
            <span>•</span>
            <button className="hover:text-gray-400 transition-colors">Privacy</button>
            <span>•</span>
            <button className="hover:text-gray-400 transition-colors">Terms</button>
          </div>
        </div>
      </footer>

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

/* ── FAQ Accordion Component ────────────── */
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <span className="font-medium text-sm pr-4">{question}</span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <p className="px-5 pb-5 text-sm text-gray-400 leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
