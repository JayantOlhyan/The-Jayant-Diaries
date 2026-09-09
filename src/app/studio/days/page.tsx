import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DayRepository } from "@/server/repositories/day-repository";
import { TripRepository } from "@/server/repositories/trip-repository";
import { formatDate } from "@/lib/utils";

export default async function StudioDaysPage() {
  const [days, trips] = await Promise.all([
    DayRepository.getAllDays(),
    TripRepository.getAllStudioTrips(),
  ]);

  const tripMap = new Map(trips.map((t) => [t.id, t]));

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Days Manager</h1>
          <p className="text-xs text-zinc-400 mt-1">Chronological itinerary days, routes, and day journals across journeys.</p>
        </div>
      </div>

      {days.length === 0 ? (
        <EmptyState
          title="No days configured"
          description="Days are created within trips to organize routes, journals, places, and media."
          action={
            <Link href="/studio/trips">
              <Button variant="primary" size="sm">
                Go to Trips
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {days.map((day) => {
            const trip = tripMap.get(day.trip_id);

            return (
              <Card
                key={day.id}
                className="bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 transition-all"
              >
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="accent" size="sm">
                        Day {day.day_number}
                      </Badge>
                      <h2 className="text-sm font-bold text-white">
                        {day.title || `Day ${day.day_number}`}
                      </h2>
                      {day.date && (
                        <span className="text-xs text-zinc-400">
                          • {formatDate(day.date)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      {trip && (
                        <Link
                          href={`/studio/trips/${trip.id}`}
                          className="text-red-400 font-medium hover:underline"
                        >
                          {trip.title}
                        </Link>
                      )}
                      {day.description && <span>• {day.description}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {trip && (
                      <Link href={`/studio/trips/${trip.id}`}>
                        <Button variant="secondary" size="sm" className="text-xs px-3 py-1">
                          Manage in Trip
                        </Button>
                      </Link>
                    )}
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
