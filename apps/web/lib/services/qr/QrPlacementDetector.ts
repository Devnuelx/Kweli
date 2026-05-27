import Jimp from 'jimp';
import Tesseract from 'tesseract.js';
import { supabase } from '@/lib/supabase/supabase';

interface Placement {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageDimensions {
  width: number;
  height: number;
}

interface DetectionOptions {
  placeholderColor?: string;
  textMarker?: string;
}

interface DetectedPlacement extends Placement {
  method: string;
  confidence: number;
}

interface DetectionResult {
  success: boolean;
  placements: DetectedPlacement[];
  methods: string[];
  imageDimensions?: ImageDimensions;
  error?: string;
}

interface ColorDetectionResult {
  found: boolean;
  placement?: Placement;
  confidence?: number;
  error?: string;
  details?: {
    regionCount: number;
    matchedPixels: number;
  };
}

interface TextDetectionResult {
  found: boolean;
  placement?: Placement;
  confidence?: number;
  error?: string;
  details?: {
    recognizedText: string;
    ocrConfidence: number;
  };
}

interface TemplateResult {
  found: boolean;
  placement?: Record<string, unknown>;
  method?: string;
  templateName?: string;
  error?: string;
}

interface CsvCoordinatesResult {
  found: boolean;
  placement?: Record<string, unknown>;
  method?: string;
}

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

interface Region {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  area: number;
  matchedPixels: number;
}

/**
 * QR Placement Detector Service
 * Detects QR code placement using multiple methods
 * Following SOLID principles: Single Responsibility
 */
export class QrPlacementDetector {
  /**
   * Detect QR placement using all available methods
   */
  static async detectAll(imageBuffer: Buffer, options: DetectionOptions = {}): Promise<DetectionResult> {
    const results: DetectionResult = {
      success: false,
      placements: [],
      methods: []
    };

    try {
      const baseImage = await Jimp.read(imageBuffer);
      const imageDimensions: ImageDimensions = {
        width: baseImage.bitmap.width,
        height: baseImage.bitmap.height
      };

      if (options.placeholderColor) {
        const colorPlacement = await this.detectColorPlaceholder(
          imageBuffer,
          options.placeholderColor,
          imageDimensions
        );
        
        if (colorPlacement.found && colorPlacement.placement && colorPlacement.confidence !== undefined) {
          results.placements.push({
            method: 'color',
            ...colorPlacement.placement,
            confidence: colorPlacement.confidence
          });
          results.methods.push('color');
        }
      }

      if (options.textMarker) {
        const textPlacement = await this.detectTextMarker(
          imageBuffer,
          options.textMarker,
          imageDimensions
        );
        
        if (textPlacement.found && textPlacement.placement && textPlacement.confidence !== undefined) {
          results.placements.push({
            method: 'text',
            ...textPlacement.placement,
            confidence: textPlacement.confidence
          });
          results.methods.push('text');
        }
      }

      results.success = results.placements.length > 0;
      results.imageDimensions = imageDimensions;

      return results;
    } catch (error: unknown) {
      console.error('Detection error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: message,
        placements: [],
        methods: []
      };
    }
  }

