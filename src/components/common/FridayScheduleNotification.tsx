import React from "react";
import { Calendar, X } from "lucide-react";

interface FridayScheduleNotificationProps {
  onDismiss: () => void;
}

/**
 * A sleek notification banner for Resident Makers displayed on Fridays
 * reminding them to input their schedule for next week.
 * Fits non-intrusively in the top-right of the homepage.
 */
export function FridayScheduleNotification({ onDismiss }: FridayScheduleNotificationProps) {
  return (
    <div className="flex items-center gap-3 bg-red-900/90 dark:bg-red-950/90 border border-red-500/40 text-red-50 px-3.5 py-2.5 rounded-xl shadow-md transition-all duration-200 max-w-sm">
      <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
        <Calendar className="w-4.5 h-4.5 text-red-400" />
      </div>
      <div className="flex-1 min-w-0 pr-1">
        <p className="text-xs font-semibold text-red-300 uppercase tracking-wider">Schedule Reminder</p>
        <p className="text-xs text-red-100/90 leading-tight">Please input your schedule for next week.</p>
      </div>
      <button
        onClick={onDismiss}
        className="p-1 rounded-md hover:bg-red-800/60 text-red-300 hover:text-white transition flex-shrink-0"
        aria-label="Dismiss notification"
        title="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
