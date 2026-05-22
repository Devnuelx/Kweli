"use client";

import { useState, useEffect, useRef } from "react";
import { QrCode, Smartphone, CheckCircle2, ArrowRight, Package, TrendingUp, Shield, Menu, X, BarChart3, Globe, Zap, Lock, Loader2, Send, RefreshCw, Wallet } from "lucide-react";
import WorldMap from "@/components/WorlMap";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BentoGrid, BentoGridItem } from "@/components/BentoGrid";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
function AnimatedNumber({ value, duration = 1500, suffix = "" }) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsVisible(true);
          setHasAnimated(true);
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  useEffect(() => {
    if (!isVisible) return;

    const numericValue = parseInt(value.replace(/[^0-9]/g, ''));
    const steps = 40;
    const increment = numericValue / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= numericValue) {
        setCount(numericValue);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, duration, isVisible]);

  return (
    <span ref={ref} className="inline-block">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export default function BusinessLanding() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  const isBusiness = pathname.startsWith("/business");

  const handleGetStarted = () => {
    setLoading(true);
    if (session) {
      // For authenticated users, use immediate navigation
      window.location.href = '/dashboard';
    } else {
      // For unauthenticated users, redirect to login
      window.location.href = `/login?callbackUrl=${encodeURIComponent('/dashboard')}`;
    }
  };
  return (
    <div className="overflow-x-hidden bg-[#0A0E27] text-white scroll-smooth font-funnel-display selection:bg-blue-500/30">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pb-32 overflow-hidden min-h-screen flex items-center justify-center font-funnel-display">
        {/* Background Dome Effect */}
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
        <div className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] border border-white/5 rounded-full z-0" />

        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 relative z-10 flex flex-col items-center text-center">

          {/* Flags / Countries Pill */}
          <div className="inline-flex items-center space-x-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-10">
            <div className="flex -space-x-1">
              {['🇺🇸', '🇬🇧', '🇪🇺', '🇳🇬', '🇰🇪'].map((flag, i) => (
                <div key={i} className="w-6 h-6 rounded-full border border-[#0A0E27] bg-gray-800 flex items-center justify-center text-xs">
                  {flag}
                </div>
              ))}
            </div>
            <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
              OVER 11,800 BUSINESSES SECURE PRODUCTS WITH KWELI
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-bold tracking-tight text-white leading-[1.05] mb-8 max-w-5xl">
            Authenticity at the<br />
            speed of business
          </h1>

          <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl leading-relaxed">
            Register products on the blockchain, issue tamper-proof QR codes, and gain real-time insights into your supply chain. Protect your brand and save lives.
          </p>

          <form className="flex flex-col sm:flex-row gap-3 w-full max-w-xl mb-12" onSubmit={(e) => { e.preventDefault(); handleGetStarted(); }}>
            <input
              type="email"
              placeholder="Enter your business email address"
              className="flex-1 px-6 py-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 transition-colors text-white placeholder:text-gray-500"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-white text-[#0A0E27] rounded-xl font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Get started"}
            </button>
          </form>
        </div>
      </section>

      {/* Stats Impact Section - Bento Grid */}
      <section className="bg-[#05051a] py-24 md:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-4">
              Numbers Don't Lie
            </h2>
          </div>

          {/* The Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-10 gap-4 auto-rows-[300px]">

            {/* Card 1: $1B+ (Spans 6/10 columns) */}
            <motion.div
              whileHover={{ y: -5 }}
              className="md:col-span-6 bg-[#0a0a23]/50 rounded-[40px] p-10 border border-indigo-500/20 flex flex-col justify-center relative overflow-hidden group"
            >
              <div className="flex -space-x-3 mb-8">
                {['🇺🇸', '🇬🇧', '🇪🇺', '🇳🇬', '🇰🇪'].map((flag, i) => (
                  <div key={i} className="w-12 h-12 rounded-full border-2 border-[#05051a] bg-gray-800 flex items-center justify-center text-2xl shadow-xl z-[5]">
                    {flag}
                  </div>
                ))}
              </div>
              <h3 className="text-5xl md:text-6xl font-bold text-white mb-2">Over $1 billion</h3>
              <p className="text-gray-400 text-xl">of revenue lost to counterfeit products yearly</p>
              {/* Soft Glow */}
              <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full group-hover:bg-indigo-500/20 transition-colors" />
            </motion.div>

            {/* Card 2: 95% (Spans 4/10 columns) */}
            <motion.div
              whileHover={{ y: -5 }}
              className="md:col-span-4 bg-[#0a0a23]/50 rounded-[40px] p-10 border border-indigo-500/20 flex flex-col justify-center relative overflow-hidden group"
            >
              <div className="mb-8">
                <Send className="w-8 h-8 text-indigo-400 transform -rotate-12" />
              </div>
              <h3 className="text-5xl font-bold text-white mb-2">95%</h3>
              <p className="text-gray-400 text-lg">of counterfeit products are untraceable</p>
            </motion.div>

            {/* Card 3: 10,000+ (Spans 4/10 columns) */}
            <motion.div
              whileHover={{ y: -5 }}
              className="md:col-span-4 bg-[#0a0a23]/50 rounded-[40px] p-10 border border-indigo-500/20 flex flex-col justify-center relative overflow-hidden group"
            >
              <div className="mb-8">
                <RefreshCw className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-5xl font-bold text-white mb-2">10,000+</h3>
              <p className="text-gray-400 text-lg">Lives can be saved from counterfeit products</p>
            </motion.div>

            {/* Card 4: 15% saved (Spans 6/10 columns) */}
            <motion.div
              whileHover={{ y: -5 }}
              className="md:col-span-6 bg-[#0a0a23]/50 rounded-[40px] p-10 border border-indigo-500/20 flex flex-col justify-center relative overflow-hidden group"
            >
              <div className="mb-8">
                <Wallet className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-5xl md:text-6xl font-bold text-white mb-2">50%</h3>
              <p className="text-gray-400 text-xl leading-relaxed">
                of revenue lost to counterfeit products can be recovered
              </p>
              {/* Soft Glow */}
              <div className="absolute -top-10 -left-10 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full group-hover:bg-purple-500/20 transition-colors" />
            </motion.div>

          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 md:py-32 px-6 lg:px-8 relative bg-[#0A0E27]">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 font-funnel-display tracking-tight">
              Scale without limits
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Three simple steps to protect every product and expand your global reach.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Onboard Products",
                description:
                  "Create your account and upload products in bulk. Each item is securely registered on the blockchain.",
                icon: Package,
                bgColor: "bg-blue-500/10",
                iconColor: "text-blue-400"
              },
              {
                step: "02",
                title: "Embed QR Codes",
                description:
                  "Generate tamper-proof codes and embed them directly into your product designs or packaging.",
                icon: QrCode,
                bgColor: "bg-purple-500/10",
                iconColor: "text-purple-400"
              },
              {
                step: "03",
                title: "Monitor Growth",
                description:
                  "Track every scan in real-time. Gain deep insights into product movement and consumer behavior.",
                icon: Smartphone,
                bgColor: "bg-green-500/10",
                iconColor: "text-green-400"
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className="p-8 rounded-[32px] bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-all flex flex-col items-start"
              >
                <div className={`w-14 h-14 rounded-2xl ${item.bgColor} flex items-center justify-center mb-8`}>
                  <item.icon className={`w-6 h-6 ${item.iconColor}`} />
                </div>
                <div className="text-sm font-mono text-gray-500 mb-4">{item.step}</div>
                <h3 className="text-2xl font-bold mb-4 font-funnel-display text-white">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed mb-6">{item.description}</p>
                <Link href="#" className="mt-auto text-white font-semibold flex items-center gap-2 group">
                  Learn more <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="mt-20 text-center">
            <button onClick={handleGetStarted} className={`px-10 py-5 bg-white text-[#0A0E27] rounded-2xl font-bold hover:scale-105 transition-all shadow-xl shadow-white/5 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`} type="button" disabled={loading}>
              Get Started Now
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 md:py-32 px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-6xl font-bold mb-6 font-funnel-display tracking-tight text-white italic">
                The features you need,<br /> none you don't.
              </h2>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Shield,
                title: "Blockchain Security",
                description: "Immutable records for every single product batch."
              },
              {
                icon: Zap,
                title: "Dual Verification Modes",
                description: "Secure QR codes and AI visual analysis for maximum protection."
              },
              {
                icon: BarChart3,
                title: "Live Insights",
                description: "Real-time dashboard showing global scan activity."
              },
              {
                icon: Lock,
                title: "Fraud Prevention",
                description: "Instant alerts for suspicious scan patterns."
              }
            ].map((feature, i) => (
              <div key={i} className="group p-8 rounded-[40px] bg-[#111317] border border-white/5 hover:border-white/20 transition-all">
                <div className="w-12 h-12 bg-white/5 rounded-xl mb-6 flex items-center justify-center group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold mb-4 font-funnel-display text-white">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 md:py-40 px-6 lg:px-8 bg-[#0A0E27] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto w-full text-center relative z-10">
          <h2 className="text-5xl md:text-7xl font-bold mb-8 font-funnel-display tracking-tight text-white">
            Stop losing revenue<br /> to fakes.
          </h2>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Join thousands of forward-thinking brands protecting their reputation and revenue with Kweli.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleGetStarted}
              className={`px-10 py-5 bg-white text-[#0A0E27] rounded-2xl font-bold hover:scale-105 transition-all shadow-xl shadow-white/5 w-full sm:w-auto ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
              type="button"
              disabled={loading}
            >
              Get Started for Free
            </button>
            <button className="px-10 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-bold hover:bg-white/10 transition-all w-full sm:w-auto backdrop-blur-sm">
              Schedule a Demo
            </button>
          </div>
          <div className="mt-10 flex items-center justify-center gap-6 text-gray-500 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Cancel anytime
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}