"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Shield, 
  QrCode, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Calendar,
  Hash,
  ExternalLink,
  Loader2,
  ArrowLeft,
  Star,
  Package,
  Camera,
  X
} from "lucide-react";

function VerifyContent() {
  const searchParams = useSearchParams();
  const [hash, setHash] = useState("");
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const hashParam = searchParams.get('hash');
    if (hashParam) {
      setHash(hashParam);
      verifyProduct(hashParam);
    }
  }, [searchParams]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (err) {
      setError("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const captureAndVerify = () => {
    // In a real implementation, you would use a QR code scanning library here
    // For now, we'll simulate scanning
    const simulatedHash = "sample_qr_hash_" + Date.now();
    setHash(simulatedHash);
    verifyProduct(simulatedHash);
    stopCamera();
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const verifyProduct = async (productHash) => {
    if (!productHash) return;
    
    setLoading(true);
    setError("");
    setVerificationResult(null);

    try {
      const response = await fetch('/api/products/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hash: productHash }),
      });

      const data = await response.json();
      
      if (data.success) {
        setVerificationResult(data);
      } else {
        setError(data.error || 'Verification failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (hash.trim()) {
      verifyProduct(hash.trim());
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0E27] text-white">
      {/* Navigation */}
      <nav className="border-b border-white/10 backdrop-blur-xl bg-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </Link>
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <img src="/icon.png" alt="Kweli" className="w-5 h-5" />
              </div>
              {/* <span className="text-xl font-bold font-neue">Kweli</span> */}
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <QrCode className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-2xl md:text-5xl font-bold mb-4 font-neue">Web Product Verification</h1>
          <p className="text-sm md:text-xl text-gray-400 max-w-2xl mx-auto font-grotesk">
            Scan or enter a QR code to verify product authenticity and get detailed information. Verify on the app to get $KWELI rewards.
          </p>
        </div>

        {/* Camera Modal */}
        {showCamera && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-2xl">
              <button
                onClick={stopCamera}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-2xl"
              />
              <div className="mt-4 text-center">
                <p className="text-gray-400 mb-4">Position the QR code within the frame</p>
                <Button
                  onClick={captureAndVerify}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-2xl hover:shadow-blue-500/20 transition-all"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Capture & Verify
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Verification Form */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 mb-8">
          <CardHeader>
            <CardTitle className="text-white font-neue">Verify Product</CardTitle>
            <CardDescription className="text-gray-400 font-grotesk">
              Enter the QR code hash or scan a product to verify its authenticity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">QR Code Hash</label>
                <Input
                  value={hash}
                  onChange={(e) => setHash(e.target.value)}
                  placeholder="Enter QR code hash or scan product"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                />
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={handleSubmit}
                  disabled={loading || !hash.trim()} 
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-2xl hover:shadow-blue-500/20 transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4 mr-2" />
                      Verify Product
                    </>
                  )}
                </Button>
                <Button
                  onClick={startCamera}
                  className="bg-white/10 hover:bg-white/20 border border-white/10"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Scan QR
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verification Result */}
        {loading && (
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardContent className="p-12 text-center">
              <Loader2 className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-semibold mb-2 text-white font-neue">Verifying Product...</h3>
              <p className="text-gray-400 font-grotesk">
                Checking product authenticity on the blockchain
              </p>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="bg-white/5 backdrop-blur-xl border-red-500/20">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-red-400 font-neue">Verification Failed</h3>
              <p className="text-gray-400 mb-4 font-grotesk">{error}</p>
              <Button variant="outline" onClick={() => setError("")} className="bg-white/10 border-white/20 hover:bg-white/20">
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {verificationResult && (
          <div className="space-y-6">
            {/* Verification Status */}
            <Card className={`bg-white/5 backdrop-blur-xl ${verificationResult.verified ? 'border-green-500/20' : 'border-red-500/20'}`}>
              <CardContent className="p-8 text-center">
                <div className="flex items-center justify-center mb-4">
                  {verificationResult.verified ? (
                    <CheckCircle className="w-16 h-16 text-green-400" />
                  ) : (
                    <AlertTriangle className="w-16 h-16 text-red-400" />
                  )}
                </div>
                <h2 className={`text-2xl font-bold mb-2 font-neue ${verificationResult.verified ? 'text-green-400' : 'text-red-400'}`}>
                  {verificationResult.verified ? '✅ AUTHENTIC PRODUCT' : '⚠️ COUNTERFEIT ALERT'}
                </h2>
                <p className="text-gray-400 mb-4 font-grotesk">
                  {verificationResult.message}
                </p>
                {verificationResult.reward > 0 && (
                  <Badge className="mb-4 bg-gradient-to-r from-blue-500 to-purple-500">
                    <Star className="w-4 h-4 mr-1" />
                    +{verificationResult.reward} VFY Tokens Earned
                  </Badge>
                )}
                {verificationResult.requiresLogin && (
                  <p className="text-sm text-gray-400 font-grotesk">
                    Sign in to earn rewards for verification
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Product Details */}
            {verificationResult.verified && verificationResult.product && (
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center text-white font-neue">
                    <Package className="w-5 h-5 mr-2" />
                    Product Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-2 text-white font-neue">{verificationResult.product.name}</h3>
                        <p className="text-gray-400 font-grotesk">{verificationResult.product.description}</p>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <Hash className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-grotesk">
                            <span className="text-gray-400">Product ID:</span> <span className="text-white">{verificationResult.product.productId}</span>
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-grotesk">
                            <span className="text-gray-400">Manufactured:</span> <span className="text-white">{formatDate(verificationResult.product.manufacturingDate)}</span>
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-grotesk">
                            <span className="text-gray-400">Expires:</span> <span className="text-white">{formatDate(verificationResult.product.expiryDate)}</span>
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Hash className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-grotesk">
                            <span className="text-gray-400">Batch:</span> <span className="text-white">{verificationResult.product.batchNumber}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <h4 className="font-semibold mb-2 text-white font-neue">Manufacturer</h4>
                        <p className="text-sm text-gray-400 font-grotesk">{verificationResult.product.companyName}</p>
                        <p className="text-sm text-gray-400 font-grotesk">{verificationResult.product.companyLocation}</p>
                      </div>
                      
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <h4 className="font-semibold mb-2 text-white font-neue">Verification Details</h4>
                        <p className="text-sm text-gray-400 font-grotesk">
                          Verified on Hedera blockchain
                        </p>
                        {verificationResult.product.hederaExplorerUrl && (
                          <a href={verificationResult.product.hederaExplorerUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" className="mt-2 bg-white/10 border-white/20 hover:bg-white/20">
                              <ExternalLink className="w-4 h-4 mr-1" />
                              View on Explorer
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Expiry Warning */}
            {verificationResult.verified && verificationResult.isExpired && (
              <Card className="bg-white/5 backdrop-blur-xl border-yellow-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-6 h-6 text-yellow-400" />
                    <div>
                      <h3 className="font-semibold text-yellow-400 font-neue">Product Expired</h3>
                      <p className="text-sm text-gray-400 font-grotesk">
                        This product has passed its expiry date. Please check the manufacturing date before use.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Counterfeit Report */}
            {!verificationResult.verified && (
              <Card className="bg-white/5 backdrop-blur-xl border-red-500/20">
                <CardContent className="p-6">
                  <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h3 className="font-semibold text-red-400 mb-2 font-neue">Counterfeit Product Detected</h3>
                    <p className="text-gray-400 mb-4 font-grotesk">
                      This product is not registered in our system. Please report this to help fight counterfeiting.
                    </p>
                    <Button className="bg-red-500 hover:bg-red-600">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Report Counterfeit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* How It Works */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 mt-12">
          <CardHeader>
            <CardTitle className="text-white font-neue">How Product Verification Works</CardTitle>
            <CardDescription className="text-gray-400 font-grotesk">
              Understanding our blockchain-powered verification system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <QrCode className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="font-semibold mb-2 text-white font-neue">1. Scan QR Code</h3>
                <p className="text-sm text-gray-400 font-grotesk">
                  Each product has a unique QR code that contains encrypted verification data
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="font-semibold mb-2 text-white font-neue">2. Blockchain Check</h3>
                <p className="text-sm text-gray-400 font-grotesk">
                  We verify the product against our immutable blockchain records
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="font-semibold mb-2 text-white font-neue">3. Get Results</h3>
                <p className="text-sm text-gray-400 font-grotesk">
                  Receive instant verification with detailed product information
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}