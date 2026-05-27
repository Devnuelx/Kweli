import { PaymentProvider } from './PaymentProvider';
import type { PaymentLinkData, TransactionDetails } from './PaymentProvider';

export class FlutterwaveProvider extends PaymentProvider {
  private secretKey: string | undefined;
  private baseUrl: string;

  constructor() {
    super();
    this.secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    this.baseUrl = 'https://api.flutterwave.com/v3';
  }

  /**
   * Initialize a payment session/link via Flutterwave
   * @param {PaymentLinkData} data 
   * @returns {Promise<string>} The payment URL
   */
  async createPaymentLink(data: PaymentLinkData): Promise<string> {
    if (!this.secretKey) {
      console.warn("FLUTTERWAVE_SECRET_KEY is missing. Using dummy payment URL.");
      // Return a dummy link if no API key is present for development
      return `https://dummy-payment-provider.com/pay/${data.reference}`;
    }

    const payload = {
      tx_ref: data.reference,
      amount: data.amount,
      currency: data.currency,
      redirect_url: data.redirectUrl,
      customer: {
        email: data.email
      },
      customizations: {
        title: "Kweli Network",
        logo: "https://kweli.co/logo.png" // Update with real logo
      }
    };

    const response = await fetch(`${this.baseUrl}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json();

    if (!response.ok || responseData.status !== 'success') {
      throw new Error(responseData.message || "Failed to initialize Flutterwave payment");
    }

    return responseData.data.link;
  }

  /**
   * Verify a transaction via Flutterwave
   * @param {string} transactionId 
   * @returns {Promise<TransactionDetails>}
   */
  async verifyTransaction(transactionId: string): Promise<TransactionDetails> {
    if (!this.secretKey) {
      console.warn("FLUTTERWAVE_SECRET_KEY is missing. Returning success for dummy verify.");
      return { status: 'successful', amount: 100, currency: 'USD' }; // Dummy success
    }

    const response = await fetch(`${this.baseUrl}/transactions/${transactionId}/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json'
      }
    });

    const responseData = await response.json();

    if (!response.ok || responseData.status !== 'success') {
      throw new Error(responseData.message || "Failed to verify Flutterwave transaction");
    }

    return responseData.data; // Includes .status ('successful', 'failed', etc), .amount, .currency
  }
}
