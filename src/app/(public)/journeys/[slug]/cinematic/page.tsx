import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { TripRepository } from '@/server/repositories/trip-repository';
import { CinematicJourneyClient } from '@/components/public/cinematic-journey-client';

interface CinematicPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CinematicPageProps): Promise<Metadata> {
  const { slug } = await params;
  const journey = await TripRepository.getCinematicJourneyBySlug(slug);

  if (!journey) {
    return {
      title: 'Journey Not Found — The Jayant Diaries',
    };
  }

  return {
    title: `${journey.trip.title} (Cinematic Experience) — The Jayant Diaries`,
    description: journey.trip.description || undefined,
    robots: {
      index: false,
      follow: true,
    },
    alternates: {
      canonical: `/journeys/${slug}`,
    },
  };
}

export default async function CinematicJourneyPage({ params }: CinematicPageProps) {
  const { slug } = await params;
  const journey = await TripRepository.getCinematicJourneyBySlug(slug);

  if (!journey) {
    notFound();
  }

  return <CinematicJourneyClient journey={journey} />;
}
