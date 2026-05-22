"use client";

import { useState, useRef } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft, CheckCircle, Loader2, AlertCircle, ShieldAlert, Camera, X, ImagePlus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function ReportFakePage() {
  const [formData, setFormData] = useState({
    productName: "",
    brandName: "",
    description: "",
    location: ""
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [status, setStatus] = useState("idle"); 
  const [errorMessage, setErrorMessage] = useState("");
  const [rewardData, setRewardData] = useState(null);
  const [rewardEmail, setRewardEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState("idle"); // idle | submitting | saved
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select an image file.");
      setStatus("error");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("Image must be under 10MB.");
      setStatus("error");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setStatus("idle");
    setErrorMessage("");
  };

  const clearImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.productName || !formData.description) {
      setErrorMessage("Product name and description are required.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    try {
      const body = new FormData();
      body.append("productName", formData.productName);
      body.append("brandName", formData.brandName);
      body.append("description", formData.description);
      body.append("location", formData.location);
      if (imageFile) {
        body.append("image", imageFile);
      }

      const response = await fetch("/api/products/report-fake", {
        method: "POST",
        body
      });

      const data = await response.json();
      
      if (data.success) {
        setRewardData(data.reward);
        setStatus("success");
      } else {
        setErrorMessage(data.error || "Failed to submit report");
        setStatus("error");
      }
    } catch (error) {
      setErrorMessage("An unexpected error occurred. Please try again.");
      setStatus("error");
    }
  };

  const resetForm = () => {
    setFormData({ productName: "", brandName: "", description: "", location: "" });
    clearImage();
    setRewardData(null);
    setRewardEmail("");
    setEmailStatus("idle");
    setStatus("idle");
  };

  const handleDepositReward = async () => {
    if (!rewardEmail || !rewardEmail.includes("@")) return;
    setEmailStatus("submitting");
    try {
      await fetch("/api/waitlist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: rewardEmail, amount: 5 })
      });
      setEmailStatus("saved");
    } catch {
      setEmailStatus("idle");
    }
  };

  return (
    <div className="bg-[#0a0715] min-h-screen text-white font-sans selection:bg-[#E6FA05] selection:text-black flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-32 pb-24 px-6 lg:px-8 relative">
        <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-[#1d1b33] to-transparent pointer-events-none" />
        
        <div className="max-w-3xl mx-auto relative z-10">
          <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-12">
            <ArrowLeft className="w-5 h-5 mr-2" /> Back to home
          </Link>
          
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-[4rem] font-bold tracking-tight mb-6 leading-[1.1]">
              Report a <span className="text-[#E6FA05]">Fake</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 leading-relaxed max-w-2xl">
              Spotted a counterfeit product? Fill out the details below. Our team and the global Kweli network will investigate. Your report is immutable and secure.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 md:p-12 backdrop-blur-xl shadow-2xl">
            {status === "success" ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-24 h-24 bg-[#E6FA05]/20 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                  <div className="absolute inset-0 bg-[#E6FA05]/10 rounded-full animate-ping"></div>
                  <CheckCircle className="w-12 h-12 text-[#E6FA05] relative z-10" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-4 tracking-tight">Report Logged</h3>
                <p className="text-gray-400 text-lg mb-6 max-w-md mx-auto leading-relaxed">
                  Thank you for helping us fight counterfeits. Your report has been securely logged on the Hedera network.
                </p>

                {/* Reward Badge */}
                {rewardData?.credited ? (
                  <div className="inline-flex items-center gap-3 bg-[#E6FA05]/10 border border-[#E6FA05]/20 rounded-2xl px-6 py-4 mb-6">
                    <span className="text-3xl font-bold text-[#E6FA05]">+{rewardData.amount}</span>
                    <span className="text-lg text-[#E6FA05] font-mono">VFY</span>
                    <span className="text-gray-400 text-sm ml-2">credited to your wallet</span>
                  </div>
                ) : (
                  <div className="mb-6">
                    <div className="inline-flex items-center gap-3 bg-[#E6FA05]/10 border border-[#E6FA05]/20 rounded-2xl px-6 py-4 mb-6">
                      <span className="text-3xl font-bold text-[#E6FA05]">+5</span>
                      <span className="text-lg text-[#E6FA05] font-mono">VFY</span>
                      <span className="text-gray-400 text-sm ml-2">earned for this report</span>
                    </div>

                    {/* Email deposit for anonymous users */}
                    {emailStatus === "saved" ? (
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 max-w-md mx-auto">
                        <p className="text-[#E6FA05] font-semibold mb-1">✓ Rewards saved!</p>
                        <p className="text-gray-500 text-sm">Your 5 VFY will be waiting for you when we launch.</p>
                      </div>
                    ) : (
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 max-w-md mx-auto">
                        <p className="text-gray-300 text-sm font-medium mb-1">Want to claim your 5 VFY?</p>
                        <p className="text-gray-500 text-xs mb-4">Enter your email to save your reward. This is <span className="text-gray-400 font-semibold">completely separate</span> from your report and will not be linked to it in any way.</p>
                        <div className="flex gap-2">
                          <input
                            type="email"
                            value={rewardEmail}
                            onChange={(e) => setRewardEmail(e.target.value)}
                            placeholder="you@email.com"
                            className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#E6FA05] focus:ring-1 focus:ring-[#E6FA05]/50 transition-all"
                          />
                          <button
                            type="button"
                            onClick={handleDepositReward}
                            disabled={emailStatus === "submitting" || !rewardEmail}
                            className="bg-[#E6FA05] text-black font-bold px-5 py-3 rounded-xl text-sm hover:bg-[#d4e604] transition-colors disabled:opacity-50 shrink-0"
                          >
                            {emailStatus === "submitting" ? "..." : "Claim"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <button 
                    onClick={resetForm}
                    className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-full font-semibold transition-all border border-white/10"
                  >
                    Submit Another Report
                  </button>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {status === "error" && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="productName" className="text-sm font-medium text-gray-300">
                      Product Name <span className="text-[#E6FA05]">*</span>
                    </label>
                    <input
                      id="productName"
                      name="productName"
                      type="text"
                      value={formData.productName}
                      onChange={handleChange}
                      placeholder="e.g. Paracetamol 500mg"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#E6FA05] focus:ring-1 focus:ring-[#E6FA05]/50 transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="brandName" className="text-sm font-medium text-gray-300">
                      Brand / Manufacturer
                    </label>
                    <input
                      id="brandName"
                      name="brandName"
                      type="text"
                      value={formData.brandName}
                      onChange={handleChange}
                      placeholder="e.g. Emzor"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#E6FA05] focus:ring-1 focus:ring-[#E6FA05]/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="location" className="text-sm font-medium text-gray-300">
                    Where did you find it?
                  </label>
                  <input
                    id="location"
                    name="location"
                    type="text"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Store name, Market, City"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#E6FA05] focus:ring-1 focus:ring-[#E6FA05]/50 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium text-gray-300">
                    Describe why you think it&apos;s fake <span className="text-[#E6FA05]">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Wrong packaging, spelling errors, strange smell/color..."
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#E6FA05] focus:ring-1 focus:ring-[#E6FA05]/50 transition-all resize-none"
                    required
                  />
                </div>

                {/* Image Upload / Camera */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 block">
                    Photo Evidence
                  </label>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="imageUpload"
                  />

                  {imagePreview ? (
                    <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/30">
                      <div className="relative w-full h-[240px]">
                        <Image 
                          src={imagePreview} 
                          alt="Evidence preview" 
                          fill 
                          className="object-contain" 
                        />
                      </div>
                      <div className="absolute top-3 right-3 flex gap-2">
                        <button 
                          type="button"
                          onClick={clearImage}
                          className="w-9 h-9 bg-black/70 hover:bg-red-500/80 backdrop-blur-xl rounded-full flex items-center justify-center transition-colors border border-white/10"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                      <div className="p-3 bg-black/30 text-xs text-gray-400 truncate">
                        {imageFile?.name}
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-white/10 hover:border-[#E6FA05]/30 rounded-2xl p-8 flex flex-col items-center gap-4 cursor-pointer transition-all bg-black/20 hover:bg-black/40 group"
                    >
                      <div className="w-16 h-16 bg-white/5 group-hover:bg-[#E6FA05]/10 rounded-full flex items-center justify-center transition-colors">
                        <Camera className="w-7 h-7 text-gray-500 group-hover:text-[#E6FA05] transition-colors" />
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400 font-medium">Take a photo or choose from gallery</p>
                        <p className="text-gray-600 text-xs mt-1">PNG, JPG or WebP — max 10MB</p>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full bg-[#E6FA05] text-black font-bold text-lg py-4 rounded-xl hover:bg-[#d4e604] transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center mt-8"
                >
                  {status === "submitting" ? (
                    <>
                      <Loader2 className="w-6 h-6 mr-2 animate-spin" /> Submitting to network...
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-5 h-5 mr-2" />
                      Submit Report — Earn 5 VFY
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
