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
  metadata: ExtractedMediaMetadata | any,
  trips: TripRow[],
  days: DayRow[],
  places: PlaceRow[]
): IngestionSuggestions & {
  suggested_trip?: { trip: TripRow; confidence: string; reason: string } | null;
  suggested_day?: { day: DayRow; confidence: string; reason: string } | null;
  suggested_place?: { place: PlaceRow; distance_km: number; reason: string } | null;
} {
  let suggestedTrip: IngestionSuggestions['suggestedTrip'] = null;
  let suggestedDay: IngestionSuggestions['suggestedDay'] = null;
  let suggestedPlace: IngestionSuggestions['suggestedPlace'] = null;

  const rawTakenAt = metadata?.takenAt || metadata?.taken_at;
  const captureDate = rawTakenAt ? String(rawTakenAt).slice(0, 10) : null;

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
  const lat = metadata?.latitude ?? metadata?.gps?.latitude;
  const lng = metadata?.longitude ?? metadata?.gps?.longitude;

  if (lat != null && lng != null && isValidCoordinate(lat, lng)) {
    let closestPlace: PlaceRow | null = null;
    let minDistance = Infinity;

    for (const place of places) {
      if (isValidCoordinate(place.latitude, place.longitude)) {
        const dist = calculateDistanceKm(
          lat,
          lng,
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

  const matchedTripRow = suggestedTrip ? trips.find((t) => t.id === suggestedTrip.id) : null;
  const matchedDayRow = suggestedDay ? days.find((d) => d.id === suggestedDay.id) : null;
  const matchedPlaceRow = suggestedPlace ? places.find((p) => p.id === suggestedPlace.id) : null;

  return {
    suggestedTrip,
    suggestedDay,
    suggestedPlace,
    suggested_trip: matchedTripRow
      ? { trip: matchedTripRow, confidence: 'HIGH', reason: suggestedTrip!.reason }
      : null,
    suggested_day: matchedDayRow
      ? { day: matchedDayRow, confidence: 'HIGH', reason: suggestedDay!.reason }
      : null,
    suggested_place: matchedPlaceRow
      ? {
          place: matchedPlaceRow,
          distance_km: suggestedPlace!.distanceKm,
          reason: suggestedPlace!.reason,
        }
      : null,
  };
}

/**
 * Groups items chronologically by capture date, with item objects attached.
 * Undated items are collected at the end under 'undated'.
 */
export function groupItemsByDate<T extends { id: string; metadata?: any }>(
  items: T[]
): { dateKey: string; dateLabel: string; displayDate: string; items: T[] }[] {
  const map = new Map<string, { dateKey: string; dateLabel: string; displayDate: string; items: T[] }>();

  for (const item of items) {
    const rawDate = item.metadata?.takenAt || item.metadata?.taken_at;
    let dateKey = 'undated';
    let dateLabel = 'Undated Media';

    if (rawDate) {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        dateKey = d.toISOString().slice(0, 10);
        dateLabel = formatDate(dateKey);
      }
    }

    if (!map.has(dateKey)) {
      map.set(dateKey, {
        dateKey,
        dateLabel,
        displayDate: dateLabel,
        items: [],
      });
    }

    map.get(dateKey)!.items.push(item);
  }

  const result = Array.from(map.values());
  // Sort descending by dateKey, with undated at the end
  result.sort((a, b) => {
    if (a.dateKey === 'undated') return 1;
    if (b.dateKey === 'undated') return -1;
    return b.dateKey.localeCompare(a.dateKey);
  });

  return result;
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

    const rawDate = item.metadata?.takenAt || (item.metadata as any)?.taken_at;
    if (rawDate) {
      try {
        const d = new Date(rawDate);
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
