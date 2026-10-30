import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class HashService {
  generateProductHash(data: { 
    productId: string; 
    companyId: string; 
    batchNumber: string; 
    manufacturingDate: string; 
    secret: string 
  }): string {
    const { productId, companyId, batchNumber, manufacturingDate, secret } = data;
    const timestamp = Date.now().toString();
    const input = `${productId}-${companyId}-${batchNumber}-${manufacturingDate}-${secret}-${timestamp}`;
    
    return crypto.createHash('sha256').update(input).digest('hex');
  }
}
