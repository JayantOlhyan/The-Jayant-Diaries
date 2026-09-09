'use client';

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { getNormalizedImageUrl, FALLBACK_IMAGE_URL } from "@/lib/utils/image-provider";

export interface ImageFrameProps {
  src: string;
  alt: string;
  aspectRatio?: "16/9" | "4/3" | "1/1" | "9/16" | "21/9";
  priority?: boolean;
  className?: string;
  imageClassName?: string;
  fill?: boolean;
}

export function ImageFrame({
  src,
  alt,
  aspectRatio = "16/9",
  priority = false,
  className,
  imageClassName,
  fill = false,
}: ImageFrameProps) {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  const aspectClasses = {
    "16/9": "aspect-video",
    "4/3": "aspect-[4/3]",
    "1/1": "aspect-square",
    "9/16": "aspect-[9/16]",
    "21/9": "aspect-[21/9]",
  };

  const imageSrc = hasError ? FALLBACK_IMAGE_URL : getNormalizedImageUrl(src);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-zinc-900 border border-zinc-800/80",
        fill ? "w-full h-full" : aspectClasses[aspectRatio],
        className
      )}
    >
      {/* Loading Skeleton */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-zinc-900 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-transparent animate-spin" />
        </div>
      )}

      <Image
        src={imageSrc}
        alt={alt || "Travel photograph"}
        fill
        priority={priority}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 60vw"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          if (!hasError) setHasError(true);
        }}
        className={cn(
          "object-cover transition-opacity duration-300",
          !isLoaded && "opacity-0",
          isLoaded && "opacity-100",
          imageClassName
        )}
      />

      {hasError && (
        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/75 backdrop-blur-sm text-[10px] text-zinc-400">
          Archived fallback
        </div>
      )}
    </div>
  );
}
