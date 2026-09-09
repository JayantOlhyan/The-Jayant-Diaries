import { notFound } from "next/navigation";
import { Metadata } from "next";
import { PlaceRepository } from "@/server/repositories/place-repository";
import { SearchRepository } from "@/server/repositories/search-repository";
import { PlaceDetailClient } from "@/components/public/place-detail-client";

interface PlacePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PlacePageProps): Promise<Metadata> {
  const { slug } = await params;
  const place = await PlaceRepository.getPlaceBySlug(slug);

  if (!place) {
    return {
      title: "Place Not Found — The Jayant Diaries",
    };
  }

  return {
    title: `${place.name} — The Jayant Diaries`,
    description: place.description || `Photographs, stories, and travel archive for ${place.name}`,
  };
}

export default async function PlaceDetailPage({ params }: PlacePageProps) {
  const { slug } = await params;
  const relatedContent = await SearchRepository.getRelatedContentForPlace(slug);

  if (!relatedContent) {
    notFound();
  }

  return (
    <PlaceDetailClient
      place={relatedContent.place}
      journeys={relatedContent.journeys}
      stories={relatedContent.stories}
      media={relatedContent.media}
    />
  );
}
