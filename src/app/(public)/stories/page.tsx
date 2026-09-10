import { Metadata } from "next";
import Link from "next/link";
import { MemoryRepository } from "@/server/repositories/memory-repository";
import { PlaceRepository } from "@/server/repositories/place-repository";
import { TripRepository } from "@/server/repositories/trip-repository";
import { MediaRepository } from "@/server/repositories/media-repository";
import { ImageFrame } from "@/components/ui/image-frame";

export const metadata: Metadata = {
  title: "Stories — The Jayant Diaries",
  description: "Written accounts, quiet observations, and journal entries from the road.",
};

export default async function StoriesPage() {
  const [memories, places, trips, allMedia] = await Promise.all([
    MemoryRepository.getPublicMemories(),
    PlaceRepository.getAllPlaces(),
    TripRepository.getPublicTrips(),
    MediaRepository.getPublicMedia(),
  ]);

  const placesMap = new Map(places.map((p) => [p.id, p]));
  const tripsMap = new Map(trips.map((t) => [t.id, t]));

  const storiesWithDetails = memories.map((mem) => {
    const place = mem.place_id ? placesMap.get(mem.place_id) : null;
    const trip = mem.trip_id ? tripsMap.get(mem.trip_id) : null;
    const mediaForMemory = allMedia.find((m) => m.memory_id === mem.id);

    const imageUrl = mediaForMemory?.storage_url || "";

    const wordCount = ((mem.journal || "") + " " + (mem.description || "")).split(
      /\s+/
    ).length;
    const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 180));

    return {
      ...mem,
      place,
      trip,
      imageUrl,
      readTimeMinutes,
      slug: mem.id,
    };
  });

  const featuredStory = storiesWithDetails.find((s) => s.featured) || storiesWithDetails[0];
  const regularStories = storiesWithDetails.filter((s) => s.id !== featuredStory?.id);

  return (
    <div className="min-h-screen bg-cinema-black text-white selection:bg-cinema-accent selection:text-white pb-32">
      {/* Header Section */}
      <section className="border-b border-cinema-border/60 bg-gradient-to-b from-cinema-card/50 to-cinema-black/40 py-20 px-6 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="text-[11px] font-semibold tracking-[0.25em] text-cinema-accent uppercase">
                Field Notes & Reflections
              </span>
              <h1 className="mt-2 font-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white">
                Stories
              </h1>
              <p className="mt-3 text-sm sm:text-base text-cinema-muted max-w-xl font-light leading-relaxed">
                Written accounts, quiet observations, and journal entries from the road. Unfiltered personal travel reflections.
              </p>
            </div>
            <div className="text-right hidden md:block">
              <span className="font-serif italic text-sm text-cinema-muted/80">
                &ldquo;Words ground the memories that photos cannot hold.&rdquo;
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-16 mt-16 space-y-20">
        {storiesWithDetails.length === 0 ? (
          <div className="py-24 text-center rounded-2xl border border-white/[0.06] bg-cinema-card/20 space-y-3">
            <span className="text-xs font-mono uppercase tracking-widest text-cinema-accent">
              Archive Record
            </span>
            <p className="font-serif text-xl text-neutral-300">
              No field notes or stories published yet.
            </p>
            <p className="text-xs text-cinema-muted max-w-sm mx-auto font-light">
              Published travel journals and field notes will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Featured Story Hero Card */}
            {featuredStory && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <span className="h-px w-6 bg-cinema-accent" />
                  <span className="text-[11px] font-semibold tracking-[0.2em] text-cinema-accent uppercase">
                    Featured Narrative
                  </span>
                </div>

                <Link
                  href={`/stories/${featuredStory.slug}`}
                  className="group block relative overflow-hidden rounded-xl border border-cinema-border/80 bg-cinema-card/60 transition-all duration-300 hover:border-cinema-border"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                    <div className="relative aspect-[16/10] lg:aspect-auto lg:col-span-7 overflow-hidden">
                      <ImageFrame
                        src={featuredStory.imageUrl}
                        alt={featuredStory.title}
                        fill
                        className="transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-cinema-card via-transparent to-transparent lg:hidden" />
                    </div>

                    <div className="p-8 sm:p-12 lg:col-span-5 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-3 text-xs text-cinema-muted font-mono">
                          {featuredStory.place && (
                            <span className="text-white bg-cinema-border/40 px-2 py-0.5 rounded">
                              {featuredStory.place.name}
                            </span>
                          )}
                          <span>
                            {featuredStory.date
                              ? new Date(featuredStory.date).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : ""}
                          </span>
                        </div>

                        <h2 className="font-serif text-2xl sm:text-3xl text-white group-hover:text-cinema-accent transition-colors leading-snug">
                          {featuredStory.title}
                        </h2>

                        <p className="text-sm text-cinema-muted leading-relaxed font-light line-clamp-3">
                          {featuredStory.description || featuredStory.journal}
                        </p>
                      </div>

                      <div className="mt-8 pt-6 border-t border-cinema-border/40 flex items-center justify-between">
                        {featuredStory.trip && (
                          <span className="text-xs text-cinema-muted truncate">
                            From: <span className="text-white/80">{featuredStory.trip.title}</span>
                          </span>
                        )}
                        <span className="text-xs font-semibold uppercase tracking-wider text-cinema-accent group-hover:translate-x-1 transition-transform flex items-center gap-1.5 ml-auto">
                          Read Story <span>→</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </section>
            )}

            {/* Regular Stories Grid */}
            {regularStories.length > 0 && (
              <section className="space-y-8">
                <div className="flex items-center justify-between border-b border-cinema-border/60 pb-4">
                  <h2 className="font-serif text-2xl text-white">All Field Notes</h2>
                  <span className="text-xs text-cinema-muted font-mono">
                    {storiesWithDetails.length} {storiesWithDetails.length === 1 ? "story" : "stories"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {regularStories.map((story) => (
                    <Link
                      key={story.id}
                      href={`/stories/${story.slug}`}
                      className="group flex flex-col justify-between rounded-lg border border-cinema-border/60 bg-cinema-card/40 p-6 transition-all duration-300 hover:border-cinema-border hover:bg-cinema-card/70"
                    >
                      <div className="space-y-4">
                        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md">
                          <ImageFrame
                            src={story.imageUrl}
                            alt={story.title}
                            fill
                            className="transition-transform duration-500 ease-out group-hover:scale-105"
                          />
                        </div>

                        <div className="flex items-center gap-3 text-xs text-cinema-muted font-mono">
                          {story.place && (
                            <span className="text-cinema-accent">{story.place.name}</span>
                          )}
                          <span>•</span>
                          <span>
                            {story.date
                              ? new Date(story.date).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : ""}
                          </span>
                        </div>

                        <h3 className="font-serif text-xl text-white group-hover:text-cinema-accent transition-colors">
                          {story.title}
                        </h3>

                        <p className="text-sm text-cinema-muted line-clamp-3 leading-relaxed">
                          {story.description || story.journal}
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-cinema-border/40 flex items-center justify-between text-xs">
                        <span className="text-cinema-muted">{story.readTimeMinutes} min read</span>
                        <span className="text-cinema-accent group-hover:translate-x-1 transition-transform flex items-center gap-1">
                          Read Entry →
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Closing Note Banner */}
        <div className="border border-cinema-border/60 bg-gradient-to-r from-cinema-card/60 via-cinema-card/20 to-cinema-card/60 rounded-xl p-10 text-center space-y-3">
          <span className="text-xs uppercase tracking-[0.25em] text-cinema-muted">
            The Philosophy of Travel Writing
          </span>
          <p className="font-serif italic text-lg sm:text-xl text-white/90 max-w-xl mx-auto">
            &ldquo;We travel not to escape life, but for life not to escape us. These stories are the anchors of those fleeting roads.&rdquo;
          </p>
          <p className="text-xs text-cinema-muted/60">— Jayant Olhyan</p>
        </div>
      </div>
    </div>
  );
}
