import { fetchSheet, addRow, isApiConfigured } from "../lib/apiClient";

export interface ChatMessage {
  id: string;
  sender: string;
  role: "Admin" | "ResidentMaker";
  text: string;
  createdAt: string;
}

const generateId = (prefix: string): string => {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now()}-${random}`;
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const chatService = {
  /**
   * Fetches all chat messages, oldest first, for the shared team chat.
   * Messages older than 24 hours are filtered out client-side as a safety
   * net, in addition to the server-side purge (purgeExpiredChat, run
   * lazily on every chat read/write by mongo-service/src/routes/data.js).
   */
  async fetchMessages(): Promise<ChatMessage[]> {
    if (!isApiConfigured()) {
      console.warn("[chatService] VITE_API_URL is not set. Returning an empty chat.");
      return [];
    }
    try {
      const data = await fetchSheet<ChatMessage>("chat");
      const now = Date.now();
      return data
        .filter((m) => {
          const createdMs = new Date(m.createdAt).getTime();
          return !isNaN(createdMs) && now - createdMs < ONE_DAY_MS;
        })
        .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
    } catch (error) {
      console.error("[chatService] Failed to fetch chat messages.", error);
      return [];
    }
  },

  /** Sends a chat message. Returns the message object optimistically if the write fails, matching prior fire-and-forget behavior for chat specifically (a dropped chat message is low-stakes compared to e.g. a commission). */
  async sendMessage(sender: string, role: "Admin" | "ResidentMaker", text: string): Promise<ChatMessage> {
    const newMessage: ChatMessage = {
      id: generateId("MSG"),
      sender,
      role,
      text,
      createdAt: new Date().toISOString(),
    };
    if (!isApiConfigured()) {
      console.warn("[chatService] VITE_API_URL is not set. Message was not saved.");
      return newMessage;
    }
    try {
      await addRow("chat", newMessage as unknown as Record<string, unknown>);
    } catch (error) {
      console.error("[chatService] Failed to send message.", error);
    }
    return newMessage;
  },
};