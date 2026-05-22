"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ShieldCheck, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyPage() {
  const { serial } = useParams();
  const [status, setStatus] = useState("loading"); // loading, authentic, duplicate, fake, error
  const [productData, setProductData] = useState(null);
  
  useEffect(() => {
    if (!serial) return;
    
    // We only want to fire the POST once. 
    // In React 18 StrictMode this runs twice in dev, so we use a ref or just simple state check if possible.
    // For simplicity, a standard fetch:
    let isMounted = true;
    
    const verifyScan = async () => {
      try {
        // Option to add geolocation:
        // navigator.geolocation.getCurrentPosition(pos => { lat, lng })
        
        const res = await fetch(`/api/scan/${serial}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}) // Add lat/long here later if needed
        });
        
        const data = await res.json();
        
        if (!isMounted) return;
        
        if (data.success) {
          setStatus(data.status); // 'authentic', 'duplicate', 'fake'
          if (data.product) {
            setProductData(data.product);
          }
        } else {
          setStatus("error");
        }
      } catch (err) {
        if (isMounted) setStatus("error");
        console.error(err);
      }
    };
    
    verifyScan();
    
    return () => { isMounted = false; };
  }, [serial]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
        <h2 className="text-2xl font-bold animate-pulse">Verifying Product...</h2>
        <p className="text-muted-foreground mt-2">Checking cryptographic signatures via Hedera Hashgraph</p>
      </div>
    );
  }

  if (status === "fake") {
    return (
      <div className="min-h-screen bg-red-950/20 flex flex-col items-center justify-center p-4">
        <div className="bg-card border-2 border-red-500/50 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl shadow-red-500/10">
          <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-red-500 mb-2">Counterfeit Warning</h1>
          <p className="text-muted-foreground mb-6">
            This QR code is not recognized in our database. Do not consume or use this product.
          </p>
          <Button variant="destructive" className="w-full" onClick={() => window.location.href='/report'}>
            Report this Product
          </Button>
        </div>
      </div>
    );
  }

  if (status === "duplicate") {
    return (
      <div className="min-h-screen bg-yellow-950/20 flex flex-col items-center justify-center p-4">
        <div className="bg-card border-2 border-yellow-500/50 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl shadow-yellow-500/10">
          <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-12 h-12 text-yellow-500" />
          </div>
          <h1 className="text-3xl font-bold text-yellow-500 mb-2">Already Scanned</h1>
          <p className="text-muted-foreground mb-4">
            This product ({productData?.name}) was already verified previously.
          </p>
          <div className="bg-yellow-500/10 p-4 rounded-xl text-sm text-yellow-200/80 mb-6 text-left">
            <p><strong>Note:</strong> If you just scanned this a moment ago, the product is authentic. If this is your first time scanning, it may be a duplicate or compromised code.</p>
            <p className="mt-2">Scan Count: {productData?.scanCount}</p>
          </div>
          <Button variant="outline" className="w-full border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10" onClick={() => window.location.href='/report'}>
            Report Suspicious Activity
          </Button>
        </div>
      </div>
    );
  }

  if (status === "authentic") {
    return (
      <div className="min-h-screen bg-green-950/20 flex flex-col items-center p-4 pt-12 md:pt-24">
        <div className="bg-card border-2 border-green-500/50 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl shadow-green-500/10">
          <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-500">
            <ShieldCheck className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-green-500 mb-2">100% Authentic</h1>
          <p className="text-muted-foreground mb-6">
            Verified by Kweli Network
          </p>
          
          <div className="border border-border rounded-xl p-4 mb-6 text-left bg-muted/30">
            <p className="text-sm text-muted-foreground mb-1">Product</p>
            <p className="font-semibold text-lg">{productData?.name}</p>
            <div className="h-px bg-border my-3"></div>
            <p className="text-sm text-muted-foreground mb-1">Brand</p>
            <p className="font-semibold">{productData?.company}</p>
          </div>

          <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={() => window.location.href='#'}>
            Claim Instant Reward
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <AlertTriangle className="w-16 h-16 text-muted-foreground mb-4" />
      <h2 className="text-2xl font-bold">Verification Error</h2>
      <p className="text-muted-foreground mt-2">Could not connect to the verification server.</p>
    </div>
  );
}
