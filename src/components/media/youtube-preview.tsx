'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Play, ExternalLink, Video } from 'lucide-react';
import { MediaRow } from '@/types/entities';
import { ImageFrame } from '@/components/ui/image-frame';

interface YouTubePreviewProps {
  media?: MediaRow;
  youtubeId?: string;
  youtubeUrl?: string;
  title?: string;
  caption?: string;
  thumbnailUrl?: string;
  autoplay?: boolean;
}

export function extractYouTubeId(input: string): string {
  if (!input) return '';
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
  const match = input.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : '';
}

export function YouTubePreview({
  media,
  youtubeId: explicitId,
  youtubeUrl: explicitUrl,
  title: explicitTitle,
  caption: explicitCaption,
  thumbnailUrl: explicitThumbnail,
  autoplay = true,
}: YouTubePreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Derive YouTube video ID
  const rawId =
    explicitId ||
    (media?.storage_path?.startsWith('youtube/') ? media.storage_path.replace('youtube/', '') : '') ||
    (media?.storage_url ? extractYouTubeId(media.storage_url) : '');

  const videoId = extractYouTubeId(rawId || '');
  const title = explicitTitle || media?.caption || 'YouTube Video';
  const caption = explicitCaption || media?.alt_text || null;
  const watchUrl = explicitUrl || media?.storage_url || `https://www.youtube.com/watch?v=${videoId}`;
  const thumb =
    explicitThumbnail ||
    media?.thumbnail_url ||
    (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '');

  if (!videoId) {
    return (
      <div className="aspect-video w-full rounded-xl bg-neutral-900 border border-white/10 flex flex-col items-center justify-center p-6 text-center">
        <Video className="w-8 h-8 text-neutral-500 mb-2" />
        <p className="text-sm text-neutral-400">Invalid YouTube video reference.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10 shadow-lg group">
        {isPlaying ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&rel=0&modestbranding=1`}
            title={title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsPlaying(true)}
            className="w-full h-full relative block text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500"
            aria-label={`Play video: ${title}`}
          >
            {/* Thumbnail */}
            <ImageFrame
              src={thumb}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Dark vignette overlay */}
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />

            {/* YouTube Red Play Button Badge */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-12 sm:w-20 sm:h-14 bg-red-600/90 group-hover:bg-red-600 text-white rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-200 group-hover:scale-110">
                <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-current ml-1" />
              </div>
            </div>

            {/* Title & YouTube Indicator Banner */}
            <div className="absolute top-0 inset-x-0 p-3 sm:p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-red-400 bg-black/60 px-2 py-0.5 rounded border border-red-500/20 backdrop-blur-sm">
                YouTube
              </span>
              <a
                href={watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 rounded-full bg-black/60 text-white/70 hover:text-white border border-white/10 hover:border-white/30 backdrop-blur-sm transition-colors"
                title="Watch on YouTube"
                aria-label="Open video on YouTube"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Bottom Caption Overlay */}
            {title && (
              <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                <p className="text-sm sm:text-base font-medium text-white/95 truncate">
                  {title}
                </p>
                {caption && (
                  <p className="text-xs text-neutral-400 line-clamp-1 mt-0.5">
                    {caption}
                  </p>
                )}
              </div>
            )}
          </button>
        )}
      </div>

      {/* External Link Footer */}
      <div className="flex items-center justify-between text-xs text-neutral-400 px-1 font-mono">
        <span>Video ID: {videoId}</span>
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-amber-400 transition-colors flex items-center gap-1"
        >
          Watch on YouTube
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
