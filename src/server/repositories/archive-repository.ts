import { supabase, isSupabaseConfigured } from '@/lib/db/client';
import { Database } from '@/types/database';
import {
  TripRow,
  DayRow,
  PlaceRow,
  MemoryRow,
  MediaRow,
  StoryRow,
  InstagramContentRow,
  TagRow,
  ImportSessionRow,
  ImportSessionItemRow,
} from '@/types/entities';

import { TripRepository } from './trip-repository';
import { DayRepository } from './day-repository';
import { PlaceRepository } from './place-repository';
import { MemoryRepository } from './memory-repository';
import { MediaRepository } from './media-repository';
import { ImportSessionRepository } from './import-session-repository';

export interface ArchiveEntityCollection {
  trips: TripRow[];
  days: DayRow[];
  places: PlaceRow[];
  memories: MemoryRow[];
  media: MediaRow[];
  stories: StoryRow[];
  instagram: InstagramContentRow[];
  tags: TagRow[];
  import_sessions: ImportSessionRow[];
  import_session_items: ImportSessionItemRow[];
}

let inMemoryStories: StoryRow[] = [];
let inMemoryTags: TagRow[] = [];

export class ArchiveRepository {
  /**
   * Export complete table collections across all entities.
   */
  static async exportAllEntities(): Promise<ArchiveEntityCollection> {
    if (!isSupabaseConfigured) {
      const trips = await TripRepository.getAllTrips();
      const days = await DayRepository.getAllDays();
      const places = await PlaceRepository.getAllPlaces();
      const memories = await MemoryRepository.getAllMemories();
      const media = await MediaRepository.getAllMedia();
      const stories = [...inMemoryStories];
      const instagram: InstagramContentRow[] = [];
      const tags = [...inMemoryTags];
      const import_sessions = await ImportSessionRepository.getAllSessions();
      const import_session_items: ImportSessionItemRow[] = [];

      return {
        trips,
        days,
        places,
        memories,
        media,
        stories,
        instagram,
        tags,
        import_sessions,
        import_session_items,
      };
    }

    try {
      const [
        { data: trips, error: errTrips },
        { data: days, error: errDays },
        { data: places, error: errPlaces },
        { data: memories, error: errMemories },
        { data: media, error: errMedia },
        { data: stories },
        { data: instagram },
        { data: tags },
        { data: import_sessions },
        { data: import_session_items },
      ] = await Promise.all([
        supabase.from('trips').select('*').order('created_at', { ascending: true }),
        supabase.from('days').select('*').order('created_at', { ascending: true }),
        supabase.from('places').select('*').order('created_at', { ascending: true }),
        supabase.from('memories').select('*').order('created_at', { ascending: true }),
        supabase.from('media').select('*').order('created_at', { ascending: true }),
        supabase.from('stories').select('*').order('created_at', { ascending: true }),
        supabase.from('instagram_content').select('*').order('created_at', { ascending: true }),
        supabase.from('tags').select('*').order('created_at', { ascending: true }),
        supabase.from('import_sessions').select('*').order('created_at', { ascending: true }),
        supabase.from('import_session_items').select('*').order('created_at', { ascending: true }),
      ]);

      if (errTrips || errDays || errPlaces || errMemories || errMedia) {
        // Fall back to repository store if Supabase returns query errors
        const tripsFallback = await TripRepository.getAllTrips();
        const daysFallback = await DayRepository.getAllDays();
        const placesFallback = await PlaceRepository.getAllPlaces();
        const memoriesFallback = await MemoryRepository.getAllMemories();
        const mediaFallback = await MediaRepository.getAllMedia();
        const import_sessions_fallback = await ImportSessionRepository.getAllSessions();

        return {
          trips: tripsFallback,
          days: daysFallback,
          places: placesFallback,
          memories: memoriesFallback,
          media: mediaFallback,
          stories: stories || inMemoryStories,
          instagram: instagram || [],
          tags: tags || inMemoryTags,
          import_sessions: import_sessions_fallback,
          import_session_items: import_session_items || [],
        };
      }

      return {
        trips: trips || [],
        days: days || [],
        places: places || [],
        memories: memories || [],
        media: media || [],
        stories: stories || [],
        instagram: instagram || [],
        tags: tags || [],
        import_sessions: import_sessions || [],
        import_session_items: import_session_items || [],
      };
    } catch (err: any) {
      console.error('ArchiveRepository.exportAllEntities exception:', err?.message);
      const tripsFallback = await TripRepository.getAllTrips();
      const daysFallback = await DayRepository.getAllDays();
      const placesFallback = await PlaceRepository.getAllPlaces();
      const memoriesFallback = await MemoryRepository.getAllMemories();
      const mediaFallback = await MediaRepository.getAllMedia();
      const import_sessions_fallback = await ImportSessionRepository.getAllSessions();

      return {
        trips: tripsFallback,
        days: daysFallback,
        places: placesFallback,
        memories: memoriesFallback,
        media: mediaFallback,
        stories: inMemoryStories,
        instagram: [],
        tags: inMemoryTags,
        import_sessions: import_sessions_fallback,
        import_session_items: [],
      };
    }
  }

