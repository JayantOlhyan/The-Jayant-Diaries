import { describe, it, expect, beforeEach } from 'vitest';
import { MediaRepository } from '../media-repository';
import { TripRepository } from '../trip-repository';
import { DayRepository } from '../day-repository';
import { PlaceRepository } from '../place-repository';
import { getNormalizedImageUrl, getImageAlt, FALLBACK_IMAGE_URL } from '@/lib/utils/image-provider';
import { extractYouTubeId } from '@/components/media/youtube-preview';

describe('Phase 2: Media Experience & Presentation', () => {
  beforeEach(() => {
    MediaRepository._resetInMemoryMedia();
  });

  describe('MediaRepository — Query & Privacy Invariants', () => {
    it('enforces public visibility strictly in getPublicMedia (zero private leak)', async () => {
      // First insert a private media reference
      await MediaRepository.createMediaReference({
        type: 'IMAGE',
        url: 'https://images.unsplash.com/photo-secret-archive.jpg',
        caption: 'Top Secret Archival Photo',
        visibility: 'PRIVATE',
      });

      const publicItems = await MediaRepository.getPublicMedia(100);
      expect(publicItems.length).toBeGreaterThan(0);

      // Verify that NO private item is ever returned in public queries (Rule 5)
      for (const item of publicItems) {
        expect(item.visibility).toBe('PUBLIC');
        expect(item.caption).not.toBe('Top Secret Archival Photo');
      }
    });

    it('returns all items including private in getAllStudioMedia', async () => {
      await MediaRepository.createMediaReference({
        type: 'IMAGE',
        url: 'https://images.unsplash.com/photo-private-field-notes.jpg',
        caption: 'Private Field Notes',
        visibility: 'PRIVATE',
      });

      const studioItems = await MediaRepository.getAllStudioMedia();
      const privateItem = studioItems.find((m) => m.caption === 'Private Field Notes');

      expect(privateItem).toBeDefined();
      expect(privateItem?.visibility).toBe('PRIVATE');
    });

    it('retrieves media for a specific trip ordered by position', async () => {
      const publicTrips = await TripRepository.getPublicTrips();
      const tripId = publicTrips[0].id;
      const tripMedia = await MediaRepository.getMediaForTrip(tripId);

      expect(tripMedia.length).toBeGreaterThan(0);
      for (let i = 0; i < tripMedia.length - 1; i++) {
        expect((tripMedia[i].position ?? 0) <= (tripMedia[i + 1].position ?? 0)).toBe(true);
      }
    });
  });

  describe('MediaRepository — Mutations & Management', () => {
    it('creates, updates, and deletes media references', async () => {
      // 1. Create
      const created = await MediaRepository.createMediaReference({
        type: 'IMAGE',
        url: 'https://images.unsplash.com/photo-spiti-valley.jpg',
        caption: 'Spiti Valley Monasteries',
        alt_text: 'High-altitude monastery perched on a rocky cliff in Spiti',
        position: 10,
        visibility: 'PUBLIC',
      });

      expect(created.id).toBeDefined();
      expect(created.caption).toBe('Spiti Valley Monasteries');
      expect(created.alt_text).toBe('High-altitude monastery perched on a rocky cliff in Spiti');
      expect(created.position).toBe(10);

      // 2. Update
      const updated = await MediaRepository.updateMedia(created.id, {
        caption: 'Key Monastery, Spiti Valley',
        position: 1,
      });

      expect(updated?.caption).toBe('Key Monastery, Spiti Valley');
      expect(updated?.position).toBe(1);

      // 3. Delete
      const deleted = await MediaRepository.deleteMedia(created.id);
      expect(deleted).toBe(true);

      const fetched = await MediaRepository.getMediaById(created.id);
      expect(fetched).toBeNull();
    });

    it('creates YouTube and Instagram references with correct metadata', async () => {
      // YouTube
      const yt = await MediaRepository.createMediaReference({
        type: 'YOUTUBE',
        youtube_url: 'https://www.youtube.com/watch?v=sample12345',
        youtube_id: 'sample12345',
        title: 'Nubra Valley Drone Reel',
        thumbnail_url: 'https://img.youtube.com/vi/sample12345/hqdefault.jpg',
      });

      expect(yt.type).toBe('VIDEO');
      expect(yt.storage_path).toBe('youtube/sample12345');
      expect(yt.caption).toBe('Nubra Valley Drone Reel');

      // Instagram
      const ig = await MediaRepository.createMediaReference({
        type: 'INSTAGRAM',
        instagram_url: 'https://www.instagram.com/p/DFGH12345/',
        shortcode: 'DFGH12345',
        instagram_type: 'REEL',
        caption: 'Cold desert winds in Ladakh',
      });

      expect(ig.type).toBe('REEL');
      expect(ig.storage_path).toBe('instagram/DFGH12345');
      expect(ig.caption).toBe('Cold desert winds in Ladakh');
    });

    it('reorders media items by position', async () => {
      const allMedia = await MediaRepository.getAllStudioMedia();
      expect(allMedia.length).toBeGreaterThanOrEqual(3);

      const idsToReorder = [allMedia[2].id, allMedia[0].id, allMedia[1].id];
      const reorderSuccess = await MediaRepository.reorderMedia(idsToReorder);
      expect(reorderSuccess).toBe(true);

      const item0 = await MediaRepository.getMediaById(idsToReorder[0]);
      const item1 = await MediaRepository.getMediaById(idsToReorder[1]);
      const item2 = await MediaRepository.getMediaById(idsToReorder[2]);

      expect(item0?.position).toBe(0);
      expect(item1?.position).toBe(1);
      expect(item2?.position).toBe(2);
    });

    it('sets cover media for a trip', async () => {
      const publicTrips = await TripRepository.getPublicTrips();
      const trip = publicTrips[0];
      const allMedia = await MediaRepository.getAllStudioMedia();
      const targetMedia = allMedia[3];

      const success = await MediaRepository.setCoverMedia('trip', trip.id, targetMedia.id);
      expect(success).toBe(true);

      const updatedTrip = await TripRepository.getTripById(trip.id);
      expect(updatedTrip?.cover_media_id).toBe(targetMedia.id);
    });
  });

  describe('Image Provider Utility', () => {
    it('handles relative, absolute, and empty image URLs gracefully', () => {
      expect(getNormalizedImageUrl('')).toBe(FALLBACK_IMAGE_URL);
      const unsplashUrl = getNormalizedImageUrl('https://images.unsplash.com/test.jpg');
      expect(unsplashUrl).toContain('https://images.unsplash.com/test.jpg');
      expect(unsplashUrl).toContain('q=80');
      expect(getNormalizedImageUrl('/images/local.jpg')).toBe('/images/local.jpg');
      expect(getNormalizedImageUrl('media/uuid/large')).toContain('/storage/v1/object/public/media/media/uuid/large');
    });

    it('derives informative alt text with caption or fallback', () => {
      expect(
        getImageAlt({
          alt_text: 'High-altitude lake in Ladakh',
          caption: 'Pangong',
        })
      ).toBe('High-altitude lake in Ladakh');

      expect(
        getImageAlt({
          caption: 'Khardung La Pass',
        })
      ).toBe('Khardung La Pass');

      expect(
        getImageAlt({
          filename: 'dsc00123.jpg',
        }, null, 'Travel archive photograph')
      ).toBe('Travel archive photograph');
    });
  });

  describe('YouTube Extraction Utility', () => {
    it('extracts video IDs from various formats', () => {
      expect(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(extractYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(extractYouTubeId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });
  });
});
