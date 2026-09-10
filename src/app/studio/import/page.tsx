import { Metadata } from 'next';
import { TripRepository } from '@/server/repositories/trip-repository';
import { DayRepository } from '@/server/repositories/day-repository';
import { PlaceRepository } from '@/server/repositories/place-repository';
import { ImportWorkspace } from '@/components/studio/import/import-workspace';

export const metadata: Metadata = {
  title: 'Smart Archive Ingestion — Studio | The Jayant Diaries',
  description: 'Deterministic batch media ingestion, EXIF inspection, and travel journey organization.',
};

export default async function StudioImportPage() {
  const [trips, days, places] = await Promise.all([
    TripRepository.getAllStudioTrips(),
    DayRepository.getAllDays(),
    PlaceRepository.getAllPlaces(),
  ]);

  return <ImportWorkspace trips={trips} days={days} places={places} />;
}
