'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Copy, Check, Trash2, Star, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { MediaRow, TripRow, DayRow, PlaceRow } from '@/types/entities';
import { VisibilityType } from '@/types/database';
import { getNormalizedImageUrl, getImageAlt } from '@/lib/utils/image-provider';
import { updateMediaAction, deleteMediaAction, setCoverMediaAction } from '@/server/actions/media-actions';
import { ImageFrame } from '@/components/ui/image-frame';

interface MediaDetailModalProps {
  media: MediaRow | null;
  isOpen: boolean;
  onClose: () => void;
  trips: TripRow[];
  days: DayRow[];
  places: PlaceRow[];
  onUpdated: (updated: MediaRow) => void;
  onDeleted: (deletedId: string) => void;
}

export function MediaDetailModal({
  media,
  isOpen,
  onClose,
  trips,
  days,
  places,
  onUpdated,
  onDeleted,
}: MediaDetailModalProps) {
  const [caption, setCaption] = useState('');
  const [altText, setAltText] = useState('');
  const [tripId, setTripId] = useState('');
  const [dayId, setDayId] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [position, setPosition] = useState(0);
  const [visibility, setVisibility] = useState<VisibilityType>('PUBLIC');

  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSettingCover, setIsSettingCover] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (media) {
      setCaption(media.caption || '');
      setAltText(media.alt_text || '');
      setTripId(media.trip_id || '');
      setDayId(media.day_id || '');
      setPlaceId(media.place_id || '');
      setPosition(media.position ?? 0);
      setVisibility(media.visibility || 'PUBLIC');
      setFeedback(null);
    }
  }, [media]);

  if (!isOpen || !media) return null;

  const previewUrl = getNormalizedImageUrl(media.thumbnail_url || media.storage_url || '');
  const filteredDays = tripId ? days.filter((d) => d.trip_id === tripId) : days;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(media.storage_url || previewUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    const payload: Partial<MediaRow> = {
      caption: caption.trim() || null,
      alt_text: altText.trim() || null,
      trip_id: tripId || null,
      day_id: dayId || null,
      place_id: placeId || null,
      position: Number(position) || 0,
      visibility,
    };

    const res = await updateMediaAction(media.id, payload);

    if (res.success && res.media) {
      setFeedback({ type: 'success', text: 'Changes saved successfully.' });
      onUpdated(res.media);
      setTimeout(() => {
        onClose();
      }, 700);
    } else {
      setFeedback({ type: 'error', text: res.error || 'Failed to save changes.' });
    }

    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this media reference?')) {
      return;
    }

    setIsDeleting(true);
    setFeedback(null);

    const res = await deleteMediaAction(media.id, media.trip_id);

    if (res.success) {
      onDeleted(media.id);
      onClose();
    } else {
      setFeedback({ type: 'error', text: res.error || 'Failed to delete media.' });
      setIsDeleting(false);
    }
  };

  const handleSetCover = async () => {
    const targetType = placeId ? 'place' : dayId ? 'day' : tripId ? 'trip' : null;
    const targetId = placeId || dayId || tripId;

    if (!targetType || !targetId) {
      setFeedback({ type: 'error', text: 'Select a Trip, Day, or Place first to set this as cover.' });
      return;
    }

    setIsSettingCover(true);
    const res = await setCoverMediaAction(targetType, targetId, media.id);

    if (res.success) {
      setFeedback({ type: 'success', text: `Set as cover for selected ${targetType}!` });
    } else {
      setFeedback({ type: 'error', text: res.error || 'Failed to set as cover.' });
    }
    setIsSettingCover(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/10">
          <div className="space-y-1 pr-6">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-white truncate">
                {caption || media.filename}
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-white/10 text-neutral-300">
                {media.type}
              </span>
            </div>
            <p className="text-xs text-neutral-400 font-mono">
              ID: {media.id.slice(0, 8)}... &bull; Added {new Date(media.created_at).toLocaleDateString()}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <Check className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Media Preview Box */}
        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center group">
          <ImageFrame
            src={previewUrl}
            alt={altText || caption || media.filename}
            fill
            className="object-contain"
          />
          <a
            href={media.storage_url || previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-3 right-3 p-2 rounded-lg bg-black/70 text-white/80 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity border border-white/10"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* File URL with Copy Button */}
          <div className="space-y-1.5">
            <label className="text-neutral-400 font-medium">File URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={media.storage_url || previewUrl}
                className="flex-1 px-3 py-2 bg-neutral-950/70 border border-white/10 rounded-lg text-neutral-300 font-mono text-xs select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyUrl}
                className="px-3 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg flex items-center gap-1.5 font-medium transition-colors"
                title="Copy to clipboard"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {isCopied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Caption */}
          <div className="space-y-1.5">
            <label className="text-neutral-400 font-medium">Caption</label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="e.g. Pangong Lake at Sunset"
              className="w-full px-3 py-2 bg-neutral-950/70 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Alt Text */}
          <div className="space-y-1.5">
            <label className="text-neutral-400 font-medium">Alt Text (Accessibility & SEO)</label>
            <textarea
              rows={2}
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Describe what is visible in the photo..."
              className="w-full px-3 py-2 bg-neutral-950/70 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Relation Dropdowns: Trip, Day, Place */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-neutral-400 font-medium">Trip</label>
              <select
                value={tripId}
                onChange={(e) => {
                  setTripId(e.target.value);
                  setDayId(''); // Reset day when trip changes
                }}
                className="w-full px-3 py-2 bg-neutral-950/70 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-500/50"
              >
                <option value="">None / Unassigned</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-neutral-400 font-medium">Day</label>
              <select
                value={dayId}
                onChange={(e) => setDayId(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950/70 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-500/50"
              >
                <option value="">None / Unassigned</option>
                {filteredDays.map((d) => (
                  <option key={d.id} value={d.id}>
                    Day {d.day_number}: {d.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-neutral-400 font-medium">Place</label>
              <select
                value={placeId}
                onChange={(e) => setPlaceId(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950/70 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-500/50"
              >
                <option value="">None / Unassigned</option>
                {places.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Position Order & Visibility */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-neutral-400 font-medium">Display Order</label>
              <input
                type="number"
                value={position}
                onChange={(e) => setPosition(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 bg-neutral-950/70 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-neutral-400 font-medium">Visibility</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as VisibilityType)}
                className="w-full px-3 py-2 bg-neutral-950/70 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-500/50"
              >
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private (Archival)</option>
              </select>
            </div>
          </div>

          {/* Cover Action Button */}
          {(tripId || dayId || placeId) && (
            <div className="pt-2">
              <button
                type="button"
                disabled={isSettingCover}
                onClick={handleSetCover}
                className="w-full py-2 px-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                {isSettingCover ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Star className="w-3.5 h-3.5" />}
                Set as Cover for {placeId ? 'Selected Place' : dayId ? 'Selected Day' : 'Selected Trip'}
              </button>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            <button
              type="button"
              disabled={isDeleting || isSaving}
              onClick={handleDelete}
              className="px-3.5 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg border border-rose-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Delete
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || isDeleting}
                className="px-5 py-2 bg-white text-black hover:bg-neutral-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg"
              >
                {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
