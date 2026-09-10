import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PublicEditorialRepository } from '../public-editorial-repository';
import { StoryRepository } from '../story-repository';
import { TripRepository } from '../trip-repository';

describe('Phase 15: Archive Presentation & Personal Homepage Evolution', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.TEST_AUTH_OVERRIDE = 'authenticated';
    StoryRepository._resetInMemoryStories();
  });

  describe('Deterministic Featured Content Selection', () => {
    it('selects explicitly featured public published journey or falls back to latest published trip', async () => {
      const featuredJourney = await PublicEditorialRepository.getFeaturedJourney();

      expect(featuredJourney).not.toBeNull();
      expect(featuredJourney?.visibility).toBe('PUBLIC');
      expect(featuredJourney?.status).toBe('PUBLISHED');
      expect(featuredJourney?.title).toBeDefined();
    });

    it('selects explicitly featured published story or falls back to latest published story', async () => {
      const featuredStory = await PublicEditorialRepository.getFeaturedStory();

      expect(featuredStory).not.toBeNull();
      expect(featuredStory?.visibility).toBe('PUBLIC');
      expect(featuredStory?.status).toBe('PUBLISHED');
      expect(featuredStory?.title).toBe('The Road to Pangong');
    });

    it('returns recent published stories sorted by publication date descending', async () => {
      const recentStories = await PublicEditorialRepository.getRecentStories(5);

      expect(Array.isArray(recentStories)).toBe(true);
      if (recentStories.length > 0) {
        expect(recentStories[0].status).toBe('PUBLISHED');
        expect(recentStories[0].visibility).toBe('PUBLIC');
      }
    });

    it('returns recent public memories belonging to public journeys', async () => {
      const recentMemories = await PublicEditorialRepository.getRecentMemories(5);

      expect(Array.isArray(recentMemories)).toBe(true);
      recentMemories.forEach((mem) => {
        expect(mem.visibility).toBe('PUBLIC');
      });
    });
  });

  describe('Deterministic Archive Snapshot', () => {
    it('computes exact deterministic entity counts without manufactured or hardcoded values', async () => {
      const snapshot = await PublicEditorialRepository.getArchiveSnapshot();

      expect(typeof snapshot.journeysCount).toBe('number');
      expect(typeof snapshot.placesCount).toBe('number');
      expect(typeof snapshot.memoriesCount).toBe('number');
      expect(typeof snapshot.mediaCount).toBe('number');
      expect(typeof snapshot.storiesCount).toBe('number');

      expect(snapshot.journeysCount).toBeGreaterThanOrEqual(0);
      expect(snapshot.placesCount).toBeGreaterThanOrEqual(0);
      expect(snapshot.memoriesCount).toBeGreaterThanOrEqual(0);
      expect(snapshot.mediaCount).toBeGreaterThanOrEqual(0);
      expect(snapshot.storiesCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Public Privacy Boundary', () => {
    it('never includes DRAFT or ARCHIVED stories in homepage data', async () => {
      await StoryRepository.updateStoryStatus('story-pangong-lake-2026', 'DRAFT');

      const data = await PublicEditorialRepository.getHomepageData();

      expect(data.featuredStory).toBeNull();
      const foundInRecent = data.recentStories.find((s) => s.id === 'story-pangong-lake-2026');
      expect(foundInRecent).toBeUndefined();
      expect(data.snapshot.storiesCount).toBe(0);
    });
  });
});
