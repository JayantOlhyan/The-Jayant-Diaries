import { describe, it, expect } from 'vitest';
import { TripRepository } from '../trip-repository';
import { DayRepository } from '../day-repository';
import { PlaceRepository } from '../place-repository';
import { MemoryRepository } from '../memory-repository';
import { MediaRepository } from '../media-repository';
import { StatsRepository } from '../stats-repository';

describe('Phase 1: Archive Engine Repositories', () => {
  describe('TripRepository', () => {
    it('returns public trips with correct visibility', async () => {
      const publicTrips = await TripRepository.getPublicTrips();
      expect(publicTrips.length).toBeGreaterThan(0);
      for (const trip of publicTrips) {
        expect(trip.visibility).toBe('PUBLIC');
        expect(trip.status).toBe('PUBLISHED');
      }
    });

    it('retrieves trip with complete relational tree (days, places, memories, media)', async () => {
      const publicTrips = await TripRepository.getPublicTrips();
      const firstTrip = publicTrips[0];
      const tripWithDetails = await TripRepository.getTripWithDetails(firstTrip.id);

      expect(tripWithDetails).not.toBeNull();
      expect(tripWithDetails?.id).toBe(firstTrip.id);
      expect(Array.isArray(tripWithDetails?.days)).toBe(true);
      expect(Array.isArray(tripWithDetails?.places)).toBe(true);
      expect(Array.isArray(tripWithDetails?.memories)).toBe(true);
      expect(typeof tripWithDetails?.media_count).toBe('number');
    });

    it('creates, updates, and fetches a new trip', async () => {
      const newTrip = await TripRepository.createTrip({
        title: 'Zanskar Winter Trek',
        slug: 'zanskar-winter-trek',
        description: 'Chadar frozen river expedition.',
        status: 'DRAFT',
        visibility: 'PRIVATE',
      });

      expect(newTrip.id).toBeDefined();
      expect(newTrip.title).toBe('Zanskar Winter Trek');

      const updated = await TripRepository.updateTrip(newTrip.id, {
        title: 'Zanskar Chadar Frozen River Expedition',
      });
      expect(updated?.title).toBe('Zanskar Chadar Frozen River Expedition');

      const fetched = await TripRepository.getTripById(newTrip.id);
      expect(fetched?.title).toBe('Zanskar Chadar Frozen River Expedition');
    });
  });

  describe('DayRepository', () => {
    it('creates and retrieves days for a trip', async () => {
      const tripId = 'test-trip-day-integration';
      const day1 = await DayRepository.createDay({
        trip_id: tripId,
        day_number: 1,
        title: 'Arrival in Padum',
        date: '2026-01-10',
        description: 'Frozen river start point',
      });

      expect(day1.id).toBeDefined();
      expect(day1.day_number).toBe(1);

      const days = await DayRepository.getDaysByTripId(tripId);
      expect(days.some((d) => d.id === day1.id)).toBe(true);

      const updatedDay = await DayRepository.updateDay(day1.id, {
        title: 'Arrival in Padum (Updated)',
      });
      expect(updatedDay?.title).toBe('Arrival in Padum (Updated)');

      await DayRepository.deleteDay(day1.id);
      const remainingDays = await DayRepository.getDaysByTripId(tripId);
      expect(remainingDays.some((d) => d.id === day1.id)).toBe(false);
    });
  });

  describe('PlaceRepository', () => {
    it('creates, reads, updates, and deletes places', async () => {
      const newPlace = await PlaceRepository.createPlace({
        name: 'Chadar Gorge',
        slug: 'chadar-gorge',
        country: 'India',
        state: 'Ladakh',
        latitude: 33.9,
        longitude: 76.9,
        description: 'Canyon walls flanking the icy river.',
      });

      expect(newPlace.id).toBeDefined();
      expect(newPlace.name).toBe('Chadar Gorge');

      const allPlaces = await PlaceRepository.getAllPlaces();
      expect(allPlaces.some((p) => p.id === newPlace.id)).toBe(true);

      const updated = await PlaceRepository.updatePlace(newPlace.id, {
        description: 'Updated canyon description.',
      });
      expect(updated?.description).toBe('Updated canyon description.');

      await PlaceRepository.deletePlace(newPlace.id);
      const afterDelete = await PlaceRepository.getAllPlaces();
      expect(afterDelete.some((p) => p.id === newPlace.id)).toBe(false);
    });
  });

  describe('MemoryRepository', () => {
    it('creates, retrieves, and removes a memory', async () => {
      const memory = await MemoryRepository.createMemory({
        trip_id: 'trip-ladakh-2026',
        title: 'First Step on the Blue Ice',
        journal: 'The ice cracked beneath our insulated boots, echoing across the sheer stone canyon.',
        date: '2026-01-12',
        featured: true,
      });

      expect(memory.id).toBeDefined();
      expect(memory.title).toBe('First Step on the Blue Ice');

      const memories = await MemoryRepository.getMemoriesByTripId('trip-ladakh-2026');
      expect(memories.some((m) => m.id === memory.id)).toBe(true);

      await MemoryRepository.deleteMemory(memory.id);
      const afterDelete = await MemoryRepository.getMemoriesByTripId('trip-ladakh-2026');
      expect(afterDelete.some((m) => m.id === memory.id)).toBe(false);
    });
  });

  describe('MediaRepository & Content References', () => {
    it('creates a YouTube content reference with video metadata', async () => {
      const media = await MediaRepository.createMediaReference({
        type: 'YOUTUBE',
        trip_id: 'trip-ladakh-2026',
        title: 'Cinematic Ladakh Drone Film',
        youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        youtube_id: 'dQw4w9WgXcQ',
        thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      });

      expect(media.id).toBeDefined();
      expect(media.type).toBe('VIDEO');
      expect(media.storage_url).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      expect(media.thumbnail_url).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
      expect(media.caption).toBe('Cinematic Ladakh Drone Film');
    });

    it('creates an Image content reference', async () => {
      const media = await MediaRepository.createMediaReference({
        type: 'IMAGE',
        trip_id: 'trip-ladakh-2026',
        url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
        caption: 'Reflective mountain lake sunset',
      });

      expect(media.id).toBeDefined();
      expect(media.type).toBe('PHOTO');
      expect(media.storage_url).toBe('https://images.unsplash.com/photo-1506744038136-46273834b3fb');
      expect(media.caption).toBe('Reflective mountain lake sunset');
    });

    it('creates an Instagram content reference', async () => {
      const media = await MediaRepository.createMediaReference({
        type: 'INSTAGRAM',
        trip_id: 'trip-ladakh-2026',
        instagram_url: 'https://instagram.com/p/DF2123abc/',
        shortcode: 'DF2123abc',
        instagram_type: 'REEL',
        caption: 'Passing through Khardung La in a blizzard',
      });

      expect(media.id).toBeDefined();
      expect(media.type).toBe('REEL');
      expect(media.caption).toBe('Passing through Khardung La in a blizzard');
    });
  });

  describe('StatsRepository', () => {
    it('calculates aggregate metrics across all entities', async () => {
      const stats = await StatsRepository.getStudioStats();

      expect(typeof stats.trips_count).toBe('number');
      expect(typeof stats.days_count).toBe('number');
      expect(typeof stats.places_count).toBe('number');
      expect(typeof stats.memories_count).toBe('number');
      expect(typeof stats.images_count).toBe('number');
      expect(typeof stats.videos_count).toBe('number');

      expect(stats.trips_count).toBeGreaterThan(0);
      expect(stats.days_count).toBeGreaterThan(0);
      expect(stats.places_count).toBeGreaterThan(0);
      expect(stats.memories_count).toBeGreaterThan(0);
    });
  });
});
