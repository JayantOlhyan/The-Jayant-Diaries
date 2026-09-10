'use server';

import { revalidatePath } from 'next/cache';
import { MediaRepository } from '@/server/repositories/media-repository';
import { TripRepository } from '@/server/repositories/trip-repository';
import { PlaceRepository } from '@/server/repositories/place-repository';
import { DayRepository } from '@/server/repositories/day-repository';
import { isValidCoordinate } from '@/lib/validation/coordinates';
import { ArchiveBatchItemInput, ArchiveBatchResult } from '@/types/ingestion';
import { MediaInsert } from '@/types/entities';

/**
 * Checks a list of deterministic content hashes (SHA-256) against existing archive media.
 * Returns a mapping of { [contentHash]: existingMediaId }.
 */
export async function checkExistingDuplicatesAction(hashes: string[]): Promise<{
  success: boolean;
  duplicates: Record<string, string>;
  error?: string;
}> {
  try {
    if (!hashes || hashes.length === 0) {
      return { success: true, duplicates: {} };
    }
    const duplicates = await MediaRepository.findMediaByContentHashes(hashes);
    return { success: true, duplicates };
  } catch (error: any) {
    return { success: false, duplicates: {}, error: error.message || 'Failed to check duplicates' };
  }
}

/**
 * Commits a batch of user-approved media items to the canonical database archive.
 * Strictly enforces:
 * 1. Default visibility: 'PRIVATE' (uploading does not publish).
 * 2. Referential integrity (trips, days, places must exist if provided).
 * 3. Coordinate bounds validation if GPS coordinates are provided.
 */
export async function archiveApprovedMediaBatchAction(
  batch: ArchiveBatchItemInput[]
): Promise<ArchiveBatchResult> {
  if (!batch || batch.length === 0) {
    return { success: false, count: 0, createdIds: [], error: 'Empty batch provided' };
  }

  try {
    const inserts: MediaInsert[] = [];
    const affectedTripIds = new Set<string>();

    for (const item of batch) {
      if (!item.filename) {
        throw new Error('All archive items must have a valid filename');
      }

      // Coordinate validation
      let latitude: number | null = null;
      let longitude: number | null = null;
      if (item.latitude != null && item.longitude != null) {
        if (!isValidCoordinate(item.latitude, item.longitude)) {
          throw new Error(
            `Invalid GPS coordinates [${item.latitude}, ${item.longitude}] for ${item.filename}`
          );
        }
        latitude = item.latitude;
        longitude = item.longitude;
      }

      const tripId = item.tripId || item.trip_id;
      const dayId = item.dayId || item.day_id;
      const placeId = item.placeId || item.place_id;

      // Reference validation
      if (tripId) {
        const trip = await TripRepository.getTripById(tripId);
        if (!trip) {
          throw new Error(`Referenced trip ID ${tripId} not found in archive`);
        }
        affectedTripIds.add(tripId);
      }

      if (dayId) {
        const day = await DayRepository.getDayById(dayId);
        if (!day) {
          throw new Error(`Referenced day ID ${dayId} not found in archive`);
        }
      }

      if (placeId) {
        const place = await PlaceRepository.getPlaceById(placeId);
        if (!place) {
          throw new Error(`Referenced place ID ${placeId} not found in archive`);
        }
      }

      const mediaId = item.id || crypto.randomUUID();
      const storagePath = item.storagePath || item.storage_path || `media/${mediaId}/original`;
      const storageUrl = item.storageUrl || item.storage_url || `/uploads/${item.filename}`;
      const mimeType = item.mimeType || item.mime_type || 'image/jpeg';
      const fileSizeBytes = item.fileSizeBytes ?? item.file_size_bytes ?? null;
      const contentHash = item.contentHash || item.content_hash || null;
      const takenAt = item.takenAt || item.taken_at || null;
      const altText = item.altText || item.alt_text || null;
      const rawType = item.type || 'PHOTO';
      const mediaType = (rawType === 'IMAGE' ? 'PHOTO' : rawType) as any;

      inserts.push({
        id: mediaId,
        filename: item.filename,
        storage_path: storagePath,
        storage_url: storageUrl,
        thumbnail_url: item.thumbnailUrl || item.thumbnail_url || storageUrl,
        type: mediaType,
        mime_type: mimeType,
        width: item.width || null,
        height: item.height || null,
        duration: item.duration || null,
        file_size_bytes: fileSizeBytes,
        content_hash: contentHash,
        taken_at: takenAt,
        latitude,
        longitude,
        trip_id: tripId || null,
        day_id: dayId || null,
        place_id: placeId || null,
        caption: item.caption || null,
        alt_text: altText,
        // Strict invariant: All new archive media is PRIVATE by default
        visibility: 'PRIVATE',
      });
    }

    const created = await MediaRepository.batchCreateMedia(inserts);

    // Revalidate affected routes safely
    try {
      revalidatePath('/studio/media');
      revalidatePath('/studio/import');
      revalidatePath('/studio/dashboard');
      for (const tripId of affectedTripIds) {
        revalidatePath(`/studio/trips/${tripId}`);
      }
    } catch {
      // Ignored outside Next.js request context (e.g., in unit tests)
    }

    return {
      success: true,
      count: created.length,
      archivedCount: created.length,
      failedCount: 0,
      createdIds: created.map((m) => m.id),
      errors: [],
    };
  } catch (error: any) {
    return {
      success: false,
      count: 0,
      archivedCount: 0,
      failedCount: batch.length,
      createdIds: [],
      errors: [{ filename: 'batch', reason: error.message || 'Failed to archive media batch' }],
      error: error.message || 'Failed to archive media batch',
    };
  }
}
