"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Package,
  QrCode,
  Download,
  Eye,
  Search,
  Calendar,
  ChevronRight,
  ChevronDown,
  Upload,
  Plus,
  Loader2,
  FileSpreadsheet,
  FileArchive,
  X,
  Printer,
  FileText,
  CheckCircle2,
  Info,
} from "lucide-react";
import QRCode from "qrcode";
import { api } from "@/lib/api-client";

interface BatchItem {
  id: string;
  batchNumber: string;
  batchSize: number;
  mfgDate?: string | null;
  expDate?: string | null;
  isRecalled: boolean;
  createdAt: string;
}

interface ProductItem {
  id: string;
  name: string;
  sku?: string | null;
  category?: string | null;
  description?: string | null;
  createdAt: string;
  brand?: {
    id: string;
    name: string;
  };
  batches: BatchItem[];
}

export default function ProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});
  const [exportingBatchId, setExportingBatchId] = useState<string | null>(null);

  // Single QR code preview modal
  const [previewQr, setPreviewQr] = useState<{
    serial: string;
    url: string;
    dataUrl: string;
    productName: string;
  } | null>(null);

  // PDF Label Sheet printing modal
  const [labelPrintModal, setLabelPrintModal] = useState<{
    batchId: string;
    batchNumber: string;
    productName: string;
    batchSize: number;
  } | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<'a4-2x5' | 'a4-3x8' | 'avery5160'>('a4-2x5');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.products.list(1, 50);
      setProducts(res.data || []);
      // Expand first product by default if exists
      if (res.data && res.data.length > 0) {
        setExpandedProducts({ [res.data[0].id]: true });
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (productId: string) => {
    setExpandedProducts((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  const handleExport = async (
    batchId: string,
    batchNumber: string,
    format: "csv" | "zip" | "pdf",
    template?: string
  ) => {
    try {
      setExportingBatchId(`${batchId}-${format}`);
      await api.products.downloadBatchExport(batchId, format, batchNumber, template);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setExportingBatchId(null);
    }
  };

  const handleDownloadPdfSheet = async () => {
    if (!labelPrintModal) return;
    try {
      setIsGeneratingPdf(true);
      await api.products.downloadBatchExport(
        labelPrintModal.batchId,
        'pdf',
        labelPrintModal.batchNumber,
        selectedTemplate
      );
      setLabelPrintModal(null);
    } catch (err: any) {
      alert(`PDF label sheet generation failed: ${err.message}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const openQrPreview = async (serial: string, productName: string) => {
    const url = `${window.location.origin}/v/${serial}`;
    try {
      const dataUrl = await QRCode.toDataURL(url, { width: 350, margin: 2 });
      setPreviewQr({ serial, url, dataUrl, productName });
    } catch (err) {
      console.error("Failed to generate QR preview", err);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isExpired = (expiryDate?: string | null) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const filteredProducts = products.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchesName = p.name.toLowerCase().includes(term);
    const matchesSku = p.sku ? p.sku.toLowerCase().includes(term) : false;
    const matchesBatch = p.batches.some((b) => b.batchNumber.toLowerCase().includes(term));
    return matchesName || matchesSku || matchesBatch;
  });

  const totalUnits = products.reduce(
    (sum, p) => sum + p.batches.reduce((bSum, b) => bSum + b.batchSize, 0),
    0
  );

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-white/10 rounded w-48 animate-pulse"></div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Product Batches & Serialization</h1>
          <p className="text-gray-400 mt-1">
            {products.length} registered product line(s) • {totalUnits.toLocaleString()} serialized units generated
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => router.push("/dashboard/products/import")}
            variant="outline"
            className="flex items-center border-white/20 bg-white/5 hover:bg-white/10 text-white"
          >
            <Upload className="w-4 h-4 mr-2" />
            Bulk CSV Import
          </Button>
          <Button
            onClick={() => router.push("/dashboard")}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Register Batch
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Search products by name, SKU, or batch number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-12 py-6 bg-white/5 border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-blue-500"
        />
      </div>

      {/* Product List */}
      <div className="space-y-4">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => {
            const isExpanded = expandedProducts[product.id];
            const productTotalUnits = product.batches.reduce((sum, b) => sum + b.batchSize, 0);

            return (
              <div
                key={product.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 transition-all hover:border-white/20"
              >
                {/* Product Header Row */}
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleExpand(product.id)}
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center justify-center shrink-0">
                      <Package className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h2 className="text-xl font-bold">{product.name}</h2>
                        {product.sku && (
                          <Badge variant="outline" className="border-white/20 text-gray-300">
                            SKU: {product.sku}
                          </Badge>
                        )}
                        {product.category && (
                          <Badge className="bg-purple-600/20 text-purple-300 border border-purple-500/30">
                            {product.category}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        {product.batches.length} Batch(es) • {productTotalUnits.toLocaleString()} Units Total
                        {product.description && ` • ${product.description}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Batches Sub-list */}
                {isExpanded && (
                  <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                      Packaging Batches
                    </h3>
                    {product.batches.length > 0 ? (
                      product.batches.map((batch) => {
                        const expired = isExpired(batch.expDate);
                        const isExportingZip = exportingBatchId === `${batch.id}-zip`;
                        const isExportingCsv = exportingBatchId === `${batch.id}-csv`;

                        return (
                          <div
                            key={batch.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all gap-4"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-base text-white">
                                  Batch #{batch.batchNumber}
                                </span>
                                {batch.isRecalled ? (
                                  <Badge className="bg-red-600 text-white">RECALLED</Badge>
                                ) : expired ? (
                                  <Badge className="bg-amber-600 text-white">Expired</Badge>
                                ) : (
                                  <Badge className="bg-green-600/30 text-green-400 border border-green-500/30">
                                    Active
                                  </Badge>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-x-4 text-xs text-gray-400">
                                <span>Units: {batch.batchSize.toLocaleString()}</span>
                                {batch.mfgDate && (
                                  <span className="flex items-center">
                                    <Calendar className="w-3.5 h-3.5 mr-1" />
                                    Mfg: {formatDate(batch.mfgDate)}
                                  </span>
                                )}
                                {batch.expDate && (
                                  <span className="flex items-center">
                                    <Calendar className="w-3.5 h-3.5 mr-1" />
                                    Exp: {formatDate(batch.expDate)}
                                  </span>
                                )}
                                <span>Created: {formatDate(batch.createdAt)}</span>
                              </div>
                            </div>

                            {/* Export Buttons */}
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isExportingCsv}
                                onClick={() => handleExport(batch.id, batch.batchNumber, "csv")}
                                className="border-white/20 bg-white/5 hover:bg-white/10 text-xs text-white"
                              >
                                {isExportingCsv ? (
                                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                                ) : (
                                  <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-green-400" />
                                )}
                                Export CSV
                              </Button>

                              <Button
                                size="sm"
                                disabled={isExportingZip}
                                onClick={() => handleExport(batch.id, batch.batchNumber, "zip")}
                                className="bg-blue-600 hover:bg-blue-700 text-xs text-white"
                              >
                                {isExportingZip ? (
                                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                                ) : (
                                  <FileArchive className="w-3.5 h-3.5 mr-1" />
                                )}
                                Download Print ZIP
                              </Button>

                              <Button
                                size="sm"
                                onClick={() =>
                                  setLabelPrintModal({
                                    batchId: batch.id,
                                    batchNumber: batch.batchNumber,
                                    productName: product.name,
                                    batchSize: batch.batchSize,
                                  })
                                }
                                className="bg-indigo-600 hover:bg-indigo-700 text-xs text-white"
                              >
                                <Printer className="w-3.5 h-3.5 mr-1" />
                                Print Labels
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-gray-500 py-3">No batches recorded for this product.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-gray-400 mb-6">
              {searchTerm
                ? "No matching products or batches. Try a different search term."
                : "Get started by registering your first product batch."}
            </p>
            <Button
              onClick={() => router.push("/dashboard")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Register First Batch
            </Button>
          </div>
        )}
      </div>

      {/* QR Code Preview Modal */}
      {previewQr && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewQr(null)}
        >
          <div
            className="bg-[#0A0E27] border border-white/20 rounded-3xl p-8 max-w-sm w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-white">QR Code Preview</h3>
              <button
                onClick={() => setPreviewQr(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-4">{previewQr.productName}</p>
            <div className="bg-white p-4 rounded-2xl inline-block mb-4 shadow-xl">
              <img
                src={previewQr.dataUrl}
                alt={previewQr.serial}
                className="w-48 h-48 mx-auto"
              />
            </div>
            <p className="text-xs font-mono text-gray-300 break-all mb-4">
              Serial: {previewQr.serial}
            </p>
            <a
              href={previewQr.dataUrl}
              download={`${previewQr.serial}-QR.png`}
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Image
            </a>
          </div>
        </div>
      )}

      {/* Industrial PDF Label Sheet Printing Modal */}
      {labelPrintModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => !isGeneratingPdf && setLabelPrintModal(null)}
        >
          <div
            className="bg-[#0A0E27] border border-white/20 rounded-3xl p-6 sm:p-8 max-w-xl w-full text-left shadow-2xl space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                    <Printer className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-xl text-white">
                    Print Ready-to-Stick Labels
                  </h3>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {labelPrintModal.productName} • Batch #{labelPrintModal.batchNumber} •{" "}
                  {labelPrintModal.batchSize.toLocaleString()} Total Units
                </p>
              </div>
              <button
                onClick={() => !isGeneratingPdf && setLabelPrintModal(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Selector Cards */}
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                Choose Industrial Label Template
              </label>

              {/* Option 1: A4 2x5 */}
              <div
                onClick={() => setSelectedTemplate("a4-2x5")}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-4 ${
                  selectedTemplate === "a4-2x5"
                    ? "bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500"
                    : "bg-white/5 border-white/10 hover:border-white/20"
                }`}
              >
                <div className="mt-0.5">
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      selectedTemplate === "a4-2x5"
                        ? "border-indigo-400 bg-indigo-600 text-white"
                        : "border-gray-500 bg-transparent"
                    }`}
                  >
                    {selectedTemplate === "a4-2x5" && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-sm">
                      A4 (2 × 5 Grid) — Avery L7173
                    </span>
                    <Badge className="bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs">
                      10 per sheet
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Large format (99.1 × 57 mm). Includes high-contrast QR, scratch PIN boundary foil box, batch metadata, and Kweli tamper seal.
                  </p>
                  <p className="text-[11px] text-indigo-400 mt-2 font-mono">
                    Requires {Math.ceil(labelPrintModal.batchSize / 10)} sheet(s) for this batch
                  </p>
                </div>
              </div>

              {/* Option 2: A4 3x8 */}
              <div
                onClick={() => setSelectedTemplate("a4-3x8")}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-4 ${
                  selectedTemplate === "a4-3x8"
                    ? "bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500"
                    : "bg-white/5 border-white/10 hover:border-white/20"
                }`}
              >
                <div className="mt-0.5">
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      selectedTemplate === "a4-3x8"
                        ? "border-indigo-400 bg-indigo-600 text-white"
                        : "border-gray-500 bg-transparent"
                    }`}
                  >
                    {selectedTemplate === "a4-3x8" && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-sm">
                      A4 (3 × 8 Grid) — Avery L7159
                    </span>
                    <Badge className="bg-white/10 text-gray-300 border border-white/15 text-xs">
                      24 per sheet
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Compact format (63.5 × 33.9 mm). Designed for bottles, vials, ampoules, and retail packages.
                  </p>
                  <p className="text-[11px] text-indigo-400 mt-2 font-mono">
                    Requires {Math.ceil(labelPrintModal.batchSize / 24)} sheet(s) for this batch
                  </p>
                </div>
              </div>

              {/* Option 3: Avery 5160 */}
              <div
                onClick={() => setSelectedTemplate("avery5160")}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-4 ${
                  selectedTemplate === "avery5160"
                    ? "bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500"
                    : "bg-white/5 border-white/10 hover:border-white/20"
                }`}
              >
                <div className="mt-0.5">
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      selectedTemplate === "avery5160"
                        ? "border-indigo-400 bg-indigo-600 text-white"
                        : "border-gray-500 bg-transparent"
                    }`}
                  >
                    {selectedTemplate === "avery5160" && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-sm">
                      US Letter (3 × 10 Grid) — Avery 5160 / 5260
                    </span>
                    <Badge className="bg-white/10 text-gray-300 border border-white/15 text-xs">
                      30 per sheet
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Standard US Letter format (2.625 × 1.0 in). Popular standard industrial sticker sheets.
                  </p>
                  <p className="text-[11px] text-indigo-400 mt-2 font-mono">
                    Requires {Math.ceil(labelPrintModal.batchSize / 30)} sheet(s) for this batch
                  </p>
                </div>
              </div>
            </div>

            {/* Print Instructions Callout */}
            <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/20 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-200/90 leading-relaxed">
                <span className="font-semibold text-blue-300">Printer Calibration Tip:</span>{" "}
                When sending the downloaded PDF to your printer, ensure page scaling is set to{" "}
                <strong className="text-white">Actual Size (100%)</strong> rather than &quot;Fit to Printable Area&quot; so labels align precisely with pre-diecut sticker sheets.
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
              <Button
                variant="outline"
                disabled={isGeneratingPdf}
                onClick={() => setLabelPrintModal(null)}
                className="border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs"
              >
                Cancel
              </Button>
              <Button
                disabled={isGeneratingPdf}
                onClick={handleDownloadPdfSheet}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs flex items-center"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Vector PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download Ready-to-Print PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
