import { supabase, isSupabaseConfigured } from '@/lib/db/client';
import { Database } from '@/types/database';
import { MemoryRow } from '@/types/entities';
import { SEED_MEMORIES } from './seed-data';

export type MemoryInsert = Database['public']['Tables']['memories']['Insert'];
export type MemoryUpdate = Database['public']['Tables']['memories']['Update'];

let inMemoryMemories = [...SEED_MEMORIES];

export class MemoryRepository {
  /**
   * Reset in-memory store to initial seed data (useful for test isolation).
   */
  static _resetInMemoryMemories(): void {
    inMemoryMemories = [...SEED_MEMORIES];
  }

  /**
   * Retrieves all public memories for the public archive.
   */
  static async getPublicMemories(): Promise<MemoryRow[]> {
    if (!isSupabaseConfigured) {
      return inMemoryMemories.filter((m) => m.visibility === 'PUBLIC');
    }
    try {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('visibility', 'PUBLIC')
        .order('date', { ascending: false });

      if (error || !data || data.length === 0) {
        return inMemoryMemories.filter((m) => m.visibility === 'PUBLIC');
      }
      return data;
    } catch {
      return inMemoryMemories.filter((m) => m.visibility === 'PUBLIC');
    }
  }

  /**
   * Retrieves all memories for the Studio archive.
   */
  static async getAllMemories(): Promise<MemoryRow[]> {
    if (!isSupabaseConfigured) {
      return inMemoryMemories;
    }
    try {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .order('date', { ascending: false });

      if (error || !data || data.length === 0) {
        return inMemoryMemories;
      }
      return data;
    } catch {
      return inMemoryMemories;
    }
  }

  /**
   * Finds a public memory by its ID.
   */
  static async getPublicMemoryById(id: string): Promise<MemoryRow | null> {
    if (!isSupabaseConfigured) {
      return inMemoryMemories.find((m) => m.id === id && m.visibility === 'PUBLIC') || null;
    }
    try {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('id', id)
        .eq('visibility', 'PUBLIC')
        .single();

      if (error || !data) {
        return inMemoryMemories.find((m) => m.id === id && m.visibility === 'PUBLIC') || null;
      }
      return data;
    } catch {
      return inMemoryMemories.find((m) => m.id === id && m.visibility === 'PUBLIC') || null;
    }
  }

  /**
   * Retrieves memories linked to a specific trip.
   */
  static async getMemoriesByTripId(tripId: string): Promise<MemoryRow[]> {
    if (!isSupabaseConfigured) {
      return inMemoryMemories.filter((m) => m.trip_id === tripId);
    }
    try {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('trip_id', tripId)
        .order('date', { ascending: true });

      if (error || !data || data.length === 0) {
        return inMemoryMemories.filter((m) => m.trip_id === tripId);
      }
      return data;
    } catch {
      return inMemoryMemories.filter((m) => m.trip_id === tripId);
    }
  }

  /**
   * Finds a memory by its unique ID.
   */
  static async getMemoryById(id: string): Promise<MemoryRow | null> {
    if (!isSupabaseConfigured) {
      return inMemoryMemories.find((m) => m.id === id) || null;
    }
    try {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return inMemoryMemories.find((m) => m.id === id) || null;
      }
      return data;
    } catch {
      return inMemoryMemories.find((m) => m.id === id) || null;
    }
  }

  /**
   * Creates a new memory record.
   */
  static async createMemory(payload: MemoryInsert): Promise<MemoryRow> {
    const newMemory: MemoryRow = {
      id: payload.id || crypto.randomUUID(),
      title: payload.title,
      description: payload.description || null,
      journal: payload.journal || null,
      date: payload.date || null,
      trip_id: payload.trip_id || null,
      day_id: payload.day_id || null,
      place_id: payload.place_id || null,
      featured: payload.featured ?? false,
      visibility: payload.visibility || 'PRIVATE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (!isSupabaseConfigured) {
      inMemoryMemories.push(newMemory);
      return newMemory;
    }

    try {
      const { data, error } = await supabase
        .from('memories')
        .insert(newMemory as any)
        .select()
        .single();

      if (!error && data) {
        inMemoryMemories.push(data as MemoryRow);
        return data as MemoryRow;
      }
    } catch {
      // Fall through
    }

    inMemoryMemories.push(newMemory);
    return newMemory;
  }

  /**
   * Updates an existing memory record.
   */
  static async updateMemory(id: string, payload: MemoryUpdate): Promise<MemoryRow | null> {
    if (!isSupabaseConfigured) {
      const index = inMemoryMemories.findIndex((m) => m.id === id);
      if (index === -1) return null;

      inMemoryMemories[index] = {
        ...inMemoryMemories[index],
        ...payload,
        updated_at: new Date().toISOString(),
      };
      return inMemoryMemories[index];
    }

    try {
      const { data, error } = await (supabase.from('memories') as any)
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        inMemoryMemories = inMemoryMemories.map((m) => (m.id === id ? (data as MemoryRow) : m));
        return data as MemoryRow;
      }
    } catch {
      // Fall through
    }

    const index = inMemoryMemories.findIndex((m) => m.id === id);
    if (index === -1) return null;

    inMemoryMemories[index] = {
      ...inMemoryMemories[index],
      ...payload,
      updated_at: new Date().toISOString(),
    };
    return inMemoryMemories[index];
  }

  /**
   * Deletes a memory record.
   */
  static async deleteMemory(id: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      inMemoryMemories = inMemoryMemories.filter((m) => m.id !== id);
      return true;
    }

    try {
      await supabase.from('memories').delete().eq('id', id);
    } catch {
      // Ignore
    }
    inMemoryMemories = inMemoryMemories.filter((m) => m.id !== id);
    return true;
  }
}
