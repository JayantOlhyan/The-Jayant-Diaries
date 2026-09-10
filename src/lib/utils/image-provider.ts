/**
 * Simple image provider abstraction layer.
 * Normalizes external image URLs (e.g. Unsplash, Supabase, generic URLs)
 * and provides safe fallbacks for broken or missing images.
 */

export const FALLBACK_IMAGE_URL = '';

export const FALLBACK_THUMBNAIL_URL = '';

export interface ImageFormatOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'jpg';
}

/**
 * Normalizes an image URL, applying dimension and quality parameters
 * if the host supports standard URL transformations (e.g. Unsplash).
 */
export function getNormalizedImageUrl(
  url?: string | null,
  options: ImageFormatOptions = {}
): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return FALLBACK_IMAGE_URL;
  }

  const trimmed = url.trim();

  // If path is a Supabase storage path starting with media/
  if (trimmed.startsWith('media/')) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock-project.supabase.co';
    return `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/media/${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);

    // Unsplash optimization parameters
    if (parsed.hostname === 'images.unsplash.com') {
      if (options.width) parsed.searchParams.set('w', options.width.toString());
      if (options.height) parsed.searchParams.set('h', options.height.toString());
      parsed.searchParams.set('q', (options.quality || 80).toString());
      parsed.searchParams.set('auto', options.format || 'format');
      parsed.searchParams.set('fit', 'crop');
      return parsed.toString();
    }

    return trimmed;
  } catch {
    // If relative path like /images/... preserve it, otherwise return safe empty fallback
    return trimmed.startsWith('/') ? trimmed : FALLBACK_IMAGE_URL;
  }
}

/**
 * Returns accessible alt text with safe fallback. Accepts either a media object or separate string parameters.
 */
export function getImageAlt(
  input?: { caption?: string | null; alt_text?: string | null; filename?: string } | string | null,
  altText?: string | null,
  fallback = 'Travel photograph'
): string {
  if (input && typeof input === 'object') {
    if (input.alt_text && typeof input.alt_text === 'string' && input.alt_text.trim() !== '') {
      return input.alt_text.trim();
    }
    if (input.caption && typeof input.caption === 'string' && input.caption.trim() !== '') {
      return input.caption.trim();
    }
    return fallback;
  }

  if (altText && typeof altText === 'string' && altText.trim() !== '') return altText.trim();
  if (input && typeof input === 'string' && input.trim() !== '') return input.trim();
  return fallback;
}

