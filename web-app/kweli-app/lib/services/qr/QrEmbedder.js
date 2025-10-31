import sharp from 'sharp';
import QRCode from 'qrcode';

/**
 * QR Embedder Service
 * Embeds QR codes onto design images
 * Following SOLID principles: Single Responsibility
 */
export class QrEmbedder {
  /**
   * Embed single QR code on design
   * @param {Buffer} designBuffer - Design image buffer
   * @param {string} qrDataUrl - QR code data URL or buffer
   * @param {Object} placement - {x, y, width, height}
   * @param {Object} options - Additional options
   * @returns {Promise<Buffer>} Image with embedded QR
   */
  static async embedQrOnDesign(designBuffer, qrDataUrl, placement, options = {}) {
    try {
      // Convert QR data URL to buffer if needed
      let qrBuffer;
      if (typeof qrDataUrl === 'string' && qrDataUrl.startsWith('data:')) {
        const base64Data = qrDataUrl.split(',')[1];
        qrBuffer = Buffer.from(base64Data, 'base64');
      } else if (Buffer.isBuffer(qrDataUrl)) {
        qrBuffer = qrDataUrl;
      } else {
        throw new Error('Invalid QR code format');
      }

      // Resize QR code to fit placement
      const resizedQr = await sharp(qrBuffer)
        .resize(placement.width, placement.height, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toBuffer();

      // Get design image info
      const designImage = sharp(designBuffer);
      const metadata = await designImage.metadata();

      // Composite QR onto design
      const result = await designImage
        .composite([{
          input: resizedQr,
          top: Math.round(placement.y),
          left: Math.round(placement.x),
          blend: options.blend || 'over'
        }])
        .toBuffer();

      return result;
    } catch (error) {
      console.error('QR embedding error:', error);
      throw new Error(`Failed to embed QR code: ${error.message}`);
    }
  }

  /**
   * Generate batch of designs with unique QR codes
   * @param {Buffer} designBuffer - Base design image
   * @param {Array} products - Array of product data with QR codes
   * @param {Object} placement - QR placement coordinates
   * @param {Object} options - Additional options
   * @returns {Promise<Array>} Array of {buffer, productId, serialNumber}
   */
  static async generateBatchDesigns(designBuffer, products, placement, options = {}) {
    const results = [];
    const batchSize = options.batchSize || 10;

    // Process in batches to avoid memory issues
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(async (product) => {
          try {
            const embedded = await this.embedQrOnDesign(
              designBuffer,
              product.qrCodeImage,
              placement,
              options
            );

            return {
              success: true,
              buffer: embedded,
              productId: product.productId,
              serialNumber: product.serialNumber,
              qrHash: product.qrHash
            };
          } catch (error) {
            console.error(`Failed to embed QR for ${product.productId}:`, error);
            return {
              success: false,
              error: error.message,
              productId: product.productId,
              serialNumber: product.serialNumber
            };
          }
        })
      );

      results.push(...batchResults);

      // Progress callback
      if (options.onProgress) {
        options.onProgress(Math.min(i + batchSize, products.length), products.length);
      }
    }

