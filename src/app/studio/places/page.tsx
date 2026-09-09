import { PlaceRepository } from "@/server/repositories/place-repository";
import { PlacesManagerClient } from "@/components/studio/places-manager-client";

export default async function StudioPlacesPage() {
  const places = await PlaceRepository.getAllPlaces();
  return <PlacesManagerClient initialPlaces={places} />;
}
