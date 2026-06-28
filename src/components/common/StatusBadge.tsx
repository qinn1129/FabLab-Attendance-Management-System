import React from "react";

/**
 * Renders a color-coded status badge for commissions or RM status.
 * @param {Object} props
 * @param {string} props.status
 * @returns {JSX.Element}
 */
export function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    "Pending": "bg-yellow-50 text-yellow-700 border border-yellow-200",
    "Approved": "bg-green-50 text-green-700 border border-green-200",
    "In Progress": "bg-blue-50 text-blue-700 border border-blue-200",
    "Completed": "bg-emerald-50 text-emerald-700 border border-emerald-200",
    "Rejected": "bg-red-50 text-red-700 border border-red-200",
    "Awaiting Approval": "bg-orange-50 text-orange-700 border border-orange-200",
    "Active": "bg-emerald-50 text-emerald-700 border border-emerald-200",
    "On Leave": "bg-gray-100 text-gray-500 border border-gray-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium font-mono ${cfg[status] || "bg-gray-100 text-gray-500"}`}>
      {status}
    </span>
  );
}