    return results;
  }

  /**
   * Generate high-resolution QR code as buffer
   * @param {string} hash - QR hash
   * @param {string} productId - Product ID
   * @param {Object} options - QR options
   * @returns {Promise<Buffer>} QR code buffer
   */
  static async generateQrBuffer(hash, productId, options = {}) {
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify?hash=${hash}&pid=${productId}`;
    
    const qrBuffer = await QRCode.toBuffer(verificationUrl, {
      errorCorrectionLevel: options.errorCorrection || 'H',
      type: 'png',
      width: options.width || 600,
      margin: options.margin || 2,
      color: {
        dark: options.darkColor || '#000000',
        light: options.lightColor || '#FFFFFF'
      }
    });

    return qrBuffer;
  }

  /**
   * Add text/metadata overlay to design
   * @param {Buffer} imageBuffer - Image buffer
   * @param {Object} metadata - {productId, batchNumber, etc}
   * @param {Object} options - Overlay options
   * @returns {Promise<Buffer>} Image with overlay
   */
  static async addMetadataOverlay(imageBuffer, metadata, options = {}) {
    try {
      const image = sharp(imageBuffer);
      const { width, height } = await image.metadata();

      // Create SVG overlay with product info
      const fontSize = options.fontSize || 16;
      const padding = options.padding || 10;
      const textColor = options.textColor || '#000000';
      const bgColor = options.backgroundColor || 'rgba(255,255,255,0.8)';

      const svgText = `
        <svg width="${width}" height="${height}">
          <rect x="${padding}" y="${height - 60}" 
                width="${width - padding * 2}" height="50" 
                fill="${bgColor}" rx="5"/>
          <text x="${padding + 10}" y="${height - 35}" 
                font-family="Arial" font-size="${fontSize}" fill="${textColor}">
            ${metadata.serialNumber || metadata.productId}
          </text>
          <text x="${padding + 10}" y="${height - 15}" 
                font-family="Arial" font-size="${fontSize - 2}" fill="${textColor}">
            Batch: ${metadata.batchNumber}
          </text>
        </svg>
      `;

      const result = await image
        .composite([{
          input: Buffer.from(svgText),
          top: 0,
          left: 0
        }])
        .toBuffer();

      return result;
    } catch (error) {
      console.error('Overlay error:', error);
      // Return original if overlay fails
      return imageBuffer;
    }
  }

  /**
   * Optimize image for output
   * @param {Buffer} imageBuffer - Image buffer
   * @param {string} format - Output format (png, jpeg, webp)
   * @param {Object} options - Optimization options
   * @returns {Promise<Buffer>} Optimized image
   */
  static async optimizeImage(imageBuffer, format = 'png', options = {}) {
    const image = sharp(imageBuffer);

    // Set DPI for print quality
    if (options.dpi) {
      image.withMetadata({
        density: options.dpi
      });
    }

    switch (format.toLowerCase()) {
      case 'jpeg':
      case 'jpg':
        return image
          .jpeg({
            quality: options.quality || 90,
            progressive: true
          })
          .toBuffer();

      case 'webp':
        return image
          .webp({
            quality: options.quality || 90
          })
          .toBuffer();

      case 'png':
      default:
        return image
          .png({
            compressionLevel: options.compressionLevel || 6,
            progressive: true
          })
          .toBuffer();
    }
  }

  /**
   * Validate design file
   * @param {Buffer} buffer - Image buffer
   * @returns {Promise<Object>} Validation result
   */
  static async validateDesign(buffer) {
    try {
      const metadata = await sharp(buffer).metadata();

      const errors = [];
      const warnings = [];

      // Check format
      const validFormats = ['jpeg', 'png', 'webp', 'tiff', 'svg'];
      if (!validFormats.includes(metadata.format)) {
        errors.push(`Unsupported format: ${metadata.format}`);
      }

      // Check dimensions
      const minWidth = 300;
      const minHeight = 300;
      const maxWidth = 10000;
      const maxHeight = 10000;

      if (metadata.width < minWidth || metadata.height < minHeight) {
        errors.push(`Image too small. Minimum ${minWidth}x${minHeight}px`);
      }

      if (metadata.width > maxWidth || metadata.height > maxHeight) {
        errors.push(`Image too large. Maximum ${maxWidth}x${maxHeight}px`);
      }

      // Check for optimal print size
      if (metadata.width < 1200 || metadata.height < 1200) {
        warnings.push('Image resolution may be too low for high-quality printing');
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        metadata: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          space: metadata.space,
          channels: metadata.channels,
          hasAlpha: metadata.hasAlpha
        }
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Invalid image file: ${error.message}`],
        warnings: []
      };
    }
  }
}

export default QrEmbedder;

