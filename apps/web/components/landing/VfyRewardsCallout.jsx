import { ShieldCheck, Coins } from "lucide-react";

export default function VfyRewardsCallout() {
  return (
    <section className="py-24 bg-gradient-to-br from-[#2A229E] via-[#1d1b33] to-black text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between relative z-10 gap-12">
        <div className="w-full md:w-1/2">
          <div className="flex items-center gap-2 mb-6 text-[#E6FA05] font-bold tracking-widest uppercase text-sm">
            <Coins className="w-5 h-5" />
            <span>Earn VFY Tokens</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Protect the community. <br /> Get rewarded.
          </h2>
          <p className="text-lg text-gray-300 mb-8 max-w-lg leading-relaxed">
            Every time you scan a product or report a counterfeit, you earn VFY tokens. Use them for exclusive discounts or convert them to real value.
          </p>
          <a href="#" className="inline-flex items-center justify-center px-8 py-4 bg-[#E6FA05] text-black rounded-full font-bold text-lg hover:bg-yellow-400 transition-colors shadow-[0_0_20px_rgba(230,250,5,0.3)]">
            Join the Rewards Program
          </a>
        </div>
        <div className="w-full md:w-1/2 flex justify-center">
          <div className="relative w-72 h-72 rounded-full border border-white/20 bg-white/5 backdrop-blur-xl flex items-center justify-center shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#E6FA05]/20 to-transparent rounded-full animate-pulse"></div>
            <div className="text-center relative z-10">
              <div className="text-6xl font-black text-white mb-2 tracking-tighter">
                +50 <span className="text-[#E6FA05] text-3xl">VFY</span>
              </div>
              <div className="text-gray-300 font-medium">For verified scan</div>
            </div>
            
            <div className="absolute -top-6 -right-6 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
              <ShieldCheck className="w-8 h-8 text-[#00FC82]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
