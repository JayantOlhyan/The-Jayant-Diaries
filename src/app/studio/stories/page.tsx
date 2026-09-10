import { StoryRepository } from '@/server/repositories/story-repository';
import { TripRepository } from '@/server/repositories/trip-repository';
import { StoryLibraryClient } from '@/components/studio/stories/story-library-client';

export default async function StudioStoriesPage() {
  const [stories, trips] = await Promise.all([
    StoryRepository.getAllStories(),
    TripRepository.getAllStudioTrips(),
  ]);

  return <StoryLibraryClient initialStories={stories} trips={trips} />;
}
