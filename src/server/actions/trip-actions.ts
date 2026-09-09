'use server';

import { revalidatePath } from 'next/cache';
import { TripRepository, TripInsert, TripUpdate } from '@/server/repositories/trip-repository';
import { tripSchema } from '@/lib/validation/entities';

export async function createTripAction(formData: FormData) {
  try {
    const rawData = {
      title: formData.get('title') as string,
      slug: (formData.get('slug') as string) || (formData.get('title') as string)?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      description: formData.get('description') as string,
      start_date: (formData.get('start_date') as string) || null,
      end_date: (formData.get('end_date') as string) || null,
      status: (formData.get('status') as any) || 'DRAFT',
      visibility: (formData.get('visibility') as any) || 'PRIVATE',
      featured: formData.get('featured') === 'true',
    };

    const validated = tripSchema.parse(rawData);
    const created = await TripRepository.createTrip(validated as TripInsert);

    revalidatePath('/studio/trips');
    revalidatePath('/studio/dashboard');
    revalidatePath('/journeys');
    return { success: true, trip: created };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create trip' };
  }
}

export async function updateTripAction(id: string, payload: Partial<TripUpdate>) {
  try {
    const updated = await TripRepository.updateTrip(id, payload);
    revalidatePath(`/studio/trips/${id}`);
    revalidatePath('/studio/trips');
    revalidatePath('/studio/dashboard');
    return { success: true, trip: updated };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update trip' };
  }
}

export async function deleteTripAction(id: string) {
  try {
    await TripRepository.deleteTrip(id);
    revalidatePath('/studio/trips');
    revalidatePath('/studio/dashboard');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete trip' };
  }
}
