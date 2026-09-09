import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar, MapPin, Compass } from "lucide-react";
import { TripRepository } from "@/server/repositories/trip-repository";
import { PlaceRepository } from "@/server/repositories/place-repository";
import { MemoryRepository } from "@/server/repositories/memory-repository";
import { MediaRepository } from "@/server/repositories/media-repository";
import { getNormalizedImageUrl, getImageAlt } from "@/lib/utils/image-provider";
import { ImageFrame } from "@/components/ui/image-frame";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "The Jayant Diaries — A Personal Travel Archive",
  description:
    "A personal digital travel archive transforming scattered photographs, videos, journals, places, and memories into structured cinematic journeys.",
};

export default async function HomePage() {
  const [publicTrips, allPlaces, allMemories, publicMedia] = await Promise.all([
    TripRepository.getPublicTrips(),
    PlaceRepository.getAllPlaces(),
    MemoryRepository.getAllMemories(),
    MediaRepository.getPublicMedia(20),
  ]);

  // Featured trip
  const featuredTrip = publicTrips.find((t) => t.featured) || publicTrips[0];
  const featuredTripDetails = featuredTrip ? await TripRepository.getTripWithDetails(featuredTrip.id) : null;

  // Hero image (Pangong Lake at sunset or first public landscape)
  const heroMedia =
    publicMedia.find((m) => m.caption?.toLowerCase().includes('pangong') || m.filename?.includes('pangong')) ||
    publicMedia[0];
  const heroImageUrl = heroMedia
    ? getNormalizedImageUrl(heroMedia.storage_url || heroMedia.thumbnail_url || '')
    : 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&auto=format&fit=crop&q=80';

  // Featured journey image
  const featuredJourneyImage =
    featuredTripDetails?.cover_media?.storage_url ||
    publicMedia.find((m) => m.type === 'PHOTO' && m.id !== heroMedia?.id)?.storage_url ||
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&auto=format&fit=crop&q=80';

  // Curated Recent Stories (3 items)
  const stories = [
    {
      id: 'story-1',
      title: 'First Morning in Leh',
      excerpt: 'A different kind of silence.',
      photo: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
      date: '12 June 2026',
    },
    {
      id: 'story-2',
      title: 'The Drive to Nubra',
      excerpt: 'Mountains, roads and perspective.',
      photo: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80',
      date: '13 June 2026',
    },
    {
      id: 'story-3',
      title: 'Pangong at Sunset',
      excerpt: 'When the sky meets stillness.',
      photo: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
      date: '14 June 2026',
    },
  ];

  // Curated Places for Home (4 items)
  const homePlaces = [
    {
      name: 'Leh',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
      slug: 'leh',
    },
    {
      name: 'Nubra Valley',
      image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&auto=format&fit=crop&q=80',
      slug: 'nubra-valley',
    },
    {
      name: 'Pangong Lake',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
      slug: 'pangong-lake',
    },
    {
      name: 'Khardung La',
      image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop&q=80',
      slug: 'khardung-la',
    },
  ];

  return (
    <div className="space-y-20 sm:space-y-28 pb-24">
      {/* 1. Full-Bleed Cinematic Hero (Matches Reference Spec "Homepage /") */}
      <section className="relative w-full h-[85vh] min-h-[580px] max-h-[920px] flex flex-col justify-between overflow-hidden bg-neutral-950">
        {/* Full-width Photography Background */}
        <div className="absolute inset-0">
          <Image
            src={heroImageUrl}
            alt="Pangong Lake at sunset, Ladakh"
            fill
            priority
            className="object-cover object-center scale-[1.02] transition-transform duration-1000"
          />
          {/* Subtle vignette and contrast gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D0E] via-[#0B0D0E]/40 to-black/30" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(11,13,14,0.6)_100%)]" />
        </div>

        {/* Top Space Filler */}
        <div className="relative z-10" />

        {/* Center Editorial Typography */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 w-full text-center space-y-6">
          <div className="space-y-2">
            <span className="text-[11px] font-mono tracking-[0.25em] text-amber-400 uppercase drop-shadow-sm">
              A Personal Travel Archive
            </span>
            <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white drop-shadow-lg">
              The Jayant Diaries
            </h1>
          </div>

          <p className="font-serif text-lg sm:text-2xl text-neutral-200 italic font-normal tracking-wide drop-shadow-md">
            Journeys worth remembering.
          </p>

          <div className="pt-3">
            <Link
              href="/journeys"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 bg-white/10 hover:bg-white text-white hover:text-black text-xs font-mono tracking-widest uppercase backdrop-blur-md transition-all duration-300 shadow-xl group"
            >
              Explore the Journeys
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Bottom Subtitle / Location Pin Marker */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 pb-8 w-full flex items-center justify-between text-xs font-mono text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />
            <span>Pangong Lake &bull; Ladakh, India</span>
          </div>

          <span className="hidden sm:block text-neutral-400 text-[11px]">
            Places change. Memories stay.
          </span>
        </div>
      </section>

      {/* 2. Featured Journey Section (Split Editorial Composition) */}
      {featuredTrip && (
        <section className="max-w-7xl mx-auto px-6 space-y-6">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <span className="text-xs font-mono uppercase tracking-widest text-amber-500/90 font-semibold">
              Featured Journey
            </span>
            <Link
              href="/journeys"
              className="text-xs font-mono text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              All Journeys
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-2xl bg-neutral-900/40 border border-white/[0.08] p-6 sm:p-10 backdrop-blur-sm">
            {/* Left Narrative Column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">
                  Expedition Chapter 01
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-tight">
                  {featuredTrip.title}
                </h2>
                {featuredTrip.start_date && featuredTrip.end_date && (
                  <p className="text-xs font-mono text-amber-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(featuredTrip.start_date)} — {formatDate(featuredTrip.end_date)}
                  </p>
                )}
              </div>

              {featuredTrip.description && (
                <p className="text-sm text-neutral-300 leading-relaxed font-sans">
                  {featuredTrip.description}
                </p>
              )}

              <div className="pt-2">
                <Link
                  href={`/journeys/${featuredTrip.slug}`}
                  className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400 hover:text-amber-300 transition-colors group"
                >
                  View Journey
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Right Panoramic Photo Column */}
            <div className="lg:col-span-7">
              <Link
                href={`/journeys/${featuredTrip.slug}`}
                className="group relative aspect-[16/10] w-full block rounded-xl overflow-hidden bg-neutral-950 border border-white/10"
              >
                <ImageFrame
                  src={getNormalizedImageUrl(featuredJourneyImage)}
                  alt={featuredTrip.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 3. Recent Stories Section (3 Editorial Story Cards) */}
      <section className="max-w-7xl mx-auto px-6 space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <span className="text-xs font-mono uppercase tracking-widest text-neutral-400 font-semibold">
            Recent Stories
          </span>
          <Link
            href="/stories"
            className="text-xs font-mono text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            View All Stories
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story) => (
            <Link
              key={story.id}
              href="/stories"
              className="group flex flex-col space-y-3 rounded-xl overflow-hidden p-3 bg-neutral-900/20 border border-white/[0.06] hover:border-white/20 transition-all duration-300"
            >
              <div className="relative aspect-[16/10] w-full rounded-lg overflow-hidden bg-neutral-950">
                <ImageFrame
                  src={story.photo}
                  alt={story.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              <div className="space-y-1 p-1">
                <span className="text-[11px] font-mono text-neutral-400">
                  {story.date}
                </span>
                <h3 className="font-serif text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                  {story.title}
                </h3>
                <p className="text-xs text-neutral-400 line-clamp-1 font-sans">
                  {story.excerpt}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Places Section (4 Photographic Cards) */}
      <section className="max-w-7xl mx-auto px-6 space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <span className="text-xs font-mono uppercase tracking-widest text-neutral-400 font-semibold">
            Places
          </span>
          <Link
            href="/places"
            className="text-xs font-mono text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            View All Places
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {homePlaces.map((place) => (
            <Link
              key={place.name}
              href={`/places/${place.slug}`}
              className="group space-y-2.5 block text-left"
            >
              <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-neutral-950 border border-white/10">
                <ImageFrame
                  src={place.image}
                  alt={place.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
              </div>
              <p className="font-serif text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                {place.name}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. The Archive Teaser Section */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-neutral-900/40 to-neutral-950/80 p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-amber-500">
              The Archive
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white">
              Photography &bull; Films &bull; Moments &bull; A Larger Story
            </h3>
            <p className="text-xs text-neutral-400 max-w-xl font-sans">
              Hundreds of medium format and drone captures, YouTube expedition reels, and road dispatches preserved for decades.
            </p>
          </div>

          <Link
            href="/media"
            className="px-6 py-3 rounded-xl bg-white text-black hover:bg-neutral-200 text-xs font-mono uppercase tracking-wider font-semibold transition-colors flex-shrink-0 shadow-lg"
          >
            Open Media Archive &rarr;
          </Link>
        </div>
      </section>
    </div>
  );
}
