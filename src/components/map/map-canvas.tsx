'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { PublicMapPlace } from '@/types/entities';

interface MapCanvasProps {
  places: PublicMapPlace[];
  selectedPlaceId: string | null;
  onSelectPlace: (placeId: string | null) => void;
}

export default function MapCanvas({
  places,
  selectedPlaceId,
  onSelectPlace,
}: MapCanvasProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const onSelectPlaceRef = useRef(onSelectPlace);
  useEffect(() => {
    onSelectPlaceRef.current = onSelectPlace;
  });

  const initialCenter = useRef<[number, number]>(
    places.length > 0 && places[0]
      ? [places[0].latitude, places[0].longitude]
      : [34.1526, 77.5771]
  ).current;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 7,
      zoomControl: false,
      attributionControl: false,
      minZoom: 3,
      maxZoom: 18,
    });

    // Dark Matter CartoDB Basemap
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // Add restrained zoom control in bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Subtle attribution in bottom-left
    L.control.attribution({ position: 'bottomleft', prefix: false })
      .addAttribution('&copy; OpenStreetMap, &copy; CARTO')
      .addTo(map);

    // Clicking map canvas deselects place
    map.on('click', () => {
      onSelectPlaceRef.current(null);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [initialCenter]);

  // Update Markers and Fit Bounds
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    if (places.length === 0) return;

    const latLngs: [number, number][] = [];

    places.forEach((place) => {
      latLngs.push([place.latitude, place.longitude]);

      const isSelected = place.id === selectedPlaceId;

      const iconHtml = `
        <div class="atlas-marker-wrapper" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <div style="
            width: ${isSelected ? '16px' : '10px'};
            height: ${isSelected ? '16px' : '10px'};
            border-radius: 50%;
            background-color: ${isSelected ? '#FBBF24' : '#F59E0B'};
            border: 2px solid ${isSelected ? '#FFFFFF' : '#0B0D0E'};
            box-shadow: ${isSelected ? '0 0 12px rgba(251, 191, 36, 0.6), 0 0 0 4px rgba(251, 191, 36, 0.2)' : '0 2px 4px rgba(0,0,0,0.8)'};
            transition: all 0.2s ease-out;
          "></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-atlas-pin',
        html: iconHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([place.latitude, place.longitude], {
        icon: customIcon,
        title: place.name,
      });

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectPlaceRef.current(place.id);
      });

      marker.addTo(map);
      markersRef.current.set(place.id, marker);
    });

    // If no place is explicitly selected, fit bounds to show all places
    if (!selectedPlaceId && latLngs.length > 0) {
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 12,
        animate: true,
      });
    }
  }, [places, selectedPlaceId]);

  // Center on selected place when selectedPlaceId changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedPlaceId) return;

    const selectedPlace = places.find((p) => p.id === selectedPlaceId);
    if (selectedPlace) {
      map.flyTo([selectedPlace.latitude, selectedPlace.longitude], Math.max(map.getZoom(), 10), {
        duration: 0.8,
      });
    }

    // Update marker icons to reflect active selection
    markersRef.current.forEach((marker, id) => {
      const isSelected = id === selectedPlaceId;
      const iconHtml = `
        <div class="atlas-marker-wrapper" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <div style="
            width: ${isSelected ? '16px' : '10px'};
            height: ${isSelected ? '16px' : '10px'};
            border-radius: 50%;
            background-color: ${isSelected ? '#FBBF24' : '#F59E0B'};
            border: 2px solid ${isSelected ? '#FFFFFF' : '#0B0D0E'};
            box-shadow: ${isSelected ? '0 0 12px rgba(251, 191, 36, 0.6), 0 0 0 4px rgba(251, 191, 36, 0.2)' : '0 2px 4px rgba(0,0,0,0.8)'};
            transition: all 0.2s ease-out;
          "></div>
        </div>
      `;
      marker.setIcon(
        L.divIcon({
          className: 'custom-atlas-pin',
          html: iconHtml,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        })
      );
    });
  }, [selectedPlaceId, places]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full bg-[#0B0D0E] outline-none select-none"
      tabIndex={0}
      aria-label="Geographic atlas map canvas"
    />
  );
}
