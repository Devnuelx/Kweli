"use client";

import React, { useState, useEffect, useRef } from "react";
import jsQR from "jsqr";
import { 
  Camera, 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  Loader2, 
  Smartphone, 
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  Award,
  Flame,
  ChevronRight,
  TrendingUp,
  AlertOctagon,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/neon-button";
import Confetti from "@/components/Confetti";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import { api } from "@/lib/api-client";

type ScanState = "prompt" | "scanning" | "verifying" | "result";
type ResultStatus = "authentic" | "duplicate" | "fake" | "error";

interface ProductData {
  name: string;
  brand?: string;
  company?: string | { name: string; logo?: string; location?: string };
  manufacturer?: string;
  batchNumber?: string;
  serialNumber?: string;
  manufacturingDate?: string;
  expiryDate?: string;
  isExpired?: boolean;
  hederaExplorerUrl?: string;
  scanCount?: number;
}

export default function WebScanPage() {
  const [state, setState] = useState<ScanState>("prompt");
  const [status, setStatus] = useState<ResultStatus>("authentic");
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [rewardAmount, setRewardAmount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [hasCamera, setHasCamera] = useState<boolean>(true);
  
  // Daily goals progress (stored in localStorage)
  const [dailyScans, setDailyScans] = useState<number>(0);
  const DAILY_GOAL = 5;

  // Manual entry states
  const [manualCode, setManualCode] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  // Video and Canvas refs for QR scanning
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Load daily scan counts
  useEffect(() => {
    const today = new Date().toDateString();
    const storedDate = localStorage.getItem("kweli_scan_date");
    const storedCount = localStorage.getItem("kweli_scan_count");

    if (storedDate === today && storedCount) {
      setDailyScans(parseInt(storedCount, 10));
    } else {
      localStorage.setItem("kweli_scan_date", today);
      localStorage.setItem("kweli_scan_count", "0");
      setDailyScans(0);
    }
  }, []);

  const incrementDailyGoal = () => {
    const nextCount = dailyScans + 1;
    setDailyScans(nextCount);
    localStorage.setItem("kweli_scan_count", nextCount.toString());
  };

  // Helper to trigger web vibrations
  const triggerVibration = (type: ResultStatus) => {
    if (typeof window !== "undefined" && navigator.vibrate) {
      if (type === "authentic") {
        navigator.vibrate([80, 50, 80]);
      } else if (type === "duplicate") {
        navigator.vibrate([150, 100, 150]);
      } else if (type === "fake") {
        navigator.vibrate([400, 100, 400]);
      }
    }
  };

  // Start the camera
  const startCamera = async () => {
    setState("scanning");
    setStatus("authentic");
    setProductData(null);
    setRewardAmount(0);
    setErrorMessage("");

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true"); // required for iOS Safari
        videoRef.current.play();
      }

      // Start the decoding loop
      animationFrameRef.current = requestAnimationFrame(scanFrame);
    } catch (err) {
      console.error("Camera access error:", err);
      setHasCamera(false);
      setState("scanning"); // stay in scanning but show error/fallback
    }
  };

  // Stop the camera stream
  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Frame decoding loop using jsQR
  const scanFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    // Set canvas dimensions to match video stream
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data to run decoding
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });

    if (code) {
      // Detected a QR code!
      console.log("QR Code detected:", code.data);
      stopCamera();
      
      // Vibration alert
      if (typeof window !== "undefined" && navigator.vibrate) {
        navigator.vibrate(100);
      }

      // Parse scanned content (can be a serial code URL /v/[serial] or a raw hash)
      handleScannedData(code.data);
    } else {
      // Keep scanning
      animationFrameRef.current = requestAnimationFrame(scanFrame);
    }
  };

  // Handle scanned QR data
  const handleScannedData = async (data: string) => {
    setState("verifying");
    
    let codeToVerify = data.trim();

    try {
      if (data.includes("/v/")) {
        const url = new URL(data);
        const pathParts = url.pathname.split("/").filter(p => p.length > 0);
        codeToVerify = pathParts[pathParts.length - 1];
      } else if (data.includes("code=")) {
        const match = data.match(/[?&]code=([^&]+)/);
        if (match) codeToVerify = match[1];
      }

      const res = await api.verification.scan({ code: codeToVerify });
      processScanResponse(res);
    } catch (err: any) {
      console.error("Scan processing error:", err);
      setStatus("error");
      setErrorMessage(err.message || "Failed to verify product code.");
      setState("result");
      triggerVibration("error");
    }
  };

  // Process the API response
  const processScanResponse = (data: any) => {
    let uiStatus: ResultStatus = "authentic";

    if (data.outcome === "AUTHENTIC_FIRST_SCAN") {
      uiStatus = "authentic";
    } else if (data.outcome === "ALREADY_ACTIVATED_WARNING") {
      uiStatus = "duplicate";
    } else {
      uiStatus = "fake";
    }

    setStatus(uiStatus);

    if (data.product) {
      setProductData({
        name: data.product.name,
        brand: data.product.brand || "Kweli Verified",
        manufacturer: data.product.brand,
        batchNumber: data.product.batchNumber,
        serialNumber: data.product.unitSerial,
        manufacturingDate: data.product.mfgDate,
        expiryDate: data.product.expDate,
        scanCount: data.scanCount,
      });
    }

    setRewardAmount(0);
    setErrorMessage(data.message || "");

    if (uiStatus === "authentic") {
      incrementDailyGoal();
    }

    triggerVibration(uiStatus);
    setState("result");
  };

  // Handle manual code form submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    stopCamera();
    handleScannedData(manualCode.trim());
  };

  return (
    <div className="bg-[#b4d2ea] min-h-screen text-[#1a1615] font-sans selection:bg-blue-200 selection:text-black overflow-x-hidden relative flex flex-col pb-28">
      {/* Background Gradient / Clouds simulation matching landing page */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#b4d2ea] via-[#c6ddec] to-[#e4eef6]"></div>
        <div className="absolute top-20 left-[-10%] w-[40%] h-[400px] bg-white/40 blur-[100px] rounded-full mix-blend-overlay"></div>
        <div className="absolute top-40 right-[-10%] w-[30%] h-[300px] bg-white/40 blur-[80px] rounded-full mix-blend-overlay"></div>
      </div>

      <Confetti active={state === "result" && status === "authentic"} />
      
      <Navbar />

      {/* Top Settings Icon like Shazam (Mobile) */}
      {/* <div className="absolute top-20 right-6 z-20 md:hidden">
        <div className="w-10 h-10 bg-white/40 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/40 shadow-lg">
          <Settings className="w-5 h-5 text-[#1a1615]" />
        </div>
      </div> */}

      {/* MAIN CONTAINER */}
      <main className="w-full px-4 flex-1 flex flex-col justify-center items-center pt-28 pb-6 z-10">
        
        {/* STATE: PROMPT */}
        {state === "prompt" && (
          <div className="w-full flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300 min-h-[60vh]">
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-[#1a1615] mb-10">
              Tap to Kweli
            </h1>

            {/* The Giant Scanner Button */}
            <div className="relative flex items-center justify-center mb-16">
              {/* Shiny Shimmer Ring */}
              {/* <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute w-56 h-56 md:w-72 md:h-72 rounded-full border border-white/30"
                style={{
                  background: "linear-gradient(rgba(255,255,255,0.4), rgba(255,255,255,0)) border-box",
                }}
              > */}
                {/* The white shimmer spec */}
                {/* <div className="absolute top-0 left-1/2 -ml-8 w-16 h-[2px] bg-red-500 blur-[2px] rounded-full" /> */}
              {/* </motion.div> */}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startCamera}
                className="group w-46 h-46 md:w-52 md:h-52 rounded-full bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_20px_60px_rgba(0,0,0,0.1)] flex items-center justify-center relative overflow-hidden z-10"
              >
                {/* Neon Borders */}
                {/* <span className="absolute h-[2px] opacity-0 group-hover:opacity-100 transition-all duration-500 ease-in-out inset-x-0 inset-y-0 bg-gradient-to-r w-3/4 mx-auto from-transparent to-transparent block z-30" />
                <span className="absolute group-hover:opacity-50 transition-all duration-500 ease-in-out inset-x-0 h-[2px] bottom-0 bg-gradient-to-r w-3/4 mx-auto from-transparent to-transparent block z-30" /> */}

                {/* Inner subtle glow */}
                <div className="absolute inset-0 rounded-full bg-[#0c70ce] z-0"></div>
                
                <div className="relative w-28 h-28 md:w-32 md:h-32 z-20 ">
                  <Image src="/icon.png" alt="Kweli Logo" fill className="object-contain" />
                </div>
              </motion.button>
            </div>

            {/* Recently Found (Gamification) */}
            {/* <div className="w-full max-w-lg mt-auto mb-4">
              <h2 className="text-sm font-bold text-[#453f3d] mb-4 px-2 text-left tracking-wide uppercase">Recently Verified</h2>
              
              <div className="bg-white/40 backdrop-blur-xl rounded-[24px] p-4 flex items-center justify-between border border-white/50 hover:bg-white/60 transition-colors cursor-pointer shadow-xl text-left">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-xl overflow-hidden relative">
                    <Image src="/usecase.avif" alt="Product" fill className="object-cover" />
                  </div>
                  <div>
                    <div className="text-[10px] text-[#453f3d] font-semibold uppercase tracking-wider mb-1">1 day ago</div>
                    <div className="font-bold text-[#1a1615] flex items-center gap-2 text-base">
                      Vintage Watch 
                      <span className="bg-[#E6FA05] text-black text-[9px] px-1.5 py-0.5 rounded flex items-center justify-center font-bold">V</span>
                    </div>
                    <div className="text-xs text-[#453f3d] mt-0.5">Rolex</div>
                  </div>
                </div>
              </div>
            </div> */}
          </div>
        )}

        {/* STATE: SCANNING */}
        {state === "scanning" && (
          <div className="w-full flex flex-col items-center animate-in zoom-in-95 duration-200">
            {hasCamera ? (
              <div className="w-full relative aspect-square max-w-sm rounded-[32px] overflow-hidden border-2 border-white/10 shadow-2xl bg-black">
                {/* Video feed */}
                <video 
                  ref={videoRef}
                  className="w-full h-full object-cover scale-x-[-1]"
                />

                {/* Laser Overlay (CSS-based laser sliding up and down) */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 pointer-events-none">
                  <div className="w-full h-full border-4 border-dashed border-white/20 rounded-2xl relative flex items-center justify-center">
                    
                    {/* Glowing neon green scanning laser line */}
                    <div className="absolute left-0 w-full h-[6px] rounded-full bg-gradient-to-r from-transparent via-[#E6FA05] to-transparent shadow-[0_0_12px_#E6FA05] animate-scan-laser z-20"></div>

                    {/* Scan guidelines */}
                    <span className="text-[10px] uppercase font-bold text-white/50 tracking-widest text-center">
                      Align QR inside frame
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              // Fallback if no camera permission or error
              <div className="w-full aspect-square max-w-sm rounded-[32px] bg-red-950/20 border-2 border-red-500/30 flex flex-col items-center justify-center p-8 text-center">
                <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
                <h3 className="text-xl font-bold mb-2">Camera Access Blocked</h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-6">
                  Please enable camera permission in your browser settings to scan product packaging QR codes.
                </p>
                <Button 
                  onClick={startCamera}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full border border-white/15"
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> Retry Camera
                </Button>
              </div>
            )}

            <div className="mt-8 w-full text-center">
              {!showManualInput ? (
                <button 
                  onClick={() => setShowManualInput(true)}
                  className="text-[#E6FA05] hover:underline font-bold text-sm tracking-wide"
                >
                  Having trouble? Enter code manually
                </button>
              ) : (
                <form onSubmit={handleManualSubmit} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 animate-in slide-in-from-bottom-5 duration-200">
                  <label className="block text-left text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                    Enter Serial or QR Hash
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="e.g. KWELI-1029384"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#493DE6]"
                    />
                    <Button 
                      type="submit"
                      className="bg-[#493DE6] hover:bg-[#3b31c2] font-bold text-sm px-4 rounded-xl"
                    >
                      Verify
                    </Button>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowManualInput(false)}
                    className="text-gray-400 hover:text-white text-xs mt-3 block mx-auto underline"
                  >
                    Cancel manual entry
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* STATE: VERIFYING (Gradient going up and down, breathing, alive!) */}
        {state === "verifying" && (
          <div className="w-full flex flex-col items-center animate-in zoom-in-95 duration-200 text-center">
            
            {/* Pulsating mockup card indicating active blockchain verify check */}
            <div className="w-full max-w-sm aspect-square bg-[#0c1236]/90 border border-white/10 rounded-[32px] flex items-center justify-center p-8 relative overflow-hidden shadow-2xl">
              
              {/* Breeding Background Gradients (Shifting) */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#493DE6]/20 via-transparent to-[#E6FA05]/10 animate-pulse duration-[3000ms]"></div>
              
              {/* Full height gradient scan beam sliding up/down inside the card */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#493DE6]/0 via-[#E6FA05]/15 to-[#493DE6]/0 h-[100%] w-full animate-sweep-gradient pointer-events-none"></div>

              {/* Central loading content */}
              <div className="relative flex flex-col items-center z-10">
                <div className="w-20 h-20 rounded-full bg-[#E6FA05]/10 border border-[#E6FA05]/20 flex items-center justify-center mb-6 animate-bounce">
                  <Smartphone className="w-10 h-10 text-[#E6FA05]" />
                </div>
                <h3 className="text-2xl font-bold tracking-wide animate-pulse text-[#E6FA05] mb-2">
                  Verifying Signature...
                </h3>
                <p className="text-xs text-gray-400 font-semibold tracking-wider uppercase animate-pulse">
                  Querying Hedera Consensus Service
                </p>
              </div>
            </div>

            <p className="mt-8 text-sm text-gray-400 italic">
              Cryptographically checking timestamps & double scans...
            </p>
          </div>
        )}

        {/* STATE: RESULT */}
        {state === "result" && (
          <div className="w-full flex flex-col items-center animate-in zoom-in-95 duration-300">
            
            {/* RESULT: AUTHENTIC (GREEN CARD) */}
            {status === "authentic" && (
              <div className="w-full text-center">
                <div className="bg-card border-2 border-emerald-500/40 rounded-3xl p-6 shadow-2xl shadow-emerald-500/10 mb-6 bg-gradient-to-b from-[#0c2419]/90 to-[#060814]/90 relative overflow-hidden transition-all hover:scale-[1.01]">
                  <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-500 delay-100">
                    <ShieldCheck className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h1 className="text-3xl font-extrabold text-emerald-500 mb-1 tracking-tight">100% Authentic</h1>
                  <p className="text-gray-400 text-sm mb-6">Verified on Hedera Ledger</p>

                  <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-left space-y-3 mb-6">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-xs text-gray-400 font-semibold uppercase">Product</span>
                      <span className="font-bold text-sm text-white truncate max-w-[200px]">{productData?.name}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-xs text-gray-400 font-semibold uppercase">Manufacturer</span>
                      <span className="font-bold text-sm text-white">{productData?.brand}</span>
                    </div>
                    {productData?.serialNumber && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400 font-semibold uppercase">Serial Code</span>
                        <span className="font-mono text-xs text-[#E6FA05]">{productData.serialNumber}</span>
                      </div>
                    )}
                  </div>

                  {/* Reward details badge */}
                  {rewardAmount > 0 ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center space-x-3 text-left mb-2 animate-in slide-in-from-bottom-3 duration-300 delay-200">
                      <div className="w-10 h-10 rounded-full bg-[#E6FA05]/20 flex items-center justify-center shrink-0">
                        <Award className="w-6 h-6 text-[#E6FA05]" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-semibold">Rewards Claimed</p>
                        <p className="text-lg font-extrabold text-[#E6FA05]">{rewardAmount} VFY Tokens Credited!</p>
                      </div>
                    </div>
                  ) : (
                    // Sign up warning details
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-center space-x-3 text-left mb-2">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                        <Award className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-blue-400 font-bold uppercase tracking-wider">Pending Reward</p>
                        <p className="text-xs text-gray-300 leading-normal mt-0.5">Sign up / Log in to claim your 10 VFY tokens into your Hedera wallet.</p>
                      </div>
                    </div>
                  )}

                  {productData?.hederaExplorerUrl && (
                    <a 
                      href={productData.hederaExplorerUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs text-gray-400 hover:text-[#E6FA05] transition-colors flex items-center justify-center mt-4 font-semibold hover:underline"
                    >
                      View Hedera Ledger Transaction <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <Button 
                    onClick={startCamera}
                    className="w-full py-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-lg shadow-emerald-600/20"
                  >
                    Scan Another Product
                  </Button>
                </div>
              </div>
            )}

            {/* RESULT: DUPLICATE (YELLOW CARD) */}
            {status === "duplicate" && (
              <div className="w-full text-center">
                <div className="bg-card border-2 border-yellow-500/40 rounded-3xl p-6 shadow-2xl shadow-yellow-500/10 mb-6 bg-gradient-to-b from-[#211d09]/95 to-[#060814]/95">
                  <div className="w-20 h-20 bg-yellow-500/20 border border-yellow-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-10 h-10 text-yellow-500" />
                  </div>
                  <h1 className="text-3xl font-extrabold text-yellow-500 mb-1 tracking-tight">Already Scanned</h1>
                  <p className="text-gray-400 text-sm mb-4">Warning: Re-scan protection triggered</p>

                  <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-left text-xs text-yellow-100/80 mb-6 leading-relaxed">
                    <p className="font-semibold mb-2 text-yellow-400">Important Note:</p>
                    <p>This serial code has been scanned previously. If you scanned this a moment ago, the product is authentic. If this is a newly opened product, the code may have been duplicated or photocopied.</p>
                    {productData?.scanCount && (
                      <p className="mt-3 text-white font-bold">Total Scans Recorded: {productData.scanCount}</p>
                    )}
                  </div>

                  <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-left space-y-3">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-xs text-gray-400 font-semibold uppercase">Product</span>
                      <span className="font-bold text-sm text-white truncate max-w-[200px]">{productData?.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400 font-semibold uppercase">Manufacturer</span>
                      <span className="font-bold text-sm text-white">{productData?.brand}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button 
                    onClick={() => {
                      const code = productData?.serialNumber || manualCode;
                      window.location.href = `/report?serial=${encodeURIComponent(code)}`;
                    }}
                    variant="solid"
                    className="w-full py-6 rounded-2xl border border-red-500/40 bg-red-950/20 hover:bg-red-950/40 text-red-500 font-bold"
                  >
                    Report Suspicious Code
                  </Button>
                  <Button 
                    onClick={startCamera}
                    variant="solid"
                    className="w-full py-6 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10 font-bold"
                  >
                    Scan Another Product
                  </Button>
                </div>
              </div>
            )}

            {/* RESULT: FAKE (RED CARD - SHAKES ON RENDER) */}
            {status === "fake" && (
              <div className="w-full text-center animate-shake">
                <div className="bg-card border-2 border-red-500/40 rounded-3xl p-6 shadow-2xl shadow-red-500/10 mb-6 bg-gradient-to-b from-[#210909]/95 to-[#060814]/95">
                  <div className="w-20 h-20 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertOctagon className="w-10 h-10 text-red-500" />
                  </div>
                  <h1 className="text-3xl font-extrabold text-red-500 mb-1 tracking-tight">Fake Code Detected</h1>
                  <p className="text-gray-400 text-sm mb-4">Counterfeit Warning Alert</p>

                  <div className="bg-red-500/15 border border-red-500/20 rounded-2xl p-4 text-left text-xs text-red-200 mb-6 leading-relaxed">
                    <p className="font-bold mb-1 text-red-400">⚠️ CRITICAL ADVISORY:</p>
                    <p>This cryptographic signature is unrecognized. Do not use, consume, or transact this product. It poses safety and health risks.</p>
                  </div>

                  <div className="bg-white/5 border border-[#ef4444]/15 rounded-2xl p-4 text-left">
                    <p className="text-xs text-gray-400 font-semibold mb-1 uppercase">Attempted Serial Scan</p>
                    <p className="font-mono text-sm font-bold text-red-400 break-all select-all">{productData?.serialNumber || manualCode}</p>
                    {errorMessage && <p className="text-xs text-gray-400 mt-2 font-medium">Reason: {errorMessage}</p>}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button 
                    onClick={() => {
                      const code = productData?.serialNumber || manualCode;
                      window.location.href = `/report?serial=${encodeURIComponent(code)}`;
                    }}
                    className="w-full py-7 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-lg shadow-lg shadow-red-600/35"
                  >
                    File Counterfeit Report (+50 VFY)
                  </Button>
                  <Button 
                    onClick={startCamera}
                    variant="solid"
                    className="w-full py-6 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10 font-bold"
                  >
                    Scan Another Product
                  </Button>
                </div>
              </div>
            )}

            {/* RESULT: ERROR (FALLBACK CARD) */}
            {status === "error" && (
              <div className="w-full text-center">
                <div className="bg-card border border-white/10 rounded-3xl p-6 mb-6 bg-gradient-to-b from-white/5 to-[#060814]/95">
                  <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <XCircle className="w-10 h-10 text-gray-400" />
                  </div>
                  <h1 className="text-3xl font-extrabold text-gray-200 mb-1 tracking-tight">Scan Failed</h1>
                  <p className="text-gray-400 text-sm mb-4">Error processing product scan</p>

                  <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-left text-xs text-gray-400">
                    <p className="font-semibold text-gray-300 mb-1">Error Details:</p>
                    <p>{errorMessage || "Could not reach the cryptographic verification server."}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button 
                    onClick={startCamera}
                    className="w-full py-6 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold"
                  >
                    Try Scanning Again
                  </Button>
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* CANVAS FOR DYNAMIC FRAMES (HIDDEN) */}
      <canvas ref={canvasRef} className="hidden" />

      <MobileNav />
    </div>
  );
}
