"use client";

import { useState, useEffect, useRef } from "react";
import { QrCode, Smartphone, ArrowRight, Shield, TrendingUp, X, Menu, Play, Check } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import MobileHome from "@/public/svgs/mobile-home.svg";

// 1. Define the Data
const KWELI_USE_CASES = [
  {
    id: 1,
    category: "For Brands",
    title: "Protect your products, everywhere",
    description: "Issue secure, immutable QR tags to every product batch. Neutralize counterfeiters and monitor supply chain integrity in real-time.",
    image: "/usecase.avif",
    color: "bg-gray-900",
    gradient: "from-black/90 via-black/40 to-transparent",
    accent: "bg-[#E6FA05]",
    link: "/business"
  },
  {
    id: 2,
    category: "For Partners & Distributors",
    title: "Seamless operations",
    description: "Verify bulk shipments instantly. Eliminate paperwork forgery, boost transparency, and streamline cargo clearance globally.",
    image: "/screen2.jpg",
    color: "bg-[#0a0715]",
    gradient: "from-[#1d1b33] via-[#0a0715]/90 to-[#0a0715]",
    accent: "bg-[#E6FA05]",
    link: "/business"
  },
  {
    id: 3,
    category: "For Consumers",
    title: "Never buy a fake again",
    description: "Scan products with the Kweli app before you buy. See its entire origin story, verify authenticity, and get rewarded just for participating.",
    image: "/screen1.jpg",
    color: "bg-[#493DE6]",
    gradient: "from-[#3B30C5] to-[#493DE6]/80",
    accent: "bg-white",
    link: "#"
  }
];

