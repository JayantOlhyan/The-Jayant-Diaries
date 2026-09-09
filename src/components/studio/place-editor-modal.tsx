'use client';

import * as React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createPlaceAction, updatePlaceAction } from '@/server/actions/place-actions';
import { PlaceRow } from '@/types/entities';

export interface PlaceEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<PlaceRow> | null;
  onSuccess?: () => void;
}

export function PlaceEditorModal({ isOpen, onClose, initialData, onSuccess }: PlaceEditorModalProps) {
  const [name, setName] = React.useState<string>(initialData?.name || '');
  const [slug, setSlug] = React.useState<string>(initialData?.slug || '');
  const [country, setCountry] = React.useState<string>(initialData?.country || 'India');
  const [state, setState] = React.useState<string>(initialData?.state || '');
  const [city, setCity] = React.useState<string>(initialData?.city || '');
  const [latitude, setLatitude] = React.useState<string>(initialData?.latitude?.toString() || '');
  const [longitude, setLongitude] = React.useState<string>(initialData?.longitude?.toString() || '');
  const [description, setDescription] = React.useState<string>(initialData?.description || '');
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setSlug(initialData.slug || '');
      setCountry(initialData.country || 'India');
      setState(initialData.state || '');
      setCity(initialData.city || '');
      setLatitude(initialData.latitude?.toString() || '');
      setLongitude(initialData.longitude?.toString() || '');
      setDescription(initialData.description || '');
    } else {
      setName('');
      setSlug('');
      setCountry('India');
      setState('');
      setCity('');
      setLatitude('');
      setLongitude('');
      setDescription('');
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const lat = latitude ? parseFloat(latitude) : null;
    const lng = longitude ? parseFloat(longitude) : null;

    try {
      if (initialData?.id) {
        const res = await updatePlaceAction(initialData.id, {
          name,
          slug,
          country,
          state: state || null,
          city: city || null,
          latitude: lat,
          longitude: lng,
          description: description || null,
        });
        if (!res.success) throw new Error(res.error);
      } else {
        const res = await createPlaceAction({
          name,
          slug,
          country,
          state: state || null,
          city: city || null,
          latitude: lat,
          longitude: lng,
          description: description || null,
        });
        if (!res.success) throw new Error(res.error);
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save place');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={initialData?.id ? 'Edit Place' : 'Add Place'}
      description="Define geographic points of presence and coordinates for your journeys."
      className="max-w-xl bg-studio-surface border-studio-border text-studio-text"
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        {errorMessage && (
          <div className="rounded border border-red-800 bg-red-950/60 p-2.5 text-xs text-red-300">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Place Name"
            placeholder="e.g. Leh"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!initialData) {
                setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
              }
            }}
            required
            className="bg-studio-elevated border-studio-border"
          />
          <Input
            label="Slug"
            placeholder="e.g. leh"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            className="bg-studio-elevated border-studio-border"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="bg-studio-elevated border-studio-border"
          />
          <Input
            label="State / Province"
            placeholder="e.g. Ladakh"
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="bg-studio-elevated border-studio-border"
          />
          <Input
            label="City / District"
            placeholder="e.g. Leh"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="bg-studio-elevated border-studio-border"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Latitude"
            type="number"
            step="any"
            placeholder="e.g. 34.1526"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            className="bg-studio-elevated border-studio-border"
          />
          <Input
            label="Longitude"
            type="number"
            step="any"
            placeholder="e.g. 77.5771"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            className="bg-studio-elevated border-studio-border"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium uppercase tracking-wider text-studio-muted">
            Overview / Description
          </label>
          <textarea
            rows={3}
            placeholder="The historic capital of Ladakh..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-studio-border bg-studio-elevated px-3 py-2 text-sm text-studio-text placeholder-zinc-500 focus:border-studio-accent focus:outline-none focus:ring-1 focus:ring-studio-accent"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-studio-border/60">
          <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            Save Place
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
