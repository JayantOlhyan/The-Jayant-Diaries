'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Maximize2, Grid, Film } from 'lucide-react';
import { MediaRow } from '@/types/entities';
import { getNormalizedImageUrl, getImageAlt } from '@/lib/utils/image-provider';
import { ImageLightbox } from './image-lightbox';
import { ImageFrame } from '@/components/ui/image-frame';

interface ImageGalleryProps {
  images: MediaRow[];
  title?: string;
  initialIndex?: number;
  showLayoutToggle?: boolean;
}

export function ImageGallery({
  images,
  title,
  initialIndex = 0,
  showLayoutToggle = true,
}: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'featured' | 'grid'>('featured');

  if (!images || images.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
        <p className="text-sm text-neutral-400">No images available for this collection.</p>
      </div>
    );
  }

  const activeImage = images[currentIndex] || images[0];
  const activeUrl = getNormalizedImageUrl(activeImage.storage_url || activeImage.thumbnail_url || '');
  const activeAlt = getImageAlt(activeImage);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="space-y-4">
      {/* Header with Title & Controls */}
      <div className="flex items-center justify-between">
        {title && (
          <h3 className="text-sm font-mono uppercase tracking-widest text-neutral-300">
            {title}
          </h3>
        )}
        <div className="flex items-center gap-3 ml-auto">
          {images.length > 1 && (
            <span className="text-xs font-mono text-neutral-400">
              {currentIndex + 1} / {images.length}
            </span>
          )}

          {showLayoutToggle && images.length > 1 && (
            <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setLayoutMode('featured')}
                className={`p-1.5 rounded transition-colors ${
                  layoutMode === 'featured'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Featured filmstrip view"
                aria-label="Switch to featured view"
              >
                <Film className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('grid')}
                className={`p-1.5 rounded transition-colors ${
                  layoutMode === 'grid'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Grid view"
                aria-label="Switch to grid view"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {layoutMode === 'featured' ? (
        <>
          {/* Main Featured View */}
          <div className="relative group aspect-video sm:aspect-[16/10] w-full rounded-xl overflow-hidden bg-neutral-900/80 border border-white/10 shadow-lg">
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              className="w-full h-full cursor-zoom-in relative block text-left"
              aria-label="Open image in fullscreen lightbox"
            >
              <ImageFrame
                src={activeUrl}
                alt={activeAlt}
                fill
                priority
                className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />

              {/* Expand Overlay Icon */}
              <div className="absolute top-4 right-4 p-2.5 rounded-full bg-black/60 text-white/80 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity border border-white/10">
                <Maximize2 className="w-4 h-4" />
              </div>

              {/* Caption Gradient Overlay */}
              {activeImage.caption && (
                <div className="absolute bottom-0 inset-x-0 p-4 sm:p-6 bg-gradient-to-t from-black/85 via-black/40 to-transparent">
                  <p className="text-sm sm:text-base font-medium text-white/95">
                    {activeImage.caption}
                  </p>
                  {activeImage.alt_text && activeImage.alt_text !== activeImage.caption && (
                    <p className="text-xs text-neutral-400 mt-1 italic">
                      {activeImage.alt_text}
                    </p>
                  )}
                </div>
              )}
            </button>

            {/* Previous Arrow */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white backdrop-blur-md border border-white/10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* Next Arrow */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white backdrop-blur-md border border-white/10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Filmstrip Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {images.map((img, index) => {
                const thumbUrl = getNormalizedImageUrl(img.thumbnail_url || img.storage_url || '');
                const isSelected = index === currentIndex;

                return (
                  <button
                    key={img.id || index}
                    type="button"
                    onClick={() => setCurrentIndex(index)}
                    className={`relative flex-shrink-0 w-20 sm:w-24 aspect-[4/3] rounded-lg overflow-hidden border transition-all duration-150 ${
                      isSelected
                        ? 'border-amber-400 ring-2 ring-amber-400/30 scale-105 z-10 opacity-100'
                        : 'border-white/10 opacity-60 hover:opacity-100 hover:border-white/30'
                    }`}
                    aria-label={`Select photo ${index + 1} of ${images.length}`}
                  >
                    <ImageFrame
                      src={thumbUrl}
                      alt={getImageAlt(img)}
                      fill
                      className="object-cover"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Grid Layout View */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((img, index) => {
            const url = getNormalizedImageUrl(img.thumbnail_url || img.storage_url || '');
            return (
              <button
                key={img.id || index}
                type="button"
                onClick={() => {
                  setCurrentIndex(index);
                  setIsLightboxOpen(true);
                }}
                className="group relative aspect-square rounded-xl overflow-hidden bg-neutral-900 border border-white/10 hover:border-white/30 transition-all text-left"
                aria-label={`Open photo ${index + 1} in lightbox`}
              >
                <ImageFrame
                  src={url}
                  alt={getImageAlt(img)}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Maximize2 className="w-5 h-5 text-white/90" />
                </div>
                {img.caption && (
                  <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-xs text-white/90 truncate font-sans">
                      {img.caption}
                    </p>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      <ImageLightbox
        images={images}
        currentIndex={currentIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        onNavigate={(newIdx) => setCurrentIndex(newIdx)}
      />
    </div>
  );
}
