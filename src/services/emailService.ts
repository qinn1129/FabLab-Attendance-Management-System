import { type Commission } from "./sheetsService";

// Email service API base URL - the Flask backend running the email service
const EMAIL_API_BASE_URL = "http://127.0.0.1:5001";

/**
 * Sends a commission confirmation email to a client when their request is approved.
 * @param clientName - The client's full name
 * @param clientEmail - The client's email address
 * @param commission - The commission object containing request details
 * @returns Promise resolving to success status and response data
 */
export async function sendCommissionConfirmationEmail(
  clientName: string,
  clientEmail: string,
  commission: Commission,
): Promise<{ sent: boolean; error?: string }> {
  if (!clientName || !clientEmail) {
    return { sent: false, error: "Client name and email are required." };
  }

  try {
    const response = await fetch(
      `${EMAIL_API_BASE_URL}/api/send-commission-confirmation`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientName,
          clientEmail,
          commission,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        sent: false,
        error: data.error || "Failed to send confirmation email.",
      };
    }

    return { sent: true };
  } catch (error) {
    console.error(
      "[emailService] Failed to send commission confirmation email:",
      error,
    );
    return {
      sent: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}
