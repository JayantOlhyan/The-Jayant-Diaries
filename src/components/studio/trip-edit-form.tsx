'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TripRow } from '@/types/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { updateTripAction } from '@/server/actions/trip-actions';

interface TripEditFormProps {
  trip: TripRow;
}

export function TripEditForm({ trip }: TripEditFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [title, setTitle] = React.useState(trip.title);
  const [slug, setSlug] = React.useState(trip.slug);
  const [description, setDescription] = React.useState(trip.description || '');
  const [startDate, setStartDate] = React.useState(trip.start_date || '');
  const [endDate, setEndDate] = React.useState(trip.end_date || '');
  const [status, setStatus] = React.useState(trip.status);
  const [visibility, setVisibility] = React.useState(trip.visibility);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const result = await updateTripAction(trip.id, {
      title,
      slug,
      description,
      start_date: startDate || null,
      end_date: endDate || null,
      status,
      visibility,
    });

    if (result.success) {
      router.push(`/studio/trips/${trip.id}`);
    } else {
      setError(result.error || 'Failed to update trip.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <Link href={`/studio/trips/${trip.id}`} className="hover:text-white transition-colors">
          &larr; Back to Journey Overview
        </Link>
      </div>

      <Card className="bg-zinc-900/70 border-zinc-800/80">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white tracking-tight">Edit Journey</CardTitle>
            <p className="text-xs text-zinc-400">Update metadata, visibility, and expedition dates.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
                {error}
              </div>
            )}

            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <Input
              label="URL Slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />

            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                Description / Overview
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-red-500/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-red-500/50"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                  Visibility
                </label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as any)}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-red-500/50"
                >
                  <option value="PRIVATE">PRIVATE (Archival Only)</option>
                  <option value="PUBLIC">PUBLIC (Public Website)</option>
                  <option value="UNLISTED">UNLISTED</option>
                </select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-3 border-t border-zinc-800/60 pt-4">
            <Link href={`/studio/trips/${trip.id}`}>
              <Button variant="secondary" size="sm" type="button">
                Cancel
              </Button>
            </Link>
            <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
