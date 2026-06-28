import React, { useState, useRef, useEffect } from "react";
import { X, Send, MessageCircle, MessageSquare } from "lucide-react";
import { CHAT_MSGS } from "../../constants/mockData";
import { cn } from "../../lib/utils";

/**
 * Props for the ChatWidget component.
 */
interface ChatWidgetProps {
  accentColor?: "emerald" | "violet";
}

/**
 * A floating chat widget used across Admin and RM interfaces for team communication.
 * @param {ChatWidgetProps} props
 * @returns {JSX.Element}
 */
export function ChatWidget({ accentColor = "emerald" }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState(CHAT_MSGS);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [open, msgs]);

  function sendMsg() {
    if (!draft.trim()) return;
    
    // TODO
    setMsgs(m => [
      ...m, 
      { 
        // feel free to edit this
        id: Date.now(), 
        sender: "You", 
        avatar: "ME", 
        mine: true, 
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), 
        text: draft.trim() 
      }
    ]);
    setDraft("");
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
            {msgs.map(m => (
              <div key={m.id} className={cn("flex items-end gap-2", m.mine && "flex-row-reverse")}>
                <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0", m.mine ? (accentColor === "violet" ? "bg-violet-500" : "bg-emerald-500") : "bg-gray-400")}>
                  {m.avatar}
                </div>
                <div className={cn("max-w-[68%] rounded-2xl px-3 py-1.5 text-sm", m.mine ? bubbleMine : "bg-card border border-border text-card-foreground")}>
                  {!m.mine && <div className="text-[10px] font-semibold text-muted-foreground mb-0.5">{m.sender}</div>}
                  <p className="leading-snug">{m.text}</p>
                  <div className={cn("text-[10px] mt-0.5", m.mine ? "text-white/60" : "text-muted-foreground")}>{m.time}</div>
                </div>
              </div>
            ))}

            <div ref={bottomRef} />
          </div>
          
          <div className="p-2 border-t border-border bg-card flex gap-2">
            <input
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMsg()}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 rounded-full bg-muted text-sm text-foreground outline-none border border-transparent focus:border-border"
            />
            <button onClick={sendMsg} className={cn("w-9 h-9 rounded-full flex items-center justify-center text-white flex-shrink-0 transition", accent)}>
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
