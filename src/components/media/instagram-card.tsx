'use client';

import React from 'react';
import Image from 'next/image';
import { ExternalLink, Instagram, Film, Image as ImageIcon, Calendar } from 'lucide-react';
import { MediaRow } from '@/types/entities';
import { ImageFrame } from '@/components/ui/image-frame';

interface InstagramCardProps {
  media: MediaRow;
  showCaption?: boolean;
}

export function InstagramCard({ media, showCaption = true }: InstagramCardProps) {
  const isReel = media.type === 'REEL';
  const shortcode = media.filename?.replace('instagram-', '') || media.content_hash?.replace('ig-', '') || 'post';
  const instagramUrl = media.storage_url || `https://www.instagram.com/p/${shortcode}/`;
  const thumbnailUrl = media.thumbnail_url || (media.storage_url?.includes('instagram.com') ? null : media.storage_url);

  const formattedDate = media.taken_at
    ? new Date(media.taken_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div className="group relative rounded-xl overflow-hidden bg-neutral-900 border border-white/10 hover:border-pink-500/40 transition-all duration-300 shadow-lg flex flex-col">
      {/* Top Banner with Instagram Gradient Line */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600" />

      {/* Header with Account Handle & Type Badge */}
      <div className="p-3.5 flex items-center justify-between bg-white/[0.02] border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 p-0.5 flex items-center justify-center">
            <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
              <Instagram className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-white/90 leading-tight">
              the_jayant_diaries
            </p>
            {formattedDate && (
              <p className="text-[10px] text-neutral-400 font-mono">
                {formattedDate}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded bg-pink-500/10 text-pink-400 border border-pink-500/20 flex items-center gap-1">
            {isReel ? <Film className="w-2.5 h-2.5" /> : <ImageIcon className="w-2.5 h-2.5" />}
            {isReel ? 'Reel' : 'Post'}
          </span>
        </div>
      </div>

      {/* Media Image / Visual Container */}
      <a
        href={instagramUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative aspect-square w-full bg-neutral-950 block overflow-hidden"
        aria-label={`View Instagram ${isReel ? 'reel' : 'post'} on Instagram`}
      >
        {thumbnailUrl ? (
          <ImageFrame
            src={thumbnailUrl}
            alt={media.caption || `Instagram ${isReel ? 'reel' : 'post'}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-neutral-900 to-black">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-pink-500/20 to-purple-600/20 border border-pink-500/30 flex items-center justify-center mb-3">
              <Instagram className="w-7 h-7 text-pink-400" />
            </div>
            <p className="text-xs font-mono text-neutral-400">
              Reference #{shortcode}
            </p>
            <p className="text-[11px] text-neutral-400 mt-1">
              Click to view on Instagram
            </p>
          </div>
        )}

        {/* Hover overlay with Instagram logo and external link */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <div className="px-3.5 py-1.5 rounded-full bg-white text-black text-xs font-semibold flex items-center gap-1.5 shadow-xl">
            <Instagram className="w-3.5 h-3.5 text-pink-600" />
            View on Instagram
            <ExternalLink className="w-3 h-3" />
          </div>
        </div>
      </a>

      {/* Caption & Footer */}
      {showCaption && (
        <div className="p-3.5 flex-1 flex flex-col justify-between">
          {media.caption && (
            <p className="text-xs text-neutral-300 line-clamp-3 leading-relaxed">
              {media.caption}
            </p>
          )}

          <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
            <span>#{shortcode}</span>
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-400 hover:text-pink-300 transition-colors flex items-center gap-1"
            >
              Instagram ↗
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
