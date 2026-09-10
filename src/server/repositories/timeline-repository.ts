import { supabase, isSupabaseConfigured } from '@/lib/db/client';
import { Database, VisibilityType } from '@/types/database';
import { TripRow, DayRow, PlaceRow, MemoryRow, MediaRow } from '@/types/entities';
import { TripRepository } from './trip-repository';
import { DayRepository } from './day-repository';
import { PlaceRepository } from './place-repository';
import { MemoryRepository } from './memory-repository';
import { MediaRepository } from './media-repository';
import { ArchiveRepository } from './archive-repository';

export interface TimelineTripEntry {
  trip: TripRow;
  durationDays: number | null;
  places: PlaceRow[];
  memoriesCount: number;
  mediaCount: number;
  curatedMediaCount: number;
}

export interface TimelineMonthGroup {
  monthKey: string;
  monthName: string;
  trips: TimelineTripEntry[];
}

export interface TimelineYearGroup {
  year: string;
  months: TimelineMonthGroup[];
  trips: TimelineTripEntry[];
}

export interface RepeatedPlace {
  place: PlaceRow;
  journeyCount: number;
  memoryCount: number;
  mediaCount: number;
  trips: { id: string; title: string; slug: string }[];
}

export interface YearOverYearEvolution {
  year: string;
  tripsCount: number;
  placesCount: number;
  memoriesCount: number;
  mediaCount: number;
}

export interface ArchiveCompletenessReport {
  tripsDateCompleteness: number;
  placesCoordinateCompleteness: number;
  mediaMetadataCompleteness: number;
  curationCompleteness: number;
  overallCompleteness: number;
  workbench: {
    mediaMissingTakenAt: number;
    mediaMissingDimensions: number;
    mediaMissingPlace: number;
    placesMissingCoords: number;
    memoriesMissingDay: number;
  };
}

export interface TravelStatistics {
  journeys: {
    total: number;
    published: number;
    unpublished: number;
    byYear: Record<string, number>;
  };
  places: {
    total: number;
    public: number;
    private: number;
    multiTripCount: number;
  };
  memories: {
    total: number;
    byTrip: Record<string, number>;
    byYear: Record<string, number>;
  };
  media: {
    total: number;
    photos: number;
    videos: number;
    instagram: number;
    youtube: number;
    withGps: number;
    withTimestamp: number;
    curated: number;
    duplicates: number;
  };
}

