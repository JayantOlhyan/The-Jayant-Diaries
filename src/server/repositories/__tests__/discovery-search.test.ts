import { describe, it, expect } from 'vitest';
import { SearchRepository } from '../search-repository';
import { TripRepository } from '../trip-repository';
import { MemoryRepository } from '../memory-repository';
import { MediaRepository } from '../media-repository';

describe('Phase 4: Discovery & Archive Search', () => {
  describe('SearchRepository.searchPublicArchive', () => {
    it('returns empty results when query is empty or only whitespace', async () => {
      const emptyRes = await SearchRepository.searchPublicArchive('');
      expect(emptyRes.totalCount).toBe(0);
      expect(emptyRes.journeys).toHaveLength(0);
      expect(emptyRes.places).toHaveLength(0);
      expect(emptyRes.stories).toHaveLength(0);
      expect(emptyRes.photography).toHaveLength(0);
      expect(emptyRes.films).toHaveLength(0);

      const whitespaceRes = await SearchRepository.searchPublicArchive('   ');
      expect(whitespaceRes.totalCount).toBe(0);
    });

    it('finds results across multiple entities for a broad query like "ladakh"', async () => {
      const results = await SearchRepository.searchPublicArchive('ladakh');
      expect(results.totalCount).toBeGreaterThan(0);
      expect(results.query).toBe('ladakh');

      // Journeys matching Ladakh
      expect(results.journeys.length).toBeGreaterThan(0);
      expect(results.journeys[0].title.toLowerCase()).toContain('ladakh');

      // Places matching Ladakh (Leh, Pangong, etc.)
      expect(results.places.length).toBeGreaterThan(0);

      // Photography or films matching Ladakh
      expect(results.photography.length + results.films.length).toBeGreaterThan(0);
    });

    it('is case-insensitive', async () => {
      const lower = await SearchRepository.searchPublicArchive('leh');
      const upper = await SearchRepository.searchPublicArchive('LEH');
      const mixed = await SearchRepository.searchPublicArchive('LeH');

      expect(lower.totalCount).toBe(upper.totalCount);
      expect(lower.totalCount).toBe(mixed.totalCount);
      expect(lower.places.length).toBeGreaterThan(0);
    });

    it('performs substring matching for partial terms', async () => {
      const results = await SearchRepository.searchPublicArchive('pang');
      expect(results.totalCount).toBeGreaterThan(0);
      const placeMatch = results.places.find((p) => p.name.toLowerCase().includes('pangong'));
      expect(placeMatch).toBeDefined();
    });

    it('returns 0 results when no matches exist', async () => {
      const results = await SearchRepository.searchPublicArchive('xyznonexistentterm9999');
      expect(results.totalCount).toBe(0);
      expect(results.journeys).toHaveLength(0);
      expect(results.places).toHaveLength(0);
      expect(results.stories).toHaveLength(0);
      expect(results.photography).toHaveLength(0);
      expect(results.films).toHaveLength(0);
    });

    it('partitions photography and films appropriately', async () => {
      const results = await SearchRepository.searchPublicArchive('mountains');
      // Any photography returned must be PHOTO
      for (const item of results.photography) {
        expect(item.type).toBe('PHOTO');
      }
      // Any film returned must be VIDEO or youtube
      for (const item of results.films) {
        const isVideo = item.type === 'VIDEO' || item.storage_path?.startsWith('youtube/');
        expect(isVideo).toBe(true);
      }
    });

    it('strictly enforces the privacy invariant (visibility = PRIVATE excluded)', async () => {
      // Create a private trip
      const privateTrip = await TripRepository.createTrip({
        title: 'Secret Himalayas Infiltration',
        slug: 'secret-himalayas-infiltration',
        description: 'Classified personal trek.',
        status: 'DRAFT',
        visibility: 'PRIVATE',
      });

      // Create a private memory
      const privateMemory = await MemoryRepository.createMemory({
        title: 'Secret Himalayas Midnight Walk',
        description: 'Private reflections.',
        visibility: 'PRIVATE',
      });

      // Search for the private term
      const searchRes = await SearchRepository.searchPublicArchive('Secret Himalayas');

      // Must NOT contain private trip or private memory
      const foundTrip = searchRes.journeys.find((t) => t.id === privateTrip.id);
      expect(foundTrip).toBeUndefined();

      const foundMemory = searchRes.stories.find((m) => m.id === privateMemory.id);
      expect(foundMemory).toBeUndefined();

      // Clean up test data
      await TripRepository.deleteTrip(privateTrip.id);
      await MemoryRepository.deleteMemory(privateMemory.id);
    });
  });

  describe('SearchRepository.getRelatedContentForPlace', () => {
    it('returns related journeys, stories, and media for a valid place slug', async () => {
      const related = await SearchRepository.getRelatedContentForPlace('pangong-lake');
      expect(related).not.toBeNull();
      expect(related?.place.name).toBe('Pangong Lake');
      expect(Array.isArray(related?.journeys)).toBe(true);
      expect(Array.isArray(related?.stories)).toBe(true);
      expect(Array.isArray(related?.media)).toBe(true);
    });

    it('returns null for a non-existent place', async () => {
      const related = await SearchRepository.getRelatedContentForPlace('non-existent-waypoint-404');
      expect(related).toBeNull();
    });
  });
});
