import { NextRequest, NextResponse } from 'next/server';
import { PlaceRepository } from '@/server/repositories/place-repository';

export const dynamic = 'force-dynamic';

/**
 * GET /api/map
 * Public geographic archive data endpoint.
 * Returns only publicly visible places with valid coordinates and their related public journeys.
 * Optional query parameter: `journey=<journey-slug>` to filter by a specific public journey.
 * Zero private data leakage guaranteed by the repository layer.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const journey = searchParams.get('journey') || undefined;

  try {
    const [places, journeys] = await Promise.all([
      PlaceRepository.getPublicMapPlaces(journey),
      PlaceRepository.getPublicJourneysForMap(),
    ]);

    return NextResponse.json(
      {
        places,
        journeys,
        activeJourney: journey || null,
        totalMapped: places.length,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching public map data:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve geographic archive data' },
      { status: 500 }
    );
  }
}
