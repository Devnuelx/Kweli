"use client";

import { useState, useEffect, useRef } from "react";
import { QrCode, Smartphone, CheckCircle2, ArrowRight, Package, TrendingUp, Shield, Menu, X, BarChart3, Globe, Zap, Lock, Loader2 } from "lucide-react";
import WorldMap from "@/components/WorlMap";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

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
    <div className="overflow-y-auto snap-y snap-mandatory bg-[#0A0E27] text-white scroll-smooth font-grotesk">
      <Navbar />

      {/* Hero Section side-by-side with Map */}
      <section className="min-h-screen snap-start relative px-6 lg:px-8 pt-32 pb-12">
        <div className="max-w-6xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            {/* Left: Hero content */}
            <div className="relative z-10 max-w-2xl text-left">
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm mb-6">
                <Shield className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-blue-300">Enterprise-Grade Security</span>
              </div>

              <h1 className="text-3xl sm:text-6xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight font-neue">
                Protect Your Brand.
                <br />
                <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  Stop Counterfeits.
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed max-w-3xl">
                Blockchain-powered product authentication to protect your revenue, 
                brand reputation, and customer trust.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-start mb-12">
                <button onClick={handleGetStarted} className={`group px-8 py-4 bg-white text-black rounded-xl font-medium hover:shadow-2xl hover:shadow-white/20 transition-all flex items-center justify-center space-x-2 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`} type="button" disabled={loading}>
                  <span>{loading ? 'Loading...' : 'Get Started'}</span>
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  )}
                </button>
                <button className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl font-medium hover:bg-white/10 transition-all backdrop-blur-sm">
                  Get in Touch
                </button>
              </div>

              <div className="flex items-center justify-start space-x-8 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>Protect your brand & consumers</span>
                </div>
              </div>
            </div>

            {/* Right: World map slightly bleeding under the left content */}
            <div className="relative min-h-[60vh] md:min-h-[70vh] -ml-4 lg:-ml-12 w-full">
              <div className="absolute inset-0 left-[-1%] lg:left-[-10%]">
                <WorldMap showMetrics={true} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Impact Section */}
      <section className="snap-start flex items-center justify-center relative px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 font-neue">
              The Cost of Counterfeits
            </h2>
            <p className="text-xl text-gray-400">
              Every fake product sold damages your brand and steals your revenue
            </p>
          </div>
          
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <div className="text-6xl md:text-7xl font-bold text-white font-neue">
                $<AnimatedNumber value="6" suffix="B+" />
              </div>
              <p className="text-xl text-gray-300">
                lost annually to counterfeits in Africa
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <div className="text-center p-6">
                <div className="text-3xl font-bold text-red-400 mb-2 font-neue">15-20%</div>
                <p className="text-gray-400">Revenue loss from fakes</p>
              </div>
              <div className="text-center p-6">
                <div className="text-3xl font-bold text-red-400 mb-2 font-neue">
                  <AnimatedNumber value="4500000" suffix="+" />
                </div>
                <p className="text-gray-400">Lives lost to fake drugs yearly</p>
              </div>
              <div className="text-center p-6">
                <div className="text-3xl font-bold text-red-400 mb-2 font-neue">70%</div>
                <p className="text-gray-400">Customers lose trust after fakes</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="min-h-screen snap-start flex items-center justify-center py-12 px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-neue">
              How It Works
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Three simple steps to protect every product you sell
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
          {[
            {
              step: "1",
              title: "Sign Up & Add Products",
              description:
                "Create your account and upload your products — one by one or in bulk using a CSV file. Each product is securely registered on our blockchain for authenticity tracking.",
              icon: Package,
              details:
                "Add products manually or import a CSV list for faster onboarding."
            },
            {
              step: "2",
              title: "Generate & Embed QR Codes",
              description:
                "We don’t just create your unique, tamper-proof QR codes — we can also embed them directly into your product template. Simply upload your design and mark where the code should appear.",
              icon: QrCode,
              details:
                "Upload your packaging or label design, choose the placement area, and we’ll automatically print unique QR codes onto each product."
            },
            {
              step: "3",
              title: "Customers Verify Instantly",
              description:
                "Customers scan the QR code using their phones to verify authenticity in seconds. You get notified of every scan and can monitor real-time activity across your products.",
              icon: Smartphone,
              details:
                "Receive instant alerts for every scan and stay ahead of suspicious verification attempts."
            }
          ].map((item, i) => (
              <div key={i} className="flex gap-6 items-start">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-2xl font-bold">
                    {item.step}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold font-neue">{item.title}</h3>
                    <item.icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <p className="text-lg text-gray-300 mb-2">{item.description}</p>
                  <p className="text-sm text-gray-500 italic">{item.details}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <button onClick={handleGetStarted} className={`px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-2xl hover:shadow-blue-500/20 transition-all ${loading ? 'opacity-60 cursor-not-allowed' : ''}`} type="button" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2 inline-block" />
                  Loading...
                </>
              ) : (
                'Get Started Now'
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="snap-start flex items-center justify-center py-20 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-neue">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Powerful features to protect your products and grow your business
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: Shield,
                title: "Blockchain Security",
                description: "Every product is registered on an immutable blockchain. Once recorded, it cannot be altered or faked."
              },
              {
                icon: Zap,
                title: "2-Second Verification",
                description: "Customers scan the QR code and instantly know if their product is authentic. No app download required."
              },
              {
                icon: BarChart3,
                title: "Live Dashboard",
                description: "See every scan in real-time. Track where your products are being verified and detect suspicious patterns."
              },
              {
                icon: Lock,
                title: "Fraud Alerts",
                description: "Get instant notifications when the same QR code is scanned multiple times or from suspicious locations."
              }
            ].map((feature, i) => (
              <div key={i} className="flex gap-4 items-start p-6 rounded-2xl hover:bg-white/5 transition-all">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 font-neue">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="snap-start flex items-center justify-center py-20 px-6 lg:px-8">
        <div className="max-w-3xl mx-auto w-full text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 font-neue">
            Stop Losing Revenue to Fakes
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Protect your products, your customers, and your brand reputation
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={handleGetStarted} className={`px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-2xl transition-all ${loading ? 'opacity-60 cursor-not-allowed' : ''}`} type="button" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2 inline-block" />
                  Loading...
                </>
              ) : (
                'Get Started'
              )}
            </button>
            <button className="px-8 py-4 border border-white/20 rounded-xl font-medium hover:bg-white/10 transition-all">
              Get in Touch
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-6">
            No credit card required • Secure for free
          </p>
        </div>
      </section>
      <Footer/> 
    </div>
  );
}