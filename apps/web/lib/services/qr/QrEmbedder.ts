import Jimp from 'jimp';
import QRCode from 'qrcode';

interface Placement {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface EmbedOptions {
  batchSize?: number;
  onProgress?: (current: number, total: number) => void;
}

interface QrBufferOptions {
  errorCorrection?: string;
  width?: number;
  margin?: number;
  darkColor?: string;
  lightColor?: string;
}

interface MetadataOverlayOptions {
  padding?: number;
  fontSize?: number;
  backgroundColor?: string;
  textColor?: string;
}

interface MetadataInfo {
  productId?: string;
  serialNumber?: string;
  batchNumber?: string;
}

interface ProductInput {
  productId: string;
  serialNumber: string;
  qrCodeImage: string | Buffer;
  qrHash: string;
  batchNumber?: string;
}

interface DesignResult {
  success: boolean;
  buffer?: Buffer;
  productId: string;
  serialNumber: string;
  qrHash?: string;
  error?: string;
}

interface OptimizeOptions {
  quality?: number;
  compressionLevel?: number;
}

interface DesignValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: {
    width: number;
    height: number;
    format: string;
    space: string;
    channels: number;
    hasAlpha: boolean;
  };
}

const WHITE_RGBA = Jimp.rgbaToInt(255, 255, 255, 255);
const DEFAULT_OVERLAY_RGBA = Jimp.rgbaToInt(255, 255, 255, 204);
const FONT_SIZES = [8, 10, 12, 14, 16, 32, 64, 128] as const;
const FONT_PATHS: Record<string, Record<number, string>> = {
  black: {
    8: Jimp.FONT_SANS_8_BLACK,
    10: Jimp.FONT_SANS_10_BLACK,
    12: Jimp.FONT_SANS_12_BLACK,
    14: Jimp.FONT_SANS_14_BLACK,
    16: Jimp.FONT_SANS_16_BLACK,
    32: Jimp.FONT_SANS_32_BLACK,
    64: Jimp.FONT_SANS_64_BLACK,
    128: Jimp.FONT_SANS_128_BLACK
  },
  white: {
    8: (Jimp as any).FONT_SANS_8_WHITE,
    10: (Jimp as any).FONT_SANS_10_WHITE,
    12: (Jimp as any).FONT_SANS_12_WHITE,
    14: (Jimp as any).FONT_SANS_14_WHITE,
    16: (Jimp as any).FONT_SANS_16_WHITE,
    32: (Jimp as any).FONT_SANS_32_WHITE,
    64: (Jimp as any).FONT_SANS_64_WHITE,
    128: (Jimp as any).FONT_SANS_128_WHITE
  }
};

/**
 * QR Embedder Service
 * Embeds QR codes onto design images
 * FIXED: Now properly handles decimal placement values and validates all inputs
 */
export class QrEmbedder {
  /**
   * Embed single QR code on design
   */
  static async embedQrOnDesign(designBuffer: Buffer, qrDataUrl: string | Buffer, placement: Placement, options: EmbedOptions = {}): Promise<Buffer> {
    try {
      // CRITICAL FIX: Ensure all placement values are positive integers
      const safePlacement = {
        x: Math.max(0, Math.round(Number(placement.x))),
        y: Math.max(0, Math.round(Number(placement.y))),
        width: Math.max(1, Math.round(Number(placement.width))),
        height: Math.max(1, Math.round(Number(placement.height)))
      };

      if (!Number.isFinite(safePlacement.x) || !Number.isFinite(safePlacement.y) ||
          !Number.isFinite(safePlacement.width) || !Number.isFinite(safePlacement.height)) {
        throw new Error(
          `Invalid placement coordinates: x=${placement.x}, y=${placement.y}, ` +
          `width=${placement.width}, height=${placement.height}. Must be finite numbers.`
        );
      }

      let qrBuffer: Buffer;
      if (typeof qrDataUrl === 'string' && qrDataUrl.startsWith('data:')) {
        const base64Data = qrDataUrl.split(',')[1];
        qrBuffer = Buffer.from(base64Data, 'base64');
      } else if (Buffer.isBuffer(qrDataUrl)) {
        qrBuffer = qrDataUrl;
      } else {
        throw new Error('Invalid QR code format. Must be data URL or Buffer.');
      }

      const designImage = await Jimp.read(designBuffer);
      const originalMime = designImage.getMIME() || Jimp.MIME_PNG;
      const metadata = {
        width: designImage.bitmap.width,
        height: designImage.bitmap.height
      };

      if (safePlacement.x + safePlacement.width > metadata.width ||
          safePlacement.y + safePlacement.height > metadata.height) {
        console.warn(
          `QR placement exceeds image bounds. ` +
          `Placement: ${safePlacement.x + safePlacement.width}x${safePlacement.y + safePlacement.height}, ` +
          `Image: ${metadata.width}x${metadata.height}`
        );
        safePlacement.width = Math.min(safePlacement.width, metadata.width - safePlacement.x);
        safePlacement.height = Math.min(safePlacement.height, metadata.height - safePlacement.y);
      }

      if (safePlacement.width <= 0 || safePlacement.height <= 0) {
        throw new Error('QR placement is outside image bounds.');
      }

      const qrImage = await Jimp.read(qrBuffer);
      qrImage.background(WHITE_RGBA);
      qrImage.contain(
        Math.max(1, safePlacement.width),
        Math.max(1, safePlacement.height),
        Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE
      );

      designImage.composite(qrImage, safePlacement.x, safePlacement.y, {
        mode: Jimp.BLEND_SOURCE_OVER,
        opacitySource: 1,
        opacityDest: 1
      });

      return await designImage.getBufferAsync(originalMime);
    } catch (error: unknown) {
      console.error('QR embedding error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to embed QR code: ${message}`);
    }
  }

  /**
   * Generate batch of designs with unique QR codes
   */
  static async generateBatchDesigns(designBuffer: Buffer, products: ProductInput[], placement: Placement, options: EmbedOptions = {}): Promise<DesignResult[]> {
    const results: DesignResult[] = [];
    const batchSize = options.batchSize || 10;

    console.log('Batch generation starting with placement:', placement);

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(async (product): Promise<DesignResult> => {
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
          } catch (error: unknown) {
            console.error(`Failed to embed QR for ${product.productId}:`, error);
            const message = error instanceof Error ? error.message : 'Unknown error';
            return {
              success: false,
              error: message,
              productId: product.productId,
              serialNumber: product.serialNumber
            };
          }
        })
      );

