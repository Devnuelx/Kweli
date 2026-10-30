"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import MobileHome from "@/public/svgs/mobile-home.svg";

const KWELI_USE_CASES = [
  {
    id: 1,
    category: "For Brands",
    title: "Protect your products.",
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

const StackingCard = ({ card, index, progress, range, targetScale }) => {
  const scale = useTransform(progress, range, [1, targetScale]);

  return (
    <div 
      className="h-screen flex items-center justify-center sticky top-0"
      style={{ zIndex: index + 1 }} 
    >
      <motion.div
        style={{ 
          scale,
          top: `calc(10% + ${index * 25}px)` 
        }}
        className={`relative w-full max-w-7xl h-[500px] md:h-[650px] rounded-[32px] md:rounded-[40px] shadow-2xl overflow-hidden origin-top ${card.color}`}
      >
        <div className="absolute inset-0">
          <Image src={card.image} alt={card.title} fill className="object-cover opacity-60" />
        </div>
        <div className={`absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r ${card.gradient} z-10`} />

        <div className="relative z-20 h-full p-8 md:p-16 flex flex-col justify-between">
          <h3 className="text-xl md:text-3xl font-bold text-white/30 uppercase tracking-widest">
            {card.category}
          </h3>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 mt-20 md:mt-0">
            <div className="max-w-xl text-left">
              <h2 className=" uppercase text-4xl md:text-7xl font-black text-white mb-6 tracking-widest">
                {card.title}
              </h2>
              <p className="text-base text-gray-400 mb-8 max-w-lg">
                {card.description}
              </p>
              <a href={card.link} className="inline-flex items-center text-white font-semibold gap-2 hover:gap-3 transition-all group">
                Learn more 
                <span className={`${card.accent} text-black w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ml-1 transition-transform group-hover:translate-x-1`}>
                  →
                </span>
              </a>
            </div>

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


      <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
        <h2 className="text-4xl  md:text-5xl lg:text-[4rem] font-bold font-funnel-display text-[#1a1615] tracking-tight">
          Who is Kweli for?
        </h2>
      </div>

      <div ref={container} className="relative lg:px-8 h-[300vh]">
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
