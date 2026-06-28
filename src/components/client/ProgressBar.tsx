import React from "react";
import { Check } from "lucide-react";

/**
 * ProgressBar component for the multi-step Commission Request form.
 * Domain: Client
 * @param {Object} props
 * @param {number} props.step 
 * @param {string[]} props.steps
 * @returns {JSX.Element}
 */
export function ProgressBar({ step, steps }: { step: number; steps: string[] }) {
  return (
    <div className="flex items-center justify-between mb-8 relative">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full -z-10" />
      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-violet-600 rounded-full -z-10 transition-all duration-300" style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }} />
      {steps.map((s, i) => {
        const isPast = step > i + 1;
        const isCur = step === i + 1;
        return (
          <div key={s} className="flex flex-col items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${isPast ? "bg-violet-600 text-white" : isCur ? "bg-violet-600 text-white ring-4 ring-violet-200" : "bg-gray-200 text-gray-500"}`}>
              {isPast ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-xs font-medium absolute -bottom-6 whitespace-nowrap ${isCur ? "text-violet-700" : "text-gray-500"}`}>
              {s}
            </span>
          </div>
        );
      })}
    </div>
  );
}
