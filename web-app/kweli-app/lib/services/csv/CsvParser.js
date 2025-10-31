import Papa from 'papaparse';

/**
 * CSV Parser Service - Handles parsing and validation of product CSV imports
 * Following SOLID principles: Single Responsibility
 */
export class CsvParser {
  /**
   * Parse CSV file and return structured data
   * @param {File|Buffer|string} csvData - CSV file content
   * @returns {Promise<Object>} Parsed and validated data
   */
  static async parse(csvData) {
    return new Promise((resolve, reject) => {
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: (results) => {
          try {
            const validatedData = this.validate(results.data);
            resolve({
              success: true,
              data: validatedData,
              errors: [],
              rowCount: validatedData.length
            });
          } catch (error) {
            reject({
              success: false,
              error: error.message,
              data: []
            });
          }
        },
        error: (error) => {
          reject({
            success: false,
            error: error.message,
            data: []
          });
        }
      });
    });
  }

  /**
   * Validate CSV rows
   * @param {Array} rows - Parsed CSV rows
   * @returns {Array} Validated rows
   */
  static validate(rows) {
    const errors = [];
    const validatedRows = [];

    rows.forEach((row, index) => {
      const rowNumber = index + 2; // +2 for header and 0-index
      const validation = this.validateRow(row, rowNumber);
      
      if (validation.valid) {
        validatedRows.push(validation.data);
      } else {
        errors.push({
          row: rowNumber,
          errors: validation.errors
        });
      }
    });

    if (errors.length > 0) {
      throw new Error(`Validation failed for ${errors.length} rows: ${JSON.stringify(errors.slice(0, 5))}`);
    }

    return validatedRows;
  }

  /**
   * Validate individual row
   * @param {Object} row - CSV row data
   * @param {number} rowNumber - Row number for error reporting
   * @returns {Object} Validation result
   */
  static validateRow(row, rowNumber) {
    const errors = [];
    const requiredFields = ['productId', 'name', 'batchNumber', 'manufacturingDate', 'expiryDate'];

    // Check required fields
    requiredFields.forEach(field => {
      if (!row[field] || row[field].trim() === '') {
        errors.push(`Missing required field: ${field}`);
      }
    });

    // Validate dates
    if (row.manufacturingDate && !this.isValidDate(row.manufacturingDate)) {
      errors.push(`Invalid manufacturing date format. Use YYYY-MM-DD`);
    }

    if (row.expiryDate && !this.isValidDate(row.expiryDate)) {
      errors.push(`Invalid expiry date format. Use YYYY-MM-DD`);
    }

    // Validate dates logic
    if (row.manufacturingDate && row.expiryDate) {
      const mfgDate = new Date(row.manufacturingDate);
      const expDate = new Date(row.expiryDate);
      
      if (expDate <= mfgDate) {
        errors.push(`Expiry date must be after manufacturing date`);
      }
    }

    // Validate quantity if provided
    const quantity = parseInt(row.quantity || '1');
    if (isNaN(quantity) || quantity < 1) {
      errors.push(`Quantity must be a positive number`);
    }

    // Validate QR coordinates if provided
    if (row.qr_x || row.qr_y || row.qr_width || row.qr_height) {
      const coords = {
        x: parseInt(row.qr_x),
        y: parseInt(row.qr_y),
        width: parseInt(row.qr_width),
        height: parseInt(row.qr_height)
      };

      if (isNaN(coords.x) || isNaN(coords.y) || isNaN(coords.width) || isNaN(coords.height)) {
        errors.push(`QR coordinates must be valid numbers`);
      }

      if (coords.width < 50 || coords.height < 50) {
        errors.push(`QR dimensions must be at least 50x50 pixels`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      data: {
        productId: row.productId?.trim(),
        name: row.name?.trim(),
        batchNumber: row.batchNumber?.trim(),
        manufacturingDate: row.manufacturingDate?.trim(),
        expiryDate: row.expiryDate?.trim(),
        quantity: parseInt(row.quantity || '1'),
        startingSerialNumber: parseInt(row.startingSerialNumber || '1'),
        qrPlacement: (row.qr_x && row.qr_y && row.qr_width && row.qr_height) ? {
          x: parseInt(row.qr_x),
          y: parseInt(row.qr_y),
          width: parseInt(row.qr_width),
          height: parseInt(row.qr_height)
        } : null,
        // Additional optional fields
        description: row.description?.trim() || '',
        category: row.category?.trim() || ''
      }
    };
  }

  /**
   * Check if date string is valid
   * @param {string} dateString - Date in YYYY-MM-DD format
   * @returns {boolean}
   */
  static isValidDate(dateString) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  }

  /**
   * Determine import mode based on CSV data
   * @param {Array} rows - Validated CSV rows
   * @returns {string} 'individual' or 'batch'
   */
  static determineImportMode(rows) {
    // If any row has quantity > 1, it's batch mode
    const hasBatchMode = rows.some(row => row.quantity > 1);
    
    // If all rows have same batch number and details, it's batch mode
    const uniqueBatches = new Set(rows.map(row => row.batchNumber));
    const isSameBatch = uniqueBatches.size === 1 && rows.length > 1;
    
    return hasBatchMode || isSameBatch ? 'batch' : 'individual';
  }
}

export default CsvParser;

