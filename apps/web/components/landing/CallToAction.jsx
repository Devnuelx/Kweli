import { Button } from "./Button";

export default function CallToAction() {
  return (
    <section className="bg-gradient-to-b from-white to-[#b4d2ea] pt-32 pb-32 relative overflow-hidden z-10">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center relative z-10">
        <h2 className="text-5xl md:text-[5rem] font-funnel-display font-bold text-[#1a1615] tracking-tight mb-6 leading-[1.05]">
          Let's Fight Counterfeits <br className="hidden md:block"/>together.
        </h2>
        <p className="text-base text-[#453f3d] mb-12 max-w-2xl mx-auto leading-relaxed">
          Spotted a fake product? Report it anonymously. Every verified report strengthens the Kweli ecosystem.
        </p>
        <div className="flex flex-row gap-4 justify-center items-center">
          <Button variant="primary" href="/report" className="px-6 py-3 text-lg">
            Report Fake
          </Button>
          <Button variant="secondary" href="/scan" className="px-6 py-3 text-lg">
            Verify Product
          </Button>
        </div>
      </div>
    </section>
  );
}