      results.push(...batchResults);

      if (options.onProgress) {
        options.onProgress(Math.min(i + batchSize, products.length), products.length);
      }
    }

    return results;
  }

  /**
   * Generate high-resolution QR code as buffer
   */
  static async generateQrBuffer(hash: string, productId: string, options: QrBufferOptions = {}): Promise<Buffer> {
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify?hash=${hash}&pid=${productId}`;
    
    const qrBuffer = await QRCode.toBuffer(verificationUrl, {
      errorCorrectionLevel: (options.errorCorrection as QRCode.QRCodeErrorCorrectionLevel) || 'H',
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
   */
  static async addMetadataOverlay(imageBuffer: Buffer, metadata: MetadataInfo, options: MetadataOverlayOptions = {}): Promise<Buffer> {
    try {
      const image = await Jimp.read(imageBuffer);
      const width = image.bitmap.width;
      const height = image.bitmap.height;

      const padding = Number.isFinite(options.padding) ? options.padding! : 10;
      const fontSize = Number.isFinite(options.fontSize) ? options.fontSize! : 16;
      const secondaryFontSize = Math.max(10, fontSize - 2);
      const overlayHeight = Math.max(50, fontSize + secondaryFontSize + padding * 3);
      const overlayWidth = Math.max(10, width - padding * 2);
      const overlayY = Math.max(0, height - overlayHeight - padding);

      const backgroundColor = parseColor(
        options.backgroundColor,
        DEFAULT_OVERLAY_RGBA
      );

      const overlay = await Jimp.create(overlayWidth, overlayHeight, backgroundColor);

      const fontVariant = getFontVariant(options.textColor);
      const primaryFontInfo = await loadFont(fontSize, fontVariant);
      const secondaryFontInfo = await loadFont(secondaryFontSize, fontVariant);

      const textX = overlayWidth > padding ? padding : 0;
      const primaryText = metadata.serialNumber || metadata.productId || '';
      const secondaryText = metadata.batchNumber ? `Batch: ${metadata.batchNumber}` : '';

      overlay.print(primaryFontInfo.font, textX, padding, primaryText);

      if (secondaryText) {
        overlay.print(
          secondaryFontInfo.font,
          textX,
          padding + primaryFontInfo.size + Math.floor(padding / 2),
          secondaryText
        );
      }

      image.composite(overlay, padding, overlayY, {
        mode: Jimp.BLEND_SOURCE_OVER,
        opacitySource: 1,
        opacityDest: 1
      });

      return await image.getBufferAsync(image.getMIME() || Jimp.MIME_PNG);
    } catch (error) {
      console.error('Overlay error:', error);
      // Return original if overlay fails
      return imageBuffer;
    }
  }

  /**
   * Optimize image for output
   */
  static async optimizeImage(imageBuffer: Buffer, format: string = 'png', options: OptimizeOptions = {}): Promise<Buffer> {
    const image = await Jimp.read(imageBuffer);
    const targetFormat = (format || '').toLowerCase();

    switch (targetFormat) {
      case 'jpeg':
      case 'jpg': {
        if (options.quality) {
          image.quality(clamp(options.quality, 1, 100));
        }
        return image.getBufferAsync(Jimp.MIME_JPEG);
      }
      case 'webp': {
        if (options.quality) {
          image.quality(clamp(options.quality, 1, 100));
        }
        return image.getBufferAsync(Jimp.MIME_WEBP);
      }
      case 'png':
      default: {
        if (typeof options.compressionLevel === 'number' && (image as unknown as { deflateLevel?: (level: number) => void }).deflateLevel) {
          (image as unknown as { deflateLevel: (level: number) => void }).deflateLevel(clamp(options.compressionLevel, 0, 9));
        }
        return image.getBufferAsync(Jimp.MIME_PNG);
      }
    }
  }

  /**
   * Validate design file
   */
  static async validateDesign(buffer: Buffer): Promise<DesignValidation> {
    try {
      const image = await Jimp.read(buffer);
      const width = image.bitmap.width;
      const height = image.bitmap.height;
      const mime = image.getMIME();
      const format = (mime || '').split('/').pop()?.toLowerCase() || 'unknown';

      const errors: string[] = [];
      const warnings: string[] = [];

      const validFormats = ['jpeg', 'jpg', 'png', 'webp', 'tiff', 'bmp', 'gif'];
      if (!validFormats.includes(format)) {
        errors.push(`Unsupported format: ${format}`);
      }

      const minWidth = 300;
      const minHeight = 300;
      const maxWidth = 10000;
      const maxHeight = 10000;

      if (width < minWidth || height < minHeight) {
        errors.push(`Image too small. Minimum ${minWidth}x${minHeight}px`);
      }

      if (width > maxWidth || height > maxHeight) {
        errors.push(`Image too large. Maximum ${maxWidth}x${maxHeight}px`);
      }

      if (width < 1200 || height < 1200) {
        warnings.push('Image resolution may be too low for high-quality printing');
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        metadata: {
          width,
          height,
          format,
          space: 'rgba',
          channels: 4,
          hasAlpha: hasAlphaChannel(image.bitmap.data)
        }
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        valid: false,
        errors: [`Invalid image file: ${message}`],
        warnings: []
      };
    }
  }

  /**
   * Sanitize placement object - ensure all values are safe integers
   */
  static sanitizePlacement(placement: Record<string, unknown>): Placement {
    if (!placement || typeof placement !== 'object') {
      throw new Error('Invalid placement object');
    }

    return {
      x: Math.max(0, Math.round(Number(placement.x) || 0)),
      y: Math.max(0, Math.round(Number(placement.y) || 0)),
      width: Math.max(1, Math.round(Number(placement.width) || 100)),
      height: Math.max(1, Math.round(Number(placement.height) || 100))
    };
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function parseColor(color: string | undefined, fallback: number): number {
  if (typeof color !== 'string') {
    return fallback;
  }

  const trimmed = color.trim().toLowerCase();

  if (trimmed.startsWith('rgba')) {
    const match = trimmed.match(/rgba\(([^)]+)\)/);
    if (match) {
      const [r = 255, g = 255, b = 255, a = 1] = match[1]
        .split(',')
        .map((v) => Number(v.trim()));
      return Jimp.rgbaToInt(
        clamp(Math.round(r), 0, 255),
        clamp(Math.round(g), 0, 255),
        clamp(Math.round(b), 0, 255),
        clamp(Math.round(a * 255), 0, 255)
      );
    }
  }

  if (trimmed.startsWith('rgb')) {
    const match = trimmed.match(/rgb\(([^)]+)\)/);
    if (match) {
      const [r = 255, g = 255, b = 255] = match[1]
        .split(',')
        .map((v) => Number(v.trim()));
      return Jimp.rgbaToInt(
        clamp(Math.round(r), 0, 255),
        clamp(Math.round(g), 0, 255),
        clamp(Math.round(b), 0, 255),
        255
      );
    }
  }

  if (trimmed.startsWith('#')) {
    const hex = trimmed.replace('#', '');

    if (hex.length === 3 || hex.length === 4) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      const a = hex.length === 4 ? parseInt(hex[3] + hex[3], 16) : 255;
      return Jimp.rgbaToInt(r, g, b, a);
    }

    if (hex.length === 6 || hex.length === 8) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const a = hex.length === 8 ? parseInt(hex.substring(6, 8), 16) : 255;
      return Jimp.rgbaToInt(r, g, b, a);
    }
  }

  return fallback;
}

function getFontVariant(color: string | undefined): string {
  return isWhiteColor(color) ? 'white' : 'black';
}

function isWhiteColor(color: string | undefined): boolean {
  if (!color) {
    return false;
  }

  const normalized = color.trim().toLowerCase();
  return normalized === 'white' ||
    normalized === '#fff' ||
    normalized === '#ffffff' ||
    normalized === 'rgb(255,255,255)' ||
    normalized === 'rgba(255,255,255,1)';
}

async function loadFont(requestedSize: number, variant: string): Promise<{ font: ReturnType<typeof Jimp.loadFont> extends Promise<infer T> ? T : never; size: number }> {
  const palette = FONT_PATHS[variant] || FONT_PATHS.black;
  const closestSize = [...FONT_SIZES].reduce((prev, curr) => (
    Math.abs(curr - requestedSize) < Math.abs(prev - requestedSize) ? curr : prev
  ), FONT_SIZES[0]);

  const font = await Jimp.loadFont(palette[closestSize]);
  return {
    font,
    size: closestSize
  };
}

function hasAlphaChannel(data: Buffer): boolean {
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) {
      return true;
    }
  }
  return false;
}

export default QrEmbedder;
