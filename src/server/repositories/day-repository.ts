import { supabase, isSupabaseConfigured } from '@/lib/db/client';
import { Database } from '@/types/database';
import { DayRow } from '@/types/entities';
import { SEED_DAYS } from './seed-data';

export type DayInsert = Database['public']['Tables']['days']['Insert'];
export type DayUpdate = Database['public']['Tables']['days']['Update'];

let inMemoryDays = [...SEED_DAYS];

export class DayRepository {
  /**
   * Reset in-memory store to initial seed data (useful for test isolation).
   */
  static _resetInMemoryDays(): void {
    inMemoryDays = [...SEED_DAYS];
  }

  /**
   * Retrieves all days belonging to a specific trip, ordered chronologically.
   */
  static async getDaysByTripId(tripId: string): Promise<DayRow[]> {
    if (!isSupabaseConfigured) {
      return inMemoryDays.filter((d) => d.trip_id === tripId).sort((a, b) => a.day_number - b.day_number);
    }
    try {
      const { data, error } = await supabase
        .from('days')
        .select('*')
        .eq('trip_id', tripId)
        .order('day_number', { ascending: true });

      if (error || !data || data.length === 0) {
        return inMemoryDays.filter((d) => d.trip_id === tripId).sort((a, b) => a.day_number - b.day_number);
      }
      return data;
    } catch {
      return inMemoryDays.filter((d) => d.trip_id === tripId).sort((a, b) => a.day_number - b.day_number);
    }
  }

  /**
   * Retrieves all days across the archive.
   */
  static async getAllDays(): Promise<DayRow[]> {
    if (!isSupabaseConfigured) {
      return inMemoryDays;
    }
    try {
      const { data, error } = await supabase
        .from('days')
        .select('*')
        .order('date', { ascending: false });

      if (error || !data || data.length === 0) {
        return inMemoryDays;
      }
      return data;
    } catch {
      return inMemoryDays;
    }
  }

  /**
   * Finds a day by its unique ID.
   */
  static async getDayById(id: string): Promise<DayRow | null> {
    if (!isSupabaseConfigured) {
      return inMemoryDays.find((d) => d.id === id) || null;
    }
    try {
      const { data, error } = await supabase
        .from('days')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return inMemoryDays.find((d) => d.id === id) || null;
      }
      return data;
    } catch {
      return inMemoryDays.find((d) => d.id === id) || null;
    }
  }

  /**
   * Creates a new day record within a trip.
   */
  static async createDay(payload: DayInsert): Promise<DayRow> {
    const newDay: DayRow = {
      id: payload.id || crypto.randomUUID(),
      trip_id: payload.trip_id,
      day_number: payload.day_number,
      date: payload.date || null,
      title: payload.title || null,
      description: payload.description || null,
      journal: payload.journal || null,
      cover_media_id: payload.cover_media_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (!isSupabaseConfigured) {
      inMemoryDays.push(newDay);
      return newDay;
    }

    try {
      const { data, error } = await supabase
        .from('days')
        .insert(newDay as any)
        .select()
        .single();

      if (!error && data) {
        inMemoryDays.push(data as DayRow);
        return data as DayRow;
      }
    } catch {
      // Fall through to in-memory store
    }

    inMemoryDays.push(newDay);
    return newDay;
  }

  /**
   * Updates an existing day record.
   */
  static async updateDay(id: string, payload: DayUpdate): Promise<DayRow | null> {
    if (!isSupabaseConfigured) {
      const index = inMemoryDays.findIndex((d) => d.id === id);
      if (index === -1) return null;

      inMemoryDays[index] = {
        ...inMemoryDays[index],
        ...payload,
        updated_at: new Date().toISOString(),
      };
      return inMemoryDays[index];
    }

    try {
      const { data, error } = await (supabase.from('days') as any)
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        inMemoryDays = inMemoryDays.map((d) => (d.id === id ? (data as DayRow) : d));
        return data as DayRow;
      }
    } catch {
      // Fall through
    }

    const index = inMemoryDays.findIndex((d) => d.id === id);
    if (index === -1) return null;

    inMemoryDays[index] = {
      ...inMemoryDays[index],
      ...payload,
      updated_at: new Date().toISOString(),
    };
    return inMemoryDays[index];
  }

  /**
   * Deletes a day.
   */
  static async deleteDay(id: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      inMemoryDays = inMemoryDays.filter((d) => d.id !== id);
      return true;
    }

    try {
      await supabase.from('days').delete().eq('id', id);
    } catch {
      // Ignore
    }
    inMemoryDays = inMemoryDays.filter((d) => d.id !== id);
    return true;
  }
}
