import QRCode from 'qrcode';

interface QRCodeBufferOptions {
  errorCorrection?: string;
  width?: number;
  margin?: number;
  darkColor?: string;
  lightColor?: string;
}

export async function generateQRCode(hashOrUrl: string, productId?: string): Promise<string> {
  const verificationUrl = productId ? `${process.env.NEXT_PUBLIC_APP_URL}/verify?hash=${hashOrUrl}&pid=${productId}` : hashOrUrl;
  
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
export async function generateQRCodeBuffer(hashOrUrl: string, productId?: string, options: QRCodeBufferOptions = {}): Promise<Buffer> {
  const verificationUrl = productId ? `${process.env.NEXT_PUBLIC_APP_URL}/verify?hash=${hashOrUrl}&pid=${productId}` : hashOrUrl;
  
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
