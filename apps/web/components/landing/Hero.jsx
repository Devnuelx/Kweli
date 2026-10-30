"use client";

import { motion } from "framer-motion";
import { Button } from "./Button";
import Image from "next/image";

export default function Hero() {
  return (
    <section className="bg-[#b4d2ea] w-full relative pt-32 md:pt-28 pb-10 font-poppins flex flex-col md:flex-row items-center justify-center text-center px-4 z-10 min-h-[90vh] overflow-hidden">
      {/* Background Gradient / Clouds simulation for Hero */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#b4d2ea] via-[#c6ddec] to-white/0"></div>
        {/* Soft radial highlights to mimic clouds */}
        <div className="absolute top-20 left-[-10%] w-[40%] h-[400px] bg-white/40 blur-[100px] rounded-full mix-blend-overlay"></div>
        <div className="absolute top-40 right-[-10%] w-[30%] h-[300px] bg-white/40 blur-[80px] rounded-full mix-blend-overlay"></div>
      </div>
      
      {/* Sky Images (left and right) */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <Image src="/hero/sky-left.avif" alt="sky left" width={600} height={800} className="absolute top-0 left-0 h-[80%] w-auto opacity-70 mix-blend-overlay object-contain object-left" priority />
        <Image src="/hero/sky-right.avif" alt="sky right" width={600} height={800} className="absolute top-0 right-0 h-[80%] w-auto opacity-70 mix-blend-overlay object-contain object-right" priority />
      </div>


      <div className="flex flex-col md:flex-row items-center max-w-360 w-full md:w-[calc(100%-6rem)]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className=" relative z-10 w-full"
        >
          <h1 className="text-5xl mt-16 lg:mt-0 text-left md:text-[5rem] font-funnel-display md:w-[120%] max-w-180 font-black text-[#1a1615]  leading-[1.1] mb-4">
            Stop Guessing. <br className="hidden md:block"/> Start Verifying.
          </h1>
          <p className="text-sm md:w-[80%] text-[#676666] mb-6 md:mb-8 text-left">
            confirm product authenticity in seconds.
            From packaged foods and pharmaceuticals to luxury products, just scan and be rest assured
          </p>
          <div className="flex flex-row gap-4 items-center">
            <Button variant="primary" href="/scan" className="text-base px-6 py-3">
              Verify Product
            </Button>
            <Button variant="secondary" href="/" className="text-base px-6 py-3">
              Download App
            </Button>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          className="md:mt-20 w-full max-w-6xl relative z-20"
        >
          <div className="relative w-full h-[90vh] md:-mb-12">
            <Image src="/hero/kweli-app.png" alt="Kweli Dashboard" fill className="w-full object-contain" />
          </div>
        </motion.div>
      </div>
      </section>
  );
}
