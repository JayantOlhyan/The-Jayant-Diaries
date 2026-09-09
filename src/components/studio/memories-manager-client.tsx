'use client';

import * as React from 'react';
import { MemoryRow, TripRow, DayRow, PlaceRow } from '@/types/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MemoryEditorModal } from './memory-editor-modal';
import { deleteMemoryAction } from '@/server/actions/memory-actions';
import { formatDate } from '@/lib/utils';

interface MemoriesManagerClientProps {
  initialMemories: MemoryRow[];
  trips: TripRow[];
  days: DayRow[];
  places: PlaceRow[];
}

export function MemoriesManagerClient({
  initialMemories,
  trips,
  days,
  places,
}: MemoriesManagerClientProps) {
  const [memories, setMemories] = React.useState<MemoryRow[]>(initialMemories);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedTripId, setSelectedTripId] = React.useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingMemory, setEditingMemory] = React.useState<MemoryRow | null>(null);

  const tripMap = React.useMemo(() => new Map(trips.map((t) => [t.id, t.title])), [trips]);
  const placeMap = React.useMemo(() => new Map(places.map((p) => [p.id, p.name])), [places]);

  const filteredMemories = memories.filter((m) => {
    const matchesTrip = selectedTripId === 'ALL' || m.trip_id === selectedTripId;
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      m.title.toLowerCase().includes(q) ||
      (m.description && m.description.toLowerCase().includes(q)) ||
      (m.journal && m.journal.toLowerCase().includes(q));
    return matchesTrip && matchesQuery;
  });

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete memory "${title}"?`)) {
      await deleteMemoryAction(id);
      setMemories((prev) => prev.filter((m) => m.id !== id));
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Memories Archive</h1>
          <p className="text-xs text-zinc-400 mt-1">Deep reflections, observations, and stories behind journeys.</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditingMemory(null);
            setIsModalOpen(true);
          }}
        >
          + New Memory
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <input
          type="text"
          placeholder="Search memories by title, reflection, journal text..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:max-w-md bg-zinc-900/80 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50"
        />
        <select
          value={selectedTripId}
          onChange={(e) => setSelectedTripId(e.target.value)}
          className="bg-zinc-900/80 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500/50"
        >
          <option value="ALL">All Journeys</option>
          {trips.map((trip) => (
            <option key={trip.id} value={trip.id}>
              {trip.title}
            </option>
          ))}
        </select>
      </div>

      {filteredMemories.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 p-12 text-center bg-zinc-900/30">
          <p className="text-sm text-zinc-400">No memories found.</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={() => {
              setEditingMemory(null);
              setIsModalOpen(true);
            }}
          >
            Record New Memory
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMemories.map((mem) => {
            const tripName = mem.trip_id ? tripMap.get(mem.trip_id) : null;
            const placeName = mem.place_id ? placeMap.get(mem.place_id) : null;

            return (
              <Card
                key={mem.id}
                className="bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between"
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">{mem.title}</h3>
                        {mem.featured && (
                          <Badge variant="accent" size="sm">
                            Featured
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                        {tripName && <span className="text-red-400 font-medium">{tripName}</span>}
                        {placeName && <span>• {placeName}</span>}
                        {mem.date && <span>• {formatDate(mem.date)}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMemory(mem);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 text-zinc-400 hover:text-white transition-colors"
                        title="Edit Memory"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(mem.id, mem.title)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                        title="Delete Memory"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {mem.description && (
                    <p className="text-xs text-zinc-300 italic">
                      &ldquo;{mem.description}&rdquo;
                    </p>
                  )}

                  {mem.journal && (
                    <p className="text-xs text-zinc-400 line-clamp-3 bg-zinc-950/40 p-3 rounded-lg border border-zinc-800/40 font-mono">
                      {mem.journal}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <MemoryEditorModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMemory(null);
        }}
        trips={trips}
        days={days}
        places={places}
        initialData={editingMemory}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}
