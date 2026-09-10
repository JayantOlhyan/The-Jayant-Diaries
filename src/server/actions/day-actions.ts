'use server';

import { revalidatePath } from 'next/cache';
import { DayRepository, DayInsert, DayUpdate } from '@/server/repositories/day-repository';
import { daySchema } from '@/lib/validation/entities';
import { verifyStudioAuth } from '@/lib/auth/server';

export async function createDayAction(payload: {
  trip_id: string;
  day_number: number;
  date?: string | null;
  title?: string | null;
  description?: string | null;
  journal?: string | null;
}) {
  try {
    const auth = await verifyStudioAuth();
    if (!auth.authenticated) {
      return { success: false, error: auth.error || 'Unauthorized: Valid Studio session required' };
    }

    const validated = daySchema.parse(payload);
    const created = await DayRepository.createDay(validated as DayInsert);

    revalidatePath(`/studio/trips/${payload.trip_id}`);
    revalidatePath('/studio/days');
    revalidatePath('/studio/dashboard');
    return { success: true, day: created };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create day' };
  }
}

export async function updateDayAction(id: string, tripId: string, payload: Partial<DayUpdate>) {
  try {
    const auth = await verifyStudioAuth();
    if (!auth.authenticated) {
      return { success: false, error: auth.error || 'Unauthorized: Valid Studio session required' };
    }

    if (!id || typeof id !== 'string' || id.trim() === '') {
      return { success: false, error: 'Valid day ID is required' };
    }
    if (!tripId || typeof tripId !== 'string' || tripId.trim() === '') {
      return { success: false, error: 'Valid trip ID is required' };
    }

    const updated = await DayRepository.updateDay(id.trim(), payload);
    revalidatePath(`/studio/trips/${tripId}`);
    revalidatePath('/studio/days');
    return { success: true, day: updated };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update day' };
  }
}

export async function deleteDayAction(id: string, tripId: string) {
  try {
    const auth = await verifyStudioAuth();
    if (!auth.authenticated) {
      return { success: false, error: auth.error || 'Unauthorized: Valid Studio session required' };
    }

    if (!id || typeof id !== 'string' || id.trim() === '') {
      return { success: false, error: 'Valid day ID is required' };
    }
    if (!tripId || typeof tripId !== 'string' || tripId.trim() === '') {
      return { success: false, error: 'Valid trip ID is required' };
    }

    await DayRepository.deleteDay(id.trim());
    revalidatePath(`/studio/trips/${tripId}`);
    revalidatePath('/studio/days');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete day' };
  }
}
