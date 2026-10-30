import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import * as QRCode from 'qrcode';

@Injectable()
export class QrGeneratorService {
  private readonly logger = new Logger(QrGeneratorService.name);

  async generateDataUrl(content: string, size: number = 300): Promise<string> {
    try {
      return await QRCode.toDataURL(content, {
        width: size,
        margin: 1,
        errorCorrectionLevel: 'H',
      });
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to generate QR code data URL: ${err.message}`);
      throw new InternalServerErrorException('Failed to generate QR code');
    }
  }

  async generateBuffer(content: string, size: number = 600): Promise<Buffer> {
    try {
      return await QRCode.toBuffer(content, {
        width: size,
        margin: 1,
        errorCorrectionLevel: 'H',
      });
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to generate QR code buffer: ${err.message}`);
      throw new InternalServerErrorException('Failed to generate QR code');
    }
  }
}
