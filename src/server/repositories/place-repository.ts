import { supabase, isSupabaseConfigured } from '@/lib/db/client';
import { Database } from '@/types/database';
import { PlaceRow } from '@/types/entities';
import { SEED_PLACES } from './seed-data';

export type PlaceInsert = Database['public']['Tables']['places']['Insert'];
export type PlaceUpdate = Database['public']['Tables']['places']['Update'];

let inMemoryPlaces = [...SEED_PLACES];

export class PlaceRepository {
  /**
   * Retrieves all places for public discovery and Studio directory.
   */
  static async getAllPlaces(): Promise<PlaceRow[]> {
    if (!isSupabaseConfigured) {
      return inMemoryPlaces;
    }
    try {
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .order('name', { ascending: true });

      if (error || !data || data.length === 0) {
        return inMemoryPlaces;
      }
      return data;
    } catch {
      return inMemoryPlaces;
    }
  }

  /**
   * Finds a place by slug.
   */
  static async getPlaceBySlug(slug: string): Promise<PlaceRow | null> {
    if (!isSupabaseConfigured) {
      return inMemoryPlaces.find((p) => p.slug === slug) || null;
    }
    try {
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error || !data) {
        return inMemoryPlaces.find((p) => p.slug === slug) || null;
      }
      return data;
    } catch {
      return inMemoryPlaces.find((p) => p.slug === slug) || null;
    }
  }

  /**
   * Finds a place by its unique ID.
   */
  static async getPlaceById(id: string): Promise<PlaceRow | null> {
    if (!isSupabaseConfigured) {
      return inMemoryPlaces.find((p) => p.id === id) || null;
    }
    try {
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return inMemoryPlaces.find((p) => p.id === id) || null;
      }
      return data;
    } catch {
      return inMemoryPlaces.find((p) => p.id === id) || null;
    }
  }

  /**
   * Creates a new place.
   */
  static async createPlace(payload: PlaceInsert): Promise<PlaceRow> {
    const newPlace: PlaceRow = {
      id: payload.id || crypto.randomUUID(),
      name: payload.name,
      slug: payload.slug,
      country: payload.country || 'India',
      state: payload.state || null,
      city: payload.city || null,
      latitude: payload.latitude || null,
      longitude: payload.longitude || null,
      description: payload.description || null,
      cover_media_id: payload.cover_media_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (!isSupabaseConfigured) {
      inMemoryPlaces.push(newPlace);
      return newPlace;
    }

    try {
      const { data, error } = await supabase.from('places').insert(newPlace as any).select().single();
      if (!error && data) {
        inMemoryPlaces.push(data as PlaceRow);
        return data as PlaceRow;
      }
    } catch {
      // Fall through
    }

    inMemoryPlaces.push(newPlace);
    return newPlace;
  }

  /**
   * Updates an existing place.
   */
  static async updatePlace(id: string, payload: PlaceUpdate): Promise<PlaceRow | null> {
    if (!isSupabaseConfigured) {
      const index = inMemoryPlaces.findIndex((p) => p.id === id);
      if (index === -1) return null;

      inMemoryPlaces[index] = {
        ...inMemoryPlaces[index],
        ...payload,
        updated_at: new Date().toISOString(),
      };
      return inMemoryPlaces[index];
    }

    try {
      const { data, error } = await (supabase.from('places') as any)
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        inMemoryPlaces = inMemoryPlaces.map((p) => (p.id === id ? (data as PlaceRow) : p));
        return data as PlaceRow;
      }
    } catch {
      // Fall through
    }

    const index = inMemoryPlaces.findIndex((p) => p.id === id);
    if (index === -1) return null;

    inMemoryPlaces[index] = {
      ...inMemoryPlaces[index],
      ...payload,
      updated_at: new Date().toISOString(),
    };
    return inMemoryPlaces[index];
  }

  /**
   * Deletes a place.
   */
  static async deletePlace(id: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      inMemoryPlaces = inMemoryPlaces.filter((p) => p.id !== id);
      return true;
    }

    try {
      await supabase.from('places').delete().eq('id', id);
    } catch {
      // Ignore
    }
    inMemoryPlaces = inMemoryPlaces.filter((p) => p.id !== id);
    return true;
  }
}
