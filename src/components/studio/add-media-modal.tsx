'use client';

import * as React from 'react';
import Image from 'next/image';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { extractYouTubeId, getYouTubeInfo } from '@/lib/utils/youtube';
import { addMediaReferenceAction } from '@/server/actions/media-actions';
import { TripRow, DayRow, PlaceRow, ContentReferenceType } from '@/types/entities';

export interface AddMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  trips: TripRow[];
  days?: DayRow[];
  places?: PlaceRow[];
  defaultTripId?: string;
  defaultDayId?: string;
  defaultPlaceId?: string;
  onSuccess?: () => void;
}

export function AddMediaModal({
  isOpen,
  onClose,
  trips,
  days = [],
  places = [],
  defaultTripId,
  defaultDayId,
  defaultPlaceId,
  onSuccess,
}: AddMediaModalProps) {
  const [activeTab, setActiveTab] = React.useState<ContentReferenceType>('YOUTUBE');

  // Entity Linkage
  const [tripId, setTripId] = React.useState<string>(defaultTripId || trips[0]?.id || '');
  const [dayId, setDayId] = React.useState<string>(defaultDayId || '');
  const [placeId, setPlaceId] = React.useState<string>(defaultPlaceId || '');

  // YouTube Fields
  const [youtubeUrl, setYoutubeUrl] = React.useState<string>('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const [youtubeId, setYoutubeId] = React.useState<string>('dQw4w9WgXcQ');
  const [youtubeTitle, setYoutubeTitle] = React.useState<string>('Leh — A Day in the Mountains');
  const [thumbnailPreview, setThumbnailPreview] = React.useState<string>(
    'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg'
  );

  // Image Fields
  const [imageUrl, setImageUrl] = React.useState<string>('');
  const [imageCaption, setImageCaption] = React.useState<string>('');
  const [imageAlt, setImageAlt] = React.useState<string>('');

  // Instagram Fields
  const [instagramUrl, setInstagramUrl] = React.useState<string>('');
  const [instagramShortcode, setInstagramShortcode] = React.useState<string>('');
  const [instagramType, setInstagramType] = React.useState<'POST' | 'REEL'>('REEL');
  const [instagramCaption, setInstagramCaption] = React.useState<string>('');

  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (defaultTripId) setTripId(defaultTripId);
    if (defaultDayId) setDayId(defaultDayId);
    if (defaultPlaceId) setPlaceId(defaultPlaceId);
  }, [defaultTripId, defaultDayId, defaultPlaceId, isOpen]);

  // Handle YouTube URL changes
  const handleYouTubeUrlChange = (url: string) => {
    setYoutubeUrl(url);
    const info = getYouTubeInfo(url);
    if (info) {
      setYoutubeId(info.videoId);
      setThumbnailPreview(info.thumbnailUrl);
    } else {
      setYoutubeId('');
      setThumbnailPreview('');
    }
  };

  // Handle Instagram URL changes
  const handleInstagramUrlChange = (url: string) => {
    setInstagramUrl(url);
    const match = url.match(/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/i);
    if (match && match[1]) {
      setInstagramShortcode(match[1]);
      if (url.includes('/reel/')) {
        setInstagramType('REEL');
      }
    }
  };

  const filteredDays = days.filter((d) => !tripId || d.trip_id === tripId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (activeTab === 'YOUTUBE') {
        if (!youtubeId) throw new Error('Please provide a valid YouTube URL');
        const res = await addMediaReferenceAction({
          type: 'YOUTUBE',
          youtube_url: youtubeUrl,
          youtube_id: youtubeId,
          title: youtubeTitle || 'YouTube Video',
          thumbnail_url: thumbnailPreview,
          trip_id: tripId || null,
          day_id: dayId || null,
          place_id: placeId || null,
        });
        if (!res.success) throw new Error(res.error);
      } else if (activeTab === 'IMAGE') {
        if (!imageUrl) throw new Error('Please provide an image URL');
        const res = await addMediaReferenceAction({
          type: 'IMAGE',
          url: imageUrl,
          caption: imageCaption || null,
          alt_text: imageAlt || null,
          trip_id: tripId || null,
          day_id: dayId || null,
          place_id: placeId || null,
        });
        if (!res.success) throw new Error(res.error);
      } else if (activeTab === 'INSTAGRAM') {
        if (!instagramUrl) throw new Error('Please provide an Instagram URL');
        const res = await addMediaReferenceAction({
          type: 'INSTAGRAM',
          instagram_url: instagramUrl,
          shortcode: instagramShortcode || 'insta-shortcode',
          instagram_type: instagramType,
          caption: instagramCaption || null,
          trip_id: tripId || null,
          day_id: dayId || null,
          place_id: placeId || null,
        });
        if (!res.success) throw new Error(res.error);
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to add media reference');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Add Media Reference"
      description="Attach photographs, YouTube films, or Instagram reels to your journeys."
      className="max-w-xl bg-studio-surface border-studio-border text-studio-text"
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        {errorMessage && (
          <div className="rounded border border-red-800 bg-red-950/60 p-2.5 text-xs text-red-300">
            {errorMessage}
          </div>
        )}

        {/* Tab Segment Selector */}
        <div className="flex rounded-md bg-studio-elevated p-1 border border-studio-border">
          {(['Image', 'YouTube', 'Instagram'] as const).map((tab) => {
            const tabKey = tab.toUpperCase() as ContentReferenceType;
            const isActive = activeTab === tabKey;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tabKey)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer ${
                  isActive ? 'bg-studio-surface text-white shadow' : 'text-studio-muted hover:text-white'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Entity Linkage Row */}
        <div className="grid grid-cols-3 gap-2.5 p-3 rounded-md bg-studio-elevated/50 border border-studio-border/60">
          <Select
            label="Link to Trip"
            value={tripId}
            onChange={(e) => {
              setTripId(e.target.value);
              setDayId('');
            }}
            options={trips.map((t) => ({ value: t.id, label: t.title }))}
            className="bg-studio-elevated border-studio-border text-xs"
          />
          <Select
            label="Link to Day"
            value={dayId}
            onChange={(e) => setDayId(e.target.value)}
            options={[
              { value: '', label: 'Unassigned' },
              ...filteredDays.map((d) => ({
                value: d.id,
                label: `Day ${d.day_number}${d.title ? ` - ${d.title}` : ''}`,
              })),
            ]}
            className="bg-studio-elevated border-studio-border text-xs"
          />
          <Select
            label="Link to Place"
            value={placeId}
            onChange={(e) => setPlaceId(e.target.value)}
            options={[
              { value: '', label: 'Unassigned' },
              ...places.map((p) => ({ value: p.id, label: p.name })),
            ]}
            className="bg-studio-elevated border-studio-border text-xs"
          />
        </div>

        {/* YouTube Tab Fields */}
        {activeTab === 'YOUTUBE' && (
          <div className="space-y-3 animate-fade-in">
            <Input
              label="YouTube URL"
              placeholder="https://youtube.com/watch?v=XXXXXXXXXXX"
              value={youtubeUrl}
              onChange={(e) => handleYouTubeUrlChange(e.target.value)}
              required
              className="bg-studio-elevated border-studio-border"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="YouTube ID"
                value={youtubeId}
                readOnly
                className="bg-studio-elevated/60 border-studio-border text-zinc-400 font-mono text-xs"
              />
              <Input
                label="Video Title"
                placeholder="e.g. Leh — A Day in the Mountains"
                value={youtubeTitle}
                onChange={(e) => setYoutubeTitle(e.target.value)}
                required
                className="bg-studio-elevated border-studio-border"
              />
            </div>

            {thumbnailPreview && (
              <div className="space-y-1">
                <span className="block text-xs font-medium uppercase tracking-wider text-studio-muted">
                  Thumbnail Preview
                </span>
                <div className="relative aspect-video w-full overflow-hidden rounded-md border border-studio-border bg-black">
                  <Image
                    src={thumbnailPreview}
                    alt="YouTube thumbnail preview"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="rounded-full bg-red-600/90 p-3 text-white shadow-lg">
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Image Tab Fields */}
        {activeTab === 'IMAGE' && (
          <div className="space-y-3 animate-fade-in">
            <Input
              label="Image URL"
              placeholder="https://images.unsplash.com/..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              required
              className="bg-studio-elevated border-studio-border"
            />
            <Input
              label="Caption"
              placeholder="e.g. Sunrise over Pangong Lake"
              value={imageCaption}
              onChange={(e) => setImageCaption(e.target.value)}
              className="bg-studio-elevated border-studio-border"
            />
            <Input
              label="Alt Text"
              placeholder="e.g. Blue lake with reflection of brown mountains"
              value={imageAlt}
              onChange={(e) => setImageAlt(e.target.value)}
              className="bg-studio-elevated border-studio-border"
            />
          </div>
        )}

        {/* Instagram Tab Fields */}
        {activeTab === 'INSTAGRAM' && (
          <div className="space-y-3 animate-fade-in">
            <Input
              label="Instagram URL"
              placeholder="https://instagram.com/p/C_abc123/ or /reel/..."
              value={instagramUrl}
              onChange={(e) => handleInstagramUrlChange(e.target.value)}
              required
              className="bg-studio-elevated border-studio-border"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Shortcode"
                value={instagramShortcode}
                onChange={(e) => setInstagramShortcode(e.target.value)}
                className="bg-studio-elevated border-studio-border font-mono text-xs"
              />
              <Select
                label="Format Type"
                value={instagramType}
                onChange={(e) => setInstagramType(e.target.value as any)}
                options={[
                  { value: 'REEL', label: 'Reel (9:16 Video)' },
                  { value: 'POST', label: 'Static Post' },
                ]}
                className="bg-studio-elevated border-studio-border"
              />
            </div>
            <Input
              label="Caption Excerpt"
              placeholder="Morning in Leh 🏔️..."
              value={instagramCaption}
              onChange={(e) => setInstagramCaption(e.target.value)}
              className="bg-studio-elevated border-studio-border"
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-studio-border/60">
          <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            Save Reference
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
