"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { Users, Package, ShieldCheck, ArrowRight } from "lucide-react";

const KWELI_USE_CASES = [
  {
    id: 1,
    category: "For Brands & Manufacturers",
    title: "Protect your products at scale.",
    description:
      "Issue secure, immutable QR tags to every product batch. Neutralize counterfeiters and monitor supply chain integrity in real-time.",
    pills: ["Tamper-proof QR", "Batch telemetry", "Counterfeit defense"],
    image: "/usecase.avif",
    accent: "bg-[#E6FA05]",
    link: "/business",
    topBadge: "Batch #88229 • Secured",
    statCard: {
      icon: "package",
      title: "October Batch Run",
      subtitle: "Fri 30 Oct • 12,000 units",
      rows: [
        { label: "Amoxicillin 500mg", value: "8,000 Units" },
        { label: "Lipitor 20mg", value: "4,000 Units" },
      ],
      totalLabel: "Total Protected",
      totalValue: "12,000 Units",
    },
  },
  {
    id: 2,
    category: "For Logistics Partners",
    title: "Pay Your Whole Team in One Go",
    description:
      "Add your staff once. Each month, review the run, confirm with your PIN, and everyone is paid from the same wallet your sales come into.",
    pills: ["Scheduled payroll", "Payslips", "One-tap retries"],
    image: "/screen2.jpg",
    accent: "bg-[#E6FA05]",
    link: "/business",
    topBadge: "#1040 • Walk-in    Delivered",
    statCard: {
      icon: "users",
      title: "October payroll",
      subtitle: "Fri 30 Oct • 12 staff",
      rows: [
        { label: "Tunde Adeyemi", value: "₦420,000" },
        { label: "Kemi Okafor", value: "₦380,000" },
      ],
      totalLabel: "Total",
      totalValue: "₦3,480,000",
    },
  },
  {
    id: 3,
    category: "For Everyday Consumers",
    title: "Never buy a fake product again.",
    description:
      "Scan products with the Kweli app before you buy. See its entire origin story, verify authenticity, and get rewarded just for participating.",
    pills: ["Instant scan", "Origin verification", "VFY rewards"],
    image: "/screen1.jpg",
    accent: "bg-blue-600",
    link: "/scan",
    topBadge: "#9921 • Verified Genuine",
    statCard: {
      icon: "shield",
      title: "Verification & Rewards",
      subtitle: "Fri 30 Oct • 100% Authentic",
      rows: [
        { label: "Origin Verification", value: "Genuine Pfizer" },
        { label: "Hedera Consensus", value: "Confirmed" },
      ],
      totalLabel: "Reward Claimed",
      totalValue: "+50 VFY Tokens",
    },
  },
];

const renderStatIcon = (icon) => {
  if (icon === "package") {
    return <Package className="w-4 h-4 text-emerald-400" />;
  }
  if (icon === "shield") {
    return <ShieldCheck className="w-4 h-4 text-blue-400" />;
  }
  return <Users className="w-4 h-4 text-blue-400" />;
};

