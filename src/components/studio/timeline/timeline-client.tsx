'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Camera,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Compass,
  Repeat,
  ShieldAlert,
  ChevronRight,
  Video,
} from 'lucide-react';
import {
  TimelineYearGroup,
  TravelStatistics,
  YearOverYearEvolution,
  RepeatedPlace,
  ArchiveCompletenessReport,
} from '@/server/repositories/timeline-repository';

interface TimelineClientProps {
  initialData: {
    timeline: TimelineYearGroup[];
    stats: TravelStatistics;
    evolution: YearOverYearEvolution[];
    repeatedPlaces: RepeatedPlace[];
    completeness: ArchiveCompletenessReport;
  };
}

export function TimelineClient({ initialData }: TimelineClientProps) {
  const { timeline, stats, evolution, repeatedPlaces, completeness } = initialData;

  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('ALL');

  const filteredTimeline =
    selectedYearFilter === 'ALL'
      ? timeline
      : timeline.filter((yg) => yg.year === selectedYearFilter);

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-800 pb-6">
        <div>
          <h1 className="text-2xl font-serif tracking-wide text-stone-100 flex items-center gap-2.5">
            <Compass className="w-6 h-6 text-amber-500" />
            Personal Timeline & Archive Intelligence
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Deterministic chronological travel history, destination return patterns, and archive completeness metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono bg-stone-900 border border-stone-800 text-stone-400 px-3 py-1 rounded-full">
            100% Deterministic • Zero AI
          </span>
        </div>
      </div>

      {/* 1. Archive at a Glance */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span>Journeys</span>
            <Layers className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-stone-100 font-mono">{stats.journeys.total}</div>
          <div className="text-[11px] text-stone-500">{stats.journeys.published} Published</div>
        </div>

        <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span>Places</span>
            <MapPin className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-stone-100 font-mono">{stats.places.total}</div>
          <div className="text-[11px] text-stone-500">{stats.places.multiTripCount} Returned Places</div>
        </div>

        <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span>Memories</span>
            <BookOpen className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-stone-100 font-mono">{stats.memories.total}</div>
          <div className="text-[11px] text-stone-500">Recorded Journals</div>
        </div>

        <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span>Media Assets</span>
            <Camera className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-stone-100 font-mono">{stats.media.total}</div>
          <div className="text-[11px] text-stone-500">
            {stats.media.photos} Photos · {stats.media.videos} Videos
          </div>
        </div>

        <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-4 space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span>Curation Health</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {completeness.overallCompleteness}%
          </div>
          <div className="text-[11px] text-stone-500">{stats.media.curated} Curated Media</div>
        </div>
      </div>

      {/* Main Grid: Timeline + Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Personal Travel Timeline (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <h2 className="text-lg font-serif text-stone-200 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              Chronological Travel Timeline
            </h2>

            {/* Year Filter Buttons */}
            <div className="flex items-center gap-1 overflow-x-auto text-xs">
              <button
                type="button"
                onClick={() => setSelectedYearFilter('ALL')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  selectedYearFilter === 'ALL'
                    ? 'bg-amber-500 text-stone-950 font-medium'
                    : 'bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                All
              </button>
              {timeline.map((yg) => (
                <button
                  key={yg.year}
                  type="button"
                  onClick={() => setSelectedYearFilter(yg.year)}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    selectedYearFilter === yg.year
                      ? 'bg-amber-500 text-stone-950 font-medium'
                      : 'bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {yg.year}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline Stream */}
          {filteredTimeline.length === 0 ? (
            <div className="bg-stone-900/50 border border-stone-800 rounded-xl p-8 text-center text-xs text-stone-500">
              No journeys recorded for this timeline filter.
            </div>
          ) : (
            <div className="space-y-8 relative before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-stone-800">
              {filteredTimeline.map((yearGroup) => (
                <div key={yearGroup.year} className="space-y-4 relative pl-8">
                  {/* Year Marker Pill */}
                  <div className="absolute -left-0.5 top-0 w-7 h-7 rounded-full bg-stone-900 border border-amber-500/50 flex items-center justify-center text-[10px] font-mono text-amber-400 font-bold">
                    {yearGroup.year === 'Date Unknown' ? '?' : yearGroup.year.slice(2)}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xl font-serif font-bold text-stone-100">{yearGroup.year}</span>
                    <span className="text-xs text-stone-500 font-mono">
                      ({yearGroup.trips.length} {yearGroup.trips.length === 1 ? 'journey' : 'journeys'})
                    </span>
                  </div>

                  {/* Journeys in Year */}
                  <div className="grid grid-cols-1 gap-3">
                    {yearGroup.trips.map((item) => (
                      <div
                        key={item.trip.id}
                        className="bg-stone-900/80 border border-stone-800 hover:border-stone-700 rounded-xl p-4 transition-colors space-y-3"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <Link
                              href={`/studio/trips/${item.trip.id}`}
                              className="text-base font-medium text-stone-200 hover:text-amber-400 transition-colors flex items-center gap-1.5"
                            >
                              {item.trip.title}
                              <ArrowUpRight className="w-3.5 h-3.5 opacity-50" />
                            </Link>

                            <div className="flex items-center gap-3 text-xs text-stone-400 mt-1">
                              {item.trip.start_date ? (
                                <span>{item.trip.start_date}</span>
                              ) : (
                                <span className="text-amber-500/80">Date unknown</span>
                              )}
                              {item.durationDays && <span>• {item.durationDays} days</span>}
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded border font-mono ${
                                  item.trip.status === 'PUBLISHED'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-stone-800 text-stone-400 border-stone-700'
                                }`}
                              >
                                {item.trip.status}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-stone-400 font-mono bg-stone-950 px-2.5 py-1 rounded border border-stone-800">
                            <Camera className="w-3.5 h-3.5 text-amber-500" />
                            <span>{item.mediaCount} media</span>
                          </div>
                        </div>

                        {/* Places visited during journey */}
                        {item.places.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {item.places.map((place) => (
                              <Link
                                key={place.id}
                                href={`/places/${place.slug}`}
                                className="text-[10px] bg-stone-950 hover:bg-stone-800 border border-stone-800 px-2 py-0.5 rounded text-stone-300 transition-colors flex items-center gap-1"
                              >
                                <MapPin className="w-2.5 h-2.5 text-amber-500/80" />
                                {place.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Insights, Repeated Places & Completeness (1 Col) */}
        <div className="space-y-8">
          {/* 2. Places I've Returned To */}
          <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-5 space-y-4">
            <h2 className="text-base font-serif text-stone-200 flex items-center gap-2 border-b border-stone-800 pb-3">
              <Repeat className="w-4 h-4 text-amber-500" />
              Places I&apos;ve Returned To
            </h2>

            {repeatedPlaces.length === 0 ? (
              <p className="text-xs text-stone-500 italic">No destinations associated with multiple journeys yet.</p>
            ) : (
              <div className="space-y-3">
                {repeatedPlaces.slice(0, 5).map((rp) => (
                  <div key={rp.place.id} className="bg-stone-950 p-3 rounded-lg border border-stone-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-stone-200">{rp.place.name}</span>
                      <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono font-medium">
                        {rp.journeyCount} journeys
                      </span>
                    </div>

                    <div className="text-[11px] text-stone-400 flex items-center gap-3">
                      <span>{rp.memoryCount} memories</span>
                      <span>•</span>
                      <span>{rp.mediaCount} media</span>
                    </div>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {rp.trips.map((t) => (
                        <span key={t.id} className="text-[9px] bg-stone-900 border border-stone-800 px-1.5 py-0.5 rounded text-stone-400">
                          {t.title}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Year-over-Year Travel Evolution */}
          <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-5 space-y-4">
            <h2 className="text-base font-serif text-stone-200 flex items-center gap-2 border-b border-stone-800 pb-3">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              Year-over-Year Evolution
            </h2>

            {evolution.length === 0 ? (
              <p className="text-xs text-stone-500 italic">No yearly date records found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-stone-800 text-stone-500 text-[10px] font-mono uppercase">
                      <th className="pb-2">Year</th>
                      <th className="pb-2 text-right">Trips</th>
                      <th className="pb-2 text-right">Places</th>
                      <th className="pb-2 text-right">Memories</th>
                      <th className="pb-2 text-right">Media</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/50 text-stone-300 font-mono">
                    {evolution.map((row) => (
                      <tr key={row.year} className="hover:bg-stone-950/40">
                        <td className="py-2 text-stone-100 font-semibold">{row.year}</td>
                        <td className="py-2 text-right text-stone-300">{row.tripsCount}</td>
                        <td className="py-2 text-right text-stone-300">{row.placesCount}</td>
                        <td className="py-2 text-right text-stone-300">{row.memoriesCount}</td>
                        <td className="py-2 text-right text-amber-400">{row.mediaCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 4. Archive Completeness & Needs Attention Workbench */}
          <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-5 space-y-4">
            <h2 className="text-base font-serif text-stone-200 flex items-center gap-2 border-b border-stone-800 pb-3">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              Needs Attention Workbench
            </h2>

            {/* Completeness Meters */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-stone-400">
                <span>Trips Date Coverage</span>
                <span className="font-mono text-stone-200">{completeness.tripsDateCompleteness}%</span>
              </div>
              <div className="w-full bg-stone-950 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${completeness.tripsDateCompleteness}%` }} />
              </div>

              <div className="flex justify-between text-stone-400 pt-1">
                <span>Places Coordinates</span>
                <span className="font-mono text-stone-200">{completeness.placesCoordinateCompleteness}%</span>
              </div>
              <div className="w-full bg-stone-950 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${completeness.placesCoordinateCompleteness}%` }} />
              </div>

              <div className="flex justify-between text-stone-400 pt-1">
                <span>Media Metadata</span>
                <span className="font-mono text-stone-200">{completeness.mediaMetadataCompleteness}%</span>
              </div>
              <div className="w-full bg-stone-950 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${completeness.mediaMetadataCompleteness}%` }} />
              </div>
            </div>

            {/* Actionable Workbench Links */}
            <div className="pt-2 space-y-2">
              {completeness.workbench.mediaMissingTakenAt > 0 && (
                <Link
                  href="/studio/media"
                  className="flex items-center justify-between bg-stone-950 hover:bg-stone-800 border border-stone-800 p-2.5 rounded text-xs transition-colors"
                >
                  <span className="text-amber-400/90">{completeness.workbench.mediaMissingTakenAt} media missing taken-at date</span>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
                </Link>
              )}

              {completeness.workbench.placesMissingCoords > 0 && (
                <Link
                  href="/studio/places"
                  className="flex items-center justify-between bg-stone-950 hover:bg-stone-800 border border-stone-800 p-2.5 rounded text-xs transition-colors"
                >
                  <span className="text-amber-400/90">{completeness.workbench.placesMissingCoords} places missing coordinates</span>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
                </Link>
              )}

              {completeness.workbench.mediaMissingPlace > 0 && (
                <Link
                  href="/studio/archive"
                  className="flex items-center justify-between bg-stone-950 hover:bg-stone-800 border border-stone-800 p-2.5 rounded text-xs transition-colors"
                >
                  <span className="text-amber-400/90">{completeness.workbench.mediaMissingPlace} media unassigned to place</span>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
