import { supabase, isSupabaseConfigured } from '@/lib/db/client';
import { MediaRow, ArchiveHealthStats, MediaReadiness, CurationQueueItem, DuplicateGroup, CurationFilter } from '@/types/entities';
import { MediaRepository } from './media-repository';
import { TripRepository } from './trip-repository';
import { DayRepository } from './day-repository';
import { PlaceRepository } from './place-repository';

/**
 * Deterministically calculates media readiness for publication.
 */
export function calculateMediaReadiness(
  media: MediaRow,
  duplicateMediaIds?: Set<string>
): MediaReadiness {
  const missingFields: string[] = [];
  const reasons: string[] = [];

  if (!media.taken_at) {
    missingFields.push('taken_at');
    reasons.push('Missing capture date (taken_at)');
  }

  if (media.type === 'PHOTO' && (!media.width || !media.height)) {
    missingFields.push('dimensions');
    reasons.push('Missing photo dimensions (width/height)');
  }

  if (!media.trip_id) {
    missingFields.push('trip_id');
    reasons.push('Unassigned trip');
  }

  if (!media.day_id) {
    missingFields.push('day_id');
    reasons.push('Unassigned day');
  }

  if (!media.place_id) {
    missingFields.push('place_id');
    reasons.push('Unassigned place');
  }

  if (media.curation_status !== 'CURATED') {
    missingFields.push('curation_status');
    reasons.push(`Curation status is ${media.curation_status} (must be CURATED)`);
  }

  const isDuplicate = duplicateMediaIds ? duplicateMediaIds.has(media.id) : false;
  if (isDuplicate) {
    missingFields.push('duplicate');
    reasons.push('Identified as duplicate media item');
  }

  const isReady = missingFields.length === 0;

  return {
    isReady,
    missingFields,
    reasons,
    curationStatus: media.curation_status,
    visibility: media.visibility,
  };
}

