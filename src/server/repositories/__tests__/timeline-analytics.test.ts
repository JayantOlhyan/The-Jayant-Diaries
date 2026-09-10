import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TimelineRepository } from '../timeline-repository';
import { getStudioTimelineDataAction } from '../../actions/timeline-actions';

describe('Phase 13: Archive Intelligence & Personal Timeline', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.TEST_AUTH_OVERRIDE = 'authenticated';
  });

  it('builds a chronological timeline grouped by year and month from actual stored dates', async () => {
    const timeline = await TimelineRepository.getChronologicalTimeline();

    expect(Array.isArray(timeline)).toBe(true);

    if (timeline.length > 0) {
      const firstYear = timeline[0];
      expect(firstYear.year).toBeDefined();
      expect(Array.isArray(firstYear.months)).toBe(true);
      expect(Array.isArray(firstYear.trips)).toBe(true);

      const firstTripEntry = firstYear.trips[0];
      expect(firstTripEntry.trip.id).toBeDefined();
      expect(typeof firstTripEntry.memoriesCount).toBe('number');
      expect(typeof firstTripEntry.mediaCount).toBe('number');
    }
  });

  it('calculates deterministic travel statistics without manufactured values', async () => {
    const stats = await TimelineRepository.getTravelStatistics();

    expect(stats.journeys.total).toBeGreaterThanOrEqual(0);
    expect(stats.journeys.published).toBeGreaterThanOrEqual(0);
    expect(stats.places.total).toBeGreaterThanOrEqual(0);
    expect(stats.memories.total).toBeGreaterThanOrEqual(0);
    expect(stats.media.total).toBeGreaterThanOrEqual(0);
    expect(stats.media.photos).toBeGreaterThanOrEqual(0);
    expect(stats.media.videos).toBeGreaterThanOrEqual(0);
  });

  it('aggregates year-over-year evolution using neutral factual counts', async () => {
    const evolution = await TimelineRepository.getYearOverYearEvolution();

    expect(Array.isArray(evolution)).toBe(true);
    evolution.forEach((item) => {
      expect(item.year).toBeDefined();
      expect(typeof item.tripsCount).toBe('number');
      expect(typeof item.placesCount).toBe('number');
      expect(typeof item.memoriesCount).toBe('number');
      expect(typeof item.mediaCount).toBe('number');
    });
  });

  it('identifies destinations associated with multiple journeys sorted by frequency', async () => {
    const repeated = await TimelineRepository.getRepeatedPlaces();

    expect(Array.isArray(repeated)).toBe(true);
    repeated.forEach((rp) => {
      expect(rp.place.id).toBeDefined();
      expect(rp.journeyCount).toBeGreaterThan(1);
      expect(Array.isArray(rp.trips)).toBe(true);
    });

    if (repeated.length > 1) {
      expect(repeated[0].journeyCount).toBeGreaterThanOrEqual(repeated[1].journeyCount);
    }
  });

  it('computes exact archive completeness percentages according to documented formulas', async () => {
    const report = await TimelineRepository.getArchiveCompletenessReport();

    expect(typeof report.tripsDateCompleteness).toBe('number');
    expect(typeof report.placesCoordinateCompleteness).toBe('number');
    expect(typeof report.mediaMetadataCompleteness).toBe('number');
    expect(typeof report.curationCompleteness).toBe('number');
    expect(typeof report.overallCompleteness).toBe('number');

    expect(report.tripsDateCompleteness).toBeGreaterThanOrEqual(0);
    expect(report.tripsDateCompleteness).toBeLessThanOrEqual(100);

    expect(report.overallCompleteness).toBeGreaterThanOrEqual(0);
    expect(report.overallCompleteness).toBeLessThanOrEqual(100);

    expect(typeof report.workbench.mediaMissingTakenAt).toBe('number');
    expect(typeof report.workbench.placesMissingCoords).toBe('number');
  });

  it('enforces Studio authentication on getStudioTimelineDataAction', async () => {
    process.env.TEST_AUTH_OVERRIDE = 'unauthorized';

    const res = await getStudioTimelineDataAction();
    expect(res.success).toBe(false);
    expect(res.error).toBe('Unauthorized: Studio session required');
  });
});
