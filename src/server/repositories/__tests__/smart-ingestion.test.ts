import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { calculateDistanceKm } from '@/lib/validation/coordinates';
import { generateSuggestions, groupItemsByDate } from '@/lib/ingestion/suggestion-engine';
import { MediaRepository } from '../media-repository';
import { TripRepository } from '../trip-repository';
import { DayRepository } from '../day-repository';
import { PlaceRepository } from '../place-repository';
import { SearchRepository } from '../search-repository';
import { StorageService } from '@/server/storage/storage-service';
import {
  checkExistingDuplicatesAction,
  archiveApprovedMediaBatchAction,
  archiveSingleMediaAction,
} from '@/server/actions/ingestion-actions';
import { IngestionItem } from '@/types/ingestion';
import { TripRow, DayRow, PlaceRow } from '@/types/entities';

if (typeof Blob !== 'undefined' && !Blob.prototype.arrayBuffer) {
  Blob.prototype.arrayBuffer = async function () {
    const sym = Object.getOwnPropertySymbols(this).find((s) => s.toString().includes('impl'));
    if (sym && (this as any)[sym]?._buffer) {
      const buf = (this as any)[sym]._buffer;
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    }
    return new ArrayBuffer(0);
  };
}

describe('Phase 7 & 7.1: Smart Archive Ingestion & Remediation', () => {
  beforeEach(() => {
    MediaRepository._resetInMemoryMedia();
    TripRepository._resetInMemoryTrips();
    DayRepository._resetInMemoryDays();
    PlaceRepository._resetInMemoryPlaces();
    StorageService._resetInMemoryStorage();
    delete process.env.TEST_AUTH_OVERRIDE;
  });

  afterEach(() => {
    delete process.env.TEST_AUTH_OVERRIDE;
    StorageService._resetInMemoryStorage();
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
        id: 'place-diskit',
        slug: 'diskit-monastery',
        name: 'Diskit Monastery',
        country: 'India',
        state: 'Ladakh',
        city: 'Nubra',
        latitude: 34.5422,
        longitude: 77.5567,
        description: null,
        cover_media_id: null,
        created_at: '2026-06-01T00:00:00Z',
        updated_at: '2026-06-01T00:00:00Z',
      },
    ];

    it('suggests trip and day based on capture date matching range', () => {
      const suggestions = generateSuggestions(
        {
          taken_at: '2026-06-10T14:30:00Z',
          filename: 'IMG_001.JPG',
          mime_type: 'image/jpeg',
          file_size_bytes: 1024,
          type: 'PHOTO',
        },
        mockTrips,
        mockDays,
        mockPlaces
      );

      expect(suggestions.suggested_trip).not.toBeNull();
      expect(suggestions.suggested_trip?.trip.id).toBe('trip-ladakh-2026');
      expect(suggestions.suggested_day).not.toBeNull();
      expect(suggestions.suggested_day?.day.id).toBe('day-ladakh-01');
    });

    it('suggests place by coordinate proximity (< 50 km)', () => {
      const suggestions = generateSuggestions(
        {
          gps: { latitude: 34.1643, longitude: 77.5849 }, // Very close to Leh Bazaar
          filename: 'IMG_002.JPG',
          mime_type: 'image/jpeg',
          file_size_bytes: 1024,
          type: 'PHOTO',
        },
        mockTrips,
        mockDays,
        mockPlaces
      );

      expect(suggestions.suggested_place).not.toBeNull();
      expect(suggestions.suggested_place?.place.id).toBe('place-leh-market');
      expect(suggestions.suggested_place?.distance_km).toBeLessThan(0.1);
    });

    it('returns null place suggestion when coordinate is too far from all places', () => {
      const suggestions = generateSuggestions(
        {
          gps: { latitude: 12.9716, longitude: 77.5946 }, // Bangalore coordinates
          filename: 'IMG_003.JPG',
          mime_type: 'image/jpeg',
          file_size_bytes: 1024,
          type: 'PHOTO',
        },
        mockTrips,
        mockDays,
        mockPlaces
      );

      expect(suggestions.suggested_place).toBeNull();
    });
  });

  describe('3. Chronological Grouping (groupItemsByDate)', () => {
    it('groups ingestion items by date accurately and handles undated files', () => {
      const items: IngestionItem[] = [
        {
          id: '1',
          file: { name: 'photo1.jpg' } as File,
          metadata: {
            taken_at: '2026-06-12T10:00:00Z',
          },
        },
        {
          id: '2',
          file: { name: 'photo2.jpg' } as File,
          metadata: {
            taken_at: '2026-06-12T14:00:00Z',
          },
        },
        {
          id: '3',
          file: { name: 'photo3.jpg' } as File,
          metadata: {
            taken_at: '2026-06-11T09:00:00Z',
          },
        },
        {
          id: '4',
          file: { name: 'undated.jpg' } as File,
          metadata: {
            taken_at: null,
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

  describe('4. Real Storage Persistence & Single Media Upload (archiveSingleMediaAction)', () => {
    it('uploads binary file to storage with deterministic path and persists Media record', async () => {
      const trips = await TripRepository.getAllStudioTrips();
      const tripId = trips[0].id;

      const file = new File(['fake-binary-photo-payload-bytes'], 'test_camera_photo.jpg', {
        type: 'image/jpeg',
      });

      const formData = new FormData();
      formData.append('file', file);
      formData.append(
        'metadata',
        JSON.stringify({
          tripId,
          caption: 'Real persistent photo',
          takenAt: '2026-06-12T11:00:00Z',
        })
      );

      const result = await archiveSingleMediaAction(formData);

      expect(result.success).toBe(true);
      expect(result.status).toBe('ARCHIVED');
      expect(result.mediaId).toBeDefined();
      expect(result.storagePath).toMatch(/^media\/[a-f0-9-]+\/original\.jpg$/);
      expect(result.storageUrl).toBeDefined();
      expect(result.storageUrl).not.toContain('/uploads/');

      // Verify physical storage persistence in StorageService
      expect(StorageService._hasStoredObject(result.storagePath!)).toBe(true);

      // Verify canonical database record in MediaRepository
      const media = await MediaRepository.getMediaById(result.mediaId!);
      expect(media).not.toBeNull();
      expect(media?.filename).toBe('test_camera_photo.jpg');
      expect(media?.storage_path).toBe(result.storagePath);
      expect(media?.storage_url).toBe(result.storageUrl);
      expect(media?.visibility).toBe('PRIVATE'); // Invariant: PRIVATE by default
    });

    it('rejects upload with unsupported file extension', async () => {
      const file = new File(['code content'], 'malicious.exe', { type: 'application/x-msdownload' });
      const formData = new FormData();
      formData.append('file', file);

      const result = await archiveSingleMediaAction(formData);
      expect(result.success).toBe(false);
      expect(result.status).toBe('FAILED');
      expect(result.reason).toContain('Unsupported file extension');
    });

    it('rejects upload when file exceeds maximum supported size', async () => {
      // Create a file mocking > 50MB
      const file = new File(['dummy'], 'giant_image.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 60 * 1024 * 1024 });

      const formData = new FormData();
      formData.append('file', file);

      const result = await archiveSingleMediaAction(formData);
      expect(result.success).toBe(false);
      expect(result.status).toBe('FAILED');
      expect(result.reason).toBe('File exceeds maximum supported size.');
    });
  });

  describe('5. Storage Failure Safety & Cleanup Handling', () => {
    it('handles storage upload failure without creating database records', async () => {
      StorageService._setSimulateUploadFailure(true);

      const file = new File(['photo bytes'], 'storage_fail.jpg', { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('file', file);

      const result = await archiveSingleMediaAction(formData);
      expect(result.success).toBe(false);
      expect(result.status).toBe('FAILED');
      expect(result.reason).toContain('Storage upload failed');

      // Database should not have this record
      const studioMedia = await MediaRepository.getAllStudioMedia();
      expect(studioMedia.some((m) => m.filename === 'storage_fail.jpg')).toBe(false);
    });

    it('cleans up storage object when database insertion fails after upload', async () => {
      MediaRepository._setSimulateInsertFailure(true);

      const file = new File(['photo bytes'], 'db_fail.jpg', { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('file', file);

      const result = await archiveSingleMediaAction(formData);
      expect(result.success).toBe(false);
      expect(result.status).toBe('FAILED');
      expect(result.reason).toContain('Database persistence failed');
      expect(result.reason).toContain('Storage object cleaned up');

      // Verify stored object was cleaned up
      const storagePath = StorageService._hasStoredObject(`media/${result.mediaId}/original.jpg`);
      expect(storagePath).toBe(false);
    });

    it('reports explicit error if storage cleanup fails after database failure', async () => {
      MediaRepository._setSimulateInsertFailure(true);
      StorageService._setSimulateCleanupFailure(true);

      const file = new File(['photo bytes'], 'orphan_fail.jpg', { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('file', file);

      const result = await archiveSingleMediaAction(formData);
      expect(result.success).toBe(false);
      expect(result.status).toBe('FAILED');
      expect(result.reason).toContain('Storage cleanup: Failed — orphaned object may remain');
    });
  });

  describe('6. Duplicate Protection & Hash Verification', () => {
    it('rejects duplicate file matching existing archive content hash', async () => {
      const fileContent = 'unique-photo-content-hash-verification-12345';
      const file1 = new File([fileContent], 'first_shot.jpg', { type: 'image/jpeg' });
      const formData1 = new FormData();
      formData1.append('file', file1);

      const res1 = await archiveSingleMediaAction(formData1);
      expect(res1.success).toBe(true);

      // Now attempt archiving identical content
      const file2 = new File([fileContent], 'second_shot_copy.jpg', { type: 'image/jpeg' });
      const formData2 = new FormData();
      formData2.append('file', file2);

      const res2 = await archiveSingleMediaAction(formData2);
      expect(res2.success).toBe(false);
      expect(res2.status).toBe('DUPLICATE');
      expect(res2.mediaId).toBe(res1.mediaId);
      expect(res2.reason).toContain('Exact duplicate already exists');
    });

    it('allows duplicate archival when overrideDuplicate is explicitly true', async () => {
      const fileContent = 'duplicate-override-content-hash-67890';
      const file1 = new File([fileContent], 'first_shot.jpg', { type: 'image/jpeg' });
      const formData1 = new FormData();
      formData1.append('file', file1);
      const res1 = await archiveSingleMediaAction(formData1);
      expect(res1.success).toBe(true);

      // Second attempt with override
      const file2 = new File([fileContent], 'override_shot.jpg', { type: 'image/jpeg' });
      const formData2 = new FormData();
      formData2.append('file', file2);
      formData2.append('overrideDuplicate', 'true');

      const res2 = await archiveSingleMediaAction(formData2);
      expect(res2.success).toBe(true);
      expect(res2.status).toBe('ARCHIVED');
      expect(res2.mediaId).not.toBe(res1.mediaId);
    });
  });

  describe('7. Batch Processing & Item-Level Failure Isolation', () => {
    it('processes 10-item batch: isolates 8 successes, 1 duplicate, and 1 invalid reference', async () => {
      const trips = await TripRepository.getAllStudioTrips();
      const validTripId = trips[0].id;

      // Seed an existing item for duplicate detection
      await MediaRepository.batchCreateMedia([
        {
          filename: 'already_archived.jpg',
          storage_path: 'media/seed-existing/original.jpg',
          storage_url: 'https://mock.supabase.co/storage/v1/object/authenticated/media-private/media/seed-existing/original.jpg',
          type: 'PHOTO',
          mime_type: 'image/jpeg',
          content_hash: 'known-duplicate-hash-1111',
          visibility: 'PRIVATE',
        },
      ]);

      const batch = [
        // 8 valid items
        ...Array.from({ length: 8 }, (_, i) => ({
          filename: `batch_valid_${i + 1}.jpg`,
          storage_path: `media/valid-${i + 1}/original.jpg`,
          storage_url: `https://mock.supabase.co/storage/v1/object/authenticated/media-private/media/valid-${i + 1}/original.jpg`,
          type: 'PHOTO' as const,
          mime_type: 'image/jpeg',
          content_hash: `hash-valid-${i + 1}`,
          trip_id: validTripId,
        })),
        // 1 duplicate
        {
          filename: 'batch_duplicate.jpg',
          storage_path: 'media/dup/original.jpg',
          storage_url: 'https://mock.supabase.co/storage/v1/object/authenticated/media-private/media/dup/original.jpg',
          type: 'PHOTO' as const,
          mime_type: 'image/jpeg',
          content_hash: 'known-duplicate-hash-1111',
          trip_id: validTripId,
        },
        // 1 invalid reference (nonexistent trip)
        {
          filename: 'batch_invalid_trip.jpg',
          storage_path: 'media/bad-trip/original.jpg',
          storage_url: 'https://mock.supabase.co/storage/v1/object/authenticated/media-private/media/bad-trip/original.jpg',
          type: 'PHOTO' as const,
          mime_type: 'image/jpeg',
          content_hash: 'hash-bad-trip',
          trip_id: 'non-existent-trip-999999',
        },
      ];

      expect(batch.length).toBe(10);

      const result = await archiveApprovedMediaBatchAction(batch);

      // Must report honest item-level results
      expect(result.total).toBe(10);
      expect(result.archivedCount).toBe(8);
      expect(result.duplicateCount).toBe(1);
      expect(result.failedCount).toBe(1);
      expect(result.createdIds?.length).toBe(8);

      // The 1 failed item must not have invalidated or aborted the 8 successful items!
      const failedItem = result.items?.find((i) => i.filename === 'batch_invalid_trip.jpg');
      expect(failedItem?.status).toBe('FAILED');

      const dupItem = result.items?.find((i) => i.filename === 'batch_duplicate.jpg');
      expect(dupItem?.status).toBe('DUPLICATE');

      const validItems = result.items?.filter((i) => i.status === 'ARCHIVED');
      expect(validItems?.length).toBe(8);
    });

    it('strictly rejects fictional /uploads/ storage URLs', async () => {
      const batch = [
        {
          filename: 'fictional_url.jpg',
          storage_path: 'media/test/original.jpg',
          storage_url: '/uploads/fictional_url.jpg',
          type: 'PHOTO' as const,
          mime_type: 'image/jpeg',
        },
      ];

      const result = await archiveApprovedMediaBatchAction(batch);
      expect(result.failedCount).toBe(1);
      expect(result.errors[0].reason).toContain('Fictional /uploads/ storage URLs are not permitted');
    });
  });

  describe('8. Zero Private Data Leakage / Public Privacy Regression', () => {
    it('guarantees that newly archived media (visibility = PRIVATE) cannot leak into public repositories', async () => {
      const trips = await TripRepository.getAllStudioTrips();
      const tripId = trips[0].id;
      const tripSlug = trips[0].slug;

      const file = new File(['private secret bytes'], 'secret_hidden_canyon.jpg', {
        type: 'image/jpeg',
      });
      const formData = new FormData();
      formData.append('file', file);
      formData.append(
        'metadata',
        JSON.stringify({
          tripId,
          caption: 'Top Secret Unreleased Himalayan Pass',
          takenAt: '2026-06-12T11:00:00Z',
        })
      );

      const archiveRes = await archiveSingleMediaAction(formData);
      expect(archiveRes.success).toBe(true);
      const privateMediaId = archiveRes.mediaId!;

      // 1. Check MediaRepository.getPublicMedia()
      const publicMedia = await MediaRepository.getPublicMedia(100, 0);
      expect(publicMedia.some((m) => m.id === privateMediaId)).toBe(false);

      // 2. Check MediaRepository.getMediaForTrip() with PUBLIC filter
      const tripPublicMedia = await MediaRepository.getMediaForTrip(tripId, { visibility: 'PUBLIC' });
      expect(tripPublicMedia.some((m) => m.id === privateMediaId)).toBe(false);

      // 3. Check TripRepository.getCinematicJourneyBySlug()
      const journey = await TripRepository.getCinematicJourneyBySlug(tripSlug);
      expect(journey).not.toBeNull();
      if (journey) {
        const allJourneyMedia = [
          ...(journey.coverMedia ? [journey.coverMedia] : []),
          ...(journey.closingMedia ? [journey.closingMedia] : []),
          ...journey.days.flatMap((d) => [...d.photos, ...d.videos, ...d.instagram]),
        ];
        expect(allJourneyMedia.some((m) => m.id === privateMediaId)).toBe(false);
      }

      // 4. Check PlaceRepository.getPublicMapPlaces()
      const mapPlaces = await PlaceRepository.getPublicMapPlaces();
      for (const place of mapPlaces) {
        if (place.coverMedia) {
          expect(place.coverMedia.storage_url).not.toBe(archiveRes.storageUrl);
        }
      }

      // 5. Check SearchRepository.searchPublicArchive()
      const searchRes = await SearchRepository.searchPublicArchive('Top Secret Unreleased');
      expect(searchRes.photography.some((m) => m.id === privateMediaId)).toBe(false);
      expect(searchRes.films.some((m) => m.id === privateMediaId)).toBe(false);
    });
  });

  describe('9. Server-Side Studio Authorization Enforcement', () => {
    it('rejects archive single media action when unauthorized', async () => {
      process.env.TEST_AUTH_OVERRIDE = 'unauthorized';

      const file = new File(['bytes'], 'unauthorized.jpg', { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('file', file);

      const result = await archiveSingleMediaAction(formData);
      expect(result.success).toBe(false);
      expect(result.status).toBe('FAILED');
      expect(result.reason).toContain('Unauthorized');
    });

    it('rejects archive batch action when unauthorized', async () => {
      process.env.TEST_AUTH_OVERRIDE = 'unauthorized';

      const batch = [
        {
          filename: 'test.jpg',
          storage_path: 'media/test/original.jpg',
          storage_url: 'https://mock.supabase.co/storage/v1/object/authenticated/media-private/media/test/original.jpg',
          mime_type: 'image/jpeg',
        },
      ];

      const result = await archiveApprovedMediaBatchAction(batch);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unauthorized');
    });
  });

  describe('10. Referential Integrity & Relationship Validation', () => {
    it('rejects media when assigned day does not belong to assigned trip', async () => {
      const trips = await TripRepository.getAllStudioTrips();
      const trip1 = trips[0];
      const trip2 = await TripRepository.createTrip({
        title: 'Second Test Trip',
        slug: 'second-test-trip',
        start_date: '2026-07-01',
        end_date: '2026-07-05',
        visibility: 'PRIVATE',
      });
      const dayForTrip2 = await DayRepository.createDay({
        trip_id: trip2.id,
        day_number: 1,
        title: 'Day 1 of Trip 2',
      });

      const file = new File(['bytes'], 'mismatched_day.jpg', { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('file', file);
      formData.append(
        'metadata',
        JSON.stringify({
          tripId: trip1.id,
          dayId: dayForTrip2.id,
        })
      );

      const result = await archiveSingleMediaAction(formData);
      expect(result.success).toBe(false);
      expect(result.status).toBe('FAILED');
      expect(result.reason).toContain(`does not belong to trip ${trip1.id}`);
    });

    it('rejects media when referenced trip does not exist in archive', async () => {
      const file = new File(['bytes'], 'bad_trip.jpg', { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('file', file);
      formData.append(
        'metadata',
        JSON.stringify({
          tripId: 'non-existent-trip-999999',
        })
      );

      const result = await archiveSingleMediaAction(formData);
      expect(result.success).toBe(false);
      expect(result.status).toBe('FAILED');
      expect(result.reason).toContain('not found in archive');
    });
  });
});
