'use client';

import React, { useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, ExternalLink, Maximize2 } from 'lucide-react';
import { MediaRow } from '@/types/entities';
import { getNormalizedImageUrl, getImageAlt } from '@/lib/utils/image-provider';

interface ImageLightboxProps {
  images: MediaRow[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
}

export function ImageLightbox({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
}: ImageLightboxProps) {
  const currentImage = images[currentIndex];
  const touchStartX = useRef<number | null>(null);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    } else {
      onNavigate(images.length - 1); // wrap around
    }
  }, [currentIndex, images.length, onNavigate]);

  const handleNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      onNavigate(currentIndex + 1);
    } else {
      onNavigate(0); // wrap around
    }
  }, [currentIndex, images.length, onNavigate]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll while lightbox is open
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, handlePrev, handleNext]);

  // Touch gesture handling for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartX.current;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handlePrev();
      } else {
        handleNext();
      }
    }
    touchStartX.current = null;
  };

  if (!isOpen || !currentImage) return null;

  const imageUrl = getNormalizedImageUrl(currentImage.storage_url || currentImage.thumbnail_url || '');
  const imageAlt = getImageAlt(currentImage);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image Lightbox"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md select-none transition-opacity duration-200"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Bar: Counter & Controls */}
      <div className="absolute top-0 inset-x-0 p-4 sm:p-6 flex items-center justify-between z-50 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono tracking-widest text-white/70 uppercase">
            {currentIndex + 1} / {images.length}
          </span>
          {currentImage.visibility === 'PRIVATE' && (
            <span className="px-2 py-0.5 text-[10px] font-mono tracking-widest uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
              Private
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {imageUrl && (
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-colors"
              title="Open full size"
              aria-label="Open full resolution image in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
            aria-label="Close image lightbox"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation: Previous */}
      {images.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-50 p-3 sm:p-4 text-white/70 hover:text-white bg-black/40 hover:bg-black/70 rounded-full border border-white/10 backdrop-blur-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Navigation: Next */}
      {images.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-50 p-3 sm:p-4 text-white/70 hover:text-white bg-black/40 hover:bg-black/70 rounded-full border border-white/10 backdrop-blur-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="Next image"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Main Image Container */}
      <div
        className="relative max-w-7xl max-h-[82vh] w-full h-full flex flex-col items-center justify-center p-4 sm:p-8"
        onClick={onClose}
      >
        <div
          className="relative max-w-full max-h-full flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <Image
            src={imageUrl}
            alt={imageAlt}
            width={currentImage.width || 1920}
            height={currentImage.height || 1080}
            className="max-w-full max-h-[75vh] w-auto h-auto object-contain rounded-lg shadow-2xl transition-transform duration-200 select-none"
            priority
            unoptimized={imageUrl.startsWith('http')}
          />
        </div>

        {/* Caption & Metadata Footer */}
        {(currentImage.caption || currentImage.alt_text) && (
          <div
            className="mt-4 text-center max-w-2xl px-4"
            onClick={(e) => e.stopPropagation()}
          >
            {currentImage.caption && (
              <p className="text-sm font-medium text-white/90">
                {currentImage.caption}
              </p>
            )}
            {currentImage.alt_text && currentImage.alt_text !== currentImage.caption && (
              <p className="text-xs text-white/50 mt-1 italic">
                {currentImage.alt_text}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
