import { Metadata } from 'next';
import Link from 'next/link';
import { Search, ArrowRight, FileText, Play, MapPin } from 'lucide-react';
import { SearchRepository } from '@/server/repositories/search-repository';
import { ImageFrame } from '@/components/ui/image-frame';

interface SearchPageProps {
  searchParams: Promise<{ q?: string; filter?: string }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `Search: "${q}" — The Jayant Diaries` : 'Search the Archive — The Jayant Diaries',
    description: 'Search across journeys, places, stories, and photographic records.',
    robots: {
      index: false,
      follow: true,
    },
  };
}

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

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = '', filter = 'ALL' } = await searchParams;
  const trimmed = q.trim();
  const results = trimmed ? await SearchRepository.searchPublicArchive(trimmed) : null;

  const totalCount = results?.totalCount ?? 0;
  const journeysCount = results?.journeys.length ?? 0;
  const placesCount = results?.places.length ?? 0;
  const storiesCount = results?.stories.length ?? 0;
  const photoCount = results?.photography.length ?? 0;
  const filmCount = results?.films.length ?? 0;

  const activeFilter = filter.toUpperCase();
  const showJourneys = activeFilter === 'ALL' || activeFilter === 'JOURNEYS';
  const showPlaces = activeFilter === 'ALL' || activeFilter === 'PLACES';
  const showStories = activeFilter === 'ALL' || activeFilter === 'STORIES';
  const showPhotography = activeFilter === 'ALL' || activeFilter === 'PHOTOGRAPHY';
  const showFilms = activeFilter === 'ALL' || activeFilter === 'FILMS';

  return (
    <div className="min-h-screen bg-cinema-black text-white selection:bg-cinema-accent selection:text-white pb-32">
      {/* Header Section */}
      <section className="border-b border-cinema-border/60 bg-gradient-to-b from-cinema-card/50 to-cinema-black/40 py-16 px-6 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-5xl space-y-6">
          <div>
            <span className="text-[11px] font-semibold tracking-[0.25em] text-cinema-accent uppercase font-mono">
              Discovery & Index
            </span>
            <h1 className="mt-2 font-serif text-4xl sm:text-5xl font-normal tracking-tight text-white">
              Archive Search
            </h1>
            <p className="mt-2 text-sm text-cinema-muted max-w-xl font-light">
              Explore journeys, geographic waypoints, field notes, and visual chronicles.
            </p>
          </div>

          {/* Search Form */}
          <form method="GET" action="/search" className="relative max-w-2xl">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                name="q"
                defaultValue={trimmed}
                placeholder="Search by destination, topic, or memory (e.g. Ladakh, sunset, pass)..."
                className="w-full pl-12 pr-28 py-3.5 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-amber-500/80 focus:bg-white/[0.06] transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 px-4 py-1.5 rounded-lg bg-white text-black text-xs font-semibold uppercase tracking-wider hover:bg-white/90 transition-colors"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="mx-auto max-w-5xl px-6 sm:px-10 lg:px-16 mt-12 space-y-12">
        {/* Empty Query State */}
        {!trimmed && (
          <div className="py-24 text-center space-y-3">
            <Search className="w-12 h-12 text-neutral-700 mx-auto stroke-[1.5]" />
            <h3 className="font-serif text-xl text-white">Search the archive</h3>
            <p className="text-sm text-neutral-400 max-w-sm mx-auto">
              Find journeys, places, field notes, photography, and expedition films.
            </p>
          </div>
        )}

        {/* No Results State */}
        {trimmed && totalCount === 0 && (
          <div className="py-24 text-center space-y-3">
            <FileText className="w-12 h-12 text-neutral-700 mx-auto stroke-[1.5]" />
            <h3 className="font-serif text-xl text-white">Nothing found for &ldquo;{trimmed}&rdquo;</h3>
            <p className="text-sm text-neutral-400 max-w-sm mx-auto">
              Try searching for a different destination, waypoint, or journal excerpt.
            </p>
          </div>
        )}

        {/* Results State */}
        {trimmed && results && totalCount > 0 && (
          <div className="space-y-10">
            {/* Filter Pills Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/[0.08] scrollbar-none">
              <Link
                href={`/search?q=${encodeURIComponent(trimmed)}&filter=ALL`}
                className={`px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeFilter === 'ALL'
                    ? 'bg-white text-black font-bold'
                    : 'bg-white/[0.04] text-neutral-400 hover:text-white border border-white/[0.08]'
                }`}
              >
                All Results ({totalCount})
              </Link>

              {journeysCount > 0 && (
                <Link
                  href={`/search?q=${encodeURIComponent(trimmed)}&filter=JOURNEYS`}
                  className={`px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
                    activeFilter === 'JOURNEYS'
                      ? 'bg-white text-black font-bold'
                      : 'bg-white/[0.04] text-neutral-400 hover:text-white border border-white/[0.08]'
                  }`}
                >
                  Journeys ({journeysCount})
                </Link>
              )}

              {placesCount > 0 && (
                <Link
                  href={`/search?q=${encodeURIComponent(trimmed)}&filter=PLACES`}
                  className={`px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
                    activeFilter === 'PLACES'
                      ? 'bg-white text-black font-bold'
                      : 'bg-white/[0.04] text-neutral-400 hover:text-white border border-white/[0.08]'
                  }`}
                >
                  Places ({placesCount})
                </Link>
              )}

              {storiesCount > 0 && (
                <Link
                  href={`/search?q=${encodeURIComponent(trimmed)}&filter=STORIES`}
                  className={`px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
                    activeFilter === 'STORIES'
                      ? 'bg-white text-black font-bold'
                      : 'bg-white/[0.04] text-neutral-400 hover:text-white border border-white/[0.08]'
                  }`}
                >
                  Stories ({storiesCount})
                </Link>
              )}

              {photoCount > 0 && (
                <Link
                  href={`/search?q=${encodeURIComponent(trimmed)}&filter=PHOTOGRAPHY`}
                  className={`px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
                    activeFilter === 'PHOTOGRAPHY'
                      ? 'bg-white text-black font-bold'
                      : 'bg-white/[0.04] text-neutral-400 hover:text-white border border-white/[0.08]'
                  }`}
                >
                  Photography ({photoCount})
                </Link>
              )}

              {filmCount > 0 && (
                <Link
                  href={`/search?q=${encodeURIComponent(trimmed)}&filter=FILMS`}
                  className={`px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
                    activeFilter === 'FILMS'
                      ? 'bg-white text-black font-bold'
                      : 'bg-white/[0.04] text-neutral-400 hover:text-white border border-white/[0.08]'
                  }`}
                >
                  Films ({filmCount})
                </Link>
              )}
            </div>

            {/* Journeys Group */}
            {showJourneys && journeysCount > 0 && (
              <section className="space-y-4">
                <h2 className="font-serif text-2xl text-white">Journeys</h2>
                <div className="space-y-3">
                  {results.journeys.map((trip) => (
                    <Link
                      key={trip.id}
                      href={`/journeys/${trip.slug}`}
                      className="group flex items-center justify-between p-4 rounded-xl bg-neutral-900/40 border border-white/[0.08] hover:border-white/20 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative w-20 h-14 rounded-lg overflow-hidden shrink-0 bg-neutral-900">
                          <ImageFrame
                            src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&auto=format&fit=crop&q=80"
                            alt={trip.title}
                            fill
                          />
                        </div>
                        <div>
                          <h3 className="font-serif text-lg text-white group-hover:text-amber-400 transition-colors">
                            {trip.title}
                          </h3>
                          {trip.description && (
                            <p className="text-xs text-neutral-400 line-clamp-1 mt-0.5">
                              {trip.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-white group-hover:translate-x-1 transition-transform shrink-0" />
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Places Group */}
            {showPlaces && placesCount > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-2xl text-white">Places</h2>
                  <Link href="/places" className="text-xs font-mono text-neutral-400 hover:text-white">
                    View directory →
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {results.places.map((place) => {
                    const cover =
                      PLACE_IMAGES[place.slug] ||
                      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&auto=format&fit=crop&q=80';
                    return (
                      <Link
                        key={place.id}
                        href={`/places/${place.slug}`}
                        className="group flex flex-col rounded-xl overflow-hidden bg-neutral-900/40 border border-white/[0.08] hover:border-white/20 transition-all p-3 space-y-2.5"
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
                          <h3 className="font-serif text-base text-white group-hover:text-amber-400 transition-colors">
                            {place.name}
                          </h3>
                          <p className="text-xs font-mono text-neutral-400 mt-0.5">
                            {place.state || place.country}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Stories Group */}
            {showStories && storiesCount > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-2xl text-white">Stories & Field Notes</h2>
                  <Link href="/stories" className="text-xs font-mono text-neutral-400 hover:text-white">
                    View all stories →
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {results.stories.map((story) => {
                    const cover =
                      STORY_IMAGES[story.id] ||
                      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&auto=format&fit=crop&q=80';
                    return (
                      <Link
                        key={story.id}
                        href={`/stories/${story.id}`}
                        className="group flex flex-col rounded-xl overflow-hidden bg-neutral-900/40 border border-white/[0.08] hover:border-white/20 transition-all p-3 space-y-2.5"
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
                          <h3 className="font-serif text-base text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                            {story.title}
                          </h3>
                          {story.description && (
                            <p className="text-xs text-neutral-400 line-clamp-2 mt-1">
                              {story.description}
                            </p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Photography Group */}
            {showPhotography && photoCount > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-2xl text-white">Photography</h2>
                  <Link href="/media" className="text-xs font-mono text-neutral-400 hover:text-white">
                    View archive →
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {results.photography.map((item) => (
                    <Link
                      key={item.id}
                      href="/media"
                      className="group flex flex-col rounded-xl overflow-hidden bg-neutral-900/40 border border-white/[0.08] hover:border-white/20 transition-all p-2.5 space-y-2"
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
                        <p className="font-serif text-xs sm:text-sm text-white group-hover:text-amber-400 transition-colors truncate">
                          {item.caption || item.filename}
                        </p>
                        <span className="text-[10px] font-mono text-neutral-500">
                          {item.taken_at ? new Date(item.taken_at).getFullYear() : 'Archive'}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Films Group */}
            {showFilms && filmCount > 0 && (
              <section className="space-y-4">
                <h2 className="font-serif text-2xl text-white">Films</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {results.films.map((item) => (
                    <Link
                      key={item.id}
                      href="/media"
                      className="group flex items-center gap-4 p-3 rounded-xl bg-neutral-900/40 border border-white/[0.08] hover:border-white/20 transition-all"
                    >
                      <div className="relative w-24 aspect-[16/10] rounded-lg overflow-hidden bg-neutral-900 shrink-0">
                        <ImageFrame
                          src={item.thumbnail_url || item.storage_url}
                          alt={item.caption || 'Film'}
                          fill
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Play className="w-5 h-5 text-white fill-white/80" />
                        </div>
                      </div>
                      <div className="truncate">
                        <h3 className="font-serif text-sm font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                          {item.caption || item.filename}
                        </h3>
                        <p className="text-xs font-mono text-neutral-400 mt-0.5">Expedition Footage</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
