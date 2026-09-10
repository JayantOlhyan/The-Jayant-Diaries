import { notFound } from 'next/navigation';
import { StoryRepository } from '@/server/repositories/story-repository';
import { StoryPreviewClient } from '@/components/studio/stories/story-preview-client';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function StudioStoryPreviewPage({ params }: PageProps) {
  const { id } = await params;
  const story = await StoryRepository.getStoryById(id);

  if (!story) {
    notFound();
  }

  return <StoryPreviewClient story={story} />;
}
