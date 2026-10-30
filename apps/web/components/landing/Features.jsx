import Image from "next/image";
import { Activity, ShieldAlert, AlertOctagon, Ban, TrendingDown, Users, Briefcase, FileWarning } from "lucide-react";

export default function Features() {
  return (
    <section className="py-24 md:py-32 relative z-10 px-6 border-t border-gray-200 font-poppins">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-32">
        
        {/* Feature 1 */}
        <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-24">
          <div className="w-full md:w-1/2 order-2 md:order-1">
            <div className="w-full aspect-[4/5] md:aspect-square bg-[#9cc1e7] rounded-[40px] p-8 md:p-12 flex items-center justify-center shadow-lg relative overflow-hidden">
               {/* Placeholder UI */}
               <div className="bg-white rounded-[24px] w-full h-full shadow-2xl p-4 flex flex-col">
                  <Image src={"/hero.png"} fill alt="Lady verified product and is happy." className="object-contain"/>
                  {/* <div className="h-6 w-1/3 bg-gray-200 rounded-md mb-8"></div>
                  <div className="flex gap-4 mb-6">
                    <div className="h-10 w-10 bg-red-100 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-full bg-gray-100 rounded"></div>
                        <div className="h-4 w-2/3 bg-gray-100 rounded"></div>
                    </div>
                  </div>
                  <div className="flex gap-4 mb-6">
                    <div className="h-10 w-10 bg-yellow-100 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-full bg-gray-100 rounded"></div>
                        <div className="h-4 w-3/4 bg-gray-100 rounded"></div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-full bg-gray-100 rounded"></div>
                        <div className="h-4 w-1/2 bg-gray-100 rounded"></div>
                    </div>
                  </div> */}
               </div>
            </div>
          </div>
          
          <div className="w-full md:w-1/2 order-1 md:order-2">
            <div className="text-[#754d29] font-bold text-xs md:text-sm tracking-widest uppercase mb-4">
              CONSUMER IMPACT
            </div>
            <h2 className="text-4xl md:text-5xl font-bold font-funnel-display text-[#1a1615] tracking-tight mb-6 leading-[1.1]">
              No more fake goods for Original price.
            </h2>
            <p className="text-sm md:text-base text-[#757170] mb-6 leading-relaxed">
              Counterfeit products aren't just illegal - they're dangerous. Whether it's skincare, electronics, or pharmaceuticals, you risk your health and waste your money on fake items. Not Anymore.
            </p>
            <a href="/scan" className="inline-flex items-center justify-center px-6 py-3 bg-[#1a1615] text-white rounded-full font-poppins text-base hover:bg-[#332b29] transition-colors">
              Verify Product
            </a>
            
            {/* <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-full border border-gray-200/60 shadow-sm">
                 <ShieldAlert className="w-5 h-5 text-gray-500" />
                 <span className="text-[15px] font-semibold text-gray-800">Health risks</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-full border border-gray-200/60 shadow-sm">
                 <AlertOctagon className="w-5 h-5 text-gray-500" />
                 <span className="text-[15px] font-semibold text-gray-800">Safety hazards</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-full border border-gray-200/60 shadow-sm">
                 <TrendingDown className="w-5 h-5 text-gray-500" />
                 <span className="text-[15px] font-semibold text-gray-800">Financial loss</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-full border border-gray-200/60 shadow-sm">
                 <Ban className="w-5 h-5 text-gray-500" />
                 <span className="text-[15px] font-semibold text-gray-800">No warranty</span>
              </div>
            </div> */}
          </div>
        </div>

        {/* Feature 2 */}
        <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-24">
          <div className="w-full md:w-1/2">
            <div className="text-[#754d29] font-bold text-xs md:text-sm tracking-widest uppercase mb-4">
              GLOBAL CONSEQUENCES
            </div>
            <h2 className="text-4xl md:text-5xl font-bold font-funnel-display text-[#1a1615] tracking-tight mb-6 leading-[1.1]">
              A trillion-dollar threat to innovation
            </h2>
            <p className="text-sm text-[#757170] mb-10 leading-relaxed font-medium">
              Every fake good purchased funds criminal organizations and drains resources from legitimate businesses. It stifles innovation and leads to millions of lost jobs globally.
            </p>
            <a href="/business" className="inline-flex items-center justify-center px-6 py-3 bg-[#1a1615] text-white rounded-full font-poppins text-base hover:bg-[#332b29] transition-colors">
              Protect your brand
            </a>
            
            {/* <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-full border border-gray-200/60 shadow-sm">
                 <TrendingDown className="w-5 h-5 text-gray-500" />
                 <span className="text-[15px] font-semibold text-gray-800">Revenue drain</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-full border border-gray-200/60 shadow-sm">
                 <Users className="w-5 h-5 text-gray-500" />
                 <span className="text-[15px] font-semibold text-gray-800">Job losses</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-full border border-gray-200/60 shadow-sm">
                 <Briefcase className="w-5 h-5 text-gray-500" />
                 <span className="text-[15px] font-semibold text-gray-800">Criminal funding</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-full border border-gray-200/60 shadow-sm">
                 <FileWarning className="w-5 h-5 text-gray-500" />
                 <span className="text-[15px] font-semibold text-gray-800">Brand damage</span>
              </div>
            </div> */}
          </div>

          <div className="w-full md:w-1/2">
            <div className="w-full aspect-[4/5] md:aspect-square bg-[#eddfd0] rounded-[40px] p-8 md:p-12 flex items-center justify-center shadow-lg relative overflow-hidden">
               {/* Placeholder UI */}
               <div className="bg-white rounded-[24px] w-full h-full shadow-2xl p-6 flex flex-col">
                  <div className="h-6 w-1/2 bg-gray-200 rounded-md mb-8"></div>
                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="p-4 border border-gray-100 rounded-xl flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-gray-100"></div>
                        <div>
                            <div className="h-5 w-24 bg-gray-200 rounded mb-2"></div>
                            <div className="h-3 w-16 bg-gray-100 rounded"></div>
                        </div>
                    </div>
                    <div className="p-4 border border-gray-100 rounded-xl flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-gray-100"></div>
                        <div>
                            <div className="h-5 w-24 bg-gray-200 rounded mb-2"></div>
                            <div className="h-3 w-16 bg-gray-100 rounded"></div>
                        </div>
                    </div>
                  </div>
                  <div className="h-4 w-32 bg-gray-200 rounded-md mb-4"></div>
                  <div className="flex-1 w-full bg-gray-50 border border-gray-100 rounded-xl relative overflow-hidden">
                     <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-green-500/20 to-transparent"></div>
                     <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                        <path d="M0,80 Q25,80 50,60 T100,20 L100,100 L0,100 Z" fill="#22c55e" fillOpacity="0.1" />
                        <path d="M0,80 Q25,80 50,60 T100,20" fill="none" stroke="#22c55e" strokeWidth="2" />
                     </svg>
                  </div>
               </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
