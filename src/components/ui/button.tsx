import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "cinematic";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading = false, disabled, children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none";

    const sizeStyles = {
      sm: "text-xs px-3 py-1.5 rounded-sm gap-1.5",
      md: "text-sm px-4 py-2 rounded-md gap-2",
      lg: "text-base px-6 py-3 rounded-md gap-2.5 tracking-wide",
    };

    const variantStyles = {
      primary: "bg-cinema-accent hover:bg-cinema-accent-hover text-white shadow-sm font-semibold",
      secondary: "bg-cinema-surface hover:bg-cinema-elevated text-cinema-text border border-cinema-border",
      ghost: "hover:bg-cinema-surface text-cinema-text hover:text-white",
      danger: "bg-red-600 hover:bg-red-700 text-white shadow-sm",
      cinematic:
        "bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 hover:border-white/40 shadow-lg tracking-editorial uppercase text-xs font-semibold",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
