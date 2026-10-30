import Navbar from "@/components/Navbar";
import LandingFooter from "@/components/landing/LandingFooter";
import BlogSection from "@/components/landing/BlogSection";

export default function BlogPage() {
  return (
    <div className="text-[#1a1615] selection:bg-blue-200 selection:text-black relative bg-[#FDFDFD]">
      <Navbar />
      
      <div className="pt-32 pb-16 px-6 lg:px-8 max-w-7xl mx-auto">
        <h1 className="text-5xl md:text-[5rem] font-bold text-[#1a1615] tracking-tight mb-8">
          The Kweli Blog
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl">
          Insights, updates, and thoughts on product verification, counterfeit prevention, and the future of trust.
        </p>
      </div>

      <BlogSection />

      <LandingFooter />
    </div>
  );
}
