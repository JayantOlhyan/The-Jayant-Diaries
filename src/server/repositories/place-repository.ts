import { supabase, isSupabaseConfigured } from '@/lib/db/client';
import { Database } from '@/types/database';
import { PlaceRow, PublicMapPlace, StudioGeographicOverview } from '@/types/entities';
import { isValidCoordinate } from '@/lib/validation/coordinates';
import { TripRepository } from './trip-repository';
import { DayRepository } from './day-repository';
import { MemoryRepository } from './memory-repository';
import { MediaRepository } from './media-repository';
import { SEED_PLACES } from './seed-data';

export type PlaceInsert = Database['public']['Tables']['places']['Insert'];
export type PlaceUpdate = Database['public']['Tables']['places']['Update'];

let inMemoryPlaces = [...SEED_PLACES];

export class PlaceRepository {
  /**
   * Reset in-memory store to initial seed data (useful for test isolation).
   */
  static _resetInMemoryPlaces(): void {
    inMemoryPlaces = [...SEED_PLACES];
  }

  /**
   * Retrieves all public places for public discovery and cinematic journeys.
   * If a place has visibility or status attributes, filters out non-public/unpublished places.
   */
  static async getPublicPlaces(): Promise<PlaceRow[]> {
    const places = await this.getAllPlaces();
    return places.filter((p: any) => {
      if (p.visibility && p.visibility !== 'PUBLIC') return false;
      if (p.status && p.status !== 'PUBLISHED') return false;
      return true;
    });
  }

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
      ...(payload as any),
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

  /**
   * Retrieves all public places with valid coordinates for the public geographic archive map.
   * If a journeySlug is provided, filters places to only those explicitly linked to that public journey.
   * Strictly enforces visibility = 'PUBLIC' and status = 'PUBLISHED' across all entities.
   */
  static async getPublicMapPlaces(journeySlug?: string): Promise<PublicMapPlace[]> {
    const [publicPlaces, publicTrips, allDays, publicMemories, publicMedia] = await Promise.all([
      this.getPublicPlaces(),
      TripRepository.getPublicTrips(),
      DayRepository.getAllDays(),
      MemoryRepository.getPublicMemories(),
      MediaRepository.getPublicMedia(1000),
    ]);

    // 1. Strict coordinate validation and privacy check
    const validPlaces = publicPlaces.filter((p) => {
      if ((p as any).visibility && (p as any).visibility !== 'PUBLIC') return false;
      if ((p as any).status && (p as any).status !== 'PUBLISHED') return false;
      return isValidCoordinate(p.latitude, p.longitude);
    });

    // 2. Pre-index explicit relationships for each trip:
    // A place belongs to a trip if and only if:
    // - A day of the trip has day.place_id === place.id or day.places contains place.id
    // - A public memory has memory.trip_id === trip.id && memory.place_id === place.id
    // - A public media has media.trip_id === trip.id && media.place_id === place.id
    const placeToTripsMap = new Map<string, { id: string; title: string; slug: string }[]>();

    for (const place of validPlaces) {
      const linkedTrips: { id: string; title: string; slug: string }[] = [];

      for (const trip of publicTrips) {
        let isLinked = false;

        // Check days
        const tripDays = allDays.filter((d) => d.trip_id === trip.id);
        for (const d of tripDays) {
          if ((d as any).place_id === place.id) {
            isLinked = true;
            break;
          }
          if ('places' in d && Array.isArray((d as any).places)) {
            if ((d as any).places.some((dp: any) => dp?.id === place.id)) {
              isLinked = true;
              break;
            }
          }
        }

        // Check public memories
        if (!isLinked) {
          const tripMemories = publicMemories.filter((m) => m.trip_id === trip.id);
          if (tripMemories.some((m) => m.place_id === place.id)) {
            isLinked = true;
          }
        }

        // Check public media
        if (!isLinked) {
          const tripMedia = publicMedia.filter((m) => m.trip_id === trip.id);
          if (tripMedia.some((m) => m.place_id === place.id)) {
            isLinked = true;
          }
        }

        if (isLinked) {
          linkedTrips.push({
            id: trip.id,
            title: trip.title,
            slug: trip.slug,
          });
        }
      }

      placeToTripsMap.set(place.id, linkedTrips);
    }

    // 3. Filter by journey if journeySlug is provided
    let candidatePlaces = validPlaces;
    if (journeySlug) {
      const targetTrip = publicTrips.find((t) => t.slug === journeySlug);
      if (!targetTrip) {
        // Non-existent or private journey -> return empty list honestly
        return [];
      }
      candidatePlaces = validPlaces.filter((place) => {
        const trips = placeToTripsMap.get(place.id) || [];
        return trips.some((t) => t.id === targetTrip.id);
      });
    }

    // 4. Resolve cover media and build minimal client payload
    const mediaMap = new Map(publicMedia.map((m) => [m.id, m]));

    return candidatePlaces.map((place) => {
      let coverMedia = null;

      if (place.cover_media_id && mediaMap.has(place.cover_media_id)) {
        const m = mediaMap.get(place.cover_media_id)!;
        if (m.visibility === 'PUBLIC') {
          coverMedia = {
            storage_url: m.storage_url,
            thumbnail_url: m.thumbnail_url || null,
            alt_text: m.alt_text || null,
          };
        }
      }

      if (!coverMedia) {
        const placePhoto = publicMedia.find((m) => m.place_id === place.id && m.type === 'PHOTO');
        if (placePhoto && placePhoto.visibility === 'PUBLIC') {
          coverMedia = {
            storage_url: placePhoto.storage_url,
            thumbnail_url: placePhoto.thumbnail_url || null,
            alt_text: placePhoto.alt_text || null,
          };
        }
      }

      const relatedJourneys = placeToTripsMap.get(place.id) || [];

      return {
        id: place.id,
        name: place.name,
        slug: place.slug,
        city: place.city || null,
        state: place.state || null,
        country: place.country,
        latitude: place.latitude as number,
        longitude: place.longitude as number,
        description: place.description || null,
        coverMedia,
        relatedJourneys,
        relatedJourneyCount: relatedJourneys.length,
      };
    });
  }

