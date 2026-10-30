"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Package,
  QrCode,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Download,
  BarChart3,
  Loader2,
  X,
} from "lucide-react";
import { api } from "@/lib/api-client";

interface RecentScan {
  id: string;
  publicSerial: string;
  productName: string;
  batchNumber: string;
  outcome: string;
  maskedIp?: string | null;
  scannedAt: string;
}

interface StatsData {
  totalProducts: number;
  totalUnits: number;
  totalScans: number;
  fraudAttempts: number;
  scanRate: number;
  recentScans: RecentScan[];
}

export default function DashboardPage() {
  const router = useRouter();

  const [stats, setStats] = useState<StatsData>({
    totalProducts: 0,
    totalUnits: 0,
    totalScans: 0,
    fraudAttempts: 0,
    scanRate: 0,
    recentScans: [],
  });
  const [loading, setLoading] = useState(true);
  const [productForm, setProductForm] = useState({
    name: "",
    batchNumber: "",
    sku: "",
    category: "",
    description: "",
    batchSize: 10,
    manufacturingDate: "",
    expiryDate: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successData, setSuccessData] = useState<any>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await api.products.stats();
      setStats({
        totalProducts: data.totalProducts || 0,
        totalUnits: data.totalUnits || 0,
        totalScans: data.totalScans || 0,
        fraudAttempts: data.fraudAttempts || 0,
        scanRate: data.scanRate || 0,
        recentScans: data.recentScans || [],
      });
    } catch (error: any) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.batchNumber) {
      setErrorMessage("Please fill in both Product Name and Batch Number");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const res = await api.products.register({
        name: productForm.name,
        batchNumber: productForm.batchNumber,
        batchSize: Number(productForm.batchSize) || 1,
        sku: productForm.sku || undefined,
        category: productForm.category || undefined,
        description: productForm.description || undefined,
        manufacturingDate: productForm.manufacturingDate || undefined,
        expiryDate: productForm.expiryDate || undefined,
      });

      setSuccessData(res);
      setProductForm({
        name: "",
        batchNumber: "",
        sku: "",
        category: "",
        description: "",
        batchSize: 10,
        manufacturingDate: "",
        expiryDate: "",
      });
      setShowProductModal(false);
      setShowSuccessModal(true);
      fetchStats();
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to register product");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Brand Dashboard</h1>
          <p className="text-gray-400">
            Welcome back! Here is your brand security, serialization, and telemetry overview.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Total Products */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-blue-900/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all"></div>
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">{stats.totalProducts}</div>
              <div className="text-sm text-gray-400">Registered Products</div>
            </div>
          </div>

          {/* Total Units */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-600/20 to-green-900/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all"></div>
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">{stats.totalUnits}</div>
              <div className="text-sm text-gray-400">Serialized Units Issued</div>
            </div>
          </div>

          {/* Total Scans */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-purple-900/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all"></div>
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">{stats.totalScans}</div>
              <div className="text-sm text-gray-400">Consumer Scans ({stats.scanRate.toFixed(1)}%)</div>
            </div>
          </div>

          {/* Fraud Attempts Detected */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-red-900/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all"></div>
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold mb-1 text-red-500">{stats.fraudAttempts}</div>
              <div className="text-sm text-gray-400">Suspicious Anomaly Flags</div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10 rounded-2xl blur-2xl"></div>
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-center space-x-2 mb-6">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-bold">Recent Verification Activity</h2>
              </div>

              <div className="space-y-3">
                {stats.recentScans && stats.recentScans.length > 0 ? (
                  stats.recentScans.map((scan) => {
                    const isSuspicious =
                      scan.outcome === "SUSPICIOUS_REPETITION" ||
                      scan.outcome === "ALREADY_ACTIVATED_WARNING" ||
                      scan.outcome === "INVALID_OR_UNKNOWN_CODE";
                    return (
                      <div
                        key={scan.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                      >
                        <div className="flex items-center space-x-3">
                          {isSuspicious ? (
                            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                          )}
                          <div>
                            <p className="font-medium text-sm">
                              {scan.productName} ({scan.publicSerial})
                            </p>
                            <p className="text-xs text-gray-400">
                              Batch: {scan.batchNumber} • IP: {scan.maskedIp || "Masked"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">{formatDate(scan.scannedAt)}</p>
                          <span
                            className={`inline-block px-2 py-1 rounded-md text-xs font-medium mt-1 ${
                              isSuspicious
                                ? "bg-red-500/20 text-red-400"
                                : "bg-green-500/20 text-green-400"
                            }`}
                          >
                            {scan.outcome.replace(/_/g, " ")}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12">
                    <QrCode className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No recent scan activity</p>
                    <p className="text-gray-500 text-xs mt-1">
                      Register products and generate serialized packaging batches to start tracking.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-cyan-600/10 rounded-2xl blur-2xl"></div>
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Package className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-bold">Quick Actions</h2>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setShowProductModal(true)}
                  className="w-full flex items-center space-x-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-left"
                >
                  <Plus className="w-5 h-5 text-blue-400" />
                  <div>
                    <span className="font-medium block">Register New Product & Batch</span>
                    <span className="text-xs text-gray-400">Generate serialized units with scratch PINs</span>
                  </div>
                </button>
                <button
                  onClick={() => router.push("/dashboard/products")}
                  className="w-full flex items-center space-x-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-left"
                >
                  <Download className="w-5 h-5 text-purple-400" />
                  <div>
                    <span className="font-medium block">Export Packaging QR Codes & Manifests</span>
                    <span className="text-xs text-gray-400">Download print-ready ZIP archives and CSV files</span>
                  </div>
                </button>
                <button
                  onClick={() => router.push("/dashboard/products/import")}
                  className="w-full flex items-center space-x-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-left"
                >
                  <BarChart3 className="w-5 h-5 text-cyan-400" />
                  <div>
                    <span className="font-medium block">Bulk Import Products via CSV</span>
                    <span className="text-xs text-gray-400">Upload enterprise catalog spreadsheets</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Register Product Modal */}
        {showProductModal && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowProductModal(false)}
          >
            <div
              className="relative max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-3xl blur-2xl"></div>
              <div className="relative bg-[#0A0E27] border border-white/20 rounded-3xl p-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Register New Product Batch</h2>
                    <p className="text-sm text-gray-400">
                      Creates dual-layer serialized units with cryptographic GS1 QR codes and scratch PINs.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowProductModal(false)}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {errorMessage && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
                    {errorMessage}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Amoxicillin 500mg"
                        value={productForm.name}
                        onChange={(e) =>
                          setProductForm({ ...productForm, name: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">
                        Batch Number *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. AMX-2026-B1"
                        value={productForm.batchNumber}
                        onChange={(e) =>
                          setProductForm({ ...productForm, batchNumber: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">
                        SKU (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. SKU-AMX-500"
                        value={productForm.sku}
                        onChange={(e) =>
                          setProductForm({ ...productForm, sku: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">
                        Category (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Pharmaceuticals"
                        value={productForm.category}
                        onChange={(e) =>
                          setProductForm({ ...productForm, category: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">
                        Batch Units to Generate (Max 5,000) *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="5000"
                        value={productForm.batchSize}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            batchSize: parseInt(e.target.value, 10) || 1,
                          })
                        }
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">
                        Expiry Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={productForm.expiryDate}
                        onChange={(e) =>
                          setProductForm({ ...productForm, expiryDate: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2 text-gray-300">
                        Description
                      </label>
                      <textarea
                        placeholder="Product specifications, packaging details, storage instructions..."
                        value={productForm.description}
                        onChange={(e) =>
                          setProductForm({ ...productForm, description: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
                        rows={3}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mt-4"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Generating Cryptographic Units...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        <span>Register Batch & Generate Units</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#0A0E27] border border-white/20 rounded-3xl p-6 max-w-md w-full text-center">
              <div className="w-12 h-12 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Batch Registered Successfully</h3>
              <p className="text-sm text-gray-300 mb-4">
                Batch <span className="font-semibold text-white">{successData?.batch?.batchNumber}</span> with{" "}
                <span className="font-semibold text-white">{successData?.batch?.batchSize}</span> units has been
                registered with dual-layer security.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-all"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    router.push("/dashboard/products");
                  }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-all"
                >
                  View in Products
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
