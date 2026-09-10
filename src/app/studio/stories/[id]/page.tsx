import { notFound } from 'next/navigation';
import { StoryRepository } from '@/server/repositories/story-repository';
import { TripRepository } from '@/server/repositories/trip-repository';
import { MediaRepository } from '@/server/repositories/media-repository';
import { MemoryRepository } from '@/server/repositories/memory-repository';
import { PlaceRepository } from '@/server/repositories/place-repository';
import { StoryEditorClient } from '@/components/studio/stories/story-editor-client';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function StudioStoryEditorPage({ params }: PageProps) {
  const { id } = await params;

  const [story, trips, availableMedia, availableMemories, availablePlaces] = await Promise.all([
    StoryRepository.getStoryById(id),
    TripRepository.getAllStudioTrips(),
    MediaRepository.getAllStudioMedia(),
    MemoryRepository.getAllMemories(),
    PlaceRepository.getAllPlaces(),
  ]);

  if (!story) {
    notFound();
  }

  return (
    <StoryEditorClient
      story={story}
      trips={trips}
      availableMedia={availableMedia}
      availableMemories={availableMemories}
      availablePlaces={availablePlaces}
    />
  );
}
