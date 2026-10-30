import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly apiKey: string;
  private readonly logger = new Logger(EmailService.name);
  private readonly apiUrl = 'https://api.resend.com/emails';
  private readonly fromAddress = 'notifications@kweli.co';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.getOrThrow<string>('RESEND_API_KEY');
  }

  async send(to: string, subject: string, html: string): Promise<void> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          from: this.fromAddress,
          to,
          subject,
          html,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(
          `Resend API error [${response.status}]: ${errorBody}`,
        );
        throw new Error(`Email send failed: ${response.status}`);
      }

      this.logger.log(`Email sent to ${to}: "${subject}"`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
      throw error;
    }
  }
}
