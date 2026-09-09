import { notFound } from "next/navigation";
import { TripRepository } from "@/server/repositories/trip-repository";
import { TripEditForm } from "@/components/studio/trip-edit-form";

interface EditTripPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTripPage({ params }: EditTripPageProps) {
  const { id } = await params;
  const trip = await TripRepository.getTripById(id);

  if (!trip) {
    notFound();
  }

  return <TripEditForm trip={trip} />;
}
