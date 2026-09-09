import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "public" | "unlisted" | "private" | "accent" | "outline" | "success" | "secondary";
  size?: "sm" | "md";
}

export function Badge({ className, variant = "default", size = "md", ...props }: BadgeProps) {
  const variantStyles = {
    default: "bg-cinema-elevated text-cinema-muted border-cinema-border",
    public: "bg-emerald-950/60 text-emerald-300 border-emerald-800/60",
    success: "bg-emerald-950/60 text-emerald-300 border-emerald-800/60",
    unlisted: "bg-amber-950/60 text-amber-300 border-amber-800/60",
    private: "bg-zinc-800/80 text-zinc-400 border-zinc-700",
    accent: "bg-cinema-accent/20 text-amber-300 border-cinema-accent/40",
    outline: "border-cinema-border text-cinema-text",
    secondary: "bg-zinc-800 text-zinc-300 border-zinc-700",
  };

  const sizeStyles = {
    sm: "px-1.5 py-0.5 text-[10px]",
    md: "px-2 py-0.5 text-[11px]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded font-medium uppercase tracking-wider border",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    />
  );
}
