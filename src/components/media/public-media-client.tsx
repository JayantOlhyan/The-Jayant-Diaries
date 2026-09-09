'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Camera, Video, Instagram, Maximize2, Search, ArrowRight } from 'lucide-react';
import { MediaRow, TripRow, PlaceRow } from '@/types/entities';
import { ImageFrame } from '@/components/ui/image-frame';
import { getNormalizedImageUrl, getImageAlt } from '@/lib/utils/image-provider';
import { ImageLightbox } from './image-lightbox';
import { YouTubePreview } from './youtube-preview';
import { InstagramCard } from './instagram-card';

interface PublicMediaClientProps {
  initialMedia: MediaRow[];
  trips?: TripRow[];
  places?: PlaceRow[];
}

type PublicTab = 'ALL' | 'PHOTO' | 'VIDEO' | 'INSTAGRAM';

export function PublicMediaClient({ initialMedia, trips = [], places = [] }: PublicMediaClientProps) {
  const [activeTab, setActiveTab] = useState<PublicTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTripId, setSelectedTripId] = useState<string>('ALL');
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Strictly filter public items (Rule 5: Zero Private Data Leakage)
  const publicMedia = useMemo(() => {
    return initialMedia.filter((m) => m.visibility === 'PUBLIC');
  }, [initialMedia]);

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    publicMedia.forEach((m) => {
      if (m.taken_at) {
        years.add(new Date(m.taken_at).getFullYear().toString());
      }
    });
    return Array.from(years).sort().reverse();
  }, [publicMedia]);

  const photos = useMemo(() => {
    return publicMedia.filter((m) => m.type === 'PHOTO' && !m.filename.startsWith('instagram-'));
  }, [publicMedia]);

  const videos = useMemo(() => {
    return publicMedia.filter((m) => m.type === 'VIDEO' || m.storage_path?.startsWith('youtube/'));
  }, [publicMedia]);

  const instagramItems = useMemo(() => {
    return publicMedia.filter((m) => m.type === 'REEL' || m.filename.startsWith('instagram-'));
  }, [publicMedia]);

  const filteredMedia = useMemo(() => {
    let list: MediaRow[] = publicMedia;
    if (activeTab === 'PHOTO') list = photos;
    else if (activeTab === 'VIDEO') list = videos;
    else if (activeTab === 'INSTAGRAM') list = instagramItems;

    // Filter by Journey
    if (selectedTripId !== 'ALL') {
      list = list.filter((m) => m.trip_id === selectedTripId);
    }

    // Filter by Place
    if (selectedPlaceId !== 'ALL') {
      list = list.filter((m) => m.place_id === selectedPlaceId);
    }

    // Filter by Year
    if (selectedYear !== 'ALL') {
      list = list.filter(
        (m) => m.taken_at && new Date(m.taken_at).getFullYear().toString() === selectedYear
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.caption?.toLowerCase().includes(q) ||
          m.alt_text?.toLowerCase().includes(q) ||
          m.filename.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeTab, searchQuery, selectedTripId, selectedPlaceId, selectedYear, photos, videos, instagramItems, publicMedia]);

  const handleOpenLightbox = (mediaItem: MediaRow) => {
    const idx = photos.findIndex((p) => p.id === mediaItem.id);
    if (idx !== -1) {
      setLightboxIndex(idx);
    }
  };

  const hasActiveFilters =
    selectedTripId !== 'ALL' || selectedPlaceId !== 'ALL' || selectedYear !== 'ALL' || searchQuery.trim() !== '';

  const handleResetFilters = () => {
    setSelectedTripId('ALL');
    setSelectedPlaceId('ALL');
    setSelectedYear('ALL');
    setSearchQuery('');
  };

  return (
    <div className="space-y-12">
      {/* Category Pills & Discovery Filter Bar (Matching Spec Panel 6) */}
      <div className="space-y-4 border-b border-white/[0.08] pb-6">
        {/* Row 1: Type Tabs & Search Input */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {(['ALL', 'PHOTO', 'VIDEO', 'INSTAGRAM'] as const).map((tab) => {
              const count =
                tab === 'ALL'
                  ? publicMedia.length
                  : tab === 'PHOTO'
                  ? photos.length
                  : tab === 'VIDEO'
                  ? videos.length
                  : instagramItems.length;

              const label =
                tab === 'ALL'
                  ? 'All'
                  : tab === 'PHOTO'
                  ? 'Photography'
                  : tab === 'VIDEO'
                  ? 'Films'
                  : 'Instagram';

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
                    activeTab === tab
                      ? 'bg-white text-black font-bold shadow-md'
                      : 'bg-white/[0.04] text-neutral-400 hover:text-white border border-white/[0.08]'
                  }`}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search captions & alt text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-neutral-900/60 border border-white/10 rounded-full text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Row 2: Discovery Dropdown Filters (Matching Spec Panel 6: All Journeys ▾, All Places ▾, All Years ▾) */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Journey Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedTripId}
              onChange={(e) => setSelectedTripId(e.target.value)}
              className="appearance-none bg-white/[0.04] border border-white/10 text-xs font-mono uppercase tracking-wider text-neutral-300 hover:text-white hover:border-white/20 px-3.5 py-1.5 pr-8 rounded-lg focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="ALL" className="bg-neutral-900 text-white">All Journeys</option>
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id} className="bg-neutral-900 text-white">
                  {trip.title}
                </option>
              ))}
            </select>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 text-[10px]">
              ▾
            </span>
          </div>

          {/* Place Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedPlaceId}
              onChange={(e) => setSelectedPlaceId(e.target.value)}
              className="appearance-none bg-white/[0.04] border border-white/10 text-xs font-mono uppercase tracking-wider text-neutral-300 hover:text-white hover:border-white/20 px-3.5 py-1.5 pr-8 rounded-lg focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="ALL" className="bg-neutral-900 text-white">All Places</option>
              {places.map((place) => (
                <option key={place.id} value={place.id} className="bg-neutral-900 text-white">
                  {place.name}
                </option>
              ))}
            </select>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 text-[10px]">
              ▾
            </span>
          </div>

          {/* Year Filter Dropdown */}
          {availableYears.length > 0 && (
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="appearance-none bg-white/[0.04] border border-white/10 text-xs font-mono uppercase tracking-wider text-neutral-300 hover:text-white hover:border-white/20 px-3.5 py-1.5 pr-8 rounded-lg focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="ALL" className="bg-neutral-900 text-white">All Years</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr} className="bg-neutral-900 text-white">
                    {yr}
                  </option>
                ))}
              </select>
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 text-[10px]">
                ▾
              </span>
            </div>
          )}

          {/* Reset Filters button if active */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-mono text-amber-400 hover:text-amber-300 underline transition-colors px-2"
            >
              Reset Filters
            </button>
          )}

          <div className="ml-auto text-xs font-mono text-neutral-500 hidden sm:block">
            Showing {filteredMedia.length} {filteredMedia.length === 1 ? 'item' : 'items'}
          </div>
        </div>
      </div>

      {/* Media Collection Layout */}
      {filteredMedia.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
          <p className="text-sm text-neutral-400">
            No media found matching the selected filters.
          </p>
        </div>
      ) : activeTab === 'VIDEO' ? (
        /* Video Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {videos.map((vid) => (
            <YouTubePreview key={vid.id} media={vid} />
          ))}
        </div>
      ) : activeTab === 'INSTAGRAM' ? (
        /* Instagram Road Dispatches Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {instagramItems.map((item) => (
            <InstagramCard key={item.id} media={item} />
          ))}
        </div>
      ) : (
        /* Editorial Asymmetrical Photography & Cinema Composition (Matches Reference Spec) */
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[280px] sm:auto-rows-[340px]">
            {filteredMedia.map((item, index) => {
              const isVideo = item.type === 'VIDEO' || item.storage_path?.startsWith('youtube/');
              const isReel = item.type === 'REEL' || item.filename.startsWith('instagram-');

              // Video embed card
              if (isVideo) {
                return (
                  <div key={item.id} className="sm:col-span-2 row-span-1 rounded-2xl overflow-hidden">
                    <YouTubePreview media={item} />
                  </div>
                );
              }

              // Instagram reel card
              if (isReel) {
                return (
                  <div key={item.id} className="sm:col-span-1 row-span-1">
                    <InstagramCard media={item} />
                  </div>
                );
              }

              // Editorial Photo Card with varied aspect ratios
              const url = getNormalizedImageUrl(item.thumbnail_url || item.storage_url || '');
              const alt = getImageAlt(item);

              // Create visual rhythm: index 0 and 5 can span 2 columns if room permits
              const isWide = index === 0 || index === 4;

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenLightbox(item)}
                  className={`group relative rounded-2xl overflow-hidden bg-neutral-950 border border-white/[0.08] hover:border-white/25 transition-all duration-300 shadow-xl cursor-pointer ${
                    isWide ? 'sm:col-span-2' : 'sm:col-span-1'
                  }`}
                >
                  <ImageFrame
                    src={url}
                    alt={alt}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />

                  {/* Dark Vignette Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                  {/* Expand icon on hover */}
                  <div className="absolute top-4 right-4 p-2.5 rounded-full bg-black/60 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity border border-white/20">
                    <Maximize2 className="w-4 h-4" />
                  </div>

                  {/* Caption & Location Footer */}
                  {item.caption && (
                    <div className="absolute bottom-0 inset-x-0 p-5 space-y-1">
                      <p className="font-serif text-base sm:text-lg font-bold text-white drop-shadow">
                        {item.caption}
                      </p>
                      {item.alt_text && item.alt_text !== item.caption && (
                        <p className="text-xs text-neutral-300 line-clamp-1 italic font-sans drop-shadow-sm">
                          {item.alt_text}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Poetic Closing Quote */}
          <div className="pt-16 pb-4 text-center space-y-3">
            <p className="font-serif italic text-2xl sm:text-3xl text-neutral-200">
              &ldquo;The world feels different when you slow down.&rdquo;
            </p>
            <p className="text-xs font-mono text-neutral-500 uppercase tracking-widest">
              The Jayant Diaries &bull; Visual Archive
            </p>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxIndex !== null && photos.length > 0 && (
        <ImageLightbox
          images={photos}
          currentIndex={lightboxIndex}
          isOpen={lightboxIndex !== null}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(newIdx) => setLightboxIndex(newIdx)}
        />
      )}
    </div>
  );
}
