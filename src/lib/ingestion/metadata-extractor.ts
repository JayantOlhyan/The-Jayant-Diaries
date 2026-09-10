import exifr from 'exifr';
import { ExtractedMediaMetadata } from '@/types/ingestion';
import { isValidCoordinate } from '@/lib/validation/coordinates';

/**
 * Computes a deterministic SHA-256 hash from a File or ArrayBuffer.
 */
export async function computeContentHash(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Parses EXIF date strings (e.g., "2026:06:12 08:14:00") or Date objects into a valid ISO 8601 string.
 */
export function parseExifDate(rawDate: unknown): string | null {
  if (!rawDate) return null;

  if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
    return rawDate.toISOString();
  }

  if (typeof rawDate === 'string') {
    const trimmed = rawDate.trim();
    // Common EXIF format: "YYYY:MM:DD HH:MM:SS"
    const match = trimmed.match(/^(\d{4})[:\-](\d{2})[:\-](\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
    if (match) {
      const [, year, month, day, hour, min, sec] = match;
      const parsed = new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}Z`);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }

    // Try standard ISO parse
    const directParsed = new Date(trimmed);
    if (!isNaN(directParsed.getTime())) {
      return directParsed.toISOString();
    }
  }

  return null;
}

/**
 * Extracts dimensions and duration for video files in the browser environment.
 */
async function extractVideoDimensions(file: File): Promise<{
  width: number | null;
  height: number | null;
  duration: number | null;
}> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { width: null, height: null, duration: null };
  }

  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    const objectUrl = URL.createObjectURL(file);

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute('src');
      video.load();
    };

    video.onloadedmetadata = () => {
      const width = video.videoWidth || null;
      const height = video.videoHeight || null;
      const duration = Number.isFinite(video.duration) ? Math.round(video.duration) : null;
      cleanup();
      resolve({ width, height, duration });
    };

    video.onerror = () => {
      cleanup();
      resolve({ width: null, height: null, duration: null });
    };

    video.src = objectUrl;
  });
}

/**
 * Extracts dimensions for images when EXIF doesn't supply them.
 */
async function extractImageDimensionsFallback(file: File): Promise<{
  width: number | null;
  height: number | null;
}> {
  if (typeof window === 'undefined' || typeof Image === 'undefined') {
    return { width: null, height: null };
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
    };

    img.onload = () => {
      const width = img.naturalWidth || null;
      const height = img.naturalHeight || null;
      cleanup();
      resolve({ width, height });
    };

    img.onerror = () => {
      cleanup();
      resolve({ width: null, height: null });
    };

    img.src = objectUrl;
  });
}

/**
 * Deterministically extracts metadata from a media File (Photo or Video).
 * Never hallucinates or substitutes dates/coordinates.
 */
export async function extractMediaMetadata(file: File): Promise<ExtractedMediaMetadata> {
  const buffer = await file.arrayBuffer();
  const contentHash = await computeContentHash(buffer);

  const isVideo =
    file.type.startsWith('video/') ||
    file.name.toLowerCase().endsWith('.mp4') ||
    file.name.toLowerCase().endsWith('.mov') ||
    file.name.toLowerCase().endsWith('.webm');

  let width: number | null = null;
  let height: number | null = null;
  let duration: number | null = null;
  let takenAt: string | null = null;
  let latitude: number | null = null;
  let longitude: number | null = null;
  let orientation: number | null = null;

  if (isVideo) {
    const videoDims = await extractVideoDimensions(file);
    width = videoDims.width;
    height = videoDims.height;
    duration = videoDims.duration;
  } else {
    // Photo: Attempt EXIF extraction
    try {
      const exif = await exifr.parse(buffer, {
        tiff: true,
        xmp: true,
        gps: true,
        exif: true,
        mergeOutput: true,
      });

      if (exif) {
        // Date extraction
        const rawDate = exif.DateTimeOriginal || exif.CreateDate || exif.ModifyDate;
        takenAt = parseExifDate(rawDate);

        // GPS extraction
        if (
          typeof exif.latitude === 'number' &&
          typeof exif.longitude === 'number' &&
          isValidCoordinate(exif.latitude, exif.longitude)
        ) {
          latitude = exif.latitude;
          longitude = exif.longitude;
        }

        // Dimensions and orientation
        width = typeof exif.ImageWidth === 'number' ? exif.ImageWidth : (exif.ExifImageWidth || null);
        height = typeof exif.ImageHeight === 'number' ? exif.ImageHeight : (exif.ExifImageHeight || null);
        orientation = typeof exif.Orientation === 'number' ? exif.Orientation : null;
      }
    } catch {
      // Non-fatal: Image without EXIF header
    }

    // Fallback image dimensions if EXIF lacked them
    if (!width || !height) {
      const imgDims = await extractImageDimensionsFallback(file);
      if (imgDims.width && imgDims.height) {
        width = imgDims.width;
        height = imgDims.height;
      }
    }
  }

  const hasGps = latitude !== null && longitude !== null;

  return {
    filename: file.name,
    mimeType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
    fileSizeBytes: file.size,
    width,
    height,
    duration,
    takenAt,
    latitude,
    longitude,
    orientation,
    hasGps,
    contentHash,
  };
}
