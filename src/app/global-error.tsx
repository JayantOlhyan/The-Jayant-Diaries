"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log safe error message to console / observability pipeline
    console.error("Global application boundary caught error:", error?.message || "Unknown root error");
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0B0D0E] text-white flex items-center justify-center p-6 antialiased font-sans">
        <div className="max-w-md text-center space-y-4">
          <span className="text-xs font-mono uppercase tracking-widest text-amber-500 font-semibold">
            System Incident
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
            Unexpected Error
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed font-light">
            A critical error occurred while rendering the archive. You may attempt to recover the session or return to the main archive.
          </p>
          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="px-5 py-2 rounded-lg bg-white text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-white/90 transition-colors"
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={() => (window.location.href = "/")}
              className="px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-300 text-xs font-mono uppercase tracking-wider transition-colors border border-white/10"
            >
              Return Home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
