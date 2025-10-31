"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CsvUploader from '@/components/CsvUploader';
import {
  FileSpreadsheet,
  CheckCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Download,
  FileText,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function ProductImportPage() {
  const [step, setStep] = useState(1);
  const [csvFile, setCsvFile] = useState(null);
  const [csvValid, setCsvValid] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [hasTemplate, setHasTemplate] = useState(false);

  const totalSteps = 3;

  const handleCsvSelect = (file) => {
    setCsvFile(file);
  };

  const handleCsvValidation = (validation) => {
    setCsvValid(validation.valid);
  };

  const handleImport = async () => {
    if (!csvFile) return;

    setImporting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('csv', csvFile);

      const response = await fetch('/api/products/csv-import', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult(data);
        
        // Check if company has active template
        const templateResponse = await fetch('/api/design-templates');
        if (templateResponse.ok) {
          const templateData = await templateResponse.json();
          const activeTemplate = templateData.templates?.find(t => t.is_active);
          setHasTemplate(!!activeTemplate);
        }
        
        setStep(3);
      } else {
        setError(data.error || 'Import failed');
      }
    } catch (error) {
      setError('An error occurred: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadQrOnly = async () => {
    if (!result?.productIds) return;

    setImporting(true);
    try {
      const response = await fetch('/api/products/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: result.productIds,
          format: 'qr-only'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Trigger download
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = `qr-codes-${Date.now()}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        setError(data.error || 'Download failed');
      }
    } catch (error) {
      setError('Download error: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadEmbedded = async () => {
    if (!result?.productIds) return;

    setImporting(true);
    try {
      const response = await fetch('/api/products/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: result.productIds,
          format: 'embedded',
          outputType: 'zip'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Trigger download
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = `designs-${Date.now()}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        setError(data.error || 'Download failed');
      }
    } catch (error) {
      setError('Download error: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Import Products</h1>
        <p className="text-muted-foreground">
          Bulk import products from CSV file
        </p>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold
                  ${step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                `}>
                  {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                </div>
                {s < totalSteps && (
                  <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-sm">
            <span className={step >= 1 ? 'text-foreground font-medium' : 'text-muted-foreground'}>Upload CSV</span>
            <span className={step >= 2 ? 'text-foreground font-medium' : 'text-muted-foreground'}>Import Products</span>
            <span className={step >= 3 ? 'text-foreground font-medium' : 'text-muted-foreground'}>Download</span>
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Upload CSV */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileSpreadsheet className="w-5 h-5 mr-2" />
              Step 1: Upload CSV File
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CsvUploader
              onFileSelect={handleCsvSelect}
              onValidationComplete={handleCsvValidation}
            />
          </CardContent>
        </Card>
      )}

      {/* Step 2: Confirm & Import */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Confirm & Import</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Ready to Import</h3>
                <Badge variant="default">{csvFile?.name}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Click &apos;Import Products&apos; to register products, generate QR codes, and submit to Hedera blockchain.
              </p>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="p-3 bg-background rounded border">
                  <p className="text-muted-foreground mb-1">Action</p>
                  <p className="font-medium">Register Products</p>
                </div>
                <div className="p-3 bg-background rounded border">
                  <p className="text-muted-foreground mb-1">Generate</p>
                  <p className="font-medium">Unique QR Codes</p>
                </div>
                <div className="p-3 bg-background rounded border">
                  <p className="text-muted-foreground mb-1">Blockchain</p>
                  <p className="font-medium">Hedera Submit</p>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-900 font-medium">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                disabled={importing}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={importing}
                className="flex-1"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    Import Products
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Post-Import Options */}
      {step === 3 && result && (
        <div className="space-y-6">
          {/* Success Message */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-green-900 mb-2">
                    Import Successful!
                  </h3>
                  <p className="text-green-800">
                    Successfully imported <strong>{result.count} products</strong> with unique QR codes.
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    Batch ID: {result.batchId}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Download Options */}
          <Card>
            <CardHeader>
              <CardTitle>What would you like to do next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Option A: Download QR Codes Only */}
              <div className="border-2 border-border rounded-lg p-4 hover:border-primary transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Download className="w-5 h-5" />
                      <h4 className="font-semibold">Download QR Codes Only</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Get individual QR code images (600x600px PNG) in a ZIP file
                    </p>
                    <Button
                      onClick={handleDownloadQrOnly}
                      disabled={importing}
                      variant="outline"
                    >
                      {importing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Download QR Codes (ZIP)
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Option B: Download with Banner */}
              <div className={`border-2 rounded-lg p-4 transition-colors ${
                hasTemplate ? 'border-border hover:border-primary' : 'border-dashed border-muted bg-muted/20'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5" />
                      <h4 className="font-semibold">Download with Banner Design</h4>
                      {!hasTemplate && (
                        <Badge variant="outline" className="text-xs">Setup Required</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {hasTemplate 
                        ? 'QR codes embedded on your active banner template'
                        : 'Upload and configure a banner template first'
                      }
                    </p>
                    {hasTemplate ? (
                      <Button
                        onClick={handleDownloadEmbedded}
                        disabled={importing}
                        variant="outline"
                      >
                        {importing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            Download Designs (ZIP)
                          </>
                        )}
                      </Button>
                    ) : (
                      <Link href="/dashboard/templates">
                        <Button variant="outline">
                          <FileText className="w-4 h-4 mr-2" />
                          Setup Banner Template
                          <ExternalLink className="w-3 h-3 ml-2" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Option C: View Products */}
              <div className="border-2 border-dashed border-muted rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      You can also download anytime from the Products page
                    </p>
                  </div>
                  <Link href="/dashboard/products">
                    <Button variant="ghost">
                      View Products
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Import Another Batch */}
          <div className="flex justify-center">
            <Button
              onClick={() => {
                setStep(1);
                setCsvFile(null);
                setResult(null);
                setError(null);
              }}
              variant="outline"
            >
              Import Another Batch
            </Button>
          </div>
        </div>
      )}

      {/* Navigation (Steps 1-2) */}
      {step < 3 && step > 1 && (
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={importing}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
        </div>
      )}

      {step === 1 && (
        <div className="flex justify-end">
          <Button
            onClick={() => setStep(2)}
            disabled={!csvValid || !csvFile}
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
