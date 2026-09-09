import { supabase, isSupabaseConfigured } from '@/lib/db/client';
import { Database } from '@/types/database';
import { TripWithDetails, TripRow } from '@/types/entities';
import { SEED_TRIPS, SEED_MEDIA } from './seed-data';
import { DayRepository } from './day-repository';
import { PlaceRepository } from './place-repository';
import { MemoryRepository } from './memory-repository';
import { MediaRepository } from './media-repository';

export type TripInsert = Database['public']['Tables']['trips']['Insert'];
export type TripUpdate = Database['public']['Tables']['trips']['Update'];

let inMemoryTrips = [...SEED_TRIPS];

export class TripRepository {
  /**
   * Retrieves all published public trips for the public frontend.
   */
  static async getPublicTrips(): Promise<TripRow[]> {
    if (!isSupabaseConfigured) {
      return inMemoryTrips.filter((t) => t.visibility === 'PUBLIC' && t.status === 'PUBLISHED');
    }
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('visibility', 'PUBLIC')
        .eq('status', 'PUBLISHED')
        .order('start_date', { ascending: false });

      if (error || !data || data.length === 0) {
        return inMemoryTrips.filter((t) => t.visibility === 'PUBLIC' && t.status === 'PUBLISHED');
      }
      return data;
    } catch {
      return inMemoryTrips.filter((t) => t.visibility === 'PUBLIC' && t.status === 'PUBLISHED');
    }
  }

  /**
   * Finds a published trip by its unique slug.
   */
  static async getPublicTripBySlug(slug: string): Promise<TripRow | null> {
    if (!isSupabaseConfigured) {
      return inMemoryTrips.find((t) => t.slug === slug && t.visibility === 'PUBLIC' && t.status === 'PUBLISHED') || null;
    }
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('slug', slug)
        .eq('visibility', 'PUBLIC')
        .eq('status', 'PUBLISHED')
        .single();

      if (error || !data) {
        return inMemoryTrips.find((t) => t.slug === slug && t.visibility === 'PUBLIC' && t.status === 'PUBLISHED') || null;
      }
      return data;
    } catch {
      return inMemoryTrips.find((t) => t.slug === slug && t.visibility === 'PUBLIC' && t.status === 'PUBLISHED') || null;
    }
  }

  /**
   * Retrieves all trips for the Studio manager.
   */
  static async getAllStudioTrips(): Promise<TripRow[]> {
    if (!isSupabaseConfigured) {
      return inMemoryTrips;
    }
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return inMemoryTrips;
      }
      return data;
    } catch {
      return inMemoryTrips;
    }
  }

  /**
   * Finds any trip by its unique ID.
   */
  static async getTripById(id: string): Promise<TripRow | null> {
    if (!isSupabaseConfigured) {
      return inMemoryTrips.find((t) => t.id === id) || null;
    }
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return inMemoryTrips.find((t) => t.id === id) || null;
      }
      return data;
    } catch {
      return inMemoryTrips.find((t) => t.id === id) || null;
    }
  }

  /**
   * Retrieves a trip with its complete relational hierarchy: days, places, memories, and media.
   */
  static async getTripWithDetails(id: string): Promise<TripWithDetails | null> {
    const trip = await this.getTripById(id);
    if (!trip) return null;

    // Load related days
    const days = await DayRepository.getDaysByTripId(id);

    // Load related places
    const places = await PlaceRepository.getAllPlaces();

    // Load related memories
    const memories = await MemoryRepository.getMemoriesByTripId(id);

    // Load related media
    const media = await MediaRepository.getMediaByTripId(id);

    // Load cover media
    const coverMedia = (trip.cover_media_id ? await MediaRepository.getMediaById(trip.cover_media_id) : null) || media[0] || SEED_MEDIA[0];

    return {
      ...trip,
      cover_media: coverMedia,
      days: days.map((day) => ({
        ...day,
        places: places.filter((p) => p.name === 'Leh' || p.name === 'Magnetic Hill' || p.name === 'Nubra Valley'),
        memories: memories.filter((m) => m.day_id === day.id),
        media: media.filter((m) => m.day_id === day.id),
      })),
      places,
      memories,
      media,
      media_count: media.length,
    };
  }

  /**
   * Creates a new trip.
   */
  static async createTrip(payload: TripInsert): Promise<TripRow> {
    const newTrip: TripRow = {
      id: payload.id || crypto.randomUUID(),
      title: payload.title,
      slug: payload.slug,
      description: payload.description || null,
      cover_media_id: payload.cover_media_id || null,
      start_date: payload.start_date || null,
      end_date: payload.end_date || null,
      status: payload.status || 'DRAFT',
      featured: payload.featured ?? false,
      visibility: payload.visibility || 'PRIVATE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (!isSupabaseConfigured) {
      inMemoryTrips.unshift(newTrip);
      return newTrip;
    }

    try {
      const { data, error } = await supabase.from('trips').insert(newTrip as any).select().single();
      if (!error && data) {
        inMemoryTrips.unshift(data as TripRow);
        return data as TripRow;
      }
    } catch {
      // Fall through
    }

    inMemoryTrips.unshift(newTrip);
    return newTrip;
  }

  /**
   * Updates an existing trip.
   */
  static async updateTrip(id: string, payload: TripUpdate): Promise<TripRow | null> {
    if (!isSupabaseConfigured) {
      const index = inMemoryTrips.findIndex((t) => t.id === id);
      if (index === -1) return null;
      inMemoryTrips[index] = {
        ...inMemoryTrips[index],
        ...payload,
        updated_at: new Date().toISOString(),
      };
      return inMemoryTrips[index];
    }

    try {
      const { data, error } = await (supabase.from('trips') as any)
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        inMemoryTrips = inMemoryTrips.map((t) => (t.id === id ? (data as TripRow) : t));
        return data as TripRow;
      }
    } catch {
      // Fall through
    }

    const index = inMemoryTrips.findIndex((t) => t.id === id);
    if (index === -1) return null;

    inMemoryTrips[index] = {
      ...inMemoryTrips[index],
      ...payload,
      updated_at: new Date().toISOString(),
    };
    return inMemoryTrips[index];
  }

  /**
   * Deletes a trip.
   */
  static async deleteTrip(id: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      inMemoryTrips = inMemoryTrips.filter((t) => t.id !== id);
      return true;
    }

    try {
      await supabase.from('trips').delete().eq('id', id);
    } catch {
      // Ignore
    }
    inMemoryTrips = inMemoryTrips.filter((t) => t.id !== id);
    return true;
  }
}
