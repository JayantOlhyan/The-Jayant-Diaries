import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "interactive";
}

export function Card({ className, variant = "default", ...props }: CardProps) {
  const variantStyles = {
    default: "bg-cinema-surface border border-cinema-border",
    elevated: "bg-cinema-elevated border border-cinema-border/80 shadow-md",
    interactive:
      "bg-cinema-surface border border-cinema-border hover:border-cinema-accent/60 hover:bg-cinema-elevated transition-all duration-300 cursor-pointer group",
  };

  return <div className={cn("rounded-lg overflow-hidden", variantStyles[variant], className)} {...props} />;
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-4 border-b border-cinema-border/50", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-lg font-semibold tracking-tight text-cinema-text", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-xs text-cinema-muted mt-1 leading-relaxed", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-4", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-3 border-t border-cinema-border/50 flex items-center", className)} {...props} />;
}
