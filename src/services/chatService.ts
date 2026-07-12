export interface ChatMessage {
  id: string;
  sender: string;
  role: "Admin" | "ResidentMaker";
  text: string;
  createdAt: string;
}

const getScriptUrl = (): string | null => {
  const url = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
  return url && url.trim() !== "" ? url.trim() : null;
};

const getSecret = () => import.meta.env.VITE_WEBAPP_SECRET || "";

const generateId = (prefix: string): string => {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now()}-${random}`;
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const chatService = {
  /** Fetches all chat messages, oldest first, for the shared team chat. Messages older than 24 hours are filtered out client-side as a safety net, in addition to the server-side purge in Apps Script. */
  async fetchMessages(): Promise<ChatMessage[]> {
    const url = getScriptUrl();
    if (!url) {
      console.warn("[chatService] VITE_GOOGLE_SCRIPT_URL is not set. Returning an empty chat.");
      return [];
    }
    try {
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(getSecret())}&sheet=chat`;
      const response = await fetch(fetchUrl);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      const now = Date.now();
      return (data as ChatMessage[])
        .filter(m => {
          const createdMs = new Date(m.createdAt).getTime();
          return !isNaN(createdMs) && now - createdMs < ONE_DAY_MS;
        })
        .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
    } catch (error) {
      console.error("[chatService] Failed to fetch chat messages.", error);
      return [];
    }
  },

  /** Sends a chat message. Returns the message object optimistically (write is fire-and-forget via no-cors, matching the rest of the app's pattern). */
  async sendMessage(sender: string, role: "Admin" | "ResidentMaker", text: string): Promise<ChatMessage> {
    const newMessage: ChatMessage = {
      id: generateId("MSG"),
      sender,
      role,
      text,
      createdAt: new Date().toISOString(),
    };
    const url = getScriptUrl();
    if (!url) {
      console.warn("[chatService] VITE_GOOGLE_SCRIPT_URL is not set. Message was not saved.");
      return newMessage;
    }
    try {
      const secret = getSecret();
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(secret)}&sheet=chat`;
      await fetch(fetchUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ secret, sheet: "chat", action: "add", data: newMessage }),
      });
    } catch (error) {
      console.error("[chatService] Failed to send message.", error);
    }
    return newMessage;
  },
};