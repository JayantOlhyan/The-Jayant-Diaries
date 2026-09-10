import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { TripRepository } from '@/server/repositories/trip-repository';
import { StoryRepository } from '@/server/repositories/story-repository';
import { JourneyDetailClient } from '@/components/public/journey-detail-client';

interface JourneyPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: JourneyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const trip = await TripRepository.getPublicTripBySlug(slug);

  if (!trip) {
    return {
      title: 'Journey Not Found — The Jayant Diaries',
    };
  }

  return {
    title: `${trip.title} — The Jayant Diaries`,
    description: trip.description || undefined,
  };
}

export default async function JourneyDetailPage({ params }: JourneyPageProps) {
  const { slug } = await params;
  const trip = await TripRepository.getPublicTripBySlug(slug);

  if (!trip) {
    notFound();
  }

  const [details, stories] = await Promise.all([
    TripRepository.getTripWithDetails(trip.id),
    StoryRepository.getPublishedStoriesByTripId(trip.id),
  ]);

  if (!details) {
    notFound();
  }

  return <JourneyDetailClient trip={details} stories={stories} />;
}
