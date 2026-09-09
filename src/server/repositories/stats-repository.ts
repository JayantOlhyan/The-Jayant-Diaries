import { supabase, isSupabaseConfigured } from '@/lib/db/client';
import { StudioDashboardStats } from '@/types/entities';
import { TripRepository } from './trip-repository';
import { DayRepository } from './day-repository';
import { PlaceRepository } from './place-repository';
import { MemoryRepository } from './memory-repository';
import { MediaRepository } from './media-repository';

export class StatsRepository {
  /**
   * Retrieves live or seeded metrics for the Studio Dashboard.
   */
  static async getStudioStats(): Promise<StudioDashboardStats> {
    if (!isSupabaseConfigured) {
      const [allTrips, allDays, allPlaces, allMemories, allMedia] = await Promise.all([
        TripRepository.getAllStudioTrips(),
        DayRepository.getAllDays(),
        PlaceRepository.getAllPlaces(),
        MemoryRepository.getAllMemories(),
        MediaRepository.getAllStudioMedia(),
      ]);
      return {
        trips_count: allTrips.length,
        days_count: allDays.length,
        places_count: allPlaces.length,
        memories_count: allMemories.length,
        images_count: allMedia.filter((m) => m.type === 'PHOTO').length,
        videos_count: allMedia.filter((m) => m.type === 'VIDEO' || m.type === 'REEL').length,
      };
    }

    try {
      const [tripsRes, daysRes, placesRes, memoriesRes, mediaRes] = await Promise.all([
        supabase.from('trips').select('id', { count: 'exact', head: true }),
        supabase.from('days').select('id', { count: 'exact', head: true }),
        supabase.from('places').select('id', { count: 'exact', head: true }),
        supabase.from('memories').select('id', { count: 'exact', head: true }),
        supabase.from('media').select('id, type'),
      ]);

      const [allTrips, allDays, allPlaces, allMemories, allMedia] = await Promise.all([
        TripRepository.getAllStudioTrips(),
        DayRepository.getAllDays(),
        PlaceRepository.getAllPlaces(),
        MemoryRepository.getAllMemories(),
        MediaRepository.getAllStudioMedia(),
      ]);

      const tripsCount = tripsRes.count ?? allTrips.length;
      const daysCount = daysRes.count ?? allDays.length;
      const placesCount = placesRes.count ?? allPlaces.length;
      const memoriesCount = memoriesRes.count ?? allMemories.length;

      let imagesCount = allMedia.filter((m) => m.type === 'PHOTO').length;
      let videosCount = allMedia.filter((m) => m.type === 'VIDEO' || m.type === 'REEL').length;

      if (mediaRes.data && (mediaRes.data as any[]).length > 0) {
        imagesCount = (mediaRes.data as any[]).filter((m: any) => m.type === 'PHOTO').length;
        videosCount = (mediaRes.data as any[]).filter((m: any) => m.type === 'VIDEO' || m.type === 'REEL').length;
      }

      return {
        trips_count: tripsCount,
        days_count: daysCount,
        places_count: placesCount,
        memories_count: memoriesCount,
        images_count: imagesCount,
        videos_count: videosCount,
      };
    } catch {
      const [allTrips, allDays, allPlaces, allMemories, allMedia] = await Promise.all([
        TripRepository.getAllStudioTrips(),
        DayRepository.getAllDays(),
        PlaceRepository.getAllPlaces(),
        MemoryRepository.getAllMemories(),
        MediaRepository.getAllStudioMedia(),
      ]);
      return {
        trips_count: allTrips.length,
        days_count: allDays.length,
        places_count: allPlaces.length,
        memories_count: allMemories.length,
        images_count: allMedia.filter((m) => m.type === 'PHOTO').length,
        videos_count: allMedia.filter((m) => m.type === 'VIDEO' || m.type === 'REEL').length,
      };
    }
  }
}
