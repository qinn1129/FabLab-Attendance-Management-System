import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, MessageCircle, MessageSquare } from "lucide-react";
import { chatService, type ChatMessage } from "../../services/chatService";
import { accountsService } from "../../services/accountsService";
import { cn } from "../../lib/utils";

/**
 * Props for the ChatWidget component.
 */
interface ChatWidgetProps {
  accentColor?: "emerald" | "violet";
  /** Display name of the currently logged-in user, used to tag outgoing messages and detect "mine" bubbles. */
  senderName: string;
  /** Role of the currently logged-in user. */
  senderRole: "Admin" | "ResidentMaker";
}

interface MentionableUser {
  name: string;
  role: "Admin" | "ResidentMaker";
}

const POLL_INTERVAL_MS = 4000;
const MAX_MENTION_RESULTS = 6;

function initialsFor(name: string | undefined | null): string {
  const safe = (name || "").trim();
  if (!safe) return "?";
  const parts = safe.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

/** Escapes a string for safe use inside a RegExp. */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * A floating chat widget used across Admin and RM interfaces for team communication.
 * Backed by the shared "chat" sheet via chatService, so messages persist across
 * reloads and are visible to everyone using the app. Supports "@" mentions that
 * autocomplete against all active Admin and Resident Maker accounts.
 * @param {ChatWidgetProps} props
 * @returns {JSX.Element}
 */
export function ChatWidget({ accentColor = "emerald", senderName, senderRole }: ChatWidgetProps) {
  const safeSenderName = senderName && senderName.trim() ? senderName.trim() : "Unknown User";
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── @mention state ─────────────────────────────────────────────
  const [mentionableUsers, setMentionableUsers] = useState<MentionableUser[]>([]);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);

  const loadMessages = useCallback(async () => {
    const data = await chatService.fetchMessages();
    setMsgs(data);
  }, []);

  // Load the mentionable roster (active Admins + Resident Makers) once on mount.
  useEffect(() => {
    accountsService.fetchAccounts().then(accounts => {
      const users: MentionableUser[] = accounts
        .filter(a => a.status === "Active" && (a.role === "Admin" || a.role === "ResidentMaker"))
        .map(a => ({ name: `${a.firstName} ${a.lastName}`.trim(), role: a.role }))
        .filter(u => u.name.length > 0);
      setMentionableUsers(users);
    });
  }, []);

  // Initial load so unread messages are visible even before opening the widget.
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Poll for new messages only while the widget is open, to avoid hammering
  // the Apps Script endpoint in the background.
  useEffect(() => {
    if (open) {
      loadMessages();
      pollRef.current = setInterval(loadMessages, POLL_INTERVAL_MS);
    } else if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [open, loadMessages]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [open, msgs]);

  useEffect(() => {
    setActiveMentionIndex(0);
  }, [mentionQuery]);

  const filteredMentions = mentionableUsers
    .filter(u => u.name.toLowerCase().includes(mentionQuery.toLowerCase()))
    .slice(0, MAX_MENTION_RESULTS);

  function closeMentionMenu() {
    setMentionOpen(false);
    setMentionQuery("");
    setMentionStart(null);
  }

  function handleDraftChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setDraft(value);

    const cursorPos = e.target.selectionStart ?? value.length;
    const textBeforeCursor = value.slice(0, cursorPos);
    // Matches an "@" that starts a word (preceded by start-of-string or whitespace)
    // followed by zero or more non-space characters, up to the cursor.
    const atMatch = textBeforeCursor.match(/(?:^|\s)@([^\s@]*)$/);

    if (atMatch) {
      const query = atMatch[1];
      setMentionQuery(query);
      setMentionStart(cursorPos - query.length - 1); // index of the "@" itself
      setMentionOpen(true);
    } else {
      closeMentionMenu();
    }
  }

  function selectMention(name: string) {
    if (mentionStart === null || !inputRef.current) return;
    const cursorPos = inputRef.current.selectionStart ?? draft.length;
    const before = draft.slice(0, mentionStart);
    const after = draft.slice(cursorPos);
    const newDraft = `${before}@${name} ${after}`;
    setDraft(newDraft);
    closeMentionMenu();

    requestAnimationFrame(() => {
      const newCursor = before.length + name.length + 2; // "@" + name + trailing space
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(newCursor, newCursor);
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (mentionOpen && filteredMentions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveMentionIndex(i => (i + 1) % filteredMentions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveMentionIndex(i => (i - 1 + filteredMentions.length) % filteredMentions.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        selectMention(filteredMentions[activeMentionIndex].name);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        closeMentionMenu();
        return;
      }
    }
    if (e.key === "Enter") {
      sendMsg();
    }
  }

  async function sendMsg() {
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    setDraft("");
    closeMentionMenu();

    const optimistic: ChatMessage = {
      id: `pending-${Date.now()}`,
      sender: safeSenderName,
      role: senderRole,
      text,
      createdAt: new Date().toISOString(),
    };
    setMsgs(m => [...m, optimistic]);

    const saved = await chatService.sendMessage(safeSenderName, senderRole, text);
    setMsgs(m => m.map(x => (x.id === optimistic.id ? saved : x)));
    setSending(false);
  }

  /** Renders message text with any "@Name" mentions matching a known user highlighted. */
  function renderMessageText(text: string, mine: boolean): React.ReactNode {
    if (mentionableUsers.length === 0) return text;
    const pattern = new RegExp(`@(${mentionableUsers.map(u => escapeRegExp(u.name)).join("|")})`, "g");
    const nodes: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let key = 0;

    while ((match = pattern.exec(text)) !== null) {
      if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
      nodes.push(
        <span
          key={key++}
          className={cn(
            "font-semibold rounded px-0.5",
            mine ? "bg-white/20" : "bg-emerald-500/15 text-emerald-600"
          )}
        >
          @{match[1]}
        </span>
      );
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
    return nodes.length > 0 ? nodes : text;
  }

  const accent = accentColor === "violet" ? "bg-violet-600 hover:bg-violet-700" : "bg-emerald-600 hover:bg-emerald-700";
  const headerBg = accentColor === "violet" ? "bg-violet-600" : "bg-emerald-700";
  const bubbleMine = accentColor === "violet" ? "bg-violet-600 text-white" : "bg-emerald-600 text-white";

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-80 h-[420px] rounded-2xl shadow-2xl border border-border bg-card flex flex-col overflow-hidden">
          <div className={cn("px-4 py-3 flex items-center justify-between", headerBg)}>

            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-semibold">FabLab Chat</span>
              <span className="w-2 h-2 rounded-full bg-green-300" />
            </div>

            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition">
              <X className="w-4 h-4" />
            </button>

          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-muted">
            {msgs.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No messages yet. Say hi!</p>
            ) : (
              msgs.map(m => {
                const mine = m.sender === safeSenderName;
                return (
                  <div key={m.id} className={cn("flex items-end gap-2", mine && "flex-row-reverse")}>
                    <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0", mine ? (accentColor === "violet" ? "bg-violet-500" : "bg-emerald-500") : "bg-gray-400")}>
                      {initialsFor(m.sender)}
                    </div>
                    <div className={cn("max-w-[68%] rounded-2xl px-3 py-1.5 text-sm", mine ? bubbleMine : "bg-card border border-border text-card-foreground")}>
                      {!mine && <div className="text-[10px] font-semibold text-muted-foreground mb-0.5">{m.sender}</div>}
                      <p className="leading-snug whitespace-pre-wrap break-words">{renderMessageText(m.text, mine)}</p>
                      <div className={cn("text-[10px] mt-0.5", mine ? "text-white/60" : "text-muted-foreground")}>{formatTime(m.createdAt)}</div>
                    </div>
                  </div>
                );
              })
            )}

            <div ref={bottomRef} />
          </div>

          <div className="relative p-2 border-t border-border bg-card flex gap-2">
            {mentionOpen && filteredMentions.length > 0 && (
              <div className="absolute bottom-full mb-1 left-2 right-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-10 max-h-44 overflow-y-auto">
                {filteredMentions.map((u, i) => (
                  <button
                    key={u.name}
                    onMouseDown={e => e.preventDefault()} // keep input focus so cursor position survives the click
                    onClick={() => selectMention(u.name)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition",
                      i === activeMentionIndex ? "bg-muted" : "hover:bg-muted/60"
                    )}
                  >
                    <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0", u.role === "Admin" ? "bg-emerald-600" : "bg-blue-500")}>
                      {initialsFor(u.name)}
                    </span>
                    <span className="flex-1 truncate text-foreground">{u.name}</span>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">{u.role === "Admin" ? "Admin" : "RM"}</span>
                  </button>
                ))}
              </div>
            )}
            <input
              ref={inputRef}
              value={draft}
              onChange={handleDraftChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... (@ to mention)"
              className="flex-1 px-3 py-2 rounded-full bg-muted text-sm text-foreground outline-none border border-transparent focus:border-border"
            />
            <button onClick={sendMsg} disabled={sending || !draft.trim()} className={cn("w-9 h-9 rounded-full flex items-center justify-center text-white flex-shrink-0 transition disabled:opacity-40", accent)}>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        className={cn("w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition", accent)}
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  );
}