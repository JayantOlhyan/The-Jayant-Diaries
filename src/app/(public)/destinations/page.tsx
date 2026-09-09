import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Destinations",
  description: "Browse destinations, states, and regions explored.",
};

export default function DestinationsPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <div className="space-y-2 border-b border-cinema-border pb-6">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-white">Destinations</h1>
        <p className="text-xs uppercase tracking-wider text-cinema-muted">
          States, countries, and geographical regions
        </p>
      </div>
      <div className="mt-8 text-center text-sm text-cinema-muted py-24">
        Destination collections will be derived dynamically from visited places.
      </div>
    </div>
  );
}
