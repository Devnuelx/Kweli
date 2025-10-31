import Jimp from 'jimp';
import Tesseract from 'tesseract.js';
import { supabase } from '@/lib/supabase/supabase';

/**
 * QR Placement Detector Service
 * Detects QR code placement using multiple methods
 * Following SOLID principles: Single Responsibility
 */
export class QrPlacementDetector {
  /**
   * Detect QR placement using all available methods
   * @param {Buffer} imageBuffer - Image buffer
   * @param {Object} options - Detection options
   * @returns {Promise<Object>} Detected placements
   */
  static async detectAll(imageBuffer, options = {}) {
    const results = {
      success: false,
      placements: [],
      methods: []
    };

    try {
      // Get image metadata
      const baseImage = await Jimp.read(imageBuffer);
      const imageDimensions = {
        width: baseImage.bitmap.width,
        height: baseImage.bitmap.height
      };

      // Try color placeholder detection
      if (options.placeholderColor) {
        const colorPlacement = await this.detectColorPlaceholder(
          imageBuffer,
          options.placeholderColor,
          imageDimensions
        );
        
        if (colorPlacement.found) {
          results.placements.push({
            method: 'color',
            ...colorPlacement.placement,
            confidence: colorPlacement.confidence
          });
          results.methods.push('color');
        }
      }

      // Try text marker detection
      if (options.textMarker) {
        const textPlacement = await this.detectTextMarker(
          imageBuffer,
          options.textMarker,
          imageDimensions
        );
        
        if (textPlacement.found) {
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
    } catch (error) {
      console.error('Detection error:', error);
      return {
        success: false,
        error: error.message,
        placements: []
      };
    }
  }

  /**
   * Detect colored placeholder box
   * @param {Buffer} imageBuffer - Image buffer
   * @param {string} targetColor - Hex color (e.g., '#00FF00')
   * @param {Object} imageDimensions - Image dimensions
   * @returns {Promise<Object>} Detection result
   */
  static async detectColorPlaceholder(imageBuffer, targetColor, imageDimensions) {
    try {
      // Convert hex to RGB
      const rgb = this.hexToRgb(targetColor);
      if (!rgb) {
        return { found: false, error: 'Invalid color format' };
      }

      // Get raw pixel data
      const image = await Jimp.read(imageBuffer);
      const { data, width, height } = image.bitmap;
      const channels = 4;
      const tolerance = 30;
      
      // Find colored regions
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

      // Get the largest region (most likely the placeholder)
      const largestRegion = regions.reduce((max, region) => 
        region.area > max.area ? region : max
      );

      // Calculate bounding box
      const placement = {
        x: largestRegion.minX,
        y: largestRegion.minY,
        width: largestRegion.maxX - largestRegion.minX,
        height: largestRegion.maxY - largestRegion.minY
      };

      // Confidence based on color match quality
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
    } catch (error) {
      console.error('Color detection error:', error);
      return { found: false, error: error.message };
    }
  }

  /**
   * Detect text marker (e.g., "QR_HERE")
   * @param {Buffer} imageBuffer - Image buffer
   * @param {string} textMarker - Text to find
   * @param {Object} imageDimensions - Image dimensions
   * @returns {Promise<Object>} Detection result
   */
  static async detectTextMarker(imageBuffer, textMarker, imageDimensions) {
    try {
      // Convert image to PNG for Tesseract
      const pngBuffer = await (await Jimp.read(imageBuffer))
        .getBufferAsync(Jimp.MIME_PNG);

      // Perform OCR
      const { data } = await Tesseract.recognize(pngBuffer, 'eng', {
        logger: () => {} // Suppress logs
      });

      // Find text marker in OCR results
      const words = data.words || [];
      
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const text = word.text.toUpperCase().replace(/[^\w]/g, '');
        const marker = textMarker.toUpperCase().replace(/[^\w]/g, '');

        if (text === marker || text.includes(marker)) {
          // Found the marker, use its bounding box
          const bbox = word.bbox;
          
          // Add padding around text to create QR placement area
          const padding = 20;
          const size = Math.max(bbox.x1 - bbox.x0, bbox.y1 - bbox.y0) + padding * 2;
          
          const placement = {
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
    } catch (error) {
      console.error('Text detection error:', error);
      return { found: false, error: error.message };
    }
  }

  /**
   * Get saved template coordinates
   * @param {string} templateId - Template ID
   * @returns {Promise<Object>} Template placement
   */
  static async getTemplateCoordinates(templateId) {
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
    } catch (error) {
      return { found: false, error: error.message };
    }
  }

  /**
   * Extract QR coordinates from CSV row
   * @param {Object} row - CSV row with qr_x, qr_y, qr_width, qr_height
   * @returns {Object} Placement from CSV
   */
  static getCsvCoordinates(row) {
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
  static findColoredRegions(data, width, height, channels, targetRgb, tolerance) {
    const visited = new Array(width * height).fill(false);
    const regions = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * channels;
        
        if (visited[y * width + x]) continue;

        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Check if pixel matches target color
        if (this.colorMatches(r, g, b, targetRgb, tolerance)) {
          // Flood fill to find region
          const region = this.floodFill(
            data,
            width,
            height,
            channels,
            x,
            y,
            visited,
            targetRgb,
            tolerance
          );

          if (region.area > 100) { // Minimum area threshold
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
  static floodFill(data, width, height, channels, startX, startY, visited, targetRgb, tolerance) {
    const stack = [[startX, startY]];
    let minX = startX, maxX = startX, minY = startY, maxY = startY;
    let area = 0;
    let matchedPixels = 0;

    while (stack.length > 0) {
      const [x, y] = stack.pop();
      
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

      // Add neighbors
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
  static colorMatches(r, g, b, target, tolerance) {
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
  static hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Create default centered placement
   * @param {Object} imageDimensions - Image dimensions
   * @param {number} qrSize - QR code size (default 200)
   * @returns {Object} Centered placement
   */
  static createDefaultPlacement(imageDimensions, qrSize = 200) {
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

