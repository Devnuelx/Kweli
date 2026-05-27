import { supabase } from '@/lib/supabase/supabase';
import { QrEmbedder } from '@/lib/services/qr/QrEmbedder';
import { DesignExporter } from '@/lib/services/export/DesignExporter';
import { generateQRCodeBuffer } from '@/lib/hedera/qrGenerator';

interface DownloadOptions {
  onProgress?: (current: number, total: number) => void;
  includeMetadata?: boolean;
  pdfLayout?: 'fit' | 'actual';
}

interface DownloadResult {
  success: boolean;
  format: string;
  outputType: string;
  count: number;
  templateName?: string;
  downloadUrl: string;
  stats: ReturnType<typeof DesignExporter.getExportStats>;
}

interface DownloadBothResult {
  success: boolean;
  qrOnly: DownloadResult;
  embedded: DownloadResult;
}

interface ProductUnit {
  id: string;
  serial_code: string;
  qr_url: string;
  products: {
    product_id: string;
    batch_number: string;
    name: string;
    company_id: string;
  };
}

interface DesignTemplate {
  id: string;
  name: string;
  template_url: string;
  qr_placement: { x: number; y: number; width: number; height: number };
  is_active: boolean;
  company_id: string;
  [key: string]: unknown;
}

/**
 * Product Downloader Service
 * Handles flexible downloads of QR codes (standalone or embedded in designs)
 * Following SOLID principles: Single Responsibility
 */
