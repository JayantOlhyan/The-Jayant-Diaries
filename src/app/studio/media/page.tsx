import { MediaRepository } from "@/server/repositories/media-repository";
import { TripRepository } from "@/server/repositories/trip-repository";
import { DayRepository } from "@/server/repositories/day-repository";
import { PlaceRepository } from "@/server/repositories/place-repository";
import { MediaManagerClient } from "@/components/studio/media-manager-client";

export default async function StudioMediaPage() {
  const [media, trips, days, places] = await Promise.all([
    MediaRepository.getAllStudioMedia(),
    TripRepository.getAllStudioTrips(),
    DayRepository.getAllDays(),
    PlaceRepository.getAllPlaces(),
  ]);

  return (
    <MediaManagerClient
      initialMedia={media}
      trips={trips}
      days={days}
      places={places}
    />
  );
}
