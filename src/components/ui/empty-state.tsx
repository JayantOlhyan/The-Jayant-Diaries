import * as React from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-cinema-border/80 p-12 text-center",
        className
      )}
    >
      {icon ? (
        <div className="mb-4 text-cinema-muted">{icon}</div>
      ) : (
        <div className="mb-4 rounded-full bg-cinema-elevated p-3 text-cinema-muted">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 12H4M4 12l6-6M4 12l6 6" />
          </svg>
        </div>
      )}
      <h3 className="text-base font-semibold text-cinema-text">{title}</h3>
      <p className="mt-1.5 max-w-sm text-xs text-cinema-muted leading-relaxed">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
