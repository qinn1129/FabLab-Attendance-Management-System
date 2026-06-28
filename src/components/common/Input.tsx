import React from "react";

/**
 * Props for the Input component.
 */
interface InputProps {
  label?: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}

/**
 * A reusable input component with optional label and required asterisk.
 * @param {InputProps} props
 * @returns {JSX.Element}
 */
export function Input({ label, type = "text", value, onChange, placeholder, required }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-foreground">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition"
      />
    </div>
  );
}
