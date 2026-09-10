import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { StoryRepository } from '@/server/repositories/story-repository';
import { MemoryRepository } from '@/server/repositories/memory-repository';
import { PlaceRepository } from '@/server/repositories/place-repository';
import { TripRepository } from '@/server/repositories/trip-repository';
import { MediaRepository } from '@/server/repositories/media-repository';
import { StoryWithDetails } from '@/types/entities';

interface StoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: StoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const story = await StoryRepository.getPublishedStoryBySlug(slug);

  if (story) {
    return {
      title: `${story.title} — The Jayant Diaries`,
      description: story.subtitle || `A travel story from ${story.trip?.title || 'the archive'}.`,
    };
  }

  // Fallback memory check
  const memory = await MemoryRepository.getPublicMemoryById(slug);
  if (memory) {
    return {
      title: `${memory.title} — The Jayant Diaries`,
      description: memory.description || memory.journal?.slice(0, 160) || 'A travel story by Jayant.',
    };
  }

  return { title: 'Story Not Found — The Jayant Diaries' };
}

export default async function PublicStoryDetailPage({ params }: StoryPageProps) {
  const { slug } = await params;

  // Primary: Editorial Story Model
  const story = await StoryRepository.getPublishedStoryBySlug(slug);

  if (story) {
    const allPublished = await StoryRepository.getPublishedStories();
    const currentIdx = allPublished.findIndex((s) => s.id === story.id);
    const prevStory = currentIdx > 0 ? allPublished[currentIdx - 1] : null;
    const nextStory = currentIdx >= 0 && currentIdx < allPublished.length - 1 ? allPublished[currentIdx + 1] : null;

    const blocks = story.parsedContent || [];

    return (
      <article className="min-h-screen bg-cinema-black text-white selection:bg-cinema-accent selection:text-white pb-32">
        {/* Navigation Bar */}
        <div className="border-b border-cinema-border/60 bg-cinema-card/30">
          <div className="mx-auto max-w-5xl px-6 py-6 flex items-center justify-between text-xs font-mono text-cinema-muted">
            <Link
              href="/stories"
              className="hover:text-cinema-accent transition-colors flex items-center gap-1.5"
            >
              <span>←</span> All Stories
            </Link>
            {story.trip && (
              <Link
                href={`/journeys/${story.trip.slug}`}
                className="text-white hover:text-cinema-accent transition-colors truncate max-w-[250px] sm:max-w-none"
              >
                Journey: <span className="underline decoration-cinema-border">{story.trip.title}</span>
              </Link>
            )}
          </div>
        </div>

        {/* Hero Section */}
        <header className="relative w-full min-h-[65vh] flex flex-col justify-end p-6 sm:p-12 lg:p-20 border-b border-cinema-border/60 overflow-hidden bg-gradient-to-t from-cinema-black via-cinema-black/70 to-transparent">
          {story.coverMedia?.storage_path && (
            <img
              src={`/api/media/${story.coverMedia.id}`}
              alt={story.title}
              className="absolute inset-0 w-full h-full object-cover opacity-45 mix-blend-luminosity scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-cinema-black via-cinema-black/60 to-transparent" />

          <div className="relative z-10 max-w-4xl mx-auto w-full space-y-4">
            <div className="flex items-center gap-3 text-xs font-mono text-cinema-accent uppercase tracking-widest">
              {story.trip ? <span>{story.trip.title}</span> : <span>Editorial Archive</span>}
              {story.trip?.start_date && <span>• {new Date(story.trip.start_date).getFullYear()}</span>}
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-normal text-white tracking-tight leading-tight">
              {story.title}
            </h1>

            {story.subtitle && (
              <p className="text-lg sm:text-2xl font-serif text-cinema-muted italic max-w-3xl font-light leading-relaxed">
                {story.subtitle}
              </p>
            )}
          </div>
        </header>

        {/* Editorial Body */}
        <div className="max-w-3xl mx-auto px-6 py-16 space-y-12 font-serif text-neutral-200 leading-relaxed">
          {blocks.map((block) => {
            if (block.type === 'INTRO') {
              return (
                <p
                  key={block.id}
                  className="text-xl sm:text-2xl font-serif italic text-neutral-100 font-light leading-relaxed border-l-2 border-cinema-accent/60 pl-6 my-8"
                >
                  {block.text}
                </p>
              );
            }

            if (block.type === 'TEXT') {
              return (
                <p
                  key={block.id}
                  className="text-base sm:text-lg text-neutral-300 font-light leading-relaxed whitespace-pre-line"
                >
                  {block.text}
                </p>
              );
            }

            if (block.type === 'QUOTE') {
              return (
                <blockquote
                  key={block.id}
                  className="my-12 text-center py-8 border-y border-cinema-border/60 space-y-3"
                >
                  <p className="text-2xl sm:text-3xl font-serif italic text-cinema-accent/90 font-light">
                    &ldquo;{block.text}&rdquo;
                  </p>
                </blockquote>
              );
            }

            if (block.type === 'DIVIDER') {
              return (
                <div key={block.id} className="my-16 flex items-center justify-center gap-3">
                  <div className="w-12 h-[1px] bg-cinema-border" />
                  <div className="w-1.5 h-1.5 rounded-full bg-cinema-accent/60" />
                  <div className="w-12 h-[1px] bg-cinema-border" />
                </div>
              );
            }

            if (block.type === 'MEDIA') {
              return (
                <figure key={block.id} className="my-12 space-y-3">
                  {block.media?.storage_path && (
                    <img
                      src={`/api/media/${block.media.id}`}
                      alt={block.caption || 'Story photography'}
                      className="w-full rounded-xl object-cover max-h-[75vh] bg-cinema-card border border-white/[0.08] shadow-2xl"
                    />
                  )}
                  {block.caption && (
                    <figcaption className="text-xs text-center font-serif italic text-cinema-muted">
                      {block.caption}
                    </figcaption>
                  )}
                </figure>
              );
            }

            if (block.type === 'MEMORY') {
              return (
                <div
                  key={block.id}
                  className="my-10 p-6 bg-cinema-card/40 border border-white/[0.08] rounded-2xl space-y-3"
                >
                  <span className="text-[10px] font-mono text-cinema-accent uppercase tracking-widest">
                    Memory Record
                  </span>
                  <h3 className="text-xl font-serif text-white font-normal">
                    {block.memory?.title}
                  </h3>
                  {block.memory?.journal && (
                    <p className="text-sm font-serif italic text-neutral-300 leading-relaxed">
                      &ldquo;{block.memory.journal}&rdquo;
                    </p>
                  )}
                </div>
              );
            }

            if (block.type === 'PLACE') {
              return (
                <div
                  key={block.id}
                  className="my-8 p-5 bg-cinema-card/30 border border-white/[0.06] rounded-xl flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">
                      Featured Location
                    </span>
                    <h4 className="text-lg font-serif text-white">
                      {block.place?.name}
                    </h4>
                    {block.place && (
                      <p className="text-xs font-mono text-cinema-muted">
                        {[block.place.city, block.place.state, block.place.country].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>

        {/* Story Navigation Footer */}
        <footer className="max-w-4xl mx-auto px-6 pt-12 border-t border-cinema-border/60">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {prevStory ? (
              <Link
                href={`/stories/${prevStory.slug}`}
                className="group p-6 rounded-xl border border-white/[0.08] bg-cinema-card/30 hover:border-cinema-accent/40 transition-all text-left space-y-2"
              >
                <span className="text-[10px] font-mono text-cinema-muted uppercase">← Previous Story</span>
                <h4 className="font-serif text-lg text-white group-hover:text-cinema-accent transition-colors">
                  {prevStory.title}
                </h4>
              </Link>
            ) : <div />}

            {nextStory ? (
              <Link
                href={`/stories/${nextStory.slug}`}
                className="group p-6 rounded-xl border border-white/[0.08] bg-cinema-card/30 hover:border-cinema-accent/40 transition-all text-right space-y-2"
              >
                <span className="text-[10px] font-mono text-cinema-muted uppercase">Next Story →</span>
                <h4 className="font-serif text-lg text-white group-hover:text-cinema-accent transition-colors">
                  {nextStory.title}
                </h4>
              </Link>
            ) : <div />}
          </div>
        </footer>
      </article>
    );
  }

  // Fallback: Legacy Memory rendering if not found in Story repository
  const memory = await MemoryRepository.getPublicMemoryById(slug);
  if (!memory) notFound();

  const [place, trip, allMedia] = await Promise.all([
    memory.place_id ? PlaceRepository.getPlaceById(memory.place_id) : Promise.resolve(null),
    memory.trip_id ? TripRepository.getTripById(memory.trip_id) : Promise.resolve(null),
    MediaRepository.getPublicMedia(),
  ]);

  const mediaForMemory = allMedia.find((m) => m.memory_id === memory.id);

  return (
    <article className="min-h-screen bg-cinema-black text-white selection:bg-cinema-accent selection:text-white pb-32">
      <div className="border-b border-cinema-border/60 bg-cinema-card/30">
        <div className="mx-auto max-w-4xl px-6 py-6 flex items-center justify-between text-xs font-mono text-cinema-muted">
          <Link href="/stories" className="hover:text-cinema-accent transition-colors flex items-center gap-1.5">
            <span>←</span> Back to Stories
          </Link>
          {trip && (
            <Link href={`/journeys/${trip.slug}`} className="text-white hover:text-cinema-accent transition-colors">
              Part of: <span className="underline decoration-cinema-border">{trip.title}</span>
            </Link>
          )}
        </div>
      </div>

      <header className="mx-auto max-w-3xl px-6 pt-16 pb-12 text-center space-y-4">
        <span className="text-xs font-mono text-cinema-accent uppercase tracking-widest">
          {place ? place.name : 'Field Note'}
        </span>
        <h1 className="text-4xl sm:text-5xl font-serif text-white font-normal">
          {memory.title}
        </h1>
      </header>

      {mediaForMemory?.storage_path && (
        <div className="max-w-4xl mx-auto px-6 mb-12">
          <img
            src={`/api/media/${mediaForMemory.id}`}
            alt={memory.title}
            className="w-full rounded-2xl object-cover max-h-[70vh] bg-cinema-card border border-white/[0.08]"
          />
        </div>
      )}

      <div className="max-w-2xl mx-auto px-6 font-serif text-neutral-300 leading-relaxed text-lg space-y-6">
        {memory.journal && <p className="whitespace-pre-line">{memory.journal}</p>}
        {memory.description && <p className="text-neutral-400 italic text-base">{memory.description}</p>}
      </div>
    </article>
  );
}
