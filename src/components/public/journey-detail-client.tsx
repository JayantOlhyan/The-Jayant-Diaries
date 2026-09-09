'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Camera,
  Film,
  Compass,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { TripWithDetails, PlaceRow, DayWithDetails, MemoryRow, MediaRow } from '@/types/entities';
import { ImageFrame } from '@/components/ui/image-frame';
import { ImageGallery } from '@/components/media/image-gallery';
import { YouTubePreview } from '@/components/media/youtube-preview';
import { InstagramCard } from '@/components/media/instagram-card';
import { formatDate } from '@/lib/utils';
import { getNormalizedImageUrl, getImageAlt } from '@/lib/utils/image-provider';

interface JourneyDetailClientProps {
  trip: TripWithDetails;
}

type TabKey = 'overview' | 'days' | 'places' | 'media';

export function JourneyDetailClient({ trip }: JourneyDetailClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // Filter public media strictly (Zero Private Data Leakage)
  const publicMedia = (trip.media || []).filter((m) => m.visibility === 'PUBLIC');
  const photos = publicMedia.filter((m) => m.type === 'PHOTO' && !m.filename.startsWith('instagram-'));
  const videos = publicMedia.filter((m) => m.type === 'VIDEO' || m.storage_path?.startsWith('youtube/'));
  const reels = publicMedia.filter((m) => m.type === 'REEL' || m.filename.startsWith('instagram-'));

  const days: DayWithDetails[] = trip.days || [];
  const places: PlaceRow[] = trip.places || [];

  const coverUrl = trip.cover_media
    ? getNormalizedImageUrl(trip.cover_media.storage_url || trip.cover_media.thumbnail_url || '')
    : null;

  const dateSpan =
    trip.start_date && trip.end_date
      ? `${formatDate(trip.start_date)} — ${formatDate(trip.end_date)}`
      : trip.start_date
        ? formatDate(trip.start_date)
        : trip.end_date
          ? formatDate(trip.end_date)
          : null;

  return (
    <div className="space-y-12 pb-24">
      {/* 1. Full-Width Cinematic Hero Banner (Matches Reference Spec) */}
      <div className="relative w-full h-[65vh] min-h-[480px] max-h-[750px] bg-neutral-950 flex flex-col justify-between overflow-hidden">
        {/* Cover Photo */}
        <div className="absolute inset-0">
          {coverUrl && (
            <Image
              src={coverUrl}
              alt={trip.cover_media ? getImageAlt(trip.cover_media) : trip.title}
              fill
              priority
              className="object-cover object-center scale-[1.02]"
            />
          )}
          {/* Subtle gradient vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D0E] via-[#0B0D0E]/50 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B0D0E]/80 via-transparent to-transparent" />
        </div>

        {/* Back Link at Top */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-8 w-full">
          <Link
            href="/journeys"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-400 hover:text-white transition-colors p-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Journeys
          </Link>
        </div>

        {/* Hero Narrative Text */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 pb-8 w-full space-y-4">
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-amber-400 font-semibold">
              Journey
            </span>
            <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-tight">
              {trip.title}
            </h1>
            {trip.description && (
              <p className="font-serif text-xl sm:text-2xl text-neutral-200 italic">
                {trip.description.split('.')[0]}
              </p>
            )}
          </div>

          {dateSpan && (
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>{dateSpan}</span>
            </div>
          )}

          {trip.description && (
            <p className="text-sm text-neutral-300 max-w-2xl leading-relaxed font-sans pt-1">
              {trip.description}
            </p>
          )}

          {/* Facts Row & Cinematic Journey CTA */}
          <div className="pt-4 flex flex-wrap items-center justify-between gap-6 border-t border-white/10 text-xs font-mono text-neutral-400">
            <div className="flex flex-wrap items-center gap-6 sm:gap-10">
              <div>
                <span className="block text-base font-bold text-white">
                  {days.length}
                </span>
                <span className="text-[10px] uppercase tracking-wider">Days</span>
              </div>
              <div>
                <span className="block text-base font-bold text-white">
                  {places.length}
                </span>
                <span className="text-[10px] uppercase tracking-wider">Places</span>
              </div>
              <div>
                <span className="block text-base font-bold text-white">
                  {trip.memories?.length ?? 0}
                </span>
                <span className="text-[10px] uppercase tracking-wider">Memories</span>
              </div>
              <div>
                <span className="block text-base font-bold text-white">
                  {photos.length}
                </span>
                <span className="text-[10px] uppercase tracking-wider">Photos</span>
              </div>
              <div>
                <span className="block text-base font-bold text-white">
                  {videos.length}
                </span>
                <span className="text-[10px] uppercase tracking-wider">Videos</span>
              </div>
            </div>

            <Link
              href={`/journeys/${trip.slug}/cinematic`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/30 hover:border-amber-400/50 text-[11px] font-mono uppercase tracking-[0.2em] transition-all group shadow-sm hover:shadow-amber-500/10"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Experience the Journey</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Sub-Navigation Tabs Bar */}
      <div className="sticky top-[65px] z-30 bg-[#0B0D0E]/90 backdrop-blur-md border-y border-white/[0.08]">
        <div className="max-w-5xl mx-auto px-6 flex items-center space-x-8 text-xs font-mono uppercase tracking-wider">
          {(['overview', 'days', 'places', 'media'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`py-3.5 transition-colors relative ${
                activeTab === tab
                  ? 'text-white font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {tab === 'overview'
                ? 'Overview'
                : tab === 'days'
                ? `Days (${days.length})`
                : tab === 'places'
                ? `Places (${places.length})`
                : `Media (${publicMedia.length})`}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Tab Content Panels */}
      <div className="max-w-5xl mx-auto px-6 space-y-16">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-12">
            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-bold text-white">
                Expedition Synopsis
              </h2>
              <p className="text-sm text-neutral-300 leading-relaxed font-sans max-w-3xl">
                {trip.description || 'No synopsis recorded for this journey.'}
              </p>
            </div>

            {/* Quote Box */}
            <div className="p-8 rounded-2xl bg-neutral-900/40 border border-white/[0.08] text-center space-y-2">
              <p className="font-serif italic text-lg sm:text-xl text-neutral-200">
                &ldquo;Not just places on a map, but moments that made me.&rdquo;
              </p>
              <p className="text-xs font-mono text-amber-400">
                &mdash; Jayant Olhyan
              </p>
            </div>

            {/* Quick Preview of Photography */}
            {photos.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <h3 className="font-serif text-xl font-bold text-white">
                    Selected Photography
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('media')}
                    className="text-xs font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1"
                  >
                    View All Media &rarr;
                  </button>
                </div>
                <ImageGallery images={photos.slice(0, 4)} />
              </div>
            )}
          </div>
        )}

        {/* DAYS TAB (Chronological Day-by-Day Route Narrative) */}
        {activeTab === 'days' && (
          <div className="space-y-12">
            <div className="border-b border-white/[0.08] pb-4">
              <h2 className="font-serif text-3xl font-bold text-white">
                Chronological Travel Logs
              </h2>
              <p className="text-xs text-neutral-400 font-sans mt-1">
                Day-by-day route notes, journal excerpts, and photographs.
              </p>
            </div>

            <div className="space-y-12">
              {days.map((day) => (
                <div
                  key={day.id}
                  className="rounded-2xl border border-white/[0.08] bg-neutral-900/30 p-6 sm:p-8 space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-white/5 pb-4">
                    <div className="space-y-1">
                      <span className="text-xs font-mono text-amber-400 uppercase tracking-widest font-semibold">
                        Day {String(day.day_number).padStart(2, '0')}
                      </span>
                      <h3 className="font-serif text-2xl font-bold text-white">
                        {day.title}
                      </h3>
                    </div>

                    <span className="text-xs font-mono text-neutral-400">
                      {formatDate(day.date)}
                    </span>
                  </div>

                  {/* Route Description */}
                  {day.description && (
                    <p className="text-sm text-neutral-300 leading-relaxed font-sans">
                      {day.description}
                    </p>
                  )}

                  {/* Journal Prose */}
                  {day.journal && (
                    <div className="pl-4 border-l-2 border-amber-500/60 font-serif italic text-sm text-neutral-200 leading-relaxed">
                      &ldquo;{day.journal}&rdquo;
                    </div>
                  )}

                  {/* Places Visited on this Day */}
                  {day.places && day.places.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[10px] font-mono text-neutral-400 uppercase">
                        Visited:
                      </span>
                      {day.places.map((place) => (
                        <span
                          key={place.id}
                          className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded bg-white/[0.04] border border-white/10 text-neutral-300"
                        >
                          <MapPin className="w-3 h-3 text-amber-400" />
                          {place.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Day Photography */}
                  {day.media && day.media.length > 0 && (
                    <div className="pt-2">
                      <ImageGallery images={day.media} showLayoutToggle={false} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PLACES TAB */}
        {activeTab === 'places' && (
          <div className="space-y-8">
            <div className="border-b border-white/[0.08] pb-4">
              <h2 className="font-serif text-3xl font-bold text-white">
                Places Visited ({places.length})
              </h2>
              <p className="text-xs text-neutral-400 font-sans mt-1">
                Mountain passes, high-altitude lakes, and settlements.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {places.map((place) => (
                <div
                  key={place.id}
                  className="rounded-xl border border-white/[0.08] bg-neutral-900/40 p-6 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-white">
                        {place.name}
                      </h3>
                      <p className="text-xs font-mono text-neutral-400">
                        {place.state || place.country}
                      </p>
                    </div>

                    {place.latitude && place.longitude && (
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                        {place.latitude.toFixed(2)}° N, {place.longitude.toFixed(2)}° E
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                    {place.description || 'Himalayan destination documented during the expedition.'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MEDIA TAB (Full Photo Gallery, YouTube Cinema, Instagram Dispatches) */}
        {activeTab === 'media' && (
          <div className="space-y-14">
            {/* Photography Gallery */}
            {photos.length > 0 && (
              <div className="space-y-4">
                <div className="border-b border-white/[0.08] pb-3 flex items-center justify-between">
                  <h3 className="font-serif text-xl font-bold text-white">
                    Photography ({photos.length})
                  </h3>
                  <span className="text-xs font-mono text-neutral-400">
                    Click to open high-res lightbox
                  </span>
                </div>
                <ImageGallery images={photos} />
              </div>
            )}

            {/* YouTube Footage */}
            {videos.length > 0 && (
              <div className="space-y-4">
                <div className="border-b border-white/[0.08] pb-3 flex items-center justify-between">
                  <h3 className="font-serif text-xl font-bold text-white">
                    Cinematic Films ({videos.length})
                  </h3>
                  <span className="text-xs font-mono text-red-400">
                    YouTube Embeds
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {videos.map((vid) => (
                    <YouTubePreview key={vid.id} media={vid} />
                  ))}
                </div>
              </div>
            )}

            {/* Instagram Road Dispatches */}
            {reels.length > 0 && (
              <div className="space-y-4">
                <div className="border-b border-white/[0.08] pb-3 flex items-center justify-between">
                  <h3 className="font-serif text-xl font-bold text-white">
                    Road Dispatches ({reels.length})
                  </h3>
                  <span className="text-xs font-mono text-pink-400">
                    @the_jayant_diaries
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {reels.map((reel) => (
                    <InstagramCard key={reel.id} media={reel} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Closing Image & Quote */}
        <div className="pt-10 border-t border-white/10 text-center space-y-4">
          <p className="font-serif italic text-lg sm:text-xl text-neutral-300">
            &ldquo;The world feels different when you slow down.&rdquo;
          </p>
          <p className="text-xs font-mono text-neutral-400">
            End of Ladakh 2026 Archive &bull; The Jayant Diaries
          </p>
        </div>
      </div>
    </div>
  );
}
