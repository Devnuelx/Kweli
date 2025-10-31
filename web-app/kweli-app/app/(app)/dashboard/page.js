// app/dashboard/page.js
"use client";

import { useState, useEffect } from "react";
import { Shield, Package, QrCode, TrendingUp, AlertTriangle, CheckCircle2, Plus, Download, BarChart3, Loader2, X } from "lucide-react";


export default function DashboardPage() {

  const [stats, setStats] = useState({
    totalProducts: 0,
    totalScans: 0,
    fakesDetected: 0,
    recentScans: []
  });
  const [loading, setLoading] = useState(true);
  const [productForm, setProductForm] = useState({
    productId: '',
    name: '',
    batchNumber: '',
    manufacturingDate: '',
    expiryDate: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/products/stats');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   setSubmitting(true);

  //   try {
  //     const response = await fetch('/api/products/register', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify(productForm)
  //     });

  //     const data = await response.json();
      
  //     if (data.success) {
  //       setProductForm({
  //         productId: '',
  //         name: '',
  //         batchNumber: '',
  //         manufacturingDate: '',
  //         expiryDate: ''
  //       });
  //       setShowProductModal(false);
  //       fetchStats();
  //       alert('Product registered successfully!');
  //     } else {
  //       alert('Error: ' + (data.error || 'Unknown error'));
  //     }
  //   } catch (error) {
  //     alert('Error: ' + error.message);
  //   } finally {
  //     setSubmitting(false);
  //   }
  // };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }


  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/products/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productForm)
      });

      const data = await response.json();
      
      if (data.success) {
        setProductForm({
          productId: '',
          name: '',
          batchNumber: '',
          manufacturingDate: '',
          expiryDate: ''
        });
        setShowProductModal(false);
        fetchStats();
        // Show success modal with real data returned from the API
        setModalData({ count: data.count || 0, products: data.products || [] });
        setShowSuccessModal(true);
      } else {
        setErrorMessage(data.error || 'Unknown error');
        setShowErrorModal(true);
      }
    } catch (error) {
      setErrorMessage(error.message || 'An unexpected error occurred');
      setShowErrorModal(true);
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-400">Welcome back! Here&apos;s your overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Products */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-blue-900/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all"></div>
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                {stats.productPercentChange !== 0 && (
                  <div className={`flex items-center space-x-1 ${stats.productPercentChange > 0 ? 'text-green-500' : 'text-red-500'} text-sm`}>
                    <TrendingUp className={`w-4 h-4 ${stats.productPercentChange < 0 ? 'rotate-180' : ''}`} />
                    <span>{stats.productPercentChange > 0 ? '+' : ''}{stats.productPercentChange}%</span>
                  </div>
                )}
              </div>
              <div className="text-3xl font-bold mb-1">{stats.totalProducts}</div>
              <div className="text-sm text-gray-400">Total Products</div>
            </div>
          </div>

          {/* Total Scans */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-purple-900/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all"></div>
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-white" />
                </div>
                {stats.scanPercentChange !== 0 && (
                  <div className={`flex items-center space-x-1 ${stats.scanPercentChange > 0 ? 'text-green-500' : 'text-red-500'} text-sm`}>
                    <TrendingUp className={`w-4 h-4 ${stats.scanPercentChange < 0 ? 'rotate-180' : ''}`} />
                    <span>{stats.scanPercentChange > 0 ? '+' : ''}{stats.scanPercentChange}%</span>
                  </div>
                )}
              </div>
              <div className="text-3xl font-bold mb-1">{stats.totalScans}</div>
              <div className="text-sm text-gray-400">Total Scans</div>
            </div>
          </div>

          {/* Fakes Detected */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-red-900/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all"></div>
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                {stats.fakesPercentChange !== 0 && (
                  <div className={`flex items-center space-x-1 text-red-500 text-sm`}>
                    <AlertTriangle className="w-4 h-4" />
                    <span>{stats.fakesPercentChange > 0 ? '+' : ''}{stats.fakesPercentChange}%</span>
                  </div>
                )}
              </div>
              <div className="text-3xl font-bold mb-1 text-red-500">{stats.fakesDetected}</div>
              <div className="text-sm text-gray-400">Fakes Detected</div>
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
                <h2 className="text-xl font-bold">Recent Activity</h2>
              </div>
              
              <div className="space-y-3">
                {stats.recentScans && stats.recentScans.length > 0 ? (
                  stats.recentScans.map((scan, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
                      <div className="flex items-center space-x-3">
                        {scan.isAuthentic ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium text-sm">
                            {scan.isAuthentic ? 'Verified Product' : 'Fake Detected'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {scan.productName || 'Unknown Product'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">
                          {formatDate(scan.scannedAt)}
                        </p>
                        <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${
                          scan.isAuthentic ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {scan.isAuthentic ? 'Verified' : 'Fake'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <QrCode className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No recent activity</p>
                    <p className="text-gray-500 text-xs mt-1">Register products to start tracking</p>
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
                  <span className="font-medium">Register New Product</span>
                </button>
                <button onClick={() => router.push("/dashboard/products")} className="w-full flex items-center space-x-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-left">
                  <Download className="w-5 h-5 text-purple-400" />
                  <span className="font-medium">Download QR Codes</span>
                </button>
                <button  className="opacity-40 disabled:cursor-not-allowed w-full flex items-center space-x-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-left">
                  <BarChart3 className="w-5 h-5 text-cyan-400" />
                  <span className="font-medium">View Analytics</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Register Product Modal */}
        {showProductModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowProductModal(false)}>
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-3xl blur-2xl"></div>
            <div className="relative bg-[#0A0E27] border border-white/20 rounded-3xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Register New Product</h2>
                <button 
                  onClick={() => setShowProductModal(false)}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">Product ID</label>
                    <input
                      type="text"
                      placeholder="PROD-001"
                      value={productForm.productId}
                      onChange={(e) => setProductForm({...productForm, productId: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">Product Name</label>
                    <input
                      type="text"
                      placeholder="Premium Coffee"
                      value={productForm.name}
                      onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">Batch Number</label>
                    <input
                      type="text"
                      placeholder="BATCH-2025-001"
                      value={productForm.batchNumber}
                      onChange={(e) => setProductForm({...productForm, batchNumber: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">Manufacturing Date</label>
                    <input
                      type="date"
                      value={productForm.manufacturingDate}
                      onChange={(e) => setProductForm({...productForm, manufacturingDate: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2 text-gray-300">Expiry Date</label>
                    <input
                      type="date"
                      value={productForm.expiryDate}
                      onChange={(e) => setProductForm({...productForm, expiryDate: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    />
                  </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Quantity</label>
                  <input
                    type="number"
                    placeholder="100"
                    value={productForm.quantity || 1}
                    onChange={(e) => setProductForm({...productForm, quantity: parseInt(e.target.value) || 1})}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    min="1"
                    max="10000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Starting Serial Number</label>
                  <input
                    type="number"
                    placeholder="1"
                    value={productForm.startingSerialNumber || 1}
                    onChange={(e) => setProductForm({...productForm, startingSerialNumber: parseInt(e.target.value) || 1})}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    min="1"
                  />
                </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Registering...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      <span>Register Product</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0A0E27] border border-white/20 rounded-3xl p-6 max-w-md w-full text-center">
            <h3 className="text-xl font-bold mb-2">Product registered</h3>
            <p className="text-sm text-gray-300 mb-6">Your products were registered successfully and are now available in the dashboard.</p>
            <div className="flex justify-center">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-medium hover:shadow-lg"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}