export class ProductDownloader {
  /**
   * Download QR codes only as ZIP
   */
  static async downloadQrCodesOnly(productIds: string[], companyId: string): Promise<DownloadResult> {
    try {
      const { data: units, error } = await supabase
        .from('product_units')
        .select(`
          id, 
          serial_code, 
          qr_url, 
          products!inner(
            product_id, 
            batch_number, 
            name, 
            company_id
          )
        `)
        .in('id', productIds)
        .eq('products.company_id', companyId);

      if (error) throw error;

      if (!units || units.length === 0) {
        throw new Error('No products found');
      }

      const qrDesigns = await Promise.all(
        (units as unknown as ProductUnit[]).map(async (unit) => {
          try {
            const qrBuffer = await generateQRCodeBuffer(
              unit.qr_url,
              undefined,
              { width: 600 }
            );

            return {
              success: true,
              buffer: qrBuffer,
              productId: unit.products.name,
              serialNumber: unit.serial_code,
              qrHash: 'N/A'
            };
          } catch (error: unknown) {
            console.error(`Failed to generate QR for ${unit.serial_code}:`, error);
            const message = error instanceof Error ? error.message : 'Unknown error';
            return {
              success: false,
              error: message,
              productId: unit.products.name
            };
          }
        })
      );

      const zipBuffer = await DesignExporter.exportAsZip(qrDesigns, {
        includeManifest: true,
        filenameFormat: '{serialNumber}_QR.png'
      });

      const batchId = `download_${Date.now()}`;
      const uploadResult = await DesignExporter.uploadToStorage(
        zipBuffer,
        companyId,
        batchId,
        'zip'
      );

      return {
        success: true,
        format: 'qr-only',
        outputType: 'zip',
        count: units.length,
        downloadUrl: uploadResult.zip!.url,
        stats: DesignExporter.getExportStats(qrDesigns)
      };
    } catch (error: unknown) {
      console.error('QR codes download error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to download QR codes: ${message}`);
    }
  }

  /**
   * Download products with QR codes embedded on banner template
   */
  static async downloadEmbedded(productIds: string[], companyId: string, outputType: 'zip' | 'pdf' = 'zip', options: DownloadOptions = {}): Promise<DownloadResult> {
    try {
      const template = await this.getActiveTemplate(companyId);
      
      if (!template) {
        throw new Error('No active template found. Please set up a banner template first.');
      }

      const { data: units, error } = await supabase
        .from('product_units')
        .select(`
          id, 
          serial_code, 
          qr_url, 
          products!inner(
            product_id, 
            batch_number, 
            name, 
            company_id
          )
        `)
        .in('id', productIds)
        .eq('products.company_id', companyId);

      if (error) throw error;

      if (!units || units.length === 0) {
        throw new Error('No products found');
      }

      const templateBuffer = await this.fetchTemplateFile(template.template_url);

      const productsWithQr = await Promise.all(
        (units as unknown as ProductUnit[]).map(async (unit) => ({
          ...unit,
          qrCodeBuffer: await generateQRCodeBuffer(
            unit.qr_url,
            undefined,
            { width: 600 }
          )
        }))
      );

      const designs = await QrEmbedder.generateBatchDesigns(
        templateBuffer,
        productsWithQr.map(p => ({
          productId: p.products.name,
          serialNumber: p.serial_code,
          qrCodeImage: p.qrCodeBuffer,
          qrHash: 'N/A',
          batchNumber: p.products.batch_number
        })),
        template.qr_placement,
        {
          onProgress: options.onProgress
        }
      );

      if (options.includeMetadata) {
        for (let i = 0; i < designs.length; i++) {
          if (designs[i].success && designs[i].buffer) {
            designs[i].buffer = await QrEmbedder.addMetadataOverlay(
              designs[i].buffer!,
              {
                productId: designs[i].productId,
                serialNumber: designs[i].serialNumber,
                batchNumber: productsWithQr[i].products.batch_number
              }
            );
          }
        }
      }

      let exportBuffer: Buffer;
      let exportFormat: 'zip' | 'pdf';

      if (outputType === 'pdf') {
        exportBuffer = await DesignExporter.exportAsPdf(designs, {
          layout: options.pdfLayout || 'fit',
          includeMetadata: options.includeMetadata
        });
        exportFormat = 'pdf';
      } else {
        exportBuffer = await DesignExporter.exportAsZip(designs, {
          includeManifest: true,
          filenameFormat: '{serialNumber}.png'
        });
        exportFormat = 'zip';
      }

      const batchId = `download_${Date.now()}`;
      const uploadResult = await DesignExporter.uploadToStorage(
        exportBuffer,
        companyId,
        batchId,
        exportFormat
      );

      return {
        success: true,
        format: 'embedded',
        outputType: exportFormat,
        count: units.length,
        templateName: template.name,
        downloadUrl: uploadResult[exportFormat]!.url,
        stats: DesignExporter.getExportStats(designs)
      };
    } catch (error: unknown) {
      console.error('Embedded download error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to download embedded designs: ${message}`);
    }
  }

  /**
   * Get active template for company
   */
  static async getActiveTemplate(companyId: string): Promise<DesignTemplate | null> {
    try {
      const { data: template, error } = await supabase
        .from('design_templates')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        throw error;
      }

      return (template as DesignTemplate) || null;
    } catch (error) {
      console.error('Error fetching active template:', error);
      return null;
    }
  }

  /**
   * Fetch template file from Supabase Storage
   */
  static async fetchTemplateFile(templateUrl: string): Promise<Buffer> {
    try {
      if (!templateUrl) {
        throw new Error('Template URL is required');
      }

      if (templateUrl.includes('supabase')) {
        const response = await fetch(templateUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch template file');
        }
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }

      throw new Error('Invalid template URL format');
    } catch (error) {
      console.error('Error fetching template file:', error);
      throw error;
    }
  }

  /**
   * Download products with both formats (QR only + Embedded)
   */
  static async downloadBoth(productIds: string[], companyId: string): Promise<DownloadBothResult> {
    try {
      const [qrOnlyResult, embeddedResult] = await Promise.all([
        this.downloadQrCodesOnly(productIds, companyId),
        this.downloadEmbedded(productIds, companyId, 'zip')
      ]);

      return {
        success: true,
        qrOnly: qrOnlyResult,
        embedded: embeddedResult
      };
    } catch (error) {
      console.error('Download both error:', error);
      throw error;
    }
  }

  /**
   * Check if company has active template
   */
  static async hasActiveTemplate(companyId: string): Promise<boolean> {
    const template = await this.getActiveTemplate(companyId);
    return template !== null;
  }
}

export default ProductDownloader;
