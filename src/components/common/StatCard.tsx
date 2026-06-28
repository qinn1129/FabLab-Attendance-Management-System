import React from "react";
import { cn } from "../../lib/utils";

/**
 * Props for the StatCard component.
 */
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}

/**
 * Displays a metric or statistic in a bordered card layout.
 * @param {StatCardProps} props
 * @returns {JSX.Element}
 */
export function StatCard({ label, value, sub, color }: StatCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide mb-2">{label}</p>
      <p className={cn("text-3xl font-bold mb-1", color)}>{value}</p>
      {sub && <p className="text-muted-foreground text-xs">{sub}</p>}
    </div>
  );
}
