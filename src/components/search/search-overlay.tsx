'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  ArrowRight,
  MapPin,
  Calendar,
  Play,
  FileText,
  Camera,
  Loader2,
  Film,
} from 'lucide-react';
import { SearchResults } from '@/server/repositories/search-repository';
import { MountainLogo } from '@/components/public/public-header';
import { ImageFrame } from '@/components/ui/image-frame';

// Curated atmospheric imagery fallback for search items
const PLACE_IMAGES: Record<string, string> = {
  leh: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
  'magnetic-hill': 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&auto=format&fit=crop&q=80',
  'nubra-valley': 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600&auto=format&fit=crop&q=80',
  'khardung-la': 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&auto=format&fit=crop&q=80',
  'pangong-lake': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
};

const STORY_IMAGES: Record<string, string> = {
  'mem11111-1111-4111-a111-111111111111':
    'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600&auto=format&fit=crop&q=80',
  'mem22222-2222-4222-a222-222222222222':
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&auto=format&fit=crop&q=80',
  'mem33333-3333-4333-a333-333333333333':
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
};

type ActiveFilter = 'ALL' | 'JOURNEYS' | 'PLACES' | 'STORIES' | 'PHOTOGRAPHY' | 'FILMS';

export function SearchOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('ALL');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Listen for Cmd+K / Ctrl+K and custom 'open-search' events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    const handleCustomOpen = () => {
      setIsOpen(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-search', handleCustomOpen);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-search', handleCustomOpen);
    };
  }, [isOpen]);

  // Lock body scroll and autofocus input when opened
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setResults(null);
      setActiveFilter('ALL');
    }
  }, [isOpen]);

  // Query API with debounce
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data: SearchResults = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error('Search request failed', err);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleResultClick = (href: string) => {
    handleClose();
    router.push(href);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      handleClose();
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  if (!isOpen) return null;

  const totalCount = results?.totalCount ?? 0;
  const journeysCount = results?.journeys.length ?? 0;
  const placesCount = results?.places.length ?? 0;
  const storiesCount = results?.stories.length ?? 0;
  const photoCount = results?.photography.length ?? 0;
  const filmCount = results?.films.length ?? 0;

  const showJourneys = activeFilter === 'ALL' || activeFilter === 'JOURNEYS';
  const showPlaces = activeFilter === 'ALL' || activeFilter === 'PLACES';
  const showStories = activeFilter === 'ALL' || activeFilter === 'STORIES';
  const showPhotography = activeFilter === 'ALL' || activeFilter === 'PHOTOGRAPHY';
  const showFilms = activeFilter === 'ALL' || activeFilter === 'FILMS';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search the archive"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 sm:p-6 lg:p-10 animate-fade-in"
    >
      <div className="relative flex flex-col w-full max-w-5xl h-full max-h-[85vh] rounded-2xl bg-[#0F1113] border border-white/10 shadow-2xl overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-black/40">
          <div className="flex items-center gap-2.5">
            <MountainLogo className="w-5 h-5 text-amber-500" />
            <span className="font-serif text-sm sm:text-base font-bold tracking-tight text-white">
              The Jayant Diaries
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center text-[10px] font-mono text-neutral-400 bg-white/[0.05] border border-white/10 px-2 py-1 rounded">
              ⌘K to search
            </span>
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              aria-label="Close search"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleSubmit} className="relative px-6 py-4 border-b border-white/[0.08] bg-black/20">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-neutral-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the archive..."
              className="w-full pl-12 pr-10 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-neutral-500 font-sans text-sm sm:text-base focus:outline-none focus:border-amber-500/80 focus:bg-white/[0.06] transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3.5 p-1 text-neutral-400 hover:text-white transition-colors"
                aria-label="Clear query"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

        {/* Main Body Layout (Desktop: 2 columns; Mobile: stacked) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Sidebar Filter (Desktop) & Top Filter Bar (Mobile) */}
          {results && totalCount > 0 && (
            <div className="md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-white/[0.08] p-4 bg-black/10 overflow-x-auto md:overflow-y-auto">
              <div className="flex md:flex-col gap-1 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setActiveFilter('ALL')}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-left whitespace-nowrap transition-colors ${
                    activeFilter === 'ALL'
                      ? 'bg-white/10 text-white font-bold'
                      : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span>All Results</span>
                  <span className="ml-2 text-[10px] text-neutral-500">({totalCount})</span>
                </button>

                {journeysCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveFilter('JOURNEYS')}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-left whitespace-nowrap transition-colors ${
                      activeFilter === 'JOURNEYS'
                        ? 'bg-white/10 text-white font-bold'
                        : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <span>Journeys</span>
                    <span className="ml-2 text-[10px] text-neutral-500">({journeysCount})</span>
                  </button>
                )}

                {placesCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveFilter('PLACES')}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-left whitespace-nowrap transition-colors ${
                      activeFilter === 'PLACES'
                        ? 'bg-white/10 text-white font-bold'
                        : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <span>Places</span>
                    <span className="ml-2 text-[10px] text-neutral-500">({placesCount})</span>
                  </button>
                )}

                {storiesCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveFilter('STORIES')}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-left whitespace-nowrap transition-colors ${
                      activeFilter === 'STORIES'
                        ? 'bg-white/10 text-white font-bold'
                        : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <span>Stories</span>
                    <span className="ml-2 text-[10px] text-neutral-500">({storiesCount})</span>
                  </button>
                )}

                {photoCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveFilter('PHOTOGRAPHY')}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-left whitespace-nowrap transition-colors ${
                      activeFilter === 'PHOTOGRAPHY'
                        ? 'bg-white/10 text-white font-bold'
                        : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <span>Photography</span>
                    <span className="ml-2 text-[10px] text-neutral-500">({photoCount})</span>
                  </button>
                )}

                {filmCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveFilter('FILMS')}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-left whitespace-nowrap transition-colors ${
                      activeFilter === 'FILMS'
                        ? 'bg-white/10 text-white font-bold'
                        : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <span>Films</span>
                    <span className="ml-2 text-[10px] text-neutral-500">({filmCount})</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Right Scrollable Content Pane */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Empty State */}
            {!query.trim() && !isLoading && (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 space-y-3">
                <Search className="w-10 h-10 text-neutral-600 stroke-[1.5]" />
                <h3 className="font-serif text-lg text-white">Search the archive</h3>
                <p className="text-xs text-neutral-400 max-w-sm">
                  Journeys, places, stories and moments.
                </p>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 space-y-3">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                <p className="text-xs font-mono text-neutral-400">Searching the archive...</p>
              </div>
            )}

            {/* No Results State */}
            {query.trim() && !isLoading && results && totalCount === 0 && (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 space-y-3">
                <FileText className="w-10 h-10 text-neutral-600 stroke-[1.5]" />
                <h3 className="font-serif text-lg text-white">Nothing found.</h3>
                <p className="text-xs text-neutral-400 max-w-sm">
                  Try searching for a journey, place, story or memory.
                </p>
              </div>
            )}

            {/* Grouped Search Results */}
            {query.trim() && !isLoading && results && totalCount > 0 && (
              <div className="space-y-10">
                {/* 1. Journeys Group */}
                {showJourneys && journeysCount > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400">
                        Journeys
                      </span>
                    </div>
                    <div className="space-y-2">
                      {results.journeys.map((trip) => (
                        <div
                          key={trip.id}
                          onClick={() => handleResultClick(`/journeys/${trip.slug}`)}
                          className="group cursor-pointer flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="relative w-16 h-12 rounded-lg overflow-hidden shrink-0 bg-neutral-900">
                              <ImageFrame
                                src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&auto=format&fit=crop&q=80"
                                alt={trip.title}
                                fill
                              />
                            </div>
                            <div>
                              <h4 className="font-serif text-sm sm:text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                                {trip.title}
                              </h4>
                              {trip.description && (
                                <p className="text-xs text-neutral-400 line-clamp-1">
                                  {trip.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-white group-hover:translate-x-1 transition-transform shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Places Group */}
                {showPlaces && placesCount > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400">
                        Places
                      </span>
                      <Link
                        href="/places"
                        onClick={handleClose}
                        className="text-[11px] font-mono text-neutral-400 hover:text-white transition-colors"
                      >
                        View all ({placesCount})
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {results.places.map((place) => {
                        const cover =
                          PLACE_IMAGES[place.slug] ||
                          'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&auto=format&fit=crop&q=80';
                        return (
                          <div
                            key={place.id}
                            onClick={() => handleResultClick(`/places/${place.slug}`)}
                            className="group cursor-pointer flex flex-col rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.06] hover:border-white/20 transition-all p-2 space-y-2"
                          >
                            <div className="relative aspect-[16/10] w-full rounded-lg overflow-hidden bg-neutral-900">
                              <ImageFrame
                                src={cover}
                                alt={place.name}
                                fill
                                className="group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>
                            <div>
                              <h5 className="font-serif text-xs sm:text-sm font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                                {place.name}
                              </h5>
                              <p className="text-[10px] font-mono text-neutral-400 truncate">
                                {place.state || place.country}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Stories Group */}
                {showStories && storiesCount > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400">
                        Stories
                      </span>
                      <Link
                        href="/stories"
                        onClick={handleClose}
                        className="text-[11px] font-mono text-neutral-400 hover:text-white transition-colors"
                      >
                        View all ({storiesCount})
                      </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {results.stories.map((story) => {
                        const cover =
                          STORY_IMAGES[story.id] ||
                          'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&auto=format&fit=crop&q=80';
                        return (
                          <div
                            key={story.id}
                            onClick={() => handleResultClick(`/stories/${story.id}`)}
                            className="group cursor-pointer flex flex-col rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.06] hover:border-white/20 transition-all p-2.5 space-y-2"
                          >
                            <div className="relative aspect-[16/10] w-full rounded-lg overflow-hidden bg-neutral-900">
                              <ImageFrame
                                src={cover}
                                alt={story.title}
                                fill
                                className="group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>
                            <div>
                              <h5 className="font-serif text-xs sm:text-sm font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                                {story.title}
                              </h5>
                              {story.description && (
                                <p className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">
                                  {story.description}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 4. Photography Group */}
                {showPhotography && photoCount > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400">
                        Photography
                      </span>
                      <Link
                        href="/media"
                        onClick={handleClose}
                        className="text-[11px] font-mono text-neutral-400 hover:text-white transition-colors"
                      >
                        View all ({photoCount})
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {results.photography.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleResultClick('/media')}
                          className="group cursor-pointer flex flex-col rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.06] hover:border-white/20 transition-all p-2 space-y-1.5"
                        >
                          <div className="relative aspect-[16/10] w-full rounded-lg overflow-hidden bg-neutral-900">
                            <ImageFrame
                              src={item.storage_url}
                              alt={item.alt_text || item.caption || item.filename}
                              fill
                              className="group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                          <div>
                            <p className="font-serif text-xs text-white group-hover:text-amber-400 transition-colors truncate">
                              {item.caption || item.filename}
                            </p>
                            <span className="text-[9px] font-mono text-neutral-500">
                              {item.taken_at ? new Date(item.taken_at).getFullYear() : 'Archive'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Films Group */}
                {showFilms && filmCount > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400">
                        Films & Video
                      </span>
                      <Link
                        href="/media"
                        onClick={handleClose}
                        className="text-[11px] font-mono text-neutral-400 hover:text-white transition-colors"
                      >
                        View all ({filmCount})
                      </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {results.films.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleResultClick('/media')}
                          className="group cursor-pointer flex items-center gap-3 p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/20 transition-all"
                        >
                          <div className="relative w-20 aspect-[16/10] rounded-lg overflow-hidden bg-neutral-900 shrink-0">
                            <ImageFrame
                              src={item.thumbnail_url || item.storage_url}
                              alt={item.caption || 'Film'}
                              fill
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Play className="w-4 h-4 text-white fill-white/80" />
                            </div>
                          </div>
                          <div className="truncate">
                            <p className="font-serif text-xs text-white group-hover:text-amber-400 transition-colors truncate">
                              {item.caption || item.filename}
                            </p>
                            <span className="text-[10px] font-mono text-neutral-400">Expedition Reel</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer Link: View all results page */}
                <div className="pt-4 border-t border-white/[0.08] text-center">
                  <button
                    type="button"
                    onClick={() => {
                      handleClose();
                      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
                    }}
                    className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    <span>View all {totalCount} results on dedicated page</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
