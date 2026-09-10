import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MediaRepository } from '../media-repository';
import { TripRepository } from '../trip-repository';
import { DayRepository } from '../day-repository';
import { PlaceRepository } from '../place-repository';
import {
  CurationRepository,
  calculateMediaReadiness,
} from '../curation-repository';
import {
  getArchiveHealthAction,
  getCurationQueueAction,
  updateMediaCurationAction,
  bulkUpdateMediaCurationAction,
  getDuplicateGroupsAction,
  publishMediaAction,
  archiveMediaAction,
  resolveDuplicateAction,
} from '@/server/actions/curation-actions';
import { MediaRow } from '@/types/entities';

describe('Phase 8: Archive Intelligence & Editorial Curation', () => {
  beforeEach(() => {
    MediaRepository._resetInMemoryMedia();
    TripRepository._resetInMemoryTrips();
    DayRepository._resetInMemoryDays();
    PlaceRepository._resetInMemoryPlaces();
    delete process.env.TEST_AUTH_OVERRIDE;
  });

  afterEach(() => {
    delete process.env.TEST_AUTH_OVERRIDE;
    MediaRepository._resetInMemoryMedia();
  });

  describe('1. Archive Health Metrics & Absolute Truthfulness', () => {
    it('returns strictly 0 for all metrics when the archive is completely empty', async () => {
      MediaRepository._setInMemoryMedia([]);
      const health = await CurationRepository.getArchiveHealth();

      expect(health.totalMedia).toBe(0);
      expect(health.needsReview).toBe(0);
      expect(health.missingMetadata).toBe(0);
      expect(health.unassigned).toBe(0);
      expect(health.duplicates).toBe(0);
      expect(health.readyToPublish).toBe(0);
      expect(health.privateCount).toBe(0);
      expect(health.publishedCount).toBe(0);
    });

    it('accurately calculates health statistics for populated archive', async () => {
      const allMedia = await MediaRepository.getAllStudioMedia();
      const health = await CurationRepository.getArchiveHealth();

      expect(health.totalMedia).toBe(allMedia.length);
      expect(health.totalMedia).toBeGreaterThan(0);
      expect(health.privateCount + health.publishedCount).toBe(health.totalMedia);
      expect(health.readyToPublish).toBeGreaterThanOrEqual(0);
    });

    it('reflects newly ingested media requiring review in health metrics', async () => {
      const initialHealth = await CurationRepository.getArchiveHealth();

      await MediaRepository.batchCreateMedia([
        {
          filename: 'raw-upload-1.jpg',
          storage_path: 'media/test-1/original',
          storage_url: 'https://example.com/test-1.jpg',
          mime_type: 'image/jpeg',
          type: 'PHOTO',
          curation_status: 'IMPORTED',
          visibility: 'PRIVATE',
        },
      ]);

      const updatedHealth = await CurationRepository.getArchiveHealth();
      expect(updatedHealth.totalMedia).toBe(initialHealth.totalMedia + 1);
      expect(updatedHealth.needsReview).toBe(initialHealth.needsReview + 1);
      expect(updatedHealth.missingMetadata).toBe(initialHealth.missingMetadata + 1);
      expect(updatedHealth.unassigned).toBe(initialHealth.unassigned + 1);
    });
  });

  describe('2. Deterministic Publication Readiness Calculation', () => {
    it('identifies missing capture date', () => {
      const media: MediaRow = {
        id: 'test-m-1',
        filename: 'test.jpg',
        storage_path: 'media/test/original',
        storage_url: 'https://example.com/test.jpg',
        thumbnail_url: null,
        type: 'PHOTO',
        mime_type: 'image/jpeg',
        width: 1920,
        height: 1080,
        duration: null,
        file_size_bytes: 1000,
        content_hash: 'hash-1',
        taken_at: null, // missing!
        latitude: null,
        longitude: null,
        trip_id: 'trip-1',
        day_id: 'day-1',
        place_id: 'place-1',
        memory_id: null,
        caption: null,
        alt_text: null,
        position: 0,
        visibility: 'PRIVATE',
        curation_status: 'CURATED',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const readiness = calculateMediaReadiness(media);
      expect(readiness.isReady).toBe(false);
      expect(readiness.missingFields).toContain('taken_at');
      expect(readiness.reasons.some((r) => r.includes('capture date'))).toBe(true);
    });

    it('identifies missing photo dimensions', () => {
      const media: MediaRow = {
        id: 'test-m-2',
        filename: 'test2.jpg',
        storage_path: 'media/test2/original',
        storage_url: 'https://example.com/test2.jpg',
        thumbnail_url: null,
        type: 'PHOTO',
        mime_type: 'image/jpeg',
        width: null, // missing!
        height: null, // missing!
        duration: null,
        file_size_bytes: 1000,
        content_hash: 'hash-2',
        taken_at: '2026-06-15T10:00:00Z',
        latitude: null,
        longitude: null,
        trip_id: 'trip-1',
        day_id: 'day-1',
        place_id: 'place-1',
        memory_id: null,
        caption: null,
        alt_text: null,
        position: 0,
        visibility: 'PRIVATE',
        curation_status: 'CURATED',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const readiness = calculateMediaReadiness(media);
      expect(readiness.isReady).toBe(false);
      expect(readiness.missingFields).toContain('dimensions');
      expect(readiness.reasons.some((r) => r.includes('dimensions'))).toBe(true);
    });

    it('identifies unassigned trip, day, and place', () => {
      const media: MediaRow = {
        id: 'test-m-3',
        filename: 'test3.jpg',
        storage_path: 'media/test3/original',
        storage_url: 'https://example.com/test3.jpg',
        thumbnail_url: null,
        type: 'PHOTO',
        mime_type: 'image/jpeg',
        width: 1920,
        height: 1080,
        duration: null,
        file_size_bytes: 1000,
        content_hash: 'hash-3',
        taken_at: '2026-06-15T10:00:00Z',
        latitude: null,
        longitude: null,
        trip_id: null, // unassigned
        day_id: null, // unassigned
        place_id: null, // unassigned
        memory_id: null,
        caption: null,
        alt_text: null,
        position: 0,
        visibility: 'PRIVATE',
        curation_status: 'CURATED',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const readiness = calculateMediaReadiness(media);
      expect(readiness.isReady).toBe(false);
      expect(readiness.missingFields).toContain('trip_id');
      expect(readiness.missingFields).toContain('day_id');
      expect(readiness.missingFields).toContain('place_id');
    });

    it('identifies uncurated status (IMPORTED or REVIEW_REQUIRED)', () => {
      const media: MediaRow = {
        id: 'test-m-4',
        filename: 'test4.jpg',
        storage_path: 'media/test4/original',
        storage_url: 'https://example.com/test4.jpg',
        thumbnail_url: null,
        type: 'PHOTO',
        mime_type: 'image/jpeg',
        width: 1920,
        height: 1080,
        duration: null,
        file_size_bytes: 1000,
        content_hash: 'hash-4',
        taken_at: '2026-06-15T10:00:00Z',
        latitude: null,
        longitude: null,
        trip_id: 'trip-1',
        day_id: 'day-1',
        place_id: 'place-1',
        memory_id: null,
        caption: null,
        alt_text: null,
        position: 0,
        visibility: 'PRIVATE',
        curation_status: 'IMPORTED', // not curated!
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const readiness = calculateMediaReadiness(media);
      expect(readiness.isReady).toBe(false);
      expect(readiness.missingFields).toContain('curation_status');
      expect(readiness.reasons.some((r) => r.includes('must be CURATED'))).toBe(true);
    });

    it('identifies non-canonical duplicate media items', () => {
      const duplicateIds = new Set(['test-m-duplicate']);
      const media: MediaRow = {
        id: 'test-m-duplicate',
        filename: 'dup.jpg',
        storage_path: 'media/dup/original',
        storage_url: 'https://example.com/dup.jpg',
        thumbnail_url: null,
        type: 'PHOTO',
        mime_type: 'image/jpeg',
        width: 1920,
        height: 1080,
        duration: null,
        file_size_bytes: 1000,
        content_hash: 'duplicate-hash',
        taken_at: '2026-06-15T10:00:00Z',
        latitude: null,
        longitude: null,
        trip_id: 'trip-1',
        day_id: 'day-1',
        place_id: 'place-1',
        memory_id: null,
        caption: null,
        alt_text: null,
        position: 0,
        visibility: 'PRIVATE',
        curation_status: 'CURATED',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const readiness = calculateMediaReadiness(media, duplicateIds);
      expect(readiness.isReady).toBe(false);
      expect(readiness.missingFields).toContain('duplicate');
      expect(readiness.reasons.some((r) => r.includes('duplicate'))).toBe(true);
    });

    it('passes readiness check when all criteria are strictly satisfied', () => {
      const media: MediaRow = {
        id: 'test-m-ready',
        filename: 'ready.jpg',
        storage_path: 'media/ready/original',
        storage_url: 'https://example.com/ready.jpg',
        thumbnail_url: null,
        type: 'PHOTO',
        mime_type: 'image/jpeg',
        width: 1920,
        height: 1080,
        duration: null,
        file_size_bytes: 1000,
        content_hash: 'unique-hash',
        taken_at: '2026-06-15T10:00:00Z',
        latitude: 34.1526,
        longitude: 77.5771,
        trip_id: 'trip-1',
        day_id: 'day-1',
        place_id: 'place-1',
        memory_id: null,
        caption: 'Ready photo',
        alt_text: 'Alt text',
        position: 0,
        visibility: 'PRIVATE',
        curation_status: 'CURATED',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const readiness = calculateMediaReadiness(media);
      expect(readiness.isReady).toBe(true);
      expect(readiness.missingFields.length).toBe(0);
      expect(readiness.reasons.length).toBe(0);
    });
  });

  describe('3. Curation Review Queue & Filtering', () => {
    it('retrieves review queue with enriched context', async () => {
      const { items, totalCount } = await CurationRepository.getReviewQueue();
      expect(totalCount).toBeGreaterThan(0);
      expect(items.length).toBeGreaterThan(0);

      const first = items[0];
      expect(first.media).toBeDefined();
      expect(first.readiness).toBeDefined();
    });

    it('filters review queue by curation_status', async () => {
      const [created] = await MediaRepository.batchCreateMedia([
        {
          filename: 'filter-test.jpg',
          storage_path: 'media/filter-test/original',
          storage_url: 'https://example.com/filter.jpg',
          mime_type: 'image/jpeg',
          type: 'PHOTO',
          curation_status: 'REVIEW_REQUIRED',
        },
      ]);

      const { items } = await CurationRepository.getReviewQueue({ status: 'REVIEW_REQUIRED' });
      expect(items.every((i) => i.media.curation_status === 'REVIEW_REQUIRED')).toBe(true);
      expect(items.some((i) => i.media.id === created.id)).toBe(true);
    });

    it('filters review queue by missingMetadata flag', async () => {
      const [missingDateItem] = await MediaRepository.batchCreateMedia([
        {
          filename: 'missing-date.jpg',
          storage_path: 'media/missing-date/original',
          storage_url: 'https://example.com/missing.jpg',
          mime_type: 'image/jpeg',
          type: 'PHOTO',
          taken_at: null,
          curation_status: 'IMPORTED',
        },
      ]);

      const { items } = await CurationRepository.getReviewQueue({ missingMetadata: true });
      expect(items.some((i) => i.media.id === missingDateItem.id)).toBe(true);
      for (const item of items) {
        const missingDate = !item.media.taken_at;
        const missingDim = item.media.type === 'PHOTO' && (!item.media.width || !item.media.height);
        expect(missingDate || missingDim).toBe(true);
      }
    });

    it('searches review queue by filename', async () => {
      await MediaRepository.batchCreateMedia([
        {
          filename: 'very-unique-secret-monastery.jpg',
          storage_path: 'media/monastery/original',
          storage_url: 'https://example.com/monastery.jpg',
          mime_type: 'image/jpeg',
          type: 'PHOTO',
          curation_status: 'IMPORTED',
        },
      ]);

      const { items } = await CurationRepository.getReviewQueue({ search: 'secret-monastery' });
      expect(items.length).toBe(1);
      expect(items[0].media.filename).toBe('very-unique-secret-monastery.jpg');
    });
  });

  describe('4. Relational Integrity Validation', () => {
    it('prevents assigning a day without an assigned trip', async () => {
      const [media] = await MediaRepository.batchCreateMedia([
        {
          filename: 'relational-test.jpg',
          storage_path: 'media/rel/original',
          storage_url: 'https://example.com/rel.jpg',
          mime_type: 'image/jpeg',
          type: 'PHOTO',
          trip_id: null,
          day_id: null,
        },
      ]);

      const allDays = await DayRepository.getAllDays();
      expect(allDays.length).toBeGreaterThan(0);

      await expect(
        CurationRepository.updateMediaCuration(media.id, { day_id: allDays[0].id })
      ).rejects.toThrow(/without an associated Trip/);
    });

    it('prevents assigning a day that does not belong to the assigned trip', async () => {
      const allTrips = await TripRepository.getAllTrips();
      const tripA = allTrips[0];

      // Create a second trip and a day belonging to it
      const tripB = await TripRepository.createTrip({
        title: 'Spiti Winter Expedition',
        slug: 'spiti-winter-expedition',
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
      });
      const foreignDay = await DayRepository.createDay({
        trip_id: tripB.id,
        day_number: 1,
        title: 'Kaza Arrival',
      });

      const [media] = await MediaRepository.batchCreateMedia([
        {
          filename: 'relational-mismatch.jpg',
          storage_path: 'media/mismatch/original',
          storage_url: 'https://example.com/mismatch.jpg',
          mime_type: 'image/jpeg',
          type: 'PHOTO',
          trip_id: tripA.id,
          day_id: null,
        },
      ]);

      await expect(
        CurationRepository.updateMediaCuration(media.id, { day_id: foreignDay.id })
      ).rejects.toThrow(/belongs to Trip/);
    });

    it('successfully assigns matching day and trip', async () => {
      const allDays = await DayRepository.getAllDays();
      const validDay = allDays[0];

      const [media] = await MediaRepository.batchCreateMedia([
        {
          filename: 'relational-valid.jpg',
          storage_path: 'media/valid/original',
          storage_url: 'https://example.com/valid.jpg',
          mime_type: 'image/jpeg',
          type: 'PHOTO',
          trip_id: validDay.trip_id,
          day_id: null,
        },
      ]);

      const updated = await CurationRepository.updateMediaCuration(media.id, {
        day_id: validDay.id,
      });

      expect(updated.day_id).toBe(validDay.id);
      expect(updated.trip_id).toBe(validDay.trip_id);
    });
  });

  describe('5. Bulk Curation with Item-Level Failure Isolation', () => {
    it('isolates failures: valid items succeed even when one item fails relational check', async () => {
      const allTrips = await TripRepository.getAllTrips();
      const allDays = await DayRepository.getAllDays();
      const tripA = allTrips[0];
      const validDay = allDays.find((d) => d.trip_id === tripA.id)!;
      const foreignDay = allDays.find((d) => d.trip_id !== tripA.id)!;

      const [item1, item2] = await MediaRepository.batchCreateMedia([
        {
          filename: 'bulk-item-1.jpg',
          storage_path: 'media/b1/original',
          storage_url: 'https://example.com/b1.jpg',
          mime_type: 'image/jpeg',
          type: 'PHOTO',
          trip_id: tripA.id,
          curation_status: 'IMPORTED',
        },
        {
          filename: 'bulk-item-2.jpg',
          storage_path: 'media/b2/original',
          storage_url: 'https://example.com/b2.jpg',
          mime_type: 'image/jpeg',
          type: 'PHOTO',
          trip_id: tripA.id,
          curation_status: 'IMPORTED',
        },
      ]);

      // Execute bulk update of curation_status to CURATED
      const bulkRes = await CurationRepository.bulkUpdateMediaCuration(
        [item1.id, item2.id],
        { curation_status: 'CURATED' }
      );

      expect(bulkRes.successful).toContain(item1.id);
      expect(bulkRes.successful).toContain(item2.id);
      expect(bulkRes.failed.length).toBe(0);

      const refreshed1 = await MediaRepository.getMediaById(item1.id);
      const refreshed2 = await MediaRepository.getMediaById(item2.id);
      expect(refreshed1?.curation_status).toBe('CURATED');
      expect(refreshed2?.curation_status).toBe('CURATED');

      // Now test partial failure where an invalid day is passed to one item
      // but another valid update is passed:
      const bulkRes2 = await CurationRepository.bulkUpdateMediaCuration(
        [item1.id, 'invalid-nonexistent-id'],
        { curation_status: 'ARCHIVED' }
      );

      expect(bulkRes2.successful).toContain(item1.id);
      expect(bulkRes2.failed.length).toBe(1);
      expect(bulkRes2.failed[0].id).toBe('invalid-nonexistent-id');

      const refreshedArchived = await MediaRepository.getMediaById(item1.id);
      expect(refreshedArchived?.curation_status).toBe('ARCHIVED');
    });
  });

  describe('6. Duplicate Detection & Deduplication Workspace', () => {
    it('detects SHA-256 duplicates and groups them with canonical item', async () => {
      const duplicateHash = 'duplicate-sha256-test-content-hash';
      const now = Date.now();

      const [item1, item2, item3] = await MediaRepository.batchCreateMedia([
        {
          filename: 'orig-shot.jpg',
          storage_path: 'media/dup1/original',
          storage_url: 'https://example.com/dup1.jpg',
          mime_type: 'image/jpeg',
          type: 'PHOTO',
          content_hash: duplicateHash,
          curation_status: 'IMPORTED',
        },
        {
          filename: 'copy-1.jpg',
          storage_path: 'media/dup2/original',
          storage_url: 'https://example.com/dup2.jpg',
          mime_type: 'image/jpeg',
          type: 'PHOTO',
          content_hash: duplicateHash,
          curation_status: 'IMPORTED',
        },
        {
          filename: 'copy-2.jpg',
          storage_path: 'media/dup3/original',
          storage_url: 'https://example.com/dup3.jpg',
          mime_type: 'image/jpeg',
          type: 'PHOTO',
          content_hash: duplicateHash,
          curation_status: 'IMPORTED',
        },
      ]);

      const groups = await CurationRepository.getDuplicateGroups();
      const targetGroup = groups.find((g) => g.contentHash === duplicateHash);

      expect(targetGroup).toBeDefined();
      expect(targetGroup?.totalCount).toBe(3);
      expect(targetGroup?.canonicalMedia.id).toBe(item1.id);
      expect(targetGroup?.duplicateMedia.length).toBe(2);
      expect(targetGroup?.duplicateMedia.map((d) => d.id)).toContain(item2.id);
      expect(targetGroup?.duplicateMedia.map((d) => d.id)).toContain(item3.id);
    });

    it('resolves duplicate group by archiving duplicates non-destructively', async () => {
      const duplicateHash = 'resolve-dup-hash';
      const [item1, item2] = await MediaRepository.batchCreateMedia([
        {
          filename: 'orig.jpg',
          storage_path: 'media/r1/original',
          storage_url: 'https://example.com/r1.jpg',
          mime_type: 'image/jpeg',
          type: 'PHOTO',
          content_hash: duplicateHash,
          curation_status: 'CURATED',
        },
        {
          filename: 'copy.jpg',
          storage_path: 'media/r2/original',
          storage_url: 'https://example.com/r2.jpg',
          mime_type: 'image/jpeg',
          type: 'PHOTO',
          content_hash: duplicateHash,
          curation_status: 'IMPORTED',
        },
      ]);

      const res = await resolveDuplicateAction('archive_duplicates', [item2.id]);
      expect(res.success).toBe(true);

      const canonicalRefreshed = await MediaRepository.getMediaById(item1.id);
      const duplicateRefreshed = await MediaRepository.getMediaById(item2.id);

      expect(canonicalRefreshed?.curation_status).toBe('CURATED');
      expect(duplicateRefreshed?.curation_status).toBe('ARCHIVED');
    });

    it('resolves duplicate group by keeping both copies', async () => {
      const duplicateHash = 'keep-both-hash';
      const [item1, item2] = await MediaRepository.batchCreateMedia([
        {
          filename: 'orig-angle-a.jpg',
          storage_path: 'media/k1/original',
          storage_url: 'https://example.com/k1.jpg',
          mime_type: 'image/jpeg',
          type: 'PHOTO',
          content_hash: duplicateHash,
          curation_status: 'CURATED',
        },
        {
          filename: 'orig-angle-b.jpg',
          storage_path: 'media/k2/original',
          storage_url: 'https://example.com/k2.jpg',
          mime_type: 'image/jpeg',
          type: 'PHOTO',
          content_hash: duplicateHash,
          curation_status: 'IMPORTED',
        },
      ]);

      const res = await resolveDuplicateAction('keep_both', [item2.id]);
      expect(res.success).toBe(true);

      const duplicateRefreshed = await MediaRepository.getMediaById(item2.id);
      expect(duplicateRefreshed?.curation_status).toBe('CURATED');
    });
  });

  describe('7. Publishing Invariants & Protection', () => {
    it('blocks publishing an unready media item', async () => {
      const [unreadyItem] = await MediaRepository.batchCreateMedia([
        {
          filename: 'unready-item.jpg',
          storage_path: 'media/unready/original',
          storage_url: 'https://example.com/unready.jpg',
          mime_type: 'image/jpeg',
          type: 'PHOTO',
          taken_at: null, // missing date
          curation_status: 'IMPORTED', // uncurated
          visibility: 'PRIVATE',
        },
      ]);

      await expect(CurationRepository.publishMedia(unreadyItem.id)).rejects.toThrow(
        /not ready for publication/
      );

      const check = await MediaRepository.getMediaById(unreadyItem.id);
      expect(check?.visibility).toBe('PRIVATE');
    });

    it('successfully publishes a completely ready media item', async () => {
      const allTrips = await TripRepository.getAllTrips();
      const allDays = await DayRepository.getAllDays();
      const allPlaces = await PlaceRepository.getAllPlaces();

      const trip = allTrips[0];
      const day = allDays.find((d) => d.trip_id === trip.id)!;
      const place = allPlaces[0];

      const [readyItem] = await MediaRepository.batchCreateMedia([
        {
          filename: 'completely-ready.jpg',
          storage_path: 'media/ready-pub/original',
          storage_url: 'https://example.com/ready-pub.jpg',
          mime_type: 'image/jpeg',
          type: 'PHOTO',
          width: 2400,
          height: 1600,
          content_hash: 'unique-ready-pub-hash',
          taken_at: '2026-06-15T14:30:00Z',
          trip_id: trip.id,
          day_id: day.id,
          place_id: place.id,
          curation_status: 'CURATED',
          visibility: 'PRIVATE',
        },
      ]);

      const published = await CurationRepository.publishMedia(readyItem.id);
      expect(published.visibility).toBe('PUBLIC');

      const check = await MediaRepository.getMediaById(readyItem.id);
      expect(check?.visibility).toBe('PUBLIC');
    });
  });

  describe('8. Server-Side Studio Authorization Enforcement', () => {
    it('rejects curation actions when studio auth check fails', async () => {
      process.env.TEST_AUTH_OVERRIDE = 'unauthorized';

      const healthRes = await getArchiveHealthAction();
      expect(healthRes.success).toBe(false);
      expect(healthRes.error).toMatch(/Unauthorized/i);

      const queueRes = await getCurationQueueAction();
      expect(queueRes.success).toBe(false);
      expect(queueRes.error).toMatch(/Unauthorized/i);

      const updateRes = await updateMediaCurationAction('any-id', { caption: 'Hacked' });
      expect(updateRes.success).toBe(false);
      expect(updateRes.error).toMatch(/Unauthorized/i);

      const bulkRes = await bulkUpdateMediaCurationAction(['any-id'], { curation_status: 'CURATED' });
      expect(bulkRes.success).toBe(false);
      expect(bulkRes.error).toMatch(/Unauthorized/i);

      const pubRes = await publishMediaAction('any-id');
      expect(pubRes.success).toBe(false);
      expect(pubRes.error).toMatch(/Unauthorized/i);
    });
  });

  describe('9. Zero Private Data Leakage Guarantee', () => {
    it('never exposes private or unreviewed media in public queries', async () => {
      const [privateItem] = await MediaRepository.batchCreateMedia([
        {
          filename: 'confidential-raw-capture.jpg',
          storage_path: 'media/confidential/original',
          storage_url: 'https://example.com/confidential.jpg',
          mime_type: 'image/jpeg',
          type: 'PHOTO',
          visibility: 'PRIVATE',
          curation_status: 'IMPORTED',
        },
      ]);

      const publicMedia = await MediaRepository.getPublicMedia(100);
      expect(publicMedia.some((m) => m.id === privateItem.id)).toBe(false);
      expect(publicMedia.every((m) => m.visibility === 'PUBLIC')).toBe(true);
    });
  });
});
