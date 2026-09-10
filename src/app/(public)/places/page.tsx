import { Metadata } from "next";
import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
import { PlaceRepository } from "@/server/repositories/place-repository";
import { ImageFrame } from "@/components/ui/image-frame";

import { MediaRepository } from "@/server/repositories/media-repository";

export const metadata: Metadata = {
  title: "Places — The Jayant Diaries",
  description: "Browse destinations, mountain passes, lakes, and high-altitude settlements.",
};

interface PlacesPageProps {
  searchParams: Promise<{ region?: string }>;
}

export default async function PlacesPage({ searchParams }: PlacesPageProps) {
  const { region = 'ALL' } = await searchParams;
  const [places, allMedia] = await Promise.all([
    PlaceRepository.getAllPlaces(),
    MediaRepository.getPublicMedia(),
  ]);

  const regions = Array.from(
    new Set(places.map((p) => p.state || p.country).filter(Boolean) as string[])
  );

  const filteredPlaces =
    region.toUpperCase() === 'ALL'
      ? places
      : places.filter((p) => (p.state || p.country)?.toLowerCase() === region.toLowerCase());

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 sm:py-16 space-y-12 pb-24">
      <div className="space-y-4 border-b border-white/[0.08] pb-8">
        <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-amber-500/90 font-semibold">
          Geography & Waypoints
        </span>
        <h1 className="font-serif text-4xl sm:text-6xl font-bold tracking-tight text-white">
          Places & Waypoints
        </h1>
        <p className="text-sm text-neutral-400 max-w-xl font-sans">
          Mountain passes, high-altitude lakes, and remote valleys documented along the road.
        </p>

        {/* Region Filter Pills */}
        <div className="flex items-center gap-2 pt-4 overflow-x-auto scrollbar-none">
          <Link
            href="/places?region=ALL"
            className={`px-3.5 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
              region.toUpperCase() === 'ALL'
                ? 'bg-white text-black font-bold'
                : 'bg-white/[0.04] text-neutral-400 hover:text-white border border-white/[0.08]'
            }`}
          >
            All Regions ({places.length})
          </Link>
          {regions.map((r) => (
            <Link
              key={r}
              href={`/places?region=${encodeURIComponent(r)}`}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
                region.toLowerCase() === r.toLowerCase()
                  ? 'bg-white text-black font-bold'
                  : 'bg-white/[0.04] text-neutral-400 hover:text-white border border-white/[0.08]'
              }`}
            >
              {r}
            </Link>
          ))}
        </div>
      </div>

      {filteredPlaces.length === 0 ? (
        <div className="py-24 text-center rounded-2xl border border-white/[0.06] bg-neutral-900/20 space-y-3">
          <span className="text-xs font-mono uppercase tracking-widest text-amber-500">
            Waypoints Index
          </span>
          <p className="font-serif text-xl text-neutral-300">
            No waypoints recorded in this region.
          </p>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto font-light">
            Destinations and geographical markers will be listed once archived.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPlaces.map((place) => {
            const placeMedia = allMedia.find((m) => m.place_id === place.id);
            const cover = placeMedia?.storage_url || '';

            return (
              <Link
                key={place.id}
                href={`/places/${place.slug}`}
                className="group flex flex-col space-y-4 rounded-2xl overflow-hidden bg-neutral-900/30 border border-white/[0.08] hover:border-white/20 transition-all duration-300 p-3"
              >
                <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-black">
                  <ImageFrame
                    src={cover}
                    alt={place.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />

                  {place.latitude && place.longitude && (
                    <div className="absolute bottom-3 left-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono text-amber-400 bg-black/70 border border-white/10 backdrop-blur-md flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" />
                        {place.latitude.toFixed(2)}° N, {place.longitude.toFixed(2)}° E
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 p-1 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-baseline justify-between">
                      <h2 className="font-serif text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                        {place.name}
                      </h2>
                      <span className="text-[11px] font-mono text-neutral-400">
                        {place.state || place.country}
                      </span>
                    </div>
                    {place.description && (
                      <p className="text-xs text-neutral-400 font-sans line-clamp-2 mt-1">
                        {place.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                    <span>Explore Waypoint</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
