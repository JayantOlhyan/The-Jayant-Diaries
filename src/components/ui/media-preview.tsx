'use client';

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";
import { MediaType, VisibilityType } from "@/types/database";
import { getNormalizedImageUrl, FALLBACK_IMAGE_URL } from "@/lib/utils/image-provider";

export interface MediaPreviewProps {
  storageUrl: string;
  thumbnailUrl?: string | null;
  filename: string;
  type?: MediaType;
  visibility?: VisibilityType;
  caption?: string | null;
  className?: string;
  onClick?: () => void;
}

export function MediaPreview({
  storageUrl,
  thumbnailUrl,
  filename,
  type = "PHOTO",
  visibility,
  caption,
  className,
  onClick,
}: MediaPreviewProps) {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  const displayUrl = hasError
    ? FALLBACK_IMAGE_URL
    : getNormalizedImageUrl(thumbnailUrl || storageUrl);

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative aspect-video overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950",
        onClick && "cursor-pointer",
        className
      )}
    >
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-zinc-900 animate-pulse flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-zinc-700 border-t-transparent animate-spin" />
        </div>
      )}

      <Image
        src={displayUrl}
        alt={caption || filename}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          if (!hasError) setHasError(true);
        }}
        className={cn(
          "object-cover transition-transform duration-500 group-hover:scale-105",
          !isLoaded && "opacity-0",
          isLoaded && "opacity-100"
        )}
      />
      {/* Top badges */}
      <div className="absolute top-2 left-2 flex gap-1.5 z-10">
        {type !== "PHOTO" && (
          <span className="rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase backdrop-blur-sm">
            {type}
          </span>
        )}
        {visibility && visibility !== "PUBLIC" && (
          <Badge variant={visibility === "PRIVATE" ? "private" : "unlisted"}>
            {visibility}
          </Badge>
        )}
      </div>

      {/* Caption overlay on hover */}
      {caption && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-6 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <p className="text-xs text-zinc-200 line-clamp-1">{caption}</p>
        </div>
      )}
    </div>
  );
}
