"use client";

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, X } from 'lucide-react';

/**
 * CSV Uploader Component
 * Handles CSV file upload with validation and preview
 */
export default function CsvUploader({ onFileSelect, onValidationComplete }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [validation, setValidation] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setError(null);
    setFile(selectedFile);

    // Validate file type
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    // Read and preview file
    try {
      const text = await selectedFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        setError('CSV file must have at least a header row and one data row');
        return;
      }

      // Preview first 10 rows
      setPreview(lines.slice(0, 10));

      // Validate headers
      const headers = lines[0].split(',').map(h => h.trim());
      const requiredHeaders = ['productId', 'name', 'batchNumber', 'manufacturingDate', 'expiryDate'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

      if (missingHeaders.length > 0) {
        setError(`Missing required columns: ${missingHeaders.join(', ')}`);
        setValidation({ valid: false, errors: [`Missing columns: ${missingHeaders.join(', ')}`] });
        return;
      }

      setValidation({
        valid: true,
        rowCount: lines.length - 1,
        headers
      });

      if (onFileSelect) {
        onFileSelect(selectedFile);
      }

      if (onValidationComplete) {
        onValidationComplete({ valid: true });
      }
    } catch (err) {
      setError('Failed to read CSV file: ' + err.message);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview([]);
    setValidation(null);
    setError(null);
    if (onFileSelect) {
      onFileSelect(null);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center">
            <FileSpreadsheet className="w-5 h-5 mr-2" />
            CSV File Upload
          </h3>
          {file && (
            <Button variant="ghost" size="sm" onClick={clearFile}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {!file ? (
          <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <label htmlFor="csv-file-input" className="cursor-pointer">
              <p className="text-sm text-muted-foreground mb-2">
                Click to upload CSV file or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                Maximum file size: 10MB
              </p>
              <input
                id="csv-file-input"
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            {/* File info */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                <div>
                  <p className="font-medium text-sm">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              {validation?.valid && (
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Valid ({validation.rowCount} rows)
                </Badge>
              )}
            </div>

            {/* Preview */}
            {preview.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted px-3 py-2 border-b">
                  <p className="text-sm font-medium">Preview (first 10 rows)</p>
                </div>
                <div className="p-3 overflow-x-auto">
                  <pre className="text-xs font-mono">
                    {preview.join('\n')}
                  </pre>
                </div>
              </div>
            )}

            {/* Validation info */}
            {validation?.valid && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900 text-sm">CSV is valid</p>
                    <p className="text-xs text-green-700 mt-1">
                      Found {validation.rowCount} product rows with all required fields
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-900 text-sm">Validation Error</p>
                <p className="text-xs text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Format guide */}
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="font-semibold text-sm mb-2">Required CSV Format:</p>
          <div className="text-xs space-y-1 text-muted-foreground">
            <p><strong>Required columns:</strong></p>
            <ul className="list-disc list-inside ml-2">
              <li>productId - Unique product identifier</li>
              <li>name - Product name</li>
              <li>batchNumber - Batch number</li>
              <li>manufacturingDate - Format: YYYY-MM-DD</li>
              <li>expiryDate - Format: YYYY-MM-DD</li>
            </ul>
            <p className="mt-2"><strong>Optional columns:</strong></p>
            <ul className="list-disc list-inside ml-2">
              <li>quantity - Number of units (default: 1)</li>
              <li>startingSerialNumber - Starting serial (default: 1)</li>
              <li>qr_x, qr_y, qr_width, qr_height - QR placement coordinates</li>
            </ul>
          </div>
        </div>

        {/* Download template */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const template = 'productId,name,batchNumber,manufacturingDate,expiryDate,quantity\nSKU001,Product A,BATCH001,2025-01-01,2026-01-01,100\n';
            const blob = new Blob([template], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'product-import-template.csv';
            a.click();
          }}
        >
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Download CSV Template
        </Button>
      </div>
    </Card>
  );
}

