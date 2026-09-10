import { supabase, isSupabaseConfigured } from '@/lib/db/client';
import { Database, VisibilityType } from '@/types/database';
import { MediaRow, ContentReference } from '@/types/entities';
import { SEED_MEDIA } from './seed-data';

export type MediaInsert = Database['public']['Tables']['media']['Insert'];
export type MediaUpdate = Database['public']['Tables']['media']['Update'];

let inMemoryMedia: MediaRow[] = [...SEED_MEDIA];
let simulateInsertFailure = false;

export class MediaRepository {
  /**
   * Reset in-memory store to initial seed data (useful for test isolation).
   */
  static _resetInMemoryMedia(): void {
    inMemoryMedia = [...SEED_MEDIA];
    simulateInsertFailure = false;
  }

  /**
   * Directly set in-memory media store (useful for testing custom datasets and empty archives).
   */
  static _setInMemoryMedia(media: MediaRow[]): void {
    inMemoryMedia = [...media];
  }

  /**
   * Access in-memory media store (useful for test isolation and fallback curation queries).
   */
  static _getInMemoryMedia(): MediaRow[] {
    return inMemoryMedia;
  }

  /**
   * Test hook to simulate database insertion failure for failure-safety testing.
   */
  static _setSimulateInsertFailure(simulate: boolean): void {
    simulateInsertFailure = simulate;
  }

  /**
   * Retrieves public media assets with pagination support.
   */
  static async getPublicMedia(limit = 50, offset = 0): Promise<MediaRow[]> {
    if (!isSupabaseConfigured) {
      return inMemoryMedia
        .filter((m) => m.visibility === 'PUBLIC')
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .slice(offset, offset + limit);
    }
    try {
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('visibility', 'PUBLIC')
        .order('position', { ascending: true })
        .order('taken_at', { ascending: false, nullsFirst: false })
        .range(offset, offset + limit - 1);

      if (error || !data || data.length === 0) {
        return inMemoryMedia
          .filter((m) => m.visibility === 'PUBLIC')
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
          .slice(offset, offset + limit);
      }
      return data;
    } catch {
      return inMemoryMedia
        .filter((m) => m.visibility === 'PUBLIC')
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .slice(offset, offset + limit);
    }
  }

