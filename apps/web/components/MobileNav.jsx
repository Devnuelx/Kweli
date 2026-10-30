"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Smartphone, Briefcase } from "lucide-react";

export default function MobileNav() {
  const pathname = usePathname();

  // Helper to determine if a path is active
  const isActive = (path) => pathname === path || (path !== "/" && pathname.startsWith(path));

  return (
    <div className="fixed bottom-8 left-0 right-0 px-4 flex items-center justify-center z-50 md:hidden pointer-events-none">
      {/* Translucent Pill */}
      <div className="bg-white/40 backdrop-blur-xl rounded-full h-16 flex items-center justify-between px-2 shadow-2xl border border-white/40 w-full max-w-sm pointer-events-auto">
        <Link 
          href="/" 
          className="flex-1 h-full flex flex-col items-center justify-center gap-1 rounded-full transition-colors"
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isActive("/") ? "bg-blue-500/20" : ""}`}>
            <Home className={`w-5 h-5 ${isActive("/") ? "text-[#1a1615]" : "text-gray-600"}`} />
          </div>
          <span className={`text-[10px] font-bold ${isActive("/") ? "text-[#1a1615]" : "text-gray-600"}`}>Home</span>
        </Link>
        
        <Link 
          href="/scan" 
          className="flex-1 h-full flex flex-col items-center justify-center gap-1 rounded-full transition-colors"
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isActive("/scan") ? "bg-blue-500/20" : ""}`}>
            <Smartphone className={`w-5 h-5 ${isActive("/scan") ? "text-[#1a1615]" : "text-gray-600"}`} />
          </div>
          <span className={`text-[10px] font-bold ${isActive("/scan") ? "text-[#1a1615]" : "text-gray-600"}`}>Scan</span>
        </Link>
        
        <Link 
          href="/business" 
          className="flex-1 h-full flex flex-col items-center justify-center gap-1 rounded-full transition-colors"
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isActive("/business") ? "bg-blue-500/20" : ""}`}>
            <Briefcase className={`w-5 h-5 ${isActive("/business") ? "text-[#1a1615]" : "text-gray-600"}`} />
          </div>
          <span className={`text-[10px] font-bold ${isActive("/business") ? "text-[#1a1615]" : "text-gray-600"}`}>Business</span>
        </Link>
      </div>
    </div>
  );
}
