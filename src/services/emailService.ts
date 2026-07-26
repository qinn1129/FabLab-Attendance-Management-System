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
 * Sends a rejection notice email to a client when their commission request is declined.
 * @param clientName - The client's full name
 * @param clientEmail - The client's email address
 * @param commission - The commission object containing request details
 * @param reason - Optional reason text shown to the client
 * @returns Promise resolving to success status and response data
 */
export async function sendCommissionRejectionEmail(
  clientName: string,
  clientEmail: string,
  commission: Commission,
  reason?: string,
): Promise<{ sent: boolean; error?: string }> {
  if (!clientName || !clientEmail) {
    return { sent: false, error: "Client name and email are required." };
  }

  try {
    const response = await fetch(
      `${EMAIL_API_BASE_URL}/api/send-commission-rejection`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientName,
          clientEmail,
          commission,
          reason: reason || "",
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        sent: false,
        error: data.error || "Failed to send rejection email.",
      };
    }

    return { sent: true };
  } catch (error) {
    console.error(
      "[emailService] Failed to send commission rejection email:",
      error,
    );
    return {
      sent: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

/**
 * Sends a "new commission assigned to you" email to the Resident Maker
 * chosen by auto-assignment.
 * @param rmName - The Resident Maker's full name
 * @param rmEmail - The Resident Maker's email address
 * @param commissionId - The commission ID
 * @param clientName - The client's full name
 * @param service - The service requested
 * @returns Promise resolving to success status and response data
 */
export async function sendRMAssignmentEmail(
  rmName: string,
  rmEmail: string,
  commissionId: string,
  clientName: string,
  service: string,
): Promise<{ sent: boolean; error?: string }> {
  if (!rmName || !rmEmail) {
    return { sent: false, error: "RM name and email are required." };
  }

  try {
    const response = await fetch(
      `${EMAIL_API_BASE_URL}/api/send-rm-assignment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rmName,
          rmEmail,
          commissionId,
          clientName,
          service,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        sent: false,
        error: data.error || "Failed to send RM assignment email.",
      };
    }

    return { sent: true };
  } catch (error) {
    console.error(
      "[emailService] Failed to send RM assignment email:",
      error,
    );
    return {
      sent: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

/**
 * Sends a "you've been unassigned" email to the Resident Maker who
 * previously held a now-reassigned commission.
 * @param rmName - The Resident Maker's full name
 * @param rmEmail - The Resident Maker's email address
 * @param commissionId - The commission ID
 * @param clientName - The client's full name
 * @param service - The service requested
 * @returns Promise resolving to success status and response data
 */
export async function sendRMUnassignedEmail(
  rmName: string,
  rmEmail: string,
  commissionId: string,
  clientName: string,
  service: string,
): Promise<{ sent: boolean; error?: string }> {
  if (!rmName || !rmEmail) {
    return { sent: false, error: "RM name and email are required." };
  }

  try {
    const response = await fetch(
      `${EMAIL_API_BASE_URL}/api/send-rm-unassignment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rmName,
          rmEmail,
          commissionId,
          clientName,
          service,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        sent: false,
        error: data.error || "Failed to send RM unassignment email.",
      };
    }

    return { sent: true };
  } catch (error) {
    console.error(
      "[emailService] Failed to send RM unassignment email:",
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