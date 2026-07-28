import React, { createContext, useCallback, useContext, useState } from "react";
import { AlertTriangle, HelpCircle, Info } from "lucide-react";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Styles the confirm button red and uses a warning icon for destructive actions. */
  danger?: boolean;
}

interface PromptOptions {
  title: string;
  message?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** If true, the confirm button stays disabled until non-whitespace text is entered. */
  required?: boolean;
  multiline?: boolean;
}

interface AlertOptions {
  title: string;
  message: string;
  okLabel?: string;
}

type DialogState =
  | { kind: "confirm"; options: ConfirmOptions; resolve: (result: boolean) => void }
  | { kind: "prompt"; options: PromptOptions; resolve: (result: string | null) => void }
  | { kind: "alert"; options: AlertOptions; resolve: () => void }
  | null;

interface DialogContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
  alert: (options: AlertOptions) => Promise<void>;
}

const DialogContext = createContext<DialogContextValue | null>(null);

/**
 * App-wide replacement for window.confirm / window.prompt / window.alert.
 * Wrap the app once with <DialogProvider>; any component can then call
 * useDialog() to trigger a dedicated, app-styled modal instead of the
 * browser's native popup, awaiting the result the same way the native
 * versions would return synchronously.
 */
export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogState>(null);
  const [promptValue, setPromptValue] = useState("");

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      setDialog({ kind: "confirm", options, resolve });
    });
  }, []);

  const prompt = useCallback((options: PromptOptions): Promise<string | null> => {
    setPromptValue(options.defaultValue || "");
    return new Promise(resolve => {
      setDialog({ kind: "prompt", options, resolve });
    });
  }, []);

  const alertFn = useCallback((options: AlertOptions): Promise<void> => {
    return new Promise(resolve => {
      setDialog({ kind: "alert", options, resolve: () => resolve() });
    });
  }, []);

  function closeConfirm(result: boolean) {
    if (dialog?.kind === "confirm") dialog.resolve(result);
    setDialog(null);
  }
  function closePrompt(result: string | null) {
    if (dialog?.kind === "prompt") dialog.resolve(result);
    setDialog(null);
    setPromptValue("");
  }
  function closeAlert() {
    if (dialog?.kind === "alert") dialog.resolve();
    setDialog(null);
  }

  const promptCanConfirm =
    dialog?.kind === "prompt" && (!dialog.options.required || promptValue.trim().length > 0);

  return (
    <DialogContext.Provider value={{ confirm, prompt, alert: alertFn }}>
      {children}

      {dialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3 mb-4">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                  dialog.kind === "confirm" && dialog.options.danger
                    ? "bg-red-500/10 text-red-500"
                    : dialog.kind === "alert"
                    ? "bg-blue-500/10 text-blue-500"
                    : "bg-emerald-500/10 text-emerald-600"
                }`}
              >
                {dialog.kind === "confirm" && dialog.options.danger ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : dialog.kind === "alert" ? (
                  <Info className="w-5 h-5" />
                ) : (
                  <HelpCircle className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-foreground">{dialog.options.title}</h3>
                {("message" in dialog.options) && dialog.options.message && (
                  <p className="text-sm text-muted-foreground mt-1">{dialog.options.message}</p>
                )}
              </div>
            </div>

            {dialog.kind === "prompt" && (
              dialog.options.multiline ? (
                <textarea
                  autoFocus
                  rows={3}
                  value={promptValue}
                  onChange={e => setPromptValue(e.target.value)}
                  placeholder={dialog.options.placeholder}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-emerald-400 resize-none mb-4"
                />
              ) : (
                <input
                  autoFocus
                  type="text"
                  value={promptValue}
                  onChange={e => setPromptValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && promptCanConfirm) closePrompt(promptValue);
                  }}
                  placeholder={dialog.options.placeholder}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-emerald-400 mb-4"
                />
              )
            )}

            <div className="flex justify-end gap-2">
              {dialog.kind === "alert" ? (
                <button
                  onClick={closeAlert}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition"
                >
                  {dialog.options.okLabel || "OK"}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => (dialog.kind === "confirm" ? closeConfirm(false) : closePrompt(null))}
                    className="px-4 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 text-sm font-medium transition"
                  >
                    {dialog.options.cancelLabel || "Cancel"}
                  </button>
                  <button
                    onClick={() => (dialog.kind === "confirm" ? closeConfirm(true) : closePrompt(promptValue))}
                    disabled={dialog.kind === "prompt" && !promptCanConfirm}
                    className={`px-4 py-2 rounded-lg text-white text-sm font-semibold transition disabled:opacity-40 ${
                      dialog.kind === "confirm" && dialog.options.danger
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                  >
                    {dialog.options.confirmLabel || "Confirm"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

/** Access the confirm/prompt/alert dialog functions from any component under <DialogProvider>. */
export function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog must be used within a DialogProvider");
  return ctx;
}