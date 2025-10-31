"use client";

import Link from "next/link";
import Image from "next/image";
import Logo from "@/public/icon.png";
import { useState } from "react";
import { Menu, X } from "lucide-react";


export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 w-full z-50 border-b border-white/10 backdrop-blur-xl bg-[#0A0E27]/95">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <a href="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Image src={Logo} alt="Kweli" className="w-5 h-5 text-white" width={20} height={20} />
            </div>
          </a>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-300 hover:text-white transition font-grotesk">Features</a>
            <a href="#how-it-works" className="text-gray-300 hover:text-white transition font-grotesk">How It Works</a>
            <a href="/business" className="text-gray-300 hover:text-white transition font-grotesk">Kweli for Business</a>
            <a
              href="https://expo.dev/preview/update?message=Fix+assets&updateRuntimeVersion=1.0.0&createdAt=2025-10-28T15%3A34%3A35.106Z&slug=exp&projectId=aea820d4-6839-4ab6-a9ef-be6944be8cf0&group=62a10b29-834d-4415-b88a-8e0e5799cba6"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2 bg-white text-black rounded-lg font-medium hover:shadow-lg transition font-grotesk inline-block"
            >
              Download User App
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-4">
          <a href="/business" className="block text-gray-300 hover:text-white transition font-grotesk">Kweli for Business</a>
          <button 
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-4 border-t border-white/10">
            <a href="#features" className="block text-gray-300 hover:text-white transition font-grotesk">Features</a>
            <a href="#how-it-works" className="block text-gray-300 hover:text-white transition font-grotesk">How It Works</a>
            <a href="/business" className="block text-gray-300 hover:text-white transition font-grotesk">Kweli for Business</a>
            <a
              href="https://expo.dev/preview/update?message=Fix+assets&updateRuntimeVersion=1.0.0&createdAt=2025-10-28T15%3A34%3A35.106Z&slug=exp&projectId=aea820d4-6839-4ab6-a9ef-be6944be8cf0&group=62a10b29-834d-4415-b88a-8e0e5799cba6"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full px-6 py-2 bg-white text-black rounded-lg font-medium hover:shadow-lg transition font-grotesk inline-block text-center"
            >
              Download User App
            </a>
          </div>
          
        )}
      </div>
    </nav>
  );
}
