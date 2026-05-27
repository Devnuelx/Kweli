/**
 * Generic Payment Provider Interface
 */

export interface PaymentLinkData {
  email: string;
  amount: number;
  currency: string;
  reference: string;
  redirectUrl: string;
}

export interface TransactionDetails {
  status: string;
  amount: number;
  currency: string;
  [key: string]: unknown;
}

export abstract class PaymentProvider {
  /**
   * Initialize a payment session/link
   * @param {PaymentLinkData} data 
   * @returns {Promise<string>} The payment URL
   */
  abstract createPaymentLink(data: PaymentLinkData): Promise<string>;

  /**
   * Verify a transaction
   * @param {string} transactionId 
   * @returns {Promise<TransactionDetails>} The transaction details
   */
  abstract verifyTransaction(transactionId: string): Promise<TransactionDetails>;
}
