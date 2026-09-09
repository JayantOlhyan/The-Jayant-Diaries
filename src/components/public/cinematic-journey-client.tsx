'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronDown,
  Calendar,
  MapPin,
  Camera,
  Film,
  Sparkles,
  BookOpen,
  Compass,
  ArrowRight,
  Maximize2,
} from 'lucide-react';
import { CinematicJourney, MediaRow } from '@/types/entities';
import { ImageLightbox } from '@/components/media/image-lightbox';
import { YouTubePreview } from '@/components/media/youtube-preview';
import { InstagramCard } from '@/components/media/instagram-card';
import { formatDate } from '@/lib/utils';
import { getNormalizedImageUrl, getImageAlt } from '@/lib/utils/image-provider';

interface CinematicJourneyClientProps {
  journey: CinematicJourney;
}

export function CinematicJourneyClient({ journey }: CinematicJourneyClientProps) {
  const router = useRouter();
  const { trip, statistics, days, coverMedia, closingMedia, nextTrip, previousTrip } = journey;

  // Lightbox state for photography
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<MediaRow[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Active chapter tracking
  const [activeChapter, setActiveChapter] = useState<string>('intro');

  const openLightbox = useCallback((images: MediaRow[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  // Keyboard navigation: Escape exits to the canonical trip overview
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !lightboxOpen) {
        router.push(`/journeys/${trip.slug}`);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [trip.slug, router, lightboxOpen]);

  // Track active chapter as user scrolls
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveChapter(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0,
      }
    );

    const sections = document.querySelectorAll('section[id]');
    sections.forEach((s) => observer.observe(s));

    return () => observer.disconnect();
  }, []);

  const fallbackCover =
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&auto=format&fit=crop&q=80';
  const coverUrl = coverMedia
    ? getNormalizedImageUrl(coverMedia.storage_url || coverMedia.thumbnail_url || '')
    : fallbackCover;
  const closingUrl = closingMedia
    ? getNormalizedImageUrl(closingMedia.storage_url || closingMedia.thumbnail_url || '')
    : coverUrl;

  const dateSpan =
    trip.start_date && trip.end_date
      ? `${formatDate(trip.start_date)} — ${formatDate(trip.end_date)}`
      : 'June 2026';

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      element.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }
  };


  return (
    <div className="relative min-h-screen bg-[#070809] text-neutral-100 selection:bg-amber-500/30 selection:text-amber-200">
      {/* 1. Floating Top Minimal Control Bar */}
      <header className="fixed top-0 inset-x-0 z-40 bg-[#070809]/80 backdrop-blur-md border-b border-white/[0.08] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            href={`/journeys/${trip.slug}`}
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Return to Overview</span>
          </Link>

          {/* Chapter Quick Selector */}
          <div className="hidden md:flex items-center gap-1 overflow-x-auto py-1 scrollbar-none max-w-xl text-[11px] font-mono">
            <button
              onClick={() => scrollToSection('intro')}
              className={`px-2.5 py-1 rounded-full transition-colors ${
                activeChapter === 'intro'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Intro
            </button>
            {days.map((day) => (
              <button
                key={day.id}
                onClick={() => scrollToSection(`day-${day.day_number}`)}
                className={`px-2.5 py-1 rounded-full transition-colors whitespace-nowrap ${
                  activeChapter === `day-${day.day_number}`
                    ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                0{day.day_number} {day.places[0]?.name ? `· ${day.places[0].name}` : ''}
              </button>
            ))}
            <button
              onClick={() => scrollToSection('reflection')}
              className={`px-2.5 py-1 rounded-full transition-colors ${
                activeChapter === 'reflection'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Reflection
            </button>
          </div>

          {/* Escape Hint */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
              Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-neutral-300">Esc</kbd> to exit
            </span>
            <Link
              href={`/journeys/${trip.slug}`}
              className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Close Cinematic Mode"
              aria-label="Close Cinematic Mode"
            >
              <span className="text-sm font-mono leading-none">&times;</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Intro Sequence (Hero & Story Prelude) */}
      <section
        id="intro"
        className="relative min-h-screen flex flex-col justify-between pt-24 pb-16 px-6 md:px-12 overflow-hidden"
      >
        {/* Full-bleed ambient cover image */}
        <div className="absolute inset-0 z-0">
          <Image
            src={coverUrl}
            alt={coverMedia ? getImageAlt(coverMedia) : trip.title}
            fill
            priority
            className="object-cover object-center scale-100"
          />
          {/* Cinematic Vignette Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#070809] via-[#070809]/60 to-[#070809]/80" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#070809]/90 via-transparent to-[#070809]" />
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#070809]/40 to-[#070809]/90" />
        </div>

        {/* Top Prelude Label */}
        <div className="relative z-10 max-w-5xl mx-auto w-full pt-12 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono uppercase tracking-[0.3em]">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Cinematic Journey Mode
          </span>
        </div>

        {/* Center Narrative Core */}
        <div className="relative z-10 max-w-4xl mx-auto w-full text-center space-y-6 my-auto py-12">
          <h1 className="font-serif text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight text-white leading-none">
            {trip.title}
          </h1>

          <p className="font-serif text-xl sm:text-2xl md:text-3xl text-neutral-300 italic max-w-3xl mx-auto leading-relaxed">
            &ldquo;{trip.description?.split('.')[0] || 'A sacred expedition into the high Himalayas.'}&rdquo;
          </p>

          <div className="flex items-center justify-center gap-2 text-xs font-mono text-amber-300/80">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>{dateSpan}</span>
          </div>

          <p className="text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto font-sans leading-relaxed pt-2">
            {trip.description ||
              'High passes, ancient monasteries, endless skies and a land that humbles you. Experience the journey chronologically, day by day.'}
          </p>

          {/* Restrained Journey Statistics Bar */}
          <div className="pt-10 max-w-2xl mx-auto grid grid-cols-5 gap-3 border-y border-white/10 py-4 font-mono text-center">
            <div>
              <span className="block text-xl sm:text-2xl font-bold text-white">{statistics.daysCount}</span>
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Days</span>
            </div>
            <div>
              <span className="block text-xl sm:text-2xl font-bold text-white">{statistics.placesCount}</span>
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Places</span>
            </div>
            <div>
              <span className="block text-xl sm:text-2xl font-bold text-white">{statistics.memoriesCount}</span>
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Memories</span>
            </div>
            <div>
              <span className="block text-xl sm:text-2xl font-bold text-white">{statistics.photosCount}</span>
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Photos</span>
            </div>
            <div>
              <span className="block text-xl sm:text-2xl font-bold text-white">{statistics.videosCount}</span>
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Videos</span>
            </div>
          </div>
        </div>

        {/* Bottom Cue to Scroll */}
        <div className="relative z-10 text-center">
          <button
            onClick={() => scrollToSection(days.length > 0 ? `day-${days[0].day_number}` : 'reflection')}
            className="inline-flex flex-col items-center gap-2 text-neutral-400 hover:text-white transition-colors group cursor-pointer"
          >
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-400 group-hover:text-amber-300 transition-colors">
              Begin the Chronological Story
            </span>
            <ChevronDown className="w-4 h-4 text-amber-400 animate-bounce motion-reduce:animate-none" />
          </button>
        </div>
      </section>

      {/* 3. Chronological Day Chapters */}
      <main className="max-w-5xl mx-auto px-6 py-12 space-y-36">
        {days.length === 0 ? (
          <div className="py-24 text-center space-y-3">
            <p className="font-serif text-xl text-neutral-400 italic">
              This journey has no recorded days yet.
            </p>
          </div>
        ) : (
          days.map((day, dIdx) => {
          return (
            <section
              key={day.id}
              id={`day-${day.day_number}`}
              className="relative scroll-mt-20 space-y-12 pt-6"
            >
              {/* Background Watermark Day Numeral */}
              <div
                aria-hidden="true"
                className="absolute -top-14 right-0 sm:right-6 font-serif text-[120px] sm:text-[180px] font-bold text-white/[0.03] select-none pointer-events-none leading-none z-0"
              >
                0{day.day_number}
              </div>

              {/* Chapter Header */}
              <div className="relative z-10 space-y-3 border-b border-white/[0.08] pb-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-amber-400 font-semibold">
                    Chapter 0{day.day_number}
                  </span>
                  <span className="text-neutral-600">&bull;</span>
                  <span className="text-xs font-mono text-neutral-400">
                    {formatDate(day.date)}
                  </span>
                </div>

                <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white tracking-tight">
                  {day.title}
                </h2>

                {day.description && (
                  <p className="text-base sm:text-lg text-neutral-300 font-serif italic max-w-2xl">
                    {day.description}
                  </p>
                )}

                {/* Visited Waypoints / Places for this Day */}
                {day.places.length > 0 && (
                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 mr-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-400/70" />
                      Waypoints:
                    </span>
                    {day.places.map((place) => (
                      <span
                        key={place.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-neutral-300 hover:text-white hover:border-amber-400/30 transition-colors"
                      >
                        <span>{place.name}</span>
                        {(place.city || place.state) && (
                          <span className="text-[10px] text-amber-400/80">({place.city || place.state})</span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Day Journal / Editorial Story */}
              {day.journal && (
                <div className="relative z-10 bg-white/[0.02] border border-white/[0.07] rounded-2xl p-6 sm:p-10 shadow-2xl backdrop-blur-sm space-y-4">
                  <div className="flex items-center gap-2 text-xs font-mono text-amber-400/90 uppercase tracking-widest border-b border-white/5 pb-3">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Field Journal &mdash; Day 0{day.day_number}</span>
                  </div>
                  <div className="font-serif text-base sm:text-lg text-neutral-200 leading-relaxed sm:leading-loose whitespace-pre-line space-y-4">
                    {day.journal}
                  </div>
                </div>
              )}

              {/* Day Specific Memories / Stories */}
              {day.memories.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-400">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Moments &amp; Notes</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {day.memories.map((mem) => {
                      const placeName =
                        day.places.find((p) => p.id === mem.place_id)?.name ||
                        (day.places[0] ? `${day.places[0].name}, ${day.places[0].country || 'Ladakh'}` : null);
                      return (
                        <div
                          key={mem.id}
                          className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/10 transition-colors space-y-2"
                        >
                          {mem.title && (
                            <h4 className="font-serif text-base font-semibold text-white uppercase tracking-wide">
                              {mem.title}
                            </h4>
                          )}
                          {(mem.date || placeName) && (
                            <div className="text-[11px] font-mono text-amber-400/80">
                              {mem.date && formatDate(mem.date)}
                              {mem.date && placeName && ' \u2022 '}
                              {placeName}
                            </div>
                          )}
                          <p className="text-sm text-neutral-300 font-serif leading-relaxed">
                            {mem.description || mem.journal}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Day Photography Gallery (Editorial Composition) */}
              {day.photos.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-neutral-400">
                    <span className="flex items-center gap-2">
                      <Camera className="w-3.5 h-3.5 text-amber-400" />
                      Visual Archive ({day.photos.length} Photographs)
                    </span>
                    <span className="text-[10px] text-neutral-500">Click to expand</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {day.photos.map((photo, pIdx) => {
                      const photoUrl = getNormalizedImageUrl(photo.storage_url || photo.thumbnail_url || '');
                      const isHero = pIdx === 0 && day.photos.length > 1;
                      return (
                        <div
                          key={photo.id}
                          onClick={() => openLightbox(day.photos, pIdx)}
                          className={`group relative rounded-xl overflow-hidden bg-neutral-900 border border-white/10 hover:border-amber-400/40 cursor-pointer transition-all duration-300 ${
                            isHero ? 'sm:col-span-2 aspect-[16/9]' : 'aspect-[4/3]'
                          }`}
                        >
                          <Image
                            src={photoUrl}
                            alt={getImageAlt(photo)}
                            fill
                            className="object-cover group-hover:scale-105 motion-reduce:group-hover:scale-100 transition-transform duration-500 motion-reduce:transition-none"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                            <p className="text-xs text-white font-medium line-clamp-2">
                              {photo.caption || photo.filename}
                            </p>
                            <span className="text-[10px] font-mono text-amber-300/80 mt-1 flex items-center gap-1">
                              <Maximize2 className="w-3 h-3" />
                              View High-Res
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Day Films / Video Moments */}
              {day.videos.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-400">
                    <Film className="w-3.5 h-3.5 text-amber-400" />
                    <span>Moving Picture &mdash; Day 0{day.day_number}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {day.videos.map((vid) => (
                      <div key={vid.id} className="rounded-xl overflow-hidden border border-white/10">
                        <YouTubePreview
                          media={vid}
                          title={vid.caption || `Ladakh Expedition — Day 0${day.day_number}`}
                          caption={vid.caption || undefined}
                          autoplay={false}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Day Instagram Road Dispatches */}
              {day.instagram.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-400">
                    <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                    <span>Road Dispatches</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {day.instagram.map((ig) => (
                      <InstagramCard key={ig.id} media={ig} showCaption={true} />
                    ))}
                  </div>
                </div>
              )}

              {/* Intra-day Navigation: Previous / Next Day */}
              <div className="pt-8 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-neutral-400">
                {dIdx > 0 ? (
                  <button
                    type="button"
                    onClick={() => scrollToSection(`day-${days[dIdx - 1].day_number}`)}
                    className="inline-flex items-center gap-2 hover:text-amber-300 transition-colors group cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform motion-reduce:transition-none" />
                    <span>Day 0{days[dIdx - 1].day_number} &bull; {days[dIdx - 1].title}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => scrollToSection('intro')}
                    className="inline-flex items-center gap-2 hover:text-amber-300 transition-colors group cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform motion-reduce:transition-none" />
                    <span>Intro</span>
                  </button>
                )}

                <div className="hidden sm:block text-[10px] text-neutral-500 uppercase tracking-widest">
                  Day 0{day.day_number} of 0{days.length}
                </div>

                {dIdx < days.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => scrollToSection(`day-${days[dIdx + 1].day_number}`)}
                    className="inline-flex items-center gap-2 hover:text-amber-300 transition-colors group cursor-pointer text-right ml-auto sm:ml-0"
                  >
                    <span>Day 0{days[dIdx + 1].day_number} &bull; {days[dIdx + 1].title}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform motion-reduce:transition-none" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => scrollToSection('reflection')}
                    className="inline-flex items-center gap-2 hover:text-amber-300 transition-colors group cursor-pointer text-right ml-auto sm:ml-0"
                  >
                    <span>Closing Reflection</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform motion-reduce:transition-none" />
                  </button>
                )}
              </div>
            </section>
          );
        })
      )}
      </main>

      {/* 4. Closing Reflection & Departure */}
      <section
        id="reflection"
        className="relative border-t border-white/[0.08] min-h-[80vh] flex flex-col justify-between py-24 px-6 md:px-12 overflow-hidden bg-neutral-950"
      >
        <div className="absolute inset-0 z-0">
          <Image
            src={closingUrl}
            alt="Closing horizon"
            fill
            className="object-cover object-center scale-100 opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070809] via-[#070809]/80 to-transparent" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-8 my-auto">
          <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-amber-400 font-semibold">
            Closing Reflection
          </span>

          <blockquote className="font-serif text-2xl sm:text-4xl text-neutral-200 italic leading-relaxed">
            &ldquo;The world feels different when you slow down.&rdquo;
          </blockquote>

          <p className="text-xs font-mono uppercase tracking-[0.25em] text-amber-400 font-semibold">
            &mdash; Jayant
          </p>

          <div className="space-y-2">
            <p className="font-sans text-sm text-neutral-400">
              The Jayant Diaries &bull; Expedition Archive
            </p>
            <p className="text-xs font-mono text-neutral-500">
              Recorded in the high Himalaya &bull; {statistics.daysCount} Days &bull; {statistics.placesCount} Waypoints &bull; {statistics.photosCount} Photographs
            </p>
          </div>

          <div className="pt-6 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={`/journeys/${trip.slug}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-amber-500 text-black font-mono text-xs uppercase tracking-wider font-semibold hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/10"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Journey Overview</span>
            </Link>

            <Link
              href="/journeys"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 text-white font-mono text-xs uppercase tracking-wider border border-white/10 hover:border-white/20 transition-colors"
            >
              <span>Explore All Journeys</span>
              <Compass className="w-3.5 h-3.5 text-neutral-400" />
            </Link>
          </div>
        </div>

        {/* Next / Previous Journey Navigation */}
        <div className="relative z-10 max-w-5xl mx-auto w-full pt-16 border-t border-white/10 flex items-center justify-between text-xs font-mono">
          {previousTrip ? (
            <Link
              href={`/journeys/${previousTrip.slug}/cinematic`}
              className="group flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400 group-hover:-translate-x-1 transition-transform" />
              <div className="text-left">
                <span className="block text-[10px] uppercase text-neutral-500">Previous Journey</span>
                <span className="font-medium text-neutral-200 group-hover:text-white">{previousTrip.title}</span>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {nextTrip ? (
            <Link
              href={`/journeys/${nextTrip.slug}/cinematic`}
              className="group flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-right"
            >
              <div className="text-right">
                <span className="block text-[10px] uppercase text-neutral-500">Next Journey</span>
                <span className="font-medium text-neutral-200 group-hover:text-white">{nextTrip.title}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <div />
          )}
        </div>
      </section>

      {/* Photography Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={(newIdx) => setLightboxIndex(newIdx)}
      />
    </div>
  );
}
