'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  UploadCloud,
  MoreVertical,
  Star,
  Trash2,
  Edit2,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Filter,
  EyeOff,
  Video,
  Instagram,
  ImageIcon,
} from 'lucide-react';
import { MediaRow, TripRow, DayRow, PlaceRow } from '@/types/entities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ImageFrame } from '@/components/ui/image-frame';
import { getNormalizedImageUrl, getImageAlt } from '@/lib/utils/image-provider';
import { AddMediaModal } from './add-media-modal';
import { MediaDetailModal } from './media-detail-modal';
import { reorderMediaAction, deleteMediaAction, setCoverMediaAction } from '@/server/actions/media-actions';

interface MediaManagerClientProps {
  initialMedia: MediaRow[];
  trips: TripRow[];
  days: DayRow[];
  places: PlaceRow[];
}

type TabType = 'ALL' | 'IMAGE' | 'YOUTUBE' | 'INSTAGRAM';
type SortOrder = 'newest' | 'oldest' | 'position';

export function MediaManagerClient({
  initialMedia,
  trips,
  days,
  places,
}: MediaManagerClientProps) {
  const [mediaList, setMediaList] = React.useState<MediaRow[]>(initialMedia);
  const [activeTab, setActiveTab] = React.useState<TabType>('ALL');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedTripId, setSelectedTripId] = React.useState('ALL');
  const [selectedPlaceId, setSelectedPlaceId] = React.useState('ALL');
  const [selectedVisibility, setSelectedVisibility] = React.useState<'ALL' | 'PUBLIC' | 'PRIVATE'>('ALL');
  const [sortOrder, setSortOrder] = React.useState<SortOrder>('position');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [selectedMediaForEdit, setSelectedMediaForEdit] = React.useState<MediaRow | null>(null);
  const [activeMenuId, setActiveMenuId] = React.useState<string | null>(null);
  const [isReordering, setIsReordering] = React.useState(false);

  // Close menus on outside click
  React.useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Filter logic
  const filteredMedia = React.useMemo(() => {
    return mediaList
      .filter((item) => {
        // Tab filter
        if (activeTab === 'IMAGE') {
          if (item.type !== 'PHOTO' || item.filename.startsWith('instagram-')) return false;
        } else if (activeTab === 'YOUTUBE') {
          if (item.type !== 'VIDEO' && !item.storage_path?.startsWith('youtube/')) return false;
        } else if (activeTab === 'INSTAGRAM') {
          if (item.type !== 'REEL' && !item.filename.startsWith('instagram-')) return false;
        }

        // Trip filter
        if (selectedTripId !== 'ALL' && item.trip_id !== selectedTripId) {
          return false;
        }

        // Place filter
        if (selectedPlaceId !== 'ALL' && item.place_id !== selectedPlaceId) {
          return false;
        }

        // Visibility filter
        if (selectedVisibility !== 'ALL' && item.visibility !== selectedVisibility) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchCaption = item.caption?.toLowerCase().includes(q);
          const matchAlt = item.alt_text?.toLowerCase().includes(q);
          const matchFilename = item.filename.toLowerCase();
          if (!matchCaption && !matchAlt && !matchFilename.includes(q)) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'position') {
          return (a.position ?? 0) - (b.position ?? 0);
        } else if (sortOrder === 'newest') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        } else {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
      });
  }, [mediaList, activeTab, selectedTripId, selectedPlaceId, selectedVisibility, searchQuery, sortOrder]);

  // Trip and Place lookup maps
  const tripMap = React.useMemo(() => new Map(trips.map((t) => [t.id, t.title])), [trips]);
  const placeMap = React.useMemo(() => new Map(places.map((p) => [p.id, p.name])), [places]);

  const handleMediaUpdated = (updated: MediaRow) => {
    setMediaList((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  };

  const handleMediaDeleted = (deletedId: string) => {
    setMediaList((prev) => prev.filter((m) => m.id !== deletedId));
  };

  const handleQuickDelete = async (media: MediaRow) => {
    if (!window.confirm(`Delete "${media.caption || media.filename}"?`)) return;
    const res = await deleteMediaAction(media.id, media.trip_id);
    if (res.success) {
      handleMediaDeleted(media.id);
    }
  };

  const handleQuickSetCover = async (media: MediaRow) => {
    const targetType = media.place_id ? 'place' : media.day_id ? 'day' : media.trip_id ? 'trip' : null;
    const targetId = media.place_id || media.day_id || media.trip_id;

    if (!targetType || !targetId) {
      alert('This media is not assigned to a trip or place. Edit it first to set a relation.');
      return;
    }

    const res = await setCoverMediaAction(targetType, targetId, media.id);
    if (res.success) {
      alert(`Successfully set as cover for ${targetType}!`);
    } else {
      alert(res.error || 'Failed to set as cover');
    }
  };

  const handleMoveItem = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filteredMedia.length) return;

    const newItems = [...filteredMedia];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    const orderedIds = newItems.map((item) => item.id);
    // Optimistically update
    const updatedMediaList = mediaList.map((m) => {
      const pos = orderedIds.indexOf(m.id);
      return pos !== -1 ? { ...m, position: pos } : m;
    });
    setMediaList(updatedMediaList);

    await reorderMediaAction(orderedIds);
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            Media
            <span className="text-xs font-mono font-normal text-neutral-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
              {filteredMedia.length} of {mediaList.length} items
            </span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Archived photography, YouTube video embeds, and Instagram moments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsReordering(!isReordering)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              isReordering
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-white/5 border-white/10 text-neutral-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            {isReordering ? 'Done Ordering' : 'Reorder Mode'}
          </button>

          <Link href="/studio/import">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
            >
              <UploadCloud className="w-4 h-4" />
              Batch Ingestion
            </Button>
          </Link>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Media
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          placeholder="Search media by caption, filename, or alt text..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-neutral-900/90 border border-white/10 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 shadow-inner"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs"
          >
            Clear
          </button>
        )}
      </div>

      {/* Segmented Tabs & Filters Row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Segmented Tabs */}
        <div className="flex items-center p-1 bg-neutral-900 border border-white/10 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'ALL'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('IMAGE')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'IMAGE'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Images
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('YOUTUBE')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'YOUTUBE'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-red-500" />
            YouTube
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('INSTAGRAM')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'INSTAGRAM'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Instagram className="w-3.5 h-3.5 text-pink-400" />
            Instagram
          </button>
        </div>

        {/* Dropdowns Row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Trip Dropdown */}
          <select
            value={selectedTripId}
            onChange={(e) => setSelectedTripId(e.target.value)}
            className="px-3 py-1.5 bg-neutral-900 border border-white/10 rounded-lg text-xs text-neutral-300 focus:outline-none focus:border-amber-500/50"
          >
            <option value="ALL">All Trips</option>
            {trips.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>

          {/* Place Dropdown */}
          <select
            value={selectedPlaceId}
            onChange={(e) => setSelectedPlaceId(e.target.value)}
            className="px-3 py-1.5 bg-neutral-900 border border-white/10 rounded-lg text-xs text-neutral-300 focus:outline-none focus:border-amber-500/50"
          >
            <option value="ALL">All Places</option>
            {places.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Visibility Dropdown */}
          <select
            value={selectedVisibility}
            onChange={(e) => setSelectedVisibility(e.target.value as any)}
            className="px-3 py-1.5 bg-neutral-900 border border-white/10 rounded-lg text-xs text-neutral-300 focus:outline-none focus:border-amber-500/50"
          >
            <option value="ALL">All Visibility</option>
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private</option>
          </select>

          {/* Sort Order Dropdown */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            className="px-3 py-1.5 bg-neutral-900 border border-white/10 rounded-lg text-xs text-neutral-300 focus:outline-none focus:border-amber-500/50 font-mono"
          >
            <option value="position">Order (Position)</option>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Media Cards Grid */}
      {filteredMedia.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center bg-neutral-900/30">
          <p className="text-sm text-neutral-400">No media items found matching the selected filters.</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={() => {
              setActiveTab('ALL');
              setSelectedTripId('ALL');
              setSelectedPlaceId('ALL');
              setSelectedVisibility('ALL');
              setSearchQuery('');
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMedia.map((media, index) => {
            const thumb = getNormalizedImageUrl(media.thumbnail_url || media.storage_url || '');
            const tripName = media.trip_id ? tripMap.get(media.trip_id) : null;
            const placeName = media.place_id ? placeMap.get(media.place_id) : null;
            const isMenuOpen = activeMenuId === media.id;

            return (
              <div
                key={media.id}
                className="group relative rounded-xl overflow-hidden bg-neutral-900 border border-white/10 hover:border-white/20 transition-all duration-200 shadow-md flex flex-col"
              >
                {/* Thumbnail Frame */}
                <div
                  className="relative aspect-video w-full bg-black cursor-pointer overflow-hidden"
                  onClick={() => setSelectedMediaForEdit(media)}
                >
                  <ImageFrame
                    src={thumb}
                    alt={getImageAlt(media)}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Private Badge (Top-Left) */}
                  {media.visibility === 'PRIVATE' && (
                    <div className="absolute top-2 left-2 z-10">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-amber-500/80 text-black font-bold shadow flex items-center gap-1">
                        <EyeOff className="w-2.5 h-2.5" />
                        Private
                      </span>
                    </div>
                  )}

                  {/* Type Badge (Top-Right) */}
                  <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider shadow ${
                        media.type === 'VIDEO'
                          ? 'bg-red-600 text-white'
                          : media.type === 'REEL'
                          ? 'bg-pink-600 text-white'
                          : 'bg-black/70 text-neutral-200 backdrop-blur-sm border border-white/10'
                      }`}
                    >
                      {media.type}
                    </span>
                  </div>

                  {/* Position Badge (Bottom-Right of image) */}
                  <div className="absolute bottom-2 right-2 z-10">
                    <span className="px-1.5 py-0.5 rounded bg-black/70 text-white/70 text-[9px] font-mono backdrop-blur-sm border border-white/10">
                      #{media.position ?? index}
                    </span>
                  </div>
                </div>

                {/* Card Content Footer */}
                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        onClick={() => setSelectedMediaForEdit(media)}
                        className="text-xs font-semibold text-white group-hover:text-amber-400 transition-colors cursor-pointer line-clamp-1 flex-1"
                        title={media.caption || media.filename}
                      >
                        {media.caption || media.filename}
                      </h3>

                      {/* Three-dots Menu Trigger */}
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setActiveMenuId(isMenuOpen ? null : media.id)}
                          className="p-1 text-neutral-400 hover:text-white rounded hover:bg-white/10 transition-colors"
                          aria-label="More actions"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                          <div className="absolute right-0 bottom-full mb-1 w-36 bg-neutral-900 border border-white/15 rounded-lg shadow-2xl py-1 z-30 text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                setSelectedMediaForEdit(media);
                              }}
                              className="w-full px-3 py-1.5 text-left text-neutral-300 hover:text-white hover:bg-white/10 flex items-center gap-2"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              Edit Details
                            </button>
                            {(media.trip_id || media.day_id || media.place_id) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  handleQuickSetCover(media);
                                }}
                                className="w-full px-3 py-1.5 text-left text-amber-400 hover:text-amber-300 hover:bg-white/10 flex items-center gap-2"
                              >
                                <Star className="w-3.5 h-3.5" />
                                Set as Cover
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                handleQuickDelete(media);
                              }}
                              className="w-full px-3 py-1.5 text-left text-rose-400 hover:text-rose-300 hover:bg-white/10 flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Trip / Place Subtitle */}
                    <p className="text-[11px] text-neutral-400 truncate">
                      {tripName ? tripName : 'Unassigned'}
                      {placeName && ` • ${placeName}`}
                    </p>
                  </div>

                  {/* Reordering Up/Down controls */}
                  {isReordering && (
                    <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-xs text-neutral-400">
                      <span className="text-[10px] font-mono">Pos: {media.position ?? index}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMoveItem(index, 'up')}
                          className="p-1 rounded bg-white/5 hover:bg-white/15 disabled:opacity-30 text-neutral-300 hover:text-white"
                          title="Move up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === filteredMedia.length - 1}
                          onClick={() => handleMoveItem(index, 'down')}
                          className="p-1 rounded bg-white/5 hover:bg-white/15 disabled:opacity-30 text-neutral-300 hover:text-white"
                          title="Move down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Media Modal Drawer */}
      <MediaDetailModal
        media={selectedMediaForEdit}
        isOpen={!!selectedMediaForEdit}
        onClose={() => setSelectedMediaForEdit(null)}
        trips={trips}
        days={days}
        places={places}
        onUpdated={handleMediaUpdated}
        onDeleted={handleMediaDeleted}
      />

      {/* Add Media Modal */}
      <AddMediaModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        trips={trips}
        days={days}
        places={places}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}
