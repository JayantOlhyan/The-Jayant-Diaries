'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Compass,
  Layers,
  ChevronDown,
  ChevronUp,
  Info,
  Route,
  Target,
} from 'lucide-react';

export interface MapLegendProps {
  totalPlaces: number;
  activeJourneyTitle?: string | null;
  className?: string;
}

export function MapLegend({
  totalPlaces,
  activeJourneyTitle,
  className = '',
}: MapLegendProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      role="region"
      aria-label="Cartographic Map Legend"
      className={`bg-[#0B0D0E]/90 backdrop-blur-md border border-white/[0.08] rounded-xl shadow-2xl transition-all duration-300 text-white select-none ${className}`}
    >
      {/* Header bar / Toggle Button */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between gap-3 px-3.5 py-2 text-left hover:bg-white/[0.04] rounded-xl transition-colors"
        aria-expanded={isExpanded}
        aria-controls="cartography-legend-content"
      >
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-serif text-xs font-semibold tracking-wide text-neutral-200">
            Map Legend
          </span>
          <span className="text-[10px] font-mono text-neutral-400 bg-white/[0.06] px-1.5 py-0.2 rounded">
            {totalPlaces} {totalPlaces === 1 ? 'spot' : 'spots'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-neutral-400">
          <span className="text-[10px] font-mono uppercase tracking-wider hidden sm:inline">
            {isExpanded ? 'Hide' : 'Show'}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </div>
      </button>

      {/* Expanded Legend Details */}
      {isExpanded && (
        <div
          id="cartography-legend-content"
          className="px-3.5 pb-3 pt-1 space-y-3 text-xs border-t border-white/[0.06] animate-fade-in"
        >
          {activeJourneyTitle && (
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-300/90 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
              <Compass className="w-3 h-3 shrink-0" />
              <span className="truncate">Active: {activeJourneyTitle}</span>
            </div>
          )}

          {/* Symbol Keys */}
          <div className="space-y-2 font-sans text-neutral-300">
            {/* 1. Selected Pin */}
            <div className="flex items-center gap-2.5">
              <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center shadow-[0_0_8px_rgba(245,158,11,0.6)] shrink-0">
                <Target className="w-2.5 h-2.5 text-black" />
              </div>
              <div className="leading-tight">
                <p className="font-medium text-white text-[11px]">Selected Waypoint</p>
                <p className="text-[10px] text-neutral-400">Inspecting visual archive & notes</p>
              </div>
            </div>

            {/* 2. Published Waypoint */}
            <div className="flex items-center gap-2.5">
              <div className="w-4 h-4 rounded-full bg-amber-500/30 border border-amber-400/80 flex items-center justify-center shrink-0">
                <MapPin className="w-2.5 h-2.5 text-amber-300" />
              </div>
              <div className="leading-tight">
                <p className="font-medium text-white text-[11px]">Archived Location</p>
                <p className="text-[10px] text-neutral-400">Cataloged with GPS coordinates</p>
              </div>
            </div>

            {/* 3. Expedition Route */}
            <div className="flex items-center gap-2.5">
              <div className="w-4 h-4 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0">
                <Route className="w-2.5 h-2.5 text-amber-400" />
              </div>
              <div className="leading-tight">
                <p className="font-medium text-white text-[11px]">Journey Expedition</p>
                <p className="text-[10px] text-neutral-400">Sequential travel storyline</p>
              </div>
            </div>
          </div>

          {/* Navigation Tips */}
          <div className="pt-2 border-t border-white/[0.06] text-[10px] font-mono text-neutral-400 flex items-start gap-1.5">
            <Info className="w-3 h-3 text-neutral-500 shrink-0 mt-0.5" />
            <p>Click any pin to inspect archive. Press <kbd className="px-1 py-0.5 bg-white/10 rounded text-neutral-300">Esc</kbd> to close drawer.</p>
          </div>
        </div>
      )}
    </div>
  );
}
