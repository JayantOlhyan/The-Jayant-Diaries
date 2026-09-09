'use client';

import * as React from 'react';

export type TripTab = 'overview' | 'days' | 'places' | 'memories' | 'media';

export interface TripTabNavProps {
  activeTab: TripTab;
  onTabChange: (tab: TripTab) => void;
  counts?: {
    days?: number;
    places?: number;
    memories?: number;
    media?: number;
  };
}

export function TripTabNav({ activeTab, onTabChange, counts }: TripTabNavProps) {
  const tabs: { id: TripTab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'days', label: 'Days', count: counts?.days },
    { id: 'places', label: 'Places', count: counts?.places },
    { id: 'memories', label: 'Memories', count: counts?.memories },
    { id: 'media', label: 'Media', count: counts?.media },
  ];

  return (
    <div className="flex border-b border-studio-border bg-studio-surface px-6">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
              isActive
                ? 'border-cinema-accent text-white'
                : 'border-transparent text-studio-muted hover:border-studio-border hover:text-white'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] ${
                  isActive ? 'bg-cinema-accent/20 text-amber-300' : 'bg-studio-elevated text-studio-muted'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
