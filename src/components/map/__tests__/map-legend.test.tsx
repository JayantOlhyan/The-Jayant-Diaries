import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as React from 'react';
import { MapLegend } from '../map-legend';

describe('MapLegend Component', () => {
  it('renders collapsed state with place count', () => {
    render(<MapLegend totalPlaces={14} />);
    expect(screen.getByText('Map Legend')).toBeDefined();
    expect(screen.getByText('14 spots')).toBeDefined();
    expect(screen.getByText('Show')).toBeDefined();
  });

  it('toggles expansion when header button is clicked', () => {
    render(<MapLegend totalPlaces={5} />);
    const toggleButton = screen.getByRole('button', { name: /map legend/i });

    // Initially collapsed
    expect(screen.queryByText('Selected Waypoint')).toBeNull();

    // Click to expand
    fireEvent.click(toggleButton);
    expect(screen.getByText('Hide')).toBeDefined();
    expect(screen.getByText('Selected Waypoint')).toBeDefined();
    expect(screen.getByText('Archived Location')).toBeDefined();
    expect(screen.getByText('Journey Expedition')).toBeDefined();

    // Click to collapse
    fireEvent.click(toggleButton);
    expect(screen.queryByText('Selected Waypoint')).toBeNull();
  });

  it('displays active journey title when expanded', () => {
    render(
      <MapLegend
        totalPlaces={8}
        activeJourneyTitle="Ladakh High Passes"
      />
    );
    const toggleButton = screen.getByRole('button', { name: /map legend/i });
    fireEvent.click(toggleButton);

    expect(screen.getByText('Active: Ladakh High Passes')).toBeDefined();
  });
});