const StackingCard = ({ card, index, progress, range, targetScale }) => {
  const scale = useTransform(progress, range, [1, targetScale]);

  return (
    <div
      className="sticky mb-8 md:mb-0 md:h-screen md:flex md:items-center md:justify-center"
      style={{
        top: `calc(72px + ${index * 22}px)`,
        zIndex: index + 1,
      }}
    >
      <motion.div
        style={{
          scale,
          top: `calc(8% + ${index * 24}px)`,
        }}
        className="relative w-full max-w-7xl rounded-[28px] md:rounded-[36px] bg-white border border-gray-200/90 shadow-2xl shadow-black/5 overflow-hidden origin-top flex flex-col md:flex-row md:items-stretch"
      >
        {/* Top / Left: Text Content - with exact px-[28px] padding on mobile */}
        <div className="px-[28px] pt-7 sm:pt-8 md:pt-12 pb-5 md:pb-12 md:px-12 md:w-1/2 flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2 font-mono">
              {card.category}
            </div>

            <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-funnel-display text-gray-950 tracking-tight leading-[1.15] mb-3">
              {card.title}
            </h3>

            <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-5 max-w-lg font-poppins">
              {card.description}
            </p>

            {/* Pill Badges */}
            <div className="flex flex-wrap gap-2 mb-6">
              {card.pills.map((pill, pIdx) => (
                <span
                  key={pIdx}
                  className="inline-flex items-center text-xs font-medium px-3.5 py-1.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200/60"
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>

          <div>
            <a
              href={card.link}
              className="inline-flex items-center text-gray-900 font-semibold gap-2 hover:text-indigo-600 transition-colors group text-sm sm:text-base font-poppins"
            >
              Learn more
              <span className="w-7 h-7 rounded-full bg-gray-950 text-white flex items-center justify-center text-xs font-bold transition-transform group-hover:translate-x-1">
                →
              </span>
            </a>
          </div>
        </div>

        {/* Bottom / Right: Image Content - with exact px-[12px] pb-[12px] padding on mobile */}
        <div className="px-[12px] pb-[12px] md:p-3 md:w-1/2 flex flex-col justify-center">
          <div className="relative w-full h-[360px] sm:h-[400px] md:h-full md:min-h-[460px] rounded-[20px] overflow-hidden bg-gray-950 shadow-inner">
            <Image
              src={card.image}
              alt={card.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/20" />

            {/* Top Right Tag (e.g. #1040 • Walk-in Delivered) */}
            <div className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-10 bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-medium px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-lg font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{card.topBadge}</span>
            </div>

            {/* Floating Glassmorphic Stat Card (matching Figma payroll/manifest card) */}
            <div className="absolute bottom-3.5 left-3.5 right-3.5 sm:bottom-5 sm:left-5 sm:right-5 z-10 bg-[#0B1028]/85 backdrop-blur-xl border border-white/15 rounded-2xl p-4 sm:p-5 text-white shadow-2xl">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  {renderStatIcon(card.statCard.icon)}
                </div>
                <div>
                  <div className="font-semibold text-sm sm:text-base text-white">
                    {card.statCard.title}
                  </div>
                  <div className="text-xs text-gray-400">
                    {card.statCard.subtitle}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-white/10 my-3" />

              {/* Rows */}
              <div className="space-y-2">
                {card.statCard.rows.map((row, rIdx) => (
                  <div
                    key={rIdx}
                    className="flex items-center justify-between text-xs sm:text-sm"
                  >
                    <span className="text-gray-300">{row.label}</span>
                    <span className="font-semibold font-mono text-white">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="border-t border-white/10 my-3" />

              {/* Total Row */}
              <div className="flex items-center justify-between text-xs sm:text-sm pt-0.5">
                <span className="text-gray-300 font-medium">
                  {card.statCard.totalLabel}
                </span>
                <span className="font-bold font-mono text-white text-sm sm:text-base">
                  {card.statCard.totalValue}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default function UseCases() {
  const container = useRef(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"],
  });

  return (
    <section className="relative pt-32 z-10 bg-white">

      <h2 className=" font-funnel-display w-[87%] flex justify-self-center font-bold text-4xl md:text-6xl">Ready.<br/> Set.<br/> Verified!</h2>

      {/* Dark Feature Cards Section */}
      <section className="py-24 bg-[#ffffff] border-t border-white/5 font-poppins">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Card 1 */}
            <div className="bg-[#eddfd0]  rounded-[32px] p-8 relative overflow-hidden group hover:bg-[#9cc1e7] transition-all duration-500 cursor-pointer min-h-[380px] flex flex-col border border-white/5 hover:border-white/10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(60,60,90,0.3),_transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              {/* Fake grid lines */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px] opacity-20"></div>

              <div className="flex-1 flex items-center justify-center relative z-10 pt-10">
                <div className="text-[5rem] font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-500 to-gray-700 opacity-40 filter blur-[4px] group-hover:blur-0 transition-all duration-700 tracking-tighter">
                  Free
                </div>
              </div>
              <div className="relative z-10 mt-auto pt-8">
                <div className="text-white/40 font-mono text-base mb-4">01</div>
                <h3 className="text-2xl font-black font-funnel-display tracking-tight leading-[1.2] mb-3">
                  Download & Open App
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Get the free Kweli app from your app store or go to /scan. No signup required to start scanning.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-[#9cc1e7] rounded-[32px] p-8 relative overflow-hidden group hover:bg-[#eddfd0] transition-all duration-500 cursor-pointer min-h-[380px] flex flex-col border border-white/5 hover:border-white/10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(60,60,90,0.3),_transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

              <div className="flex-1 relative z-10 flex items-center justify-center w-full px-2">
                <div className="w-full bg-[#e9eeff] rounded-2xl p-4 flex gap-4 items-center shadow-lg transform group-hover:scale-[1.02] transition-transform duration-500">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-500 text-lg">↺</span>
                  </div>
                  <div className="flex-1 pr-12">
                    <div className="text-white font-medium text-sm">Verified</div>
                    <div className="text-gray-400 text-[10px] mt-1 leading-[1.4]">Tap to scan or Long press to use Ai.</div>
                  </div>
                  <div className="text-[9px] text-gray-500 absolute top-4 right-4">Just now</div>
                </div>
              </div>
              <div className="relative z-10 mt-auto pt-8">
                <div className="text-white/40 font-mono text-sm mb-4">03</div>
                <h3 className="text-2xl font-black font-funnel-display tracking-tight leading-[1.2] mb-3">
                  Tap to Scan + Ai
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  See if it's real or fake. Earn points for every scan that you can redeem for rewards.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-[#eddfd0]  rounded-[32px] p-8 relative overflow-hidden group hover:bg-[#9cc1e7] transition-all duration-500 cursor-pointer min-h-[380px] flex flex-col border border-white/5 hover:border-white/10">
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
                <h3 className="text-2xl font-bold tracking-tight font-funnel-display leading-[1.2] mb-3">
                  Get Incentives 
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Scan the cryptographically secure QR code, or press and hold to use our AI vision model to analyze packaging.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>


      <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center mb-12">
        <h2 className="text-4xl md:text-5xl lg:text-[4rem] font-bold font-funnel-display text-[#1a1615] tracking-tight">
          Who is Kweli for?
        </h2>
        <p className="text-gray-500 text-base md:text-lg mt-4 max-w-2xl mx-auto font-poppins">
          Tailored security, verification, and settlement workflows across the entire supply chain.
        </p>
      </div>

      <div ref={container} className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto h-[300vh]">
        {KWELI_USE_CASES.map((card, index) => {
          const targetScale = 1 - (KWELI_USE_CASES.length - index) * 0.05;
          return (
            <StackingCard
              key={card.id}
              card={card}
              index={index}
              progress={scrollYProgress}
              range={[index * (1 / KWELI_USE_CASES.length), 1]}
              targetScale={targetScale}
            />
          );
        })}
      </div>
      <div className="h-[15vh]" />
    </section>
  );
}
