import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Calendar,
  MapPin,
  Compass,
  Sparkles,
  BookOpen,
  Camera,
  Film,
  Globe,
} from 'lucide-react';
import { PublicEditorialRepository } from '@/server/repositories/public-editorial-repository';
import { getNormalizedImageUrl, getImageAlt } from '@/lib/utils/image-provider';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'The Jayant Diaries — A Personal Travel Archive',
  description:
    'A personal digital travel archive transforming scattered photographs, videos, journals, places, and memories into structured cinematic journeys.',
};

export default async function HomePage() {
  const data = await PublicEditorialRepository.getHomepageData();

  const {
    featuredJourney,
    featuredStory,
    recentStories,
    recentMemories,
    featuredPlaces,
    snapshot,
    heroMedia,
  } = data;

  const heroImageUrl = heroMedia
    ? getNormalizedImageUrl(heroMedia.storage_url || heroMedia.thumbnail_url || '')
    : null;

  const featuredTripCoverUrl = featuredJourney?.cover_media
    ? getNormalizedImageUrl(
        featuredJourney.cover_media.storage_url || featuredJourney.cover_media.thumbnail_url || ''
      )
    : null;

  const featuredTripDateSpan =
    featuredJourney?.start_date && featuredJourney?.end_date
      ? `${formatDate(featuredJourney.start_date)} — ${formatDate(featuredJourney.end_date)}`
      : featuredJourney?.start_date
      ? formatDate(featuredJourney.start_date)
      : null;

  return (
    <div className="space-y-24 sm:space-y-32 pb-32 bg-cinema-black text-white selection:bg-cinema-accent selection:text-white">
      {/* 1. Full-Bleed Cinematic Editorial Hero */}
      <section className="relative w-full h-[85vh] min-h-[600px] max-h-[920px] flex flex-col justify-between overflow-hidden bg-neutral-950">
        {/* Full-width Photography Background */}
        <div className="absolute inset-0 bg-neutral-950">
          {heroImageUrl ? (
            <Image
              src={heroImageUrl}
              alt="The Jayant Diaries — Travel Archive"
              fill
              priority
              className="object-cover object-center scale-[1.02] transition-transform duration-1000 opacity-60"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-neutral-900 via-neutral-950 to-[#0B0D0E]" />
          )}
          {/* Subtle vignette and contrast gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D0E] via-[#0B0D0E]/50 to-black/30" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(11,13,14,0.7)_100%)]" />
        </div>

        <div className="relative z-10" />

        {/* Center Editorial Typography */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 w-full text-center space-y-6">
          <div className="space-y-3">
            <span className="text-[11px] font-mono tracking-[0.3em] text-amber-400 uppercase drop-shadow-sm font-semibold">
              A Personal Digital Travel Archive
            </span>
            <h1 className="font-serif text-5xl sm:text-7xl md:text-8xl font-normal tracking-tight text-white leading-tight">
              The Jayant Diaries
            </h1>
          </div>

          <p className="font-serif text-xl sm:text-2xl md:text-3xl text-neutral-300 italic max-w-2xl mx-auto font-light leading-relaxed">
            &ldquo;Travel, remembered. Transforming moments into lasting stories.&rdquo;
          </p>

          <div className="pt-6 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/journeys"
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-white text-neutral-950 hover:bg-neutral-200 text-xs font-mono uppercase tracking-[0.2em] font-semibold transition-all shadow-xl hover:scale-105"
            >
              <span>Explore Journeys</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/stories"
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-mono uppercase tracking-[0.2em] font-medium transition-all backdrop-blur-md"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Read Stories</span>
            </Link>
          </div>
        </div>

        {/* Bottom Cue Bar */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 pb-8 w-full flex items-center justify-between text-xs font-mono text-neutral-400 border-t border-white/10 pt-4">
          <span className="uppercase tracking-widest text-[10px] text-amber-400">
            Archive Vol. I — IV
          </span>
          <span className="hidden sm:inline text-neutral-500 font-serif italic text-xs">
            Leh • Nubra • Pangong • Manali
          </span>
          <Link
            href="/map"
            className="hover:text-white transition-colors flex items-center gap-1 text-[11px] uppercase tracking-wider"
          >
            <span>Interactive Map</span>
            <span>&rarr;</span>
          </Link>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-6 sm:px-10 space-y-28">
        {/* 2. Featured Journey Section (If exists) */}
        {featuredJourney && (
          <section className="space-y-8">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-amber-400" />
                <span className="text-[11px] font-semibold tracking-[0.25em] text-amber-400 uppercase font-mono">
                  Featured Journey
                </span>
              </div>
              <Link
                href="/journeys"
                className="text-xs font-mono text-neutral-400 hover:text-white transition-colors flex items-center gap-1"
              >
                <span>View All Journeys</span>
                <span>&rarr;</span>
              </Link>
            </div>

            <div className="relative rounded-2xl border border-white/[0.08] bg-neutral-900/40 overflow-hidden shadow-2xl group transition-all hover:border-amber-500/30">
              <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
                <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between space-y-6 z-10">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-amber-400 uppercase tracking-wider">
                      {featuredTripDateSpan && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" /> {featuredTripDateSpan}
                        </span>
                      )}
                      <span>•</span>
                      <span>{featuredJourney.days?.length || 0} Days</span>
                      <span>•</span>
                      <span>{featuredJourney.media_count || 0} Media Assets</span>
                    </div>

                    <h2 className="font-serif text-3xl sm:text-5xl font-light text-white group-hover:text-amber-300 transition-colors leading-tight">
                      {featuredJourney.title}
                    </h2>

                    {featuredJourney.description && (
                      <p className="text-sm sm:text-base text-neutral-300 font-light leading-relaxed line-clamp-3">
                        {featuredJourney.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-6 border-t border-white/[0.08] flex flex-wrap items-center gap-4">
                    <Link
                      href={`/journeys/${featuredJourney.slug}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-neutral-900 font-mono text-xs uppercase tracking-wider font-semibold hover:bg-amber-300 transition-all shadow-md"
                    >
                      <span>Explore Journey</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>

                    <Link
                      href={`/journeys/${featuredJourney.slug}/cinematic`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono text-xs uppercase tracking-wider hover:bg-amber-500/20 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Experience Cinematically</span>
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-5 relative min-h-[280px] lg:min-h-full bg-neutral-950 overflow-hidden">
                  {featuredTripCoverUrl ? (
                    <Image
                      src={featuredTripCoverUrl}
                      alt={featuredJourney.title}
                      fill
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-90"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-600 font-mono text-xs">
                      [ Featured Cover Photography ]
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent lg:bg-gradient-to-r lg:from-neutral-950 lg:via-transparent lg:to-transparent" />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 3. Editorial Stories Section */}
        {(featuredStory || recentStories.length > 0) && (
          <section className="space-y-8">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-amber-400" />
                <span className="text-[11px] font-semibold tracking-[0.25em] text-amber-400 uppercase font-mono">
                  Editorial Stories
                </span>
              </div>
              <Link
                href="/stories"
                className="text-xs font-mono text-neutral-400 hover:text-white transition-colors flex items-center gap-1"
              >
                <span>View All Stories</span>
                <span>&rarr;</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Featured Story Hero Card (7 cols) */}
              {featuredStory && (
                <div className="lg:col-span-7">
                  <Link
                    href={`/stories/${featuredStory.slug}`}
                    className="group block relative rounded-2xl border border-white/[0.08] bg-neutral-900/40 overflow-hidden h-full p-8 flex flex-col justify-between space-y-6 hover:border-amber-500/40 transition-all shadow-xl"
                  >
                    <div className="space-y-4">
                      {featuredStory.coverMedia?.storage_path && (
                        <div className="w-full h-64 sm:h-72 rounded-xl overflow-hidden bg-neutral-950 mb-4">
                          <img
                            src={`/api/media/${featuredStory.coverMedia.id}`}
                            alt={featuredStory.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-widest">
                        <span>{featuredStory.trip?.title || 'Journey Story'}</span>
                        {featuredStory.published_at && (
                          <span>• {new Date(featuredStory.published_at).getFullYear()}</span>
                        )}
                      </div>

                      <h3 className="font-serif text-2xl sm:text-4xl text-white group-hover:text-amber-300 transition-colors font-light leading-tight">
                        {featuredStory.title}
                      </h3>

                      {featuredStory.subtitle && (
                        <p className="text-sm text-neutral-300 font-serif italic line-clamp-2 leading-relaxed">
                          {featuredStory.subtitle}
                        </p>
                      )}
                    </div>

                    <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-amber-400">
                      <span>Read Full Story</span>
                      <span>&rarr;</span>
                    </div>
                  </Link>
                </div>
              )}

              {/* Recent Stories Vertical Rail (5 cols) */}
              <div className={`${featuredStory ? 'lg:col-span-5' : 'lg:col-span-12'} space-y-4`}>
                {recentStories
                  .filter((s) => s.id !== featuredStory?.id)
                  .slice(0, 3)
                  .map((story) => (
                    <Link
                      key={story.id}
                      href={`/stories/${story.slug}`}
                      className="group block p-6 rounded-xl border border-white/[0.08] bg-neutral-900/30 hover:border-amber-500/30 transition-all space-y-2"
                    >
                      <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block">
                        {story.trip?.title || 'Editorial'}
                      </span>
                      <h4 className="font-serif text-lg text-white group-hover:text-amber-300 transition-colors">
                        {story.title}
                      </h4>
                      {story.subtitle && (
                        <p className="text-xs text-neutral-400 line-clamp-2 font-serif italic">
                          {story.subtitle}
                        </p>
                      )}
                    </Link>
                  ))}
              </div>
            </div>
          </section>
        )}

        {/* 4. Recent Memories Highlights */}
        {recentMemories.length > 0 && (
          <section className="space-y-8">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-amber-400" />
                <span className="text-[11px] font-semibold tracking-[0.25em] text-amber-400 uppercase font-mono">
                  Archived Memories
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentMemories.map((mem) => (
                <div
                  key={mem.id}
                  className="p-6 rounded-xl border border-white/[0.08] bg-neutral-900/30 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                      <span>
                        {mem.date
                          ? new Date(mem.date).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'Memory Record'}
                      </span>
                      {mem.featured && (
                        <span className="text-amber-400 uppercase font-bold">Featured</span>
                      )}
                    </div>

                    <h4 className="font-serif text-xl text-white font-normal">{mem.title}</h4>

                    {mem.journal && (
                      <p className="text-xs text-neutral-300 font-serif italic line-clamp-3 leading-relaxed">
                        &ldquo;{mem.journal}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 5. Featured Places Directory */}
        {featuredPlaces.length > 0 && (
          <section className="space-y-8">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-amber-400" />
                <span className="text-[11px] font-semibold tracking-[0.25em] text-amber-400 uppercase font-mono">
                  Featured Destinations
                </span>
              </div>
              <Link
                href="/places"
                className="text-xs font-mono text-neutral-400 hover:text-white transition-colors flex items-center gap-1"
              >
                <span>View All Places</span>
                <span>&rarr;</span>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {featuredPlaces.map((place) => (
                <Link
                  key={place.id}
                  href={`/places/${place.slug}`}
                  className="group p-5 rounded-xl border border-white/[0.08] bg-neutral-900/40 hover:border-emerald-500/40 transition-all space-y-2 block"
                >
                  <div className="flex items-center gap-2 text-emerald-400">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                      {place.country || 'Location'}
                    </span>
                  </div>

                  <h4 className="font-serif text-lg text-white group-hover:text-emerald-300 transition-colors">
                    {place.name}
                  </h4>

                  <p className="text-[11px] font-mono text-neutral-500 truncate">
                    {[place.city, place.state].filter(Boolean).join(', ')}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 6. Deterministic Archive Snapshot Counter */}
        <section className="rounded-2xl border border-white/[0.08] bg-gradient-to-r from-neutral-900/80 via-neutral-900/40 to-neutral-900/80 p-8 sm:p-12 space-y-6 text-center">
          <div className="space-y-2">
            <span className="text-[11px] font-mono tracking-[0.25em] text-amber-400 uppercase font-semibold">
              The Personal Travel Archive
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl text-white font-light">
              Deterministic Record Count
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 max-w-4xl mx-auto pt-4 border-t border-white/[0.08] font-mono">
            <div>
              <span className="block text-3xl sm:text-4xl font-bold text-white">
                {snapshot.journeysCount}
              </span>
              <span className="text-[10px] text-neutral-400 uppercase tracking-widest">
                Journeys
              </span>
            </div>
            <div>
              <span className="block text-3xl sm:text-4xl font-bold text-white">
                {snapshot.placesCount}
              </span>
              <span className="text-[10px] text-neutral-400 uppercase tracking-widest">
                Places
              </span>
            </div>
            <div>
              <span className="block text-3xl sm:text-4xl font-bold text-white">
                {snapshot.memoriesCount}
              </span>
              <span className="text-[10px] text-neutral-400 uppercase tracking-widest">
                Memories
              </span>
            </div>
            <div>
              <span className="block text-3xl sm:text-4xl font-bold text-white">
                {snapshot.mediaCount}
              </span>
              <span className="text-[10px] text-neutral-400 uppercase tracking-widest">
                Media Assets
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="block text-3xl sm:text-4xl font-bold text-amber-400">
                {snapshot.storiesCount}
              </span>
              <span className="text-[10px] text-neutral-400 uppercase tracking-widest">
                Stories
              </span>
            </div>
          </div>
        </section>

        {/* 7. Interactive Map Exploration CTA */}
        <section className="rounded-2xl border border-white/[0.08] bg-neutral-900/30 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-amber-400 text-xs font-mono uppercase tracking-widest">
              <Compass className="w-4 h-4" />
              <span>Geographic Exploration</span>
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl text-white font-light">
              Explore the Interactive Atlas
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-lg font-light">
              Visualize coordinates, journey routes, and place associations on an interactive map.
            </p>
          </div>

          <Link
            href="/map"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 font-mono text-xs uppercase tracking-wider transition-all shrink-0"
          >
            <Globe className="w-4 h-4" />
            <span>Open Interactive Map &rarr;</span>
          </Link>
        </section>
      </div>
    </div>
  );
}
