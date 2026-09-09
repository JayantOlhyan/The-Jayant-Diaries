'use server';

import { revalidatePath } from 'next/cache';
import { MediaRepository } from '@/server/repositories/media-repository';
import { ContentReference, MediaRow } from '@/types/entities';

export async function addMediaReferenceAction(reference: ContentReference) {
  try {
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
    const updated = await MediaRepository.updateMedia(id, payload);
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
    const success = await MediaRepository.deleteMedia(id);
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
    const success = await MediaRepository.reorderMedia(orderedIds);
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
    const success = await MediaRepository.setCoverMedia(entityType, entityId, mediaId);
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

