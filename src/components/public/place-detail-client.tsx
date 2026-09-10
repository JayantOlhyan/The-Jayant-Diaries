'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, MapPin, Compass, Mountain, BookOpen, Camera, Film } from 'lucide-react';
import { PlaceRow, TripRow, MemoryRow, MediaRow } from '@/types/entities';
import { ImageFrame } from '@/components/ui/image-frame';
import { ImageGallery } from '@/components/media/image-gallery';
import { isValidCoordinate } from '@/lib/validation/coordinates';

interface PlaceDetailClientProps {
  place: PlaceRow;
  journeys: TripRow[];
  stories: MemoryRow[];
  media: MediaRow[];
}

type TabKey = 'overview' | 'journeys' | 'stories' | 'media';

const PLACE_COVERS: Record<string, string> = {
  leh: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80',
  'magnetic-hill': 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&auto=format&fit=crop&q=80',
  'nubra-valley': 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&auto=format&fit=crop&q=80',
  'khardung-la': 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&auto=format&fit=crop&q=80',
  'pangong-lake': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
};

const ELEVATIONS: Record<string, string> = {
  'pangong-lake': '4,350 m',
  'khardung-la': '5,359 m',
  'nubra-valley': '3,048 m',
  leh: '3,500 m',
  'magnetic-hill': '3,350 m',
};

const STORY_COVERS: Record<string, string> = {
  'mem11111-1111-4111-a111-111111111111':
    'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600&auto=format&fit=crop&q=80',
  'mem22222-2222-4222-a222-222222222222':
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&auto=format&fit=crop&q=80',
  'mem33333-3333-4333-a333-333333333333':
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
};

