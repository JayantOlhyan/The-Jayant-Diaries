import { Metadata } from "next";
import { CurationRepository } from "@/server/repositories/curation-repository";
import { TripRepository } from "@/server/repositories/trip-repository";
import { DayRepository } from "@/server/repositories/day-repository";
import { PlaceRepository } from "@/server/repositories/place-repository";
import { ArchiveCurationClient } from "@/components/studio/curation/archive-curation-client";

export const metadata: Metadata = {
  title: "Archive Curation | The Jayant Diaries Studio",
  description: "Editorial curation, archive health inspection, and publication readiness workspace.",
};

export default async function StudioArchivePage() {
  const [health, queue, duplicateGroups, trips, days, places] = await Promise.all([
    CurationRepository.getArchiveHealth(),
    CurationRepository.getReviewQueue({}, 50, 0),
    CurationRepository.getDuplicateGroups(),
    TripRepository.getAllStudioTrips(),
    DayRepository.getAllDays(),
    PlaceRepository.getAllPlaces(),
  ]);

  return (
    <ArchiveCurationClient
      initialHealth={health}
      initialQueue={queue}
      initialDuplicates={duplicateGroups}
      trips={trips}
      days={days}
      places={places}
    />
  );
}
