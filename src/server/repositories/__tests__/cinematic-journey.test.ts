import { describe, it, expect } from 'vitest';
import { TripRepository } from '../trip-repository';
import { SEED_TRIPS } from '../seed-data';

describe('Phase 5: Cinematic Journey Mode', () => {
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

      // Days must be chronologically ordered
      expect(journey.days.length).toBeGreaterThan(0);
      for (let i = 0; i < journey.days.length; i++) {
        expect(journey.days[i].day_number).toBe(i + 1);
        if (i > 0) {
          expect(journey.days[i].day_number).toBeGreaterThan(journey.days[i - 1].day_number);
          const currDate = journey.days[i].date;
          const prevDate = journey.days[i - 1].date;
          if (currDate && prevDate) {
            expect(new Date(currDate).getTime()).toBeGreaterThanOrEqual(
              new Date(prevDate).getTime()
            );
          }
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
      // Test known private or draft trips from SEED_TRIPS if any, or verify non-published behavior
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

      // In seed data, there may be next or previous trips or null if single trip
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
  });
});

