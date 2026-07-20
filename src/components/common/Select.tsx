import React from "react";
import { ChevronDown } from "lucide-react";

/**
 * Props for the Select component.
 */
interface SelectProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  required?: boolean;
  error?: string;
}

/**
 * A reusable select dropdown component.
 * @param {SelectProps} props
 * @returns {JSX.Element}
 */
export function Select({ label, value, onChange, options, required, error }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-foreground">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>}
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className={`w-full px-3 py-2 rounded-lg border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent appearance-none transition ${error ? "border-red-300" : "border-border"}`}
        >
          <option value="">Select...</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="absolute right-2.5 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
      </div>
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}
