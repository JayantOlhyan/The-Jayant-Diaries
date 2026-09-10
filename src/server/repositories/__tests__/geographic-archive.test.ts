import { describe, it, expect, beforeEach } from 'vitest';
import { PlaceRepository } from '../place-repository';
import { TripRepository } from '../trip-repository';
import { DayRepository } from '../day-repository';
import { MemoryRepository } from '../memory-repository';
import { MediaRepository } from '../media-repository';
import { isValidCoordinate } from '@/lib/validation/coordinates';

describe('Phase 6: Geographic Archive & Journey Map', () => {
  beforeEach(() => {
    PlaceRepository._resetInMemoryPlaces();
    TripRepository._resetInMemoryTrips();
    DayRepository._resetInMemoryDays();
    MemoryRepository._resetInMemoryMemories();
    MediaRepository._resetInMemoryMedia();
  });

  describe('Coordinate Validation (isValidCoordinate)', () => {
    it('accepts valid coordinates within global bounds', () => {
      expect(isValidCoordinate(34.1526, 77.5771)).toBe(true); // Leh
      expect(isValidCoordinate(0, 0)).toBe(true);
      expect(isValidCoordinate(-90, -180)).toBe(true);
      expect(isValidCoordinate(90, 180)).toBe(true);
    });

    it('rejects null or undefined coordinates', () => {
      expect(isValidCoordinate(null, 77.5771)).toBe(false);
      expect(isValidCoordinate(34.1526, null)).toBe(false);
      expect(isValidCoordinate(undefined, undefined)).toBe(false);
      expect(isValidCoordinate(null, null)).toBe(false);
    });

    it('rejects non-finite numbers and non-numeric types', () => {
      expect(isValidCoordinate(NaN, 77.5771)).toBe(false);
      expect(isValidCoordinate(34.1526, Infinity)).toBe(false);
      expect(isValidCoordinate(-Infinity, 0)).toBe(false);
      expect(isValidCoordinate('34.1526', '77.5771')).toBe(false);
      expect(isValidCoordinate({}, [])).toBe(false);
    });

    it('rejects out-of-bounds latitudes (beyond [-90, 90])', () => {
      expect(isValidCoordinate(90.001, 77.5771)).toBe(false);
      expect(isValidCoordinate(-90.001, 77.5771)).toBe(false);
      expect(isValidCoordinate(120, 0)).toBe(false);
    });

    it('rejects out-of-bounds longitudes (beyond [-180, 180])', () => {
      expect(isValidCoordinate(34.1526, 180.001)).toBe(false);
      expect(isValidCoordinate(34.1526, -180.001)).toBe(false);
      expect(isValidCoordinate(0, 200)).toBe(false);
    });
  });

  describe('PlaceRepository.getPublicMapPlaces', () => {
    it('returns published public places with valid coordinates', async () => {
      const places = await PlaceRepository.getPublicMapPlaces();
      expect(places.length).toBeGreaterThan(0);

      for (const place of places) {
        expect(isValidCoordinate(place.latitude, place.longitude)).toBe(true);
        expect(place.id).toBeDefined();
        expect(place.name).toBeDefined();
        expect(place.slug).toBeDefined();
        expect(place.country).toBeDefined();
        expect(Array.isArray(place.relatedJourneys)).toBe(true);
        expect(typeof place.relatedJourneyCount).toBe('number');
      }
    });

    it('excludes places with null or missing coordinates from the public map', async () => {
      // Add a place with null coordinates
      await PlaceRepository.createPlace({
        id: 'place-no-coords-999',
        name: 'Unmapped Sanctuary',
        slug: 'unmapped-sanctuary',
        country: 'India',
        latitude: null,
        longitude: null,
        description: 'A remote location without GPS coordinates recorded.',
      });

      const places = await PlaceRepository.getPublicMapPlaces();
      const unmapped = places.find((p) => p.id === 'place-no-coords-999');
      expect(unmapped).toBeUndefined();
    });

    it('excludes places with invalid out-of-bounds coordinates', async () => {
      await PlaceRepository.createPlace({
        id: 'place-invalid-coords-999',
        name: 'Invalid Space Place',
        slug: 'invalid-space-place',
        country: 'India',
        latitude: 145.2, // > 90
        longitude: 77.5,
      });

      const places = await PlaceRepository.getPublicMapPlaces();
      const invalid = places.find((p) => p.id === 'place-invalid-coords-999');
      expect(invalid).toBeUndefined();
    });

    it('excludes private places from the public map (Zero Private Data Leakage)', async () => {
      await PlaceRepository.createPlace({
        id: 'place-private-secret',
        name: 'Private Secret Sanctuary',
        slug: 'private-secret-sanctuary',
        country: 'India',
        latitude: 34.1,
        longitude: 77.5,
        // @ts-expect-error testing runtime visibility
        visibility: 'PRIVATE',
      });

      const places = await PlaceRepository.getPublicMapPlaces();
      const secretPlace = places.find((p) => p.id === 'place-private-secret');
      expect(secretPlace).toBeUndefined();
    });

    it('excludes unpublished draft places from the public map', async () => {
      await PlaceRepository.createPlace({
        id: 'place-draft-unpub',
        name: 'Draft Unpublished Pass',
        slug: 'draft-unpublished-pass',
        country: 'India',
        latitude: 34.2,
        longitude: 77.6,
        // @ts-expect-error testing runtime status
        status: 'DRAFT',
      });

      const places = await PlaceRepository.getPublicMapPlaces();
      const draftPlace = places.find((p) => p.id === 'place-draft-unpub');
      expect(draftPlace).toBeUndefined();
    });

    it('returns only explicit relational journey associations without textual inference', async () => {
      // Create a trip with "Leh" in its title and description, but NO days/memories/media referencing Leh
      await TripRepository.createTrip({
        id: 'trip-unrelated-leh-mention',
        title: 'Stories about Leh from afar',
        slug: 'stories-about-leh-afar',
        description: 'We talked about Leh while in Delhi.',
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
      });

      const places = await PlaceRepository.getPublicMapPlaces();
      const lehPlace = places.find((p) => p.slug === 'leh');
      expect(lehPlace).toBeDefined();

      if (lehPlace) {
        const falseAssociation = lehPlace.relatedJourneys.find(
          (j) => j.id === 'trip-unrelated-leh-mention'
        );
        expect(falseAssociation).toBeUndefined();
      }
    });

    it('never leaks private related journeys in place relatedJourneys list', async () => {
      // Create a private trip explicitly referencing Leh through a memory
      const privateTrip = await TripRepository.createTrip({
        id: 'trip-confidential-expedition',
        title: 'Confidential Solo Expedition',
        slug: 'confidential-solo-expedition',
        status: 'PUBLISHED',
        visibility: 'PRIVATE', // PRIVATE TRIP
      });

      await MemoryRepository.createMemory({
        id: 'mem-confidential-leh',
        title: 'Secret visit to Leh',
        trip_id: privateTrip.id,
        place_id: '22222222-2222-4222-a222-222222222222', // Leh
        visibility: 'PRIVATE',
      });

      const places = await PlaceRepository.getPublicMapPlaces();
      const leh = places.find((p) => p.slug === 'leh');
      expect(leh).toBeDefined();

      if (leh) {
        const leaked = leh.relatedJourneys.find((j) => j.id === privateTrip.id);
        expect(leaked).toBeUndefined();
      }
    });

    it('filters places strictly when journeySlug is provided', async () => {
      // Query map places for "ladakh-2026"
      const ladakhPlaces = await PlaceRepository.getPublicMapPlaces('ladakh-2026');
      expect(ladakhPlaces.length).toBeGreaterThan(0);

      // All returned places must have ladakh-2026 in their relatedJourneys
      for (const p of ladakhPlaces) {
        const hasLadakh = p.relatedJourneys.some((j) => j.slug === 'ladakh-2026');
        expect(hasLadakh).toBe(true);
      }
    });

    it('returns empty array when journeySlug is non-existent or private', async () => {
      const ghostPlaces = await PlaceRepository.getPublicMapPlaces('non-existent-journey-999');
      expect(ghostPlaces).toEqual([]);
    });

    it('payload contains only allowed public fields and no internal leak', async () => {
      const places = await PlaceRepository.getPublicMapPlaces();
      expect(places.length).toBeGreaterThan(0);

      const place = places[0];
      const keys = Object.keys(place);

      // Allowed fields only
      const allowedKeys = [
        'id',
        'name',
        'slug',
        'city',
        'state',
        'country',
        'latitude',
        'longitude',
        'description',
        'coverMedia',
        'relatedJourneys',
        'relatedJourneyCount',
      ];

      for (const key of keys) {
        expect(allowedKeys).toContain(key);
      }

      // Explicitly check that private metadata is not present
      expect((place as any).created_at).toBeUndefined();
      expect((place as any).updated_at).toBeUndefined();
      expect((place as any).cover_media_id).toBeUndefined();
    });
  });

  describe('PlaceRepository.getPublicJourneysForMap', () => {
    it('returns only public published journeys', async () => {
      // Add a private trip
      await TripRepository.createTrip({
        id: 'trip-private-filter-test',
        title: 'Hidden Private Voyage',
        slug: 'hidden-private-voyage',
        status: 'PUBLISHED',
        visibility: 'PRIVATE',
      });

      const journeys = await PlaceRepository.getPublicJourneysForMap();
      expect(journeys.length).toBeGreaterThan(0);

      const privateFound = journeys.find((j) => j.id === 'trip-private-filter-test');
      expect(privateFound).toBeUndefined();
    });
  });

  describe('PlaceRepository.getStudioGeographicOverview', () => {
    it('computes accurate operational metrics for Studio', async () => {
      const overview = await PlaceRepository.getStudioGeographicOverview();

      expect(overview.totalPlaces).toBeGreaterThan(0);
      expect(overview.mappedPlaces).toBeGreaterThan(0);
      expect(overview.totalPlaces).toBe(overview.mappedPlaces + overview.unmappedPlaces);
      expect(overview.publicPlacesCount).toBeGreaterThanOrEqual(0);
      expect(overview.privatePlacesCount).toBeGreaterThanOrEqual(0);
      expect(overview.places.length).toBe(overview.totalPlaces);

      for (const p of overview.places) {
        expect(p.id).toBeDefined();
        expect(p.name).toBeDefined();
        expect(typeof p.hasCoordinates).toBe('boolean');
        if (p.hasCoordinates) {
          expect(isValidCoordinate(p.latitude, p.longitude)).toBe(true);
        } else {
          expect(p.latitude).toBeNull();
          expect(p.longitude).toBeNull();
        }
      }
    });
  });
});
