/**
 * Termii Service for SMS Notifications
 * Uses the Termii API for sending SMS messages in Africa.
 */

interface SmsResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

export class TermiiService {
  /**
   * Send an SMS message
   * @param {string} to - The recipient's phone number
   * @param {string} sms - The message body
   * @returns {Promise<SmsResult>} The API response
   */
  static async sendSms(to: string, sms: string): Promise<SmsResult> {
    try {
      const apiKey = process.env.TERMII_API_KEY;
      if (!apiKey) {
        console.warn("TERMII_API_KEY is missing. SMS sending bypassed.");
        return { success: false, error: "Missing API Key" };
      }

      // Format the phone number (Termii expects numbers in international format e.g., 2348000000000)
      let formattedPhone = to.replace(/\D/g, '');
      if (formattedPhone.startsWith('0')) {
        // Assume Nigerian number for now if starting with 0, a more robust system would use country codes
        formattedPhone = '234' + formattedPhone.substring(1);
      }

      const payload = {
        to: formattedPhone,
        from: "Kweli",
        sms: sms,
        type: "plain",
        channel: "generic",
        api_key: apiKey,
      };

      const response = await fetch("https://api.ng.termii.com/api/sms/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to send SMS via Termii");
      }

      return { success: true, data };
    } catch (error: unknown) {
      console.error("TermiiService Error:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: message };
    }
  }
}
