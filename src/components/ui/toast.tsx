"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ToastProps {
  message: string;
  type?: "info" | "success" | "warning" | "error";
  onDismiss?: () => void;
  className?: string;
}

export function Toast({ message, type = "info", onDismiss, className }: ToastProps) {
  const typeStyles = {
    info: "border-cinema-border bg-cinema-surface text-cinema-text",
    success: "border-emerald-800 bg-emerald-950/80 text-emerald-200",
    warning: "border-amber-800 bg-amber-950/80 text-amber-200",
    error: "border-red-800 bg-red-950/80 text-red-200",
  };

  return (
    <div
      role="alert"
      className={cn(
        "fixed bottom-5 right-5 z-50 flex items-center justify-between gap-3 rounded-lg border px-4 py-3 shadow-xl text-sm animate-fade-in max-w-sm",
        typeStyles[type],
        className
      )}
    >
      <span>{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-current opacity-70 hover:opacity-100 cursor-pointer p-0.5"
          aria-label="Dismiss toast"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
