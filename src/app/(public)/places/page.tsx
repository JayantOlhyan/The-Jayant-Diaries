import { Metadata } from "next";
import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
import { PlaceRepository } from "@/server/repositories/place-repository";
import { ImageFrame } from "@/components/ui/image-frame";

export const metadata: Metadata = {
  title: "Places — The Jayant Diaries",
  description: "Browse destinations, mountain passes, lakes, and high-altitude settlements.",
};

const PLACE_COVERS: Record<string, string> = {
  leh: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
  'magnetic-hill': 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80',
  'nubra-valley': 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&auto=format&fit=crop&q=80',
  'khardung-la': 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop&q=80',
  'pangong-lake': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
};

interface PlacesPageProps {
  searchParams: Promise<{ region?: string }>;
}

export default async function PlacesPage({ searchParams }: PlacesPageProps) {
  const { region = 'ALL' } = await searchParams;
  const places = await PlaceRepository.getAllPlaces();

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredPlaces.map((place) => {
          const cover = PLACE_COVERS[place.slug] || PLACE_COVERS['leh'];

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
    </div>
  );
}
