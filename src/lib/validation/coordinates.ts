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
