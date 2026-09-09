import { describe, it, expect, beforeEach } from 'vitest';
import { TripRepository } from '../trip-repository';
import { PlaceRepository } from '../place-repository';
import { DayRepository } from '../day-repository';
import { MemoryRepository } from '../memory-repository';
import { MediaRepository } from '../media-repository';
import { SEED_TRIPS, SEED_PLACES } from '../seed-data';

describe('Phase 5: Cinematic Journey Mode', () => {
  beforeEach(() => {
    TripRepository._resetInMemoryTrips();
    PlaceRepository._resetInMemoryPlaces();
    DayRepository._resetInMemoryDays();
    MemoryRepository._resetInMemoryMemories();
    MediaRepository._resetInMemoryMedia();
  });

  describe('TripRepository.getCinematicJourneyBySlug', () => {
    it('returns null for an unknown or non-existent slug', async () => {
      const journey = await TripRepository.getCinematicJourneyBySlug('non-existent-journey-999');
      expect(journey).toBeNull();
    });

    it('returns full cinematic journey for valid published trip slug "ladakh-2026"', async () => {
      const journey = await TripRepository.getCinematicJourneyBySlug('ladakh-2026');
      expect(journey).not.toBeNull();

      if (!journey) return;

      // Trip core information
      expect(journey.trip).toBeDefined();
      expect(journey.trip.slug).toBe('ladakh-2026');
      expect(journey.trip.visibility).toBe('PUBLIC');
      expect(journey.trip.status).toBe('PUBLISHED');

      // Statistics
      expect(journey.statistics).toBeDefined();
      expect(journey.statistics.daysCount).toBeGreaterThan(0);
      expect(journey.statistics.placesCount).toBeGreaterThan(0);
      expect(journey.statistics.photosCount).toBeGreaterThan(0);
      expect(journey.statistics.videosCount).toBeGreaterThan(0);

      // Days must be chronologically ordered (day_number[i] < day_number[i + 1])
      expect(journey.days.length).toBeGreaterThan(0);
      for (let i = 0; i < journey.days.length - 1; i++) {
        expect(journey.days[i].day_number).toBeLessThan(journey.days[i + 1].day_number);
        const currDate = journey.days[i].date;
        const nextDate = journey.days[i + 1].date;
        if (currDate && nextDate) {
          expect(new Date(currDate).getTime()).toBeLessThanOrEqual(new Date(nextDate).getTime());
        }
      }

      // Cover & closing media
      expect(journey.coverMedia).toBeDefined();
      if (journey.coverMedia) {
        expect(journey.coverMedia.storage_url || journey.coverMedia.thumbnail_url).toBeTruthy();
      }
      expect(journey.closingMedia).toBeDefined();
    });

    it('correctly maps day chapters with journals, waypoints, and media', async () => {
      const journey = await TripRepository.getCinematicJourneyBySlug('ladakh-2026');
      expect(journey).not.toBeNull();
      if (!journey) return;

      const day1 = journey.days.find((d) => d.day_number === 1);
      expect(day1).toBeDefined();
      if (!day1) return;

      // Day 1 has title and journal
      expect(day1.title).toBeTruthy();
      expect(day1.date).toBeTruthy();
      expect(day1.journal).toBeTruthy();

      // Waypoints/places should be populated
      expect(day1.places.length).toBeGreaterThan(0);
      expect(day1.places[0].name).toBeTruthy();

      // Photos should only contain photos
      day1.photos.forEach((photo) => {
        expect(photo.type).toBe('PHOTO');
        expect(photo.visibility).toBe('PUBLIC');
      });

      // Videos should only contain videos
      day1.videos.forEach((video) => {
        expect(video.type === 'VIDEO' || video.storage_path?.startsWith('youtube/')).toBe(true);
        expect(video.visibility).toBe('PUBLIC');
      });
    });

    it('strictly enforces Zero Private Data Leakage', async () => {
      // If a trip is marked PRIVATE or DRAFT, it must never return
      const allSeedSlugs = SEED_TRIPS.map((t) => t.slug);
      for (const slug of allSeedSlugs) {
        const trip = SEED_TRIPS.find((t) => t.slug === slug);
        const result = await TripRepository.getCinematicJourneyBySlug(slug);

        if (trip?.visibility !== 'PUBLIC' || trip?.status !== 'PUBLISHED') {
          expect(result).toBeNull();
        } else {
          expect(result).not.toBeNull();
          // Ensure no private memories or media inside the returned journey
          result?.days.forEach((day) => {
            day.memories.forEach((m) => expect(m.visibility).toBe('PUBLIC'));
            day.photos.forEach((p) => expect(p.visibility).toBe('PUBLIC'));
            day.videos.forEach((v) => expect(v.visibility).toBe('PUBLIC'));
            day.instagram.forEach((ig) => expect(ig.visibility).toBe('PUBLIC'));
          });
        }
      }
    });

    it('excludes private and draft trips explicitly', async () => {
      const draftOrPrivateTrips = SEED_TRIPS.filter(
        (t) => t.visibility !== 'PUBLIC' || t.status !== 'PUBLISHED'
      );
      for (const trip of draftOrPrivateTrips) {
        const res = await TripRepository.getCinematicJourneyBySlug(trip.slug);
        expect(res).toBeNull();
      }
    });

    it('provides valid next/previous navigation structure and handles boundaries', async () => {
      const journey = await TripRepository.getCinematicJourneyBySlug('ladakh-2026');
      expect(journey).not.toBeNull();
      if (!journey) return;

      if (journey.nextTrip) {
        expect(journey.nextTrip.slug).toBeTruthy();
        expect(journey.nextTrip.title).toBeTruthy();
      }
      if (journey.previousTrip) {
        expect(journey.previousTrip.slug).toBeTruthy();
        expect(journey.previousTrip.title).toBeTruthy();
      }

      // Boundary condition test: first trip has no previousTrip, last trip has no nextTrip
      const publicTrips = await TripRepository.getPublicTrips();
      if (publicTrips.length > 0) {
        const first = await TripRepository.getCinematicJourneyBySlug(publicTrips[0].slug);
        expect(first?.previousTrip).toBeNull();

        const last = await TripRepository.getCinematicJourneyBySlug(publicTrips[publicTrips.length - 1].slug);
        expect(last?.nextTrip).toBeNull();
      }
    });

    // =========================================================================
    // REMEDIATION TEST SUITE (PHASE 5.1 AUDIT SPECIFICATION)
    // =========================================================================

    // TEST A — Zero fabricated numeric values
    it('TEST A: returns genuine 0 for journeys with zero places, memories, photos, and videos', async () => {
      const emptyTrip = await TripRepository.createTrip({
        title: 'Barren Odyssey',
        slug: 'barren-odyssey',
        description: 'A quiet journey with no recorded data.',
        visibility: 'PUBLIC',
        status: 'PUBLISHED',
      });

      await DayRepository.createDay({
        trip_id: emptyTrip.id,
        day_number: 1,
        title: 'Day One Alone',
        description: 'Quiet day without media or places.',
      });

      const journey = await TripRepository.getCinematicJourneyBySlug('barren-odyssey');
      expect(journey).not.toBeNull();
      if (!journey) return;

      // Honest counts: exactly 0, never fabricated (1, 5, 28, 42, 6)
      expect(journey.statistics.placesCount).toBe(0);
      expect(journey.statistics.memoriesCount).toBe(0);
      expect(journey.statistics.photosCount).toBe(0);
      expect(journey.statistics.videosCount).toBe(0);
      expect(journey.statistics.daysCount).toBe(1);

      // Honest media: null, never SEED_MEDIA[0]
      expect(journey.coverMedia).toBeNull();
      expect(journey.closingMedia).toBeNull();
      expect(journey.days[0].places).toEqual([]);
      expect(journey.days[0].memories).toEqual([]);
      expect(journey.days[0].photos).toEqual([]);
      expect(journey.days[0].videos).toEqual([]);
    });

    // TEST B — No textual place inference
    it('TEST B: does NOT infer place relationships from day title or description text', async () => {
      // Create a trip where day title explicitly contains "Leh" and description contains "Pangong Lake"
      const textTrip = await TripRepository.createTrip({
        title: 'Textual Reference Journey',
        slug: 'textual-reference-journey',
        description: 'Testing textual place inference rejection.',
        visibility: 'PUBLIC',
        status: 'PUBLISHED',
      });

      // Known place names in SEED_PLACES: "Leh", "Pangong Lake"
      await DayRepository.createDay({
        trip_id: textTrip.id,
        day_number: 1,
        title: 'Leaving Leh for the high mountains',
        description: 'Driving past Pangong Lake on an unlinked morning.',
      });

      const journey = await TripRepository.getCinematicJourneyBySlug('textual-reference-journey');
      expect(journey).not.toBeNull();
      if (!journey) return;

      // Crucial assertion: even though title contains "Leh" and description contains "Pangong Lake",
      // day.places must NOT contain them because no explicit relationship exists.
      expect(journey.days[0].places).toEqual([]);
      expect(journey.statistics.placesCount).toBe(0);
    });

    // TEST C — Private place exclusion
    it('TEST C: excludes private or unpublished places from public cinematic journeys', async () => {
      const trip = await TripRepository.createTrip({
        title: 'Privacy Journey',
        slug: 'privacy-journey',
        visibility: 'PUBLIC',
        status: 'PUBLISHED',
      });

      const day = await DayRepository.createDay({
        trip_id: trip.id,
        day_number: 1,
        title: 'Secret Base',
      });

      // Create a private place
      const privatePlace = await PlaceRepository.createPlace({
        name: 'Classified Location',
        slug: 'classified-location',
        country: 'India',
      });
      // Attach visibility = 'PRIVATE' to the place object
      (privatePlace as any).visibility = 'PRIVATE';

      // Link via public memory
      await MemoryRepository.createMemory({
        title: 'Secret Visit',
        trip_id: trip.id,
        day_id: day.id,
        place_id: privatePlace.id,
        visibility: 'PUBLIC',
      });

      const journey = await TripRepository.getCinematicJourneyBySlug('privacy-journey');
      expect(journey).not.toBeNull();
      if (!journey) return;

      // Private place must NOT appear in day places or statistics
      expect(journey.days[0].places.find((p) => p.id === privatePlace.id)).toBeUndefined();
      expect(journey.statistics.placesCount).toBe(0);
    });

    // TEST D — Public place inclusion
    it('TEST D: includes places that have a valid explicit relationship with a public journey', async () => {
      const trip = await TripRepository.createTrip({
        title: 'Relational Journey',
        slug: 'relational-journey',
        visibility: 'PUBLIC',
        status: 'PUBLISHED',
      });

      const day = await DayRepository.createDay({
        trip_id: trip.id,
        day_number: 1,
        title: 'Valid Day',
      });

      const publicPlace = SEED_PLACES[0]; // Leh

      // Link via public memory
      await MemoryRepository.createMemory({
        title: 'Explicitly Linked Memory',
        trip_id: trip.id,
        day_id: day.id,
        place_id: publicPlace.id,
        visibility: 'PUBLIC',
      });

      const journey = await TripRepository.getCinematicJourneyBySlug('relational-journey');
      expect(journey).not.toBeNull();
      if (!journey) return;

      expect(journey.days[0].places.length).toBe(1);
      expect(journey.days[0].places[0].id).toBe(publicPlace.id);
      expect(journey.days[0].places[0].name).toBe(publicPlace.name);
      expect(journey.statistics.placesCount).toBe(1);
    });

    // TEST E — No fake descriptions
    it('TEST E: does NOT inject editorial prose when description is null', async () => {
      await TripRepository.createTrip({
        title: 'Prose-Free Voyage',
        slug: 'prose-free-voyage',
        description: null,
        visibility: 'PUBLIC',
        status: 'PUBLISHED',
      });

      const journey = await TripRepository.getCinematicJourneyBySlug('prose-free-voyage');
      expect(journey).not.toBeNull();
      if (!journey) return;

      expect(journey.trip.description).toBeNull();
    });

    // TEST F — No fake dates
    it('TEST F: does NOT inject fabricated dates when dates are null', async () => {
      await TripRepository.createTrip({
        title: 'Timeless Voyage',
        slug: 'timeless-voyage',
        start_date: null,
        end_date: null,
        visibility: 'PUBLIC',
        status: 'PUBLISHED',
      });

      const journey = await TripRepository.getCinematicJourneyBySlug('timeless-voyage');
      expect(journey).not.toBeNull();
      if (!journey) return;

      expect(journey.trip.start_date).toBeNull();
      expect(journey.trip.end_date).toBeNull();
    });

    // TEST G — Privacy regression (matrix)
    it('TEST G: completely filters out private trips, draft trips, and private child content', async () => {
      // 1. Private trip
      await TripRepository.createTrip({
        title: 'Fully Private Trip',
        slug: 'fully-private-trip',
        visibility: 'PRIVATE',
        status: 'PUBLISHED',
      });
      expect(await TripRepository.getCinematicJourneyBySlug('fully-private-trip')).toBeNull();

      // 2. Draft trip
      await TripRepository.createTrip({
        title: 'Draft Trip',
        slug: 'draft-trip',
        visibility: 'PUBLIC',
        status: 'DRAFT',
      });
      expect(await TripRepository.getCinematicJourneyBySlug('draft-trip')).toBeNull();

      // 3. Public trip with private child content
      const publicTrip = await TripRepository.createTrip({
        title: 'Mixed Content Trip',
        slug: 'mixed-content-trip',
        visibility: 'PUBLIC',
        status: 'PUBLISHED',
      });

      const day = await DayRepository.createDay({
        trip_id: publicTrip.id,
        day_number: 1,
        title: 'Mixed Day',
      });

      // Add a private memory
      await MemoryRepository.createMemory({
        title: 'Private Journal Entry',
        trip_id: publicTrip.id,
        day_id: day.id,
        visibility: 'PRIVATE',
      });

      // Add a private media
      await MediaRepository.createMediaReference({
        type: 'IMAGE',
        url: 'https://storage.test/private-photo.jpg',
        trip_id: publicTrip.id,
        day_id: day.id,
        visibility: 'PRIVATE',
      });

      const journey = await TripRepository.getCinematicJourneyBySlug('mixed-content-trip');
      expect(journey).not.toBeNull();
      if (!journey) return;

      // Private memory and private media must be completely absent
      expect(journey.days[0].memories).toHaveLength(0);
      expect(journey.days[0].photos).toHaveLength(0);
      expect(journey.statistics.memoriesCount).toBe(0);
      expect(journey.statistics.photosCount).toBe(0);
    });

    // TEST H — Chronological ordering with non-sequential days
    it('TEST H: strictly orders days in ascending order regardless of insertion order or missing day numbers', async () => {
      const nonSeqTrip = await TripRepository.createTrip({
        title: 'Non Sequential Journey',
        slug: 'non-sequential-journey',
        visibility: 'PUBLIC',
        status: 'PUBLISHED',
      });

      // Insert days out of order: Day 9, Day 2, Day 5
      await DayRepository.createDay({
        trip_id: nonSeqTrip.id,
        day_number: 9,
        date: '2026-06-20',
        title: 'Final Peak',
      });
      await DayRepository.createDay({
        trip_id: nonSeqTrip.id,
        day_number: 2,
        date: '2026-06-13',
        title: 'Ascent Begins',
      });
      await DayRepository.createDay({
        trip_id: nonSeqTrip.id,
        day_number: 5,
        date: '2026-06-16',
        title: 'Midpoint Ridge',
      });

      const journey = await TripRepository.getCinematicJourneyBySlug('non-sequential-journey');
      expect(journey).not.toBeNull();
      if (!journey) return;

      expect(journey.days).toHaveLength(3);
      expect(journey.days[0].day_number).toBe(2);
      expect(journey.days[1].day_number).toBe(5);
      expect(journey.days[2].day_number).toBe(9);

      // Verify strict inequality: day_number[i] < day_number[i + 1]
      for (let i = 0; i < journey.days.length - 1; i++) {
        expect(journey.days[i].day_number).toBeLessThan(journey.days[i + 1].day_number);
      }
    });
  });
});
