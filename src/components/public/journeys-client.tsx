'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Calendar, MapPin } from 'lucide-react';
import { TripRow, MediaRow } from '@/types/entities';
import { ImageFrame } from '@/components/ui/image-frame';
import { getNormalizedImageUrl, getImageAlt } from '@/lib/utils/image-provider';
import { formatDate } from '@/lib/utils';

export interface JourneyCardItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Mountains' | 'Cities' | 'Coastlines' | 'International';
  slug?: string;
  dateSpan?: string;
  imageUrl: string;
  status: 'PUBLISHED' | 'COMING_SOON';
}

interface JourneysClientProps {
  initialTrips: (TripRow & { cover?: MediaRow | null })[];
}

export function JourneysClient({ initialTrips }: JourneysClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All Journeys');

  // Convert live database trips to JourneyCardItem format
  const liveJourneyCards: JourneyCardItem[] = initialTrips.map((t) => ({
    id: t.id,
    title: t.title,
    subtitle: t.description?.split('.')[0] || '',
    category: 'Mountains',
    slug: t.slug,
    dateSpan: t.start_date && t.end_date ? `${formatDate(t.start_date)} — ${formatDate(t.end_date)}` : undefined,
    imageUrl: getNormalizedImageUrl(t.cover?.storage_url || t.cover?.thumbnail_url || ''),
    status: 'PUBLISHED',
  }));

  const allJourneys = liveJourneyCards;

  const categories = ['All Journeys'];

  const filteredJourneys = allJourneys.filter((j) => {
    if (selectedCategory === 'All Journeys') return true;
    return j.category === selectedCategory;
  });

  return (
    <div className="space-y-10">
      {/* Category Pills Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wider whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-white text-black font-bold shadow-md'
                : 'bg-white/[0.04] text-neutral-400 hover:text-white border border-white/[0.08]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Journeys Editorial Grid */}
      {filteredJourneys.length === 0 ? (
        <div className="py-20 text-center space-y-3 rounded-2xl border border-white/[0.06] bg-neutral-900/20 p-8">
          <p className="font-serif text-lg text-white">No journeys found in archive</p>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Journeys will appear here as chapters are curated and published in the archive.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredJourneys.map((journey) => {
          const isLive = journey.status === 'PUBLISHED' && journey.slug;

          const CardContent = (
            <div className="group flex flex-col space-y-4 rounded-2xl overflow-hidden bg-neutral-900/30 border border-white/[0.08] hover:border-white/20 transition-all duration-300 p-3 h-full">
              {/* Photo Frame */}
              <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-black">
                <ImageFrame
                  src={journey.imageUrl}
                  alt={journey.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-70" />

                {/* Status Pill */}
                <div className="absolute top-3 right-3">
                  {isLive ? (
                    <span className="p-2 rounded-full bg-black/60 text-white backdrop-blur-md border border-white/20 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider bg-black/70 text-neutral-400 border border-white/10 backdrop-blur-md">
                      Coming Soon
                    </span>
                  )}
                </div>
              </div>

              {/* Text Info */}
              <div className="space-y-1.5 p-1 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                    {journey.title}
                  </h3>
                  {journey.subtitle && (
                    <p className="text-xs text-neutral-400 font-sans">
                      {journey.subtitle}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                  <span>{journey.category}</span>
                  {journey.dateSpan ? (
                    <span className="text-amber-400">{journey.dateSpan}</span>
                  ) : (
                    <span>Upcoming</span>
                  )}
                </div>
              </div>
            </div>
          );

          if (isLive) {
            return (
              <Link key={journey.id} href={`/journeys/${journey.slug}`} className="block h-full">
                {CardContent}
              </Link>
            );
          }

          return (
            <div key={journey.id} className="block h-full opacity-80 hover:opacity-100 transition-opacity">
              {CardContent}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
