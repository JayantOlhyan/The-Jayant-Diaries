'use client';

import * as React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { JournalToolbar } from './journal-toolbar';
import { createMemoryAction, updateMemoryAction } from '@/server/actions/memory-actions';
import { MemoryRow, TripRow, DayRow, PlaceRow } from '@/types/entities';

export interface MemoryEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  trips: TripRow[];
  days?: DayRow[];
  places?: PlaceRow[];
  initialData?: Partial<MemoryRow> | null;
  onSuccess?: () => void;
}

export function MemoryEditorModal({
  isOpen,
  onClose,
  trips,
  days = [],
  places = [],
  initialData,
  onSuccess,
}: MemoryEditorModalProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [title, setTitle] = React.useState<string>(initialData?.title || '');
  const [tripId, setTripId] = React.useState<string>(initialData?.trip_id || trips[0]?.id || '');
  const [dayId, setDayId] = React.useState<string>(initialData?.day_id || '');
  const [placeId, setPlaceId] = React.useState<string>(initialData?.place_id || '');
  const [date, setDate] = React.useState<string>(initialData?.date || '');
  const [description, setDescription] = React.useState<string>(initialData?.description || '');
  const [journal, setJournal] = React.useState<string>(initialData?.journal || '');
  const [featured, setFeatured] = React.useState<boolean>(initialData?.featured || false);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setTripId(initialData.trip_id || trips[0]?.id || '');
      setDayId(initialData.day_id || '');
      setPlaceId(initialData.place_id || '');
      setDate(initialData.date || '');
      setDescription(initialData.description || '');
      setJournal(initialData.journal || '');
      setFeatured(initialData.featured || false);
    } else {
      setTitle('');
      setTripId(trips[0]?.id || '');
      setDayId('');
      setPlaceId('');
      setDate('');
      setDescription('');
      setJournal('');
      setFeatured(false);
    }
  }, [initialData, isOpen, trips]);

  const filteredDays = days.filter((d) => !tripId || d.trip_id === tripId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (initialData?.id) {
        const res = await updateMemoryAction(
          initialData.id,
          {
            title,
            trip_id: tripId || null,
            day_id: dayId || null,
            place_id: placeId || null,
            date: date || null,
            description: description || null,
            journal: journal || null,
            featured,
          },
          tripId
        );
        if (!res.success) throw new Error(res.error);
      } else {
        const res = await createMemoryAction({
          title,
          trip_id: tripId || null,
          day_id: dayId || null,
          place_id: placeId || null,
          date: date || null,
          description: description || null,
          journal: journal || null,
          featured,
          visibility: 'PUBLIC',
        });
        if (!res.success) throw new Error(res.error);
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save memory');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={initialData?.id ? 'Edit Memory' : 'Memory Editor'}
      description="Capture the narrative and emotion behind a moment in your journey."
      className="max-w-xl bg-studio-surface border-studio-border text-studio-text"
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        {errorMessage && (
          <div className="rounded border border-red-800 bg-red-950/60 p-2.5 text-xs text-red-300">
            {errorMessage}
          </div>
        )}

        <Input
          label="Memory Title"
          placeholder="e.g. First Morning in Leh"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="bg-studio-elevated border-studio-border"
        />

        <div className="grid grid-cols-3 gap-3">
          <Select
            label="Trip"
            value={tripId}
            onChange={(e) => {
              setTripId(e.target.value);
              setDayId('');
            }}
            options={trips.map((t) => ({ value: t.id, label: t.title }))}
            className="bg-studio-elevated border-studio-border"
          />
          <Select
            label="Day"
            value={dayId}
            onChange={(e) => setDayId(e.target.value)}
            options={[
              { value: '', label: 'Unassigned Day' },
              ...filteredDays.map((d) => ({
                value: d.id,
                label: `Day ${d.day_number}${d.title ? ` - ${d.title}` : ''}`,
              })),
            ]}
            className="bg-studio-elevated border-studio-border"
          />
          <Select
            label="Place"
            value={placeId}
            onChange={(e) => setPlaceId(e.target.value)}
            options={[
              { value: '', label: 'No Place' },
              ...places.map((p) => ({ value: p.id, label: p.name })),
            ]}
            className="bg-studio-elevated border-studio-border"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-studio-elevated border-studio-border"
          />
          <div className="flex items-center pt-6 gap-2">
            <input
              type="checkbox"
              id="featured-memory"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="rounded border-studio-border bg-studio-elevated text-cinema-accent focus:ring-cinema-accent h-4 w-4 cursor-pointer"
            />
            <label htmlFor="featured-memory" className="text-xs text-studio-text cursor-pointer select-none">
              Feature on journey highlights
            </label>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium uppercase tracking-wider text-studio-muted">
            Short Excerpt / Description
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Woke up to clear skies and snow-capped peaks."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-studio-border bg-studio-elevated px-3 py-2 text-sm text-studio-text placeholder-zinc-500 focus:border-studio-accent focus:outline-none focus:ring-1 focus:ring-studio-accent"
          />
        </div>

        <div className="space-y-0">
          <label className="block text-xs font-medium uppercase tracking-wider text-studio-muted mb-1.5">
            Full Story Journal
          </label>
          <JournalToolbar textareaRef={textareaRef} />
          <textarea
            ref={textareaRef}
            rows={4}
            placeholder="A morning to remember..."
            value={journal}
            onChange={(e) => setJournal(e.target.value)}
            className="w-full rounded-b-md border border-studio-border bg-studio-elevated px-3 py-2 text-sm text-studio-text placeholder-zinc-500 focus:border-studio-accent focus:outline-none focus:ring-1 focus:ring-studio-accent font-serif leading-relaxed"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-studio-border/60">
          <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            Save Memory
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
