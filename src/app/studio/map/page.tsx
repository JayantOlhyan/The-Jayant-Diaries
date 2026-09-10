import Link from 'next/link';
import { PlaceRepository } from '@/server/repositories/place-repository';
import {
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Globe,
  Compass,
  ExternalLink,
} from 'lucide-react';

export const metadata = {
  title: 'Geographic Archive Overview — Studio',
  description: 'Operational visibility into mapped vs unmapped places and coordinate coverage.',
};

export default async function StudioMapPage() {
  const overview = await PlaceRepository.getStudioGeographicOverview();

  const mappedPercentage =
    overview.totalPlaces > 0
      ? Math.round((overview.mappedPlaces / overview.totalPlaces) * 100)
      : 0;

  return (
    <div className="space-y-8 max-w-6xl pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-amber-500 font-semibold">
            Operational Overview
          </span>
          <h1 className="font-serif text-3xl font-bold text-white mt-1">
            Geographic Archive
          </h1>
          <p className="text-xs text-neutral-400 font-sans mt-1">
            Verify coordinate coverage, identify unmapped locations, and audit spatial integrity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/map"
            target="_blank"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-mono uppercase tracking-wider transition-all"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>View Public Atlas ↗</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards (Section 22) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Mapped Places */}
        <div className="p-5 rounded-2xl bg-neutral-900/50 border border-white/[0.08] space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[10px] font-mono uppercase tracking-wider">Mapped Places</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-white">
              {overview.mappedPlaces}
            </span>
            <span className="text-xs font-mono text-emerald-400">
              ({mappedPercentage}% coverage)
            </span>
          </div>
        </div>

        {/* Unmapped Places */}
        <div className="p-5 rounded-2xl bg-neutral-900/50 border border-white/[0.08] space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[10px] font-mono uppercase tracking-wider">Unmapped Places</span>
            <AlertTriangle className={`w-4 h-4 ${overview.unmappedPlaces > 0 ? 'text-amber-400' : 'text-neutral-500'}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-white">
              {overview.unmappedPlaces}
            </span>
            <span className="text-xs font-mono text-neutral-400">
              of {overview.totalPlaces} total
            </span>
          </div>
        </div>

        {/* Public Places */}
        <div className="p-5 rounded-2xl bg-neutral-900/50 border border-white/[0.08] space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[10px] font-mono uppercase tracking-wider">Public Places</span>
            <Globe className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-white">
              {overview.publicPlacesCount}
            </span>
            <span className="text-xs font-mono text-neutral-400">
              visible in atlas
            </span>
          </div>
        </div>

        {/* Private Places */}
        <div className="p-5 rounded-2xl bg-neutral-900/50 border border-white/[0.08] space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[10px] font-mono uppercase tracking-wider">Private Places</span>
            <Lock className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-white">
              {overview.privatePlacesCount}
            </span>
            <span className="text-xs font-mono text-neutral-400">
              zero public leak
            </span>
          </div>
        </div>
      </div>

      {/* Places Operational Audit Table */}
      <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/40 overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold text-white">
              Geographic Archive Inventory
            </h2>
            <p className="text-xs text-neutral-400 font-sans mt-0.5">
              Verify that places have valid GPS coordinates and appropriate visibility settings.
            </p>
          </div>
          <Link
            href="/studio/places"
            className="text-xs font-mono uppercase tracking-wider text-amber-400 hover:text-amber-300 transition-colors"
          >
            Manage in Directory →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                <th className="py-3 px-4">Place Name</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Coordinates</th>
                <th className="py-3 px-4">Visibility</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Journeys</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-xs font-sans">
              {overview.places.map((place) => (
                <tr key={place.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4 font-serif font-semibold text-white">
                    {place.name}
                  </td>
                  <td className="py-3 px-4 text-neutral-400 font-mono text-[11px]">
                    {[place.city, place.state, place.country].filter(Boolean).join(', ')}
                  </td>
                  <td className="py-3 px-4">
                    {place.hasCoordinates ? (
                      <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-neutral-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        {place.latitude?.toFixed(4)}°, {place.longitude?.toFixed(4)}°
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-[10px]">
                        <AlertTriangle className="w-3 h-3" />
                        Missing Coordinates
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px]">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] ${
                        place.visibility === 'PUBLIC'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                      }`}
                    >
                      {place.visibility}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px]">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] ${
                        place.status === 'PUBLISHED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {place.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-[11px] text-neutral-300">
                    {place.journeyCount}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/places/${place.slug}`}
                        target="_blank"
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                        title="View Public Page"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
