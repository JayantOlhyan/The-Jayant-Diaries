'use server';

import { revalidatePath } from 'next/cache';
import { StoryRepository, StoryInsert, StoryUpdate } from '@/server/repositories/story-repository';
import { verifyStudioAuth } from '@/lib/auth/server';
import { StoryBlock } from '@/types/entities';
import { StoryStatus } from '@/types/database';

export async function getStudioStoriesAction() {
  try {
    const auth = await verifyStudioAuth();
    if (!auth.authenticated) {
      return { success: false, error: auth.error || 'Unauthorized: Valid Studio session required', stories: [] };
    }

    const stories = await StoryRepository.getStudioStories();
    return { success: true, stories };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch studio stories', stories: [] };
  }
}

export async function getStoryDetailAction(id: string) {
  try {
    const auth = await verifyStudioAuth();
    if (!auth.authenticated) {
      return { success: false, error: auth.error || 'Unauthorized: Valid Studio session required', story: null };
    }

    if (!id || typeof id !== 'string' || id.trim() === '') {
      return { success: false, error: 'Valid story ID is required', story: null };
    }

    const story = await StoryRepository.getStoryById(id.trim());
    if (!story) {
      return { success: false, error: 'Story not found', story: null };
    }

    return { success: true, story };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch story detail', story: null };
  }
}

export async function createStoryDraftAction(payload: {
  trip_id: string;
  title: string;
  slug: string;
  subtitle?: string | null;
}) {
  try {
    const auth = await verifyStudioAuth();
    if (!auth.authenticated) {
      return { success: false, error: auth.error || 'Unauthorized: Valid Studio session required' };
    }

    if (!payload.title || !payload.title.trim()) {
      return { success: false, error: 'Title is required' };
    }
    if (!payload.slug || !payload.slug.trim()) {
      return { success: false, error: 'Slug is required' };
    }

    const insertData: StoryInsert = {
      trip_id: payload.trip_id,
      title: payload.title.trim(),
      slug: payload.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      subtitle: payload.subtitle ? payload.subtitle.trim() : null,
      status: 'DRAFT',
      content: JSON.stringify([]),
    };

    const created = await StoryRepository.createStory(insertData);

    revalidatePath('/studio/stories');
    revalidatePath('/stories');
    return { success: true, story: created };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create story draft' };
  }
}

export async function updateStoryAction(
  id: string,
  payload: {
    title?: string;
    slug?: string;
    subtitle?: string | null;
    cover_media_id?: string | null;
    content?: StoryBlock[];
    trip_id?: string | null;
    status?: StoryStatus;
  }
) {
  try {
    const auth = await verifyStudioAuth();
    if (!auth.authenticated) {
      return { success: false, error: auth.error || 'Unauthorized: Valid Studio session required' };
    }

    if (!id || typeof id !== 'string' || id.trim() === '') {
      return { success: false, error: 'Valid story ID is required' };
    }

    const updateData: StoryUpdate = {};
    if (payload.title !== undefined) updateData.title = payload.title.trim();
    if (payload.slug !== undefined) updateData.slug = payload.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (payload.subtitle !== undefined) updateData.subtitle = payload.subtitle ? payload.subtitle.trim() : null;
    if (payload.cover_media_id !== undefined) updateData.cover_media_id = payload.cover_media_id;
    if (payload.trip_id !== undefined) updateData.trip_id = payload.trip_id;
    if (payload.status !== undefined) updateData.status = payload.status;
    if (payload.content !== undefined) {
      updateData.content = JSON.stringify(payload.content);
    }

    const updated = await StoryRepository.updateStory(id.trim(), updateData);
    if (!updated) {
      return { success: false, error: 'Story not found for update' };
    }

    revalidatePath(`/studio/stories/${id}`);
    revalidatePath('/studio/stories');
    revalidatePath('/stories');
    if (updated.slug) {
      revalidatePath(`/stories/${updated.slug}`);
    }

    return { success: true, story: updated };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update story' };
  }
}

export async function checkStoryReadinessAction(id: string) {
  try {
    const auth = await verifyStudioAuth();
    if (!auth.authenticated) {
      return { success: false, error: auth.error || 'Unauthorized: Valid Studio session required', readiness: null };
    }

    if (!id || typeof id !== 'string' || id.trim() === '') {
      return { success: false, error: 'Valid story ID is required', readiness: null };
    }

    const readiness = await StoryRepository.checkStoryReadiness(id.trim());
    return { success: true, readiness };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to check story readiness', readiness: null };
  }
}

export async function publishStoryAction(id: string) {
  try {
    const auth = await verifyStudioAuth();
    if (!auth.authenticated) {
      return { success: false, error: auth.error || 'Unauthorized: Valid Studio session required' };
    }

    if (!id || typeof id !== 'string' || id.trim() === '') {
      return { success: false, error: 'Valid story ID is required' };
    }

    const readiness = await StoryRepository.checkStoryReadiness(id.trim());
    if (!readiness.isReady) {
      return {
        success: false,
        error: `Story is not ready to publish. Missing requirements: ${readiness.reasons.join(', ')}`,
        readiness,
      };
    }

    const updated = await StoryRepository.updateStoryStatus(id.trim(), 'PUBLISHED');

    revalidatePath(`/studio/stories/${id}`);
    revalidatePath('/studio/stories');
    revalidatePath('/stories');
    if (updated.slug) {
      revalidatePath(`/stories/${updated.slug}`);
    }

    return { success: true, story: updated };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to publish story' };
  }
}

export async function archiveStoryAction(id: string) {
  try {
    const auth = await verifyStudioAuth();
    if (!auth.authenticated) {
      return { success: false, error: auth.error || 'Unauthorized: Valid Studio session required' };
    }

    if (!id || typeof id !== 'string' || id.trim() === '') {
      return { success: false, error: 'Valid story ID is required' };
    }

    const updated = await StoryRepository.updateStoryStatus(id.trim(), 'ARCHIVED');

    revalidatePath(`/studio/stories/${id}`);
    revalidatePath('/studio/stories');
    revalidatePath('/stories');
    if (updated.slug) {
      revalidatePath(`/stories/${updated.slug}`);
    }

    return { success: true, story: updated };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to archive story' };
  }
}

export async function deleteStoryAction(id: string) {
  try {
    const auth = await verifyStudioAuth();
    if (!auth.authenticated) {
      return { success: false, error: auth.error || 'Unauthorized: Valid Studio session required' };
    }

    if (!id || typeof id !== 'string' || id.trim() === '') {
      return { success: false, error: 'Valid story ID is required' };
    }

    await StoryRepository.deleteStory(id.trim());

    revalidatePath('/studio/stories');
    revalidatePath('/stories');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete story' };
  }
}
