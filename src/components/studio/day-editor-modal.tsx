'use client';

import * as React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { JournalToolbar } from './journal-toolbar';
import { createDayAction, updateDayAction } from '@/server/actions/day-actions';
import { DayRow } from '@/types/entities';

export interface DayEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  tripTitle?: string;
  initialData?: Partial<DayRow> | null;
  onSuccess?: () => void;
}

export function DayEditorModal({
  isOpen,
  onClose,
  tripId,
  tripTitle = 'Journey',
  initialData,
  onSuccess,
}: DayEditorModalProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [dayNumber, setDayNumber] = React.useState<number>(initialData?.day_number || 1);
  const [date, setDate] = React.useState<string>(initialData?.date || '');
  const [title, setTitle] = React.useState<string>(initialData?.title || '');
  const [description, setDescription] = React.useState<string>(initialData?.description || '');
  const [journal, setJournal] = React.useState<string>(initialData?.journal || '');
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (initialData) {
      setDayNumber(initialData.day_number || 1);
      setDate(initialData.date || '');
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setJournal(initialData.journal || '');
    } else {
      setDayNumber(1);
      setDate('');
      setTitle('');
      setDescription('');
      setJournal('');
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (initialData?.id) {
        const res = await updateDayAction(initialData.id, tripId, {
          day_number: dayNumber,
          date: date || null,
          title: title || null,
          description: description || null,
          journal: journal || null,
        });
        if (!res.success) throw new Error(res.error);
      } else {
        const res = await createDayAction({
          trip_id: tripId,
          day_number: dayNumber,
          date: date || null,
          title: title || null,
          description: description || null,
          journal: journal || null,
        });
        if (!res.success) throw new Error(res.error);
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save day');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={initialData?.id ? `Edit Day ${dayNumber} (${tripTitle})` : `New Day (${tripTitle})`}
      description="Record itinerary highlights, routes, and journal entries."
      className="max-w-xl bg-studio-surface border-studio-border text-studio-text"
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        {errorMessage && (
          <div className="rounded border border-red-800 bg-red-950/60 p-2.5 text-xs text-red-300">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Day Number"
            type="number"
            min={1}
            value={dayNumber}
            onChange={(e) => setDayNumber(parseInt(e.target.value) || 1)}
            required
            className="bg-studio-elevated border-studio-border"
          />
          <div className="col-span-2">
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-studio-elevated border-studio-border"
            />
          </div>
        </div>

        <Input
          label="Title"
          placeholder="e.g. Arrival in Leh"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-studio-elevated border-studio-border"
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-medium uppercase tracking-wider text-studio-muted">
            Route Description
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Landed in Leh, acclimatized and explored the city."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-studio-border bg-studio-elevated px-3 py-2 text-sm text-studio-text placeholder-zinc-500 focus:border-studio-accent focus:outline-none focus:ring-1 focus:ring-studio-accent"
          />
        </div>

        <div className="space-y-0">
          <label className="block text-xs font-medium uppercase tracking-wider text-studio-muted mb-1.5">
            Journal Entry
          </label>
          <JournalToolbar textareaRef={textareaRef} />
          <textarea
            ref={textareaRef}
            rows={4}
            placeholder="The thin air, the warm sunlight, and the surreal mountains..."
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
            Save Day
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
