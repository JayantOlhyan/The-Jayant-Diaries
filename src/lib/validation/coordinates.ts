/**
 * Validates geographic latitude and longitude coordinates.
 *
 * Coordinates are invalid if:
 * - latitude or longitude is null or undefined
 * - values are non-finite or not numbers
 * - latitude is outside [-90, 90]
 * - longitude is outside [-180, 180]
 */
export function isValidCoordinate(lat: unknown, lng: unknown): lat is number {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return false;
  }
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return false;
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return false;
  }
  if (lat < -90 || lat > 90) {
    return false;
  }
  if (lng < -180 || lng > 180) {
    return false;
  }
  return true;
}

/**
 * Calculates the great-circle distance between two geographic coordinates
 * using the Haversine formula (returned in kilometers).
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (!isValidCoordinate(lat1, lon1) || !isValidCoordinate(lat2, lon2)) {
    return Infinity;
  }
  const R = 6371; // Earth mean radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

