'use server';

import { revalidatePath } from 'next/cache';
import { MemoryRepository, MemoryInsert, MemoryUpdate } from '@/server/repositories/memory-repository';
import { memorySchema } from '@/lib/validation/entities';
import { verifyStudioAuth } from '@/lib/auth/server';

export async function createMemoryAction(payload: {
  title: string;
  description?: string | null;
  journal?: string | null;
  date?: string | null;
  trip_id?: string | null;
  day_id?: string | null;
  place_id?: string | null;
  featured?: boolean;
  visibility?: 'PUBLIC' | 'UNLISTED' | 'PRIVATE';
}) {
  try {
    const auth = await verifyStudioAuth();
    if (!auth.authenticated) {
      return { success: false, error: auth.error || 'Unauthorized: Valid Studio session required' };
    }

    const validated = memorySchema.parse(payload);
    const created = await MemoryRepository.createMemory(validated as MemoryInsert);

    if (payload.trip_id) {
      revalidatePath(`/studio/trips/${payload.trip_id}`);
    }
    revalidatePath('/studio/memories');
    revalidatePath('/studio/dashboard');
    return { success: true, memory: created };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create memory' };
  }
}

export async function updateMemoryAction(id: string, payload: Partial<MemoryUpdate>, tripId?: string) {
  try {
    const auth = await verifyStudioAuth();
    if (!auth.authenticated) {
      return { success: false, error: auth.error || 'Unauthorized: Valid Studio session required' };
    }

    if (!id || typeof id !== 'string' || id.trim() === '') {
      return { success: false, error: 'Valid memory ID is required' };
    }

    const updated = await MemoryRepository.updateMemory(id.trim(), payload);
    if (tripId) {
      revalidatePath(`/studio/trips/${tripId}`);
    }
    revalidatePath('/studio/memories');
    return { success: true, memory: updated };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update memory' };
  }
}

export async function deleteMemoryAction(id: string, tripId?: string) {
  try {
    const auth = await verifyStudioAuth();
    if (!auth.authenticated) {
      return { success: false, error: auth.error || 'Unauthorized: Valid Studio session required' };
    }

    if (!id || typeof id !== 'string' || id.trim() === '') {
      return { success: false, error: 'Valid memory ID is required' };
    }

    await MemoryRepository.deleteMemory(id.trim());
    if (tripId) {
      revalidatePath(`/studio/trips/${tripId}`);
    }
    revalidatePath('/studio/memories');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete memory' };
  }
}