export class CurationRepository {
  /**
   * Helper to retrieve all media for curation queries (Supabase or in-memory).
   */
  private static async getAllMedia(): Promise<MediaRow[]> {
    if (!isSupabaseConfigured) {
      return MediaRepository._getInMemoryMedia();
    }
    try {
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as MediaRow[];
      }
      return MediaRepository._getInMemoryMedia();
    } catch {
      return MediaRepository._getInMemoryMedia();
    }
  }

  /**
   * Calculates truthful health metrics for the entire media archive.
   * Zero remains strictly 0; no fabricated numbers.
   */
  static async getArchiveHealth(): Promise<ArchiveHealthStats> {
    const allMedia = await this.getAllMedia();

    if (allMedia.length === 0) {
      return {
        totalMedia: 0,
        needsReview: 0,
        missingMetadata: 0,
        unassigned: 0,
        duplicates: 0,
        readyToPublish: 0,
        privateCount: 0,
        publishedCount: 0,
      };
    }

    // Group by content_hash to identify duplicate groups and non-canonical duplicate items
    const hashGroups = new Map<string, MediaRow[]>();
    for (const m of allMedia) {
      if (m.content_hash) {
        const list = hashGroups.get(m.content_hash) || [];
        list.push(m);
        hashGroups.set(m.content_hash, list);
      }
    }

    const duplicateMediaIds = new Set<string>();
    let duplicateItemCount = 0;

    hashGroups.forEach((group) => {
      if (group.length > 1) {
        // Sort earliest created_at first as canonical
        const sorted = [...group].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        // Everything after index 0 is considered a duplicate item
        const duplicates = sorted.slice(1);
        duplicates.forEach((d) => duplicateMediaIds.add(d.id));
        duplicateItemCount += duplicates.length;
      }
    });

    let needsReview = 0;
    let missingMetadata = 0;
    let unassigned = 0;
    let readyToPublish = 0;
    let privateCount = 0;
    let publishedCount = 0;

    for (const m of allMedia) {
      if (m.curation_status === 'IMPORTED' || m.curation_status === 'REVIEW_REQUIRED') {
        needsReview++;
      }

      const hasMissingDate = !m.taken_at;
      const hasMissingDimensions = m.type === 'PHOTO' && (!m.width || !m.height);
      if (hasMissingDate || hasMissingDimensions) {
        missingMetadata++;
      }

      if (!m.trip_id || !m.day_id || !m.place_id) {
        unassigned++;
      }

      if (m.visibility === 'PRIVATE') {
        privateCount++;
      } else if (m.visibility === 'PUBLIC') {
        publishedCount++;
      }

      const readiness = calculateMediaReadiness(m, duplicateMediaIds);
      if (readiness.isReady) {
        readyToPublish++;
      }
    }

    return {
      totalMedia: allMedia.length,
      needsReview,
      missingMetadata,
      unassigned,
      duplicates: duplicateItemCount,
      readyToPublish,
      privateCount,
      publishedCount,
    };
  }

  /**
   * Retrieves duplicate media groups (count >= 2 per content_hash).
   */
  static async getDuplicateGroups(): Promise<DuplicateGroup[]> {
    const allMedia = await this.getAllMedia();
    const hashGroups = new Map<string, MediaRow[]>();

    for (const m of allMedia) {
      if (m.content_hash) {
        const list = hashGroups.get(m.content_hash) || [];
        list.push(m);
        hashGroups.set(m.content_hash, list);
      }
    }

    const groups: DuplicateGroup[] = [];

    hashGroups.forEach((items, contentHash) => {
      if (items.length > 1) {
        const sorted = [...items].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        groups.push({
          contentHash,
          canonicalMedia: sorted[0],
          duplicateMedia: sorted.slice(1),
          totalCount: items.length,
        });
      }
    });

    return groups;
  }

  /**
   * Retrieves media items for the Curation Review Queue matching filters with enriched context.
   */
  static async getReviewQueue(
    filter: CurationFilter = {},
    limit = 50,
    offset = 0
  ): Promise<{ items: CurationQueueItem[]; totalCount: number }> {
    const allMedia = await this.getAllMedia();

    // Compute duplicates map
    const hashGroups = new Map<string, MediaRow[]>();
    for (const m of allMedia) {
      if (m.content_hash) {
        const list = hashGroups.get(m.content_hash) || [];
        list.push(m);
        hashGroups.set(m.content_hash, list);
      }
    }

    const duplicateMediaIds = new Set<string>();
    hashGroups.forEach((group) => {
      if (group.length > 1) {
        const sorted = [...group].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        sorted.slice(1).forEach((d) => duplicateMediaIds.add(d.id));
      }
    });

    // Fetch trips, days, places for context enrichment
    const [trips, days, places] = await Promise.all([
      TripRepository.getAllTrips(),
      DayRepository.getAllDays(),
      PlaceRepository.getAllPlaces(),
    ]);

    const tripMap = new Map(trips.map((t) => [t.id, t]));
    const dayMap = new Map(days.map((d) => [d.id, d]));
    const placeMap = new Map(places.map((p) => [p.id, p]));

    // Filter items
    let filtered = allMedia.filter((m) => {
      // Status filter
      if (filter.status && filter.status !== 'ALL') {
        if (m.curation_status !== filter.status) return false;
      }

      // Missing metadata filter
      if (filter.missingMetadata) {
        const missingDate = !m.taken_at;
        const missingDim = m.type === 'PHOTO' && (!m.width || !m.height);
        if (!missingDate && !missingDim) return false;
      }

      // Unassigned filters
      if (filter.unassignedTrip && m.trip_id) return false;
      if (filter.unassignedDay && m.day_id) return false;
      if (filter.unassignedPlace && m.place_id) return false;

      // Specific trip filter
      if (filter.tripId && m.trip_id !== filter.tripId) return false;

      // Visibility filter
      if (filter.visibility && filter.visibility !== 'ALL') {
        if (m.visibility !== filter.visibility) return false;
      }

      // Search query (filename, caption, alt_text)
      if (filter.search && filter.search.trim() !== '') {
        const query = filter.search.toLowerCase().trim();
        const matchesFilename = m.filename.toLowerCase().includes(query);
        const matchesCaption = m.caption ? m.caption.toLowerCase().includes(query) : false;
        const matchesAlt = m.alt_text ? m.alt_text.toLowerCase().includes(query) : false;
        if (!matchesFilename && !matchesCaption && !matchesAlt) return false;
      }

      return true;
    });

    const totalCount = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    const items: CurationQueueItem[] = paginated.map((media) => {
      const trip = media.trip_id ? tripMap.get(media.trip_id) : undefined;
      const day = media.day_id ? dayMap.get(media.day_id) : undefined;
      const place = media.place_id ? placeMap.get(media.place_id) : undefined;

      const readiness = calculateMediaReadiness(media, duplicateMediaIds);

      return {
        media,
        readiness,
        tripTitle: trip?.title,
        dayTitle: day ? `Day ${day.day_number}${day.title ? `: ${day.title}` : ''}` : undefined,
        placeName: place?.name,
      };
    });

    return { items, totalCount };
  }

  /**
   * Updates curation properties of a single media item with relational integrity verification.
   */
  static async updateMediaCuration(
    mediaId: string,
    updates: Partial<MediaRow>
  ): Promise<MediaRow> {
    const existing = await MediaRepository.getMediaById(mediaId);
    if (!existing) {
      throw new Error(`Media with ID ${mediaId} not found`);
    }

    const finalTripId = updates.trip_id !== undefined ? updates.trip_id : existing.trip_id;
    const finalDayId = updates.day_id !== undefined ? updates.day_id : existing.day_id;

    // Relational Integrity Validation: If day_id is set, it MUST belong to trip_id
    if (finalDayId) {
      if (!finalTripId) {
        throw new Error(`Cannot assign Day ${finalDayId} without an associated Trip.`);
      }
      const day = await DayRepository.getDayById(finalDayId);
      if (!day) {
        throw new Error(`Day with ID ${finalDayId} does not exist.`);
      }
      if (day.trip_id !== finalTripId) {
        throw new Error(`Day ${finalDayId} belongs to Trip ${day.trip_id}, not Trip ${finalTripId}.`);
      }
    }

    // Place verification if place_id is updated
    if (updates.place_id) {
      const place = await PlaceRepository.getPlaceById(updates.place_id);
      if (!place) {
        throw new Error(`Place with ID ${updates.place_id} does not exist.`);
      }
    }

    const updated = await MediaRepository.updateMedia(mediaId, updates);
    if (!updated) {
      throw new Error(`Failed to update media item ${mediaId}`);
    }

    return updated;
  }

  /**
   * Safe bulk updates with item-level failure isolation.
   * If one item fails (e.g. invalid relationship), the rest still proceed.
   */
  static async bulkUpdateMediaCuration(
    mediaIds: string[],
    updates: Partial<MediaRow>
  ): Promise<{ successful: string[]; failed: { id: string; error: string }[] }> {
    const successful: string[] = [];
    const failed: { id: string; error: string }[] = [];

    for (const id of mediaIds) {
      try {
        await this.updateMediaCuration(id, updates);
        successful.push(id);
      } catch (err: any) {
        failed.push({
          id,
          error: err?.message || 'Update failed',
        });
      }
    }

    return { successful, failed };
  }

  /**
   * Publishes a media item after verifying complete readiness.
   */
  static async publishMedia(mediaId: string): Promise<MediaRow> {
    const media = await MediaRepository.getMediaById(mediaId);
    if (!media) {
      throw new Error(`Media with ID ${mediaId} not found`);
    }

    // Check duplicates
    const allMedia = await this.getAllMedia();
    const duplicateIds = new Set<string>();
    const hashGroups = new Map<string, MediaRow[]>();
    for (const m of allMedia) {
      if (m.content_hash) {
        const list = hashGroups.get(m.content_hash) || [];
        list.push(m);
        hashGroups.set(m.content_hash, list);
      }
    }
    hashGroups.forEach((group) => {
      if (group.length > 1) {
        const sorted = [...group].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        sorted.slice(1).forEach((d) => duplicateIds.add(d.id));
      }
    });

    const readiness = calculateMediaReadiness(media, duplicateIds);
    if (!readiness.isReady) {
      throw new Error(
        `Cannot publish media item ${mediaId}: item is not ready for publication. Reasons: ${readiness.reasons.join(', ')}`
      );
    }

    const updated = await MediaRepository.updateMedia(mediaId, { visibility: 'PUBLIC' });
    if (!updated) {
      throw new Error(`Failed to publish media item ${mediaId}`);
    }
    return updated;
  }

  /**
   * Archives a media item by setting curation_status to ARCHIVED.
   * Safe and non-destructive.
   */
  static async archiveMedia(mediaId: string): Promise<MediaRow> {
    const updated = await MediaRepository.updateMedia(mediaId, {
      curation_status: 'ARCHIVED',
    });
    if (!updated) {
      throw new Error(`Failed to archive media item ${mediaId}`);
    }
    return updated;
  }
}
