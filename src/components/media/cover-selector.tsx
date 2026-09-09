'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Star, Check, AlertCircle, Loader2 } from 'lucide-react';
import { MediaRow } from '@/types/entities';
import { getNormalizedImageUrl, getImageAlt } from '@/lib/utils/image-provider';
import { setCoverMediaAction } from '@/server/actions/media-actions';
import { ImageFrame } from '@/components/ui/image-frame';

interface CoverSelectorProps {
  entityType: 'trip' | 'day' | 'place';
  entityId: string;
  currentCoverMediaId?: string | null;
  availableMedia: MediaRow[];
  onCoverUpdated?: (newCoverMediaId: string) => void;
}

export function CoverSelector({
  entityType,
  entityId,
  currentCoverMediaId,
  availableMedia,
  onCoverUpdated,
}: CoverSelectorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(currentCoverMediaId || null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSelectCover = async (mediaId: string) => {
    if (mediaId === selectedId) return;

    setIsUpdating(true);
    setStatusMessage(null);

    const res = await setCoverMediaAction(entityType, entityId, mediaId);

    if (res.success) {
      setSelectedId(mediaId);
      setStatusMessage({ type: 'success', text: `Cover media updated for ${entityType}.` });
      if (onCoverUpdated) {
        onCoverUpdated(mediaId);
      }
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Failed to update cover media' });
    }

    setIsUpdating(false);
  };

  if (!availableMedia || availableMedia.length === 0) {
    return (
      <div className="p-6 text-center border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
        <p className="text-sm text-neutral-400">
          No media available for this {entityType} to set as cover.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-white">Cover Image</h4>
          <p className="text-xs text-neutral-400">
            Select an image to represent this {entityType} across the archive.
          </p>
        </div>

        {isUpdating && (
          <div className="flex items-center gap-2 text-xs text-amber-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Updating...
          </div>
        )}
      </div>

      {statusMessage && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <Check className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Grid of media items */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {availableMedia.map((media) => {
          const isCover = selectedId === media.id;
          const imageUrl = getNormalizedImageUrl(media.thumbnail_url || media.storage_url || '');

          return (
            <button
              key={media.id}
              type="button"
              disabled={isUpdating}
              onClick={() => handleSelectCover(media.id)}
              className={`group relative aspect-square rounded-lg overflow-hidden border transition-all text-left ${
                isCover
                  ? 'border-amber-400 ring-2 ring-amber-400/40 shadow-lg'
                  : 'border-white/10 hover:border-white/30 opacity-75 hover:opacity-100'
              }`}
              aria-label={`Set as cover: ${media.caption || 'Media item'}`}
            >
              <ImageFrame
                src={imageUrl}
                alt={getImageAlt(media)}
                fill
                className="object-cover"
              />

              {/* Cover badge */}
              {isCover && (
                <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-amber-500 text-black text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 shadow-md">
                  <Star className="w-2.5 h-2.5 fill-current" />
                  Cover
                </div>
              )}

              {/* Hover overlay with button */}
              {!isCover && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                  <span className="text-[11px] font-medium text-white bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-md border border-white/20">
                    Set Cover
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