// 2. The Individual Card Component
const StackingCard = ({ card, index, progress, range, targetScale }) => {
  const scale = useTransform(progress, range, [1, targetScale]);

  return (
    // Wrapper must have a higher z-index for each subsequent card
    <div 
      className="h-screen flex items-center justify-center sticky top-0"
      style={{ zIndex: index + 1 }} 
    >
      <motion.div
        style={{ 
          scale,
          // We apply the offset here so each card stops slightly lower than the one before it
          top: `calc(10% + ${index * 25}px)` 
        }}
        className={`relative w-full max-w-7xl h-[500px] md:h-[650px] rounded-[32px] md:rounded-[40px] shadow-2xl overflow-hidden origin-top ${card.color}`}
      >
        {/* Background & Content Logic */}
        <div className="absolute inset-0">
          <Image src={card.image} alt={card.title} fill className="object-cover opacity-60" />
        </div>
        <div className={`absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r ${card.gradient} z-10`} />

        <div className="relative z-20 h-full p-8 md:p-16 flex flex-col justify-between">
          <h3 className="text-xl md:text-2xl font-bold text-white/70 uppercase tracking-widest">
            {card.category}
          </h3>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 mt-20 md:mt-0">
            <div className="max-w-xl text-left">
              <h4 className="text-3xl md:text-5xl lg:text-[3.5rem] font-bold text-white mb-6 leading-[1.05] tracking-tight">
                {card.title}
              </h4>
              <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed max-w-lg">
                {card.description}
              </p>
              <a href={card.link} className="inline-flex items-center text-white font-semibold gap-2 hover:gap-3 transition-all group">
                Learn more 
                <span className={`${card.accent} text-black w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ml-1 transition-transform group-hover:translate-x-1`}>
                  →
                </span>
              </a>
            </div>

            {/* Wallet / Activity Mockups (index based) */}
            {index === 0 && (
              <div className="hidden lg:block w-[340px] bg-white/10 backdrop-blur-xl border border-white/20 rounded-[24px] p-6 text-white shadow-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-lg">📦</div>
                  <div>
                    <div className="font-semibold text-base">Batch #88229</div>
                    <div className="text-[#00FC82] text-[10px] font-bold">Secured</div>
                  </div>
                </div>
              </div>
            )}
            
            {index === 2 && (
              <div className="hidden lg:flex w-[320px] bg-[#2A229E]/90 backdrop-blur-xl border border-white/10 rounded-[24px] p-8 flex-col justify-between text-white shadow-2xl">
                 <div className="text-[3rem] font-bold text-white leading-none">
                    1,250 <span className="text-2xl text-[#00FC82] font-mono">VFY</span>
                 </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default function LandingPage() {
  const [showWebModal, setShowWebModal] = useState(false);
  const pathname = usePathname();
  const isBusiness = pathname.startsWith("/business");
  
  const container = useRef(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"],
  });

  return (
    // REMOVED 'overflow-x-hidden' from here
    <div className="bg-[#FDFDFD] text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      <Navbar />

      <section className="relative pt-32 pb-20 md:pb-32 overflow-hidden bg-[#493DE6] min-h-[90vh] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-r from-[#493DE6] via-[#5C51EA] to-[#493DE6] opacity-80 z-0" />

        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 relative z-10 flex flex-col md:flex-row items-center justify-between w-full h-full pt-10">

          <div className="w-full md:w-[70%] text-left z-20">
            {/* Secondary Switcher Pill */}
            {/* <div className="flex items-center p-1 rounded-full bg-white/10 border border-white/20 mb-10 w-fit backdrop-blur-sm">
              <Link 
                href="/" 
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${!isBusiness ? "bg-white text-[#493DE6]" : "text-white/60 hover:text-white"}`}
              >
                Personal
              </Link>
              <Link 
                href="/business" 
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${isBusiness ? "bg-white text-[#493DE6]" : "text-white/60 hover:text-white"}`}
              >
                Business
              </Link>
            </div> */}

            {/* Tiny flags or icons above the text as seen in screenshot */}
            <div className="flex -space-x-2 mb-8 opacity-90 overflow-hidden">
              {/* Colored circles representing flags */}
              {/* {[...Array(14)].map((_, i) => (
                <div key={i} className="w-8 h-8 rounded-full border border-white/20 bg-gradient-to-br from-[#3B30C5] to-[#2A229E] opacity-80 shadow-inner flex items-center justify-center" />
              ))} */}
            </div>

            <h1 className="text-5xl md:text-5xl lg:text-[5rem] font-bold tracking-tight text-white leading-[1.05] mb-6">
              Verify Products<br />
              Get Rewarded Instantly
            </h1>
            <p className="text-base md:text-base text-white/90 mb-10 max-w-[480px] leading-relaxed">
              Scan products with the Kweli app before you buy. See its entire origin story, verify authenticity, and get rewarded just for participating.
            </p>
            <div className="flex flex-row gap-3 md:gap-4 w-full">
              <a
                href="#"
                className="flex-1 md:flex-none inline-flex items-center justify-center px-4 md:px-8 py-2 md:py-2 bg-white text-[#493DE6] rounded-xl font-semibold text-[15px] md:text-lg hover:bg-gray-50 transition duration-300"
              >
                Login
              </a>
              <a
                href="https://expo.dev/preview/update?message=Fix+assets&updateRuntimeVersion=1.0.0&createdAt=2025-10-28T15%3A34%3A35.106Z&slug=exp&projectId=aea820d4-6839-4ab6-a9ef-be6944be8cf0&group=62a10b29-834d-4415-b88a-8e0e5799cba6"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 md:flex-none inline-flex items-center justify-center px-4 md:px-8 py-2 md:py-2 bg-[#746BF3] text-white rounded-xl font-semibold text-[15px] md:text-lg hover:bg-[#6458dc] transition duration-300"
              >
                Download app
              </a>
            </div>
          </div>

          <div className="w-full md:w-[40%] relative mt-16 md:mt-0 flex justify-end z-20">
            <div className="relative w-full max-w-[600px] aspect-[4/5] rounded-t-[120px] md:rounded-t-none md:aspect-auto md:h-[600px] overflow-visible">
              {/* Mobile Dome Background */}
              <div className="absolute inset-x-0 bottom-0 top-0 rounded-t-[120px] bg-gradient-to-b from-white/10 to-transparent"></div>

              <Image
                src="/hero.png"
                alt="Kweli App User"
                fill
                priority
                className="object-cover object-bottom md:object-contain md:object-right-bottom md:scale-[1.1] md:origin-bottom-right rounded-t-[120px] md:rounded-t-none"
              />

              {/* Floating Notification */}
              <div className="absolute bottom-20 left-[-20px] md:left bg-[#3B30C5]/90 backdrop-blur-xl rounded-2xl p-4 md:p-5 w-[280px] font-poppins shadow-2xl border border-white/10 z-30">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-white font-medium text-sm">Product Verified</span>
                  <span className="text-white/60 text-xs font-semibold underline cursor-pointer">See details</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-600 border border-white/20 flex items-center justify-center text-white font-bold text-xs shadow-inner">
                      COKE
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">Coca-Cola</div>
                      <div className="text-[#00FC82] text-xs font-bold rounded-sm mt-0.5 inline-block bg-white/10 px-1 font-mono tracking-wider">
                        Genuine
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold text-lg">+10VFY</div>
                    <div className="text-white/50 text-[10px]">Just now</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AS SEEN ON Section */}
      <section className="py-12 bg-[#FDFDFD]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <span className="text-gray-400 font-semibold tracking-[0.2em] text-sm uppercase shrink-0">
              AS SEEN ON
            </span>
            <div className="flex flex-wrap justify-center md:justify-between items-center w-full gap-8 md:gap-4 opacity-70 grayscale">
              <div className="text-2xl font-bold font-serif text-black">Forbes</div>
              <div className="text-2xl font-bold font-sans text-black flex items-center gap-1"><span className="text-[#00FC82] text-3xl leading-none">TC</span> TechCrunch</div>
              <div className="text-2xl font-bold font-serif text-black">TheGuardian</div>
              <div className="text-2xl font-bold font-sans text-black opacity-80">Techpoint<span className="text-sm font-normal">.africa</span></div>
              <div className="text-2xl font-bold font-sans tracking-tighter text-black">TECHCITY</div>
            </div>
          </div>

          <div className="pt-24 text-center flex flex-col items-center">
            <div className="w-16 h-20 bg-[#831F2E] rounded-b-full flex items-center justify-center mb-8 relative">
              <Shield className="text-white w-8 h-8" />
              <div className="absolute -top-3 w-4 h-4 rounded-full bg-white flex items-center justify-center relative">
                <div className="absolute whitespace-nowrap top-5 tracking-tighter text-[10px] uppercase font-bold text-[#831F2E]">MSECB</div>
                <div className="w-2 h-2 rounded-full bg-[#831F2E]" />
              </div>
            </div>

            <h2 className="text-4xl md:text-[3.5rem] font-bold text-gray-900 mt-6 mb-2 tracking-tight">
              Authentication without borders
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-2">
              <h3 className="text-4xl md:text-[3.5rem] font-bold text-[#5629B6] tracking-tight flex items-center">
                Track global <ArrowRight className="inline w-10 h-10 md:w-12 md:h-12 ml-2" />
              </h3>
              <div className="w-[4.5rem] h-10 bg-[#E8DDF5] rounded-full p-1 relative flex items-center cursor-pointer ml-4">
                <div className="w-8 h-8 bg-[#5629B6] rounded-full flex items-center justify-center translate-x-8 shadow-sm">
                  <div className="text-white text-sm">⚡</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Foreign Bank Accounts Light Blue Section */}
      <section className="pt-24 pb-12 bg-[#FDFDFD]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="bg-[#EAF0FC] rounded-[40px] p-10 md:p-20 flex flex-col md:flex-row items-center gap-16 relative overflow-hidden min-h-[500px]">
            <div className="w-full md:w-1/2 relative z-10 text-left">
              <div className="text-[#5629B6] font-semibold tracking-widest text-sm uppercase mb-6">
                DIGITAL PRODUCT IDENTITY
              </div>
              <h2 className="text-4xl md:text-[3.5rem] font-bold text-gray-900 mb-6 leading-[1.1] tracking-tight">
                Secure your product's legacy
              </h2>
              <p className="text-lg text-gray-700 mb-10 max-w-md leading-relaxed">
                Give your products a voice. Register them on the blockchain to ensure authenticity and build lasting consumer trust.
              </p>
              <a href="/business" className="text-[#2167FF] font-semibold flex items-center gap-2 hover:gap-3 transition-all text-lg">
                Register Now <ArrowRight className="w-5 h-5 rounded-full border border-[#2167FF] p-0.5" />
              </a>
            </div>

            <div className="w-full md:w-1/2 relative z-10 h-full min-h-[400px] flex justify-center md:justify-end">
              {/* Abstract App Mockup part */}
              <div className="absolute right-0 bottom-[-50px] w-full max-w-[350px]">
                <div className="rounded-t-[30px] border-[10px] border-b-0 border-gray-900 bg-gray-50 h-[350px] w-full shadow-2xl relative">
                  <div className="p-4 flex items-center gap-2 mt-4"><div className="font-bold text-xl inline-flex items-center gap-2"><span className="text-gray-900">↺</span> Kweli</div></div>
                  <div className="p-4 space-y-5">
                    <div className="flex items-center gap-3"><div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center text-blue-500 text-xs">📦</div> <div className="h-2 bg-gray-200 rounded w-1/4"></div></div>
                    <div className="flex items-center gap-3"><div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center text-blue-500 text-xs">🛡️</div> <div className="h-2 bg-gray-200 rounded w-1/3"></div></div>
                    <div className="flex items-center gap-3"><div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center text-blue-500 text-xs">🔍</div> <div className="h-2 bg-gray-200 rounded w-1/4"></div></div>
                    <div className="flex items-center gap-3"><div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center text-blue-500 text-xs">✅</div> <div className="h-2 bg-gray-200 rounded w-2/5"></div></div>
                  </div>
                </div>
              </div>

              {/* Hovering product identity card */}
              <div className="absolute right-[5%] md:right-[15%] top-[10%] bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-8 w-[280px] md:w-[320px] z-20">
                <div className="flex gap-[-8px] mb-8">
                  <div className="w-10 h-10 rounded-full bg-blue-800 border-2 border-white shadow-sm -ml-3 first:ml-0 flex items-center justify-center text-white text-xs z-30 relative">ID</div>
                  <div className="w-10 h-10 rounded-full bg-red-600 border-2 border-white shadow-sm -ml-3 flex items-center justify-center text-white text-xs z-20 relative">QR</div>
                  <div className="w-10 h-10 rounded-full bg-blue-600 border-2 border-white shadow-sm -ml-3 flex items-center justify-center text-white text-xs z-10 relative">VFY</div>
                </div>
                <div className="space-y-6">
                  <div>
                    <div className="text-xs text-gray-400 mb-2">Product Name</div>
                    <div className="h-3 bg-gray-100 rounded-full w-24"></div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-2">Blockchain Hash</div>
                    <div className="h-3 bg-gray-100 rounded-full w-20"></div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-2">Batch Number</div>
                    <div className="h-3 bg-gray-100 rounded-full w-32"></div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-2">Scan Status</div>
                    <div className="h-3 bg-[#00FC82]/20 rounded-full w-16"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dark Foreign Account Section */}
      <section className="relative pt-32 pb-24 bg-[#111317] overflow-hidden">
        {/* Top left white curve */}
        <div className="absolute top-0 right-0 md:left-0 md:right-auto w-[60%] h-[150px] md:h-[200px] bg-[#FDFDFD] rounded-bl-[100px] md:rounded-bl-[0px] md:rounded-br-[250px] z-0" />

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center">
          <div className="w-full md:w-[45%] text-left pt-20 pb-10 z-20">
            <h2 className="text-5xl md:text-[4rem] font-bold tracking-tight text-white leading-[1.05] mb-6">
              AI-Powered<br />
              visual verification.
            </h2>
            <p className="text-lg md:text-xl text-gray-400 mb-8 max-w-[480px] leading-relaxed">
              No QR code? No problem. Simply press and hold to activate our advanced AI vision model and verify any product instantly.
            </p>
            <ul className="space-y-4 text-gray-400 mb-10 font-poppins">
              <li className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#2167FF]" />
                <span className="text-base font-medium">Cross-references product packaging</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#2167FF]" />
                <span className="text-base font-medium">Detects counterfeit visual inconsistencies</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#2167FF]" />
                <span className="text-base font-medium">Earn 5-15 VFY tokens for AI checks</span>
              </li>
            </ul>
            <a
              href="/business"
              className="inline-flex px-8 py-4 bg-[#2167FF] text-white rounded-lg font-semibold text-base hover:bg-blue-700 transition duration-300"
            >
              Get started
            </a>
          </div>
          <div className="w-full md:w-[55%] flex justify-center md:justify-end mt-10 md:mt-0 relative z-10">
            <div className="w-[300px] md:w-[350px] relative z-20 md:-mr-10">
              {/* Phone being held placeholder */}
              <div className="relative rounded-[50px] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.6)] border-[12px] border-none bg-black aspect-[9/18.5] w-full mx-auto transform -rotate-6 md:rotate-0">
                <Image
                  src={MobileHome}
                  alt="App UI"
                  priority
                  className="w-full h-full object-cover"
                />
                {/* Border simulation like Grey's purple border */}
                <div className="absolute inset-0 rounded-[28px] border-8 border-[#A97AE9] pointer-events-none"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dark Feature Cards Section */}
      <section className="py-24 bg-[#111317] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Card 1 */}
            <div className="bg-[#1C1E26] rounded-[32px] p-8 relative overflow-hidden group hover:bg-[#22242D] transition-all duration-500 cursor-pointer min-h-[380px] flex flex-col border border-white/5 hover:border-white/10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(60,60,90,0.3),_transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              {/* Fake grid lines */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px] opacity-20"></div>

              <div className="flex-1 flex items-center justify-center relative z-10 pt-10">
                <div className="text-[5rem] font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-500 to-gray-700 opacity-40 filter blur-[4px] group-hover:blur-0 transition-all duration-700 tracking-tighter">
                  Free
                </div>
              </div>
              <div className="relative z-10 mt-auto pt-8">
                <div className="text-white/40 font-mono text-sm mb-4">01</div>
                <h3 className="text-2xl font-bold text-white tracking-tight leading-[1.2] mb-3">
                  Download & Open App
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Get the free Kweli app from your app store. No signup required to start scanning.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-[#1C1E26] rounded-[32px] p-8 relative overflow-hidden group hover:bg-[#22242D] transition-all duration-500 cursor-pointer min-h-[380px] flex flex-col border border-white/5 hover:border-white/10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(60,60,90,0.3),_transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px] opacity-20"></div>

              <div className="flex-1 relative z-10 flex items-center justify-center mt-6">
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="absolute w-20 h-20 rounded-full bg-[#252833] border border-white/10 flex items-center justify-center text-4xl text-white shadow-xl -translate-x-6 -translate-y-8 group-hover:-translate-y-10 group-hover:-translate-x-8 transition-all duration-500 z-20">£</div>
                  <div className="absolute w-20 h-20 rounded-full bg-[#1A1C23] border border-white/10 flex items-center justify-center text-4xl text-white shadow-xl translate-x-6 translate-y-4 group-hover:translate-x-8 group-hover:translate-y-6 transition-all duration-500 z-10">€</div>
                  <div className="absolute w-20 h-20 flex items-center justify-center text-4xl text-white/10 shadow-xl translate-x-6 translate-y-24 group-hover:translate-x-8 group-hover:translate-y-20 transition-all duration-500 z-0 border border-white/20 rounded-full">$</div>
                </div>
              </div>
              <div className="relative z-10 mt-auto pt-8">
                <div className="text-white/40 font-mono text-sm mb-4">02</div>
                <h3 className="text-2xl font-bold text-white tracking-tight leading-[1.2] mb-3">
                  Dual Verification System
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Scan the cryptographically secure QR code, or press and hold to use our AI vision model to analyze packaging.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-[#1C1E26] rounded-[32px] p-8 relative overflow-hidden group hover:bg-[#22242D] transition-all duration-500 cursor-pointer min-h-[380px] flex flex-col border border-white/5 hover:border-white/10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(60,60,90,0.3),_transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

              <div className="flex-1 relative z-10 flex items-center justify-center w-full px-2">
                <div className="w-full bg-[#252833] rounded-2xl p-4 flex gap-4 items-center shadow-lg transform group-hover:scale-[1.02] transition-transform duration-500">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-500 text-lg">↺</span>
                  </div>
                  <div className="flex-1 pr-12">
                    <div className="text-white font-medium text-sm">Wallet Credited</div>
                    <div className="text-gray-400 text-[10px] mt-1 leading-[1.4]">Your VFY Balance has been credited with 10 VFY Points</div>
                  </div>
                  <div className="text-[9px] text-gray-500 absolute top-4 right-4">Just now</div>
                </div>
              </div>
              <div className="relative z-10 mt-auto pt-8">
                <div className="text-white/40 font-mono text-sm mb-4">03</div>
                <h3 className="text-2xl font-bold text-white tracking-tight leading-[1.2] mb-3">
                  Get Verified + Rewards
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  See if it's real or fake. Earn points for every scan that you can redeem for rewards.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Use Cases Deck Section */}
      <section className="bg-[#FDFDFD] relative pt-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center mb-8">
          <h2 className="text-4xl md:text-5xl lg:text-[4rem] font-bold text-gray-900 tracking-tight mb-6">
            Who is Kweli for?
          </h2>
        </div>

        {/* SCROLL TRACK: Added 'h-[300vh]'. 
          This is crucial. It gives the page 3 "screens" worth of scroll
          for the cards to stack through. 
        */}
        <div ref={container} className="relative px-6 lg:px-8 h-[300vh]">
          {KWELI_USE_CASES.map((card, index) => {
            // Calculation: each card should scale down slightly as the next one appears
            const targetScale = 1 - (KWELI_USE_CASES.length - index) * 0.05;
            
            return (
              <StackingCard
                key={card.id}
                card={card}
                index={index}
                progress={scrollYProgress}
                // This range ensures the animation happens at the right time in the scroll
                range={[index * (1 / KWELI_USE_CASES.length), 1]}
                targetScale={targetScale}
              />
            );
          })}
        </div>
        
        {/* Spacer to give the last card room to stay pinned before the footer arrives */}
        <div className="h-[20vh]" />
      </section>
      {/* Report Fake CTA */}
      <section className="bg-[#0a0715] py-24 relative overflow-hidden border-t border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(230,250,5,0.12),_transparent_60%)] opacity-60"></div>
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
        
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center relative z-10 pt-10">
          <div className="w-20 h-20 bg-[#E6FA05]/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-[#E6FA05]/20 shadow-[0_0_30px_rgba(230,250,5,0.2)]">
            <Shield className="w-10 h-10 text-[#E6FA05]" />
          </div>
          <h2 className="text-5xl md:text-[4rem] font-bold text-white tracking-tight mb-6 leading-[1.05]">
            Help us fight <br className="hidden md:block"/>counterfeits.
          </h2>
          <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
            Spotted a fake product? Report it anonymously. Every verified report strengthens the Kweli ecosystem.
          </p>
          <Link href="/report" className="inline-flex items-center px-8 py-4 bg-[#E6FA05] text-black font-bold text-lg rounded-xl hover:bg-[#d4e604] transition-colors shadow-lg">
            Report a Fake Now <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}