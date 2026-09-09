import { Metadata } from "next";
import { MediaRepository } from "@/server/repositories/media-repository";
import { TripRepository } from "@/server/repositories/trip-repository";
import { PlaceRepository } from "@/server/repositories/place-repository";
import { PublicMediaClient } from "@/components/media/public-media-client";

export const metadata: Metadata = {
  title: "Media Archive — The Jayant Diaries",
  description: "Photographs, cinematic YouTube films, and Instagram travel chronicles.",
};

export default async function MediaArchivePage() {
  const [publicMedia, publicTrips, allPlaces] = await Promise.all([
    MediaRepository.getPublicMedia(100),
    TripRepository.getPublicTrips(),
    PlaceRepository.getAllPlaces(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 sm:py-16 space-y-12">
      <div className="space-y-3 border-b border-white/[0.08] pb-8">
        <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-amber-500/90 font-semibold">
          Visual Chronicle
        </span>
        <h1 className="font-serif text-4xl sm:text-6xl font-bold tracking-tight text-white">
          The Archive
        </h1>
        <p className="text-sm text-neutral-400 max-w-xl font-sans">
          Photography. Films. Moments. A larger story.
        </p>
      </div>

      <PublicMediaClient
        initialMedia={publicMedia}
        trips={publicTrips}
        places={allPlaces}
      />
    </div>
  );
}