export class TimelineRepository {
  /**
   * Retrieves full chronological timeline grouped by Year and Month.
   */
  static async getChronologicalTimeline(options?: { visibility?: VisibilityType }): Promise<TimelineYearGroup[]> {
    const collection = await ArchiveRepository.exportAllEntities();

    let trips = collection.trips;
    if (options?.visibility) {
      trips = trips.filter((t) => t.visibility === options.visibility);
    }

    const days = collection.days;
    const places = collection.places;
    const memories = collection.memories;
    const media = collection.media;

    // Helper map for place lookups
    const placeMap = new Map<string, PlaceRow>(places.map((p) => [p.id, p]));

    // Build Trip entries
    const tripEntries: TimelineTripEntry[] = trips.map((trip) => {
      const tripDays = days.filter((d) => d.trip_id === trip.id);
      const tripMemories = memories.filter((m) => m.trip_id === trip.id);
      const tripMedia = media.filter((m) => m.trip_id === trip.id);
      const curatedMedia = tripMedia.filter((m) => m.curation_status === 'CURATED');

      // Unique places referenced across trip's days, memories, or media
      const tripPlaceIds = new Set<string>();
      tripDays.forEach((d) => {
        // Collect place IDs from day if associated
      });
      tripMemories.forEach((m) => {
        if (m.place_id) tripPlaceIds.add(m.place_id);
      });
      tripMedia.forEach((m) => {
        if (m.place_id) tripPlaceIds.add(m.place_id);
      });

      const tripPlaces = Array.from(tripPlaceIds)
        .map((id) => placeMap.get(id))
        .filter((p): p is PlaceRow => Boolean(p));

      // Calculate duration in days if start_date & end_date exist
      let durationDays: number | null = null;
      if (trip.start_date && trip.end_date) {
        const start = new Date(trip.start_date).getTime();
        const end = new Date(trip.end_date).getTime();
        if (!isNaN(start) && !isNaN(end) && end >= start) {
          durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        }
      } else if (tripDays.length > 0) {
        durationDays = tripDays.length;
      }

      return {
        trip,
        durationDays,
        places: tripPlaces,
        memoriesCount: tripMemories.length,
        mediaCount: tripMedia.length,
        curatedMediaCount: curatedMedia.length,
      };
    });

    // Group trip entries by Year
    const yearGroupsMap = new Map<string, TimelineTripEntry[]>();

    tripEntries.forEach((entry) => {
      let year = 'Date Unknown';
      if (entry.trip.start_date) {
        const parsed = new Date(entry.trip.start_date);
        if (!isNaN(parsed.getFullYear())) {
          year = String(parsed.getFullYear());
        }
      }
      if (!yearGroupsMap.has(year)) {
        yearGroupsMap.set(year, []);
      }
      yearGroupsMap.get(year)!.push(entry);
    });

    // Convert map to sorted TimelineYearGroup array
    const sortedYears = Array.from(yearGroupsMap.keys()).sort((a, b) => {
      if (a === 'Date Unknown') return 1;
      if (b === 'Date Unknown') return -1;
      return Number(b) - Number(a); // Newest year first
    });

    return sortedYears.map((year) => {
      const yearTrips = yearGroupsMap.get(year)!;

      // Group by month
      const monthGroupsMap = new Map<string, TimelineTripEntry[]>();
      yearTrips.forEach((entry) => {
        let monthName = 'General';
        let monthKey = '00';
        if (entry.trip.start_date) {
          const parsed = new Date(entry.trip.start_date);
          if (!isNaN(parsed.getMonth())) {
            const mIdx = parsed.getMonth();
            monthKey = String(mIdx + 1).padStart(2, '0');
            monthName = parsed.toLocaleString('default', { month: 'long' });
          }
        }
        if (!monthGroupsMap.has(monthKey)) {
          monthGroupsMap.set(monthKey, []);
        }
        monthGroupsMap.get(monthKey)!.push(entry);
      });

      const months: TimelineMonthGroup[] = Array.from(monthGroupsMap.entries())
        .sort((a, b) => Number(b[0]) - Number(a[0]))
        .map(([mKey, mTrips]) => {
          const sample = mTrips[0]?.trip.start_date ? new Date(mTrips[0].trip.start_date) : null;
          const monthName = sample && !isNaN(sample.getTime()) ? sample.toLocaleString('default', { month: 'long' }) : 'General';
          return {
            monthKey: mKey,
            monthName,
            trips: mTrips,
          };
        });

      return {
        year,
        months,
        trips: yearTrips,
      };
    });
  }

