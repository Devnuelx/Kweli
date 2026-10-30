"use client";

import Navbar from "@/components/Navbar";
import Hero from "@/components/landing/Hero";
import TrustBar from "@/components/landing/TrustBar";
import TrustedBy from "@/components/landing/TrustedBy";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import UseCases from "@/components/landing/UseCases";
import SocialProof from "@/components/landing/SocialProof";
import VfyRewardsCallout from "@/components/landing/VfyRewardsCallout";
import BlogSection from "@/components/landing/BlogSection";
import CallToAction from "@/components/landing/CallToAction";
import LandingFooter from "@/components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <div className="text-[#1a1615] selection:bg-blue-200 selection:text-black relative bg-white">
      <Navbar />
      <Hero />
      {/* <TrustBar /> */}
      {/* <TrustedBy /> */}
      <Features />
      {/* <HowItWorks /> */}
      <UseCases />
      {/* <SocialProof />
      <VfyRewardsCallout /> */}
      <BlogSection />
      <CallToAction />
      <LandingFooter />
    </div>
  );
}