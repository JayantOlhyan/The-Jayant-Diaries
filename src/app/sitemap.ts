import type { MetadataRoute } from 'next';
import { TripRepository } from '@/server/repositories/trip-repository';
import { PlaceRepository } from '@/server/repositories/place-repository';
import { StoryRepository } from '@/server/repositories/story-repository';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thejayantdiaries.com';

  // 1. Static Public Pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/journeys`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/places`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/destinations`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/stories`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/media`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/map`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  try {
    // 2. Dynamic Published Journeys (only PUBLIC & PUBLISHED)
    const publicTrips = await TripRepository.getPublicTrips();
    const tripRoutes: MetadataRoute.Sitemap = publicTrips.flatMap((trip) => [
      {
        url: `${baseUrl}/journeys/${trip.slug}`,
        lastModified: trip.updated_at ? new Date(trip.updated_at) : new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.85,
      },
      {
        url: `${baseUrl}/journeys/${trip.slug}/cinematic`,
        lastModified: trip.updated_at ? new Date(trip.updated_at) : new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.75,
      },
    ]);

    // 3. Dynamic Places
    const places = await PlaceRepository.getAllPlaces();
    const placeRoutes: MetadataRoute.Sitemap = places.map((place) => ({
      url: `${baseUrl}/places/${place.slug}`,
      lastModified: place.updated_at ? new Date(place.updated_at) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));

    // 4. Dynamic Published Stories (only PUBLISHED & PUBLIC stories)
    const publishedStories = await StoryRepository.getPublishedStories();
    const storyRoutes: MetadataRoute.Sitemap = publishedStories.map((story) => ({
      url: `${baseUrl}/stories/${story.slug}`,
      lastModified: story.updated_at ? new Date(story.updated_at) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }));

    return [...staticRoutes, ...tripRoutes, ...placeRoutes, ...storyRoutes];
  } catch (err) {
    console.error('Error generating dynamic sitemap:', err);
    return staticRoutes;
  }
}
