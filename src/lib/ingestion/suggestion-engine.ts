import { TripRow, DayRow, PlaceRow } from '@/types/entities';
import {
  ExtractedMediaMetadata,
  IngestionSuggestions,
  ImportItem,
  DateGroupSummary,
  BatchIngestionSummary,
} from '@/types/ingestion';
import { calculateDistanceKm, isValidCoordinate } from '@/lib/validation/coordinates';
import { formatDate } from '@/lib/utils';

/**
 * Deterministically generates Trip, Day, and Place suggestions based strictly on:
 * - Capture date within trip start/end date ranges
 * - Capture date matching Day record date
 * - GPS coordinates proximity (within 15km) to Place coordinates
 *
 * NEVER infers relationships from filename text or captions.
 */
export function generateSuggestions(
  metadata: ExtractedMediaMetadata,
  trips: TripRow[],
  days: DayRow[],
  places: PlaceRow[]
): IngestionSuggestions {
  let suggestedTrip: IngestionSuggestions['suggestedTrip'] = null;
  let suggestedDay: IngestionSuggestions['suggestedDay'] = null;
  let suggestedPlace: IngestionSuggestions['suggestedPlace'] = null;

  const captureDate = metadata.takenAt ? metadata.takenAt.slice(0, 10) : null;

  // 1. Trip Suggestion: Based strictly on date range match
  if (captureDate) {
    for (const trip of trips) {
      if (!trip.start_date) continue;

      const startDate = trip.start_date.slice(0, 10);
      const endDate = trip.end_date ? trip.end_date.slice(0, 10) : startDate;

      if (captureDate >= startDate && captureDate <= endDate) {
        suggestedTrip = {
          id: trip.id,
          title: trip.title,
          slug: trip.slug,
          reason: `Media capture date (${captureDate}) falls within this journey's recorded date range (${startDate} — ${endDate}).`,
        };
        break; // Match first explicit trip range
      }
    }
  }

  // 2. Day Suggestion: Based strictly on date match within suggested or candidate trip
  if (captureDate && suggestedTrip) {
    const tripDays = days.filter((d) => d.trip_id === suggestedTrip.id);
    for (const day of tripDays) {
      if (day.date && day.date.slice(0, 10) === captureDate) {
        suggestedDay = {
          id: day.id,
          dayNumber: day.day_number,
          title: day.title,
          date: day.date,
          reason: `Capture date matches Day ${day.day_number} (${day.date.slice(0, 10)}).`,
        };
        break;
      }
    }
  }

  // 3. Place Suggestion: Based strictly on GPS proximity (threshold: 15 km)
  if (
    metadata.hasGps &&
    metadata.latitude !== null &&
    metadata.longitude !== null &&
    isValidCoordinate(metadata.latitude, metadata.longitude)
  ) {
    let closestPlace: PlaceRow | null = null;
    let minDistance = Infinity;

    for (const place of places) {
      if (isValidCoordinate(place.latitude, place.longitude)) {
        const dist = calculateDistanceKm(
          metadata.latitude,
          metadata.longitude,
          place.latitude as number,
          place.longitude as number
        );
        if (dist < minDistance) {
          minDistance = dist;
          closestPlace = place;
        }
      }
    }

    if (closestPlace && minDistance <= 15) {
      const roundedDist = Math.round(minDistance * 10) / 10;
      suggestedPlace = {
        id: closestPlace.id,
        name: closestPlace.name,
        slug: closestPlace.slug,
        distanceKm: roundedDist,
        reason: `GPS coordinates are within ${roundedDist} km of ${closestPlace.name}.`,
      };
    }
  }

  return {
    suggestedTrip,
    suggestedDay,
    suggestedPlace,
  };
}

/**
 * Groups import items chronologically by capture date.
 * Items lacking capture dates are collected under 'UNKNOWN_DATE' at the end.
 */
export function groupMediaByDate(items: ImportItem[]): DateGroupSummary[] {
  const groupsMap = new Map<string, { displayDate: string; times: string[]; itemIds: string[] }>();

  for (const item of items) {
    let dateKey = 'UNKNOWN_DATE';
    let displayDate = 'Unknown Date';
    let timeStr: string | null = null;

    if (item.metadata?.takenAt) {
      try {
        const d = new Date(item.metadata.takenAt);
        if (!isNaN(d.getTime())) {
          dateKey = d.toISOString().slice(0, 10);
          displayDate = formatDate(dateKey);
          timeStr = d.toISOString().slice(11, 16); // "HH:MM"
        }
      } catch {
        // Fall through to unknown
      }
    }

    if (!groupsMap.has(dateKey)) {
      groupsMap.set(dateKey, {
        displayDate,
        times: [],
        itemIds: [],
      });
    }

    const group = groupsMap.get(dateKey)!;
    group.itemIds.push(item.id);
    if (timeStr) {
      group.times.push(timeStr);
    }
  }

  const summaries: DateGroupSummary[] = [];

  groupsMap.forEach((data, dateKey) => {
    data.times.sort();
    summaries.push({
      dateKey,
      displayDate: data.displayDate,
      count: data.itemIds.length,
      earliestTime: data.times.length > 0 ? data.times[0] : null,
      latestTime: data.times.length > 0 ? data.times[data.times.length - 1] : null,
      itemIds: data.itemIds,
    });
  });

  // Sort groups: chronological dates first, UNKNOWN_DATE last
  summaries.sort((a, b) => {
    if (a.dateKey === 'UNKNOWN_DATE') return 1;
    if (b.dateKey === 'UNKNOWN_DATE') return -1;
    return a.dateKey.localeCompare(b.dateKey);
  });

  return summaries;
}

/**
 * Calculates real-time statistics across the import queue without demo/hardcoded numbers.
 */
export function calculateBatchSummary(items: ImportItem[]): BatchIngestionSummary {
  let uniqueCount = 0;
  let duplicateCount = 0;
  let needsReviewCount = 0;
  let withCaptureDateCount = 0;
  let withoutCaptureDateCount = 0;
  let withGpsCount = 0;
  let withoutGpsCount = 0;

  for (const item of items) {
    if (item.duplicateStatus === 'EXACT_DUPLICATE') {
      duplicateCount++;
    } else {
      uniqueCount++;
    }

    if (!item.isApproved && item.state !== 'FAILED') {
      needsReviewCount++;
    }

    if (item.metadata?.takenAt) {
      withCaptureDateCount++;
    } else {
      withoutCaptureDateCount++;
    }

    if (item.metadata?.hasGps) {
      withGpsCount++;
    } else {
      withoutGpsCount++;
    }
  }

  return {
    totalFiles: items.length,
    uniqueCount,
    duplicateCount,
    needsReviewCount,
    withCaptureDateCount,
    withoutCaptureDateCount,
    withGpsCount,
    withoutGpsCount,
  };
}