  /**
   * Batch upsert or insert entities into Supabase or memory store during restore operations.
   */
  static async restoreEntityCollection(
    collection: ArchiveEntityCollection,
    mode: 'NEW_ONLY' | 'MERGE'
  ): Promise<{
    restoredCounts: Record<string, number>;
    errors: string[];
  }> {
    const counts: Record<string, number> = {
      places: 0,
      trips: 0,
      days: 0,
      memories: 0,
      media: 0,
      stories: 0,
      instagram: 0,
      tags: 0,
      import_sessions: 0,
      import_session_items: 0,
    };
    const errors: string[] = [];

    // Always attempt item-by-item fallback restore for maximum resilience
    for (const p of collection.places || []) {
      const existing = await PlaceRepository.getPlaceById(p.id);
      if (!existing) {
        await PlaceRepository.createPlace(p);
        counts.places++;
      } else if (mode === 'MERGE') {
        await PlaceRepository.updatePlace(p.id, p);
        counts.places++;
      }
    }

    for (const t of collection.trips || []) {
      const existing = await TripRepository.getTripById(t.id);
      if (!existing) {
        await TripRepository.createTrip(t);
        counts.trips++;
      } else if (mode === 'MERGE') {
        await TripRepository.updateTrip(t.id, t);
        counts.trips++;
      }
    }

    for (const d of collection.days || []) {
      const existing = await DayRepository.getDayById(d.id);
      if (!existing) {
        await DayRepository.createDay(d);
        counts.days++;
      } else if (mode === 'MERGE') {
        await DayRepository.updateDay(d.id, d);
        counts.days++;
      }
    }

    for (const m of collection.memories || []) {
      const existing = await MemoryRepository.getMemoryById(m.id);
      if (!existing) {
        await MemoryRepository.createMemory(m);
        counts.memories++;
      } else if (mode === 'MERGE') {
        await MemoryRepository.updateMemory(m.id, m);
        counts.memories++;
      }
    }

    for (const item of collection.media || []) {
      const existing = await MediaRepository.getMediaById(item.id);
      if (!existing) {
        await MediaRepository.createMedia(item);
        counts.media++;
      } else if (mode === 'MERGE') {
        await MediaRepository.updateMedia(item.id, item);
        counts.media++;
      }
    }

    for (const s of collection.stories || []) {
      const idx = inMemoryStories.findIndex((existing) => existing.id === s.id);
      if (idx === -1) {
        inMemoryStories.push(s);
        counts.stories++;
      } else if (mode === 'MERGE') {
        inMemoryStories[idx] = { ...inMemoryStories[idx], ...s };
        counts.stories++;
      }
    }

    for (const tag of collection.tags || []) {
      const idx = inMemoryTags.findIndex((existing) => existing.id === tag.id);
      if (idx === -1) {
        inMemoryTags.push(tag);
        counts.tags++;
      } else if (mode === 'MERGE') {
        inMemoryTags[idx] = { ...inMemoryTags[idx], ...tag };
        counts.tags++;
      }
    }

    for (const sess of collection.import_sessions || []) {
      const existing = await ImportSessionRepository.getSessionById(sess.id);
      if (!existing) {
        await ImportSessionRepository.createSession({
          id: sess.id,
          name: sess.name,
          trip_id: sess.trip_id,
          day_id: sess.day_id,
          notes: sess.notes,
          status: sess.status,
        });
        counts.import_sessions++;
      }
    }

    return { restoredCounts: counts, errors };
  }
}
