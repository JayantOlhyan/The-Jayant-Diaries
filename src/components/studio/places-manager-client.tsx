'use client';

import * as React from 'react';
import { PlaceRow } from '@/types/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlaceEditorModal } from './place-editor-modal';
import { deletePlaceAction } from '@/server/actions/place-actions';

interface PlacesManagerClientProps {
  initialPlaces: PlaceRow[];
}

export function PlacesManagerClient({ initialPlaces }: PlacesManagerClientProps) {
  const [places, setPlaces] = React.useState<PlaceRow[]>(initialPlaces);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingPlace, setEditingPlace] = React.useState<PlaceRow | null>(null);

  const filteredPlaces = places.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.city && p.city.toLowerCase().includes(q)) ||
      (p.state && p.state.toLowerCase().includes(q)) ||
      (p.country && p.country.toLowerCase().includes(q))
    );
  });

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete place "${name}"?`)) {
      await deletePlaceAction(id);
      setPlaces((prev) => prev.filter((p) => p.id !== id));
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Places Directory</h1>
          <p className="text-xs text-zinc-400 mt-1">Geographic coordinates, locations, and altitudes visited.</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditingPlace(null);
            setIsModalOpen(true);
          }}
        >
          + Add Place
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search places by name, city, state, country..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:max-w-md bg-zinc-900/80 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50"
        />
      </div>

      {filteredPlaces.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 p-12 text-center bg-zinc-900/30">
          <p className="text-sm text-zinc-400">No places match your search.</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={() => {
              setEditingPlace(null);
              setIsModalOpen(true);
            }}
          >
            Add New Place
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlaces.map((place) => (
            <Card
              key={place.id}
              className="bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between"
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-white">{place.name}</h3>
                    <p className="text-xs text-zinc-400 font-medium">
                      {[place.city, place.state, place.country].filter(Boolean).join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPlace(place);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 text-zinc-400 hover:text-white transition-colors"
                      title="Edit Place"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(place.id, place.name)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                      title="Delete Place"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {place.description && (
                  <p className="text-xs text-zinc-300 line-clamp-2">
                    {place.description}
                  </p>
                )}

                <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                  <span>
                    {place.latitude !== null && place.longitude !== null
                      ? `${place.latitude.toFixed(4)}°N, ${place.longitude.toFixed(4)}°E`
                      : 'Coordinates not set'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PlaceEditorModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPlace(null);
        }}
        initialData={editingPlace}
        onSuccess={() => {
          // Re-sync local state if updated
          window.location.reload();
        }}
      />
    </div>
  );
}
