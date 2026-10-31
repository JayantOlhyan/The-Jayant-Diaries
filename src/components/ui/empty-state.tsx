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
      role="status"
      aria-label={title}
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-cinema-border/80 bg-cinema-surface/40 p-12 text-center backdrop-blur-sm",
        className
      )}
    >
      {icon ? (
        <div className="mb-4 text-cinema-accent">{icon}</div>
      ) : (
        <div className="mb-4 rounded-full bg-cinema-elevated p-3 text-cinema-muted border border-white/5">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 12H4M4 12l6-6M4 12l6 6" />
          </svg>
        </div>
      )}
      <h3 className="font-serif text-lg font-semibold text-cinema-text tracking-wide">{title}</h3>
      <p className="mt-2 max-w-sm font-sans text-xs sm:text-sm text-cinema-muted leading-relaxed font-light">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
