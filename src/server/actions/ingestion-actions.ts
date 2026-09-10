'use server';

import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { MediaRepository, MediaInsert } from '@/server/repositories/media-repository';
import { TripRepository } from '@/server/repositories/trip-repository';
import { PlaceRepository } from '@/server/repositories/place-repository';
import { DayRepository } from '@/server/repositories/day-repository';
import { StorageService } from '@/lib/storage/storage-service';
import { verifyStudioAuth } from '@/lib/auth/server';
import { isValidCoordinate } from '@/lib/validation/coordinates';
import {
  ArchiveBatchItemInput,
  ArchiveBatchResult,
  ArchiveItemResult,
} from '@/types/ingestion';

// Allowed MIME types and extensions for Phase 7 media ingestion
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'video/mp4',
  'video/quicktime',
]);

const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'mp4', 'mov']);

// Conservative file size limits
const MAX_IMAGE_SIZE = 50 * 1024 * 1024; // 50 MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500 MB

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
    const auth = await verifyStudioAuth();
    if (!auth.authenticated) {
      return {
        success: false,
        duplicates: {},
        error: auth.error || 'Unauthorized: Valid Studio session required',
      };
    }

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
 * Archives a single media item with binary file persistence to persistent storage.
 * Enforces:
 * 1. Server-side Studio authentication.
 * 2. MIME type, extension, and file size validation.
 * 3. SHA-256 content hash verification and duplicate prevention.
 * 4. Referential integrity and coordinate validation.
 * 5. Persistent storage upload to media-private.
 * 6. Rollback / storage cleanup on database insertion failure.
 * 7. Default PRIVATE visibility.
 */
