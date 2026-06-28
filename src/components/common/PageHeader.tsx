import React from "react";

/**
 * Props for the PageHeader component.
 */
interface PageHeaderProps {
  title: string;
  sub?: string;
  action?: React.ReactNode;
}

/**
 * Renders the top header section of a page with a title, optional subtitle, and optional action buttons.
 * @param {PageHeaderProps} props
 * @returns {JSX.Element}
 */
export function PageHeader({ title, sub, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        {sub && <p className="text-muted-foreground text-sm mt-0.5">{sub}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
