import { notFound } from "next/navigation";
import { TripRepository } from "@/server/repositories/trip-repository";
import { PlaceRepository } from "@/server/repositories/place-repository";
import { TripDetailClient } from "@/components/studio/trip-detail-client";

interface TripDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function StudioTripDetailPage({ params }: TripDetailPageProps) {
  const { id } = await params;
  const trip = await TripRepository.getTripWithDetails(id);

  if (!trip) {
    notFound();
  }

  const allPlaces = await PlaceRepository.getAllPlaces();

  return <TripDetailClient trip={trip} allPlaces={allPlaces} />;
}
