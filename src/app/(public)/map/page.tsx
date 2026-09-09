import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Interactive Travel Map",
  description: "Geographic exploration of visited places and journeys.",
};

export default function MapPage() {
  return (
    <div className="relative h-[calc(100vh-80px)] w-full bg-cinema-bg flex items-center justify-center">
      <div className="text-center p-8 border border-cinema-border bg-cinema-surface/60 rounded-xl backdrop-blur-md max-w-md">
        <h2 className="font-serif text-2xl font-bold text-white mb-2">Interactive Travel Map</h2>
        <p className="text-xs text-cinema-muted leading-relaxed">
          Geographic map explorer with cluster pins, place detail overlays, and route visualization will be wired to the map adapter in Phase 5.
        </p>
      </div>
    </div>
  );
}
