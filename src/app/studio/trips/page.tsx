import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TripRepository } from "@/server/repositories/trip-repository";
import { formatDate } from "@/lib/utils";

export default async function StudioTripsPage() {
  const trips = await TripRepository.getAllStudioTrips();

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Trips Archive</h1>
          <p className="text-xs text-zinc-400 mt-1">Manage, organize, and publish journeys.</p>
        </div>
        <Link href="/studio/trips/new">
          <Button variant="primary" size="sm">
            + New Trip
          </Button>
        </Link>
      </div>

      {trips.length === 0 ? (
        <EmptyState
          title="No journeys created yet"
          description="Create your first journey to begin archiving days, places, memories, and media."
          action={
            <Link href="/studio/trips/new">
              <Button variant="primary" size="sm">
                Create Trip
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trips.map((trip) => {
            const dateSpan =
              trip.start_date && trip.end_date
                ? `${formatDate(trip.start_date)} — ${formatDate(trip.end_date)}`
                : "Dates not set";

            return (
              <Card
                key={trip.id}
                className="bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between"
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-base font-bold text-white tracking-tight">
                      <Link href={`/studio/trips/${trip.id}`} className="hover:text-red-400 transition-colors">
                        {trip.title}
                      </Link>
                    </h2>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge
                        variant={trip.status === "PUBLISHED" ? "success" : "default"}
                        size="sm"
                      >
                        {trip.status}
                      </Badge>
                      <Badge
                        variant={trip.visibility === "PUBLIC" ? "accent" : "outline"}
                        size="sm"
                      >
                        {trip.visibility}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 font-mono">
                    /{trip.slug}
                  </p>

                  <p className="text-xs text-zinc-300 line-clamp-2">
                    {trip.description || "No description provided."}
                  </p>

                  <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
                    <span>{dateSpan}</span>
                    <div className="flex items-center gap-2">
                      <Link href={`/studio/trips/${trip.id}`}>
                        <Button variant="secondary" size="sm" className="text-xs px-2.5 py-1">
                          Manage
                        </Button>
                      </Link>
                      <Link href={`/trips/${trip.slug}`} target="_blank">
                        <Button variant="ghost" size="sm" className="text-xs text-zinc-400 hover:text-white px-2">
                          Public ↗
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
