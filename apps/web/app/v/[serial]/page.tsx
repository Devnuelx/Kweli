"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Loader2,
  KeyRound,
  CheckCircle2,
  Building,
  Package,
  Calendar,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, VerificationResult } from "@/lib/api-client";

export default function VerifyPage() {
  const params = useParams();
  const router = useRouter();
  const serial = params?.serial ? String(params.serial) : "";

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Scratch PIN Verification Challenge State
  const [scratchPin, setScratchPin] = useState("");
  const [verifyingPin, setVerifyingPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  const hasFetched = useRef(false);

  useEffect(() => {
    if (!serial || hasFetched.current) return;
    hasFetched.current = true;

    performInitialScan(serial);
  }, [serial]);

  const performInitialScan = async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.verification.scan({ code });
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to reach verification network");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyScratchPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scratchPin || scratchPin.length < 4) {
      setPinError("Please enter the complete scratch PIN");
      return;
    }

    setVerifyingPin(true);
    setPinError(null);

    try {
      const updated = await api.verification.scan({
        code: serial,
        scratchPin: scratchPin.trim(),
      });
      setResult(updated);
      if (updated.scratchPinVerified === false) {
        setPinError("Invalid scratch PIN. Please verify the code under the scratch-off foil.");
      }
    } catch (err: any) {
      setPinError(err.message || "PIN verification failed");
    } finally {
      setVerifyingPin(false);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 1. Loading View
  if (loading) {
    return (
      <div className="min-h-screen bg-[#070913] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-6">
          <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="w-8 h-8 text-blue-400 animate-pulse" />
          </div>
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Authenticating Product...</h2>
        <p className="text-gray-400 mt-2 max-w-sm text-sm">
          Cryptographically verifying GS1 Digital Link with serial <span className="font-mono text-blue-400">{serial}</span>
        </p>
      </div>
    );
  }

  // 2. Connection / Network Error View
  if (error || !result) {
    return (
      <div className="min-h-screen bg-[#070913] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold">Verification Error</h2>
        <p className="text-gray-400 mt-2 max-w-sm text-sm mb-6">
          {error || "Could not connect to the Kweli verification network."}
        </p>
        <Button
          onClick={() => performInitialScan(serial)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl"
        >
          Retry Verification
        </Button>
      </div>
    );
  }

  const outcome = result.outcome;
  const isInvalid = outcome === "INVALID_OR_UNKNOWN_CODE";
  const isRecalled = outcome === "PRODUCT_RECALLED";
  const isRepeated = outcome === "SUSPICIOUS_REPETITION" || outcome === "ALREADY_ACTIVATED_WARNING";
  const isAuthentic = result.isAuthentic;

  // 3. Counterfeit / Unrecognized Code View
  if (isInvalid) {
    return (
      <div className="min-h-screen bg-[#0d070b] text-white flex flex-col items-center justify-center p-6">
        <div className="bg-[#1a0a14] border-2 border-red-500/60 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl shadow-red-500/20">
          <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-14 h-14 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-red-500 mb-2">Counterfeit Warning</h1>
          <p className="text-sm font-semibold tracking-wide uppercase text-red-400 mb-4">
            Unrecognized Product Code
          </p>
          <p className="text-gray-300 text-sm mb-6 leading-relaxed">
            The code <span className="font-mono text-red-300 font-bold">{serial}</span> was not found in any
            authorized manufacturer registry. Do not ingest, inject, or use this product.
          </p>

          <Button
            onClick={() => router.push(`/report?serial=${encodeURIComponent(serial)}`)}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-xl shadow-lg shadow-red-600/30 mb-3"
          >
            File Immediate Counterfeit Report
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.push("/scan")}
            className="w-full text-gray-400 hover:text-white"
          >
            Scan Another Product
          </Button>
        </div>
      </div>
    );
  }

  // 4. Recalled Product Alert View
  if (isRecalled) {
    return (
      <div className="min-h-screen bg-[#140b07] text-white flex flex-col items-center justify-center p-6">
        <div className="bg-[#241007] border-2 border-amber-500/80 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl shadow-amber-500/20">
          <div className="w-24 h-24 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-14 h-14 text-amber-500" />
          </div>
          <h1 className="text-3xl font-bold text-amber-500 mb-2">Product Recalled</h1>
          <p className="text-sm font-semibold tracking-wide uppercase text-amber-400 mb-4">
            Mandatory Safety Recall Active
          </p>
          <div className="bg-black/30 border border-amber-500/30 rounded-2xl p-4 text-left text-sm mb-6 space-y-2">
            <p className="font-semibold text-white">{result.product?.name}</p>
            <p className="text-gray-300">Brand: {result.product?.brand}</p>
            <p className="text-gray-300">Batch: {result.product?.batchNumber}</p>
            <p className="text-amber-400 font-medium pt-2">
              The manufacturer has issued a formal recall for this batch. Discontinue use immediately.
            </p>
          </div>
          <Button
            onClick={() => router.push(`/report?serial=${encodeURIComponent(serial)}&reason=recall`)}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 rounded-xl"
          >
            Submit Recall Inquiry / Evidence
          </Button>
        </div>
      </div>
    );
  }

  // 5. Authentic Product View (First Scan or Activated)
  return (
    <div className="min-h-screen bg-[#070913] text-white flex flex-col items-center p-4 pt-10 md:pt-16 pb-16">
      <div className="max-w-md w-full space-y-6">
        {/* Verification Status Card */}
        <div
          className={`relative rounded-3xl p-8 text-center border-2 backdrop-blur-xl shadow-2xl ${
            isRepeated
              ? "bg-[#1f1707] border-amber-500/60 shadow-amber-500/10"
              : "bg-[#0a1811] border-green-500/60 shadow-green-500/10"
          }`}
        >
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 ${
              isRepeated ? "bg-amber-500/20" : "bg-green-500/20"
            }`}
          >
            {isRepeated ? (
              <AlertTriangle className="w-10 h-10 text-amber-400" />
            ) : (
              <ShieldCheck className="w-10 h-10 text-green-400" />
            )}
          </div>

          <h1
            className={`text-2xl font-bold mb-1 ${
              isRepeated ? "text-amber-400" : "text-green-400"
            }`}
          >
            {isRepeated ? "Duplicate Scan Warning" : "Verified Authentic"}
          </h1>
          <p className="text-xs font-semibold tracking-wider uppercase text-gray-400 mb-6">
            {outcome.replace(/_/g, " ")}
          </p>

          {/* Product Details Section */}
          <div className="bg-black/40 border border-white/10 rounded-2xl p-5 text-left text-sm space-y-3">
            <div>
              <span className="text-xs text-gray-400 uppercase tracking-wider block">Product Name</span>
              <span className="font-semibold text-lg text-white block">{result.product?.name}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10 text-xs">
              <div>
                <span className="text-gray-400 block">Manufacturer / Brand</span>
                <span className="font-medium text-white">{result.product?.brand}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Batch Number</span>
                <span className="font-mono text-white">{result.product?.batchNumber}</span>
              </div>
              {result.product?.expDate && (
                <div>
                  <span className="text-gray-400 block">Expiry Date</span>
                  <span className="font-medium text-white">
                    {formatDate(result.product.expDate)}
                  </span>
                </div>
              )}
              <div>
                <span className="text-gray-400 block">Public Serial</span>
                <span className="font-mono text-blue-400">{result.product?.unitSerial}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex justify-between items-center text-xs text-gray-400">
              <span>Total Scans: <strong className="text-white">{result.scanCount}</strong></span>
              {result.firstScannedAt && (
                <span>First Scan: {formatDate(result.firstScannedAt)}</span>
              )}
            </div>
          </div>

          {/* Warning for repeated scans */}
          {isRepeated && (
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-left text-xs text-amber-200/90 leading-relaxed">
              <strong>Notice:</strong> This package was first scanned on {formatDate(result.firstScannedAt)}.
              If you did not scan this yourself previously, this packaging code may have been copied or duplicated.
            </div>
          )}
        </div>

        {/* Dual-Layer Scratch-Off PIN Challenge Card */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-bold text-base">Dual-Layer Scratch PIN Verification</h3>
              <p className="text-xs text-gray-400">
                Gently scratch the silver foil on your product to reveal the hidden PIN.
              </p>
            </div>
          </div>

          {result.scratchPinVerified === true ? (
            <div className="p-4 bg-green-500/20 border border-green-500/40 rounded-2xl flex items-center gap-3 text-green-300 text-sm">
              <CheckCircle2 className="w-6 h-6 shrink-0 text-green-400" />
              <div>
                <p className="font-bold">Scratch PIN Cryptographically Verified</p>
                <p className="text-xs text-green-200/80">
                  Unit physical possession confirmed with zero-knowledge cryptographic signature.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleVerifyScratchPin} className="space-y-3">
              {pinError && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-xs">
                  {pinError}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter 6-digit scratch PIN"
                  maxLength={10}
                  value={scratchPin}
                  onChange={(e) => setScratchPin(e.target.value)}
                  className="bg-black/40 border-white/20 text-white font-mono tracking-widest text-center text-lg py-5"
                />
                <Button
                  type="submit"
                  disabled={verifyingPin}
                  className="bg-purple-600 hover:bg-purple-700 text-white shrink-0 px-5"
                >
                  {verifyingPin ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Verify PIN"
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-400 text-center">
                This single-use challenge locks the product to your possession.
              </p>
            </form>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {isRepeated && (
            <Button
              onClick={() => router.push(`/report?serial=${encodeURIComponent(serial)}`)}
              variant="outline"
              className="w-full border-amber-500/40 text-amber-400 hover:bg-amber-500/10 py-3 rounded-xl text-sm"
            >
              Report Suspicious Packaging Activity
            </Button>
          )}
          <Button
            onClick={() => router.push("/scan")}
            variant="ghost"
            className="w-full text-gray-400 hover:text-white text-sm"
          >
            Scan Another Item
          </Button>
        </div>
      </div>
    </div>
  );
}