export async function archiveSingleMediaAction(formData: FormData): Promise<ArchiveItemResult> {
  const auth = await verifyStudioAuth();
  if (!auth.authenticated) {
    return {
      filename: 'unknown',
      success: false,
      status: 'FAILED',
      reason: auth.error || 'Unauthorized: Valid Studio session required',
    };
  }

  const file = formData.get('file') as File | null;
  if (!file) {
    return {
      filename: 'unknown',
      success: false,
      status: 'FAILED',
      reason: 'No file supplied in upload payload',
    };
  }

  const filename = file.name;
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return {
      filename,
      success: false,
      status: 'FAILED',
      reason: `Unsupported file extension .${ext}`,
    };
  }

  let metadata: Record<string, any> = {};
  const rawMetadata = formData.get('metadata');
  if (typeof rawMetadata === 'string') {
    try {
      metadata = JSON.parse(rawMetadata);
    } catch {
      // Ignored, proceed with defaults
    }
  }

  const mimeType = file.type || metadata.mimeType || metadata.mime_type || 'image/jpeg';
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return {
      filename,
      success: false,
      status: 'FAILED',
      reason: `Unsupported MIME type: ${mimeType}`,
    };
  }

  const isVideo = mimeType.startsWith('video/') || ext === 'mp4' || ext === 'mov';
  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  if (file.size > maxSize) {
    return {
      filename,
      success: false,
      status: 'FAILED',
      reason: 'File exceeds maximum supported size.',
    };
  }

  // Read binary buffer & compute SHA-256 hash
  let fileBuffer: Buffer;
  if (typeof (file as any).arrayBuffer === 'function') {
    const arrayBuffer = await (file as any).arrayBuffer();
    fileBuffer = Buffer.from(arrayBuffer);
  } else if (Buffer.isBuffer(file)) {
    fileBuffer = file;
  } else {
    const symbols = Object.getOwnPropertySymbols(file);
    const implSymbol = symbols.find((s) => s.toString().includes('impl'));
    const implBuffer = implSymbol ? (file as any)[implSymbol]?._buffer : undefined;
    if (implBuffer && Buffer.isBuffer(implBuffer)) {
      fileBuffer = implBuffer;
    } else if ((file as any)._buffer && Buffer.isBuffer((file as any)._buffer)) {
      fileBuffer = (file as any)._buffer;
    } else if (typeof (file as any).text === 'function') {
      const text = await (file as any).text();
      fileBuffer = Buffer.from(text);
    } else {
      fileBuffer = Buffer.from(String(file));
    }
  }
  const contentHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  // Exact duplicate check against existing database
  const isOverride = Boolean(
    metadata.overrideDuplicate || metadata.override_duplicate || formData.get('overrideDuplicate') === 'true'
  );

  if (!isOverride) {
    const existingDuplicates = await MediaRepository.findMediaByContentHashes([contentHash]);
    if (existingDuplicates[contentHash]) {
      return {
        itemId: metadata.itemId || metadata.id,
        filename,
        success: false,
        status: 'DUPLICATE',
        mediaId: existingDuplicates[contentHash],
        reason: 'Exact duplicate already exists in archive',
      };
    }
  }

  // GPS coordinates validation
  let latitude: number | null = null;
  let longitude: number | null = null;
  const rawLat = metadata.latitude ?? formData.get('latitude');
  const rawLng = metadata.longitude ?? formData.get('longitude');
  if (rawLat != null && rawLng != null && rawLat !== '' && rawLng !== '') {
    const numLat = Number(rawLat);
    const numLng = Number(rawLng);
    if (!isValidCoordinate(numLat, numLng)) {
      return {
        itemId: metadata.itemId || metadata.id,
        filename,
        success: false,
        status: 'FAILED',
        reason: `Invalid GPS coordinates [${numLat}, ${numLng}] for ${filename}`,
      };
    }
    latitude = numLat;
    longitude = numLng;
  }

  // Reference validations
  const tripId = metadata.tripId || metadata.trip_id || formData.get('tripId') || null;
  const dayId = metadata.dayId || metadata.day_id || formData.get('dayId') || null;
  const placeId = metadata.placeId || metadata.place_id || formData.get('placeId') || null;

  if (tripId) {
    const trip = await TripRepository.getTripById(String(tripId));
    if (!trip) {
      return {
        itemId: metadata.itemId || metadata.id,
        filename,
        success: false,
        status: 'FAILED',
        reason: `Referenced trip ID ${tripId} not found in archive`,
      };
    }
  }

  if (dayId) {
    const day = await DayRepository.getDayById(String(dayId));
    if (!day) {
      return {
        itemId: metadata.itemId || metadata.id,
        filename,
        success: false,
        status: 'FAILED',
        reason: `Referenced day ID ${dayId} not found in archive`,
      };
    }
    if (tripId && day.trip_id !== String(tripId)) {
      return {
        itemId: metadata.itemId || metadata.id,
        filename,
        success: false,
        status: 'FAILED',
        reason: `Referenced day ${dayId} does not belong to trip ${tripId}`,
      };
    }
  }

  if (placeId) {
    const place = await PlaceRepository.getPlaceById(String(placeId));
    if (!place) {
      return {
        itemId: metadata.itemId || metadata.id,
        filename,
        success: false,
        status: 'FAILED',
        reason: `Referenced place ID ${placeId} not found in archive`,
      };
    }
  }

  // Persistent storage upload
  const mediaId = metadata.id || crypto.randomUUID();
  let storagePath: string;
  let storageUrl: string;

  try {
    const uploadRes = await StorageService.uploadMediaFile({
      mediaId,
      fileBuffer,
      mimeType,
      extension: ext,
      bucket: 'media-private',
    });
    storagePath = uploadRes.storagePath;
    storageUrl = uploadRes.storageUrl;
  } catch (storageErr: any) {
    return {
      itemId: metadata.itemId || metadata.id,
      filename,
      success: false,
      status: 'FAILED',
      reason: `Storage upload failed: ${storageErr.message || 'Unknown storage error'}`,
    };
  }

  // Database persistence with storage failure safety cleanup
  const mediaInsert: MediaInsert = {
    id: mediaId,
    filename,
    storage_path: storagePath,
    storage_url: storageUrl,
    thumbnail_url: storageUrl,
    type: isVideo ? 'VIDEO' : 'PHOTO',
    mime_type: mimeType,
    width: metadata.width ? Number(metadata.width) : null,
    height: metadata.height ? Number(metadata.height) : null,
    duration: metadata.duration ? Number(metadata.duration) : null,
    file_size_bytes: file.size,
    content_hash: contentHash,
    taken_at: metadata.takenAt || metadata.taken_at || null,
    latitude,
    longitude,
    trip_id: tripId ? String(tripId) : null,
    day_id: dayId ? String(dayId) : null,
    place_id: placeId ? String(placeId) : null,
    caption: metadata.caption || null,
    alt_text: metadata.altText || metadata.alt_text || null,
    // Strict invariant: All new archive media is PRIVATE by default
    visibility: 'PRIVATE',
  };

  try {
    await MediaRepository.batchCreateMedia([mediaInsert]);
  } catch (dbErr: any) {
    // Failure safety: attempt cleanup of orphaned storage object
    const cleanup = await StorageService.deleteStorageObject({
      storagePath,
      bucket: 'media-private',
    });

    if (!cleanup.success) {
      return {
        itemId: metadata.itemId || metadata.id,
        filename,
        success: false,
        status: 'FAILED',
        reason: `Archive failed. File: ${filename}. Database: Not archived. Storage cleanup: Failed — orphaned object may remain: ${storagePath}`,
      };
    }

    return {
      itemId: metadata.itemId || metadata.id,
      filename,
      success: false,
      status: 'FAILED',
      reason: `Archive failed. File: ${filename}. Database persistence failed: ${dbErr.message || 'Unknown error'}. Storage object cleaned up.`,
    };
  }

  // Revalidate routes safely
  try {
    revalidatePath('/studio/media');
    revalidatePath('/studio/import');
    revalidatePath('/studio/dashboard');
    if (tripId) revalidatePath(`/studio/trips/${tripId}`);
  } catch {
    // Ignored in test environment
  }

  return {
    itemId: metadata.itemId || metadata.id,
    filename,
    success: true,
    status: 'ARCHIVED',
    mediaId,
    storagePath,
    storageUrl,
  };
}

