"use client";

import { useState } from "react";
import { 
  Shield, Scan, FileText, Phone, ArrowRight, 
  Zap, Ghost, Star, Upload
} from "lucide-react";
import { motion } from "framer-motion";
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
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-8 pb-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <nav className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-2">
              <Ghost className="w-8 h-8 text-purple-400" />
              <span className="text-xl font-bold">Ghost<span className="text-purple-400">Law</span></span>
            </div>
            <button
              onClick={() => { setAuthMode("login"); setShowAuth(true); }}
              className="px-4 py-2 rounded-lg border border-purple-500/30 text-purple-300 hover:bg-purple-500/10 transition-colors text-sm"
            >
              Sign In
            </button>
          </nav>

          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm mb-8">
                <Zap className="w-4 h-4" />
                <span>AI-Powered Consumer Protection</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
                Stop Getting <br />
                <span className="gradient-text">Ripped Off.</span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-400 mb-4 max-w-2xl mx-auto">
                Scan any bill. AI finds every overcharge, hidden fee, and error.
                Then writes the dispute letter and makes the call for you.
              </p>

              <p className="text-3xl font-bold gradient-text-fire mb-10">
                Average user saves $2,400/year.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <button
                onClick={() => { setAuthMode("signup"); setShowAuth(true); }}
                className="px-8 py-4 bg-purple-600 hover:bg-purple-500 rounded-xl text-lg font-semibold transition-all pulse-glow flex items-center gap-2"
              >
                <Scan className="w-5 h-5" />
                Scan Your First Bill Free
                <ArrowRight className="w-5 h-5" />
              </button>
              <span className="text-gray-500 text-sm">No credit card required</span>
            </motion.div>
          </div>

          {/* Demo preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16 max-w-3xl mx-auto"
          >
            <div className="glass-card p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-gray-500 text-sm ml-2">GhostLaw Analysis</span>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div>
                    <p className="font-semibold text-red-400">🚨 Critical: Facility fee 340% above Medicare rate</p>
                    <p className="text-sm text-gray-400 mt-1">$2,100 charged vs $630 fair rate</p>
                  </div>
                  <span className="text-green-400 font-bold text-lg whitespace-nowrap ml-4">Save $1,470</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <div>
                    <p className="font-semibold text-orange-400">⚠️ High: Observation charge appears upcoded</p>
                    <p className="text-sm text-gray-400 mt-1">3-hour stay billed as inpatient observation</p>
                  </div>
                  <span className="text-green-400 font-bold text-lg whitespace-nowrap ml-4">Save $800</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div>
                    <p className="font-semibold text-blue-400">📋 Medium: Vague &quot;miscellaneous supplies&quot;</p>
                    <p className="text-sm text-gray-400 mt-1">Must provide itemized breakdown by law</p>
                  </div>
                  <span className="text-green-400 font-bold text-lg whitespace-nowrap ml-4">Save $237</span>
                </div>
                <div className="mt-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                  <p className="text-2xl font-bold text-green-400">Total potential savings: $2,857</p>
                  <p className="text-gray-400 mt-1">Dispute letter ready • Call script generated</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-4">
            Three Steps. <span className="gradient-text">Thousands Saved.</span>
          </h2>
          <p className="text-gray-400 text-center mb-16 text-lg">It takes 30 seconds to start fighting back.</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <Upload className="w-8 h-8" />, step: "01", title: "Scan It", desc: "Take a photo or paste any bill, contract, lease, or document. AI reads and understands everything instantly.", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
              { icon: <FileText className="w-8 h-8" />, step: "02", title: "Fight It", desc: "AI finds every overcharge, hidden fee, and error. Generates a powerful dispute letter citing your legal rights.", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
              { icon: <Phone className="w-8 h-8" />, step: "03", title: "Ghost It", desc: "AI calls the company for you. Handles hold times, negotiations, and paperwork. You just save money.", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }} viewport={{ once: true }} className="glass-card p-8 text-center">
                <div className={`w-16 h-16 rounded-2xl ${item.bg} border flex items-center justify-center mx-auto mb-4 ${item.color}`}>{item.icon}</div>
                <div className="text-4xl font-bold text-gray-700 mb-2">{item.step}</div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-gray-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What we fight */}
      <section className="py-20 px-4 bg-[#0d0d1a]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-16">We Fight <span className="gradient-text-fire">Everything.</span></h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { emoji: "🏥", label: "Medical Bills", desc: "$88B/yr in overcharges" },
              { emoji: "📱", label: "Phone Bills", desc: "Hidden fees & throttling" },
              { emoji: "⚡", label: "Utility Bills", desc: "Rate hikes & errors" },
              { emoji: "🏠", label: "Rent & Leases", desc: "Illegal clauses & fees" },
              { emoji: "💳", label: "Credit Cards", desc: "Unfair charges & rates" },
              { emoji: "🛡️", label: "Insurance", desc: "Denied claims & markup" },
              { emoji: "📋", label: "Contracts", desc: "Unfair terms & traps" },
              { emoji: "🎫", label: "Fines & Tickets", desc: "Wrongful penalties" },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} viewport={{ once: true }} className="glass-card p-5 text-center hover:border-purple-500/30 transition-colors">
                <div className="text-3xl mb-2">{item.emoji}</div>
                <h3 className="font-semibold text-sm">{item.label}</h3>
                <p className="text-gray-500 text-xs mt-1">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-16">People Are <span className="gradient-text">Saving Thousands.</span></h2>
          <div className="space-y-6">
            {[
              { name: "Sarah M.", saved: "$3,200", text: "Scanned my ER bill expecting nothing. GhostLaw found 4 overcharges and generated a dispute letter in seconds. Hospital reduced my bill by $3,200.", type: "Medical Bill" },
              { name: "James K.", saved: "$840/yr", text: "Pointed it at my Comcast bill and it found I was paying for a plan that doesn't exist anymore. AI called them and got me switched + a $140 credit.", type: "Internet Bill" },
              { name: "Maria L.", saved: "$6,500", text: "My landlord was charging illegal fees buried in a 30-page lease. GhostLaw caught them all and drafted a letter that got everything refunded.", type: "Lease Agreement" },
            ].map((r, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }} className="glass-card p-6">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">{r.name[0]}</div>
                  <div><p className="font-semibold">{r.name}</p><p className="text-gray-500 text-sm">{r.type}</p></div>
                  <div className="ml-auto text-green-400 font-bold text-xl">Saved {r.saved}</div>
                </div>
                <p className="text-gray-300">&ldquo;{r.text}&rdquo;</p>
                <div className="flex gap-1 mt-3">{[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="glass-card p-10">
            <Ghost className="w-16 h-16 text-purple-400 mx-auto mb-6 float" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to stop getting ripped off?</h2>
            <p className="text-gray-400 mb-8 text-lg">Your first scan is free. No credit card. See what you&apos;re overpaying in 30 seconds.</p>
            <button onClick={() => { setAuthMode("signup"); setShowAuth(true); }} className="px-8 py-4 bg-purple-600 hover:bg-purple-500 rounded-xl text-lg font-semibold transition-all pulse-glow flex items-center gap-2 mx-auto">
              <Shield className="w-5 h-5" />Start Fighting Back<ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-800/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Ghost className="w-5 h-5 text-purple-400" />
            <span className="font-semibold">Ghost<span className="text-purple-400">Law</span></span>
          </div>
          <p className="text-gray-500 text-sm">© 2026 GhostLaw. AI-powered consumer protection.</p>
        </div>
      </footer>

      {showAuth && (
        <AuthModal
          mode={authMode}
          onClose={() => setShowAuth(false)}
          onSuccess={() => { setShowAuth(false); setIsLoggedIn(true); }}
          onSwitchMode={() => setAuthMode(authMode === "login" ? "signup" : "login")}
        />
      )}
    </div>
  );
}
