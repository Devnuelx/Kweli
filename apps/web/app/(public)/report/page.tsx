"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  AlertCircle,
  KeyRound,
  Copy,
  Check,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { api, ReportSubmissionResponse } from "@/lib/api-client";

function ReportForm() {
  const searchParams = useSearchParams();
  const initialSerial = searchParams.get("serial") || "";

  const [formData, setFormData] = useState({
    productName: "",
    brandName: "",
    description: "",
    purchaseLocation: "",
    publicSerial: initialSerial,
  });

  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [submissionResult, setSubmissionResult] = useState<ReportSubmissionResponse | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  useEffect(() => {
    if (initialSerial) {
      setFormData((prev) => ({ ...prev, publicSerial: initialSerial }));
    }
  }, [initialSerial]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productName || !formData.description) {
      setErrorMessage("Product name and description are required.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await api.reports.submit({
        productName: formData.productName,
        brandName: formData.brandName || undefined,
        description: formData.description,
        purchaseLocation: formData.purchaseLocation || undefined,
        publicSerial: formData.publicSerial || undefined,
      });

      setSubmissionResult(res);
      setStatus("success");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit counterfeit report.");
      setStatus("error");
    }
  };

  const copySecretToClipboard = () => {
    if (!submissionResult?.accessSecret) return;
    navigator.clipboard.writeText(submissionResult.accessSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 3000);
  };

  const resetForm = () => {
    setFormData({
      productName: "",
      brandName: "",
      description: "",
      purchaseLocation: "",
      publicSerial: "",
    });
    setSubmissionResult(null);
    setStatus("idle");
    setErrorMessage("");
  };

  return (
    <div className="bg-[#0a0715] min-h-screen text-white font-sans selection:bg-[#E6FA05] selection:text-black flex flex-col">
      <Navbar />

      <main className="flex-grow pt-32 pb-24 px-6 lg:px-8 relative">
        <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-[#1d1b33] to-transparent pointer-events-none" />

        <div className="max-w-3xl mx-auto relative z-10">
          <Link
            href="/"
            className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-8 text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to home
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Report a <span className="text-[#E6FA05]">Counterfeit</span>
            </h1>
            <p className="text-gray-400 text-base md:text-lg leading-relaxed max-w-2xl">
              Spotted a counterfeit, tampered, or expired product? Submit details directly to brand
              manufacturers and regulatory compliance teams. Your submission is cryptographically signed and anonymous.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-10 backdrop-blur-xl shadow-2xl">
            {status === "success" && submissionResult ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6 space-y-6"
              >
                <div className="w-20 h-20 bg-[#E6FA05]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-[#E6FA05]" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  Report Registered & Under Triage
                </h3>
                <p className="text-gray-300 text-sm max-w-md mx-auto">
                  Thank you for protecting consumer safety. Your incident has been cataloged with reference:
                </p>

                {/* Reference Card */}
                <div className="bg-black/40 border border-white/15 rounded-2xl p-6 max-w-md mx-auto text-left space-y-3">
                  <div>
                    <span className="text-xs text-gray-400 block uppercase tracking-wider">Report Reference</span>
                    <span className="text-xl font-mono font-bold text-[#E6FA05]">
                      {submissionResult.reportRef}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block uppercase tracking-wider">Status</span>
                    <span className="text-sm font-semibold text-green-400">
                      {submissionResult.status}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-white/10">
                    <span className="text-xs text-gray-400 block uppercase tracking-wider">
                      Anonymous Access Secret
                    </span>
                    <p className="text-xs text-gray-400 mb-2">
                      Save this secret key. You can use it to track investigations and claim reward points without an account.
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={submissionResult.accessSecret}
                        className="bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs font-mono text-gray-200 flex-1 select-all"
                      />
                      <button
                        onClick={copySecretToClipboard}
                        className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-gray-200 transition-all shrink-0"
                        title="Copy access secret"
                      >
                        {copiedSecret ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-center gap-3">
                  <button
                    onClick={resetForm}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-all"
                  >
                    Submit Another Report
                  </button>
                  <Link
                    href="/"
                    className="px-6 py-3 bg-[#E6FA05] hover:bg-[#d4e604] text-black font-semibold rounded-xl text-sm transition-all"
                  >
                    Return Home
                  </Link>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {status === "error" && errorMessage && (
                  <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-300 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      name="productName"
                      required
                      placeholder="e.g. Paracetamol Extra 500mg"
                      value={formData.productName}
                      onChange={handleChange}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#E6FA05] focus:ring-1 focus:ring-[#E6FA05]/50 transition-all text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Brand / Manufacturer (Optional)
                      </label>
                      <input
                        type="text"
                        name="brandName"
                        placeholder="e.g. GlaxoSmithKline"
                        value={formData.brandName}
                        onChange={handleChange}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#E6FA05] focus:ring-1 focus:ring-[#E6FA05]/50 transition-all text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Public Serial / Code (Optional)
                      </label>
                      <input
                        type="text"
                        name="publicSerial"
                        placeholder="e.g. KW8831A9F4"
                        value={formData.publicSerial}
                        onChange={handleChange}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 font-mono focus:outline-none focus:border-[#E6FA05] focus:ring-1 focus:ring-[#E6FA05]/50 transition-all text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Where was this item purchased / encountered? (Optional)
                    </label>
                    <input
                      type="text"
                      name="purchaseLocation"
                      placeholder="e.g. Central Pharmacy, Market Street, Nairobi"
                      value={formData.purchaseLocation}
                      onChange={handleChange}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#E6FA05] focus:ring-1 focus:ring-[#E6FA05]/50 transition-all text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Detailed Description of Counterfeit Symptoms *
                    </label>
                    <textarea
                      name="description"
                      required
                      rows={4}
                      placeholder="Describe packaging discrepancies, misspellings, poor seal quality, strange odor, or physical anomalies observed..."
                      value={formData.description}
                      onChange={handleChange}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#E6FA05] focus:ring-1 focus:ring-[#E6FA05]/50 transition-all text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full py-4 bg-[#E6FA05] hover:bg-[#d4e604] text-black font-bold rounded-2xl transition-all hover:shadow-lg hover:shadow-[#E6FA05]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-base"
                >
                  {status === "submitting" ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Submitting Cryptographic Report...</span>
                    </>
                  ) : (
                    <span>Submit Verified Report</span>
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

export default function ReportFakePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0715] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#E6FA05]" />
        </div>
      }
    >
      <ReportForm />
    </Suspense>
  );
}
