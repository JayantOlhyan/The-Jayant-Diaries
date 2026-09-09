'use server';

import { revalidatePath } from 'next/cache';
import { DayRepository, DayInsert, DayUpdate } from '@/server/repositories/day-repository';
import { daySchema } from '@/lib/validation/entities';

export async function createDayAction(payload: {
  trip_id: string;
  day_number: number;
  date?: string | null;
  title?: string | null;
  description?: string | null;
  journal?: string | null;
}) {
  try {
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
    const updated = await DayRepository.updateDay(id, payload);
    revalidatePath(`/studio/trips/${tripId}`);
    revalidatePath('/studio/days');
    return { success: true, day: updated };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update day' };
  }
}

export async function deleteDayAction(id: string, tripId: string) {
  try {
    await DayRepository.deleteDay(id);
    revalidatePath(`/studio/trips/${tripId}`);
    revalidatePath('/studio/days');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete day' };
  }
}
