import archiver from 'archiver';
import { PDFDocument } from 'pdf-lib';
import Jimp from 'jimp';
import { supabase } from '@/lib/supabase/supabase';

interface DesignItem {
  success: boolean;
  buffer?: Buffer;
  productId?: string;
  serialNumber?: string;
  qrHash?: string;
  error?: string;
}

interface ZipExportOptions {
  includeManifest?: boolean;
  filenameFormat?: string;
}

interface PdfExportOptions {
  layout?: 'fit' | 'actual';
  includeMetadata?: boolean;
  title?: string;
  author?: string;
}

interface ExportBothOptions {
  zip?: ZipExportOptions;
  pdf?: PdfExportOptions;
}

interface NUpOptions {
  columns?: number;
  rows?: number;
  spacing?: number;
}

interface UploadResult {
  success: boolean;
  zip?: { path: string; url: string };
  pdf?: { path: string; url: string };
  error?: string;
}

interface ManifestData {
  generated: string;
  totalDesigns: number;
  successfulDesigns: number;
  failedDesigns: number;
  designs: {
    productId?: string;
    serialNumber?: string;
    qrHash?: string;
    success: boolean;
    error?: string | null;
    filename: string;
  }[];
}

interface ExportStats {
  total: number;
  successful: number;
  failed: number;
  successRate: string | number;
  failedItems: { productId?: string; error?: string }[];
}

/**
 * Design Exporter Service
 * Exports designs as ZIP or PDF
 * Following SOLID principles: Single Responsibility
 */
