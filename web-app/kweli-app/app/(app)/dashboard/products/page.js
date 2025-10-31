"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import DownloadModal from "@/components/DownloadModal";
import {
  Package, 
  QrCode, 
  Download, 
  Eye, 
  Search,
  Calendar,
  Hash,
  CheckCircle,
  AlertTriangle,
  X,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Upload
} from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products/list');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProducts(data.products || []);
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group products by name and batch
  const groupedProducts = products.reduce((acc, product) => {
    const key = `${product.name}-${product.batch_number}`;
    if (!acc[key]) {
      acc[key] = {
        name: product.name,
        batchNumber: product.batch_number,
        manufacturingDate: product.manufacturing_date,
        expiryDate: product.expiry_date,
        units: []
      };
    }
    acc[key].units.push(product);
    return acc;
  }, {});

  const toggleGroup = (key) => {
    setExpandedGroups(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const downloadQR = (product) => {
    const link = document.createElement('a');
    link.href = product.qr_code_image;
    link.download = `${product.product_id}-QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadGroupQRs = (units) => {
    units.forEach((product, index) => {
      setTimeout(() => {
        downloadQR(product);
      }, index * 500);
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isExpired = (expiryDate) => {
    return new Date(expiryDate) < new Date();
  };

  const toggleSelectAll = () => {
    if (selectedProductIds.length === products.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(products.map(p => p.id));
    }
  };

  const toggleSelectProduct = (productId) => {
    setSelectedProductIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleSelectGroup = (units) => {
    const groupIds = units.map(u => u.id);
    const allSelected = groupIds.every(id => selectedProductIds.includes(id));
    
    if (allSelected) {
      setSelectedProductIds(prev => prev.filter(id => !groupIds.includes(id)));
    } else {
      setSelectedProductIds(prev => [...new Set([...prev, ...groupIds])]);
    }
  };

  const handleDownloadComplete = () => {
    setSelectedProductIds([]);
    setShowDownloadModal(false);
  };

  const filteredGroups = Object.entries(groupedProducts).filter(([key, group]) => {
    const matchesSearch = group.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const isGroupExpired = isExpired(group.expiryDate);
    const matchesFilter = filterStatus === "all" || 
                         (filterStatus === "active" && !isGroupExpired) ||
                         (filterStatus === "expired" && isGroupExpired);
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-muted rounded w-48 animate-pulse"></div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="glass-effect">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">
            {Object.keys(groupedProducts).length} product groups • {products.length} total units
            {selectedProductIds.length > 0 && (
              <span className="ml-2 text-primary font-medium">
                • {selectedProductIds.length} selected
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {selectedProductIds.length > 0 && (
            <Button
              onClick={() => setShowDownloadModal(true)}
              variant="default"
              className="flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Selected ({selectedProductIds.length})
            </Button>
          )}
          <Button 
            onClick={() => window.location.href = '/dashboard/products/import'}
            className="flex items-center"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import Products
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="glass-effect">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-3 flex-1">
              <input
                type="checkbox"
                checked={selectedProductIds.length === products.length && products.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 cursor-pointer"
                title="Select all products"
              />
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                onClick={() => setFilterStatus("all")}
              >
                All
              </Button>
              <Button
                variant={filterStatus === "active" ? "default" : "outline"}
                onClick={() => setFilterStatus("active")}
              >
                Active
              </Button>
              <Button
                variant={filterStatus === "expired" ? "default" : "outline"}
                onClick={() => setFilterStatus("expired")}
              >
                Expired
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Groups */}
      <div className="space-y-4">
        {filteredGroups.length > 0 ? (
          filteredGroups.map(([key, group]) => (
            <Card key={key} className="glass-effect">
              <CardContent className="p-6">
                {/* Group Header */}
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleGroup(key)}
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <input
                      type="checkbox"
                      checked={group.units.every(u => selectedProductIds.includes(u.id))}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleSelectGroup(group.units);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-lg">{group.name}</h3>
                        {isExpired(group.expiryDate) ? (
                          <Badge variant="destructive">Expired</Badge>
                        ) : (
                          <Badge variant="default">Active</Badge>
                        )}
                        <Badge variant="outline">{group.units.length} units</Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>Batch: {group.batchNumber}</span>
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          Expires: {formatDate(group.expiryDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadGroupQRs(group.units);
                      }}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download All ({group.units.length})
                    </Button>
                    {expandedGroups[key] ? (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Expanded Units */}
                {expandedGroups[key] && (
                  <div className="mt-6 pt-6 border-t border-border/50">
                    <div className="grid gap-3">
                      {group.units.map((unit) => (
                        <div 
                          key={unit.id}
                          className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={selectedProductIds.includes(unit.id)}
                              onChange={() => toggleSelectProduct(unit.id)}
                              className="w-4 h-4 cursor-pointer"
                            />
                            <QrCode className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">{unit.serial_number || unit.product_id}</p>
                              <p className="text-xs text-muted-foreground">
                                Hash: {unit.qr_hash.substring(0, 16)}...
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedProduct(unit)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => downloadQR(unit)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="glass-effect">
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterStatus !== "all" 
                  ? "Try adjusting your search or filter criteria"
                  : "Get started by registering your first product"
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* QR Code Modal */}
      {selectedProduct && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedProduct(null)}
        >
          <div 
            className="relative max-w-3xl w-full bg-card rounded-2xl border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Unit Details</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedProduct(null)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* QR Code */}
                <div className="bg-white rounded-xl p-6 flex items-center justify-center">
                  <img 
                    src={selectedProduct.qr_code_image} 
                    alt={`QR Code for ${selectedProduct.name}`}
                    className="w-full max-w-[300px] h-auto"
                  />
                </div>

                {/* Details */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">{selectedProduct.name}</h3>
                    {isExpired(selectedProduct.expiry_date) ? (
                      <Badge variant="destructive">Expired</Badge>
                    ) : (
                      <Badge variant="default">Active</Badge>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Product ID</p>
                      <p className="font-medium text-sm">{selectedProduct.product_id}</p>
                    </div>
                    
                    {selectedProduct.serial_number && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Serial Number</p>
                        <p className="font-medium">{selectedProduct.serial_number}</p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Batch Number</p>
                      <p className="font-medium">{selectedProduct.batch_number}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">QR Hash</p>
                      <p className="font-mono text-xs break-all">{selectedProduct.qr_hash}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Manufacturing Date</p>
                      <p className="font-medium">{formatDate(selectedProduct.manufacturing_date)}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Expiry Date</p>
                      <p className="font-medium">{formatDate(selectedProduct.expiry_date)}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Hedera Transaction</p>
                      <a 
                        href={`https://hashscan.io/testnet/transaction/${selectedProduct.hedera_transaction_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm flex items-center"
                      >
                        View on Hashscan
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  </div>

                  <Button
                    onClick={() => downloadQR(selectedProduct)}
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download QR Code
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Download Modal */}
      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        productIds={selectedProductIds}
        onDownloadComplete={handleDownloadComplete}
      />
    </div>
  );
}