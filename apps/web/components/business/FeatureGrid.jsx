import { QrCode, Activity, BarChart3, ShieldCheck, Map, Smartphone } from "lucide-react";
import Link from "next/link";

export default function FeatureGrid() {
  const features = [
    {
      icon: <QrCode className="w-6 h-6 text-indigo-400" />,
      title: "Immutable QR Tagging",
      subtitle: "Forge-proof tags for every batch.",
      desc: "Generate Hedera-anchored QR codes for every product or batch. Each tag is permanently recorded on-chain — impossible to clone, replicate, or tamper with.",
    },
    {
      icon: <Activity className="w-6 h-6 text-indigo-400" />,
      title: "Real-Time Supply Chain Monitoring",
      subtitle: "See every handoff. Flag every anomaly.",
      desc: "Track products from manufacturer to retail shelf. Get instant alerts when a product moves outside expected routes or shows irregular scan patterns.",
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-indigo-400" />,
      title: "Batch Management Dashboard",
      subtitle: "Manage thousands of SKUs from one view.",
      desc: "Filter by product line, region, or distributor. Monitor verification status across your entire catalog.",
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-indigo-400" />,
      title: "AI Visual Verification",
      subtitle: "The ultimate defense against counterfeits.",
      desc: "Leverage advanced AI to visually inspect and verify physical tags and packaging. Even sophisticated fakes are caught before reaching the consumer.",
    },
    {
      icon: <Map className="w-6 h-6 text-indigo-400" />,
      title: "Global Traceability",
      subtitle: "Track beyond borders.",
      desc: "Seamless cross-border monitoring that gives you total visibility into gray market diversions and unauthorized reselling.",
    },
    {
      icon: <Smartphone className="w-6 h-6 text-indigo-400" />,
      title: "Consumer Connection",
      subtitle: "Turn verifications into relationships.",
      desc: "Engage directly with end consumers when they verify your products. Build trust and loyalty with every scan.",
    }
  ];

  return (
    <section className="py-24 md:py-32 bg-[#05051a] px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-colors flex flex-col h-full">
              <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 font-funnel-display">{feature.title}</h3>
              <div className="text-indigo-300 font-semibold mb-4 text-sm">{feature.subtitle}</div>
              <p className="text-gray-400 leading-relaxed mb-8 flex-1">{feature.desc}</p>
              <Link href="#" className="text-white font-bold inline-flex items-center gap-2 hover:text-indigo-300 transition-colors mt-auto">
                [ Get started ]
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
