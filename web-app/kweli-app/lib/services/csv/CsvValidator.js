/**
 * CSV Validator Service - Additional validation utilities
 * Following SOLID principles: Single Responsibility
 */
export class CsvValidator {
  /**
   * Validate CSV file before parsing
   * @param {File} file - CSV file
   * @returns {Object} Validation result
   */
  static validateFile(file) {
    const errors = [];
    const maxSize = 10 * 1024 * 1024; // 10MB

    // Check file type
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
    const validExtensions = ['.csv', '.txt'];
    
    const hasValidType = validTypes.includes(file.type);
    const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!hasValidType && !hasValidExtension) {
      errors.push('File must be a CSV file (.csv)');
    }

    // Check file size
    if (file.size > maxSize) {
      errors.push(`File size must be less than ${maxSize / 1024 / 1024}MB`);
    }

    // Check if file is empty
    if (file.size === 0) {
      errors.push('File is empty');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate batch consistency
   * @param {Array} rows - CSV rows
   * @returns {Object} Validation result
   */
  static validateBatchConsistency(rows) {
    const errors = [];
    const batches = {};

    rows.forEach((row, index) => {
      const key = row.batchNumber;
      
      if (!batches[key]) {
        batches[key] = {
          name: row.name,
          manufacturingDate: row.manufacturingDate,
          expiryDate: row.expiryDate,
          firstRow: index + 2
        };
      } else {
        // Check if batch details are consistent
        const batch = batches[key];
        
        if (batch.name !== row.name) {
          errors.push(`Row ${index + 2}: Product name mismatch in batch ${key}`);
        }
        
        if (batch.manufacturingDate !== row.manufacturingDate) {
          errors.push(`Row ${index + 2}: Manufacturing date mismatch in batch ${key}`);
        }
        
        if (batch.expiryDate !== row.expiryDate) {
          errors.push(`Row ${index + 2}: Expiry date mismatch in batch ${key}`);
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      batchCount: Object.keys(batches).length
    };
  }

  /**
   * Validate QR placement coordinates
   * @param {Object} placement - {x, y, width, height}
   * @param {Object} imageDimensions - {width, height}
   * @returns {Object} Validation result
   */
  static validateQrPlacement(placement, imageDimensions) {
    const errors = [];

    if (!placement) {
      return { valid: false, errors: ['No placement provided'] };
    }

    const { x, y, width, height } = placement;
    const { width: imgWidth, height: imgHeight } = imageDimensions;

    // Check if QR fits within image bounds
    if (x < 0 || y < 0) {
      errors.push('QR position cannot be negative');
    }

    if (x + width > imgWidth) {
      errors.push(`QR extends beyond image width (${imgWidth}px)`);
    }

    if (y + height > imgHeight) {
      errors.push(`QR extends beyond image height (${imgHeight}px)`);
    }

    // Check minimum size
    if (width < 50 || height < 50) {
      errors.push('QR code must be at least 50x50 pixels');
    }

    // Check maximum size (shouldn't be larger than image)
    if (width > imgWidth || height > imgHeight) {
      errors.push('QR code cannot be larger than the design');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize product data
   * @param {Object} data - Product data
   * @returns {Object} Sanitized data
   */
  static sanitize(data) {
    return {
      ...data,
      productId: data.productId?.trim().replace(/[^\w-]/g, '_'),
      name: data.name?.trim(),
      batchNumber: data.batchNumber?.trim().replace(/[^\w-]/g, '_'),
      description: data.description?.trim().substring(0, 500) || '',
      category: data.category?.trim().substring(0, 100) || ''
    };
  }
}

export default CsvValidator;

