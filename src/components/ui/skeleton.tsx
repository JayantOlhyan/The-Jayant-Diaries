import * as React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "rectangular" | "circular" | "text";
}

export function Skeleton({ className, variant = "rectangular", ...props }: SkeletonProps) {
  const variantStyles = {
    rectangular: "rounded-md",
    circular: "rounded-full",
    text: "rounded h-4 w-full",
  };

  return (
    <div
      className={cn("animate-pulse bg-cinema-border/60", variantStyles[variant], className)}
      {...props}
    />
  );
}
