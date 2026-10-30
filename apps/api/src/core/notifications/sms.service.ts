import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private readonly apiKey: string;
  private readonly logger = new Logger(SmsService.name);
  private readonly apiUrl = 'https://api.ng.termii.com/api/sms/send';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.getOrThrow<string>('TERMII_API_KEY');
  }

  async send(to: string, message: string): Promise<void> {
    const phone = this.normalizePhone(to);

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: phone,
          from: 'Kweli',
          sms: message,
          type: 'plain',
          channel: 'generic',
          api_key: this.apiKey,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(
          `Termii API error [${response.status}]: ${errorBody}`,
        );
        throw new Error(`SMS send failed: ${response.status}`);
      }

      this.logger.log(`SMS sent to ${phone}`);
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${phone}`, error);
      throw error;
    }
  }

  private normalizePhone(phone: string): string {
    const cleaned = phone.replace(/\s+/g, '').replace(/^[+]+/, '');

    // If it starts with '0', assume Nigerian local and replace with '234'
    if (cleaned.startsWith('0')) {
      return `234${cleaned.substring(1)}`;
    }

    // If it doesn't start with a country code (less than 11 digits or doesn't start with a digit pattern like 234)
    if (!cleaned.startsWith('234') && cleaned.length <= 10) {
      return `234${cleaned}`;
    }

    return cleaned;
  }
}
