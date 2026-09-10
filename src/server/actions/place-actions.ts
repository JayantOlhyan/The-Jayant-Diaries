'use server';

import { revalidatePath } from 'next/cache';
import { PlaceRepository, PlaceInsert, PlaceUpdate } from '@/server/repositories/place-repository';
import { placeSchema } from '@/lib/validation/entities';
import { verifyStudioAuth } from '@/lib/auth/server';

export async function createPlaceAction(payload: {
  name: string;
  slug?: string;
  country?: string;
  state?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
}) {
  try {
    const auth = await verifyStudioAuth();
    if (!auth.authenticated) {
      return { success: false, error: auth.error || 'Unauthorized: Valid Studio session required' };
    }

    const slug = payload.slug || payload.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const validated = placeSchema.parse({ ...payload, slug });
    const created = await PlaceRepository.createPlace(validated as PlaceInsert);

    revalidatePath('/studio/places');
    revalidatePath('/studio/dashboard');
    revalidatePath('/places');
    return { success: true, place: created };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create place' };
  }
}

export async function updatePlaceAction(id: string, payload: Partial<PlaceUpdate>) {
  try {
    const auth = await verifyStudioAuth();
    if (!auth.authenticated) {
      return { success: false, error: auth.error || 'Unauthorized: Valid Studio session required' };
    }

    if (!id || typeof id !== 'string' || id.trim() === '') {
      return { success: false, error: 'Valid place ID is required' };
    }

    const updated = await PlaceRepository.updatePlace(id.trim(), payload);
    revalidatePath('/studio/places');
    revalidatePath('/places');
    return { success: true, place: updated };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update place' };
  }
}

export async function deletePlaceAction(id: string) {
  try {
    const auth = await verifyStudioAuth();
    if (!auth.authenticated) {
      return { success: false, error: auth.error || 'Unauthorized: Valid Studio session required' };
    }

    if (!id || typeof id !== 'string' || id.trim() === '') {
      return { success: false, error: 'Valid place ID is required' };
    }

    await PlaceRepository.deletePlace(id.trim());
    revalidatePath('/studio/places');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete place' };
  }
}
