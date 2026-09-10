'use server';

import { revalidatePath } from 'next/cache';
import { verifyStudioAuth } from '@/lib/auth/server';
import {
  CurationRepository,
} from '@/server/repositories/curation-repository';
import { TripRepository } from '@/server/repositories/trip-repository';
import { DayRepository } from '@/server/repositories/day-repository';
import { PlaceRepository } from '@/server/repositories/place-repository';
import {
  MediaRow,
  ArchiveHealthStats,
  CurationFilter,
  CurationQueueItem,
  DuplicateGroup,
  TripRow,
  DayRow,
  PlaceRow,
} from '@/types/entities';

/**
 * Retrieves truthful archive health stats.
 */
export async function getArchiveHealthAction(): Promise<{
  success: boolean;
  stats?: ArchiveHealthStats;
  error?: string;
}> {
  try {
    const auth = await verifyStudioAuth();
    if (!auth.authenticated) {
      return { success: false, error: auth.error || 'Unauthorized: Valid Studio session required' };
    }

    const stats = await CurationRepository.getArchiveHealth();
    return { success: true, stats };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to calculate archive health' };
  }
}

/**
 * Retrieves items for the curation review queue with filters and pagination.
 */
export async function getCurationQueueAction(
  filter: CurationFilter = {},
  limit = 50,
  offset = 0
): Promise<{
  success: boolean;
  items?: CurationQueueItem[];
  totalCount?: number;
  error?: string;
}> {
  try {
    const auth = await verifyStudioAuth();
    if (!auth.authenticated) {
      return { success: false, error: auth.error || 'Unauthorized: Valid Studio session required' };
    }

    const { items, totalCount } = await CurationRepository.getReviewQueue(filter, limit, offset);
    return { success: true, items, totalCount };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to retrieve curation queue' };
  }
}

function safeRevalidate(paths: string[]) {
  try {
    for (const p of paths) {
      revalidatePath(p);
    }
  } catch {
    // Ignored in non-Next.js or test environments
  }
}

/**
 * Updates a single media item's curation attributes.
 */
export async function updateMediaCurationAction(
  mediaId: string,
  updates: Partial<MediaRow>
): Promise<{
  success: boolean;
  media?: MediaRow;
  error?: string;
}> {
  try {
    const auth = await verifyStudioAuth();
    if (!auth.authenticated) {
      return { success: false, error: auth.error || 'Unauthorized: Valid Studio session required' };
    }

    const media = await CurationRepository.updateMediaCuration(mediaId, updates);
    safeRevalidate(['/studio/archive', '/studio/media']);
    return { success: true, media };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update media curation' };
  }
}

/**
 * Safe bulk updates with item-level failure isolation.
 */
export async function bulkUpdateMediaCurationAction(
  mediaIds: string[],
  updates: Partial<MediaRow>
): Promise<{
  success: boolean;
  successful?: string[];
  failed?: { id: string; error: string }[];
  error?: string;
}> {
  try {
    const auth = await verifyStudioAuth();
    if (!auth.authenticated) {
      return { success: false, error: auth.error || 'Unauthorized: Valid Studio session required' };
    }

    const result = await CurationRepository.bulkUpdateMediaCuration(mediaIds, updates);
    safeRevalidate(['/studio/archive', '/studio/media']);
    return { success: true, successful: result.successful, failed: result.failed };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to perform bulk curation' };
  }
}

/**
 * Retrieves duplicate media groups for deduplication.
 */
export async function getDuplicateGroupsAction(): Promise<{
  success: boolean;
  groups?: DuplicateGroup[];
  error?: string;
}> {
  try {
    const auth = await verifyStudioAuth();
    if (!auth.authenticated) {
      return { success: false, error: auth.error || 'Unauthorized: Valid Studio session required' };
    }

    const groups = await CurationRepository.getDuplicateGroups();
    return { success: true, groups };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to find duplicate groups' };
  }
}

/**
 * Publishes a media item after verifying complete readiness.
 */
export async function publishMediaAction(mediaId: string): Promise<{
  success: boolean;
  media?: MediaRow;
  error?: string;
}> {
  try {
    const auth = await verifyStudioAuth();
    if (!auth.authenticated) {
      return { success: false, error: auth.error || 'Unauthorized: Valid Studio session required' };
    }

    const media = await CurationRepository.publishMedia(mediaId);
    safeRevalidate(['/studio/archive', '/studio/media', '/journeys']);
    return { success: true, media };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to publish media' };
  }
}

/**
 * Archives a media item non-destructively.
 */
export async function archiveMediaAction(mediaId: string): Promise<{
  success: boolean;
  media?: MediaRow;
  error?: string;
}> {
  try {
    const auth = await verifyStudioAuth();
    if (!auth.authenticated) {
      return { success: false, error: auth.error || 'Unauthorized: Valid Studio session required' };
    }

    const media = await CurationRepository.archiveMedia(mediaId);
    safeRevalidate(['/studio/archive', '/studio/media']);
    return { success: true, media };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to archive media' };
  }
}

/**
 * Resolves duplicates: either archives duplicate items or marks them as kept (curated).
 */
export async function resolveDuplicateAction(
  action: 'archive_duplicates' | 'keep_both',
  duplicateIds: string[]
): Promise<{
  success: boolean;
  successful?: string[];
  failed?: { id: string; error: string }[];
  error?: string;
}> {
  try {
    const auth = await verifyStudioAuth();
    if (!auth.authenticated) {
      return { success: false, error: auth.error || 'Unauthorized: Valid Studio session required' };
    }

    const updates: Partial<MediaRow> = {
      curation_status: action === 'archive_duplicates' ? 'ARCHIVED' : 'CURATED',
    };

    const result = await CurationRepository.bulkUpdateMediaCuration(duplicateIds, updates);
    safeRevalidate(['/studio/archive', '/studio/media']);
    return { success: true, successful: result.successful, failed: result.failed };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to resolve duplicates' };
  }
}

/**
 * Retrieves contextual trips, days, and places for curation dropdowns.
 */
export async function getCurationContextDataAction(): Promise<{
  success: boolean;
  trips?: TripRow[];
  days?: DayRow[];
  places?: PlaceRow[];
  error?: string;
}> {
  try {
    const auth = await verifyStudioAuth();
    if (!auth.authenticated) {
      return { success: false, error: auth.error || 'Unauthorized: Valid Studio session required' };
    }

    const [trips, days, places] = await Promise.all([
      TripRepository.getAllTrips(),
      DayRepository.getAllDays(),
      PlaceRepository.getAllPlaces(),
    ]);

    return { success: true, trips, days, places };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to load context data' };
  }
}
