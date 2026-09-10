'use server';

import { revalidatePath } from 'next/cache';
import { MediaRepository } from '@/server/repositories/media-repository';
import { ContentReference, MediaRow } from '@/types/entities';
import { verifyStudioAuth } from '@/lib/auth/server';

export async function addMediaReferenceAction(reference: ContentReference) {
  try {
    const auth = await verifyStudioAuth();
    if (!auth.authenticated) {
      return { success: false, error: auth.error || 'Unauthorized: Valid Studio session required' };
    }

    if (!reference || !reference.type) {
      return { success: false, error: 'Valid media reference payload is required' };
    }

    const created = await MediaRepository.createMediaReference(reference);

    if (reference.trip_id) {
      revalidatePath(`/studio/trips/${reference.trip_id}`);
      revalidatePath(`/trips/${reference.trip_id}`);
    }
    revalidatePath('/studio/media');
    revalidatePath('/studio/dashboard');
    revalidatePath('/archive');
    revalidatePath('/gallery');
    return { success: true, media: created };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to add media reference' };
  }
}

export async function updateMediaAction(id: string, payload: Partial<MediaRow>) {
  try {
    const auth = await verifyStudioAuth();
    if (!auth.authenticated) {
      return { success: false, error: auth.error || 'Unauthorized: Valid Studio session required' };
    }

    if (!id || typeof id !== 'string' || id.trim() === '') {
      return { success: false, error: 'Valid media ID is required' };
    }

    const updated = await MediaRepository.updateMedia(id.trim(), payload);
    if (!updated) {
      return { success: false, error: 'Media not found' };
    }

    if (updated.trip_id) {
      revalidatePath(`/studio/trips/${updated.trip_id}`);
      revalidatePath(`/trips/${updated.trip_id}`);
    }
    revalidatePath('/studio/media');
    revalidatePath('/archive');
    revalidatePath('/gallery');
    return { success: true, media: updated };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update media' };
  }
}

export async function deleteMediaAction(id: string, tripId?: string | null) {
  try {
    const auth = await verifyStudioAuth();
    if (!auth.authenticated) {
      return { success: false, error: auth.error || 'Unauthorized: Valid Studio session required' };
    }

    if (!id || typeof id !== 'string' || id.trim() === '') {
      return { success: false, error: 'Valid media ID is required' };
    }

    const success = await MediaRepository.deleteMedia(id.trim());
    if (!success) {
      return { success: false, error: 'Failed to delete media' };
    }

    if (tripId) {
      revalidatePath(`/studio/trips/${tripId}`);
      revalidatePath(`/trips/${tripId}`);
    }
    revalidatePath('/studio/media');
    revalidatePath('/studio/dashboard');
    revalidatePath('/archive');
    revalidatePath('/gallery');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete media' };
  }
}

export async function reorderMediaAction(orderedIds: string[], tripId?: string | null) {
  try {
    const auth = await verifyStudioAuth();
    if (!auth.authenticated) {
      return { success: false, error: auth.error || 'Unauthorized: Valid Studio session required' };
    }

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return { success: false, error: 'Ordered IDs array is required' };
    }

    const cleanIds = orderedIds.map((id) => (typeof id === 'string' ? id.trim() : '')).filter(Boolean);
    const success = await MediaRepository.reorderMedia(cleanIds);
    if (!success) {
      return { success: false, error: 'Failed to reorder media' };
    }

    if (tripId) {
      revalidatePath(`/studio/trips/${tripId}`);
      revalidatePath(`/trips/${tripId}`);
    }
    revalidatePath('/studio/media');
    revalidatePath('/gallery');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to reorder media' };
  }
}

export async function setCoverMediaAction(
  entityType: 'trip' | 'day' | 'place',
  entityId: string,
  mediaId: string
) {
  try {
    const auth = await verifyStudioAuth();
    if (!auth.authenticated) {
      return { success: false, error: auth.error || 'Unauthorized: Valid Studio session required' };
    }

    if (!['trip', 'day', 'place'].includes(entityType)) {
      return { success: false, error: 'Invalid entity type. Must be trip, day, or place' };
    }

    if (!entityId || typeof entityId !== 'string' || entityId.trim() === '') {
      return { success: false, error: 'Valid entity ID is required' };
    }

    if (!mediaId || typeof mediaId !== 'string' || mediaId.trim() === '') {
      return { success: false, error: 'Valid media ID is required' };
    }

    const success = await MediaRepository.setCoverMedia(entityType, entityId.trim(), mediaId.trim());
    if (!success) {
      return { success: false, error: `Failed to set cover media for ${entityType}` };
    }

    if (entityType === 'trip') {
      revalidatePath(`/studio/trips/${entityId}`);
      revalidatePath(`/trips/${entityId}`);
      revalidatePath('/studio/trips');
      revalidatePath('/trips');
    }
    revalidatePath('/studio/media');
    revalidatePath('/archive');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || `Failed to set cover media for ${entityType}` };
  }
}

