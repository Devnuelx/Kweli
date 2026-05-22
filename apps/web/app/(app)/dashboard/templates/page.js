"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import QrPlacementCanvas from '@/components/QrPlacementCanvas';
import {
  Upload,
  FileText,
  Trash2,
  Check,
  Loader2,
  X,
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadStep, setUploadStep] = useState(1); // 1: upload, 2: configure
  const [templateFile, setTemplateFile] = useState(null);
  const [templatePreview, setTemplatePreview] = useState(null);
  const [templateName, setTemplateName] = useState('');
  const [qrPlacement, setQrPlacement] = useState(null);
  const [imageDimensions, setImageDimensions] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, []);


  const handlePlacementChange = useCallback((placement) => {
    setQrPlacement(placement);
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/design-templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setTemplateFile(file);
    setTemplateName(file.name.replace(/\.[^/.]+$/, '')); // Remove extension

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });
        setTemplatePreview(e.target.result);
        setUploadStep(2);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveTemplate = async () => {
    if (!templateFile || !qrPlacement || !templateName) {
      setError('Please complete all fields');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Step 1: Upload file
      const uploadFormData = new FormData();
      uploadFormData.append('design', templateFile);

      const uploadResponse = await fetch('/api/design-templates/upload', {
        method: 'POST',
        body: uploadFormData
      });

      // Some server errors or runtime failures can return an empty body which
      // makes response.json() throw "Unexpected end of JSON input". Parse
      // safely: read text first and attempt JSON.parse only if non-empty.
      const uploadText = await uploadResponse.text();
      let uploadData = null;
      if (uploadText) {
        try {
          uploadData = JSON.parse(uploadText);
        } catch (err) {
          // Not JSON — treat as error
          throw new Error(`Upload failed (invalid server response)`);
        }
      }

      if (!uploadResponse.ok) {
        throw new Error((uploadData && uploadData.error) || `Upload failed (status ${uploadResponse.status})`);
      }

      if (!uploadData || !uploadData.success) {
        throw new Error((uploadData && uploadData.error) || 'Upload failed');
      }

      // Step 2: Create template
      const createResponse = await fetch('/api/design-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName,
          templateUrl: uploadData.templateUrl,
          qrPlacement: qrPlacement
        })
      });

      const createData = await createResponse.json();

      if (!createResponse.ok || !createData.success) {
        throw new Error(createData.error || 'Failed to create template');
      }

      // Success!
      await fetchTemplates();
      handleCloseModal();
    } catch (error) {
      setError(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSetActive = async (templateId) => {
    try {
      const response = await fetch('/api/design-templates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: templateId })
      });

      if (response.ok) {
        await fetchTemplates();
      }
    } catch (error) {
      console.error('Error setting active template:', error);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`/api/design-templates?id=${templateId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchTemplates();
      }
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const handleCloseModal = () => {
    setShowUploadModal(false);
    setUploadStep(1);
    setTemplateFile(null);
    setTemplatePreview(null);
    setTemplateName('');
    setQrPlacement(null);
    setImageDimensions(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Banner Templates</h1>
          <p className="text-muted-foreground">
            Manage your product design templates with QR code placements
          </p>
        </div>
        <Button onClick={() => setShowUploadModal(true)}>
          <Upload className="w-4 h-4 mr-2" />
          Upload New Template
        </Button>
      </div>

      {/* Templates Grid */}
      {templates.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className={template.is_active ? 'border-primary border-2' : ''}>
              <CardContent className="p-6">
                {/* Template Preview */}
                <div className="aspect-square bg-muted rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                  {template.template_url ? (
                    <img
                      src={template.template_url}
                      alt={template.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>

                {/* Template Info */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{template.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {new Date(template.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {template.is_active && (
                      <Badge variant="default" className="flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Active
                      </Badge>
                    )}
                  </div>

                  {/* QR Placement Info */}
                  {template.qr_placement && (
                    <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                      QR: {template.qr_placement.width}×{template.qr_placement.height}px at ({template.qr_placement.x}, {template.qr_placement.y})
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {!template.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetActive(template.id)}
                        className="flex-1"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Set Active
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Templates Yet</h3>
            <p className="text-muted-foreground mb-4">
              Upload your first banner template to start embedding QR codes on your designs
            </p>
            <Button onClick={() => setShowUploadModal(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Template
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Upload New Template</h2>
                  <p className="text-sm text-muted-foreground">
                    Step {uploadStep} of 2
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCloseModal}
                  disabled={uploading}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Step 1: Upload File */}
              {uploadStep === 1 && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <label htmlFor="template-upload" className="cursor-pointer">
                      <span className="text-sm text-muted-foreground">
                        Click to upload banner design (PNG, JPEG, PDF, SVG)
                      </span>
                      <Input
                        id="template-upload"
                        type="file"
                        accept="image/*,.pdf,.svg"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Step 2: Configure Placement */}
              {uploadStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Template Name
                    </label>
                    <Input
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="e.g., Product Sticker - Summer 2025"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      QR Code Placement
                    </label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Drag and resize the green box to position where the QR code should appear
                    </p>
                    {templatePreview && (
                      <QrPlacementCanvas
                        imageUrl={templatePreview}
                        initialPlacement={qrPlacement}
                        onPlacementChange={handlePlacementChange}
                        imageDimensions={imageDimensions}
                      />
                    )}
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-red-900">{error}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setUploadStep(1)}
                      disabled={uploading}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleSaveTemplate}
                      disabled={uploading || !qrPlacement || !templateName}
                      className="flex-1"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Save Template
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

