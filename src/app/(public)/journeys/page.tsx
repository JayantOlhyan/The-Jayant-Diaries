import { Metadata } from "next";
import Image from "next/image";
import { TripRepository } from "@/server/repositories/trip-repository";
import { MediaRepository } from "@/server/repositories/media-repository";
import { JourneysClient } from "@/components/public/journeys-client";

export const metadata: Metadata = {
  title: "The Journeys — The Jayant Diaries",
  description: "A collection of roads, mountains, cities, and stories.",
};

export default async function JourneysPage() {
  const trips = await TripRepository.getPublicTrips();

  // Batched resolution of cover media for public trips (Zero N+1 queries)
  const coverIds = trips.map((t) => t.cover_media_id).filter(Boolean) as string[];
  const covers = coverIds.length > 0 ? await MediaRepository.getMediaByIds(coverIds) : [];
  const coverMap = new Map(covers.map((c) => [c.id, c]));

  const tripsWithCovers = trips.map((trip) => ({
    ...trip,
    cover: trip.cover_media_id ? coverMap.get(trip.cover_media_id) || null : null,
  }));

  const heroCoverUrl = covers[0]?.storage_url || null;

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 sm:py-16 space-y-12">
      {/* Editorial Header (Matches Reference Spec "Journeys Listing /journeys") */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/[0.08] pb-8">
        <div className="space-y-3">
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-amber-500/90 font-semibold">
            The Archive
          </span>
          <h1 className="font-serif text-4xl sm:text-6xl font-bold tracking-tight text-white">
            The Journeys
          </h1>
          <p className="text-sm text-neutral-400 max-w-xl font-sans">
            A collection of roads, mountains, cities and stories.
          </p>
        </div>

        <div className="text-right hidden md:block">
          <p className="font-serif italic text-neutral-300 text-base">
            &ldquo;Different places. A deeper you.&rdquo;
          </p>
          <p className="text-[11px] font-mono text-neutral-400 mt-1">
            Ladakh &bull; Spiti &bull; Rajasthan &bull; Kerala &bull; Beyond
          </p>
        </div>
      </div>

      {/* Editorial Hero Banner */}
      <div className="relative aspect-[21/9] sm:aspect-[24/8] w-full rounded-2xl overflow-hidden bg-neutral-950 border border-white/[0.08] shadow-2xl">
        {heroCoverUrl ? (
          <Image
            src={heroCoverUrl}
            alt="Travel archive vista"
            fill
            priority
            className="object-cover object-center scale-[1.01]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-950 to-[#0B0D0E]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D0E] via-transparent to-black/20" />

        <div className="absolute bottom-4 left-6 sm:bottom-6 sm:left-8 z-10">
          <span className="px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest bg-black/60 text-white/90 border border-white/10 backdrop-blur-md">
            The Trans-Himalayan Highway
          </span>
        </div>
      </div>

      {/* Interactive Category Filter Pills and Journeys Grid */}
      <JourneysClient initialTrips={tripsWithCovers} />
    </div>
  );
}