export class DesignExporter {
  /**
   * Export designs as ZIP file
   * @param {DesignItem[]} designs - Array of {buffer, productId, serialNumber}
   * @param {ZipExportOptions} options - Export options
   * @returns {Promise<Buffer>} ZIP file buffer
   */
  static async exportAsZip(designs: DesignItem[], options: ZipExportOptions = {}): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
      });

      const chunks: Buffer[] = [];

      archive.on('data', (chunk: Buffer) => chunks.push(chunk));
      archive.on('end', () => resolve(Buffer.concat(chunks)));
      archive.on('error', (err: Error) => reject(err));

      // Add each design to ZIP
      designs.forEach((design) => {
        if (!design.success || !design.buffer) {
          console.warn(`Skipping failed design: ${design.productId}`);
          return;
        }

        const filename = this.generateFilename(design, options.filenameFormat);
        archive.append(design.buffer, { name: filename });
      });

      // Add manifest file if requested
      if (options.includeManifest) {
        const manifest = this.generateManifest(designs);
        archive.append(JSON.stringify(manifest, null, 2), { 
          name: 'manifest.json' 
        });
      }

      archive.finalize();
    });
  }

  /**
   * Export designs as multi-page PDF
   * @param {DesignItem[]} designs - Array of {buffer, productId, serialNumber}
   * @param {PdfExportOptions} options - Export options
   * @returns {Promise<Buffer>} PDF buffer
   */
  static async exportAsPdf(designs: DesignItem[], options: PdfExportOptions = {}): Promise<Buffer> {
    try {
      const pdfDoc = await PDFDocument.create();
      
      // Process each design
      for (const design of designs) {
        if (!design.success || !design.buffer) {
          console.warn(`Skipping failed design: ${design.productId}`);
          continue;
        }

        // Convert to PNG if needed and optimize
        const pngBuffer = await (await Jimp.read(design.buffer))
          .getBufferAsync(Jimp.MIME_PNG);

        // Embed image in PDF
        const image = await pdfDoc.embedPng(pngBuffer);
        const imageDims = image.scale(1);

        // Calculate page size based on layout option
        let pageWidth: number, pageHeight: number;
        
        if (options.layout === 'fit') {
          // Fit image to standard page sizes
          const maxWidth = 595; // A4 width in points
          const maxHeight = 842; // A4 height in points
          const scale = Math.min(maxWidth / imageDims.width, maxHeight / imageDims.height);
          pageWidth = imageDims.width * scale;
          pageHeight = imageDims.height * scale;
        } else {
          // Use actual image dimensions
          pageWidth = imageDims.width;
          pageHeight = imageDims.height;
        }

        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        page.drawImage(image, {
          x: 0,
          y: 0,
          width: pageWidth,
          height: pageHeight
        });

        // Add metadata text if requested
        if (options.includeMetadata) {
          const { rgb } = await import('pdf-lib');
          page.drawText(`Product: ${design.serialNumber || design.productId}`, {
            x: 10,
            y: 10,
            size: 8,
            color: rgb(0, 0, 0)
          });
        }
      }

      // Set PDF metadata
      pdfDoc.setTitle(options.title || 'Product Designs with QR Codes');
      pdfDoc.setAuthor(options.author || 'Kweli');
      pdfDoc.setCreationDate(new Date());

      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes);
    } catch (error: unknown) {
      console.error('PDF export error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create PDF: ${message}`);
    }
  }

  /**
   * Export both ZIP and PDF
   * @param {DesignItem[]} designs - Array of designs
   * @param {ExportBothOptions} options - Export options
   * @returns {Promise<{zip: Buffer, pdf: Buffer}>}
   */
  static async exportBoth(designs: DesignItem[], options: ExportBothOptions = {}): Promise<{ zip: Buffer; pdf: Buffer }> {
    const [zipBuffer, pdfBuffer] = await Promise.all([
      this.exportAsZip(designs, options.zip || {}),
      this.exportAsPdf(designs, options.pdf || {})
    ]);

    return { zip: zipBuffer, pdf: pdfBuffer };
  }

  /**
   * Upload exports to Supabase Storage
   * @param {Buffer | {zip?: Buffer; pdf?: Buffer}} exports - Buffer or {zip, pdf}
   * @param {string} companyId - Company ID
   * @param {string} batchId - Batch identifier
   * @param {string} format - 'zip', 'pdf', or 'both'
   * @returns {Promise<UploadResult>} Upload results with URLs
   */
  static async uploadToStorage(
    exports: Buffer | { zip?: Buffer; pdf?: Buffer },
    companyId: string,
    batchId: string,
    format: 'zip' | 'pdf' | 'both' = 'zip'
  ): Promise<UploadResult> {
    const results: UploadResult = { success: true };
    const timestamp = Date.now();
    const basePath = `designs/${companyId}/${batchId}`;

    try {
      if (format === 'zip' || format === 'both') {
        const zipBuffer = format === 'both' ? (exports as { zip: Buffer }).zip : (exports as Buffer);
        const zipPath = `${basePath}/designs-${timestamp}.zip`;
        
        const { error: zipError } = await supabase.storage
          .from('product-designs')
          .upload(zipPath, zipBuffer, {
            contentType: 'application/zip',
            cacheControl: '3600'
          });

        if (zipError) throw zipError;

        const { data: { publicUrl: zipUrl } } = supabase.storage
          .from('product-designs')
          .getPublicUrl(zipPath);

        results.zip = {
          path: zipPath,
          url: zipUrl
        };
      }

      if (format === 'pdf' || format === 'both') {
        const pdfBuffer = format === 'both' ? (exports as { pdf: Buffer }).pdf : (exports as Buffer);
        const pdfPath = `${basePath}/designs-${timestamp}.pdf`;
        
        const { error: pdfError } = await supabase.storage
          .from('product-designs')
          .upload(pdfPath, pdfBuffer, {
            contentType: 'application/pdf',
            cacheControl: '3600'
          });

        if (pdfError) throw pdfError;

        const { data: { publicUrl: pdfUrl } } = supabase.storage
          .from('product-designs')
          .getPublicUrl(pdfPath);

        results.pdf = {
          path: pdfPath,
          url: pdfUrl
        };
      }

      return results;
    } catch (error: unknown) {
      console.error('Storage upload error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: message
      };
    }
  }

  /**
   * Generate filename for design
   * @param {DesignItem} design - Design object
   * @param {string} format - Filename format template
   * @returns {string} Filename
   */
  static generateFilename(design: DesignItem, format: string = '{serialNumber}.png'): string {
    const replacements: Record<string, string | number> = {
      '{productId}': design.productId || 'unknown',
      '{serialNumber}': design.serialNumber || design.productId || 'unknown',
      '{qrHash}': design.qrHash ? design.qrHash.substring(0, 8) : '',
      '{timestamp}': Date.now()
    };

    let filename = format;
    Object.entries(replacements).forEach(([key, value]) => {
      filename = filename.replace(key, String(value));
    });

    // Ensure .png extension
    if (!filename.toLowerCase().endsWith('.png')) {
      filename += '.png';
    }

    // Sanitize filename
    filename = filename.replace(/[^a-z0-9._-]/gi, '_');

    return filename;
  }

  /**
   * Generate manifest file
   * @param {DesignItem[]} designs - Array of designs
   * @returns {ManifestData} Manifest data
   */
  static generateManifest(designs: DesignItem[]): ManifestData {
    return {
      generated: new Date().toISOString(),
      totalDesigns: designs.length,
      successfulDesigns: designs.filter(d => d.success).length,
      failedDesigns: designs.filter(d => !d.success).length,
      designs: designs.map(design => ({
        productId: design.productId,
        serialNumber: design.serialNumber,
        qrHash: design.qrHash,
        success: design.success,
        error: design.error || null,
        filename: this.generateFilename(design)
      }))
    };
  }

  /**
   * Create N-up layout PDF (multiple designs per page)
   * @param {DesignItem[]} designs - Array of designs
   * @param {NUpOptions} options - Layout options {columns, rows, spacing}
   * @returns {Promise<Buffer>} PDF buffer
   */
  static async exportAsNUpPdf(designs: DesignItem[], options: NUpOptions = {}): Promise<Buffer> {
    const { columns = 2, rows = 2, spacing = 10 } = options;
    const designsPerPage = columns * rows;

    try {
      const pdfDoc = await PDFDocument.create();
      const pageWidth = 595; // A4 width
      const pageHeight = 842; // A4 height

      const cellWidth = (pageWidth - spacing * (columns + 1)) / columns;
      const cellHeight = (pageHeight - spacing * (rows + 1)) / rows;

      // Process designs in pages
      for (let i = 0; i < designs.length; i += designsPerPage) {
        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        const pageDesigns = designs.slice(i, i + designsPerPage);

        for (let j = 0; j < pageDesigns.length; j++) {
          const design = pageDesigns[j];
          if (!design.success || !design.buffer) continue;

          const col = j % columns;
          const row = Math.floor(j / columns);

          const x = spacing + col * (cellWidth + spacing);
          const y = pageHeight - spacing - (row + 1) * (cellHeight + spacing);

          // Resize image to fit cell
          const resizedImage = await Jimp.read(design.buffer);
          resizedImage.scaleToFit(Math.floor(cellWidth), Math.floor(cellHeight));

          const resizedBuffer = await resizedImage.getBufferAsync(Jimp.MIME_PNG);

          const image = await pdfDoc.embedPng(resizedBuffer);
          const dims = image.scale(1);

          // Center in cell
          const xOffset = (cellWidth - dims.width) / 2;
          const yOffset = (cellHeight - dims.height) / 2;

          page.drawImage(image, {
            x: x + xOffset,
            y: y + yOffset,
            width: dims.width,
            height: dims.height
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes);
    } catch (error: unknown) {
      console.error('N-up PDF export error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create N-up PDF: ${message}`);
    }
  }

  /**
   * Calculate export statistics
   * @param {DesignItem[]} designs - Array of designs
   * @returns {ExportStats} Statistics
   */
  static getExportStats(designs: DesignItem[]): ExportStats {
    const successful = designs.filter(d => d.success);
    const failed = designs.filter(d => !d.success);

    return {
      total: designs.length,
      successful: successful.length,
      failed: failed.length,
      successRate: designs.length > 0 ? (successful.length / designs.length * 100).toFixed(2) : 0,
      failedItems: failed.map(d => ({
        productId: d.productId,
        error: d.error
      }))
    };
  }
}

export default DesignExporter;
