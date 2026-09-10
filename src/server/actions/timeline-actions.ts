'use server';

import { verifyStudioAuth } from '@/lib/auth/server';
import {
  TimelineRepository,
  TimelineYearGroup,
  TravelStatistics,
  YearOverYearEvolution,
  RepeatedPlace,
  ArchiveCompletenessReport,
} from '../repositories/timeline-repository';

export interface StudioTimelineData {
  timeline: TimelineYearGroup[];
  stats: TravelStatistics;
  evolution: YearOverYearEvolution[];
  repeatedPlaces: RepeatedPlace[];
  completeness: ArchiveCompletenessReport;
}

export interface StudioTimelineActionResult {
  success: boolean;
  data?: StudioTimelineData;
  error?: string;
}

/**
 * Server action to fetch authenticated Studio personal timeline intelligence.
 */
export async function getStudioTimelineDataAction(): Promise<StudioTimelineActionResult> {
  const auth = await verifyStudioAuth();
  if (!auth.authenticated) {
    return { success: false, error: 'Unauthorized: Studio session required' };
  }

  try {
    const [timeline, stats, evolution, repeatedPlaces, completeness] = await Promise.all([
      TimelineRepository.getChronologicalTimeline(),
      TimelineRepository.getTravelStatistics(),
      TimelineRepository.getYearOverYearEvolution(),
      TimelineRepository.getRepeatedPlaces(),
      TimelineRepository.getArchiveCompletenessReport(),
    ]);

    return {
      success: true,
      data: {
        timeline,
        stats,
        evolution,
        repeatedPlaces,
        completeness,
      },
    };
  } catch (err: any) {
    console.error('getStudioTimelineDataAction error:', err);
    return { success: false, error: err.message || 'Failed to compute studio timeline data' };
  }
}
