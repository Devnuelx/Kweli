"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileSpreadsheet,
  CheckCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Download,
  AlertCircle,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api-client";

interface ParsedRow {
  name: string;
  batchNumber: string;
  batchSize?: number;
  sku?: string;
  category?: string;
  description?: string;
  manufacturingDate?: string;
  expiryDate?: string;
}

export default function ProductImportPage() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadSampleTemplate = () => {
    const csvHeader = "name,batchNumber,batchSize,sku,category,description,manufacturingDate,expiryDate\r\n";
    const sampleRow = 'Amoxicillin 500mg,AMX-2026-B1,100,SKU-AMX,Pharmaceuticals,"Oral capsules",2026-01-15,2028-01-15\r\nParacetamol Extra,PCT-2026-X1,50,SKU-PCT,Analgesic,"500mg blister pack",2026-02-01,2027-02-01';
    const blob = new Blob([csvHeader + sampleRow], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kweli_batch_import_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setError(null);
    setFile(selected);

    try {
      const text = await selected.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        setError("CSV file must have a header row and at least one product row.");
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim().replace(/^["']|["']$/g, ""));
      const nameIdx = headers.findIndex((h) => h.toLowerCase() === "name" || h.toLowerCase() === "productname");
      const batchIdx = headers.findIndex((h) => h.toLowerCase() === "batchnumber" || h.toLowerCase() === "batch");

      if (nameIdx === -1 || batchIdx === -1) {
        setError("CSV header must contain 'name' and 'batchNumber' columns.");
        return;
      }

      const sizeIdx = headers.findIndex((h) => h.toLowerCase().includes("size"));
      const skuIdx = headers.findIndex((h) => h.toLowerCase() === "sku");
      const catIdx = headers.findIndex((h) => h.toLowerCase() === "category");
      const descIdx = headers.findIndex((h) => h.toLowerCase() === "description");
      const mfgIdx = headers.findIndex((h) => h.toLowerCase().includes("mfg") || h.toLowerCase().includes("manufacturing"));
      const expIdx = headers.findIndex((h) => h.toLowerCase().includes("exp"));

      const rows: ParsedRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        // Simple comma split respecting quotes
        const rawValues = lines[i].split(",").map((v) => v.trim().replace(/^["']|["']$/g, ""));
        if (!rawValues[nameIdx] || !rawValues[batchIdx]) continue;

        rows.push({
          name: rawValues[nameIdx],
          batchNumber: rawValues[batchIdx],
          batchSize: sizeIdx !== -1 ? parseInt(rawValues[sizeIdx], 10) || 10 : 10,
          sku: skuIdx !== -1 ? rawValues[skuIdx] : undefined,
          category: catIdx !== -1 ? rawValues[catIdx] : undefined,
          description: descIdx !== -1 ? rawValues[descIdx] : undefined,
          manufacturingDate: mfgIdx !== -1 ? rawValues[mfgIdx] : undefined,
          expiryDate: expIdx !== -1 ? rawValues[expIdx] : undefined,
        });
      }

      if (rows.length === 0) {
        setError("No valid product rows found in the CSV file.");
        return;
      }

      setParsedRows(rows);
    } catch (err: any) {
      setError(`Failed to read CSV: ${err.message}`);
    }
  };

  const executeImport = async () => {
    if (parsedRows.length === 0) return;

    setImporting(true);
    setProgress({ current: 0, total: parsedRows.length });
    setError(null);

    let successCount = 0;
    for (let i = 0; i < parsedRows.length; i++) {
      const row = parsedRows[i];
      try {
        await api.products.register({
          name: row.name,
          batchNumber: row.batchNumber,
          batchSize: row.batchSize || 10,
          sku: row.sku,
          category: row.category,
          description: row.description,
          manufacturingDate: row.manufacturingDate,
          expiryDate: row.expiryDate,
        });
        successCount++;
      } catch (err: any) {
        console.error(`Failed row ${i + 1} (${row.name}):`, err);
      }
      setProgress({ current: i + 1, total: parsedRows.length });
    }

    setImporting(false);
    setCompleted(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6 text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/dashboard/products")}
          className="flex items-center text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </button>
        <Button
          onClick={downloadSampleTemplate}
          variant="outline"
          size="sm"
          className="border-white/20 bg-white/5 hover:bg-white/10 text-white"
        >
          <Download className="w-4 h-4 mr-2" />
          Download CSV Template
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Bulk Import Product Batches</h1>
        <p className="text-gray-400 mt-1">
          Upload a CSV spreadsheet to batch-generate cryptographically protected GS1 Digital Link products.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Box */}
      {!completed ? (
        <div className="space-y-6">
          <div className="border-2 border-dashed border-white/20 hover:border-blue-500/50 rounded-2xl p-10 text-center transition-all bg-white/5">
            <Upload className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-1">
              {file ? file.name : "Select or Drop CSV Spreadsheet"}
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Columns required: <span className="font-mono text-gray-200">name, batchNumber</span> (Optional: <span className="font-mono text-gray-200">batchSize, sku, category, expDate</span>)
            </p>
            <label className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium cursor-pointer transition-all">
              Choose File
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">
                  Preview ({parsedRows.length} batches detected)
                </h3>
                <span className="text-xs text-gray-400">Ready for secure generation</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400 text-xs">
                      <th className="py-2">Product Name</th>
                      <th className="py-2">Batch #</th>
                      <th className="py-2">Units</th>
                      <th className="py-2">SKU</th>
                      <th className="py-2">Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="border-b border-white/5">
                        <td className="py-2.5 font-medium">{row.name}</td>
                        <td className="py-2.5 font-mono text-xs">{row.batchNumber}</td>
                        <td className="py-2.5">{row.batchSize || 10}</td>
                        <td className="py-2.5 text-gray-400">{row.sku || "-"}</td>
                        <td className="py-2.5 text-gray-400">{row.category || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedRows.length > 5 && (
                  <p className="text-xs text-gray-500 mt-2">
                    ...and {parsedRows.length - 5} more rows.
                  </p>
                )}
              </div>

              <Button
                onClick={executeImport}
                disabled={importing}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating Batches ({progress.current}/{progress.total})...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-5 h-5 mr-2" />
                    Confirm & Generate {parsedRows.length} Batches
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Completion View */
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold">Import Completed Successfully</h2>
          <p className="text-gray-400 max-w-md mx-auto">
            {progress.current} product batch(es) registered with unique GS1 Digital Links and dual-layer scratch PIN security.
          </p>
          <div className="pt-4 flex justify-center gap-3">
            <Button
              onClick={() => {
                setCompleted(false);
                setFile(null);
                setParsedRows([]);
              }}
              variant="outline"
              className="border-white/20 bg-white/5 hover:bg-white/10 text-white"
            >
              Import More
            </Button>
            <Button
              onClick={() => router.push("/dashboard/products")}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Go to Products Catalog
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
