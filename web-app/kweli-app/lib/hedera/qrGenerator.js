import QRCode from 'qrcode';

export async function generateQRCode(hash, productId) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify?hash=${hash}&pid=${productId}`;
  
  const qrCodeDataURL = await QRCode.toDataURL(verificationUrl, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    width: 300,
    margin: 4,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });
  
  return qrCodeDataURL;
}

// Generate QR code as buffer for embedding
export async function generateQRCodeBuffer(hash, productId, options = {}) {
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