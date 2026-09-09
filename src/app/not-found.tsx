import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="max-w-md space-y-4">
        <span className="text-xs font-semibold uppercase tracking-cinematic text-cinema-accent">
          404 — Not Found
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white">
          Journey Lost in Transit
        </h1>
        <p className="text-xs sm:text-sm text-cinema-muted leading-relaxed">
          The journey, place, or memory you are seeking does not exist or has been placed in private archive.
        </p>
        <div className="pt-4">
          <Link href="/">
            <Button variant="secondary" size="md">
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
