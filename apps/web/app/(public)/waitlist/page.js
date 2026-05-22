"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CheckCircle, Loader2, ArrowRight, Sparkles, Shield, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | submitting | success | already | error
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingRewards, setPendingRewards] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setErrorMessage("Please enter a valid email.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "waitlist" })
      });

      const data = await res.json();

      if (data.success) {
        if (data.alreadyJoined) {
          setPendingRewards(data.pendingRewards || 0);
          setStatus("already");
        } else {
          setStatus("success");
        }
      } else {
        setErrorMessage(data.error || "Something went wrong.");
        setStatus("error");
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
      setStatus("error");
    }
  };

  return (
    <div className="bg-[#0a0715] min-h-screen text-white font-sans selection:bg-[#E6FA05] selection:text-black flex flex-col">
      <Navbar />

      <main className="flex-grow flex items-center justify-center px-6 lg:px-8 relative">
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#493DE6]/20 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#E6FA05]/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-2xl w-full mx-auto relative z-10 py-32">

          {/* Success / Already state */}
          {(status === "success" || status === "already") ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="w-24 h-24 bg-[#E6FA05]/20 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                <div className="absolute inset-0 bg-[#E6FA05]/10 rounded-full animate-ping" />
                <CheckCircle className="w-12 h-12 text-[#E6FA05] relative z-10" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                {status === "already" ? "You're already in!" : "You're on the list!"}
              </h1>
              <p className="text-xl text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
                {status === "already"
                  ? "We already have your email. You'll be the first to know when we launch."
                  : "We'll send you early access when the Kweli app is ready."}
              </p>
              {status === "already" && pendingRewards > 0 && (
                <div className="inline-flex items-center gap-3 bg-[#E6FA05]/10 border border-[#E6FA05]/20 rounded-2xl px-6 py-4 mb-8">
                  <span className="text-2xl font-bold text-[#E6FA05]">{pendingRewards}</span>
                  <span className="text-[#E6FA05] font-mono">VFY</span>
                  <span className="text-gray-400 text-sm">pending rewards</span>
                </div>
              )}
            </motion.div>
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-gray-400 mb-8">
                  <Sparkles className="w-4 h-4 text-[#E6FA05]" />
                  Early Access
                </div>
                <h1 className="text-5xl md:text-6xl lg:text-[5rem] font-bold tracking-tight mb-6 leading-[1.05]">
                  Join the <span className="text-[#E6FA05]">Kweli</span><br />
                  Movement
                </h1>
                <p className="text-xl md:text-2xl text-gray-400 max-w-xl mx-auto leading-relaxed">
                  Get early access to the app that pays you to fight fakes. Be among the first to verify, report, and earn.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="max-w-lg mx-auto mb-16">
                {status === "error" && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-sm mb-6 text-center">
                    {errorMessage}
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
                    placeholder="Enter your email"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#E6FA05] focus:ring-1 focus:ring-[#E6FA05]/50 transition-all text-lg"
                    required
                  />
                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="bg-[#E6FA05] text-black font-bold text-lg px-8 py-4 rounded-xl hover:bg-[#d4e604] transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0"
                  >
                    {status === "submitting" ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>Join <ArrowRight className="w-5 h-5" /></>
                    )}
                  </button>
                </div>
                <p className="text-gray-600 text-xs mt-4 text-center">No spam. Unsubscribe anytime.</p>
              </form>

              {/* Value Props */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                {[
                  { icon: Shield, title: "Verify Instantly", desc: "Scan any product to check if it's real before you buy." },
                  { icon: Zap, title: "Earn VFY Tokens", desc: "Get rewarded for every scan and every fake you report." },
                  { icon: Sparkles, title: "Early Perks", desc: "Waitlist members get bonus tokens and priority access." },
                ].map((item, i) => (
                  <div key={i} className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 text-center hover:border-white/10 transition-colors">
                    <div className="w-12 h-12 bg-[#E6FA05]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <item.icon className="w-6 h-6 text-[#E6FA05]" />
                    </div>
                    <h3 className="font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
