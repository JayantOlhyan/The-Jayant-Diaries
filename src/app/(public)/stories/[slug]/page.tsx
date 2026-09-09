import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { MemoryRepository } from "@/server/repositories/memory-repository";
import { PlaceRepository } from "@/server/repositories/place-repository";
import { TripRepository } from "@/server/repositories/trip-repository";
import { MediaRepository } from "@/server/repositories/media-repository";
import { ImageFrame } from "@/components/ui/image-frame";

interface StoryPageProps {
  params: Promise<{ slug: string }>;
}

const STORY_IMAGES: Record<string, string> = {
  "mem11111-1111-4111-a111-111111111111":
    "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1600&auto=format&fit=crop&q=80",
  "mem22222-2222-4222-a222-222222222222":
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&auto=format&fit=crop&q=80",
  "mem33333-3333-4333-a333-333333333333":
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&auto=format&fit=crop&q=80",
};

const DEFAULT_STORY_IMAGE =
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&auto=format&fit=crop&q=80";

async function findMemory(slug: string) {
  let memory = await MemoryRepository.getPublicMemoryById(slug);
  if (!memory) {
    const allPublic = await MemoryRepository.getPublicMemories();
    memory =
      allPublic.find(
        (m) =>
          m.id === slug ||
          m.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") === slug
      ) || null;
  }
  return memory;
}

export async function generateMetadata({ params }: StoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const memory = await findMemory(slug);
  if (!memory) {
    return { title: "Story Not Found — The Jayant Diaries" };
  }
  return {
    title: `${memory.title} — The Jayant Diaries`,
    description: memory.description || memory.journal?.slice(0, 160) || "A travel story by Jayant.",
  };
}