  /**
   * Detect colored placeholder box
   */
  static async detectColorPlaceholder(imageBuffer: Buffer, targetColor: string, imageDimensions: ImageDimensions): Promise<ColorDetectionResult> {
    try {
      const rgb = this.hexToRgb(targetColor);
      if (!rgb) {
        return { found: false, error: 'Invalid color format' };
      }

      const image = await Jimp.read(imageBuffer);
      const { data, width, height } = image.bitmap;
      const channels = 4;
      const tolerance = 30;
      
      const regions = this.findColoredRegions(
        data,
        width,
        height,
        channels,
        rgb,
        tolerance
      );

      if (regions.length === 0) {
        return { found: false };
      }

      const largestRegion = regions.reduce((max, region) => 
        region.area > max.area ? region : max
      );

      const placement: Placement = {
        x: largestRegion.minX,
        y: largestRegion.minY,
        width: largestRegion.maxX - largestRegion.minX,
        height: largestRegion.maxY - largestRegion.minY
      };

      const confidence = Math.min(
        (largestRegion.matchedPixels / largestRegion.area) * 100,
        100
      );

      return {
        found: true,
        placement,
        confidence,
        details: {
          regionCount: regions.length,
          matchedPixels: largestRegion.matchedPixels
        }
      };
    } catch (error: unknown) {
      console.error('Color detection error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { found: false, error: message };
    }
  }

  /**
   * Detect text marker (e.g., "QR_HERE")
   */
  static async detectTextMarker(imageBuffer: Buffer, textMarker: string, imageDimensions: ImageDimensions): Promise<TextDetectionResult> {
    try {
      const pngBuffer = await (await Jimp.read(imageBuffer))
        .getBufferAsync(Jimp.MIME_PNG);

      const { data } = await Tesseract.recognize(pngBuffer, 'eng', {
        logger: () => {} // Suppress logs
      });

      const words = (data as any).words || [];
      
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const text = word.text.toUpperCase().replace(/[^\w]/g, '');
        const marker = textMarker.toUpperCase().replace(/[^\w]/g, '');

        if (text === marker || text.includes(marker)) {
          const bbox = word.bbox;
          
          const padding = 20;
          const size = Math.max(bbox.x1 - bbox.x0, bbox.y1 - bbox.y0) + padding * 2;
          
          const placement: Placement = {
            x: Math.max(0, bbox.x0 - padding),
            y: Math.max(0, bbox.y0 - padding),
            width: Math.min(size, imageDimensions.width - bbox.x0 + padding),
            height: Math.min(size, imageDimensions.height - bbox.y0 + padding)
          };

          return {
            found: true,
            placement,
            confidence: word.confidence,
            details: {
              recognizedText: word.text,
              ocrConfidence: word.confidence
            }
          };
        }
      }

      return { found: false };
    } catch (error: unknown) {
      console.error('Text detection error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { found: false, error: message };
    }
  }

  /**
   * Get saved template coordinates
   */
  static async getTemplateCoordinates(templateId: string): Promise<TemplateResult> {
    try {
      const { data, error } = await supabase
        .from('design_templates')
        .select('qr_placement, name')
        .eq('id', templateId)
        .single();

      if (error || !data) {
        return { found: false, error: 'Template not found' };
      }

      return {
        found: true,
        placement: data.qr_placement,
        method: 'template',
        templateName: data.name
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { found: false, error: message };
    }
  }

  /**
   * Extract QR coordinates from CSV row
   */
  static getCsvCoordinates(row: { qrPlacement?: Record<string, unknown> }): CsvCoordinatesResult {
    if (!row.qrPlacement) {
      return { found: false };
    }

    return {
      found: true,
      placement: row.qrPlacement,
      method: 'csv'
    };
  }

  /**
   * Find colored regions in image
   * @private
   */
  static findColoredRegions(data: Buffer, width: number, height: number, channels: number, targetRgb: RgbColor, tolerance: number): Region[] {
    const visited = new Array(width * height).fill(false);
    const regions: Region[] = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * channels;
        
        if (visited[y * width + x]) continue;

        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        if (this.colorMatches(r, g, b, targetRgb, tolerance)) {
          const region = this.floodFill(
            data, width, height, channels, x, y, visited, targetRgb, tolerance
          );

          if (region.area > 100) {
            regions.push(region);
          }
        }
      }
    }

    return regions;
  }

  /**
   * Flood fill algorithm to find connected colored regions
   * @private
   */
  static floodFill(data: Buffer, width: number, height: number, channels: number, startX: number, startY: number, visited: boolean[], targetRgb: RgbColor, tolerance: number): Region {
    const stack: [number, number][] = [[startX, startY]];
    let minX = startX, maxX = startX, minY = startY, maxY = startY;
    let area = 0;
    let matchedPixels = 0;

    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      
      const idx = y * width + x;
      if (visited[idx]) continue;

      const pixelIdx = idx * channels;
      const r = data[pixelIdx];
      const g = data[pixelIdx + 1];
      const b = data[pixelIdx + 2];

      if (!this.colorMatches(r, g, b, targetRgb, tolerance)) continue;

      visited[idx] = true;
      area++;
      matchedPixels++;

      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);

      stack.push([x + 1, y]);
      stack.push([x - 1, y]);
      stack.push([x, y + 1]);
      stack.push([x, y - 1]);
    }

    return { minX, maxX, minY, maxY, area, matchedPixels };
  }

  /**
   * Check if color matches target with tolerance
   * @private
   */
  static colorMatches(r: number, g: number, b: number, target: RgbColor, tolerance: number): boolean {
    return (
      Math.abs(r - target.r) <= tolerance &&
      Math.abs(g - target.g) <= tolerance &&
      Math.abs(b - target.b) <= tolerance
    );
  }

  /**
   * Convert hex color to RGB
   * @private
   */
  static hexToRgb(hex: string): RgbColor | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Create default centered placement
   */
  static createDefaultPlacement(imageDimensions: ImageDimensions, qrSize: number = 200): Placement & { method: string } {
    return {
      x: Math.floor((imageDimensions.width - qrSize) / 2),
      y: Math.floor((imageDimensions.height - qrSize) / 2),
      width: qrSize,
      height: qrSize,
      method: 'default'
    };
  }
}

export default QrPlacementDetector;