export function PlaceDetailClient({ place, journeys, stories, media }: PlaceDetailClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const coverImage =
    PLACE_COVERS[place.slug] ||
    media[0]?.storage_url ||
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80';

  const elevation = ELEVATIONS[place.slug] || '3,200 m';
  const region = place.state || place.country || 'Ladakh';

  const photos = media.filter((m) => m.type === 'PHOTO' && !m.filename.startsWith('instagram-'));

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 sm:py-14 space-y-10 pb-28">
      {/* Top Back Navigation */}
      <div>
        <Link
          href="/places"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Places</span>
        </Link>
      </div>

      {/* Main Place Header */}
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-4xl sm:text-6xl font-bold tracking-tight text-white">
            {place.name}
          </h1>
          <p className="text-sm sm:text-base font-mono text-neutral-400 mt-2">
            {place.city ? `${place.city}, ` : ''}
            {place.state ? `${place.state}, ` : ''}
            {place.country}
          </p>
        </div>

        {place.description && (
          <p className="text-sm sm:text-base text-neutral-300 max-w-3xl leading-relaxed font-sans font-light">
            {place.description}
          </p>
        )}

        {/* Geographic Stat Badges (Matching Spec Panel 5) */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <div className="px-3.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-xs font-mono text-neutral-300 flex items-center gap-2">
            <Mountain className="w-3.5 h-3.5 text-amber-500" />
            <span>
              <strong className="text-white">{elevation}</strong> Elevation
            </span>
          </div>

          <div className="px-3.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-xs font-mono text-neutral-300 flex items-center gap-2">
            <Compass className="w-3.5 h-3.5 text-amber-500" />
            <span>
              <strong className="text-white">{region}</strong> Region
            </span>
          </div>

          {isValidCoordinate(place.latitude, place.longitude) ? (
            <>
              <div className="px-3.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-xs font-mono text-neutral-300 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  <strong className="text-white">{(place.latitude as number).toFixed(2)}° N</strong>,{' '}
                  <strong className="text-white">{(place.longitude as number).toFixed(2)}° E</strong>
                </span>
              </div>

              <Link
                href="/map"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/30 hover:border-amber-400/50 text-xs font-mono uppercase tracking-wider transition-all"
              >
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                <span>View on Map →</span>
              </Link>
            </>
          ) : (
            <div className="px-3.5 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.06] text-xs font-mono text-neutral-500 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-neutral-600" />
              <span>Coordinates not recorded</span>
            </div>
          )}
        </div>
      </div>

      {/* Sub-Tabs Bar (Matching Spec Panel 5) */}
      <div className="flex items-center gap-6 border-b border-white/[0.08] text-xs font-mono uppercase tracking-wider">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'overview' ? 'text-white font-bold' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Overview
          {activeTab === 'overview' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-500" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('journeys')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'journeys' ? 'text-white font-bold' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Related Journeys ({journeys.length})
          {activeTab === 'journeys' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-500" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('stories')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'stories' ? 'text-white font-bold' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Stories ({stories.length})
          {activeTab === 'stories' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-500" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('media')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'media' ? 'text-white font-bold' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Media ({media.length})
          {activeTab === 'media' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-500" />
          )}
        </button>
      </div>

      {/* Split Main Grid: Left Tab Content + Right Related Content Sidebar (Spec Panel 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Main Content Pane */}
        <div className="lg:col-span-8 space-y-8">
          {/* Overview Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Hero Photo Frame */}
              <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden border border-white/10 bg-neutral-900 shadow-2xl">
                <ImageFrame src={coverImage} alt={place.name} fill priority />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 bg-black/60 px-2.5 py-1 rounded backdrop-blur-md">
                    Waypoints Archive
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl text-white font-bold mt-1">
                    {place.name}
                  </h2>
                </div>
              </div>

              {/* Waypoint Field Reflection */}
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-3">
                <h3 className="font-serif text-lg text-white">Geographic Journal</h3>
                <p className="text-sm text-neutral-300 leading-relaxed font-light">
                  {place.description ||
                    `${place.name} represents one of the signature high-altitude geographical waypoints in ${place.state || place.country}. Captured with wide lenses and archived for permanent exploration.`}
                </p>
              </div>

              {/* Photography Preview */}
              {photos.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-xl text-white">Expedition Photography</h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('media')}
                      className="text-xs font-mono text-amber-400 hover:underline"
                    >
                      View full gallery ({photos.length}) →
                    </button>
                  </div>
                  <ImageGallery images={photos.slice(0, 4)} />
                </div>
              )}
            </div>
          )}

          {/* Related Journeys Tab Content */}
          {activeTab === 'journeys' && (
            <div className="space-y-4">
              <h3 className="font-serif text-2xl text-white">Expeditions Visiting {place.name}</h3>
              {journeys.length > 0 ? (
                <div className="space-y-4">
                  {journeys.map((trip) => (
                    <Link
                      key={trip.id}
                      href={`/journeys/${trip.slug}`}
                      className="group flex items-center justify-between p-5 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:border-white/20 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative w-20 h-16 rounded-lg overflow-hidden shrink-0 bg-neutral-900">
                          <ImageFrame
                            src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&auto=format&fit=crop&q=80"
                            alt={trip.title}
                            fill
                          />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest">
                            Journey
                          </span>
                          <h4 className="font-serif text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                            {trip.title}
                          </h4>
                          {trip.description && (
                            <p className="text-xs text-neutral-400 line-clamp-1 mt-0.5">
                              {trip.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-white group-hover:translate-x-1 transition-transform" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center rounded-xl border border-dashed border-white/10 text-neutral-400 text-sm">
                  No linked journeys currently recorded for this place.
                </div>
              )}
            </div>
          )}

          {/* Stories Tab Content */}
          {activeTab === 'stories' && (
            <div className="space-y-4">
              <h3 className="font-serif text-2xl text-white">Field Notes from {place.name}</h3>
              {stories.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {stories.map((story) => {
                    const cover =
                      STORY_COVERS[story.id] ||
                      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600&auto=format&fit=crop&q=80';
                    return (
                      <Link
                        key={story.id}
                        href={`/stories/${story.id}`}
                        className="group flex flex-col rounded-xl overflow-hidden bg-white/[0.02] border border-white/[0.08] hover:border-white/20 transition-all p-4 space-y-3"
                      >
                        <div className="relative aspect-[16/10] w-full rounded-lg overflow-hidden bg-neutral-900">
                          <ImageFrame src={cover} alt={story.title} fill />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-amber-400 uppercase">
                            {story.date ? new Date(story.date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'Field Note'}
                          </span>
                          <h4 className="font-serif text-lg font-bold text-white group-hover:text-amber-400 transition-colors mt-0.5">
                            {story.title}
                          </h4>
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
              ) : (
                <div className="p-12 text-center rounded-xl border border-dashed border-white/10 text-neutral-400 text-sm">
                  No written field notes logged yet for this waypoint.
                </div>
              )}
            </div>
          )}

          {/* Media Tab Content */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              <h3 className="font-serif text-2xl text-white">Photographs & Film Archive</h3>
              {media.length > 0 ? (
                <ImageGallery images={media} />
              ) : (
                <div className="p-12 text-center rounded-xl border border-dashed border-white/10 text-neutral-400 text-sm">
                  Media for this waypoint is currently being archived.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Related Content Sidebar (Strictly matches Panel 5 in Design Spec) */}
        <aside className="lg:col-span-4 space-y-8">
          {/* Related Journeys Sidebar Box */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-4">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-500 font-semibold">
              Related Journeys
            </span>

            {journeys.length > 0 ? (
              <div className="space-y-3">
                {journeys.slice(0, 2).map((trip) => (
                  <Link
                    key={trip.id}
                    href={`/journeys/${trip.slug}`}
                    className="group block rounded-xl overflow-hidden bg-black/40 border border-white/[0.06] hover:border-white/20 transition-all p-3 space-y-2.5"
                  >
                    <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden bg-neutral-900">
                      <ImageFrame
                        src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&auto=format&fit=crop&q=80"
                        alt={trip.title}
                        fill
                        className="group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div>
                      <h4 className="font-serif text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                        {trip.title}
                      </h4>
                      <p className="text-xs text-neutral-400 line-clamp-1 mt-0.5">
                        {trip.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-400 italic">No linked journeys.</p>
            )}
          </div>

          {/* Related Stories Sidebar Box */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-4">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-500 font-semibold">
              Related Stories
            </span>

            {stories.length > 0 ? (
              <div className="space-y-3">
                {stories.slice(0, 2).map((story) => {
                  const cover =
                    STORY_COVERS[story.id] ||
                    'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=500&auto=format&fit=crop&q=80';
                  return (
                    <Link
                      key={story.id}
                      href={`/stories/${story.id}`}
                      className="group flex items-center gap-3 p-2 rounded-xl bg-black/40 border border-white/[0.06] hover:border-white/20 transition-all"
                    >
                      <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-neutral-900 shrink-0">
                        <ImageFrame src={cover} alt={story.title} fill />
                      </div>
                      <div className="truncate">
                        <h4 className="font-serif text-sm font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                          {story.title}
                        </h4>
                        <p className="text-[10px] font-mono text-neutral-400 mt-0.5">
                          {story.date ? new Date(story.date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'Field Note'}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-neutral-400 italic">No field notes recorded.</p>
            )}
          </div>

          {/* Related Media Sidebar Box (Mini Grid with +N preview) */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-500 font-semibold">
                Related Media
              </span>
              <Link
                href="/media"
                className="text-[10px] font-mono text-neutral-400 hover:text-white transition-colors"
              >
                Archive →
              </Link>
            </div>

            {media.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {media.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setActiveTab('media')}
                    className="relative aspect-square rounded-lg overflow-hidden bg-neutral-900 border border-white/[0.06] cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <ImageFrame
                      src={item.storage_url}
                      alt={item.caption || item.filename}
                      fill
                    />
                  </div>
                ))}
                {media.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('media')}
                    className="aspect-square rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center text-xs font-mono text-neutral-300 hover:text-white hover:bg-white/[0.1] transition-colors"
                  >
                    +{media.length - 5}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-xs text-neutral-400 italic">No media items.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
