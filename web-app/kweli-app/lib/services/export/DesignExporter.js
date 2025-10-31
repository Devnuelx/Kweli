import archiver from 'archiver';
import { PDFDocument } from 'pdf-lib';
import Jimp from 'jimp';
import { supabase } from '@/lib/supabase/supabase';
import { Readable } from 'stream';

/**
 * Design Exporter Service
 * Exports designs as ZIP or PDF
 * Following SOLID principles: Single Responsibility
 */
export class DesignExporter {
  /**
   * Export designs as ZIP file
   * @param {Array} designs - Array of {buffer, productId, serialNumber}
   * @param {Object} options - Export options
   * @returns {Promise<Buffer>} ZIP file buffer
   */
  static async exportAsZip(designs, options = {}) {
    return new Promise((resolve, reject) => {
      const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
      });

      const chunks = [];

      archive.on('data', (chunk) => chunks.push(chunk));
      archive.on('end', () => resolve(Buffer.concat(chunks)));
      archive.on('error', (err) => reject(err));

      // Add each design to ZIP
      designs.forEach((design, index) => {
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
   * @param {Array} designs - Array of {buffer, productId, serialNumber}
   * @param {Object} options - Export options
   * @returns {Promise<Buffer>} PDF buffer
   */
  static async exportAsPdf(designs, options = {}) {
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
        let pageWidth, pageHeight;
        
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
    } catch (error) {
      console.error('PDF export error:', error);
      throw new Error(`Failed to create PDF: ${error.message}`);
    }
  }

  /**
   * Export both ZIP and PDF
   * @param {Array} designs - Array of designs
   * @param {Object} options - Export options
   * @returns {Promise<Object>} {zip: Buffer, pdf: Buffer}
   */
  static async exportBoth(designs, options = {}) {
    const [zipBuffer, pdfBuffer] = await Promise.all([
      this.exportAsZip(designs, options.zip || {}),
      this.exportAsPdf(designs, options.pdf || {})
    ]);

    return { zip: zipBuffer, pdf: pdfBuffer };
  }

  /**
   * Upload exports to Supabase Storage
   * @param {Buffer|Object} exports - Buffer or {zip, pdf}
   * @param {string} companyId - Company ID
   * @param {string} batchId - Batch identifier
   * @param {string} format - 'zip', 'pdf', or 'both'
   * @returns {Promise<Object>} Upload results with URLs
   */
  static async uploadToStorage(exports, companyId, batchId, format = 'zip') {
    const results = {};
    const timestamp = Date.now();
    const basePath = `designs/${companyId}/${batchId}`;

    try {
      if (format === 'zip' || format === 'both') {
        const zipBuffer = format === 'both' ? exports.zip : exports;
        const zipPath = `${basePath}/designs-${timestamp}.zip`;
        
        const { data: zipData, error: zipError } = await supabase.storage
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
        const pdfBuffer = format === 'both' ? exports.pdf : exports;
        const pdfPath = `${basePath}/designs-${timestamp}.pdf`;
        
        const { data: pdfData, error: pdfError } = await supabase.storage
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

      return {
        success: true,
        ...results
      };
    } catch (error) {
      console.error('Storage upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate filename for design
   * @param {Object} design - Design object
   * @param {string} format - Filename format template
   * @returns {string} Filename
   */
  static generateFilename(design, format = '{serialNumber}.png') {
    const replacements = {
      '{productId}': design.productId || 'unknown',
      '{serialNumber}': design.serialNumber || design.productId || 'unknown',
      '{qrHash}': design.qrHash ? design.qrHash.substring(0, 8) : '',
      '{timestamp}': Date.now()
    };

    let filename = format;
    Object.entries(replacements).forEach(([key, value]) => {
      filename = filename.replace(key, value);
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
   * @param {Array} designs - Array of designs
   * @returns {Object} Manifest data
   */
  static generateManifest(designs) {
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
   * @param {Array} designs - Array of designs
   * @param {Object} options - Layout options {columns, rows, spacing}
   * @returns {Promise<Buffer>} PDF buffer
   */
  static async exportAsNUpPdf(designs, options = {}) {
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
    } catch (error) {
      console.error('N-up PDF export error:', error);
      throw new Error(`Failed to create N-up PDF: ${error.message}`);
    }
  }

  /**
   * Calculate export statistics
   * @param {Array} designs - Array of designs
   * @returns {Object} Statistics
   */
  static getExportStats(designs) {
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

