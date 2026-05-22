/**
 * Generic Payment Provider Interface
 */
export class PaymentProvider {
  /**
   * Initialize a payment session/link
   * @param {Object} data 
   * @param {string} data.email
   * @param {number} data.amount
   * @param {string} data.currency
   * @param {string} data.reference
   * @param {string} data.redirectUrl
   * @returns {Promise<string>} The payment URL
   */
  async createPaymentLink(data) {
    throw new Error('Not implemented');
  }

  /**
   * Verify a transaction
   * @param {string} transactionId 
   * @returns {Promise<Object>} The transaction details
   */
  async verifyTransaction(transactionId) {
    throw new Error('Not implemented');
  }
}
