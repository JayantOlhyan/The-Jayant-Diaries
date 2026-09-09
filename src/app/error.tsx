"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to server/observability pipeline
    console.error("Application error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="max-w-md space-y-4">
        <span className="text-xs font-semibold uppercase tracking-cinematic text-red-400">
          500 — System Failure
        </span>
        <h1 className="font-serif text-3xl font-bold text-white">Something went wrong</h1>
        <p className="text-xs sm:text-sm text-cinema-muted leading-relaxed">
          An unexpected error occurred while rendering this page. The issue has been recorded.
        </p>
        <div className="pt-4 flex items-center justify-center gap-3">
          <Button variant="secondary" size="md" onClick={() => reset()}>
            Try Again
          </Button>
          <Button variant="ghost" size="md" onClick={() => (window.location.href = "/")}>
            Return Home
          </Button>
        </div>
      </div>
    </div>
  );
}
