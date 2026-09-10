'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  MapPin,
  Compass,
  X,
  ArrowRight,
  ExternalLink,
  Sparkles,
  RotateCcw,
  Search,
} from 'lucide-react';
import { PublicMapPlace } from '@/types/entities';
import { ImageFrame } from '@/components/ui/image-frame';

// Dynamically load Leaflet Map Canvas with SSR disabled
const MapCanvas = dynamic(() => import('./map-canvas'), {
  ssr: false,
  loading: () => <MapLoadingSkeleton />,
});

function MapLoadingSkeleton() {
  return (
    <div className="w-full h-full bg-[#0B0D0E] flex flex-col items-center justify-center p-6 text-center space-y-3 select-none">
      <div className="w-10 h-10 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
      <p className="text-xs font-mono uppercase tracking-widest text-neutral-400">
        Loading Cartography...
      </p>
    </div>
  );
}

interface MapExplorerClientProps {
  initialPlaces: PublicMapPlace[];
  availableJourneys: { id: string; title: string; slug: string }[];
  initialJourneySlug?: string;
  totalUnmappedPlaces?: number;
}

export function MapExplorerClient({
  initialPlaces,
  availableJourneys,
  initialJourneySlug,
  totalUnmappedPlaces = 0,
}: MapExplorerClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [selectedJourneySlug, setSelectedJourneySlug] = useState<string | null>(
    initialJourneySlug || null
  );
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [placeQuery, setPlaceQuery] = useState('');

  // Sync state with URL if query parameter changes externally
  useEffect(() => {
    const journeyParam = searchParams.get('journey');
    if (journeyParam !== selectedJourneySlug) {
      setSelectedJourneySlug(journeyParam);
    }
  }, [searchParams, selectedJourneySlug]);

  // Handle Escape key to close selected place panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedPlaceId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter places based on journey selection and place search
  const visiblePlaces = useMemo(() => {
    return initialPlaces.filter((place) => {
      // 1. Journey filter
      if (selectedJourneySlug) {
        const matchesJourney = place.relatedJourneys.some(
          (j) => j.slug === selectedJourneySlug
        );
        if (!matchesJourney) return false;
      }

      // 2. Text search query
      if (placeQuery.trim()) {
        const q = placeQuery.toLowerCase().trim();
        const matchesName = place.name.toLowerCase().includes(q);
        const matchesCity = place.city ? place.city.toLowerCase().includes(q) : false;
        const matchesState = place.state ? place.state.toLowerCase().includes(q) : false;
        const matchesCountry = place.country.toLowerCase().includes(q);
        if (!matchesName && !matchesCity && !matchesState && !matchesCountry) {
          return false;
        }
      }

      return true;
    });
  }, [initialPlaces, selectedJourneySlug, placeQuery]);

  // Currently selected place object
  const selectedPlace = useMemo(() => {
    if (!selectedPlaceId) return null;
    return initialPlaces.find((p) => p.id === selectedPlaceId) || null;
  }, [selectedPlaceId, initialPlaces]);

  // Handle journey filter change with shallow router replace
  const handleJourneyChange = useCallback(
    (slug: string | null) => {
      setSelectedJourneySlug(slug);
      setSelectedPlaceId(null);

      const params = new URLSearchParams(window.location.search);
      if (slug) {
        params.set('journey', slug);
      } else {
        params.delete('journey');
      }
      const newUrl = params.toString() ? `/map?${params.toString()}` : '/map';
      router.replace(newUrl, { scroll: false });
    },
    [router]
  );

  return (
    <div className="relative w-full h-[calc(100vh-73px)] min-h-[500px] overflow-hidden bg-[#0B0D0E]">
      {/* 1. Interactive Map Canvas */}
      <div className="absolute inset-0 z-0">
        <MapCanvas
          places={visiblePlaces}
          selectedPlaceId={selectedPlaceId}
          onSelectPlace={setSelectedPlaceId}
        />
      </div>

      {/* 2. Top Restrained Header & Journey Selector Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 pointer-events-none">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pointer-events-auto">
          {/* Title & Stats */}
          <div className="flex items-center gap-3 bg-[#0B0D0E]/90 backdrop-blur-md border border-white/[0.08] px-4 py-2.5 rounded-xl shadow-lg">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-sm font-semibold text-white tracking-wide">
                  Geographic Atlas
                </span>
                <span className="text-[10px] font-mono text-neutral-400 bg-white/[0.06] px-1.5 py-0.5 rounded">
                  {visiblePlaces.length} {visiblePlaces.length === 1 ? 'place' : 'places'}
                </span>
              </div>
            </div>
          </div>

          {/* Controls: Search + Journey Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 max-w-full overflow-x-auto py-1">
            {/* Search Input */}
            <div className="relative flex items-center bg-[#0B0D0E]/90 backdrop-blur-md border border-white/[0.08] rounded-xl px-2.5 py-1.5 shadow-lg">
              <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <input
                type="text"
                placeholder="Filter places..."
                value={placeQuery}
                onChange={(e) => setPlaceQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-mono text-white placeholder-neutral-500 pl-2 w-28 sm:w-36 focus:w-44 transition-all"
                aria-label="Filter places on map"
              />
              {placeQuery && (
                <button
                  type="button"
                  onClick={() => setPlaceQuery('')}
                  className="text-neutral-400 hover:text-white ml-1"
                  aria-label="Clear filter query"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Journey Filter Pills */}
            <div className="flex items-center gap-1.5 bg-[#0B0D0E]/90 backdrop-blur-md border border-white/[0.08] p-1 rounded-xl shadow-lg">
              <button
                type="button"
                onClick={() => handleJourneyChange(null)}
                className={`px-3 py-1 rounded-lg text-xs font-mono uppercase tracking-wider transition-all ${
                  selectedJourneySlug === null
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                All Journeys
              </button>

              {availableJourneys.map((journey) => {
                const isActive = selectedJourneySlug === journey.slug;
                return (
                  <button
                    key={journey.id}
                    type="button"
                    onClick={() => handleJourneyChange(journey.slug)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {journey.title}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Empty States Overlay */}
      {visiblePlaces.length === 0 && (
        <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center p-6">
          <div className="pointer-events-auto max-w-md bg-[#0B0D0E]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center space-y-4 shadow-2xl">
            <div className="mx-auto w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Compass className="w-5 h-5" />
            </div>

            {initialPlaces.length === 0 ? (
              totalUnmappedPlaces > 0 ? (
                <>
                  <h2 className="font-serif text-xl font-bold text-white tracking-wide">
                    NO LOCATIONS MAPPED
                  </h2>
                  <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                    Published places exist, but none currently have geographic coordinates.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="font-serif text-xl font-bold text-white tracking-wide">
                    THE ATLAS IS QUIET
                  </h2>
                  <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                    No published places have been added yet.
                  </p>
                </>
              )
            ) : (
              <>
                <h2 className="font-serif text-xl font-bold text-white tracking-wide">
                  NO PLACES FOUND
                </h2>
                <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                  Try another journey or clear your search filter.
                </p>
                <div className="pt-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedJourneySlug(null);
                      setPlaceQuery('');
                      handleJourneyChange(null);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/10 border border-white/10 text-xs font-mono uppercase tracking-wider text-white transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Reset Filters</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 4. Selected Place Editorial Experience (Section 12 & 13) */}
      {selectedPlace && (
        <aside
          role="dialog"
          aria-label={`Details for ${selectedPlace.name}`}
          className="absolute z-30 bottom-0 sm:bottom-6 sm:left-6 w-full sm:w-[380px] max-h-[85vh] sm:max-h-[calc(100vh-140px)] overflow-y-auto bg-[#0B0D0E]/95 backdrop-blur-xl border-t sm:border border-white/10 sm:rounded-2xl shadow-2xl p-6 space-y-5 animate-fade-in"
        >
          {/* Top Bar: Location Tag & Close Button */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-amber-400 font-semibold">
                <MapPin className="w-3 h-3" />
                Waypoint
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white leading-tight">
                {selectedPlace.name}
              </h2>
              <p className="text-xs font-mono text-neutral-400">
                {[selectedPlace.city, selectedPlace.state, selectedPlace.country]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedPlaceId(null)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              aria-label="Close place details"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cover Media */}
          {selectedPlace.coverMedia ? (
            <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-neutral-900 border border-white/[0.06]">
              <ImageFrame
                src={selectedPlace.coverMedia.storage_url}
                alt={selectedPlace.coverMedia.alt_text || selectedPlace.name}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="aspect-[16/10] w-full rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center text-center p-4">
              <p className="text-[11px] font-mono text-neutral-500">
                No visual record archived yet
              </p>
            </div>
          )}

          {/* Description (Truthful, only if present) */}
          {selectedPlace.description && (
            <p className="text-xs sm:text-sm text-neutral-300 font-sans leading-relaxed font-light">
              {selectedPlace.description}
            </p>
          )}

          {/* Place -> Related Journeys Connection (Section 13) */}
          <div className="space-y-3 pt-2 border-t border-white/[0.08]">
            <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-neutral-400">
              <span>Related Journeys</span>
              <span className="text-white font-semibold">
                {selectedPlace.relatedJourneyCount}
              </span>
            </div>

            {selectedPlace.relatedJourneys.length > 0 ? (
              <div className="space-y-2">
                {selectedPlace.relatedJourneys.map((journey) => (
                  <div
                    key={journey.id}
                    className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/20 transition-all flex items-center justify-between group"
                  >
                    <div>
                      <h4 className="font-serif text-sm font-semibold text-white group-hover:text-amber-400 transition-colors">
                        {journey.title}
                      </h4>
                      <p className="text-[10px] font-mono text-neutral-500 mt-0.5">
                        Published Expedition
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/journeys/${journey.slug}`}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                        title="View Journey Overview"
                        aria-label={`View ${journey.title}`}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/journeys/${journey.slug}/cinematic`}
                        className="p-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
                        title="Cinematic Experience"
                        aria-label={`Experience ${journey.title}`}
                      >
                        <Sparkles className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-mono text-neutral-500 italic">
                Independent archive location (no linked expedition)
              </p>
            )}
          </div>

          {/* Primary Action: View Place Page */}
          <div className="pt-2">
            <Link
              href={`/places/${selectedPlace.slug}`}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400/50 text-amber-300 hover:text-amber-200 text-xs font-mono uppercase tracking-wider transition-all group"
            >
              <span>Explore Place Archive</span>
              <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </aside>
      )}
    </div>
  );
}