  /**
   * Retrieves all media assets for the Studio manager.
   */
  static async getAllStudioMedia(): Promise<MediaRow[]> {
    if (!isSupabaseConfigured) {
      return [...inMemoryMedia].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    }
    try {
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .order('position', { ascending: true })
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return [...inMemoryMedia].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      }
      return data;
    } catch {
      return [...inMemoryMedia].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    }
  }

  /**
   * Retrieves media associated with a specific trip, ordered by position.
   */
  static async getMediaForTrip(tripId: string, options?: { visibility?: VisibilityType }): Promise<MediaRow[]> {
    if (!isSupabaseConfigured) {
      return inMemoryMedia
        .filter((m) => m.trip_id === tripId && (!options?.visibility || m.visibility === options.visibility))
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    }
    try {
      let query = supabase
        .from('media')
        .select('*')
        .eq('trip_id', tripId);

      if (options?.visibility) {
        query = query.eq('visibility', options.visibility);
      }

      const { data, error } = await query
        .order('position', { ascending: true })
        .order('created_at', { ascending: true });

      if (error || !data || data.length === 0) {
        return inMemoryMedia
          .filter((m) => m.trip_id === tripId && (!options?.visibility || m.visibility === options.visibility))
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      }
      return data;
    } catch {
      return inMemoryMedia
        .filter((m) => m.trip_id === tripId && (!options?.visibility || m.visibility === options.visibility))
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    }
  }

  /**
   * Alias for backward compatibility.
   */
  static async getMediaByTripId(tripId: string): Promise<MediaRow[]> {
    return this.getMediaForTrip(tripId);
  }

  /**
   * Retrieves media associated with a specific day, ordered by position.
   */
  static async getMediaForDay(dayId: string, options?: { visibility?: VisibilityType }): Promise<MediaRow[]> {
    if (!isSupabaseConfigured) {
      return inMemoryMedia
        .filter((m) => m.day_id === dayId && (!options?.visibility || m.visibility === options.visibility))
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    }
    try {
      let query = supabase
        .from('media')
        .select('*')
        .eq('day_id', dayId);

      if (options?.visibility) {
        query = query.eq('visibility', options.visibility);
      }

      const { data, error } = await query
        .order('position', { ascending: true })
        .order('created_at', { ascending: true });

      if (error || !data || data.length === 0) {
        return inMemoryMedia
          .filter((m) => m.day_id === dayId && (!options?.visibility || m.visibility === options.visibility))
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      }
      return data;
    } catch {
      return inMemoryMedia
        .filter((m) => m.day_id === dayId && (!options?.visibility || m.visibility === options.visibility))
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    }
  }

  /**
   * Retrieves media associated with a specific place, ordered by position.
   */
  static async getMediaForPlace(placeId: string, options?: { visibility?: VisibilityType }): Promise<MediaRow[]> {
    if (!isSupabaseConfigured) {
      return inMemoryMedia
        .filter((m) => m.place_id === placeId && (!options?.visibility || m.visibility === options.visibility))
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    }
    try {
      let query = supabase
        .from('media')
        .select('*')
        .eq('place_id', placeId);

      if (options?.visibility) {
        query = query.eq('visibility', options.visibility);
      }

      const { data, error } = await query
        .order('position', { ascending: true })
        .order('created_at', { ascending: true });

      if (error || !data || data.length === 0) {
        return inMemoryMedia
          .filter((m) => m.place_id === placeId && (!options?.visibility || m.visibility === options.visibility))
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      }
      return data;
    } catch {
      return inMemoryMedia
        .filter((m) => m.place_id === placeId && (!options?.visibility || m.visibility === options.visibility))
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    }
  }

  /**
   * Retrieves media associated with a specific memory, ordered by position.
   */
  static async getMediaForMemory(memoryId: string, options?: { visibility?: VisibilityType }): Promise<MediaRow[]> {
    if (!isSupabaseConfigured) {
      return inMemoryMedia
        .filter((m) => m.memory_id === memoryId && (!options?.visibility || m.visibility === options.visibility))
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    }
    try {
      let query = supabase
        .from('media')
        .select('*')
        .eq('memory_id', memoryId);

      if (options?.visibility) {
        query = query.eq('visibility', options.visibility);
      }

      const { data, error } = await query
        .order('position', { ascending: true })
        .order('created_at', { ascending: true });

      if (error || !data || data.length === 0) {
        return inMemoryMedia
          .filter((m) => m.memory_id === memoryId && (!options?.visibility || m.visibility === options.visibility))
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      }
      return data;
    } catch {
      return inMemoryMedia
        .filter((m) => m.memory_id === memoryId && (!options?.visibility || m.visibility === options.visibility))
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    }
  }

  /**
   * Finds media by its internal UUID.
   */
  static async getMediaById(id: string): Promise<MediaRow | null> {
    if (!isSupabaseConfigured) {
      return inMemoryMedia.find((m) => m.id === id) || null;
    }
    try {
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return inMemoryMedia.find((m) => m.id === id) || null;
      }
      return data;
    } catch {
      return inMemoryMedia.find((m) => m.id === id) || null;
    }
  }

  /**
   * Updates an existing media item.
   */
  static async updateMedia(id: string, payload: Partial<MediaRow>): Promise<MediaRow | null> {
    const updatedAt = new Date().toISOString();

    if (!isSupabaseConfigured) {
      const index = inMemoryMedia.findIndex((m) => m.id === id);
      if (index === -1) return null;
      inMemoryMedia[index] = {
        ...inMemoryMedia[index],
        ...payload,
        updated_at: updatedAt,
      };
      return inMemoryMedia[index];
    }

    try {
      const { data, error } = await (supabase.from('media') as any)
        .update({ ...payload, updated_at: updatedAt })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        const index = inMemoryMedia.findIndex((m) => m.id === id);
        if (index !== -1) {
          inMemoryMedia[index] = data as MediaRow;
        }
        return data as MediaRow;
      }
    } catch {
      // Fall through to in-memory store
    }

    const index = inMemoryMedia.findIndex((m) => m.id === id);
    if (index === -1) return null;
    inMemoryMedia[index] = {
      ...inMemoryMedia[index],
      ...payload,
      updated_at: updatedAt,
    };
    return inMemoryMedia[index];
  }

  /**
   * Deletes a media item by ID.
   */
  static async deleteMedia(id: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      const initialLength = inMemoryMedia.length;
      inMemoryMedia = inMemoryMedia.filter((m) => m.id !== id);
      return inMemoryMedia.length < initialLength;
    }

    try {
      const { error } = await supabase.from('media').delete().eq('id', id);
      inMemoryMedia = inMemoryMedia.filter((m) => m.id !== id);
      return !error;
    } catch {
      const initialLength = inMemoryMedia.length;
      inMemoryMedia = inMemoryMedia.filter((m) => m.id !== id);
      return inMemoryMedia.length < initialLength;
    }
  }

  /**
   * Reorders media items by updating their position field based on array order.
   */
  static async reorderMedia(orderedIds: string[]): Promise<boolean> {
    const updatedAt = new Date().toISOString();

    // Update in-memory
    orderedIds.forEach((id, index) => {
      const item = inMemoryMedia.find((m) => m.id === id);
      if (item) {
        item.position = index;
        item.updated_at = updatedAt;
      }
    });

    if (!isSupabaseConfigured) {
      return true;
    }

    try {
      await Promise.all(
        orderedIds.map((id, index) =>
          (supabase.from('media') as any)
            .update({ position: index, updated_at: updatedAt })
            .eq('id', id)
        )
      );
      return true;
    } catch {
      return true; // in-memory was updated
    }
  }

  /**
   * Sets the cover media for a trip, day, or place.
   */
  static async setCoverMedia(
    entityType: 'trip' | 'day' | 'place',
    entityId: string,
    mediaId: string
  ): Promise<boolean> {
    try {
      if (entityType === 'trip') {
        const { TripRepository } = await import('./trip-repository');
        const res = await TripRepository.updateTrip(entityId, { cover_media_id: mediaId });
        return !!res;
      } else if (entityType === 'day') {
        const { DayRepository } = await import('./day-repository');
        const res = await DayRepository.updateDay(entityId, { cover_media_id: mediaId });
        return !!res;
      } else if (entityType === 'place') {
        const { PlaceRepository } = await import('./place-repository');
        const res = await PlaceRepository.updatePlace(entityId, { cover_media_id: mediaId });
        return !!res;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Creates a media reference (Image, YouTube video, or Instagram reference).
   */
  static async createMediaReference(reference: ContentReference): Promise<MediaRow> {
    const id = reference.id || crypto.randomUUID();
    const position = reference.position ?? (inMemoryMedia.length > 0 ? Math.max(...inMemoryMedia.map((m) => m.position || 0)) + 1 : 0);
    const visibility: VisibilityType = reference.visibility || 'PUBLIC';
    const alt_text = reference.alt_text || null;
    const memory_id = reference.memory_id || null;
    const now = new Date().toISOString();

    let newMedia: MediaRow;

    if (reference.type === 'YOUTUBE') {
      newMedia = {
        id,
        filename: `youtube-${reference.youtube_id}`,
        storage_path: `youtube/${reference.youtube_id}`,
        storage_url: reference.youtube_url,
        thumbnail_url: reference.thumbnail_url,
        type: 'VIDEO',
        mime_type: 'video/youtube',
        width: 1920,
        height: 1080,
        duration: null,
        file_size_bytes: null,
        content_hash: `yt-${reference.youtube_id}`,
        taken_at: now,
        latitude: null,
        longitude: null,
        trip_id: reference.trip_id || null,
        day_id: reference.day_id || null,
        place_id: reference.place_id || null,
        memory_id,
        caption: reference.title || reference.caption || null,
        alt_text,
        position,
        visibility,
        curation_status: 'CURATED',
        created_at: now,
        updated_at: now,
      };
    } else if (reference.type === 'INSTAGRAM') {
      newMedia = {
        id,
        filename: `instagram-${reference.shortcode}`,
        storage_path: `instagram/${reference.shortcode}`,
        storage_url: reference.instagram_url,
        thumbnail_url: reference.thumbnail_url || null,
        type: reference.instagram_type === 'REEL' ? 'REEL' : 'PHOTO',
        mime_type: 'image/jpeg',
        width: 1080,
        height: 1350,
        duration: null,
        file_size_bytes: null,
        content_hash: `ig-${reference.shortcode}`,
        taken_at: reference.published_at || now,
        latitude: null,
        longitude: null,
        trip_id: reference.trip_id || null,
        day_id: reference.day_id || null,
        place_id: reference.place_id || null,
        memory_id,
        caption: reference.caption || null,
        alt_text,
        position,
        visibility,
        curation_status: 'CURATED',
        created_at: now,
        updated_at: now,
      };
    } else {
      // IMAGE
      newMedia = {
        id,
        filename: reference.url.split('/').pop()?.split('?')[0] || 'image.jpg',
        storage_path: `external/${id}.jpg`,
        storage_url: reference.url,
        thumbnail_url: reference.url,
        type: 'PHOTO',
        mime_type: 'image/jpeg',
        width: 1920,
        height: 1080,
        duration: null,
        file_size_bytes: null,
        content_hash: `img-${id}`,
        taken_at: now,
        latitude: null,
        longitude: null,
        trip_id: reference.trip_id || null,
        day_id: reference.day_id || null,
        place_id: reference.place_id || null,
        memory_id,
        caption: reference.caption || null,
        alt_text,
        position,
        visibility,
        curation_status: 'CURATED',
        created_at: now,
        updated_at: now,
      };
    }

    if (!isSupabaseConfigured) {
      inMemoryMedia.push(newMedia);
      return newMedia;
    }

    try {
      const { data, error } = await supabase.from('media').insert(newMedia as any).select().single();
      if (!error && data) {
        inMemoryMedia.push(data as MediaRow);
        return data as MediaRow;
      }
    } catch {
      // Fall through
    }

    inMemoryMedia.push(newMedia);
    return newMedia;
  }

  /**
   * Finds a media asset by its deterministic content hash (SHA-256).
   */
  static async findMediaByContentHash(hash: string): Promise<MediaRow | null> {
    if (!isSupabaseConfigured) {
      return inMemoryMedia.find((m) => m.content_hash === hash) || null;
    }
    try {
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('content_hash', hash)
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return inMemoryMedia.find((m) => m.content_hash === hash) || null;
      }
      return data;
    } catch {
      return inMemoryMedia.find((m) => m.content_hash === hash) || null;
    }
  }

  /**
   * Checks multiple content hashes against the archive database for duplicate detection.
   * Returns a map of matching { [contentHash]: mediaId }.
   */
  static async findMediaByContentHashes(hashes: string[]): Promise<Record<string, string>> {
    const result: Record<string, string> = {};
    if (!hashes || hashes.length === 0) return result;

    if (!isSupabaseConfigured) {
      for (const hash of hashes) {
        const match = inMemoryMedia.find((m) => m.content_hash === hash);
        if (match) {
          result[hash] = match.id;
        }
      }
      return result;
    }

    try {
      const { data, error } = await supabase
        .from('media')
        .select('id, content_hash')
        .in('content_hash', hashes);

      if (!error && data) {
        for (const row of (data as any[])) {
          if (row.content_hash) {
            result[row.content_hash] = row.id;
          }
        }
      }
    } catch {
      // Fallback to in-memory check
      for (const hash of hashes) {
        const match = inMemoryMedia.find((m) => m.content_hash === hash);
        if (match) {
          result[hash] = match.id;
        }
      }
    }

    return result;
  }

  /**
   * Batch creates canonical media records with validation.
   */
  static async batchCreateMedia(inserts: MediaInsert[]): Promise<MediaRow[]> {
    if (simulateInsertFailure) {
      throw new Error('Database write failure: simulated database write error');
    }

    const created: MediaRow[] = [];
    const now = new Date().toISOString();

    for (const insert of inserts) {
      const id = insert.id || crypto.randomUUID();
      const position = insert.position ?? (inMemoryMedia.length > 0 ? Math.max(...inMemoryMedia.map((m) => m.position || 0)) + 1 : 0);

      const newMedia: MediaRow = {
        id,
        filename: insert.filename,
        storage_path: insert.storage_path,
        storage_url: insert.storage_url,
        thumbnail_url: insert.thumbnail_url || null,
        type: insert.type || 'PHOTO',
        mime_type: insert.mime_type,
        width: insert.width || null,
        height: insert.height || null,
        duration: insert.duration || null,
        file_size_bytes: insert.file_size_bytes || null,
        content_hash: insert.content_hash || null,
        taken_at: insert.taken_at || null,
        latitude: insert.latitude || null,
        longitude: insert.longitude || null,
        trip_id: insert.trip_id || null,
        day_id: insert.day_id || null,
        place_id: insert.place_id || null,
        memory_id: insert.memory_id || null,
        caption: insert.caption || null,
        alt_text: insert.alt_text || null,
        position,
        visibility: insert.visibility || 'PRIVATE',
        curation_status: insert.curation_status || 'IMPORTED',
        created_at: now,
        updated_at: now,
      };

      if (!isSupabaseConfigured) {
        inMemoryMedia.push(newMedia);
        created.push(newMedia);
        continue;
      }

      try {
        const { data, error } = await supabase.from('media').insert(newMedia as any).select().single();
        if (!error && data) {
          inMemoryMedia.push(data as MediaRow);
          created.push(data as MediaRow);
          continue;
        }
      } catch {
        // Fallback
      }

      inMemoryMedia.push(newMedia);
      created.push(newMedia);
    }

    return created;
  }
}

