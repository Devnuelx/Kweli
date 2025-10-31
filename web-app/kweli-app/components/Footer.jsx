import Link from "next/link";
import { Shield } from "lucide-react";
import Logo from "@/public/icon.png";
import Image from "next/image";

export default function Footer() {
  const footerLinks = [
    {
      title: "Product",
      links: ["Features", "Pricing", "API", "Documentation"]
    },
    {
      title: "Company",
      links: ["About", "Blog", "Careers", "Press"]
    },
    {
      title: "Support",
      links: ["Help Center", "Contact", "Status", "Privacy"]
    }
  ];

  return (
    <footer className="border-t border-white/10 py-12 px-6 lg:px-8 font-grotesk">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Image src={Logo} alt="Kweli" className="w-5 h-5 text-white" width={20} height={20} />
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              Blockchain-powered product verification for authentic goods.
            </p>
          </div>
          
            <div>
              <h4 className="font-bold mb-4 font-neue">Product</h4>
              <ul className="space-y-2 font-grotesk text-gray-400">
                <li><a href="/#features" className="hover:text-white transition">Features</a></li>
                {/* <li><a href="/" className="hover:text-white transition">Pricing</a></li> */}
                <li><a href="/dashboard/docs" className="hover:text-white transition">API Docs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 font-neue">Company</h4>
              <ul className="space-y-2 font-grotesk text-gray-400">
                <li><a href="/" className="hover:text-white transition">About</a></li>
                <li><a href="/" className="hover:text-white transition">Contact</a></li>
                <li><a href="/" className="hover:text-white transition">Support</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/10 mt-12 pt-8 text-center text-gray-400 text-sm">
        <div className="max-w-7xl mx-auto text-center">
        <p className="text-gray-400 font-grotesk">Building trust, one scan at a time.</p>
        <div className="mt-6 text-sm text-gray-500 font-grotesk">
          © 2025 Kweli. All rights reserved.
        </div>
      </div>
    </div>
    </footer>
  );
}
