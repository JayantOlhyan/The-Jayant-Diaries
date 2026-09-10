import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StoryRepository } from '../story-repository';
import {
  getStudioStoriesAction,
  getStoryDetailAction,
  createStoryDraftAction,
  updateStoryAction,
  checkStoryReadinessAction,
  publishStoryAction,
  archiveStoryAction,
  deleteStoryAction,
} from '../../actions/story-actions';
import { StoryBlock } from '@/types/entities';

describe('Phase 14: Editorial Memory & Storytelling Layer', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.TEST_AUTH_OVERRIDE = 'authenticated';
    StoryRepository._resetInMemoryStories();
  });

  describe('Story CRUD & Lifecycle', () => {
    it('creates a new story draft with deterministic defaults', async () => {
      const created = await StoryRepository.createStory({
        title: 'Leh Arrival Notes',
        slug: 'leh-arrival-notes',
        trip_id: 'trip-ladakh-2026',
        subtitle: 'First impressions of the high plateau.',
        status: 'DRAFT',
        content: '[]',
      });

      expect(created.id).toBeDefined();
      expect(created.title).toBe('Leh Arrival Notes');
      expect(created.slug).toBe('leh-arrival-notes');
      expect(created.status).toBe('DRAFT');
    });

    it('fetches story by ID with detailed parsed content and relationships', async () => {
      const story = await StoryRepository.getStoryById('story-pangong-lake-2026');

      expect(story).not.toBeNull();
      expect(story?.title).toBe('The Road to Pangong');
      expect(Array.isArray(story?.parsedContent)).toBe(true);
      expect(story?.status).toBe('PUBLISHED');
    });

    it('updates story status deterministically through lifecycle', async () => {
      const updated = await StoryRepository.updateStoryStatus('story-pangong-lake-2026', 'ARCHIVED');
      expect(updated.status).toBe('ARCHIVED');

      const refetched = await StoryRepository.getStoryById('story-pangong-lake-2026');
      expect(refetched?.status).toBe('ARCHIVED');
    });

    it('deletes a story from repository', async () => {
      await StoryRepository.deleteStory('story-pangong-lake-2026');
      const found = await StoryRepository.getStoryById('story-pangong-lake-2026');
      expect(found).toBeNull();
    });
  });

  describe('Story Composition & Block Ordering', () => {
    it('persists ordered blocks (TEXT, INTRO, MEDIA, MEMORY, PLACE, QUOTE, DIVIDER)', async () => {
      const blocks: StoryBlock[] = [
        { id: 'b1', type: 'INTRO', order: 0, text: 'Opening reflection' },
        { id: 'b2', type: 'TEXT', order: 1, text: 'Detailed journey log' },
        { id: 'b3', type: 'QUOTE', order: 2, text: 'A quote from the road' },
        { id: 'b4', type: 'DIVIDER', order: 3 },
      ];

      const updated = await StoryRepository.updateStoryContent('story-pangong-lake-2026', blocks);

      expect(updated.parsedContent!).toHaveLength(4);
      expect(updated.parsedContent![0].type).toBe('INTRO');
      expect(updated.parsedContent![1].type).toBe('TEXT');
      expect(updated.parsedContent![2].type).toBe('QUOTE');
      expect(updated.parsedContent![3].type).toBe('DIVIDER');
    });
  });

  describe('Readiness Check & Publication Gate', () => {
    it('passes readiness check when all editorial requirements and public dependencies are met', async () => {
      const readiness = await StoryRepository.checkStoryReadiness('story-pangong-lake-2026');

      expect(readiness.hasTitle).toBe(true);
      expect(readiness.hasSlug).toBe(true);
      expect(readiness.hasContent).toBe(true);
      expect(readiness.hasCover).toBe(true);
      expect(readiness.isReady).toBe(true);
      expect(readiness.reasons).toHaveLength(0);
    });

    it('fails readiness check if required cover media is missing', async () => {
      await StoryRepository.updateStory('story-pangong-lake-2026', { cover_media_id: null });

      const readiness = await StoryRepository.checkStoryReadiness('story-pangong-lake-2026');
      expect(readiness.hasCover).toBe(false);
      expect(readiness.isReady).toBe(false);
      expect(readiness.reasons).toContain('Missing cover media');
    });

    it('prevents publishing a story that fails readiness rules via Server Action', async () => {
      await StoryRepository.updateStory('story-pangong-lake-2026', { cover_media_id: null });

      const res = await publishStoryAction('story-pangong-lake-2026');
      expect(res.success).toBe(false);
      expect(res.error).toContain('not ready to publish');
    });
  });

  describe('Privacy Boundary Enforcement', () => {
    it('never exposes DRAFT or ARCHIVED stories through public queries', async () => {
      await StoryRepository.updateStoryStatus('story-pangong-lake-2026', 'DRAFT');

      const publicStories = await StoryRepository.getPublishedStories();
      const foundInPublic = publicStories.find((s) => s.id === 'story-pangong-lake-2026');
      expect(foundInPublic).toBeUndefined();

      const publishedBySlug = await StoryRepository.getPublishedStoryBySlug('the-road-to-pangong');
      expect(publishedBySlug).toBeNull();
    });

    it('rejects Studio Server Actions when unauthenticated', async () => {
      process.env.TEST_AUTH_OVERRIDE = 'unauthorized';

      const res = await getStudioStoriesAction();
      expect(res.success).toBe(false);
      expect(res.error).toContain('Unauthorized');

      const createRes = await createStoryDraftAction({
        trip_id: 'trip-ladakh-2026',
        title: 'Unauthorized Draft',
        slug: 'unauthorized-draft',
      });
      expect(createRes.success).toBe(false);
      expect(createRes.error).toContain('Unauthorized');
    });
  });
});
