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

/**
 * Sends a notification email to all active Admins when a new commission is submitted.
 * @param clientName - The client's full name
 * @param clientEmail - The client's email address
 * @param clientType - The client type (e.g., "DLSU Student", "Faculty", etc.)
 * @param commissionId - The commission ID
 * @param service - The service requested
 * @param submitted - The submission date
 * @returns Promise resolving to success status and response data
 */
export async function sendAdminNotificationEmail(
  clientName: string,
  clientEmail: string,
  clientType: string,
  commissionId: string,
  service: string,
  submitted: string,
): Promise<{ sent: number; recipients: string[]; error?: string }> {
  if (!clientName || !clientEmail) {
    return {
      sent: 0,
      recipients: [],
      error: "Client name and email are required.",
    };
  }

  try {
    const response = await fetch(
      `${EMAIL_API_BASE_URL}/api/send-admin-notification`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientName,
          clientEmail,
          clientType,
          commissionId,
          service,
          submitted,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        sent: 0,
        recipients: [],
        error: data.error || "Failed to send admin notification email.",
      };
    }

    return { sent: data.sent || 0, recipients: data.recipients || [] };
  } catch (error) {
    console.error(
      "[emailService] Failed to send admin notification email:",
      error,
    );
    return {
      sent: 0,
      recipients: [],
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

/**
 * Sends a notification email to a client when their commission is submitted to the admin queue.
 * @param clientName - The client's full name
 * @param clientEmail - The client's email address
 * @param commissionId - The commission ID
 * @param service - The service requested
 * @param submitted - The submission date
 * @returns Promise resolving to success status and response data
 */
export async function sendClientQueueNotificationEmail(
  clientName: string,
  clientEmail: string,
  commissionId: string,
  service: string,
  submitted: string,
): Promise<{ sent: boolean; recipients: string[]; error?: string }> {
  if (!clientName || !clientEmail) {
    return {
      sent: false,
      recipients: [],
      error: "Client name and email are required.",
    };
  }

  try {
    const response = await fetch(
      `${EMAIL_API_BASE_URL}/api/send-client-queue-notification`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientName,
          clientEmail,
          commissionId,
          service,
          submitted,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        sent: false,
        recipients: [],
        error: data.error || "Failed to send client queue notification email.",
      };
    }

    return { sent: data.sent || false, recipients: data.recipients || [] };
  } catch (error) {
    console.error(
      "[emailService] Failed to send client queue notification email:",
      error,
    );
    return {
      sent: false,
      recipients: [],
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}
