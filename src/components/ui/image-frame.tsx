'use client';

import * as React from "react";
import Image from "next/image";
import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { getNormalizedImageUrl } from "@/lib/utils/image-provider";

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

  const imageSrc = getNormalizedImageUrl(src);
  const isUnavailable = hasError || !imageSrc;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-zinc-900 border border-zinc-800/80",
        fill ? "w-full h-full" : aspectClasses[aspectRatio],
        className
      )}
    >
      {/* Loading Skeleton */}
      {!isLoaded && !isUnavailable && (
        <div className="absolute inset-0 bg-zinc-900 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-transparent animate-spin" />
        </div>
      )}

      {isUnavailable ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 text-zinc-500 select-none p-3 text-center">
          <Camera className="w-6 h-6 stroke-[1.2] mb-1 opacity-50" />
          <span className="text-[10px] font-mono tracking-wider uppercase text-zinc-500">Media Unavailable</span>
        </div>
      ) : (
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
      )}
    </div>
  );
}
