'use client';

import * as React from 'react';
import Image from 'next/image';
import { TripWithDetails, PlaceRow, DayRow, MemoryRow, MediaRow } from '@/types/entities';
import { TripTabNav, TripTab } from './trip-tab-nav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { DayEditorModal } from './day-editor-modal';
import { MemoryEditorModal } from './memory-editor-modal';
import { PlaceEditorModal } from './place-editor-modal';
import { AddMediaModal } from './add-media-modal';
import { MediaDetailModal } from './media-detail-modal';
import { ImageGallery } from '@/components/media/image-gallery';
import { YouTubePreview } from '@/components/media/youtube-preview';
import { InstagramCard } from '@/components/media/instagram-card';
import { CoverSelector } from '@/components/media/cover-selector';
import { formatDate } from '@/lib/utils';
import { deleteDayAction } from '@/server/actions/day-actions';
import { deleteMemoryAction } from '@/server/actions/memory-actions';

export interface TripDetailClientProps {
  trip: TripWithDetails;
  allPlaces: PlaceRow[];
}

export function TripDetailClient({ trip, allPlaces }: TripDetailClientProps) {
  const [activeTab, setActiveTab] = React.useState<TripTab>('days');
  const [days, setDays] = React.useState<DayRow[]>(trip.days || []);
  const [memories, setMemories] = React.useState<MemoryRow[]>(trip.memories || []);
  const [mediaList, setMediaList] = React.useState<MediaRow[]>(trip.media || (trip.cover_media ? [trip.cover_media] : []));

  // Modal States
  const [isDayModalOpen, setIsDayModalOpen] = React.useState(false);
  const [editingDay, setEditingDay] = React.useState<DayRow | null>(null);

  const [isMemoryModalOpen, setIsMemoryModalOpen] = React.useState(false);
  const [editingMemory, setEditingMemory] = React.useState<MemoryRow | null>(null);

  const [isPlaceModalOpen, setIsPlaceModalOpen] = React.useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = React.useState(false);
  const [selectedMediaForEdit, setSelectedMediaForEdit] = React.useState<MediaRow | null>(null);

  const coverUrl = trip.cover_media?.storage_url || '';

  const dateSpan =
    trip.start_date && trip.end_date
      ? `${formatDate(trip.start_date)} — ${formatDate(trip.end_date)}`
      : 'Date range not set';

  const handleDeleteDay = async (id: string) => {
    if (confirm('Are you sure you want to delete this day?')) {
      await deleteDayAction(id, trip.id);
      setDays((prev) => prev.filter((d) => d.id !== id));
    }
  };

  const handleDeleteMemory = async (id: string) => {
    if (confirm('Are you sure you want to delete this memory?')) {
      await deleteMemoryAction(id, trip.id);
      setMemories((prev) => prev.filter((m) => m.id !== id));
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* 1. Panoramic Trip Hero Banner (Matching Reference Specification) */}
      <div className="relative h-64 sm:h-80 w-full overflow-hidden rounded-xl border border-studio-border bg-studio-surface shadow-2xl">
        <Image
          src={coverUrl}
          alt={trip.title}
          fill
          priority
          className="object-cover"
        />
        {/* Cinematic gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-studio-bg via-studio-bg/60 to-transparent" />

        {/* Hero Meta & Actions */}
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {trip.status}
              </span>
              <span className="rounded-full bg-studio-elevated/80 border border-studio-border px-2.5 py-0.5 text-[11px] font-semibold text-studio-muted">
                {trip.visibility}
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-tight">
              {trip.title}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 font-medium">{dateSpan}</p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => alert(`Edit Trip metadata for ${trip.title}`)}
              className="bg-studio-surface/80 backdrop-blur border-studio-border text-white hover:bg-studio-elevated"
            >
              Edit Trip
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Sub-Navigation Tabs */}
      <div className="rounded-lg border border-studio-border bg-studio-surface overflow-hidden">
        <TripTabNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={{
            days: days.length,
            places: allPlaces.length,
            memories: memories.length,
            media: mediaList.length,
          }}
        />

        {/* 3. Tab Panels */}
        <div className="p-6">
          {/* Days Tab (Matches Reference Screen) */}
          {activeTab === 'days' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Days ({days.length})</h2>
                  <p className="text-xs text-studio-muted">Chronological route and daily travel logs.</p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setEditingDay(null);
                    setIsDayModalOpen(true);
                  }}
                >
                  + Add Day
                </Button>
              </div>

              {days.length === 0 ? (
                <div className="rounded-lg border border-dashed border-studio-border p-12 text-center text-xs text-studio-muted">
                  No days added yet. Click &ldquo;+ Add Day&rdquo; to start your itinerary.
                </div>
              ) : (
                <div className="space-y-3">
                  {days.map((day) => {
                    return (
                      <div
                        key={day.id}
                        className="group flex items-center justify-between rounded-lg border border-studio-border bg-studio-elevated/40 p-4 hover:border-studio-accent/50 hover:bg-studio-elevated/80 transition-all"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          {/* Day thumbnail */}
                          <div className="relative h-14 w-20 flex-shrink-0 overflow-hidden rounded border border-studio-border bg-black">
                            <Image
                              src={coverUrl}
                              alt={day.title || `Day ${day.day_number}`}
                              fill
                              className="object-cover"
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">
                                Day {day.day_number}
                              </span>
                              {day.title && (
                                <span className="text-xs text-zinc-300 font-medium truncate">
                                  — {day.title}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-studio-muted">
                              <span>{day.date ? formatDate(day.date) : 'No date'}</span>
                              <span className="rounded bg-studio-surface px-2 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-900/40">
                                Leh
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingDay(day);
                              setIsDayModalOpen(true);
                            }}
                            className="text-xs text-studio-muted hover:text-white"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDay(day.id)}
                            className="text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Memories Tab */}
          {activeTab === 'memories' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Memories ({memories.length})</h2>
                  <p className="text-xs text-studio-muted">Narrative stories captured along this journey.</p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setEditingMemory(null);
                    setIsMemoryModalOpen(true);
                  }}
                >
                  + Add Memory
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {memories.map((memory) => (
                  <Card key={memory.id} className="bg-studio-elevated/40 border-studio-border">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="font-bold text-white text-base">{memory.title}</h3>
                        {memory.featured && (
                          <Badge variant="accent">Featured</Badge>
                        )}
                      </div>
                      <p className="text-xs text-zinc-300 line-clamp-2">{memory.description}</p>
                      {memory.journal && (
                        <p className="text-xs text-studio-muted italic font-serif line-clamp-2 border-l-2 border-studio-border pl-2">
                          &ldquo;{memory.journal}&rdquo;
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-studio-border/50 text-xs text-studio-muted">
                        <span>{memory.date ? formatDate(memory.date) : 'No date'}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingMemory(memory);
                              setIsMemoryModalOpen(true);
                            }}
                            className="text-studio-muted hover:text-white cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteMemory(memory.id)}
                            className="text-red-400 hover:text-red-300 cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Places Tab */}
          {activeTab === 'places' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Visited Places ({allPlaces.length})</h2>
                  <p className="text-xs text-studio-muted">Geographic checkpoints linked to this journey.</p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsPlaceModalOpen(true)}
                >
                  + Add Place
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {allPlaces.map((place) => (
                  <div
                    key={place.id}
                    className="rounded-lg border border-studio-border bg-studio-elevated/40 p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="font-bold text-white text-sm">{place.name}</h4>
                      <span className="text-[10px] uppercase font-mono text-zinc-400">
                        {place.state || place.country}
                      </span>
                    </div>
                    <p className="text-xs text-studio-muted line-clamp-2">{place.description}</p>
                    {place.latitude && place.longitude && (
                      <div className="font-mono text-[11px] text-zinc-400">
                        {place.latitude.toFixed(4)}° N, {place.longitude.toFixed(4)}° E
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Media & References Tab */}
          {activeTab === 'media' && (() => {
            const photos = mediaList.filter((m) => m.type === 'PHOTO' && !m.filename.startsWith('instagram-'));
            const videos = mediaList.filter((m) => m.type === 'VIDEO' || m.storage_path?.startsWith('youtube/'));
            const reels = mediaList.filter((m) => m.type === 'REEL' || m.filename.startsWith('instagram-'));

            return (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white">Content References ({mediaList.length})</h2>
                    <p className="text-xs text-studio-muted">
                      Photographs, YouTube films, and Instagram reels linked to this trip.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsMediaModalOpen(true)}
                  >
                    + Add Media Reference
                  </Button>
                </div>

                {/* Cover Media Selector */}
                {mediaList.length > 0 && (
                  <div className="p-4 rounded-xl bg-studio-elevated/40 border border-studio-border">
                    <CoverSelector
                      entityType="trip"
                      entityId={trip.id}
                      currentCoverMediaId={trip.cover_media_id}
                      availableMedia={mediaList}
                      onCoverUpdated={(newCoverId) => {
                        const newCover = mediaList.find((m) => m.id === newCoverId);
                        if (newCover) {
                          // Cover is updated
                        }
                      }}
                    />
                  </div>
                )}

                {/* Photos Gallery */}
                {photos.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-mono uppercase tracking-wider text-amber-400">
                      Photography ({photos.length})
                    </h3>
                    <ImageGallery images={photos} />
                  </div>
                )}

                {/* YouTube Films */}
                {videos.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-mono uppercase tracking-wider text-red-400">
                      YouTube Films ({videos.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {videos.map((vid) => (
                        <YouTubePreview key={vid.id} media={vid} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Instagram References */}
                {reels.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-mono uppercase tracking-wider text-pink-400">
                      Instagram Moments ({reels.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {reels.map((item) => (
                        <InstagramCard key={item.id} media={item} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Media Management Grid */}
                <div className="space-y-3 pt-4 border-t border-studio-border">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-studio-muted">
                      Manage & Edit References
                    </h3>
                    <span className="text-[11px] text-zinc-400">Click any card to edit metadata or delete</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {mediaList.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMediaForEdit(m)}
                        className="group relative aspect-video overflow-hidden rounded-lg border border-studio-border bg-black text-left hover:border-amber-400/50 transition-all"
                      >
                        <Image
                          src={m.thumbnail_url || m.storage_url}
                          alt={m.caption || m.filename}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute top-1.5 left-1.5 flex gap-1">
                          <span className="rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase backdrop-blur border border-white/10">
                            {m.type}
                          </span>
                        </div>
                        {m.caption && (
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 p-2 text-[10px] text-white truncate">
                            {m.caption}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white">Journey Overview</h2>
                <p className="text-xs text-studio-muted">High-level synopsis and archival statistics.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-4">
                  <div className="rounded-lg border border-studio-border bg-studio-elevated/30 p-5 space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-studio-muted">
                      Synopsis
                    </h4>
                    <p className="text-sm text-zinc-200 leading-relaxed">
                      {trip.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-studio-border bg-studio-elevated/30 p-5 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-studio-muted">
                    Trip Stats
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-studio-muted">Days:</span>
                      <span className="font-bold text-white">{days.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-studio-muted">Places:</span>
                      <span className="font-bold text-white">{allPlaces.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-studio-muted">Memories:</span>
                      <span className="font-bold text-white">{memories.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-studio-muted">Media Items:</span>
                      <span className="font-bold text-white">{mediaList.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <DayEditorModal
        isOpen={isDayModalOpen}
        onClose={() => setIsDayModalOpen(false)}
        tripId={trip.id}
        tripTitle={trip.title}
        initialData={editingDay}
        onSuccess={() => {
          // Re-fetch or reload
          window.location.reload();
        }}
      />

      <MemoryEditorModal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
        trips={[trip]}
        days={days}
        places={allPlaces}
        initialData={editingMemory}
        onSuccess={() => {
          window.location.reload();
        }}
      />

      <PlaceEditorModal
        isOpen={isPlaceModalOpen}
        onClose={() => setIsPlaceModalOpen(false)}
        onSuccess={() => {
          window.location.reload();
        }}
      />

      <AddMediaModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        trips={[trip]}
        days={days}
        places={allPlaces}
        defaultTripId={trip.id}
        onSuccess={() => {
          window.location.reload();
        }}
      />

      <MediaDetailModal
        media={selectedMediaForEdit}
        isOpen={!!selectedMediaForEdit}
        onClose={() => setSelectedMediaForEdit(null)}
        trips={[trip]}
        days={days}
        places={allPlaces}
        onUpdated={(updated) => {
          setMediaList((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        }}
        onDeleted={(deletedId) => {
          setMediaList((prev) => prev.filter((m) => m.id !== deletedId));
        }}
      />
    </div>
  );
}
