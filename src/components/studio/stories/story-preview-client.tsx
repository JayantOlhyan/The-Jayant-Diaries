'use client';

import Link from 'next/link';
import { StoryWithDetails } from '@/types/entities';
import { ArrowLeft, Edit3, CheckCircle2, AlertTriangle } from 'lucide-react';

interface StoryPreviewClientProps {
  story: StoryWithDetails;
}

export function StoryPreviewClient({ story }: StoryPreviewClientProps) {
  const blocks = story.parsedContent || [];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-amber-500/20 selection:text-amber-200">
      {/* Studio Preview Banner Top */}
      <div className="sticky top-0 z-40 bg-amber-500/10 border-b border-amber-500/20 px-6 py-3 flex items-center justify-between text-xs text-amber-200 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="font-mono uppercase font-bold tracking-wider px-2 py-0.5 bg-amber-500/20 rounded">
            Editorial Preview Mode
          </span>
          <span className="hidden sm:inline text-zinc-400">
            This preview mirrors the canonical public story presentation.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/studio/stories/${story.id}`}
            className="inline-flex items-center gap-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 px-3 py-1.5 rounded text-xs font-medium border border-zinc-700 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" /> Back to Editor
          </Link>
        </div>
      </div>

      {/* Hero Cover Section */}
      <header className="relative w-full min-h-[60vh] flex flex-col justify-end p-6 md:p-16 border-b border-zinc-900 overflow-hidden bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent">
        {story.coverMedia?.storage_path && (
          <img
            src={`/api/media/${story.coverMedia.id}`}
            alt={story.title}
            className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-luminosity scale-105 transition-transform duration-1000"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />

        <div className="relative z-10 max-w-4xl mx-auto w-full space-y-4">
          <div className="flex items-center gap-3 text-xs font-mono text-amber-400 uppercase tracking-widest">
            {story.trip ? <span>{story.trip.title}</span> : <span>Editorial Archive</span>}
            {story.trip?.start_date && <span>• {new Date(story.trip.start_date).getFullYear()}</span>}
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-light text-zinc-100 tracking-tight leading-tight">
            {story.title}
          </h1>

          {story.subtitle && (
            <p className="text-lg md:text-xl font-serif text-zinc-300 italic max-w-2xl font-light leading-relaxed">
              {story.subtitle}
            </p>
          )}
        </div>
      </header>

      {/* Main Editorial Story Body */}
      <article className="max-w-3xl mx-auto px-6 py-16 space-y-12 text-zinc-300 font-serif leading-relaxed">
        {blocks.length === 0 ? (
          <div className="text-center py-16 text-zinc-600 font-mono text-sm">
            Story content is currently empty. Add blocks in the editor.
          </div>
        ) : (
          blocks.map((block) => {
            if (block.type === 'INTRO') {
              return (
                <p
                  key={block.id}
                  className="text-xl md:text-2xl font-serif italic text-zinc-200 font-light leading-relaxed border-l-2 border-amber-500/40 pl-6 my-8"
                >
                  {block.text}
                </p>
              );
            }

            if (block.type === 'TEXT') {
              return (
                <p
                  key={block.id}
                  className="text-base md:text-lg text-zinc-300 font-light leading-relaxed whitespace-pre-line"
                >
                  {block.text}
                </p>
              );
            }

            if (block.type === 'QUOTE') {
              return (
                <blockquote
                  key={block.id}
                  className="my-12 text-center py-8 border-y border-zinc-800 space-y-3"
                >
                  <p className="text-2xl md:text-3xl font-serif italic text-amber-100/90 font-light">
                    &ldquo;{block.text}&rdquo;
                  </p>
                </blockquote>
              );
            }

            if (block.type === 'DIVIDER') {
              return (
                <div key={block.id} className="my-16 flex items-center justify-center gap-3">
                  <div className="w-12 h-[1px] bg-zinc-800" />
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500/40" />
                  <div className="w-12 h-[1px] bg-zinc-800" />
                </div>
              );
            }

            if (block.type === 'MEDIA') {
              return (
                <figure key={block.id} className="my-12 space-y-3">
                  {block.media?.storage_path ? (
                    <img
                      src={`/api/media/${block.media.id}`}
                      alt={block.caption || 'Story photograph'}
                      className="w-full rounded-lg object-cover max-h-[70vh] bg-zinc-900 border border-zinc-800/80 shadow-2xl"
                    />
                  ) : (
                    <div className="w-full h-72 bg-zinc-900 rounded-lg border border-zinc-800 flex items-center justify-center text-zinc-600 font-mono text-xs">
                      [ Media Reference: {block.media_id || 'Selected Media'} ]
                    </div>
                  )}
                  {block.caption && (
                    <figcaption className="text-xs text-center font-serif italic text-zinc-400">
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
                  className="my-10 p-6 bg-zinc-900/40 border border-zinc-800/80 rounded-xl space-y-3"
                >
                  <div className="text-[10px] font-mono text-amber-400 uppercase tracking-widest">
                    Memory Record
                  </div>
                  <h3 className="text-xl font-serif text-zinc-100 font-normal">
                    {block.memory?.title || 'Archived Memory'}
                  </h3>
                  {block.memory?.journal && (
                    <p className="text-sm font-serif italic text-zinc-300/90 leading-relaxed">
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
                  className="my-8 p-5 bg-zinc-900/30 border border-zinc-800/60 rounded-xl flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">
                      Featured Location
                    </span>
                    <h4 className="text-lg font-serif text-zinc-200">
                      {block.place?.name || 'Archived Place'}
                    </h4>
                    {block.place && (
                      <p className="text-xs font-mono text-zinc-500">
                        {[block.place.city, block.place.state, block.place.country].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              );
            }

            return null;
          })
        )}
      </article>
    </div>
  );
}
