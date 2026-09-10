/**
 * Type definitions for Phase 7 Smart Archive Ingestion & Media Organization.
 */

export type ImportItemState =
  | 'QUEUED'
  | 'UPLOADING'
  | 'PROCESSING'
  | 'READY'
  | 'NEEDS_REVIEW'
  | 'FAILED';

export type DuplicateStatus =
  | 'UNIQUE'
  | 'EXACT_DUPLICATE';

export interface ExtractedMediaMetadata {
  filename: string;
  mimeType: string;
  fileSizeBytes: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  takenAt: string | null; // ISO 8601 string or null if unavailable
  latitude: number | null;
  longitude: number | null;
  orientation: number | null;
  hasGps: boolean;
  contentHash: string; // SHA-256
}

export interface IngestionSuggestions {
  suggestedTrip: {
    id: string;
    title: string;
    slug: string;
    reason: string;
  } | null;
  suggestedDay: {
    id: string;
    dayNumber: number;
    title: string | null;
    date: string | null;
    reason: string;
  } | null;
  suggestedPlace: {
    id: string;
    name: string;
    slug: string;
    distanceKm: number;
    reason: string;
  } | null;
}

export interface ImportItem {
  id: string;
  file: File;
  previewUrl: string;
  state: ImportItemState;
  errorMessage?: string;
  metadata?: ExtractedMediaMetadata;
  duplicateStatus: DuplicateStatus;
  duplicateWarningDismissed: boolean;
  duplicateOfId?: string;
  suggestions: IngestionSuggestions;
  assignedTripId: string | null;
  assignedDayId: string | null;
  assignedPlaceId: string | null;
  caption: string;
  altText: string;
  isApproved: boolean;
}

export interface DateGroupSummary {
  dateKey: string; // YYYY-MM-DD or 'UNKNOWN_DATE'
  displayDate: string; // Formatted date e.g. "12 June 2026" or "Unknown Date"
  count: number;
  earliestTime: string | null;
  latestTime: string | null;
  itemIds: string[];
}

export interface BatchIngestionSummary {
  totalFiles: number;
  uniqueCount: number;
  duplicateCount: number;
  needsReviewCount: number;
  withCaptureDateCount: number;
  withoutCaptureDateCount: number;
  withGpsCount: number;
  withoutGpsCount: number;
}

export type IngestionItemStatus = ImportItemState;
export type IngestionItem = any;
export type ExtractedMetadata = any;
export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ArchiveBatchItemInput {
  id?: string;
  filename: string;
  fileSizeBytes?: number;
  file_size_bytes?: number;
  mimeType?: string;
  mime_type?: string;
  type?: 'PHOTO' | 'VIDEO' | 'REEL' | 'STORY' | 'AUDIO' | 'DOCUMENT';
  contentHash?: string;
  content_hash?: string;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  takenAt?: string | null;
  taken_at?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  tripId?: string | null;
  trip_id?: string | null;
  dayId?: string | null;
  day_id?: string | null;
  placeId?: string | null;
  place_id?: string | null;
  caption?: string | null;
  altText?: string | null;
  alt_text?: string | null;
  storageUrl?: string;
  storage_url?: string;
  storagePath?: string;
  storage_path?: string;
  thumbnailUrl?: string;
  thumbnail_url?: string;
  overrideDuplicate?: boolean;
  override_duplicate?: boolean;
}

export interface ArchiveItemResult {
  itemId?: string;
  filename: string;
  success: boolean;
  status: 'ARCHIVED' | 'DUPLICATE' | 'FAILED';
  mediaId?: string;
  storagePath?: string;
  storageUrl?: string;
  reason?: string;
  error?: string;
}

export interface ArchiveBatchResult {
  success: boolean;
  count?: number;
  total?: number;
  archivedCount: number;
  duplicateCount?: number;
  failedCount: number;
  createdIds?: string[];
  items?: ArchiveItemResult[];
  errors: { itemId?: string; filename?: string; reason: string }[];
  error?: string;
}
