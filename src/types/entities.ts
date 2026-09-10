import { Database, VisibilityType, TripStatus, MediaType, InstagramType } from './database';

export type PlaceRow = Database['public']['Tables']['places']['Row'];
export type TripRow = Database['public']['Tables']['trips']['Row'];
export type DayRow = Database['public']['Tables']['days']['Row'];
export type MemoryRow = Database['public']['Tables']['memories']['Row'];
export type MediaRow = Database['public']['Tables']['media']['Row'];
export type InstagramContentRow = Database['public']['Tables']['instagram_content']['Row'];
export type TagRow = Database['public']['Tables']['tags']['Row'];
export type StoryRow = Database['public']['Tables']['stories']['Row'];

export interface TripWithDetails extends TripRow {
  cover_media?: MediaRow | null;
  days?: DayWithDetails[];
  places?: PlaceRow[];
  memories?: MemoryRow[];
  media?: MediaRow[];
  media_count?: number;
}

export interface DayWithDetails extends DayRow {
  cover_media?: MediaRow | null;
  places?: PlaceRow[];
  memories?: MemoryRow[];
  media?: MediaRow[];
}

export interface PlaceWithDetails extends PlaceRow {
  cover_media?: MediaRow | null;
  trips?: TripRow[];
  media_count?: number;
}

export interface MemoryWithDetails extends MemoryRow {
  media?: MediaRow[];
  tags?: TagRow[];
  trip?: TripRow | null;
  day?: DayRow | null;
  place?: PlaceRow | null;
}

export interface StoryWithDetails extends StoryRow {
  cover_media?: MediaRow | null;
  places?: PlaceRow[];
  trips?: TripRow[];
  media?: MediaRow[];
}

export interface CinematicDay {
  id: string;
  day_number: number;
  date: string | null;
  title: string | null;
  description: string | null;
  journal: string | null;
  places: PlaceRow[];
  memories: MemoryRow[];
  photos: MediaRow[];
  videos: MediaRow[];
  instagram: MediaRow[];
}

export interface CinematicJourney {
  trip: TripRow;
  coverMedia: MediaRow | null;
  statistics: {
    daysCount: number;
    placesCount: number;
    memoriesCount: number;
    photosCount: number;
    videosCount: number;
  };
  days: CinematicDay[];
  closingMedia: MediaRow | null;
  nextTrip: { slug: string; title: string } | null;
  previousTrip: { slug: string; title: string } | null;
}

export interface TravelStats {
  trips_count: number;
  places_count: number;
  countries_count: number;
  travel_days_count: number;
  photos_count: number;
  videos_count: number;
  instagram_posts_count: number;
  longest_trip_days: number;
  most_visited_place: string | null;
}

export interface StudioDashboardStats {
  trips_count: number;
  days_count: number;
  places_count: number;
  memories_count: number;
  images_count: number;
  videos_count: number;
}

export type ContentReferenceType = 'IMAGE' | 'YOUTUBE' | 'INSTAGRAM';

export interface ImageReference {
  id?: string;
  type: 'IMAGE';
  url: string;
  caption?: string | null;
  alt_text?: string | null;
  trip_id?: string | null;
  day_id?: string | null;
  place_id?: string | null;
  memory_id?: string | null;
  position?: number;
  visibility?: VisibilityType;
}

export interface YouTubeReference {
  id?: string;
  type: 'YOUTUBE';
  youtube_url: string;
  youtube_id: string;
  title: string;
  thumbnail_url: string;
  caption?: string | null;
  alt_text?: string | null;
  trip_id?: string | null;
  day_id?: string | null;
  place_id?: string | null;
  memory_id?: string | null;
  position?: number;
  visibility?: VisibilityType;
}

export interface InstagramReference {
  id?: string;
  type: 'INSTAGRAM';
  instagram_url: string;
  shortcode: string;
  instagram_type: InstagramType;
  caption?: string | null;
  alt_text?: string | null;
  published_at?: string | null;
  thumbnail_url?: string | null;
  trip_id?: string | null;
  day_id?: string | null;
  place_id?: string | null;
  memory_id?: string | null;
  position?: number;
  visibility?: VisibilityType;
}

export type ContentReference = ImageReference | YouTubeReference | InstagramReference;

export interface PublicMapPlace {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  state: string | null;
  country: string;
  latitude: number;
  longitude: number;
  description: string | null;
  coverMedia: {
    storage_url: string;
    thumbnail_url: string | null;
    alt_text: string | null;
  } | null;
  relatedJourneys: {
    id: string;
    title: string;
    slug: string;
  }[];
  relatedJourneyCount: number;
}

export interface StudioGeographicOverview {
  totalPlaces: number;
  mappedPlaces: number;
  unmappedPlaces: number;
  publicPlacesCount: number;
  privatePlacesCount: number;
  places: {
    id: string;
    name: string;
    slug: string;
    country: string;
    state: string | null;
    city: string | null;
    latitude: number | null;
    longitude: number | null;
    hasCoordinates: boolean;
    visibility: string;
    status: string;
    journeyCount: number;
  }[];
}

export * from './ingestion';

export type { CurationStatus } from './database';

export interface ArchiveHealthStats {
  totalMedia: number;
  needsReview: number;
  missingMetadata: number;
  unassigned: number;
  duplicates: number;
  readyToPublish: number;
  privateCount: number;
  publishedCount: number;

  // Snake_case aliases
  total_media?: number;
  needs_review?: number;
  missing_metadata?: number;
  ready?: number;
  private_count?: number;
  published_count?: number;
}

export interface MediaReadiness {
  isReady: boolean;
  missingFields: string[];
  reasons: string[];
  curationStatus?: import('./database').CurationStatus;
  visibility?: VisibilityType;

  // Snake_case aliases
  is_ready?: boolean;
}

export interface CurationQueueItem {
  media: MediaRow;
  readiness: MediaReadiness;
  tripTitle?: string | null;
  dayTitle?: string | null;
  placeName?: string | null;
  isDuplicate?: boolean;
  duplicateCount?: number;
}

export interface DuplicateGroup {
  contentHash: string;
  canonicalMedia: MediaRow;
  duplicateMedia: MediaRow[];
  totalCount: number;

  // Snake_case aliases
  content_hash?: string;
  items?: MediaRow[];
}

export interface CurationFilter {
  search?: string;
  search_query?: string;
  status?: 'ALL' | import('./database').CurationStatus;
  curation_status?: 'ALL' | import('./database').CurationStatus;
  missingMetadata?: boolean;
  unassignedTrip?: boolean;
  unassignedDay?: boolean;
  unassignedPlace?: boolean;
  tripId?: string;
  trip_id?: string;
  day_id?: string;
  place_id?: string;
  visibility?: 'ALL' | VisibilityType;
  type?: 'ALL' | MediaType;
  missing_field?: 'ALL' | 'DATE' | 'DIMENSIONS' | 'TRIP' | 'DAY' | 'PLACE' | 'UNASSIGNED';
  only_duplicates?: boolean;
  only_needs_review?: boolean;
  sort_by?: 'NEEDS_REVIEW_FIRST' | 'NEWEST_IMPORTED' | 'OLDEST_IMPORTED' | 'CAPTURED_DATE' | 'FILENAME';
}
