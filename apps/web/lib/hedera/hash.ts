import crypto from 'node:crypto';

interface ProductHashData {
  productId: string;
  companyId: string;
  batchNumber: string;
  manufacturingDate: string;
}

export function generateProductHash(productData: ProductHashData, companySecret: string): string {
  const dataString = JSON.stringify({
    productId: productData.productId,
    companyId: productData.companyId,
    batchNumber: productData.batchNumber,
    manufacturingDate: productData.manufacturingDate,
    salt: companySecret,
    timestamp: Date.now()
  });
  
  return crypto
    .createHash('sha256')
    .update(dataString)
    .digest('hex');
}
