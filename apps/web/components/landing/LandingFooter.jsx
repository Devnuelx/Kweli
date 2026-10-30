import Link from "next/link";
import Image from "next/image";

export default function LandingFooter() {
  return (
    <footer className="w-full bg-[#b4d2ea] pt-12 pb-12 px-6 lg:px-8 flex justify-center relative overflow-hidden font-poppins">
      {/* Sky Images (left and right) */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <Image src="/hero/sky-left.avif" alt="sky left" width={600} height={800} className="absolute top-0 left-0 h-[120%] w-auto opacity-70 mix-blend-overlay object-contain object-left" />
        <Image src="/hero/sky-right.avif" alt="sky right" width={600} height={800} className="absolute top-0 right-0 h-[120%] w-auto opacity-70 mix-blend-overlay object-contain object-right" />
      </div>
      
      {/* Background Gradient to ensure smooth transition from previous section */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#e4eef6] opacity-50 pointer-events-none"></div>
      
      <div className="w-full max-w-5xl bg-white/40 backdrop-blur-xl border border-white/50 rounded-[40px] p-10 md:p-16 relative z-10 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12">
          {/* Brand Info */}
          <div className="max-w-sm">
            <div className="flex items-center gap-2 mb-6">
              <Image src={"/icon.png"} width={24} height={24}/>
              {/* <div className="w-6 h-6 bg-[#1a1615] rounded-bl-xl rounded-tr-xl rounded-tl-sm rounded-br-sm rotate-45 flex items-center justify-center" /> */}
              <span className="text-2xl text-[#1a1615] tracking-tight ml-1">Kweli</span>
            </div>
            <p className="text-[#453f3d] text-lg leading-relaxed mb-8">
              Your favourite product verification software. Built for modern brands and consumers.
            </p>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-[#1a1615] rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-black transition-colors">in</div>
              <div className="w-10 h-10 bg-[#1a1615] rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-black transition-colors">x</div>
            </div>
          </div>

          {/* Links */}
          <div className="flex gap-16 md:gap-24">
            <div>
              <h4 className="font-bold text-[#1a1615] mb-6 uppercase tracking-wider text-sm">Pages</h4>
              <ul className="space-y-4 text-[#453f3d] font-medium">
                <li><Link href="/" className="hover:text-black transition-colors">Home</Link></li>
                <li><Link href="#features" className="hover:text-black transition-colors">Features</Link></li>
                {/* <li><Link href="#pricing" className="hover:text-black transition-colors">Pricing</Link></li> */}
                <li><Link href="/blog" className="hover:text-black transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-[#1a1615] mb-6 uppercase tracking-wider text-sm">Information</h4>
              <ul className="space-y-4 text-[#453f3d] font-medium">
                <li><Link href="/contact" className="hover:text-black transition-colors">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-black transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-black transition-colors">Terms of use</Link></li>
                <li><Link href="/404" className="hover:text-black transition-colors">404</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="w-full h-px bg-black/10 my-10"></div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[#453f3d] font-medium">
          <div>© 2026 Kweli.</div>
        </div>
      </div>
    </footer>
  );
}
