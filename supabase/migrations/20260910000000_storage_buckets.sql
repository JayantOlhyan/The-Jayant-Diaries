-- Storage Buckets Configuration for The Jayant Diaries
-- Defines media-private (restricted, authenticated access only) and media-public (public CDN)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('media-private', 'media-private', false, 524288000, ARRAY['image/*', 'video/*']::text[]),
  ('media-public', 'media-public', true, 524288000, ARRAY['image/*', 'video/*']::text[])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;
