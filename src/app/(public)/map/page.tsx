import { Metadata } from 'next';
import { PlaceRepository } from '@/server/repositories/place-repository';
import { MapExplorerClient } from '@/components/map/map-explorer-client';

interface MapPageProps {
  searchParams: Promise<{ journey?: string }>;
}

export async function generateMetadata({ searchParams }: MapPageProps): Promise<Metadata> {
  const { journey } = await searchParams;

  return {
    title: journey
      ? `Atlas: ${journey} — The Jayant Diaries`
      : 'Geographic Atlas — The Jayant Diaries',
    description:
      'Spatial archive and geographic visualization of journeys, waypoints, and field expeditions.',
    alternates: {
      canonical: '/map',
    },
    robots: {
      index: !journey, // Only index the canonical /map without query variants
      follow: true,
    },
  };
}

export default async function MapPage({ searchParams }: MapPageProps) {
  const { journey } = await searchParams;

  const [allPublicPlaces, mappedPlaces, availableJourneys] = await Promise.all([
    PlaceRepository.getPublicPlaces(),
    PlaceRepository.getPublicMapPlaces(),
    PlaceRepository.getPublicJourneysForMap(),
  ]);

  const totalUnmappedPlaces = Math.max(0, allPublicPlaces.length - mappedPlaces.length);

  return (
    <main className="w-full min-h-[calc(100vh-73px)] bg-[#0B0D0E]">
      <MapExplorerClient
        initialPlaces={mappedPlaces}
        availableJourneys={availableJourneys}
        initialJourneySlug={journey}
        totalUnmappedPlaces={totalUnmappedPlaces}
      />
    </main>
  );
}