  /**
   * Retrieves public published journeys for the map filter selector.
   */
  static async getPublicJourneysForMap(): Promise<{ id: string; title: string; slug: string }[]> {
    const publicTrips = await TripRepository.getPublicTrips();
    return publicTrips.map((t) => ({
      id: t.id,
      title: t.title,
      slug: t.slug,
    }));
  }

  /**
   * Retrieves an operational geographic overview for Studio.
   */
  static async getStudioGeographicOverview(): Promise<StudioGeographicOverview> {
    const [allPlaces, allTrips, allDays, allMemories, allMedia] = await Promise.all([
      this.getAllPlaces(),
      TripRepository.getAllStudioTrips(),
      DayRepository.getAllDays(),
      MemoryRepository.getAllMemories(),
      MediaRepository.getAllStudioMedia(),
    ]);

    const mappedPlaces = allPlaces.filter((p) => isValidCoordinate(p.latitude, p.longitude));
    const unmappedPlaces = allPlaces.length - mappedPlaces.length;

    const publicPlacesCount = allPlaces.filter(
      (p: any) => !p.visibility || p.visibility === 'PUBLIC'
    ).length;
    const privatePlacesCount = allPlaces.filter(
      (p: any) => p.visibility === 'PRIVATE'
    ).length;

    const placesDetail = allPlaces.map((place) => {
      const hasCoords = isValidCoordinate(place.latitude, place.longitude);

      // Count journeys explicitly associated with this place
      let journeyCount = 0;
      for (const trip of allTrips) {
        let isLinked = false;
        const tripDays = allDays.filter((d) => d.trip_id === trip.id);
        for (const d of tripDays) {
          if ((d as any).place_id === place.id) {
            isLinked = true;
            break;
          }
          if ('places' in d && Array.isArray((d as any).places)) {
            if ((d as any).places.some((dp: any) => dp?.id === place.id)) {
              isLinked = true;
              break;
            }
          }
        }
        if (!isLinked) {
          const tripMemories = allMemories.filter((m) => m.trip_id === trip.id);
          if (tripMemories.some((m) => m.place_id === place.id)) {
            isLinked = true;
          }
        }
        if (!isLinked) {
          const tripMedia = allMedia.filter((m) => m.trip_id === trip.id);
          if (tripMedia.some((m) => m.place_id === place.id)) {
            isLinked = true;
          }
        }
        if (isLinked) journeyCount++;
      }

      return {
        id: place.id,
        name: place.name,
        slug: place.slug,
        country: place.country,
        state: place.state || null,
        city: place.city || null,
        latitude: hasCoords ? (place.latitude as number) : null,
        longitude: hasCoords ? (place.longitude as number) : null,
        hasCoordinates: hasCoords,
        visibility: (place as any).visibility || 'PUBLIC',
        status: (place as any).status || 'PUBLISHED',
        journeyCount,
      };
    });

    return {
      totalPlaces: allPlaces.length,
      mappedPlaces: mappedPlaces.length,
      unmappedPlaces,
      publicPlacesCount,
      privatePlacesCount,
      places: placesDetail,
    };
  }
}

