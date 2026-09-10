import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTripAction, updateTripAction, deleteTripAction } from '@/server/actions/trip-actions';
import { createDayAction, updateDayAction, deleteDayAction } from '@/server/actions/day-actions';
import { createPlaceAction, updatePlaceAction, deletePlaceAction } from '@/server/actions/place-actions';
import { createMemoryAction, updateMemoryAction, deleteMemoryAction } from '@/server/actions/memory-actions';
import {
  addMediaReferenceAction,
  updateMediaAction,
  deleteMediaAction,
  reorderMediaAction,
  setCoverMediaAction,
} from '@/server/actions/media-actions';
import { bulkUpdateMediaCurationAction, archiveMediaAction } from '@/server/actions/curation-actions';
import { archiveSingleMediaAction } from '@/server/actions/ingestion-actions';
import { getNormalizedImageUrl } from '@/lib/utils/image-provider';
import { SearchRepository } from '@/server/repositories/search-repository';
import robots from '@/app/robots';
import sitemap from '@/app/sitemap';

describe('Phase 10 — Production Hardening & Release Readiness Suite', () => {
  const originalAuthOverride = process.env.TEST_AUTH_OVERRIDE;

  beforeEach(() => {
    // Simulate unauthenticated request by default for auth rejection tests
    process.env.TEST_AUTH_OVERRIDE = 'unauthorized';
  });

  afterEach(() => {
    if (originalAuthOverride !== undefined) {
      process.env.TEST_AUTH_OVERRIDE = originalAuthOverride;
    } else {
      delete process.env.TEST_AUTH_OVERRIDE;
    }
    vi.restoreAllMocks();
  });

  describe('1. Server-Side Studio Authorization Enforcement', () => {
    it('rejects unauthenticated trip mutations', async () => {
      const formData = new FormData();
      formData.append('title', 'Test Trip');
      formData.append('slug', 'test-trip');
      const createRes = await createTripAction(formData);
      expect(createRes.success).toBe(false);
      expect(createRes.error).toContain('Unauthorized');

      const updateRes = await updateTripAction('trip-123', { title: 'Updated' });
      expect(updateRes.success).toBe(false);
      expect(updateRes.error).toContain('Unauthorized');

      const deleteRes = await deleteTripAction('trip-123');
      expect(deleteRes.success).toBe(false);
      expect(deleteRes.error).toContain('Unauthorized');
    });

    it('rejects unauthenticated day mutations', async () => {
      const createRes = await createDayAction({ trip_id: 'trip-123', day_number: 1, date: '2026-06-12' });
      expect(createRes.success).toBe(false);
      expect(createRes.error).toContain('Unauthorized');

      const updateRes = await updateDayAction('day-123', 'trip-123', { title: 'Day Title' });
      expect(updateRes.success).toBe(false);
      expect(updateRes.error).toContain('Unauthorized');

      const deleteRes = await deleteDayAction('day-123', 'trip-123');
      expect(deleteRes.success).toBe(false);
      expect(deleteRes.error).toContain('Unauthorized');
    });

    it('rejects unauthenticated place mutations', async () => {
      const createRes = await createPlaceAction({ name: 'Leh', slug: 'leh', country: 'India' });
      expect(createRes.success).toBe(false);
      expect(createRes.error).toContain('Unauthorized');

      const updateRes = await updatePlaceAction('place-123', { name: 'Updated Place' });
      expect(updateRes.success).toBe(false);
      expect(updateRes.error).toContain('Unauthorized');

      const deleteRes = await deletePlaceAction('place-123');
      expect(deleteRes.success).toBe(false);
      expect(deleteRes.error).toContain('Unauthorized');
    });

    it('rejects unauthenticated memory mutations', async () => {
      const createRes = await createMemoryAction({ title: 'Memory 1', trip_id: 'trip-123' });
      expect(createRes.success).toBe(false);
      expect(createRes.error).toContain('Unauthorized');

      const updateRes = await updateMemoryAction('mem-123', { title: 'Updated Memory' });
      expect(updateRes.success).toBe(false);
      expect(updateRes.error).toContain('Unauthorized');

      const deleteRes = await deleteMemoryAction('mem-123', 'trip-123');
      expect(deleteRes.success).toBe(false);
      expect(deleteRes.error).toContain('Unauthorized');
    });

    it('rejects unauthenticated media mutations', async () => {
      const addRes = await addMediaReferenceAction({
        trip_id: 'trip-123',
        url: 'https://example.com/photo.jpg',
        type: 'IMAGE',
      });
      expect(addRes.success).toBe(false);
      expect(addRes.error).toContain('Unauthorized');

      const updateRes = await updateMediaAction('media-123', { caption: 'Test' });
      expect(updateRes.success).toBe(false);
      expect(updateRes.error).toContain('Unauthorized');

      const deleteRes = await deleteMediaAction('media-123', 'trip-123');
      expect(deleteRes.success).toBe(false);
      expect(deleteRes.error).toContain('Unauthorized');

      const reorderRes = await reorderMediaAction(['m1', 'm2'], 'trip-123');
      expect(reorderRes.success).toBe(false);
      expect(reorderRes.error).toContain('Unauthorized');

      const coverRes = await setCoverMediaAction('trip', 'trip-123', 'm1');
      expect(coverRes.success).toBe(false);
      expect(coverRes.error).toContain('Unauthorized');
    });

    it('rejects unauthenticated curation and ingestion actions', async () => {
      const bulkCurate = await bulkUpdateMediaCurationAction(['m1'], { curation_status: 'CURATED' });
      expect(bulkCurate.success).toBe(false);
      expect(bulkCurate.error).toContain('Unauthorized');

      const archiveMedia = await archiveMediaAction('m1');
      expect(archiveMedia.success).toBe(false);
      expect(archiveMedia.error).toContain('Unauthorized');

      const formData = new FormData();
      formData.append('filename', 'test.jpg');
      const archiveRes = await archiveSingleMediaAction(formData);
      expect(archiveRes.success).toBe(false);
      expect(archiveRes.reason).toContain('Unauthorized');
    });
  });

  describe('2. Media Fallbacks & Zero Stock Imagery', () => {
    it('returns empty string for missing image URLs, never stock imagery', () => {
      expect(getNormalizedImageUrl('')).toBe('');
      expect(getNormalizedImageUrl(null as unknown as string)).toBe('');
      expect(getNormalizedImageUrl(undefined as unknown as string)).toBe('');
      expect(getNormalizedImageUrl('   ')).toBe('');
    });
  });

  describe('3. Search Bounds & Parameter Safety', () => {
    it('clamps query string length and pagination limits safely', async () => {
      const longQuery = 'a'.repeat(250);
      const results = await SearchRepository.searchPublicArchive(longQuery, { limit: 100 });
      expect(results).toBeDefined();
      expect(results.query.length).toBeLessThanOrEqual(100);
      expect(results.totalCount).toBeGreaterThanOrEqual(0);
    });

    it('handles empty or whitespace search queries without throwing', async () => {
      const results = await SearchRepository.searchPublicArchive('   ');
      expect(results.totalCount).toBe(0);
      expect(results.journeys).toEqual([]);
      expect(results.places).toEqual([]);
      expect(results.stories).toEqual([]);
    });
  });

  describe('4. SEO, Robots & Sitemap Integrity', () => {
    it('generates robots.txt rules that explicitly disallow studio and private paths', () => {
      const robotRules = robots();
      expect(robotRules.rules).toBeDefined();
      const rules = Array.isArray(robotRules.rules) ? robotRules.rules[0] : robotRules.rules;
      expect(rules.disallow).toContain('/studio/');
      expect(rules.disallow).toContain('/api/');
      expect(rules.disallow).toContain('/search');
      expect(robotRules.sitemap).toContain('/sitemap.xml');
    });

    it('generates a clean sitemap without private, unlisted, or studio routes', async () => {
      const mapEntries = await sitemap();
      expect(mapEntries.length).toBeGreaterThan(0);

      // Verify no studio or api URLs are present in sitemap
      for (const entry of mapEntries) {
        expect(entry.url).not.toContain('/studio');
        expect(entry.url).not.toContain('/api');
        expect(entry.url).not.toContain('/search');
      }

      // Verify presence of static public entry points
      const urls = mapEntries.map((e) => e.url);
      expect(urls.some((u) => u.endsWith('/journeys'))).toBe(true);
      expect(urls.some((u) => u.endsWith('/places'))).toBe(true);
      expect(urls.some((u) => u.endsWith('/stories'))).toBe(true);
      expect(urls.some((u) => u.endsWith('/map'))).toBe(true);
    });
  });
});
