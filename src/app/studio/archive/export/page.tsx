import { verifyStudioAuth } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import { ArchiveRepository } from '@/server/repositories/archive-repository';
import { ArchiveExportClient } from '@/components/studio/archive/archive-export-client';

export const dynamic = 'force-dynamic';

export default async function ArchiveExportPage() {
  const auth = await verifyStudioAuth();
  if (!auth.authenticated) {
    redirect('/studio');
  }

  const entities = await ArchiveRepository.exportAllEntities();

  const initialCounts = {
    trips: entities.trips.length,
    days: entities.days.length,
    places: entities.places.length,
    memories: entities.memories.length,
    media: entities.media.length,
    stories: entities.stories.length,
    tags: entities.tags.length,
    imports: entities.import_sessions.length,
  };

  return <ArchiveExportClient initialCounts={initialCounts} />;
}
