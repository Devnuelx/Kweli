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
        <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-white shadow-sm border-b border-gray-100" : "bg-transparent"} py-3`}>
            <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-10">
                <div className="flex justify-between items-center h-14">
                    <div className="flex items-center space-x-3 md:space-x-8">
                        <a href="/" className="flex items-center space-x-2 shrink-0">
                            <Image src={Logo} alt="Kweli" width={32} height={32} />
                            <span className={`font-sans font-bold text-xl md:text-2xl tracking-tight hidden sm:block ${scrolled ? "text-gray-900" : "text-white"}`}>kweli</span>
                        </a>

                        {/* Toggle Pill - Visible on mobile now */}
                        <div className={`flex items-center p-1 rounded-full text-xs md:text-sm font-medium transition-colors ${scrolled ? "bg-[#F0EDFD]" : "bg-white/10"}`}>
                            <Link 
                                href="/" 
                                className={`px-3 md:px-5 py-1.5 rounded-full transition-all ${!isBusiness ? (scrolled ? "bg-[#0A0E27] text-white" : "bg-white text-[#0A0E27]") : (scrolled ? "text-gray-900" : "text-white")}`}
                            >
                                Consumers
                            </Link>
                            <Link 
                                href="/business" 
                                className={`px-3 md:px-5 py-1.5 rounded-full transition-all ${isBusiness ? (scrolled ? "bg-[#0A0E27] text-white" : "bg-white text-[#0A0E27]") : (scrolled ? "text-gray-900" : "text-white")}`}
                            >
                                Businesses
                            </Link>
                        </div>
                    </div>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center space-x-10 text-[15px] font-semibold">
                        <a href="#features" className={`transition-colors hover:opacity-80 ${scrolled ? "text-gray-900" : "text-white"}`}>Features</a>
                        <a href="#rewards" className={`transition-colors hover:opacity-80 ${scrolled ? "text-gray-900" : "text-white"}`}>Rewards</a>
                        <a href="#news" className={`transition-colors hover:opacity-80 ${scrolled ? "text-gray-900" : "text-white"}`}>News & Blog</a>
                    </div>

                    {/* CTA Buttons - Desktop */}
                    <div className="hidden md:flex items-center space-x-4">
                        <a
                            href="#"
                            className={`px-6 py-2.5 rounded-full font-semibold text-[15px] transition-all border ${scrolled
                                ? "border-[#493DE6] text-[#493DE6] hover:bg-[#493DE6]/5"
                                : "border-white/30 text-white hover:bg-white/10"
                                }`}
                        >
                            Login
                        </a>
                        <a
                            href="https://expo.dev/preview/update?message=Fix+assets&updateRuntimeVersion=1.0.0&createdAt=2025-10-28T15%3A34%3A35.106Z&slug=exp&projectId=aea820d4-6839-4ab6-a9ef-be6944be8cf0&group=62a10b29-834d-4415-b88a-8e0e5799cba6"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`px-6 py-2.5 rounded-full font-semibold text-[15px] transition-all border ${scrolled
                                ? "bg-[#493DE6] text-white border-[#493DE6] hover:bg-[#3d33ca]"
                                : "bg-white text-[#493DE6] border-white hover:bg-gray-50"
                                }`}
                        >
                            Download app
                        </a>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            className={`p-2 transition-colors ${scrolled ? "text-gray-900" : "text-white"}`}
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {mobileMenuOpen && (
                    <div className="md:hidden absolute left-0 right-0 top-[100%] bg-white border-t border-gray-100 p-6 space-y-4 shadow-xl text-center min-h-[100vh]">
                        <a href="#features" className="block text-gray-900 font-semibold text-xl py-4 border-b border-gray-50">Features</a>
                        <a href="#rewards" className="block text-gray-900 font-semibold text-xl py-4 border-b border-gray-50">Rewards</a>
                        <a href="#news" className="block text-gray-900 font-semibold text-xl py-4 border-b border-gray-50">News & Blog</a>
                        <div className="pt-8 flex flex-col gap-4">
                            <a href="#" className="w-full py-4 rounded-full font-semibold text-lg border-2 border-[#493DE6] text-[#493DE6]">Login</a>
                            <a href="https://expo.dev/preview/update?message=Fix+assets&updateRuntimeVersion=1.0.0&createdAt=2025-10-28T15%3A34%3A35.106Z&slug=exp&projectId=aea820d4-6839-4ab6-a9ef-be6944be8cf0&group=62a10b29-834d-4415-b88a-8e0e5799cba6" target="_blank" rel="noopener noreferrer" className="w-full py-4 rounded-full font-semibold text-lg bg-[#493DE6] text-white">Download app</a>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
