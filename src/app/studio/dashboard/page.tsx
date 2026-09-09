import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatsRepository } from "@/server/repositories/stats-repository";
import { TripRepository } from "@/server/repositories/trip-repository";
import { formatDate } from "@/lib/utils";

export default async function StudioDashboardPage() {
  const [stats, trips] = await Promise.all([
    StatsRepository.getStudioStats(),
    TripRepository.getAllStudioTrips(),
  ]);

  const statCards = [
    { label: "Trips", value: stats.trips_count, href: "/studio/trips" },
    { label: "Days", value: stats.days_count, href: "/studio/days" },
    { label: "Places", value: stats.places_count, href: "/studio/places" },
    { label: "Memories", value: stats.memories_count, href: "/studio/memories" },
    { label: "Images", value: stats.images_count, href: "/studio/media" },
    { label: "Videos", value: stats.videos_count, href: "/studio/media" },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-800/40 p-8 border border-zinc-800/80 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-red-500/10 text-red-400 border border-red-500/20 mb-3">
              Studio Workspace
            </span>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Welcome back, Jayant
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-xl">
              Capture more of your world. Manage, document, and curate your journeys into cinematic archival stories.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/studio/trips/new">
              <Button variant="primary" size="md" className="font-semibold shadow-lg shadow-red-600/20">
                + New Trip
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 6-Card Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card variant="interactive" className="p-4 bg-zinc-900/70 border-zinc-800/80 hover:border-zinc-700 transition-all hover:translate-y-[-2px]">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                {stat.label}
              </span>
              <div className="text-2xl font-black text-white mt-1.5 tracking-tight">{stat.value}</div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Trips */}
      <Card className="bg-zinc-900/50 border-zinc-800/80 overflow-hidden">
        <CardHeader className="border-b border-zinc-800/60 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-white tracking-tight">
                Recent Trips
              </CardTitle>
              <p className="text-xs text-zinc-400 mt-0.5">
                Archived journeys and ongoing expeditions.
              </p>
            </div>
            <Link href="/studio/trips">
              <Button variant="ghost" size="sm" className="text-xs text-zinc-400 hover:text-white">
                View All →
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {trips.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-400">
              No trips created yet. Click &quot;+ New Trip&quot; to start.
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/60">
              {trips.slice(0, 5).map((trip) => {
                const dateSpan =
                  trip.start_date && trip.end_date
                    ? `${formatDate(trip.start_date)} — ${formatDate(trip.end_date)}`
                    : "Dates not set";

                return (
                  <div
                    key={trip.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-800/30 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white hover:text-red-400 transition-colors">
                          <Link href={`/studio/trips/${trip.id}`}>{trip.title}</Link>
                        </h3>
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
                      <p className="text-xs text-zinc-400">
                        {dateSpan}
                        {trip.description && ` • ${trip.description.slice(0, 75)}...`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link href={`/studio/trips/${trip.id}`}>
                        <Button variant="secondary" size="sm" className="text-xs px-3 py-1">
                          View
                        </Button>
                      </Link>
                      <Link href={`/trips/${trip.slug}`} target="_blank">
                        <Button variant="ghost" size="sm" className="text-xs text-zinc-400 hover:text-white px-2">
                          Public ↗
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-zinc-900/50 border-zinc-800/80">
        <CardHeader>
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link href="/studio/trips/new">
            <Button variant="primary" size="sm">
              + New Trip
            </Button>
          </Link>
          <Link href="/studio/days">
            <Button variant="secondary" size="sm">
              Record Day
            </Button>
          </Link>
          <Link href="/studio/places">
            <Button variant="secondary" size="sm">
              Add Place
            </Button>
          </Link>
          <Link href="/studio/memories">
            <Button variant="secondary" size="sm">
              Add Memory
            </Button>
          </Link>
          <Link href="/studio/media">
            <Button variant="secondary" size="sm">
              Add Media Reference
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