/**
 * Commits a batch of user-approved media items to the canonical database archive.
 * Strictly enforces:
 * 1. Studio authorization.
 * 2. Item-level isolation: Independent failures do not destroy or abort the batch.
 * 3. Exact duplicate protection without duplication.
 * 4. Referential integrity and coordinate validation.
 * 5. Rejection of fictional /uploads/ URLs.
 * 6. Default visibility: 'PRIVATE' (uploading does not publish).
 */
export async function archiveApprovedMediaBatchAction(
  batch: ArchiveBatchItemInput[]
): Promise<ArchiveBatchResult> {
  const auth = await verifyStudioAuth();
  if (!auth.authenticated) {
    return {
      success: false,
      count: 0,
      total: batch ? batch.length : 0,
      archivedCount: 0,
      duplicateCount: 0,
      failedCount: batch ? batch.length : 0,
      createdIds: [],
      items: [],
      errors: [{ filename: 'batch', reason: auth.error || 'Unauthorized: Valid Studio session required' }],
      error: auth.error || 'Unauthorized: Valid Studio session required',
    };
  }

  if (!batch || batch.length === 0) {
    return {
      success: false,
      count: 0,
      total: 0,
      archivedCount: 0,
      duplicateCount: 0,
      failedCount: 0,
      createdIds: [],
      items: [],
      errors: [],
      error: 'Empty batch provided',
    };
  }

  const itemsResults: ArchiveItemResult[] = [];
  const validInserts: MediaInsert[] = [];
  const createdIds: string[] = [];
  const errors: { itemId?: string; filename?: string; reason: string }[] = [];
  const affectedTripIds = new Set<string>();

  let archivedCount = 0;
  let duplicateCount = 0;
  let failedCount = 0;

  // Track hashes seen in the current batch to prevent intra-batch duplicates
  const seenBatchHashes = new Set<string>();

  for (const item of batch) {
    const filename = item.filename;
    const itemId = item.id;

    if (!filename) {
      failedCount++;
      const reason = 'All archive items must have a valid filename';
      errors.push({ itemId, filename: 'unknown', reason });
      itemsResults.push({ itemId, filename: 'unknown', success: false, status: 'FAILED', reason });
      continue;
    }

    // Prohibit fictional /uploads/ URLs
    const rawStorageUrl = item.storageUrl || item.storage_url;
    if (rawStorageUrl && rawStorageUrl.startsWith('/uploads/')) {
      failedCount++;
      const reason = 'Fictional /uploads/ storage URLs are not permitted in canonical archive';
      errors.push({ itemId, filename, reason });
      itemsResults.push({ itemId, filename, success: false, status: 'FAILED', reason });
      continue;
    }

    // Require persistent storage reference
    const storagePath = item.storagePath || item.storage_path;
    const storageUrl = rawStorageUrl;
    if (!storagePath || !storageUrl) {
      failedCount++;
      const reason = `Missing persistent storage for file ${filename}. Media must be uploaded to persistent storage before archiving.`;
      errors.push({ itemId, filename, reason });
      itemsResults.push({ itemId, filename, success: false, status: 'FAILED', reason });
      continue;
    }

    // Duplicate check
    const contentHash = item.contentHash || item.content_hash || null;
    const isOverride = Boolean(item.overrideDuplicate || item.override_duplicate);

    if (contentHash && !isOverride) {
      if (seenBatchHashes.has(contentHash)) {
        duplicateCount++;
        const reason = 'Duplicate file within the same upload batch';
        errors.push({ itemId, filename, reason });
        itemsResults.push({ itemId, filename, success: false, status: 'DUPLICATE', reason });
        continue;
      }
      seenBatchHashes.add(contentHash);

      const existingDuplicates = await MediaRepository.findMediaByContentHashes([contentHash]);
      if (existingDuplicates[contentHash]) {
        duplicateCount++;
        const existingMediaId = existingDuplicates[contentHash];
        itemsResults.push({
          itemId,
          filename,
          success: false,
          status: 'DUPLICATE',
          mediaId: existingMediaId,
          reason: 'Exact duplicate already exists in archive',
        });
        continue;
      }
    }

    // Coordinate validation
    let latitude: number | null = null;
    let longitude: number | null = null;
    if (item.latitude != null && item.longitude != null) {
      if (!isValidCoordinate(item.latitude, item.longitude)) {
        failedCount++;
        const reason = `Invalid GPS coordinates [${item.latitude}, ${item.longitude}] for ${filename}`;
        errors.push({ itemId, filename, reason });
        itemsResults.push({ itemId, filename, success: false, status: 'FAILED', reason });
        continue;
      }
      latitude = item.latitude;
      longitude = item.longitude;
    }

    const tripId = item.tripId || item.trip_id;
    const dayId = item.dayId || item.day_id;
    const placeId = item.placeId || item.place_id;

    // Referential integrity validations
    let refError: string | null = null;

    if (tripId) {
      const trip = await TripRepository.getTripById(tripId);
      if (!trip) {
        refError = `Referenced trip ID ${tripId} not found in archive`;
      } else {
        affectedTripIds.add(tripId);
      }
    }

    if (!refError && dayId) {
      const day = await DayRepository.getDayById(dayId);
      if (!day) {
        refError = `Referenced day ID ${dayId} not found in archive`;
      } else if (tripId && day.trip_id !== tripId) {
        refError = `Referenced day ${dayId} does not belong to trip ${tripId}`;
      }
    }

    if (!refError && placeId) {
      const place = await PlaceRepository.getPlaceById(placeId);
      if (!place) {
        refError = `Referenced place ID ${placeId} not found in archive`;
      }
    }

    if (refError) {
      failedCount++;
      errors.push({ itemId, filename, reason: refError });
      itemsResults.push({ itemId, filename, success: false, status: 'FAILED', reason: refError });
      continue;
    }

    const mediaId = item.id || crypto.randomUUID();
    const mimeType = item.mimeType || item.mime_type || 'image/jpeg';
    const fileSizeBytes = item.fileSizeBytes ?? item.file_size_bytes ?? null;
    const takenAt = item.takenAt || item.taken_at || null;
    const altText = item.altText || item.alt_text || null;
    const mediaType = item.type || 'PHOTO';

    const insert: MediaInsert = {
      id: mediaId,
      filename,
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
    };

    try {
      const [created] = await MediaRepository.batchCreateMedia([insert]);
      archivedCount++;
      createdIds.push(created.id);
      itemsResults.push({
        itemId,
        filename,
        success: true,
        status: 'ARCHIVED',
        mediaId: created.id,
        storagePath,
        storageUrl,
      });
    } catch (dbErr: any) {
      failedCount++;
      const reason = `Database persistence failed: ${dbErr.message || 'Unknown database error'}`;
      errors.push({ itemId, filename, reason });
      itemsResults.push({ itemId, filename, success: false, status: 'FAILED', reason });
    }
  }

  // Revalidate affected routes safely
  try {
    revalidatePath('/studio/media');
    revalidatePath('/studio/import');
    revalidatePath('/studio/dashboard');
    for (const tripId of affectedTripIds) {
      revalidatePath(`/studio/trips/${tripId}`);
    }
  } catch {
    // Ignored in test context
  }

  return {
    success: archivedCount > 0 && failedCount === 0,
    count: batch.length,
    total: batch.length,
    archivedCount,
    duplicateCount,
    failedCount,
    createdIds,
    items: itemsResults,
    errors,
    error: failedCount > 0 ? `${failedCount} item(s) failed to archive` : undefined,
  };
}
