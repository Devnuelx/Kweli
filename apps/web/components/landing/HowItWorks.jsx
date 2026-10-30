import { ScanLine, Cpu, CheckCircle } from "lucide-react";

export default function HowItWorks() {
  return (
    <section className="py-24 bg-white relative z-10 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-[#1a1615] tracking-tight mb-6">
            How Kweli Works
          </h2>
          <p className="text-xl text-[#757170] max-w-2xl mx-auto">
            Three simple steps to guarantee authenticity and earn rewards.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gray-100 -z-10"></div>
          
          <div className="relative bg-white pt-8 px-6 text-center">
            <div className="w-20 h-20 mx-auto bg-[#f4f1ee] rounded-full flex items-center justify-center mb-6 shadow-sm">
              <ScanLine className="w-8 h-8 text-[#754d29]" />
            </div>
            <h3 className="text-xl font-bold text-[#1a1615] mb-4">1. Scan the tag</h3>
            <p className="text-[#757170] leading-relaxed">
              Find the Kweli QR code or NFC tag on the product packaging and scan it using our mobile app.
            </p>
          </div>

          <div className="relative bg-white pt-8 px-6 text-center">
            <div className="w-20 h-20 mx-auto bg-blue-50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-blue-100">
              <Cpu className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-[#1a1615] mb-4">2. AI Verification</h3>
            <p className="text-[#757170] leading-relaxed">
              Our advanced AI cross-references the physical packaging with immutable on-chain records to detect tampering instantly.
            </p>
          </div>

          <div className="relative bg-white pt-8 px-6 text-center">
            <div className="w-20 h-20 mx-auto bg-green-50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-green-100">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-[#1a1615] mb-4">3. Earn Rewards</h3>
            <p className="text-[#757170] leading-relaxed">
              If authentic, you gain peace of mind and earn VFY tokens. If fake, report it to protect others.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
