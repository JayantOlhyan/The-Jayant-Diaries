'use client';

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { createTripAction } from "@/server/actions/trip-actions";

export default function NewTripPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    setSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createTripAction(formData);

    if (result.success && result.trip) {
      router.push(`/studio/trips/${result.trip.id}`);
    } else {
      setError(result.error || "Failed to create trip.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <Link href="/studio/trips" className="hover:text-white transition-colors">
          &larr; Back to Trips
        </Link>
      </div>

      <Card className="bg-zinc-900/70 border-zinc-800/80">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white tracking-tight">Create New Journey</CardTitle>
            <p className="text-xs text-zinc-400">Initialize a new travel expedition in the archive.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
                {error}
              </div>
            )}

            <Input
              name="title"
              label="Title"
              placeholder="e.g. Spiti Valley Expedition"
              value={title}
              onChange={handleTitleChange}
              required
            />

            <Input
              name="slug"
              label="URL Slug"
              placeholder="e.g. spiti-valley-expedition"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />

            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                Description / Overview
              </label>
              <textarea
                name="description"
                rows={3}
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-red-500/50"
                placeholder="High-altitude traversing across the trans-Himalayan desert..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input name="start_date" label="Start Date" type="date" />
              <Input name="end_date" label="End Date" type="date" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                  Status
                </label>
                <select
                  name="status"
                  defaultValue="DRAFT"
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
                  name="visibility"
                  defaultValue="PRIVATE"
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
            <Link href="/studio/trips">
              <Button variant="secondary" size="sm" type="button">
                Cancel
              </Button>
            </Link>
            <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Save Journey"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
