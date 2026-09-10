import { describe, it, expect, beforeEach } from 'vitest';
import { calculateDistanceKm, isValidCoordinate } from '@/lib/validation/coordinates';
import { generateSuggestions, groupItemsByDate } from '@/lib/ingestion/suggestion-engine';
import { MediaRepository } from '../media-repository';
import { TripRepository } from '../trip-repository';
import { DayRepository } from '../day-repository';
import { PlaceRepository } from '../place-repository';
import {
  checkExistingDuplicatesAction,
  archiveApprovedMediaBatchAction,
} from '@/server/actions/ingestion-actions';
import { ExtractedMetadata, IngestionItem } from '@/types/ingestion';
import { TripRow, DayRow, PlaceRow } from '@/types/entities';

describe('Phase 7: Smart Archive Ingestion & Media Organization', () => {
  beforeEach(() => {
    MediaRepository._resetInMemoryMedia();
    TripRepository._resetInMemoryTrips();
    DayRepository._resetInMemoryDays();
    PlaceRepository._resetInMemoryPlaces();
  });

  describe('1. Geographic Proximity via Haversine Formula (calculateDistanceKm)', () => {
    it('calculates accurate distance between known coordinates', () => {
      // Leh center (34.1526, 77.5771) to Shanti Stupa (34.1643, 77.5849) ~1.49 km
      const distance = calculateDistanceKm(34.1526, 77.5771, 34.1643, 77.5849);
      expect(distance).toBeGreaterThan(1.2);
      expect(distance).toBeLessThan(1.8);
    });

    it('returns 0 km for identical coordinates', () => {
      const distance = calculateDistanceKm(34.1526, 77.5771, 34.1526, 77.5771);
      expect(distance).toBe(0);
    });

    it('correctly calculates long distance (Leh to Delhi ~600-700 km)', () => {
      const distance = calculateDistanceKm(34.1526, 77.5771, 28.6139, 77.209);
      expect(distance).toBeGreaterThan(600);
      expect(distance).toBeLessThan(700);
    });
  });

  describe('2. Deterministic Suggestion Engine (generateSuggestions)', () => {
    const mockTrips: TripRow[] = [
      {
        id: 'trip-ladakh-2026',
        slug: 'ladakh-2026',
        title: 'Ladakh Expedition 2026',
        description: 'High altitude passes',
        start_date: '2026-06-10',
        end_date: '2026-06-20',
        cover_media_id: null,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        featured: true,
        created_at: '2026-06-01T00:00:00Z',
        updated_at: '2026-06-01T00:00:00Z',
      },
    ];

    const mockDays: DayRow[] = [
      {
        id: 'day-ladakh-01',
        trip_id: 'trip-ladakh-2026',
        day_number: 1,
        date: '2026-06-10',
        title: 'Arrival in Leh',
        description: null,
        journal: null,
        cover_media_id: null,
        created_at: '2026-06-01T00:00:00Z',
        updated_at: '2026-06-01T00:00:00Z',
      },
      {
        id: 'day-ladakh-02',
        trip_id: 'trip-ladakh-2026',
        day_number: 2,
        date: '2026-06-11',
        title: 'Acclimatization',
        description: null,
        journal: null,
        cover_media_id: null,
        created_at: '2026-06-01T00:00:00Z',
        updated_at: '2026-06-01T00:00:00Z',
      },
    ];

    const mockPlaces: PlaceRow[] = [
      {
        id: 'place-leh-market',
        slug: 'leh-market',
        name: 'Leh Main Bazaar',
        country: 'India',
        state: 'Ladakh',
        city: 'Leh',
        latitude: 34.1642,
        longitude: 77.5848,
        description: null,
        cover_media_id: null,
        created_at: '2026-06-01T00:00:00Z',
        updated_at: '2026-06-01T00:00:00Z',
      },
      {
        id: 'place-pangong-lake',
        slug: 'pangong-lake',
        name: 'Pangong Tso',
        country: 'India',
        state: 'Ladakh',
        city: null,
        latitude: 33.7595,
        longitude: 78.6674,
        description: null,
        cover_media_id: null,
        created_at: '2026-06-01T00:00:00Z',
        updated_at: '2026-06-01T00:00:00Z',
      },
    ];

    it('suggests trip when capture date is mathematically within start_date and end_date', () => {
      const meta: ExtractedMetadata = {
        filename: 'DSC_001.JPG',
        type: 'IMAGE',
        mime_type: 'image/jpeg',
        taken_at: '2026-06-11T14:30:00Z',
      };

      const suggestions = generateSuggestions(meta, mockTrips, mockDays, mockPlaces);
      expect(suggestions.suggested_trip).not.toBeNull();
      expect(suggestions.suggested_trip?.trip.id).toBe('trip-ladakh-2026');
      expect(suggestions.suggested_trip?.confidence).toBe('HIGH');
      expect(suggestions.suggested_trip?.reason).toContain('recorded date range');
    });

    it('suggests exact day when capture date matches day.date', () => {
      const meta: ExtractedMetadata = {
        filename: 'DSC_001.JPG',
        type: 'IMAGE',
        mime_type: 'image/jpeg',
        taken_at: '2026-06-10T09:15:00Z',
      };

      const suggestions = generateSuggestions(meta, mockTrips, mockDays, mockPlaces);
      expect(suggestions.suggested_day).not.toBeNull();
      expect(suggestions.suggested_day?.day.id).toBe('day-ladakh-01');
      expect(suggestions.suggested_day?.reason).toContain('Day 1');
    });

    it('suggests place when GPS coordinates are within 15 km threshold', () => {
      const meta: ExtractedMetadata = {
        filename: 'DSC_001.JPG',
        type: 'IMAGE',
        mime_type: 'image/jpeg',
        gps: {
          latitude: 34.165,
          longitude: 77.585,
        },
      };

      const suggestions = generateSuggestions(meta, mockTrips, mockDays, mockPlaces);
      expect(suggestions.suggested_place).not.toBeNull();
      expect(suggestions.suggested_place?.place.id).toBe('place-leh-market');
      expect(suggestions.suggested_place?.distance_km).toBeLessThan(1);
    });

    it('NEVER infers trip or place from filename text (anti-hallucination invariant)', () => {
      // Filename says "ladakh_pangong_lake.jpg" but date is in 2025 and GPS is empty
      const meta: ExtractedMetadata = {
        filename: 'ladakh_pangong_lake.jpg',
        type: 'IMAGE',
        mime_type: 'image/jpeg',
        taken_at: '2025-01-01T00:00:00Z',
      };

      const suggestions = generateSuggestions(meta, mockTrips, mockDays, mockPlaces);
      expect(suggestions.suggested_trip).toBeFalsy();
      expect(suggestions.suggested_place).toBeFalsy();
      expect(suggestions.suggested_day).toBeFalsy();
    });

    it('rejects place when GPS coordinates are outside 15 km threshold', () => {
      // Coordinates far from Leh and Pangong
      const meta = {
        filename: 'DSC_999.JPG',
        type: 'IMAGE',
        mime_type: 'image/jpeg',
        gps: {
          latitude: 35.0,
          longitude: 76.0,
        },
      };

      const suggestions = generateSuggestions(meta, mockTrips, mockDays, mockPlaces);
      expect(suggestions.suggested_place).toBeFalsy();
    });
  });

  describe('3. Chronological Date Grouping (groupItemsByDate)', () => {
    it('groups items accurately by capture date in descending order', () => {
      const items: IngestionItem[] = [
        {
          id: 'item-1',
          file: new File([], 'img1.jpg'),
          status: 'READY',
          progress: 100,
          reviewStatus: 'PENDING',
          metadata: {
            filename: 'img1.jpg',
            type: 'IMAGE',
            mime_type: 'image/jpeg',
            taken_at: '2026-06-12T10:00:00Z',
          },
        },
        {
          id: 'item-2',
          file: new File([], 'img2.jpg'),
          status: 'READY',
          progress: 100,
          reviewStatus: 'PENDING',
          metadata: {
            filename: 'img2.jpg',
            type: 'IMAGE',
            mime_type: 'image/jpeg',
            taken_at: '2026-06-12T15:00:00Z',
          },
        },
        {
          id: 'item-3',
          file: new File([], 'img3.jpg'),
          status: 'READY',
          progress: 100,
          reviewStatus: 'PENDING',
          metadata: {
            filename: 'img3.jpg',
            type: 'IMAGE',
            mime_type: 'image/jpeg',
            taken_at: '2026-06-11T08:00:00Z',
          },
        },
        {
          id: 'item-4',
          file: new File([], 'img4.jpg'),
          status: 'NEEDS_REVIEW',
          progress: 100,
          reviewStatus: 'PENDING',
          metadata: {
            filename: 'img4.jpg',
            type: 'IMAGE',
            mime_type: 'image/jpeg',
            taken_at: undefined,
          },
        },
      ];

      const groups = groupItemsByDate(items);
      expect(groups.length).toBe(3); // 2026-06-12, 2026-06-11, undated

      expect(groups[0].dateKey).toBe('2026-06-12');
      expect(groups[0].items.length).toBe(2);

      expect(groups[1].dateKey).toBe('2026-06-11');
      expect(groups[1].items.length).toBe(1);

      expect(groups[2].dateKey).toBe('undated');
      expect(groups[2].items.length).toBe(1);
    });
  });

  describe('4. Content Hash Duplicate Detection', () => {
    it('detects duplicate media matching canonical archive by content_hash', async () => {
      // First insert media with known content hash
      const [existing] = await MediaRepository.batchCreateMedia([
        {
          filename: 'original_shanti.jpg',
          storage_path: 'media/test-shanti/original',
          storage_url: '/uploads/original_shanti.jpg',
          type: 'IMAGE',
          mime_type: 'image/jpeg',
          content_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          visibility: 'PRIVATE',
        },
      ]);

      expect(existing.id).toBeDefined();

      // Check duplicate via server action
      const result = await checkExistingDuplicatesAction([
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        'different_unseen_hash_1234567890abcdef',
      ]);

      expect(result.success).toBe(true);
      expect(
        result.duplicates['e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855']
      ).toBe(existing.id);
      expect(result.duplicates['different_unseen_hash_1234567890abcdef']).toBeUndefined();
    });
  });

  describe('5. Batch Media Archival & Invariants (archiveApprovedMediaBatchAction)', () => {
    it('persists media batch with visibility = PRIVATE by default', async () => {
      const trips = await TripRepository.getAllStudioTrips();
      const tripId = trips[0]?.id || 'trip-1';

      const batch = [
        {
          filename: 'new_shot_01.jpg',
          storage_url: '/uploads/new_shot_01.jpg',
          type: 'PHOTO' as const,
          mime_type: 'image/jpeg',
          width: 4000,
          height: 3000,
          file_size_bytes: 5242880,
          content_hash: 'hash-new-shot-01',
          taken_at: '2026-06-12T11:00:00Z',
          latitude: 34.1526,
          longitude: 77.5771,
          trip_id: tripId,
          caption: 'Sunny morning in Leh',
        },
      ];

      const result = await archiveApprovedMediaBatchAction(batch);
      expect(result.success).toBe(true);
      expect(result.count).toBe(1);

      // Verify created media row in repository
      const createdId = result.createdIds?.[0] || '';
      const media = await MediaRepository.getMediaById(createdId);
      expect(media).not.toBeNull();
      expect(media?.filename).toBe('new_shot_01.jpg');
      expect(media?.trip_id).toBe(tripId);
      // Strict Invariant: All ingested media MUST be PRIVATE by default
      expect(media?.visibility).toBe('PRIVATE');
    });

    it('rejects batch if GPS coordinates are invalid', async () => {
      const batch = [
        {
          filename: 'invalid_gps.jpg',
          storage_url: '/uploads/invalid_gps.jpg',
          type: 'PHOTO' as const,
          mime_type: 'image/jpeg',
          latitude: 999, // Out of bounds
          longitude: 77.5771,
        },
      ];

      const result = await archiveApprovedMediaBatchAction(batch);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid GPS coordinates');
    });

    it('rejects batch if referenced trip does not exist in archive', async () => {
      const batch = [
        {
          filename: 'fake_trip.jpg',
          storage_url: '/uploads/fake_trip.jpg',
          type: 'PHOTO' as const,
          mime_type: 'image/jpeg',
          trip_id: 'non-existent-trip-999999',
        },
      ];

      const result = await archiveApprovedMediaBatchAction(batch);
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found in archive');
    });
  });
});