  /**
   * Derives deterministic overall travel statistics.
   */
  static async getTravelStatistics(): Promise<TravelStatistics> {
    const collection = await ArchiveRepository.exportAllEntities();

    const trips = collection.trips;
    const places = collection.places;
    const memories = collection.memories;
    const media = collection.media;

    // Journeys
    const publishedTrips = trips.filter((t) => t.status === 'PUBLISHED');
    const unpublishedTrips = trips.filter((t) => t.status !== 'PUBLISHED');
    const tripsByYear: Record<string, number> = {};
    trips.forEach((t) => {
      const yr = t.start_date ? new Date(t.start_date).getFullYear() : null;
      const key = yr && !isNaN(yr) ? String(yr) : 'Unknown';
      tripsByYear[key] = (tripsByYear[key] || 0) + 1;
    });

    // Places
    const publicPlaces = places.filter((p) => (p as any).visibility === 'PUBLIC');
    const privatePlaces = places.filter((p) => (p as any).visibility === 'PRIVATE');

    // Count places appearing in multiple trips
    const placeTripCounts = new Map<string, Set<string>>();
    memories.forEach((m) => {
      if (m.place_id && m.trip_id) {
        if (!placeTripCounts.has(m.place_id)) placeTripCounts.set(m.place_id, new Set());
        placeTripCounts.get(m.place_id)!.add(m.trip_id);
      }
    });
    media.forEach((m) => {
      if (m.place_id && m.trip_id) {
        if (!placeTripCounts.has(m.place_id)) placeTripCounts.set(m.place_id, new Set());
        placeTripCounts.get(m.place_id)!.add(m.trip_id);
      }
    });
    let multiTripCount = 0;
    placeTripCounts.forEach((tripSet) => {
      if (tripSet.size > 1) multiTripCount++;
    });

    // Memories
    const memoriesByTrip: Record<string, number> = {};
    const memoriesByYear: Record<string, number> = {};
    memories.forEach((m) => {
      if (m.trip_id) memoriesByTrip[m.trip_id] = (memoriesByTrip[m.trip_id] || 0) + 1;
      const yr = m.date ? new Date(m.date).getFullYear() : null;
      const key = yr && !isNaN(yr) ? String(yr) : 'Unknown';
      memoriesByYear[key] = (memoriesByYear[key] || 0) + 1;
    });

    // Media
    const photos = media.filter((m) => m.type === 'PHOTO').length;
    const videos = media.filter((m) => m.type === 'VIDEO' || m.type === 'REEL' || m.type === 'STORY').length;
    const instagram = media.filter((m) => (m.storage_path || '').startsWith('http') || m.type === 'REEL').length;
    const youtube = media.filter((m) => (m.storage_path || '').includes('youtube') || (m.storage_url || '').includes('youtu')).length;
    const withGps = media.filter((m) => m.latitude !== null && m.longitude !== null).length;
    const withTimestamp = media.filter((m) => m.taken_at !== null).length;
    const curated = media.filter((m) => m.curation_status === 'CURATED').length;

    // Detect duplicates by hash
    const hashCounts = new Map<string, number>();
    media.forEach((m) => {
      if (m.content_hash) {
        hashCounts.set(m.content_hash, (hashCounts.get(m.content_hash) || 0) + 1);
      }
    });
    let duplicates = 0;
    hashCounts.forEach((cnt) => {
      if (cnt > 1) duplicates += cnt - 1;
    });

    return {
      journeys: {
        total: trips.length,
        published: publishedTrips.length,
        unpublished: unpublishedTrips.length,
        byYear: tripsByYear,
      },
      places: {
        total: places.length,
        public: publicPlaces.length,
        private: privatePlaces.length,
        multiTripCount,
      },
      memories: {
        total: memories.length,
        byTrip: memoriesByTrip,
        byYear: memoriesByYear,
      },
      media: {
        total: media.length,
        photos,
        videos,
        instagram,
        youtube,
        withGps,
        withTimestamp,
        curated,
        duplicates,
      },
    };
  }

  /**
   * Year-over-Year Travel Evolution Aggregation.
   */
  static async getYearOverYearEvolution(): Promise<YearOverYearEvolution[]> {
    const collection = await ArchiveRepository.exportAllEntities();

    const yearMap = new Map<string, { trips: Set<string>; places: Set<string>; memories: number; media: number }>();

    const getOrInitYear = (yrStr: string) => {
      if (!yearMap.has(yrStr)) {
        yearMap.set(yrStr, { trips: new Set(), places: new Set(), memories: 0, media: 0 });
      }
      return yearMap.get(yrStr)!;
    };

    collection.trips.forEach((t) => {
      const yr = t.start_date ? new Date(t.start_date).getFullYear() : null;
      if (yr && !isNaN(yr)) {
        const node = getOrInitYear(String(yr));
        node.trips.add(t.id);
      }
    });

    collection.memories.forEach((m) => {
      const yr = m.date ? new Date(m.date).getFullYear() : null;
      if (yr && !isNaN(yr)) {
        const node = getOrInitYear(String(yr));
        node.memories++;
        if (m.trip_id) node.trips.add(m.trip_id);
        if (m.place_id) node.places.add(m.place_id);
      }
    });

    collection.media.forEach((m) => {
      const yr = m.taken_at ? new Date(m.taken_at).getFullYear() : null;
      if (yr && !isNaN(yr)) {
        const node = getOrInitYear(String(yr));
        node.media++;
        if (m.trip_id) node.trips.add(m.trip_id);
        if (m.place_id) node.places.add(m.place_id);
      }
    });

    const sortedYears = Array.from(yearMap.keys()).sort((a, b) => Number(a) - Number(b));

    return sortedYears.map((yr) => {
      const data = yearMap.get(yr)!;
      return {
        year: yr,
        tripsCount: data.trips.size,
        placesCount: data.places.size,
        memoriesCount: data.memories,
        mediaCount: data.media,
      };
    });
  }

