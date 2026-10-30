import { Injectable, Logger } from '@nestjs/common';
import * as Papa from 'papaparse';

@Injectable()
export class CsvParserService {
  private readonly logger = new Logger(CsvParserService.name);

  private readonly requiredFields = [
    'productId',
    'name',
    'batchNumber',
    'manufacturingDate',
    'expiryDate',
  ];

  async parse(buffer: Buffer): Promise<any[]> {
    const csvString = buffer.toString('utf-8');

    return new Promise((resolve, reject) => {
      Papa.parse(csvString, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            this.logger.warn(
              `CSV parsing completed with ${results.errors.length} error(s)`,
            );
          }
          resolve(results.data);
        },
        error: (error: Error) => {
          this.logger.error('CSV parsing failed', error.message);
          reject(error);
        },
      });
    });
  }

  validate(rows: any[]): { valid: any[]; errors: string[] } {
    const valid: any[] = [];
    const errors: string[] = [];

    rows.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because row 1 is header, data starts at row 2
      const missingFields = this.requiredFields.filter(
        (field) =>
          row[field] === undefined ||
          row[field] === null ||
          String(row[field]).trim() === '',
      );

      if (missingFields.length > 0) {
        errors.push(
          `Row ${rowNumber}: missing required fields: ${missingFields.join(', ')}`,
        );
      } else {
        valid.push(row);
      }
    });

    this.logger.log(
      `CSV validation: ${valid.length} valid, ${errors.length} errors out of ${rows.length} rows`,
    );

    return { valid, errors };
  }
}
