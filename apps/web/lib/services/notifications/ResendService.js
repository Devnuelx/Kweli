/**
 * Resend Service for Email Notifications
 * Uses the Resend REST API for sending transactional emails.
 */
export class ResendService {
  /**
   * Send an email message
   * @param {string} to - The recipient's email address
   * @param {string} subject - The email subject
   * @param {string} html - The email HTML body
   * @returns {Promise<Object>} The API response
   */
  static async sendEmail(to, subject, html) {
    try {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        console.warn("RESEND_API_KEY is missing. Email sending bypassed.");
        return { success: false, error: "Missing API Key" };
      }

      const payload = {
        from: "Kweli Notifications <notifications@kweli.co>", // Must use a verified domain
        to: [to],
        subject: subject,
        html: html
      };

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to send Email via Resend");
      }

      return { success: true, data };
    } catch (error) {
      console.error("ResendService Error:", error);
      return { success: false, error: error.message };
    }
  }
}
