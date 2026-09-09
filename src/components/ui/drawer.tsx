"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  position?: "right" | "bottom";
  className?: string;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  position = "right",
  className,
}: DrawerProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const positionStyles = {
    right: "inset-y-0 right-0 max-w-md w-full border-l border-cinema-border",
    bottom: "inset-x-0 bottom-0 max-h-[85vh] w-full border-t border-cinema-border rounded-t-2xl",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "fixed bg-cinema-surface p-6 shadow-2xl overflow-y-auto flex flex-col justify-between animate-fade-in",
          positionStyles[position],
          className
        )}
      >
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-cinema-border">
            {title && <h3 className="text-base font-semibold text-cinema-text">{title}</h3>}
            <button
              onClick={onClose}
              aria-label="Close drawer"
              className="rounded-md p-1.5 text-cinema-muted hover:bg-cinema-elevated hover:text-white cursor-pointer"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="py-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
