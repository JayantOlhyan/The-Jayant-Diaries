import { TripRepository } from './trip-repository';
import { PlaceRepository } from './place-repository';
import { MemoryRepository } from './memory-repository';
import { MediaRepository } from './media-repository';
import { StoryRepository } from './story-repository';
import {
  TripRow,
  TripWithDetails,
  PlaceRow,
  MemoryRow,
  MediaRow,
  StoryWithDetails,
} from '@/types/entities';

export interface ArchiveSnapshot {
  journeysCount: number;
  placesCount: number;
  memoriesCount: number;
  mediaCount: number;
  storiesCount: number;
}

export interface HomepageEditorialData {
  featuredJourney: TripWithDetails | null;
  featuredStory: StoryWithDetails | null;
  recentStories: StoryWithDetails[];
  recentMemories: MemoryRow[];
  featuredPlaces: PlaceRow[];
  snapshot: ArchiveSnapshot;
  heroMedia: MediaRow | null;
}

export class PublicEditorialRepository {
  /**
   * Deterministically selects the primary featured journey.
   * Priority:
   * 1. Explicitly featured public published trip (featured = true)
   * 2. Most recently started public published trip (start_date desc)
   * 3. null if no public published trip exists
   */
  static async getFeaturedJourney(): Promise<TripWithDetails | null> {
    const publicTrips = await TripRepository.getPublicTrips();
    if (publicTrips.length === 0) return null;

    const featured =
      publicTrips.find((t) => t.featured) ||
      [...publicTrips].sort(
        (a, b) =>
          new Date(b.start_date || b.created_at).getTime() -
          new Date(a.start_date || a.created_at).getTime()
      )[0];

    if (!featured) return null;
    return TripRepository.getTripWithDetails(featured.id);
  }

  /**
   * Deterministically selects the primary featured story.
   * Priority:
   * 1. Explicitly featured published story (featured = true)
   * 2. Most recently published story (published_at desc)
   * 3. null if no published story exists
   */
  static async getFeaturedStory(): Promise<StoryWithDetails | null> {
    const publishedStories = await StoryRepository.getPublishedStories();
    if (publishedStories.length === 0) return null;

    const featured =
      publishedStories.find((s) => s.featured) ||
      [...publishedStories].sort(
        (a, b) =>
          new Date(b.published_at || b.created_at).getTime() -
          new Date(a.published_at || a.created_at).getTime()
      )[0];

    return featured || null;
  }

  /**
   * Retrieves recent published stories sorted by publication date descending.
   */
  static async getRecentStories(limit = 4): Promise<StoryWithDetails[]> {
    const publishedStories = await StoryRepository.getPublishedStories();
    return [...publishedStories]
      .sort(
        (a, b) =>
          new Date(b.published_at || b.created_at).getTime() -
          new Date(a.published_at || a.created_at).getTime()
      )
      .slice(0, limit);
  }

  /**
   * Retrieves recent memories belonging to public published journeys.
   */
  static async getRecentMemories(limit = 6): Promise<MemoryRow[]> {
    const publicTrips = await TripRepository.getPublicTrips();
    const publicTripIds = new Set(publicTrips.map((t) => t.id));

    const publicMemories = await MemoryRepository.getPublicMemories();

    return publicMemories
      .filter((m) => !m.trip_id || publicTripIds.has(m.trip_id))
      .sort(
        (a, b) =>
          new Date(b.date || b.created_at).getTime() -
          new Date(a.date || a.created_at).getTime()
      )
      .slice(0, limit);
  }

  /**
   * Retrieves featured places connected to public journeys and media.
   */
  static async getFeaturedPlaces(limit = 8): Promise<PlaceRow[]> {
    const allPlaces = await PlaceRepository.getAllPlaces();
    const publicTrips = await TripRepository.getPublicTrips();
    const publicMedia = await MediaRepository.getPublicMedia(100);

    const activePlaceIds = new Set<string>();
    publicMedia.forEach((m) => m.place_id && activePlaceIds.add(m.place_id));

    const connectedPlaces = allPlaces.filter((p) => activePlaceIds.has(p.id));
    const finalPlaces = connectedPlaces.length > 0 ? connectedPlaces : allPlaces;

    return finalPlaces.slice(0, limit);
  }

  /**
   * Computes deterministic archive snapshot counts across all public entities.
   */
  static async getArchiveSnapshot(): Promise<ArchiveSnapshot> {
    const [publicTrips, allPlaces, publicMemories, publicMedia, publishedStories] =
      await Promise.all([
        TripRepository.getPublicTrips(),
        PlaceRepository.getAllPlaces(),
        MemoryRepository.getPublicMemories(),
        MediaRepository.getPublicMedia(1000),
        StoryRepository.getPublishedStories(),
      ]);

    return {
      journeysCount: publicTrips.length,
      placesCount: allPlaces.length,
      memoriesCount: publicMemories.length,
      mediaCount: publicMedia.length,
      storiesCount: publishedStories.length,
    };
  }

  /**
   * Single-pass server fetching for the public homepage.
   * Consolidates all homepage dependencies into a single parallel resolution.
   */
  static async getHomepageData(): Promise<HomepageEditorialData> {
    const [
      featuredJourney,
      featuredStory,
      recentStories,
      recentMemories,
      featuredPlaces,
      snapshot,
      publicMedia,
    ] = await Promise.all([
      this.getFeaturedJourney(),
      this.getFeaturedStory(),
      this.getRecentStories(4),
      this.getRecentMemories(6),
      this.getFeaturedPlaces(8),
      this.getArchiveSnapshot(),
      MediaRepository.getPublicMedia(20),
    ]);

    // Select primary hero media deterministically
    const heroMedia =
      publicMedia.find((m) => m.type === 'PHOTO') ||
      publicMedia[0] ||
      null;

    return {
      featuredJourney,
      featuredStory,
      recentStories,
      recentMemories,
      featuredPlaces,
      snapshot,
      heroMedia,
    };
  }
}
