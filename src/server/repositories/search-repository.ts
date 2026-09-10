import { supabase, isSupabaseConfigured } from '@/lib/db/client';
import { TripRow, PlaceRow, MemoryRow, MediaRow, StoryRow } from '@/types/entities';
import { TripRepository } from './trip-repository';
import { PlaceRepository } from './place-repository';
import { MemoryRepository } from './memory-repository';
import { MediaRepository } from './media-repository';
import { StoryRepository } from './story-repository';

export interface SearchResults {
  query: string;
  totalCount: number;
  journeys: TripRow[];
  places: PlaceRow[];
  stories: MemoryRow[];
  photography: MediaRow[];
  films: MediaRow[];
}

export interface PlaceRelatedContent {
  place: PlaceRow;
  journeys: TripRow[];
  stories: MemoryRow[];
  media: MediaRow[];
}

export class SearchRepository {
  /**
   * Searches across all public entities in the archive.
   * Strictly enforces visibility = 'PUBLIC' and status = 'PUBLISHED'.
   */
  static async searchPublicArchive(
    query: string,
    options: { limit?: number } = {}
  ): Promise<SearchResults> {
    const rawTrimmed = (query || '').trim();
    if (!rawTrimmed) {
      return {
        query: '',
        totalCount: 0,
        journeys: [],
        places: [],
        stories: [],
        photography: [],
        films: [],
      };
    }

    // Bound query length to prevent pathological runaway regex or allocation
    const trimmed = rawTrimmed.slice(0, 100);
    const q = trimmed.toLowerCase();
    const limit = Math.min(Math.max(1, typeof options.limit === 'number' && !isNaN(options.limit) ? options.limit : 20), 50);

    // Fetch all public candidate records across the repository boundary
    const [publicTrips, allPlaces, publicMemories, publicMedia, publishedStories] = await Promise.all([
      TripRepository.getPublicTrips(),
      PlaceRepository.getAllPlaces(),
      MemoryRepository.getPublicMemories(),
      MediaRepository.getPublicMedia(),
      StoryRepository.getPublishedStories(),
    ]);

    const placesMap = new Map(allPlaces.map((p) => [p.id, p]));
    const tripsMap = new Map(publicTrips.map((t) => [t.id, t]));

    // 1. Filter and score Journeys
    const journeys = publicTrips
      .filter((t) => {
        return (
          t.title.toLowerCase().includes(q) ||
          t.slug.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        const scoreA = getMatchScore(a.title, a.description, q);
        const scoreB = getMatchScore(b.title, b.description, q);
        return scoreB - scoreA;
      })
      .slice(0, limit);

    // 2. Filter and score Places
    const places = allPlaces
      .filter((p) => {
        return (
          p.name.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          (p.state && p.state.toLowerCase().includes(q)) ||
          (p.city && p.city.toLowerCase().includes(q)) ||
          (p.country && p.country.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        const scoreA = getMatchScore(a.name, a.description, q);
        const scoreB = getMatchScore(b.name, b.description, q);
        return scoreB - scoreA;
      })
      .slice(0, limit);

    // 3. Filter and score Stories / Memories (with relational context)
    const matchingPublishedStories = publishedStories.filter((s) => {
      const trip = s.trip_id ? tripsMap.get(s.trip_id) : null;
      return (
        s.title.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        (s.subtitle && s.subtitle.toLowerCase().includes(q)) ||
        (s.content && s.content.toLowerCase().includes(q)) ||
        (trip && trip.title.toLowerCase().includes(q))
      );
    });

    const matchingMemories = publicMemories.filter((m) => {
      const place = m.place_id ? placesMap.get(m.place_id) : null;
      const trip = m.trip_id ? tripsMap.get(m.trip_id) : null;
      return (
        m.title.toLowerCase().includes(q) ||
        (m.description && m.description.toLowerCase().includes(q)) ||
        (m.journal && m.journal.toLowerCase().includes(q)) ||
        (place && place.name.toLowerCase().includes(q)) ||
        (place?.state && place.state.toLowerCase().includes(q)) ||
        (trip && trip.title.toLowerCase().includes(q))
      );
    });

    const mappedPublishedStories: MemoryRow[] = matchingPublishedStories.map((s) => ({
      id: s.slug,
      title: s.title,
      description: s.subtitle || null,
      journal: null,
      date: s.published_at || s.created_at,
      trip_id: s.trip_id || null,
      day_id: null,
      place_id: null,
      featured: s.featured,
      visibility: s.visibility,
      created_at: s.created_at,
      updated_at: s.updated_at,
    }));

    const stories: MemoryRow[] = [...mappedPublishedStories, ...matchingMemories]
      .sort((a, b) => {
        const scoreA = getMatchScore(a.title, a.description, q);
        const scoreB = getMatchScore(b.title, b.description, q);
        return scoreB - scoreA;
      })
      .slice(0, limit);

    // 4. Filter and partition Media (with relational context)
    const matchingMedia = publicMedia.filter((m) => {
      const place = m.place_id ? placesMap.get(m.place_id) : null;
      const trip = m.trip_id ? tripsMap.get(m.trip_id) : null;
      return (
        (m.caption && m.caption.toLowerCase().includes(q)) ||
        (m.alt_text && m.alt_text.toLowerCase().includes(q)) ||
        m.filename.toLowerCase().includes(q) ||
        (place && place.name.toLowerCase().includes(q)) ||
        (place?.state && place.state.toLowerCase().includes(q)) ||
        (trip && trip.title.toLowerCase().includes(q))
      );
    });

    const photography = matchingMedia
      .filter((m) => m.type === 'PHOTO' && !m.filename.startsWith('instagram-'))
      .sort((a, b) => {
        const scoreA = getMatchScore(a.caption || a.filename, a.alt_text, q);
        const scoreB = getMatchScore(b.caption || b.filename, b.alt_text, q);
        return scoreB - scoreA;
      })
      .slice(0, limit);

    const films = matchingMedia
      .filter((m) => m.type === 'VIDEO' || m.storage_path?.startsWith('youtube/'))
      .sort((a, b) => {
        const scoreA = getMatchScore(a.caption || a.filename, a.alt_text, q);
        const scoreB = getMatchScore(b.caption || b.filename, b.alt_text, q);
        return scoreB - scoreA;
      })
      .slice(0, limit);

    const totalCount =
      journeys.length + places.length + stories.length + photography.length + films.length;

    return {
      query: trimmed,
      totalCount,
      journeys,
      places,
      stories,
      photography,
      films,
    };
  }

  /**
   * Retrieves related public content (journeys, stories, media) for a given place.
   */
  static async getRelatedContentForPlace(placeSlugOrId: string): Promise<PlaceRelatedContent | null> {
    const place =
      (await PlaceRepository.getPlaceBySlug(placeSlugOrId)) ||
      (await PlaceRepository.getPlaceById(placeSlugOrId));

    if (!place) return null;

    const [allPublicTrips, allPublicMemories, allPublicMedia] = await Promise.all([
      TripRepository.getPublicTrips(),
      MemoryRepository.getPublicMemories(),
      MediaRepository.getPublicMedia(),
    ]);

    // Stories at this place
    const stories = allPublicMemories.filter((m) => m.place_id === place.id);

    // Media at this place
    const media = allPublicMedia.filter((m) => m.place_id === place.id);

    // Journeys linked to this place (either via stories, media, or direct trip associations)
    const tripIds = new Set<string>();
    stories.forEach((s) => s.trip_id && tripIds.add(s.trip_id));
    media.forEach((m) => m.trip_id && tripIds.add(m.trip_id));

    // If place name is mentioned in trip description or title
    allPublicTrips.forEach((t) => {
      if (
        t.title.toLowerCase().includes(place.name.toLowerCase()) ||
        t.description?.toLowerCase().includes(place.name.toLowerCase())
      ) {
        tripIds.add(t.id);
      }
    });

    const journeys = allPublicTrips.filter((t) => tripIds.has(t.id));

    return {
      place,
      journeys,
      stories,
      media,
    };
  }
}

/**
 * Helper to compute relevance score for matching text.
 */
function getMatchScore(title: string | null, body: string | null, query: string): number {
  if (!title) return 0;
  const t = title.toLowerCase();
  const q = query.toLowerCase();

  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (t.includes(q)) return 60;
  if (body && body.toLowerCase().includes(q)) return 30;
  return 10;
}
