import React from "react";
import { cn } from "../../lib/utils";

/**
 * Props for the ToggleSwitch component.
 */
interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  title?: string;
}

/**
 * A small on/off pill switch, used for boolean admin toggles like
 * "Show on Client Page". Kept intentionally minimal (no label baked in —
 * place your own <label> or text next to it) so it drops into a table row
 * or a form row equally well.
 * @param {ToggleSwitchProps} props
 * @returns {JSX.Element}
 */
export function ToggleSwitch({ checked, onChange, disabled, title }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      title={title}
      className={cn(
        "w-9 h-5 rounded-full p-0.5 flex items-center transition-colors flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed",
        checked ? "bg-emerald-600 justify-end" : "bg-muted border border-border justify-start"
      )}
    >
      <span className="w-4 h-4 rounded-full bg-white shadow" />
    </button>
  );
}