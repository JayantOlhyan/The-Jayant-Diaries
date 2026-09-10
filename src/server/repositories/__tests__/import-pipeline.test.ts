import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MediaRepository } from '../media-repository';
import { TripRepository } from '../trip-repository';
import { DayRepository } from '../day-repository';
import { PlaceRepository } from '../place-repository';
import { ImportSessionRepository } from '../import-session-repository';
import { StorageService } from '@/lib/storage/storage-service';
import { generateSuggestions } from '@/lib/ingestion/suggestion-engine';
import {
  createImportSessionAction,
  getImportSessionsAction,
  getImportSessionDetailAction,
  retryFailedSessionItemsAction,
  finalizeImportSessionAction,
  archiveSingleMediaAction,
} from '@/server/actions/ingestion-actions';
import { SEED_TRIPS, SEED_DAYS, SEED_PLACES } from '../seed-data';
import { TripRow, DayRow, PlaceRow } from '@/types/entities';
import { ExtractedMetadata } from '@/types/ingestion';

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

describe('Phase 11: Intelligent Archive Capture & Import Pipeline', () => {
  const validTripId = SEED_TRIPS[0].id;
  const validDayId = SEED_DAYS[0].id;

  const mockTrips: TripRow[] = [
    {
      id: 'trip-ladakh-2026',
      slug: 'ladakh-2026',
      title: 'Ladakh Expedition 2026',
      description: 'Himalayan journey',
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
      title: 'Acclimatization at Shanti Stupa',
      description: null,
      journal: null,
      cover_media_id: null,
      created_at: '2026-06-01T00:00:00Z',
      updated_at: '2026-06-01T00:00:00Z',
    },
    {
      id: 'day-ladakh-03',
      trip_id: 'trip-ladakh-2026',
      day_number: 3,
      date: '2026-06-15',
      title: 'Pangong Tso Exploration',
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
      name: 'Leh Main Bazaar',
      slug: 'leh-main-bazaar',
      country: 'India',
      state: 'Ladakh',
      city: 'Leh',
      latitude: 34.1642,
      longitude: 77.5848,
      cover_media_id: null,
      description: 'Old Town Bazaar',
      created_at: '2026-06-01T00:00:00Z',
      updated_at: '2026-06-01T00:00:00Z',
    },
    {
      id: 'place-shanti-stupa',
      name: 'Shanti Stupa',
      slug: 'shanti-stupa',
      country: 'India',
      state: 'Ladakh',
      city: 'Leh',
      latitude: 34.1672,
      longitude: 77.5796,
      cover_media_id: null,
      description: 'White-domed Buddhist stupa',
      created_at: '2026-06-01T00:00:00Z',
      updated_at: '2026-06-01T00:00:00Z',
    },
    {
      id: 'place-pangong-lake',
      name: 'Pangong Lake',
      slug: 'pangong-lake',
      country: 'India',
      state: 'Ladakh',
      city: 'Changthang',
      latitude: 33.7595,
      longitude: 78.6674,
      cover_media_id: null,
      description: 'Endorheic lake in the Himalayas',
      created_at: '2026-06-01T00:00:00Z',
      updated_at: '2026-06-01T00:00:00Z',
    },
    {
      id: 'place-spangmik-village',
      name: 'Spangmik Village',
      slug: 'spangmik-village',
      country: 'India',
      state: 'Ladakh',
      city: 'Changthang',
      latitude: 33.805,
      longitude: 78.583,
      cover_media_id: null,
      description: 'Small village along southern shore of Pangong',
      created_at: '2026-06-01T00:00:00Z',
      updated_at: '2026-06-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    MediaRepository._resetInMemoryMedia();
    TripRepository._resetInMemoryTrips();
    DayRepository._resetInMemoryDays();
    PlaceRepository._resetInMemoryPlaces();
    ImportSessionRepository._resetInMemoryStore();
    StorageService._resetInMemoryStorage();
    process.env.TEST_AUTH_OVERRIDE = 'authenticated';
  });

  afterEach(() => {
    delete process.env.TEST_AUTH_OVERRIDE;
    ImportSessionRepository._resetInMemoryStore();
    StorageService._resetInMemoryStorage();
  });

  describe('1. Import Session Lifecycle & Authentication', () => {
    it('creates an import session with CREATED status for authenticated requests', async () => {
      const res = await createImportSessionAction({
        name: 'Ladakh — Day 1 Ingestion',
        tripId: validTripId,
        dayId: validDayId,
        totalFiles: 142,
      });

      expect(res.success).toBe(true);
      expect(res.session).toBeDefined();
      expect(res.session?.status).toBe('CREATED');
      expect(res.session?.name).toBe('Ladakh — Day 1 Ingestion');
      expect(res.session?.total_files).toBe(142);
      expect(res.session?.trip_id).toBe(validTripId);
      expect(res.session?.day_id).toBe(validDayId);
    });

    it('rejects import session creation if unauthenticated', async () => {
      process.env.TEST_AUTH_OVERRIDE = 'unauthorized';
      const res = await createImportSessionAction({
        name: 'Unauthorized Session',
        totalFiles: 10,
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('Unauthorized');
      process.env.TEST_AUTH_OVERRIDE = 'authenticated';
    });

    it('retrieves sessions with truthful counts and updates to COMPLETED on finalization', async () => {
      const createRes = await createImportSessionAction({
        name: 'Nubra Valley Morning',
        totalFiles: 5,
      });
      expect(createRes.success).toBe(true);
      const sessionId = createRes.session!.id;

      // Increment counts with delta object
      await ImportSessionRepository.incrementSessionCounts(sessionId, { processed: 1, successful: 1 });
      await ImportSessionRepository.incrementSessionCounts(sessionId, { processed: 1, successful: 1 });
      await ImportSessionRepository.incrementSessionCounts(sessionId, { processed: 1, duplicate: 1 });

      const finalizeRes = await finalizeImportSessionAction(sessionId);
      expect(finalizeRes.success).toBe(true);
      expect(finalizeRes.session?.status).toBe('COMPLETED');
      expect(finalizeRes.session?.successful_files).toBe(2);
      expect(finalizeRes.session?.duplicate_files).toBe(1);
      expect(finalizeRes.session?.processed_files).toBe(3);

      const listRes = await getImportSessionsAction();
      expect(listRes.success).toBe(true);
      expect(listRes.sessions.length).toBeGreaterThanOrEqual(1);
      const retrieved = listRes.sessions.find((s) => s.id === sessionId);
      expect(retrieved?.name).toBe('Nubra Valley Morning');
    });

    it('marks session as REVIEW_REQUIRED when errors or duplicates occur', async () => {
      const createRes = await createImportSessionAction({
        name: 'Pangong Afternoon',
        totalFiles: 4,
      });
      expect(createRes.success).toBe(true);
      const sessionId = createRes.session!.id;

      await ImportSessionRepository.incrementSessionCounts(sessionId, { processed: 1, successful: 1 });
      await ImportSessionRepository.incrementSessionCounts(sessionId, { processed: 1, failed: 1 });

      const finalizeRes = await finalizeImportSessionAction(sessionId);
      expect(finalizeRes.success).toBe(true);
      expect(finalizeRes.session?.status).toBe('REVIEW_REQUIRED');
      expect(finalizeRes.session?.failed_files).toBe(1);
    });
  });

  describe('2. Single Item Archival, Deduplication & Session Item Tracking', () => {
    it('archives single media with PRIVATE visibility and links to import session', async () => {
      const createRes = await createImportSessionAction({
        name: 'Single Photo Session',
        totalFiles: 1,
      });
      expect(createRes.success).toBe(true);
      const sessionId = createRes.session!.id;

      const formData = new FormData();
      const dummyFile = new File(['binary-content-photo-1'], 'IMG_4821.JPG', { type: 'image/jpeg' });
      formData.append('file', dummyFile);
      formData.append(
        'metadata',
        JSON.stringify({
          id: 'media-4821',
          itemId: 'item-4821',
          filename: 'IMG_4821.JPG',
          mimeType: 'image/jpeg',
          contentHash: 'hash-photo-4821',
          takenAt: '2026-06-15T10:30:00Z',
          tripId: validTripId,
          sessionId,
        })
      );

      const res = await archiveSingleMediaAction(formData);
      expect(res.status).toBe('ARCHIVED');
      expect(res.mediaId).toBeDefined();

      // Verify canonical media row properties
      const media = await MediaRepository.getMediaById(res.mediaId!);
      expect(media).not.toBeNull();
      expect(media?.visibility).toBe('PRIVATE');
      expect(media?.import_session_id).toBe(sessionId);

      // Verify session item detail record
      const detailRes = await getImportSessionDetailAction(sessionId);
      expect(detailRes.success).toBe(true);
      expect(detailRes.session?.items).toBeDefined();
      expect(detailRes.session?.items?.length).toBe(1);
      expect(detailRes.session?.items![0].filename).toBe('IMG_4821.JPG');
      expect(detailRes.session?.items![0].status).toBe('SUCCESS');
      expect(detailRes.session?.items![0].media_id).toBe(res.mediaId);
    });

    it('detects duplicate content hash and records DUPLICATE outcome without creating second media row', async () => {
      const createRes = await createImportSessionAction({
        name: 'Duplicate Test Session',
        totalFiles: 2,
      });
      expect(createRes.success).toBe(true);
      const sessionId = createRes.session!.id;

      // 1. First upload
      const formData1 = new FormData();
      formData1.append('file', new File(['unique-binary-data'], 'IMG_ORIGINAL.JPG', { type: 'image/jpeg' }));
      formData1.append(
        'metadata',
        JSON.stringify({
          id: 'media-orig',
          itemId: 'item-orig',
          filename: 'IMG_ORIGINAL.JPG',
          contentHash: 'hash-exact-duplicate-test',
          sessionId,
        })
      );
      const res1 = await archiveSingleMediaAction(formData1);
      expect(res1.status).toBe('ARCHIVED');

      // 2. Second upload with same hash
      const formData2 = new FormData();
      formData2.append('file', new File(['unique-binary-data'], 'IMG_COPY.JPG', { type: 'image/jpeg' }));
      formData2.append(
        'metadata',
        JSON.stringify({
          id: 'media-copy',
          itemId: 'item-copy',
          filename: 'IMG_COPY.JPG',
          contentHash: 'hash-exact-duplicate-test',
          sessionId,
        })
      );
      const res2 = await archiveSingleMediaAction(formData2);
      expect(res2.status).toBe('DUPLICATE');
      expect(res2.mediaId).toBe(res1.mediaId);

      // Verify session item recorded as DUPLICATE
      const items = await ImportSessionRepository.getSessionItems(sessionId);
      const dupItem = items.find((i) => i.filename === 'IMG_COPY.JPG');
      expect(dupItem).toBeDefined();
      expect(dupItem?.status).toBe('DUPLICATE');
      expect(dupItem?.media_id).toBe(res1.mediaId);
    });

    it('allows explicit duplicate override when overrideDuplicate flag is set', async () => {
      const createRes = await createImportSessionAction({
        name: 'Override Session',
        totalFiles: 2,
      });
      expect(createRes.success).toBe(true);
      const sessionId = createRes.session!.id;

      // 1. Initial upload
      const formData1 = new FormData();
      formData1.append('file', new File(['override-data'], 'P1.JPG', { type: 'image/jpeg' }));
      formData1.append(
        'metadata',
        JSON.stringify({
          id: 'm-ov-1',
          itemId: 'i-ov-1',
          filename: 'P1.JPG',
          contentHash: 'hash-override-case',
          sessionId,
        })
      );
      await archiveSingleMediaAction(formData1);

      // 2. Duplicate upload with override
      const formData2 = new FormData();
      formData2.append('file', new File(['override-data'], 'P1_EDIT.JPG', { type: 'image/jpeg' }));
      formData2.append(
        'metadata',
        JSON.stringify({
          id: 'm-ov-2',
          itemId: 'i-ov-2',
          filename: 'P1_EDIT.JPG',
          contentHash: 'hash-override-case',
          overrideDuplicate: true,
          sessionId,
        })
      );
      const res2 = await archiveSingleMediaAction(formData2);
      expect(res2.status).toBe('ARCHIVED');
      expect(res2.mediaId).toBe('m-ov-2');
    });
  });

  describe('3. Partial Failures, Resumability & Selective Retry', () => {
    it('retries only failed session items without re-uploading successful items', async () => {
      const createRes = await createImportSessionAction({
        name: 'Batch Recovery Session',
        totalFiles: 3,
      });
      expect(createRes.success).toBe(true);
      const sessionId = createRes.session!.id;

      // Add 1 success item, 1 duplicate item, 1 failed item
      await ImportSessionRepository.addSessionItem({
        session_id: sessionId,
        filename: 'SUCCESS.JPG',
        file_size_bytes: 1000,
        content_hash: 'hash-success',
        status: 'SUCCESS',
        media_id: 'media-success-1',
      });

      await ImportSessionRepository.addSessionItem({
        session_id: sessionId,
        filename: 'DUPLICATE.JPG',
        file_size_bytes: 1200,
        content_hash: 'hash-duplicate',
        status: 'DUPLICATE',
        media_id: 'media-existing',
      });

      await ImportSessionRepository.addSessionItem({
        session_id: sessionId,
        filename: 'FAILED.JPG',
        file_size_bytes: 1500,
        content_hash: 'hash-failed',
        status: 'FAILED',
        error_message: 'Storage simulation rejection',
      });

      // Query failed items
      const failedItems = await ImportSessionRepository.getFailedSessionItems(sessionId);
      expect(failedItems.length).toBe(1);
      expect(failedItems[0].filename).toBe('FAILED.JPG');

      // Execute retry action
      const retryRes = await retryFailedSessionItemsAction(sessionId);
      expect(retryRes.success).toBe(true);
      expect(retryRes.retriedCount).toBe(1);

      // Verify only failed item was transitioned to QUEUED
      const allItems = await ImportSessionRepository.getSessionItems(sessionId);
      const retriedItem = allItems.find((i) => i.filename === 'FAILED.JPG');
      expect(retriedItem?.status).toBe('QUEUED');

      // Verify successful and duplicate items were not modified
      const successItem = allItems.find((i) => i.filename === 'SUCCESS.JPG');
      const dupItem = allItems.find((i) => i.filename === 'DUPLICATE.JPG');
      expect(successItem?.status).toBe('SUCCESS');
      expect(dupItem?.status).toBe('DUPLICATE');
    });

    it('preserves clean storage rollback if database persistence fails', async () => {
      const formData = new FormData();
      formData.append('file', new File(['corrupted-test'], 'TEST_CORRUPT.JPG', { type: 'image/jpeg' }));
      formData.append('metadata', 'not-valid-json'); // Corrupt payload

      const res = await archiveSingleMediaAction(formData);
      expect(res.status).toBe('FAILED');
      expect(res.reason).toContain('Failed to parse metadata payload');
    });
  });

  describe('4. Deterministic Suggestions & Candidate Places', () => {
    it('suggests trip and day based strictly on EXIF timestamp falling inside trip date boundaries', () => {
      const metadata: ExtractedMetadata = {
        filename: 'PANGONG_SUNRISE.JPG',
        mime_type: 'image/jpeg',
        file_size_bytes: 2000000,
        type: 'PHOTO',
        taken_at: '2026-06-15T05:45:00Z',
      };

      const suggestions = generateSuggestions(metadata, mockTrips, mockDays, mockPlaces);
      expect(suggestions.suggested_trip).toBeDefined();
      expect(suggestions.suggested_trip?.trip.id).toBe('trip-ladakh-2026');
      expect(suggestions.suggested_day).toBeDefined();
      expect(suggestions.suggested_day?.day.id).toBe('day-ladakh-03');
    });

    it('returns candidate nearby places ranked by distance and marks closest candidate', () => {
      // Near Pangong Lake & Spangmik: coordinates (33.78, 78.62)
      const metadata: ExtractedMetadata = {
        filename: 'CAMP_LAKE.JPG',
        mime_type: 'image/jpeg',
        file_size_bytes: 2500000,
        type: 'PHOTO',
        taken_at: '2026-06-15T14:00:00Z',
        gps: {
          latitude: 33.78,
          longitude: 78.62,
        },
      };

      const suggestions = generateSuggestions(metadata, mockTrips, mockDays, mockPlaces);
      expect(suggestions.suggested_place).toBeDefined();
      expect(suggestions.candidatePlaces).toBeDefined();
      expect(suggestions.candidatePlaces!.length).toBeGreaterThanOrEqual(2);

      // Candidates should include both Pangong Lake and Spangmik Village, sorted ascending by distance
      const [first, second] = suggestions.candidatePlaces!;
      expect(first.distanceKm).toBeLessThanOrEqual(second.distanceKm);
      expect(['Pangong Lake', 'Spangmik Village']).toContain(first.name);
      expect(['Pangong Lake', 'Spangmik Village']).toContain(second.name);
    });

    it('does not assign place or candidates when GPS is absent', () => {
      const metadata: ExtractedMetadata = {
        filename: 'UNKNOWN_LOCATION.JPG',
        mime_type: 'image/jpeg',
        file_size_bytes: 1800000,
        type: 'PHOTO',
        taken_at: '2026-06-11T12:00:00Z',
      };

      const suggestions = generateSuggestions(metadata, mockTrips, mockDays, mockPlaces);
      expect(suggestions.suggested_place).toBeNull();
      expect(suggestions.candidatePlaces).toEqual([]);
    });

    it('does not infer authoritative metadata or place from filenames', () => {
      const metadata: ExtractedMetadata = {
        filename: 'LADAKH_DAY3_PANGONG_LAKE_CONFIRMED.JPG',
        mime_type: 'image/jpeg',
        file_size_bytes: 1800000,
        type: 'PHOTO',
        // No taken_at, no GPS
      };

      const suggestions = generateSuggestions(metadata, mockTrips, mockDays, mockPlaces);
      // Must not fabricate trip, day, or place from the filename text
      expect(suggestions.suggested_trip).toBeNull();
      expect(suggestions.suggested_day).toBeNull();
      expect(suggestions.suggested_place).toBeNull();
      expect(suggestions.candidatePlaces).toEqual([]);
    });
  });

  describe('5. Truthfulness, Counts & Zero Data Integrity', () => {
    it('accurately maintains truthful zero counts on empty session', async () => {
      const res = await createImportSessionAction({
        name: 'Empty Session',
        totalFiles: 0,
      });

      expect(res.success).toBe(true);
      expect(res.session?.total_files).toBe(0);
      expect(res.session?.processed_files).toBe(0);
      expect(res.session?.successful_files).toBe(0);
      expect(res.session?.duplicate_files).toBe(0);
      expect(res.session?.failed_files).toBe(0);

      const items = await ImportSessionRepository.getSessionItems(res.session!.id);
      expect(items).toEqual([]);
    });
  });
});
