import { Metadata } from 'next';
import Link from 'next/link';
import { StoryRepository } from '@/server/repositories/story-repository';
import { StoryWithDetails } from '@/types/entities';

export const metadata: Metadata = {
  title: 'Editorial Stories — The Jayant Diaries',
  description: 'Human-authored travel stories, field notes, and quiet observations from the road.',
};

export default async function PublicStoriesPage() {
  const stories = await StoryRepository.getPublishedStories();

  const featuredStory = stories.find((s) => s.featured) || stories[0];
  const regularStories = stories.filter((s) => s.id !== featuredStory?.id);

  return (
    <div className="min-h-screen bg-cinema-black text-white selection:bg-cinema-accent selection:text-white pb-32">
      {/* Header Section */}
      <section className="border-b border-cinema-border/60 bg-gradient-to-b from-cinema-card/50 to-cinema-black/40 py-20 px-6 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="text-[11px] font-semibold tracking-[0.25em] text-cinema-accent uppercase">
                Travel Documentaries & Reflections
              </span>
              <h1 className="mt-2 font-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white">
                Editorial Stories
              </h1>
              <p className="mt-3 text-sm sm:text-base text-cinema-muted max-w-xl font-light leading-relaxed">
                Structured stories and reflections composed directly from the personal travel archive.
              </p>
            </div>
            <div className="text-right hidden md:block">
              <span className="font-serif italic text-sm text-cinema-muted/80">
                &ldquo;Words ground the memories that photos alone cannot hold.&rdquo;
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-16 mt-16 space-y-20">
        {stories.length === 0 ? (
          <div className="py-24 text-center rounded-2xl border border-white/[0.06] bg-cinema-card/20 space-y-3">
            <span className="text-xs font-mono uppercase tracking-widest text-cinema-accent">
              Archive Record
            </span>
            <p className="font-serif text-xl text-neutral-300">
              No published stories yet.
            </p>
            <p className="text-xs text-cinema-muted max-w-sm mx-auto font-light">
              Published editorial travel stories will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Featured Story Hero */}
            {featuredStory && (
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className="h-px w-6 bg-cinema-accent" />
                  <span className="text-[11px] font-semibold tracking-[0.2em] text-cinema-accent uppercase">
                    Featured Story
                  </span>
                </div>

                <Link
                  href={`/stories/${featuredStory.slug}`}
                  className="group block relative rounded-2xl border border-white/[0.08] overflow-hidden bg-cinema-card/40 transition-all hover:border-cinema-accent/40 shadow-2xl"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[420px]">
                    <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between space-y-6 z-10">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 text-xs font-mono text-cinema-accent uppercase tracking-wider">
                          <span>{featuredStory.trip?.title || 'Journey'}</span>
                          {featuredStory.trip?.start_date && <span>• {new Date(featuredStory.trip.start_date).getFullYear()}</span>}
                        </div>

                        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light text-white group-hover:text-cinema-accent transition-colors leading-tight">
                          {featuredStory.title}
                        </h2>

                        {featuredStory.subtitle && (
                          <p className="text-sm sm:text-base text-cinema-muted font-light line-clamp-3 leading-relaxed">
                            {featuredStory.subtitle}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono text-white/80 pt-4 border-t border-white/[0.06]">
                        <span>Read Story →</span>
                      </div>
                    </div>

                    <div className="lg:col-span-5 relative min-h-[260px] lg:min-h-full bg-zinc-900 overflow-hidden">
                      {featuredStory.coverMedia?.storage_path ? (
                        <img
                          src={`/api/media/${featuredStory.coverMedia.id}`}
                          alt={featuredStory.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-cinema-muted font-mono text-xs">
                          [ Cover Photography ]
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </section>
            )}

            {/* Grid of Regular Stories */}
            {regularStories.length > 0 && (
              <section className="space-y-8">
                <div className="flex items-center gap-3 border-b border-cinema-border/60 pb-4">
                  <span className="text-[11px] font-semibold tracking-[0.2em] text-cinema-muted uppercase">
                    All Stories ({regularStories.length})
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {regularStories.map((story) => (
                    <Link
                      key={story.id}
                      href={`/stories/${story.slug}`}
                      className="group flex flex-col justify-between rounded-xl border border-white/[0.08] bg-cinema-card/30 hover:border-cinema-accent/30 overflow-hidden transition-all p-6 space-y-6"
                    >
                      <div className="space-y-4">
                        {story.coverMedia?.storage_path && (
                          <div className="w-full h-48 rounded-lg overflow-hidden bg-zinc-900">
                            <img
                              src={`/api/media/${story.coverMedia.id}`}
                              alt={story.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        )}

                        <div className="space-y-2">
                          <span className="text-[10px] font-mono text-cinema-accent uppercase tracking-wider block">
                            {story.trip?.title || 'Journey'}
                          </span>
                          <h3 className="font-serif text-xl text-white group-hover:text-cinema-accent transition-colors">
                            {story.title}
                          </h3>
                          {story.subtitle && (
                            <p className="text-xs text-cinema-muted line-clamp-2 font-light leading-relaxed">
                              {story.subtitle}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-cinema-muted">
                        <span>Read Story</span>
                        <span>→</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
