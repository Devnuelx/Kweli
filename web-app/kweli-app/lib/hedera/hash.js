import crypto from 'crypto';

export function generateProductHash(productData, companySecret) {
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