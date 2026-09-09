import { describe, it, expect } from "vitest";
import { extractYouTubeId, getYouTubeInfo } from "../../utils/youtube";

describe("YouTube URL Parser", () => {
  it("extracts ID from standard watch URL", () => {
    const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    expect(extractYouTubeId(url)).toBe("dQw4w9WgXcQ");
  });

  it("extracts ID with additional query params", () => {
    const url = "https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ&t=42s";
    expect(extractYouTubeId(url)).toBe("dQw4w9WgXcQ");
  });

  it("extracts ID from youtu.be short URL", () => {
    const url = "https://youtu.be/dQw4w9WgXcQ";
    expect(extractYouTubeId(url)).toBe("dQw4w9WgXcQ");
  });

  it("extracts ID from embed URL", () => {
    const url = "https://www.youtube.com/embed/dQw4w9WgXcQ";
    expect(extractYouTubeId(url)).toBe("dQw4w9WgXcQ");
  });

  it("extracts ID from shorts URL", () => {
    const url = "https://www.youtube.com/shorts/dQw4w9WgXcQ";
    expect(extractYouTubeId(url)).toBe("dQw4w9WgXcQ");
  });

  it("returns null for invalid URLs", () => {
    expect(extractYouTubeId("https://vimeo.com/12345678")).toBeNull();
    expect(extractYouTubeId("not a url")).toBeNull();
    expect(extractYouTubeId("")).toBeNull();
  });

  it("constructs full YouTube info with thumbnail and embed", () => {
    const info = getYouTubeInfo("https://youtu.be/dQw4w9WgXcQ");
    expect(info).toEqual({
      videoId: "dQw4w9WgXcQ",
      thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    });
  });
});
