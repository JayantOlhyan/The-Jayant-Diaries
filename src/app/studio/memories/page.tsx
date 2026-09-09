import { MemoryRepository } from "@/server/repositories/memory-repository";
import { TripRepository } from "@/server/repositories/trip-repository";
import { DayRepository } from "@/server/repositories/day-repository";
import { PlaceRepository } from "@/server/repositories/place-repository";
import { MemoriesManagerClient } from "@/components/studio/memories-manager-client";

export default async function StudioMemoriesPage() {
  const [memories, trips, days, places] = await Promise.all([
    MemoryRepository.getAllMemories(),
    TripRepository.getAllStudioTrips(),
    DayRepository.getAllDays(),
    PlaceRepository.getAllPlaces(),
  ]);

  return (
    <MemoriesManagerClient
      initialMemories={memories}
      trips={trips}
      days={days}
      places={places}
    />
  );
}
