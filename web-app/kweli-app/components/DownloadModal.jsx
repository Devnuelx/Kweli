"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Download, Loader2, FileArchive, FileText, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * Download Modal Component
 * Allows users to choose download format for selected products
 */
export default function DownloadModal({ 
  isOpen, 
  onClose, 
  productIds = [], 
  onDownloadComplete 
}) {
  const [format, setFormat] = useState('qr-only'); // 'qr-only' or 'embedded'
  const [outputType, setOutputType] = useState('zip'); // 'zip' or 'pdf'
  const [includeMetadata, setIncludeMetadata] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasTemplate, setHasTemplate] = useState(false);
  const [checkingTemplate, setCheckingTemplate] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (isOpen) {
      checkForActiveTemplate();
    }
  }, [isOpen]);

  const checkForActiveTemplate = async () => {
    setCheckingTemplate(true);
    try {
      const response = await fetch('/api/design-templates');
      if (response.ok) {
        const data = await response.json();
        const activeTemplate = data.templates?.find(t => t.is_active);
        setHasTemplate(!!activeTemplate);
      }
    } catch (error) {
      console.error('Error checking template:', error);
    } finally {
      setCheckingTemplate(false);
    }
  };

  const handleDownload = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/products/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds,
          format,
          outputType: format === 'embedded' ? outputType : 'zip',
          includeMetadata
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(data);
        
        // Trigger download
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = `products_${format}_${Date.now()}.${outputType}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (onDownloadComplete) {
          onDownloadComplete(data);
        }

        // Close modal after a delay
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(data.error || 'Download failed');
      }
    } catch (error) {
      setError('An error occurred: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Download Products</h2>
              <p className="text-sm text-muted-foreground">
                {productIds.length} product{productIds.length !== 1 ? 's' : ''} selected
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Format Selection */}
          <div className="space-y-6">
            <div>
              <label className="font-semibold mb-3 block">Download Format</label>
              <div className="grid gap-3">
                {/* QR Codes Only */}
                <label className={`
                  flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all
                  ${format === 'qr-only' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                `}>
                  <input
                    type="radio"
                    name="format"
                    value="qr-only"
                    checked={format === 'qr-only'}
                    onChange={(e) => setFormat(e.target.value)}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileArchive className="w-5 h-5" />
                      <span className="font-medium">QR Codes Only</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Download individual QR code images (600x600px PNG)
                    </p>
                  </div>
                </label>

                {/* Embedded on Banner */}
                <label className={`
                  flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all
                  ${format === 'embedded' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                  ${!hasTemplate && !checkingTemplate ? 'opacity-50 cursor-not-allowed' : ''}
                `}>
                  <input
                    type="radio"
                    name="format"
                    value="embedded"
                    checked={format === 'embedded'}
                    onChange={(e) => setFormat(e.target.value)}
                    disabled={!hasTemplate && !checkingTemplate}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-5 h-5" />
                      <span className="font-medium">Embedded on Banner</span>
                      {!hasTemplate && !checkingTemplate && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                          No Template
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {hasTemplate 
                        ? 'QR codes embedded on your active banner template'
                        : 'Set up a banner template first in Templates page'
                      }
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Output Type (for embedded only) */}
            {format === 'embedded' && (
              <div>
                <label className="font-semibold mb-3 block">Output Type</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="outputType"
                      value="zip"
                      checked={outputType === 'zip'}
                      onChange={(e) => setOutputType(e.target.value)}
                    />
                    <span>ZIP (Individual PNGs)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="outputType"
                      value="pdf"
                      checked={outputType === 'pdf'}
                      onChange={(e) => setOutputType(e.target.value)}
                    />
                    <span>PDF (Multi-page)</span>
                  </label>
                </div>
              </div>
            )}

            {/* Options */}
            {format === 'embedded' && (
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeMetadata}
                    onChange={(e) => setIncludeMetadata(e.target.checked)}
                  />
                  <span className="text-sm">Include product metadata on designs</span>
                </label>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900">{error}</p>
                  {error.includes('template') && (
                    <p className="text-sm text-red-700 mt-1">
                      Go to Templates page to upload and configure a banner.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Success Display */}
            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">Download ready!</p>
                  <p className="text-sm text-green-700">
                    {success.count} products processed. Your download will start automatically.
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDownload}
                className="flex-1"
                disabled={loading || (format === 'embedded' && !hasTemplate)}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

