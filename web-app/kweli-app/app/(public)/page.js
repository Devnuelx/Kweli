"use client";

import { useState, useEffect, useRef } from "react";
import { QrCode, Smartphone, CheckCircle2, ArrowDown as ArrowRight, Package, TrendingUp, Shield, Trophy, Zap, Gift, Star, Lock, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";



function TypewriterText({ text, delay = 50, className = "" }) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= text.length) {
        setDisplayedText(text.slice(0, currentIndex));
        currentIndex++;
      } else {
        setIsComplete(true);
        clearInterval(interval);
      }
    }, delay);

    return () => clearInterval(interval);
  }, [text, delay, isVisible]);

  return (
    <span ref={ref} className={className}>
      {displayedText}
      {!isComplete && <span className="animate-pulse">|</span>}
    </span>
  );
}

function AnimatedNumber({ value, duration = 2000, suffix = "" }) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    const numericValue = parseInt(value.replace(/[^0-9]/g, ''));
    const steps = 60;
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

export default function LandingPage() {
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [showWebModal, setShowWebModal] = useState(false);
  const hashscanNetwork = process.env.NEXT_PUBLIC_HEDERA_NETWORK || "testnet";
  const hcsTopic = process.env.NEXT_PUBLIC_HEDERA_TOPIC_ID; // e.g. 0.0.x
  const htsToken = process.env.NEXT_PUBLIC_HEDERA_TOKEN_ID; // e.g. 0.0.y
  const [showMobileNotice, setShowMobileNotice] = useState(() => {
    try {
      // default: show notice unless user previously dismissed
      return typeof window !== 'undefined' ? localStorage.getItem('mobile_notice_dismissed') !== '1' : true;
    } catch (e) {
      return true;
    }
  });

  const dismissMobileNotice = () => {
    try {
      localStorage.setItem('mobile_notice_dismissed', '1');
    } catch (e) {}
    setShowMobileNotice(false);
  };

  return (
    <>
      <style jsx global>{`
        * {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        *::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="bg-[#0A0E27] text-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Web App Modal */}
        {showWebModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0A0E27] border border-white/10 rounded-2xl max-w-md w-full p-6 relative">
              <button 
                onClick={() => setShowWebModal(false)}
                className="absolute right-4 top-4 text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="text-center">
                <Smartphone className="w-12 h-12 mx-auto mb-4 text-blue-400" />
                <h3 className="text-xl font-bold mb-2">Try Our Mobile App Instead</h3>
                <p className="text-gray-400 mb-6">
                  Get the best experience and earn 10 tokens when you download our mobile app!
                </p>
                
                <div className="flex flex-col gap-3">
                  <a
                    href="https://expo.dev/preview/update?message=Fix+assets&updateRuntimeVersion=1.0.0&createdAt=2025-10-28T15%3A34%3A35.106Z&slug=exp&projectId=aea820d4-6839-4ab6-a9ef-be6944be8cf0&group=62a10b29-834d-4415-b88a-8e0e5799cba6"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                  >
                    Download Mobile App
                  </a>
                  <a
                    href="https://kweli-scanner-web.vercel.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
                  >
                    Continue to Web Version
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
        <Navbar />
      
      {/* Snap Scroll Container - Only Hero and Stats */}
      <div className="h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth">
        {/* Hero Section */}
        <section className="min-h-screen snap-start flex items-center justify-center relative px-6 lg:px-8 pt-20 pb-12 md:pb-20">
          {/* QR code background */}
          <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
            <div className="absolute top-10 right-[-50] md:top-20 md:left-150 lg:left-280 w-[200px] h-[200px] md:w-[400px] md:h-[400px] opacity-[0.1]">
              <QrCode className="w-full h-full text-white" strokeWidth={0.3} />
            </div>
            <div className="absolute bottom-10 left-[-50] md:bottom-20 md:right-150 lg:right-280 w-[250px] h-[250px] opacity-[0.1]">
              <QrCode className="w-full h-full text-white" strokeWidth={0.3} />
            </div>
          </div>
          <div className="max-w-6xl mx-auto relative z-10 w-full">
            <div className="text-center max-w-4xl mx-auto pt-4 md:pt-8">
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-6 md:mb-8">
                <span className="text-xs md:text-sm text-gray-300 font-grotesk">Powered by Hedera</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium mb-4 md:mb-6 leading-tight font-neue">
                Know the Kweli.
                <br />
                <span className="text-white">
                  It will set you free.
                </span>
              </h1>
              
              <p className="text-base md:text-xl text-gray-400 mb-8 md:mb-12 leading-relaxed max-w-2xl mx-auto font-grotesk px-4">
                Combat counterfeit products with blockchain-powered verification. 
                Protect your brand, empower consumers, build trust.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-center px-4">
                <a
                  href="https://expo.dev/preview/update?message=Fix+assets&updateRuntimeVersion=1.0.0&createdAt=2025-10-28T15%3A34%3A35.106Z&slug=exp&projectId=aea820d4-6839-4ab6-a9ef-be6944be8cf0&group=62a10b29-834d-4415-b88a-8e0e5799cba6"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:shadow-2xl hover:shadow-purple-500/20 transition-all flex items-center justify-center space-x-2"
                >
                  <Smartphone className="w-5 h-5" />
                  <span>Download App</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
                <button
                  onClick={() => setShowWebModal(true)}
                  className="flex flex-col items-center justify-center px-8 py-4 bg-white/5 border border-white/10 rounded-xl font-medium hover:bg-white/10 transition-all backdrop-blur-sm"
                >
                  Try Web verify
                </button>
              </div>
            </div>
          </div>
        </section>
        {/* Stats Section with Typewriter */}
        <section className="min-h-screen snap-start flex items-center justify-center relative px-6 lg:px-8 py-12 md:py-20">
          <div className="max-w-5xl mx-auto">
            <div className="space-y-8 md:space-y-12 font-grotesk">
              <div className="space-y-4 md:space-y-6">
                <p className="text-lg md:text-xl lg:text-2xl text-gray-300 leading-relaxed">
                  <TypewriterText 
                    text="Every year, counterfeit products wreak havoc across Africa and the world." 
                    delay={30}
                  />
                </p>
                <div className="flex items-baseline gap-3 md:gap-4 flex-wrap">
                  <span className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white font-neue transform hover:scale-105 transition-transform">
                    $<AnimatedNumber value="6" suffix="B+" />
                  </span>
                  <span className="text-lg md:text-xl lg:text-2xl text-gray-400">lost annually to fake products</span>
                </div>
              </div>

              <div className="space-y-4 md:space-y-6">
                <div className="flex items-baseline gap-3 md:gap-4 flex-wrap">
                  <span className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-red-400 font-neue transform hover:scale-105 transition-transform">
                    <AnimatedNumber value="450000" suffix="+" />
                  </span>
                  <span className="text-lg md:text-xl lg:text-2xl text-gray-400">lives lost each year</span>
                </div>
                <p className="text-base md:text-xl text-gray-300 leading-relaxed">
                  Counterfeit <span className="text-white font-medium">pharmaceuticals</span>, <span className="text-white font-medium">beverages</span>, <span className="text-white font-medium">electronics</span>, <span className="text-white font-medium">cosmetics</span>, and <span className="text-white font-medium">automotive parts</span> don&apos;t just hurt profits, they destroy lives and erode trust.
                </p>
              </div>

              <div className="pt-6 md:pt-8 border-t border-white/10">
                <p className="text-xl md:text-2xl lg:text-3xl text-white leading-relaxed font-medium">
                  <TypewriterText 
                    text="It's time to fight back with technology that can't be faked." 
                    delay={40}
                  />
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Regular Scroll Container - Rest of the sections */}

      {/* The Kweli Way */}

      <section className="min-h-screen flex items-center justify-center py-12 md:py-20 px-6 lg:px-8">
         <div className="max-w-6xl mx-auto w-full">
           <div className="gap-8 md:gap-12 items-center">
             <div>
               <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 font-neue">
                 The Kweli Way
               </h2>
               <p className="text-gray-400 text-base md:text-lg mb-6 md:mb-8 leading-relaxed font-grotesk">
                 Every day, millions of people unknowingly buy counterfeit medicines, beverages, electronics, cosmetics, and more. These fake products don&apos;t just waste your money, they can seriously harm your health.
               </p>
               <p className="text-gray-400 text-base md:text-lg mb-8 leading-relaxed font-grotesk">
                 Kweli uses Hedera blockchain technology to give you instant verification. Products are registered on the blockchain and verified by scanning the QR code. Know immediately if it&apos;s authentic or fake before you buy. Do it the Kweli way.
               </p>
               
             </div>

           </div>
         </div>
       </section>
      
      {/* On-chain Transparency */}
      <section className="min-h-screen flex items-center justify-center py-12 md:py-20 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 font-neue">
              On-chain Transparency
            </h2>
            <p className="text-base md:text-xl text-gray-400 max-w-2xl mx-auto font-grotesk">
              Every product registration and verification is recorded on Hedera. Public. Immutable. Verifiable by anyone.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-10">
            {[
              { title: "Immutable Records", desc: "Data is tamper-proof and append-only.", icon: Lock },
              { title: "Publicly Verifiable", desc: "Anyone can independently verify entries.", icon: QrCode },
              { title: "Real-time Proof", desc: "View transactions on the Hedera explorer.", icon: Shield },
            ].map((item, i) => (
              <div key={i} className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2 font-neue">{item.title}</h3>
                <p className="text-gray-400 font-grotesk">{item.desc}</p>
              </div>
            ))}
          </div>

          <OnChainLinks />
        </div>
      </section>

      {/* On-chain Links helper */}
      {/* Using NEXT_PUBLIC_ vars so they are available client-side */}
      
      <div>
        {/* How It Works */}
        <section id="how-it-works" className="min-h-screen flex items-center justify-center py-12 md:py-20 px-6 lg:px-8 relative">
          <div className="max-w-6xl mx-auto w-full">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 font-neue">
                Three steps to
                <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"> authentic trust</span>
              </h2>
              <p className="text-base md:text-xl text-gray-400 max-w-2xl mx-auto font-grotesk">
                Simple, secure, and scalable product verification
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              {[
                {
                  step: "01",
                  title: "Download & Open App",
                  description: "Get the free Kweli app from your app store. No signup required to start scanning.",
                  icon: Smartphone,
                  color: "blue"
                },
                {
                  step: "02",
                  title: "Scan QR Code",
                  description: "Each product receives a cryptographically secure QR code stored immutably on Hedera.",
                  icon: QrCode,
                  color: "purple"
                },
                {
                  step: "03",
                  title: "Get Verified + Rewards",
                  description: "See if it's real or fake. Earn points for every scan that you can redeem for rewards.",
                  icon: Trophy,
                  color: "cyan"
                }
              ].map((item, i) => (
                <div
                  key={i}
                  onMouseEnter={() => setHoveredFeature(i)}
                  onMouseLeave={() => setHoveredFeature(null)}
                  className="relative group"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${
                    item.color === 'blue' ? 'from-blue-600/20 to-blue-900/20' :
                    item.color === 'purple' ? 'from-purple-600/20 to-purple-900/20' :
                    'from-cyan-600/20 to-cyan-900/20'
                  } rounded-3xl blur-xl transition-all ${hoveredFeature === i ? 'opacity-100' : 'opacity-0'}`}></div>
                  
                  <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 h-full hover:bg-white/10 transition-all">
                    <div className="text-4xl md:text-6xl font-bold text-white/10 mb-4 font-neue">{item.step}</div>
                    <div className={`w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br ${
                      item.color === 'blue' ? 'from-blue-500 to-blue-600' :
                      item.color === 'purple' ? 'from-purple-500 to-purple-600' :
                      'from-cyan-500 to-cyan-600'
                    } rounded-2xl flex items-center justify-center mb-4 md:mb-6`}>
                      <item.icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3 font-neue">{item.title}</h3>
                    <p className="text-sm md:text-base text-gray-400 leading-relaxed font-grotesk">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section id="features" className="min-h-screen flex items-center justify-center py-12 md:py-20 px-6 lg:px-8">
          <div className="max-w-6xl mx-auto w-full">
            <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 font-neue">
                  Earn Rewards for 
                  <br />
                  <span className="bg-gradient-to-r from-blue-400 to-purple-200 bg-clip-text text-transparent">
                  staying safe
                  </span>
                </h2>
                <p className="text-gray-400 text-base md:text-lg mb-6 md:mb-8 leading-relaxed font-grotesk">
                  Join the movement. Save life, save business, save yourself. Every time you scan and verify a product, you earn points. 
                  The more you verify, the more you earn. It pays to stay protected!
                </p>
                
                <div className="space-y-4 mb-8">
                  {[
                    { icon: Zap, text: "50 points per product scan", color: "yellow" },
                    { icon: Gift, text: "Bonus points for first scans", color: "purple" },
                    { icon: Star, text: "Redeem for airtime, data, and more", color: "pink" },
                    { icon: CheckCircle2, text: "Special rewards from brands", color: "green" }
                  ].map((reward, i) => (
                    <div key={i} className="flex items-center space-x-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                      <div className={`w-10 h-10 bg-gradient-to-br ${
                        reward.color === 'yellow' ? 'from-yellow-500 to-yellow-600' :
                        reward.color === 'purple' ? 'from-purple-500 to-purple-600' :
                        reward.color === 'pink' ? 'from-pink-500 to-pink-600' :
                        'from-green-500 to-green-600'
                      } rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <reward.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-gray-300">{reward.text}</span>
                    </div>
                  ))}
                </div>

                <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-medium hover:shadow-2xl hover:shadow-purple-500/20 transition-all">
                  Start Earning Today
                </button>
              </div>

              <div className="relative font-grotesk">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 to-blue-600/30 rounded-3xl blur-3xl"></div>
                <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8">
                  <h3 className="text-2xl font-bold mb-6">Your Rewards Balance</h3>
                  
                    <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl p-8 mb-6">
                    <p className="text-sm text-purple-200 mb-2">Total Points Earned</p>
                    <div className="text-5xl font-bold mb-4">2,450</div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-purple-200">49 products verified</span>
                      <span className="text-purple-200">This month</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold">₦500 Airtime</p>
                        <p className="text-sm text-gray-400">500 points</p>
                      </div>
                      <button className="px-4 py-2 bg-purple-500 rounded-lg text-sm hover:bg-purple-600 transition">
                        Redeem
                      </button>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold">1GB Data</p>
                        <p className="text-sm text-gray-400">1,000 points</p>
                      </div>
                      <button className="px-4 py-2 bg-purple-500 rounded-lg text-sm hover:bg-purple-600 transition">
                        Redeem
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="min-h-screen flex items-center justify-center py-12 md:py-20 px-6 lg:px-8">
          <div className="max-w-4xl mx-auto w-full">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-cyan-600/30 rounded-3xl blur-2xl"></div>
              <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 md:p-12 text-center">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 font-neue">
                  Ready to make a difference?
                </h2>
                <p className="text-base md:text-xl text-gray-400 mb-6 md:mb-8 max-w-2xl mx-auto font-grotesk">
                  Join the movement to save lives, save business, and save yourself.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button className="px-6 md:px-8 py-3 md:py-4 bg-white text-black rounded-xl font-medium hover:shadow-2xl hover:shadow-white/20 transition-all font-grotesk">
                    Start Earning Today
                  </button>
                  <a
                    href="https://expo.dev/preview/update?message=Fix+assets&updateRuntimeVersion=1.0.0&createdAt=2025-10-28T15%3A34%3A35.106Z&slug=exp&projectId=aea820d4-6839-4ab6-a9ef-be6944be8cf0&group=62a10b29-834d-4415-b88a-8e0e5799cba6"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 md:px-8 py-3 md:py-4 bg-white/10 border border-white/20 rounded-xl font-medium hover:bg-white/20 transition-all font-grotesk inline-block"
                  >
                      Download User App
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <Footer />
      </div>
    </div>
    </>
  );
}

// Simple client helper to render HashScan links if configured
function OnChainLinks() {
  const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || "testnet";
  const topic = process.env.NEXT_PUBLIC_HEDERA_TOPIC_ID;
  const token = process.env.NEXT_PUBLIC_HEDERA_TOKEN_ID;

  const base = `https://hashscan.io/${network}`;
  const links = [
    topic ? { label: "View HCS Topic", href: `${base}/topic/${topic}` } : null,
    token ? { label: "View Token (HTS)", href: `${base}/token/${token}` } : null,
  ].filter(Boolean);

  if (links.length === 0) {
    return (
      <div className="text-center text-gray-400 font-grotesk">
        Configure NEXT_PUBLIC_HEDERA_TOPIC_ID or NEXT_PUBLIC_HEDERA_TOKEN_ID to enable explorer links.
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      {links.map((l, i) => (
        <a
          key={i}
          href={l.href}
          target="_blank"
          rel="noreferrer"
          className="px-6 py-3 bg-white/10 border border-white/20 rounded-xl font-medium hover:bg-white/20 transition-all font-grotesk"
        >
          {l.label}
        </a>
      ))}
    </div>
  );
}