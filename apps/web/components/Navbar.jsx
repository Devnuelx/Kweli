"use client";

import Link from "next/link";
import Image from "next/image";
import Logo from "@/public/icon.png";
import { useState, useEffect } from "react";
import { Menu, X, Circle } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [showComingSoonModal, setShowComingSoonModal] = useState(false);
    const pathname = usePathname();
    const isBusiness = pathname.startsWith("/business");

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        handleScroll();
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav className="fixed top-5 w-full z-50 transition-all duration-500 py-4 px-4 flex justify-center pointer-events-none">
            <div className={`transition-opacity duration-1000 pointer-events-auto w-full ${scrolled ? "max-w-4xl bg-white/40 backdrop-blur-[10px] shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-full px-4 md:px-6 py-1" : "max-w-360 bg-transparent px-4 md:px-6 lg:px-10"}`}>
                <div className="flex justify-between items-center h-12 md:h-14">
                    <div className="flex items-center space-x-3 md:space-x-8">
                        <a href="/" className="flex items-center space-x-2 shrink-0">
                            <Image src={Logo} alt="Kweli" width={32} height={32} style={{ height: "auto" }} />
                        </a>

                       
                    </div>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center space-x-8 text-[15px] font-semibold">
                        <Link href="/scan" className={`transition-colors hover:opacity-80 flex items-center gap-1.5 ${scrolled ? "text-[#1a1615] bg-black/5 px-3 py-1 rounded-full" : "text-[#0e35aa] bg-white/10 px-3 py-1 rounded-full animate-pulse"}`}>
                            <span className="w-2 h-2 rounded-full bg-[#476cdd]"></span> Scan Product
                        </Link>
                        {/* <a href="#features" className={`transition-colors hover:opacity-80 ${scrolled ? "text-[#453f3d]" : "text-white"}`}>Features</a>
                        <a href="#rewards" className={`transition-colors hover:opacity-80 ${scrolled ? "text-[#453f3d]" : "text-white"}`}>Rewards</a> */}
                        <a href="#news" className={`transition-colors hover:opacity-80 ${scrolled ? "text-[#453f3d]" : "text-white"}`}>News & Blog</a>
                    </div>


                     <div className={`flex items-center p-1 rounded-full text-xs md:text-sm font-medium transition-colors ${scrolled ? "bg-white/60" : "bg-white/10"}`}>
                        <Link 
                            href="/" 
                            className={`px-3 md:px-5 py-1.5 rounded-full transition-all ${!isBusiness ? (scrolled ? "bg-[#454343] text-white" : "bg-white text-[#0A0E27]") : (scrolled ? "text-gray-900" : "text-white")}`}
                        >
                            Consumers
                        </Link>
                        <Link 
                            href="/business" 
                            className={`px-3 md:px-5 py-1.5 rounded-full transition-all ${isBusiness ? (scrolled ? "bg-[#1a1615] text-white" : "bg-white text-[#0A0E27]") : (scrolled ? "text-gray-900" : "text-white")}`}
                        >
                            Businesses
                        </Link>
                    </div>

                    {/* CTA Buttons - Desktop */}
                    {/* <div className="hidden md:flex items-center space-x-4">
                        <a
                            href="#"
                            className={`px-6 py-2.5 rounded-full font-semibold text-[15px] transition-all border ${scrolled
                                ? "border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                                : "border-white/30 text-white hover:bg-white/10"
                                }`}
                        >
                            Login
                        </a>
                        <button
                            onClick={() => setShowComingSoonModal(true)}
                            className={`px-6 py-2.5 rounded-full font-semibold text-[15px] transition-all border ${scrolled
                                ? "bg-[#1a1615] text-white border-[#1a1615] hover:bg-[#332b29] shadow-lg"
                                : "bg-white text-[#1a1615] border-white hover:bg-gray-50"
                                }`}
                        >
                            Download app
                        </button>
                    </div> */}

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            className={`p-2 transition-colors ${scrolled ? "text-gray-900" : "text-white"}`}
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" color="grey"/>}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {mobileMenuOpen && (
                    <div className="md:hidden fixed left-4 right-4 top-24 mt-2 bg-white/40 backdrop-blur-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.1)] p-6 space-y-4 text-center rounded-[32px] border border-white/50 pointer-events-auto">
                        <Link href="/scan" className="block text-[#5b5a5a] text-lg font-bold py-2" onClick={() => setMobileMenuOpen(false)}>Scan Product</Link>
                        <a href="#features" className="block text-[#5b5a5a] text-lg font-bold py-2" onClick={() => setMobileMenuOpen(false)}>Features</a>
                        <a href="#rewards" className="block text-[#5b5a5a] text-lg font-bold py-2" onClick={() => setMobileMenuOpen(false)}>Rewards</a>
                        <a href="#news" className="block text-[#5b5a5a] text-lg font-bold py-2" onClick={() => setMobileMenuOpen(false)}>News & Blog</a>

                        <div className="pt-4 flex flex-col gap-4">
                            <button onClick={() => { setMobileMenuOpen(false); setShowComingSoonModal(true); }} className="w-full py-4 rounded-full text-base font-bold bg-[#1a1615] text-white">Download app</button>
                            <a href="#" className="w-full py-4 text-center rounded-full text-base font-bold border border-transparent bg-black/5 text-[#1a1615]">Login</a>
                        </div>
                    </div>
                )}
            </div>

            {showComingSoonModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm px-4 pointer-events-auto">
                    <div className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center shadow-2xl relative">
                        <button onClick={() => setShowComingSoonModal(false)} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-black">
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-2xl font-bold text-[#1a1615] mb-2 font-exensa">Coming Soon</h3>
                        <p className="text-gray-500">The mobile app is currently in development. Check back later!</p>
                        <button onClick={() => setShowComingSoonModal(false)} className="mt-6 w-full py-3 bg-[#1a1615] text-white rounded-full font-bold">
                            Got it
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
}