  /**
   * Deterministically finds places visited across multiple trips, sorted by frequency.
   */
  static async getRepeatedPlaces(): Promise<RepeatedPlace[]> {
    const collection = await ArchiveRepository.exportAllEntities();
    const tripMap = new Map<string, TripRow>(collection.trips.map((t) => [t.id, t]));

    const placeStats = new Map<
      string,
      { place: PlaceRow; trips: Set<string>; memoryCount: number; mediaCount: number }
    >();

    collection.places.forEach((p) => {
      placeStats.set(p.id, { place: p, trips: new Set(), memoryCount: 0, mediaCount: 0 });
    });

    collection.memories.forEach((m) => {
      if (m.place_id && placeStats.has(m.place_id)) {
        const stat = placeStats.get(m.place_id)!;
        stat.memoryCount++;
        if (m.trip_id) stat.trips.add(m.trip_id);
      }
    });

    collection.media.forEach((m) => {
      if (m.place_id && placeStats.has(m.place_id)) {
        const stat = placeStats.get(m.place_id)!;
        stat.mediaCount++;
        if (m.trip_id) stat.trips.add(m.trip_id);
      }
    });

    const repeated: RepeatedPlace[] = [];

    placeStats.forEach((stat) => {
      if (stat.trips.size > 1) {
        const trips = Array.from(stat.trips)
          .map((id) => tripMap.get(id))
          .filter((t): t is TripRow => Boolean(t))
          .map((t) => ({ id: t.id, title: t.title, slug: t.slug }));

        repeated.push({
          place: stat.place,
          journeyCount: stat.trips.size,
          memoryCount: stat.memoryCount,
          mediaCount: stat.mediaCount,
          trips,
        });
      }
    });

    // Sort by journeyCount DESC, memoryCount DESC, mediaCount DESC
    return repeated.sort((a, b) => {
      if (b.journeyCount !== a.journeyCount) return b.journeyCount - a.journeyCount;
      if (b.memoryCount !== a.memoryCount) return b.memoryCount - a.memoryCount;
      return b.mediaCount - a.mediaCount;
    });
  }

  /**
   * Documented Archive Completeness Formula & Actionable Workbench Metrics.
   */
  static async getArchiveCompletenessReport(): Promise<ArchiveCompletenessReport> {
    const collection = await ArchiveRepository.exportAllEntities();

    const trips = collection.trips;
    const places = collection.places;
    const memories = collection.memories;
    const media = collection.media;

    // 1. Trips Date Completeness
    const tripsWithDate = trips.filter((t) => Boolean(t.start_date)).length;
    const tripsDateCompleteness = trips.length > 0 ? Math.round((tripsWithDate / trips.length) * 100) : 100;

    // 2. Places Coordinate Completeness
    const placesWithCoords = places.filter((p) => p.latitude !== null && p.longitude !== null).length;
    const placesCoordinateCompleteness = places.length > 0 ? Math.round((placesWithCoords / places.length) * 100) : 100;

    // 3. Media Metadata Completeness (taken_at, width/height, place_id)
    const mediaComplete = media.filter((m) => Boolean(m.taken_at) && Boolean(m.width && m.height) && Boolean(m.place_id)).length;
    const mediaMetadataCompleteness = media.length > 0 ? Math.round((mediaComplete / media.length) * 100) : 100;

    // 4. Editorial Curation Completeness
    const curatedMedia = media.filter((m) => m.curation_status === 'CURATED').length;
    const curationCompleteness = media.length > 0 ? Math.round((curatedMedia / media.length) * 100) : 100;

    // 5. Overall Completeness (Weighted Average: 25% each)
    const overallCompleteness = Math.round(
      tripsDateCompleteness * 0.25 +
        placesCoordinateCompleteness * 0.25 +
        mediaMetadataCompleteness * 0.25 +
        curationCompleteness * 0.25
    );

    // Workbench actionable item counts
    const mediaMissingTakenAt = media.filter((m) => !m.taken_at).length;
    const mediaMissingDimensions = media.filter((m) => m.type === 'PHOTO' && (!m.width || !m.height)).length;
    const mediaMissingPlace = media.filter((m) => !m.place_id).length;
    const placesMissingCoords = places.filter((p) => p.latitude === null || p.longitude === null).length;
    const memoriesMissingDay = memories.filter((m) => !m.day_id).length;

    return {
      tripsDateCompleteness,
      placesCoordinateCompleteness,
      mediaMetadataCompleteness,
      curationCompleteness,
      overallCompleteness,
      workbench: {
        mediaMissingTakenAt,
        mediaMissingDimensions,
        mediaMissingPlace,
        placesMissingCoords,
        memoriesMissingDay,
      },
    };
  }
}
