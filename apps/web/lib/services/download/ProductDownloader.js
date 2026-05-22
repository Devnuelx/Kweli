import { supabase } from '@/lib/supabase/supabase';
import { QrEmbedder } from '@/lib/services/qr/QrEmbedder';
import { DesignExporter } from '@/lib/services/export/DesignExporter';
import { generateQRCodeBuffer } from '@/lib/hedera/qrGenerator';

/**
 * Product Downloader Service
 * Handles flexible downloads of QR codes (standalone or embedded in designs)
 * Following SOLID principles: Single Responsibility
 */
export class ProductDownloader {
  /**
   * Download QR codes only as ZIP
   * @param {Array} productIds - Array of product IDs
   * @param {string} companyId - Company ID
   * @returns {Promise<Object>} Download result with URL
   */
  static async downloadQrCodesOnly(productIds, companyId) {
    try {
      // Fetch units from database
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

      // Generate high-res QR codes as buffers
      const qrDesigns = await Promise.all(
        units.map(async (unit) => {
          try {
            const qrBuffer = await generateQRCodeBuffer(
              unit.qr_url,
              null,
              { width: 600 }
            );

            return {
              success: true,
              buffer: qrBuffer,
              productId: unit.products.name,
              serialNumber: unit.serial_code,
              qrHash: 'N/A'
            };
          } catch (error) {
            console.error(`Failed to generate QR for ${unit.serial_code}:`, error);
            return {
              success: false,
              error: error.message,
              productId: unit.products.name
            };
          }
        })
      );

      // Export as ZIP
      const zipBuffer = await DesignExporter.exportAsZip(qrDesigns, {
        includeManifest: true,
        filenameFormat: '{serialNumber}_QR.png'
      });

      // Upload to storage
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
        downloadUrl: uploadResult.zip.url,
        stats: DesignExporter.getExportStats(qrDesigns)
      };
    } catch (error) {
      console.error('QR codes download error:', error);
      throw new Error(`Failed to download QR codes: ${error.message}`);
    }
  }

  /**
   * Download products with QR codes embedded on banner template
   * @param {Array} productIds - Array of product IDs
   * @param {string} companyId - Company ID
   * @param {string} outputType - 'zip' or 'pdf'
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Download result with URL
   */
  static async downloadEmbedded(productIds, companyId, outputType = 'zip', options = {}) {
    try {
      // Get active template
      const template = await this.getActiveTemplate(companyId);
      
      if (!template) {
        throw new Error('No active template found. Please set up a banner template first.');
      }

      // Fetch units
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

      // Get template design file
      const templateBuffer = await this.fetchTemplateFile(template.template_url);

      // Generate high-res QR codes as buffers
      const productsWithQr = await Promise.all(
        units.map(async (unit) => ({
          ...unit,
          qrCodeBuffer: await generateQRCodeBuffer(
            unit.qr_url,
            null,
            { width: 600 }
          )
        }))
      );

      // Embed QR codes on template
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

      // Add metadata overlay if requested
      if (options.includeMetadata) {
        for (let i = 0; i < designs.length; i++) {
          if (designs[i].success) {
            designs[i].buffer = await QrEmbedder.addMetadataOverlay(
              designs[i].buffer,
              {
                productId: designs[i].productId,
                serialNumber: designs[i].serialNumber,
                batchNumber: productsWithQr[i].products.batch_number
              }
            );
          }
        }
      }

      // Export based on format
      let exportBuffer;
      let exportFormat;

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

      // Upload to storage
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
        downloadUrl: uploadResult[exportFormat].url,
        stats: DesignExporter.getExportStats(designs)
      };
    } catch (error) {
      console.error('Embedded download error:', error);
      throw new Error(`Failed to download embedded designs: ${error.message}`);
    }
  }

  /**
   * Get active template for company
   * @param {string} companyId - Company ID
   * @returns {Promise<Object>} Active template
   */
  static async getActiveTemplate(companyId) {
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

      return template || null;
    } catch (error) {
      console.error('Error fetching active template:', error);
      return null;
    }
  }

  /**
   * Fetch template file from Supabase Storage
   * @param {string} templateUrl - Template URL
   * @returns {Promise<Buffer>} Template file buffer
   */
  static async fetchTemplateFile(templateUrl) {
    try {
      if (!templateUrl) {
        throw new Error('Template URL is required');
      }

      // If it's a Supabase storage URL, fetch it
      if (templateUrl.includes('supabase')) {
        const response = await fetch(templateUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch template file');
        }
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }

      // Otherwise assume it's already a buffer or local file
      throw new Error('Invalid template URL format');
    } catch (error) {
      console.error('Error fetching template file:', error);
      throw error;
    }
  }

  /**
   * Download products with both formats (QR only + Embedded)
   * @param {Array} productIds - Array of product IDs
   * @param {string} companyId - Company ID
   * @returns {Promise<Object>} Download results for both formats
   */
  static async downloadBoth(productIds, companyId) {
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
   * @param {string} companyId - Company ID
   * @returns {Promise<boolean>} Has active template
   */
  static async hasActiveTemplate(companyId) {
    const template = await this.getActiveTemplate(companyId);
    return template !== null;
  }
}

export default ProductDownloader;

