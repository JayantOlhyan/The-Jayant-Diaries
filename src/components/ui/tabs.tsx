"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn("flex space-x-1 border-b border-cinema-border/60 pb-px", className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all duration-150 border-b-2 -mb-px flex items-center gap-2 cursor-pointer",
              isActive
                ? "border-cinema-accent text-white"
                : "border-transparent text-cinema-muted hover:text-cinema-text hover:border-cinema-border"
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded text-[10px]",
                  isActive ? "bg-cinema-accent/20 text-amber-300" : "bg-cinema-elevated text-cinema-muted"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
