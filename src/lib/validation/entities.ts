import { z } from "zod";

export const visibilityEnum = z.enum(["PUBLIC", "UNLISTED", "PRIVATE"]);
export const tripStatusEnum = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
export const mediaTypeEnum = z.enum(["PHOTO", "VIDEO", "REEL", "STORY", "AUDIO", "DOCUMENT"]);
export const instagramTypeEnum = z.enum(["POST", "REEL", "CAROUSEL"]);

export const tripSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().optional().nullable(),
  cover_media_id: z.string().uuid().optional().nullable(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").optional().nullable(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").optional().nullable(),
  status: tripStatusEnum.default("DRAFT"),
  featured: z.boolean().default(false),
  visibility: visibilityEnum.default("PRIVATE"),
});

export const daySchema = z.object({
  trip_id: z.string().uuid(),
  day_number: z.number().int().positive("Day number must be greater than 0"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  title: z.string().max(160).optional().nullable(),
  description: z.string().optional().nullable(),
  journal: z.string().optional().nullable(),
  cover_media_id: z.string().uuid().optional().nullable(),
});

export const placeSchema = z.object({
  name: z.string().min(1, "Place name is required").max(160),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  country: z.string().default("India"),
  state: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  description: z.string().optional().nullable(),
  cover_media_id: z.string().uuid().optional().nullable(),
});

export const memorySchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional().nullable(),
  journal: z.string().optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  trip_id: z.string().uuid().optional().nullable(),
  day_id: z.string().uuid().optional().nullable(),
  place_id: z.string().uuid().optional().nullable(),
  featured: z.boolean().default(false),
  visibility: visibilityEnum.default("PRIVATE"),
});

export const mediaMetadataSchema = z.object({
  filename: z.string().min(1),
  mime_type: z.string().min(1),
  type: mediaTypeEnum.default("PHOTO"),
  width: z.number().int().positive().optional().nullable(),
  height: z.number().int().positive().optional().nullable(),
  duration: z.number().positive().optional().nullable(),
  file_size_bytes: z.number().int().positive().optional().nullable(),
  content_hash: z.string().optional().nullable(),
  taken_at: z.string().datetime().optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  caption: z.string().optional().nullable(),
  visibility: visibilityEnum.default("PRIVATE"),
});
