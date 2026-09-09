/**
 * YouTube URL Parser & Metadata Utility
 */

export interface YouTubeVideoInfo {
  videoId: string;
  thumbnailUrl: string;
  embedUrl: string;
}

/**
 * Extracts the 11-character YouTube video ID from various YouTube URL formats.
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // Handle direct 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Regex patterns covering standard, short, embed, and shorts formats
  const patterns = [
    /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]{11})/i,
    /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/i,
    /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/i,
    /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/i,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Generates YouTube metadata from a URL.
 */
export function getYouTubeInfo(url: string): YouTubeVideoInfo | null {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;

  return {
    videoId,
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
  };
}