export default async function StoryDetailPage({ params }: StoryPageProps) {
  const { slug } = await params;
  const memory = await findMemory(slug);

  if (!memory) notFound();

  const [place, trip, allMedia, allPublicMemories] = await Promise.all([
    memory.place_id ? PlaceRepository.getPlaceById(memory.place_id) : Promise.resolve(null),
    memory.trip_id ? TripRepository.getTripById(memory.trip_id) : Promise.resolve(null),
    MediaRepository.getPublicMedia(),
    MemoryRepository.getPublicMemories(),
  ]);

  const mediaForMemory = allMedia.find((m) => m.memory_id === memory.id);
  const heroImage =
    STORY_IMAGES[memory.id] ||
    mediaForMemory?.storage_url ||
    DEFAULT_STORY_IMAGE;

  const wordCount = ((memory.journal || "") + " " + (memory.description || "")).split(
    /\s+/
  ).length;
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 180));

  // Find other stories for the "Next Stories" footer
  const otherStories = allPublicMemories
    .filter((m) => m.id !== memory.id)
    .slice(0, 2);

  return (
    <article className="min-h-screen bg-cinema-black text-white selection:bg-cinema-accent selection:text-white pb-32">
      {/* Top Breadcrumb & Navigation */}
      <div className="border-b border-cinema-border/60 bg-cinema-card/30">
        <div className="mx-auto max-w-4xl px-6 py-6 flex items-center justify-between text-xs font-mono text-cinema-muted">
          <Link
            href="/stories"
            className="hover:text-cinema-accent transition-colors flex items-center gap-1.5"
          >
            <span>←</span> Back to Stories
          </Link>
          {trip && (
            <Link
              href={`/journeys/${trip.slug}`}
              className="text-white hover:text-cinema-accent transition-colors truncate max-w-[200px] sm:max-w-none"
            >
              Part of: <span className="underline decoration-cinema-border">{trip.title}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Story Header */}
      <header className="mx-auto max-w-3xl px-6 pt-16 pb-12 text-center">
        <div className="flex items-center justify-center gap-3 text-xs uppercase tracking-[0.25em] text-cinema-accent mb-6 font-mono">
          <span>Field Note</span>
          {place && (
            <>
              <span>•</span>
              <span className="text-white/80">{place.name}</span>
            </>
          )}
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-white leading-tight">
          {memory.title}
        </h1>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-cinema-muted font-mono border-y border-cinema-border/60 py-4 max-w-xl mx-auto">
          {memory.date && (
            <div>
              <span className="text-cinema-muted/60">Date:</span>{" "}
              <span className="text-white">
                {new Date(memory.date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
          <div>
            <span className="text-cinema-muted/60">Reading time:</span>{" "}
            <span className="text-white">{readTimeMinutes} min</span>
          </div>
          <div>
            <span className="text-cinema-muted/60">Author:</span>{" "}
            <span className="text-white">Jayant Olhyan</span>
          </div>
        </div>
      </header>

      {/* Hero Image */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 mb-16">
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-cinema-border/80 shadow-2xl">
          <ImageFrame
            src={heroImage}
            alt={memory.title}
            fill
            priority
          />
        </div>
        {mediaForMemory?.caption && (
          <p className="mt-3 text-center text-xs italic text-cinema-muted font-serif">
            {mediaForMemory.caption}
          </p>
        )}
      </div>

      {/* Narrative Story Content */}
      <div className="mx-auto max-w-2xl px-6">
        <div className="space-y-6 text-base sm:text-lg leading-relaxed text-zinc-300 font-light">
          {/* Highlight lead paragraph */}
          {memory.description && (
            <p className="text-lg sm:text-xl font-serif italic text-white/90 leading-relaxed border-l-2 border-cinema-accent pl-6 my-8">
              &ldquo;{memory.description}&rdquo;
            </p>
          )}

          {/* Journal narrative body */}
          {memory.journal ? (
            <div className="space-y-6 first-letter:text-5xl first-letter:font-serif first-letter:float-left first-letter:mr-3 first-letter:text-cinema-accent first-letter:leading-none">
              {memory.journal.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          ) : (
            <p className="italic text-cinema-muted">
              No extended field notes were recorded for this entry.
            </p>
          )}
        </div>

        {/* Place & Journey Context Card */}
        {(place || trip) && (
          <div className="mt-16 rounded-xl border border-cinema-border/60 bg-cinema-card/40 p-6 sm:p-8 space-y-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cinema-muted font-mono">
              Geographic & Journey Context
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {place && (
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-cinema-muted">Location</h4>
                  <p className="font-serif text-base text-white mt-1">{place.name}</p>
                  {place.latitude && place.longitude && (
                    <p className="text-xs text-cinema-muted font-mono mt-0.5">
                      {place.latitude.toFixed(4)}° N, {place.longitude.toFixed(4)}° E
                    </p>
                  )}
                </div>
              )}
              {trip && (
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-cinema-muted">From the Journey</h4>
                  <Link
                    href={`/journeys/${trip.slug}`}
                    className="font-serif text-base text-cinema-accent hover:underline block mt-1"
                  >
                    {trip.title} →
                  </Link>
                  <p className="text-xs text-cinema-muted mt-0.5">Explore full expedition</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Author Sign-off */}
        <div className="mt-16 pt-8 border-t border-cinema-border/60 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-cinema-border/80 border border-cinema-border flex items-center justify-center font-serif text-lg font-bold text-cinema-accent">
            J
          </div>
          <div>
            <h4 className="text-sm font-serif font-medium text-white">Jayant Olhyan</h4>
            <p className="text-xs text-cinema-muted">
              Creator of The Jayant Diaries • Preserving journeys on personal servers
            </p>
          </div>
        </div>
      </div>

      {/* Further Exploration */}
      {otherStories.length > 0 && (
        <section className="mx-auto max-w-4xl px-6 mt-24 pt-16 border-t border-cinema-border/60">
          <h3 className="font-serif text-2xl text-white mb-8">More Field Notes</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {otherStories.map((s) => (
              <Link
                key={s.id}
                href={`/stories/${s.id}`}
                className="group rounded-lg border border-cinema-border/60 bg-cinema-card/30 p-6 transition-all duration-300 hover:border-cinema-border hover:bg-cinema-card/60"
              >
                <span className="text-[10px] font-mono uppercase text-cinema-accent tracking-wider">
                  {s.date ? new Date(s.date).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "Archive"}
                </span>
                <h4 className="font-serif text-lg text-white group-hover:text-cinema-accent transition-colors mt-2">
                  {s.title}
                </h4>
                <p className="text-xs text-cinema-muted line-clamp-2 mt-2 leading-relaxed">
                  {s.description || s.journal}
                </p>
                <span className="text-xs text-cinema-accent group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 mt-4">
                  Read Note →
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
