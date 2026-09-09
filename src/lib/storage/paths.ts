/**
 * Deterministic storage path conventions for The Jayant Diaries.
 * Guarantees persistent, immutable asset addressing independent of display captions or file renames.
 */

export type MediaVariant = 'original' | 'large' | 'medium' | 'small' | 'thumbnail';

export interface StoragePathConfig {
  mediaId: string;
  variant?: MediaVariant;
  extension?: string;
}

/**
 * Builds the canonical storage path within the Supabase Storage bucket.
 * Example: media/550e8400-e29b-41d4-a716-446655440000/thumbnail.webp
 */
export function getStoragePath({
  mediaId,
  variant = 'original',
  extension = 'webp',
}: StoragePathConfig): string {
  const ext = variant === 'original' && extension ? `.${extension.replace(/^\./, '')}` : '.webp';
  return `media/${mediaId}/${variant}${ext}`;
}

/**
 * Extracts mediaId and variant from a canonical storage path.
 */
export function parseStoragePath(path: string): { mediaId: string; variant: string } | null {
  const match = path.match(/^media\/([a-f0-9-]+)\/([a-z]+)\.[a-z0-9]+$/i);
  if (!match) return null;
  return {
    mediaId: match[1],
    variant: match[2],
  };
}

/**
 * Generates the public CDN URL for a given bucket and path.
 */
export function getPublicMediaUrl(supabaseUrl: string, bucket: string, path: string): string {
  const cleanBase = supabaseUrl.replace(/\/$/, '');
  const cleanPath = path.replace(/^\//, '');
  return `${cleanBase}/storage/v1/object/public/${bucket}/${cleanPath}`;
}
