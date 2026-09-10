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

      // Reference validation
      if (item.trip_id) {
        const trip = await TripRepository.findById(item.trip_id);
        if (!trip) {
          throw new Error(`Referenced trip ID ${item.trip_id} not found in archive`);
        }
        affectedTripIds.add(item.trip_id);
      }

      if (item.day_id) {
        const day = await DayRepository.findById(item.day_id);
        if (!day) {
          throw new Error(`Referenced day ID ${item.day_id} not found in archive`);
        }
      }

      if (item.place_id) {
        const place = await PlaceRepository.findById(item.place_id);
        if (!place) {
          throw new Error(`Referenced place ID ${item.place_id} not found in archive`);
        }
      }

      const mediaId = crypto.randomUUID();
      const storagePath = item.storage_path || `media/${mediaId}/original`;
      const storageUrl = item.storage_url || `/uploads/${item.filename}`;

      inserts.push({
        id: mediaId,
        filename: item.filename,
        storage_path: storagePath,
        storage_url: storageUrl,
        thumbnail_url: item.thumbnail_url || storageUrl,
        type: item.type,
        mime_type: item.mime_type,
        width: item.width || null,
        height: item.height || null,
        duration: item.duration || null,
        file_size_bytes: item.file_size_bytes || null,
        content_hash: item.content_hash || null,
        taken_at: item.taken_at || null,
        latitude,
        longitude,
        trip_id: item.trip_id || null,
        day_id: item.day_id || null,
        place_id: item.place_id || null,
        caption: item.caption || null,
        alt_text: item.alt_text || null,
        // Strict invariant: All new archive media is PRIVATE by default
        visibility: 'PRIVATE',
      });
    }

    const created = await MediaRepository.batchCreateMedia(inserts);

    // Revalidate affected routes
    revalidatePath('/studio/media');
    revalidatePath('/studio/import');
    revalidatePath('/studio/dashboard');
    for (const tripId of affectedTripIds) {
      revalidatePath(`/studio/trips/${tripId}`);
    }

    return {
      success: true,
      count: created.length,
      createdIds: created.map((m) => m.id),
    };
  } catch (error: any) {
    return {
      success: false,
      count: 0,
      createdIds: [],
      error: error.message || 'Failed to archive media batch',
    };
  }
}
