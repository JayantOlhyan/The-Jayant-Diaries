import { describe, it, expect } from "vitest";
import { getStoragePath, parseStoragePath, getPublicMediaUrl } from "../paths";

describe("Storage Path Conventions", () => {
  const sampleMediaId = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d";

  it("generates default original path", () => {
    const path = getStoragePath({
      mediaId: sampleMediaId,
      variant: "original",
      extension: "jpg",
    });
    expect(path).toBe(`media/${sampleMediaId}/original.jpg`);
  });

  it("generates derivative webp paths", () => {
    const thumbnailPath = getStoragePath({
      mediaId: sampleMediaId,
      variant: "thumbnail",
    });
    expect(thumbnailPath).toBe(`media/${sampleMediaId}/thumbnail.webp`);

    const largePath = getStoragePath({
      mediaId: sampleMediaId,
      variant: "large",
    });
    expect(largePath).toBe(`media/${sampleMediaId}/large.webp`);
  });

  it("parses valid storage paths", () => {
    const parsed = parseStoragePath(`media/${sampleMediaId}/thumbnail.webp`);
    expect(parsed).toEqual({
      mediaId: sampleMediaId,
      variant: "thumbnail",
    });
  });

  it("returns null for non-conforming storage paths", () => {
    expect(parseStoragePath("arbitrary/path/image.jpg")).toBeNull();
  });

  it("constructs full public CDN URL", () => {
    const url = getPublicMediaUrl(
      "https://example.supabase.co",
      "media-public",
      `media/${sampleMediaId}/thumbnail.webp`
    );
    expect(url).toBe(`https://example.supabase.co/storage/v1/object/public/media-public/media/${sampleMediaId}/thumbnail.webp`);
  });
});
