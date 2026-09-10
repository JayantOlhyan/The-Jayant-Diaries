import { verifyStudioAuth } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import { TimelineRepository } from '@/server/repositories/timeline-repository';
import { TimelineClient } from '@/components/studio/timeline/timeline-client';

export const dynamic = 'force-dynamic';

export default async function StudioTimelinePage() {
  const auth = await verifyStudioAuth();
  if (!auth.authenticated) {
    redirect('/studio');
  }

  const [timeline, stats, evolution, repeatedPlaces, completeness] = await Promise.all([
    TimelineRepository.getChronologicalTimeline(),
    TimelineRepository.getTravelStatistics(),
    TimelineRepository.getYearOverYearEvolution(),
    TimelineRepository.getRepeatedPlaces(),
    TimelineRepository.getArchiveCompletenessReport(),
  ]);

  const initialData = {
    timeline,
    stats,
    evolution,
    repeatedPlaces,
    completeness,
  };

  return <TimelineClient initialData={initialData} />;
}
