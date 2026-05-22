import Link from "next/link";
import { Instagram, Youtube, Twitter, Globe } from "lucide-react";
import Logo from "@/public/icon.png";
import Image from "next/image";

export default function Footer() {
    return (
        <footer className="bg-[#0A0E27] text-white pt-20 pb-10 px-6 lg:px-10 font-funnel-display border-t border-white/5">
            <div className="max-w-7xl mx-auto">
                {/* Logo and Socials */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                            <Image src={Logo} alt="Kweli" className="w-5 h-5 invert" width={20} height={20} />
                        </div>
                        <span className="font-bold text-2xl tracking-tight uppercase">Kweli</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <Link href="#" className="text-white/40 hover:text-white transition-colors">
                            <Twitter className="w-5 h-5" />
                        </Link>
                        <Link href="#" className="text-white/40 hover:text-white transition-colors">
                            <Instagram className="w-5 h-5" />
                        </Link>
                        <Link href="#" className="text-white/40 hover:text-white transition-colors">
                            <Youtube className="w-5 h-5" />
                        </Link>
                        <Link href="#" className="text-white/40 hover:text-white transition-colors">
                            <Globe className="w-5 h-5" />
                        </Link>
                    </div>
                </div>

                {/* Main Links */}
                <div className="flex flex-wrap justify-center md:justify-start gap-x-8 gap-y-4 mb-16 border-t border-white/5 pt-10">
                    <Link href="/#features" className="text-[#999] hover:text-white transition-colors font-medium">Features</Link>
                    <Link href="/business" className="text-[#999] hover:text-white transition-colors font-medium">Business</Link>
                    <Link href="#" className="text-[#999] hover:text-white transition-colors font-medium">Pricing</Link>
                    <Link href="#" className="text-[#999] hover:text-white transition-colors font-medium">Contact</Link>
                    <Link href="#" className="text-[#999] hover:text-white transition-colors font-medium">Blog</Link>
                    <Link href="#" className="text-[#999] hover:text-white transition-colors font-medium">Privacy</Link>
                    <Link href="#" className="text-[#999] hover:text-white transition-colors font-medium">Terms</Link>
                </div>

                {/* Bottom Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5 gap-4">
                    <div className="text-sm text-white/40">
                        © 2026 Kweli. All rights reserved.
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 text-sm text-white/40">
                        <span>Made by <span className="text-white font-medium">Kweli Team</span></span>
                        <a href="mailto:hello@kweli.com" className="hover:text-white transition-colors">hello@kweli.com</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
