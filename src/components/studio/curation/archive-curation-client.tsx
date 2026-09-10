'use client';

import * as React from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Copy,
  Archive,
  Eye,
  EyeOff,
  Filter,
  RefreshCw,
  Search,
  Calendar,
  MapPin,
  Compass,
  Layers,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import {
  ArchiveHealthStats,
  CurationQueueItem,
  DuplicateGroup,
  TripRow,
  DayRow,
  PlaceRow,
  CurationFilter,
  CurationStatus,
  MediaRow,
} from '@/types/entities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ImageFrame } from '@/components/ui/image-frame';
import { getNormalizedImageUrl } from '@/lib/utils/image-provider';
import {
  getArchiveHealthAction,
  getCurationQueueAction,
  getDuplicateGroupsAction,
  updateMediaCurationAction,
  bulkUpdateMediaCurationAction,
  publishMediaAction,
  archiveMediaAction,
  resolveDuplicateAction,
} from '@/server/actions/curation-actions';

interface ArchiveCurationClientProps {
  initialHealth: ArchiveHealthStats;
  initialQueue: { items: CurationQueueItem[]; totalCount: number };
  initialDuplicates: DuplicateGroup[];
  trips: TripRow[];
  days: DayRow[];
  places: PlaceRow[];
}

type TabType = 'QUEUE' | 'DUPLICATES' | 'READINESS';

export function ArchiveCurationClient({
  initialHealth,
  initialQueue,
  initialDuplicates,
  trips,
  days,
  places,
}: ArchiveCurationClientProps) {
  const [activeTab, setActiveTab] = React.useState<TabType>('QUEUE');
  const [health, setHealth] = React.useState<ArchiveHealthStats>(initialHealth);
  const [queue, setQueue] = React.useState<CurationQueueItem[]>(initialQueue.items);
  const [totalCount, setTotalCount] = React.useState<number>(initialQueue.totalCount);
  const [duplicateGroups, setDuplicateGroups] = React.useState<DuplicateGroup[]>(initialDuplicates);

  // Filter State
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedStatus, setSelectedStatus] = React.useState<string>('ALL');
  const [filterMissingMeta, setFilterMissingMeta] = React.useState(false);
  const [filterUnassignedTrip, setFilterUnassignedTrip] = React.useState(false);
  const [filterUnassignedDay, setFilterUnassignedDay] = React.useState(false);
  const [filterUnassignedPlace, setFilterUnassignedPlace] = React.useState(false);
  const [selectedTripId, setSelectedTripId] = React.useState('ALL');
  const [selectedVisibility, setSelectedVisibility] = React.useState<'ALL' | 'PUBLIC' | 'PRIVATE'>('ALL');

  // Multi-select state
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  // Bulk action inline state
  const [bulkTripId, setBulkTripId] = React.useState<string>('');
  const [bulkDayId, setBulkDayId] = React.useState<string>('');
  const [bulkPlaceId, setBulkPlaceId] = React.useState<string>('');

  // Async indicators
  const [isLoading, setIsLoading] = React.useState(false);
  const [actionMessage, setActionMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Clear message timer
  React.useEffect(() => {
    if (actionMessage) {
      const timer = setTimeout(() => setActionMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [actionMessage]);

  // Reload current data
  const refreshData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const currentFilter: CurationFilter = {
        search: searchQuery || undefined,
        status: (selectedStatus as any) || undefined,
        missingMetadata: filterMissingMeta || undefined,
        unassignedTrip: filterUnassignedTrip || undefined,
        unassignedDay: filterUnassignedDay || undefined,
        unassignedPlace: filterUnassignedPlace || undefined,
        tripId: selectedTripId !== 'ALL' ? selectedTripId : undefined,
        visibility: selectedVisibility !== 'ALL' ? selectedVisibility : undefined,
      };

      const [healthRes, queueRes, dupRes] = await Promise.all([
        getArchiveHealthAction(),
        getCurationQueueAction(currentFilter, 50, 0),
        getDuplicateGroupsAction(),
      ]);

      if (healthRes.success && healthRes.stats) {
        setHealth(healthRes.stats);
      }
      if (queueRes.success && queueRes.items) {
        setQueue(queueRes.items);
        setTotalCount(queueRes.totalCount ?? 0);
      }
      if (dupRes.success && dupRes.groups) {
        setDuplicateGroups(dupRes.groups);
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Failed to refresh data' });
    } finally {
      setIsLoading(false);
    }
  }, [
    searchQuery,
    selectedStatus,
    filterMissingMeta,
    filterUnassignedTrip,
    filterUnassignedDay,
    filterUnassignedPlace,
    selectedTripId,
    selectedVisibility,
  ]);

  // Trigger search on filter changes with debounce
  React.useEffect(() => {
    const handler = setTimeout(() => {
      refreshData();
    }, 250);
    return () => clearTimeout(handler);
  }, [
    searchQuery,
    selectedStatus,
    filterMissingMeta,
    filterUnassignedTrip,
    filterUnassignedDay,
    filterUnassignedPlace,
    selectedTripId,
    selectedVisibility,
    refreshData,
  ]);

  // Toggle selection
  const toggleSelectAll = () => {
    if (selectedIds.size === queue.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(queue.map((q) => q.media.id)));
    }
  };

  const toggleSelectId = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Single-item updates
  const handleUpdateItem = async (mediaId: string, updates: Partial<MediaRow>) => {
    setIsLoading(true);
    const res = await updateMediaCurationAction(mediaId, updates);
    if (res.success) {
      setActionMessage({ type: 'success', text: 'Media item updated successfully.' });
      await refreshData();
    } else {
      setActionMessage({ type: 'error', text: res.error || 'Failed to update item.' });
      setIsLoading(false);
    }
  };

  // Single-item publish
  const handlePublishItem = async (mediaId: string) => {
    setIsLoading(true);
    const res = await publishMediaAction(mediaId);
    if (res.success) {
      setActionMessage({ type: 'success', text: 'Media item published successfully!' });
      await refreshData();
    } else {
      setActionMessage({ type: 'error', text: res.error || 'Failed to publish media.' });
      setIsLoading(false);
    }
  };

  // Single-item archive
  const handleArchiveItem = async (mediaId: string) => {
    setIsLoading(true);
    const res = await archiveMediaAction(mediaId);
    if (res.success) {
      setActionMessage({ type: 'success', text: 'Media item archived non-destructively.' });
      await refreshData();
    } else {
      setActionMessage({ type: 'error', text: res.error || 'Failed to archive media.' });
      setIsLoading(false);
    }
  };

  // Bulk actions with item-level failure isolation
  const handleBulkUpdate = async (updates: Partial<MediaRow>) => {
    if (selectedIds.size === 0) return;
    setIsLoading(true);
    const ids = Array.from(selectedIds);
    const res = await bulkUpdateMediaCurationAction(ids, updates);

    if (res.success) {
      const succCount = res.successful?.length || 0;
      const failCount = res.failed?.length || 0;
      if (failCount === 0) {
        setActionMessage({
          type: 'success',
          text: `Successfully updated all ${succCount} selected items.`,
        });
      } else {
        const sampleErrors = res.failed?.slice(0, 2).map((f) => f.error).join('; ');
        setActionMessage({
          type: 'error',
          text: `Updated ${succCount} items. ${failCount} items failed (${sampleErrors}).`,
        });
      }
      setSelectedIds(new Set());
      await refreshData();
    } else {
      setActionMessage({ type: 'error', text: res.error || 'Bulk update failed.' });
      setIsLoading(false);
    }
  };

  // Duplicate group actions
  const handleResolveDuplicates = async (action: 'archive_duplicates' | 'keep_both', duplicateIds: string[]) => {
    setIsLoading(true);
    const res = await resolveDuplicateAction(action, duplicateIds);
    if (res.success) {
      const msg =
        action === 'archive_duplicates'
          ? `Archived ${duplicateIds.length} duplicate media items.`
          : `Kept and marked ${duplicateIds.length} duplicate items as curated.`;
      setActionMessage({ type: 'success', text: msg });
      await refreshData();
    } else {
      setActionMessage({ type: 'error', text: res.error || 'Failed to resolve duplicates.' });
      setIsLoading(false);
    }
  };

  // Days options filtered for selected trip
  const getDaysForTrip = (tripId?: string | null) => {
    if (!tripId) return [];
    return days.filter((d) => d.trip_id === tripId);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-studio-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold tracking-widest uppercase text-studio-muted">
              Archive Intelligence & Editorial
            </span>
            <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-[10px] bg-amber-500/5">
              Deterministic Curation
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Archive Health & Curation
          </h1>
          <p className="text-xs text-studio-muted mt-1">
            Review ingestion health, resolve unassigned media, resolve duplicates, and publish curated journey archives.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={isLoading}
            className="text-xs border-studio-border bg-studio-surface text-studio-text hover:bg-studio-elevated"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-lg border text-xs flex items-center justify-between transition-all ${
            actionMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-studio-muted hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Archive Health Metrics Cards (Zero remains strictly 0) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Total Media */}
        <div
          onClick={() => {
            setSelectedStatus('ALL');
            setFilterMissingMeta(false);
            setFilterUnassignedTrip(false);
            setFilterUnassignedDay(false);
            setFilterUnassignedPlace(false);
            setActiveTab('QUEUE');
          }}
          className="bg-studio-surface border border-studio-border hover:border-studio-muted/50 transition-colors p-3.5 rounded-lg cursor-pointer flex flex-col justify-between"
        >
          <span className="text-[10px] font-semibold tracking-wider uppercase text-studio-muted">Total Media</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-white">{health.totalMedia}</span>
            <Layers className="w-3.5 h-3.5 text-studio-muted" />
          </div>
        </div>

        {/* Needs Review */}
        <div
          onClick={() => {
            setSelectedStatus('REVIEW_REQUIRED');
            setActiveTab('QUEUE');
          }}
          className={`bg-studio-surface border transition-colors p-3.5 rounded-lg cursor-pointer flex flex-col justify-between ${
            health.needsReview > 0
              ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60'
              : 'border-studio-border hover:border-studio-muted/50'
          }`}
        >
          <span className="text-[10px] font-semibold tracking-wider uppercase text-amber-400">Needs Review</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-amber-300">{health.needsReview}</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
        </div>

        {/* Missing Metadata */}
        <div
          onClick={() => {
            setFilterMissingMeta(true);
            setActiveTab('QUEUE');
          }}
          className={`bg-studio-surface border transition-colors p-3.5 rounded-lg cursor-pointer flex flex-col justify-between ${
            health.missingMetadata > 0
              ? 'border-orange-500/30 bg-orange-500/5 hover:border-orange-500/60'
              : 'border-studio-border hover:border-studio-muted/50'
          }`}
        >
          <span className="text-[10px] font-semibold tracking-wider uppercase text-orange-400">Missing Meta</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-orange-300">{health.missingMetadata}</span>
            <Calendar className="w-3.5 h-3.5 text-orange-400" />
          </div>
        </div>

        {/* Unassigned */}
        <div
          onClick={() => {
            setFilterUnassignedTrip(true);
            setFilterUnassignedDay(true);
            setFilterUnassignedPlace(true);
            setActiveTab('QUEUE');
          }}
          className={`bg-studio-surface border transition-colors p-3.5 rounded-lg cursor-pointer flex flex-col justify-between ${
            health.unassigned > 0
              ? 'border-purple-500/30 bg-purple-500/5 hover:border-purple-500/60'
              : 'border-studio-border hover:border-studio-muted/50'
          }`}
        >
          <span className="text-[10px] font-semibold tracking-wider uppercase text-purple-400">Unassigned</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-purple-300">{health.unassigned}</span>
            <MapPin className="w-3.5 h-3.5 text-purple-400" />
          </div>
        </div>

        {/* Duplicates */}
        <div
          onClick={() => {
            setActiveTab('DUPLICATES');
          }}
          className={`bg-studio-surface border transition-colors p-3.5 rounded-lg cursor-pointer flex flex-col justify-between ${
            health.duplicates > 0
              ? 'border-rose-500/30 bg-rose-500/5 hover:border-rose-500/60'
              : 'border-studio-border hover:border-studio-muted/50'
          }`}
        >
          <span className="text-[10px] font-semibold tracking-wider uppercase text-rose-400">Duplicates</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-rose-300">{health.duplicates}</span>
            <Copy className="w-3.5 h-3.5 text-rose-400" />
          </div>
        </div>

        {/* Ready to Publish */}
        <div
          onClick={() => {
            setSelectedStatus('CURATED');
            setActiveTab('READINESS');
          }}
          className="bg-studio-surface border border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60 transition-colors p-3.5 rounded-lg cursor-pointer flex flex-col justify-between"
        >
          <span className="text-[10px] font-semibold tracking-wider uppercase text-emerald-400">Ready</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-emerald-300">{health.readyToPublish}</span>
            <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>

        {/* Private */}
        <div
          onClick={() => {
            setSelectedVisibility('PRIVATE');
            setActiveTab('QUEUE');
          }}
          className="bg-studio-surface border border-studio-border hover:border-studio-muted/50 transition-colors p-3.5 rounded-lg cursor-pointer flex flex-col justify-between"
        >
          <span className="text-[10px] font-semibold tracking-wider uppercase text-studio-muted">Private</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-studio-text">{health.privateCount}</span>
            <EyeOff className="w-3.5 h-3.5 text-studio-muted" />
          </div>
        </div>

        {/* Published */}
        <div
          onClick={() => {
            setSelectedVisibility('PUBLIC');
            setActiveTab('QUEUE');
          }}
          className="bg-studio-surface border border-studio-border hover:border-studio-muted/50 transition-colors p-3.5 rounded-lg cursor-pointer flex flex-col justify-between"
        >
          <span className="text-[10px] font-semibold tracking-wider uppercase text-sky-400">Published</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-sky-300">{health.publishedCount}</span>
            <Eye className="w-3.5 h-3.5 text-sky-400" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-studio-border">
        <button
          onClick={() => setActiveTab('QUEUE')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'QUEUE'
              ? 'border-amber-400 text-white'
              : 'border-transparent text-studio-muted hover:text-white'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          Review Queue ({totalCount})
        </button>

        <button
          onClick={() => setActiveTab('DUPLICATES')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'DUPLICATES'
              ? 'border-amber-400 text-white'
              : 'border-transparent text-studio-muted hover:text-white'
          }`}
        >
          <Copy className="w-3.5 h-3.5" />
          Duplicate Detection ({duplicateGroups.length} groups)
        </button>

        <button
          onClick={() => setActiveTab('READINESS')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'READINESS'
              ? 'border-amber-400 text-white'
              : 'border-transparent text-studio-muted hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Readiness Invariants
        </button>
      </div>

      {/* TAB 1: REVIEW QUEUE */}
      {activeTab === 'QUEUE' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-studio-surface border border-studio-border p-4 rounded-lg space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-studio-muted" />
                <input
                  type="text"
                  placeholder="Filter by filename, caption, or alt text..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-studio-elevated border border-studio-border rounded-md pl-9 pr-3 py-1.5 text-xs text-white placeholder-studio-muted focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Status filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-studio-elevated border border-studio-border rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="ALL">Status: All</option>
                <option value="IMPORTED">Status: IMPORTED</option>
                <option value="REVIEW_REQUIRED">Status: REVIEW_REQUIRED</option>
                <option value="CURATED">Status: CURATED</option>
                <option value="ARCHIVED">Status: ARCHIVED</option>
              </select>

              {/* Trip filter */}
              <select
                value={selectedTripId}
                onChange={(e) => setSelectedTripId(e.target.value)}
                className="bg-studio-elevated border border-studio-border rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="ALL">All Trips</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>

              {/* Visibility filter */}
              <select
                value={selectedVisibility}
                onChange={(e) => setSelectedVisibility(e.target.value as any)}
                className="bg-studio-elevated border border-studio-border rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="ALL">Visibility: All</option>
                <option value="PRIVATE">Private Only</option>
                <option value="PUBLIC">Published Only</option>
              </select>
            </div>

            {/* Quick Filter Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-studio-border/50">
              <span className="text-[10px] uppercase font-bold tracking-wider text-studio-muted mr-1">
                Quick Attention:
              </span>

              <button
                onClick={() => setFilterMissingMeta(!filterMissingMeta)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                  filterMissingMeta
                    ? 'border-orange-500/60 bg-orange-500/10 text-orange-300 font-medium'
                    : 'border-studio-border bg-studio-elevated/40 text-studio-muted hover:text-white'
                }`}
              >
                Missing Date / Dimensions
              </button>

              <button
                onClick={() => setFilterUnassignedTrip(!filterUnassignedTrip)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                  filterUnassignedTrip
                    ? 'border-purple-500/60 bg-purple-500/10 text-purple-300 font-medium'
                    : 'border-studio-border bg-studio-elevated/40 text-studio-muted hover:text-white'
                }`}
              >
                Unassigned Trip
              </button>

              <button
                onClick={() => setFilterUnassignedDay(!filterUnassignedDay)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                  filterUnassignedDay
                    ? 'border-purple-500/60 bg-purple-500/10 text-purple-300 font-medium'
                    : 'border-studio-border bg-studio-elevated/40 text-studio-muted hover:text-white'
                }`}
              >
                Unassigned Day
              </button>

              <button
                onClick={() => setFilterUnassignedPlace(!filterUnassignedPlace)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                  filterUnassignedPlace
                    ? 'border-purple-500/60 bg-purple-500/10 text-purple-300 font-medium'
                    : 'border-studio-border bg-studio-elevated/40 text-studio-muted hover:text-white'
                }`}
              >
                Unassigned Place
              </button>

              {(filterMissingMeta ||
                filterUnassignedTrip ||
                filterUnassignedDay ||
                filterUnassignedPlace ||
                selectedStatus !== 'ALL' ||
                selectedTripId !== 'ALL' ||
                selectedVisibility !== 'ALL' ||
                searchQuery) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedStatus('ALL');
                    setFilterMissingMeta(false);
                    setFilterUnassignedTrip(false);
                    setFilterUnassignedDay(false);
                    setFilterUnassignedPlace(false);
                    setSelectedTripId('ALL');
                    setSelectedVisibility('ALL');
                  }}
                  className="text-[10px] text-amber-400 hover:underline ml-auto"
                >
                  Reset all filters
                </button>
              )}
            </div>
          </div>

          {/* Bulk Action Toolbar */}
          {selectedIds.size > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-amber-300 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>{selectedIds.size} items selected for safe bulk curation</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Bulk Trip Assign */}
                <select
                  value={bulkTripId}
                  onChange={(e) => {
                    setBulkTripId(e.target.value);
                    setBulkDayId('');
                  }}
                  className="bg-studio-surface border border-studio-border rounded px-2.5 py-1 text-xs text-white"
                >
                  <option value="">Assign Trip...</option>
                  {trips.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>

                {bulkTripId && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBulkUpdate({ trip_id: bulkTripId })}
                      className="text-xs bg-studio-surface border-studio-border text-white hover:bg-studio-elevated"
                    >
                      Apply Trip
                    </Button>

                    {/* Bulk Day Assign */}
                    <select
                      value={bulkDayId}
                      onChange={(e) => setBulkDayId(e.target.value)}
                      className="bg-studio-surface border border-studio-border rounded px-2.5 py-1 text-xs text-white"
                    >
                      <option value="">Assign Day...</option>
                      {getDaysForTrip(bulkTripId).map((d) => (
                        <option key={d.id} value={d.id}>
                          Day {d.day_number}: {d.title || 'Untitled'}
                        </option>
                      ))}
                    </select>

                    {bulkDayId && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkUpdate({ trip_id: bulkTripId, day_id: bulkDayId })}
                        className="text-xs bg-studio-surface border-studio-border text-white hover:bg-studio-elevated"
                      >
                        Apply Day
                      </Button>
                    )}
                  </>
                )}

                {/* Bulk Place Assign */}
                <select
                  value={bulkPlaceId}
                  onChange={(e) => setBulkPlaceId(e.target.value)}
                  className="bg-studio-surface border border-studio-border rounded px-2.5 py-1 text-xs text-white"
                >
                  <option value="">Assign Place...</option>
                  {places.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>

                {bulkPlaceId && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkUpdate({ place_id: bulkPlaceId })}
                    className="text-xs bg-studio-surface border-studio-border text-white hover:bg-studio-elevated"
                  >
                    Apply Place
                  </Button>
                )}

                {/* Bulk Confirm Metadata */}
                <Button
                  size="sm"
                  onClick={() => handleBulkUpdate({ curation_status: 'CURATED' })}
                  className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Confirm Curated
                </Button>

                {/* Bulk Archive */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkUpdate({ curation_status: 'ARCHIVED' })}
                  className="text-xs border-studio-border bg-studio-surface text-studio-muted hover:text-white"
                >
                  <Archive className="w-3 h-3 mr-1" />
                  Bulk Archive
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedIds(new Set())}
                  className="text-xs text-studio-muted hover:text-white"
                >
                  Deselect
                </Button>
              </div>
            </div>
          )}

          {/* Table / Queue Items */}
          <div className="bg-studio-surface border border-studio-border rounded-lg overflow-hidden">
            <div className="p-3 bg-studio-elevated/40 border-b border-studio-border flex items-center justify-between text-xs text-studio-muted">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={queue.length > 0 && selectedIds.size === queue.length}
                  onChange={toggleSelectAll}
                  className="rounded border-studio-border bg-studio-surface text-amber-500 focus:ring-0 focus:outline-none"
                />
                <span className="font-semibold text-white">
                  Media Records ({queue.length} of {totalCount})
                </span>
              </div>
              <span className="text-[11px]">Item-level resolvers & readiness status</span>
            </div>

            {queue.length === 0 ? (
              <div className="py-16 text-center text-studio-muted text-xs space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-white font-medium">All clear! No items match the selected curation filters.</p>
                <p className="text-studio-muted">
                  Use the health cards above or reset filters to review other parts of the archive.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-studio-border">
                {queue.map(({ media, readiness, tripTitle, dayTitle, placeName }) => {
                  const isSelected = selectedIds.has(media.id);
                  const daysForTrip = getDaysForTrip(media.trip_id);

                  return (
                    <div
                      key={media.id}
                      className={`p-4 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                        isSelected ? 'bg-amber-500/5' : 'hover:bg-studio-elevated/20'
                      }`}
                    >
                      {/* Left: Thumbnail & Core Details */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectId(media.id)}
                          className="mt-1 rounded border-studio-border bg-studio-surface text-amber-500 focus:ring-0"
                        />

                        {/* Thumbnail */}
                        <div className="w-20 h-20 rounded-md overflow-hidden bg-black/40 border border-studio-border shrink-0 relative">
                          <ImageFrame
                            src={getNormalizedImageUrl(media.thumbnail_url || media.storage_url)}
                            alt={media.filename}
                            fill
                            className="object-cover"
                          />
                          <span className="absolute bottom-1 right-1 text-[9px] bg-black/70 px-1 py-0.5 rounded text-white font-mono uppercase">
                            {media.type}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold text-white truncate max-w-xs" title={media.filename}>
                              {media.filename}
                            </span>

                            {/* Curation status badge */}
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-mono ${
                                media.curation_status === 'CURATED'
                                  ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                                  : media.curation_status === 'REVIEW_REQUIRED'
                                  ? 'border-amber-500/30 text-amber-400 bg-amber-500/10'
                                  : media.curation_status === 'ARCHIVED'
                                  ? 'border-studio-border text-studio-muted bg-studio-elevated'
                                  : 'border-blue-500/30 text-blue-400 bg-blue-500/10'
                              }`}
                            >
                              {media.curation_status}
                            </Badge>

                            {/* Visibility badge */}
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-mono ${
                                media.visibility === 'PUBLIC'
                                  ? 'border-sky-500/30 text-sky-400 bg-sky-500/10'
                                  : 'border-studio-border text-studio-muted'
                              }`}
                            >
                              {media.visibility}
                            </Badge>

                            {/* Readiness Pill */}
                            {readiness.isReady ? (
                              <Badge className="text-[10px] bg-emerald-600 text-white flex items-center gap-1 font-sans">
                                <CheckCircle2 className="w-3 h-3" /> Ready to Publish
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-[10px] border-rose-500/30 text-rose-400 bg-rose-500/10 flex items-center gap-1 font-sans"
                                title={readiness.reasons.join('; ')}
                              >
                                <AlertCircle className="w-3 h-3" /> Unready ({readiness.missingFields.length})
                              </Badge>
                            )}
                          </div>

                          {/* Metadata row */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-studio-muted">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-studio-muted" />
                              {media.taken_at ? (
                                new Date(media.taken_at).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              ) : (
                                <span className="text-orange-400 font-medium">Capture date missing</span>
                              )}
                            </span>

                            <span>
                              {media.width && media.height ? (
                                `${media.width} × ${media.height}`
                              ) : (
                                <span className="text-orange-400 font-medium">Dimensions missing</span>
                              )}
                            </span>

                            {media.caption && (
                              <span className="italic text-studio-muted truncate max-w-sm">&ldquo;{media.caption}&rdquo;</span>
                            )}
                          </div>

                          {/* Assignment indicators */}
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded border ${
                                tripTitle
                                  ? 'border-studio-border text-studio-text bg-studio-elevated/40'
                                  : 'border-purple-500/40 text-purple-300 bg-purple-500/10 font-semibold'
                              }`}
                            >
                              Trip: {tripTitle || 'Unassigned'}
                            </span>

                            <span
                              className={`text-[10px] px-2 py-0.5 rounded border ${
                                dayTitle
                                  ? 'border-studio-border text-studio-text bg-studio-elevated/40'
                                  : 'border-purple-500/40 text-purple-300 bg-purple-500/10 font-semibold'
                              }`}
                            >
                              Day: {dayTitle || 'Unassigned'}
                            </span>

                            <span
                              className={`text-[10px] px-2 py-0.5 rounded border ${
                                placeName
                                  ? 'border-studio-border text-studio-text bg-studio-elevated/40'
                                  : 'border-purple-500/40 text-purple-300 bg-purple-500/10 font-semibold'
                              }`}
                            >
                              Place: {placeName || 'Unassigned'}
                            </span>
                          </div>

                          {/* Unready details if not ready */}
                          {!readiness.isReady && (
                            <div className="text-[10px] text-rose-400/90 pt-1 flex items-start gap-1">
                              <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                              <span>Issues: {readiness.reasons.join(' • ')}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Inline Resolvers */}
                      <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 shrink-0 border-t lg:border-t-0 pt-2 lg:pt-0 border-studio-border/50">
                        {/* Inline Trip Picker */}
                        <select
                          value={media.trip_id || ''}
                          onChange={(e) => {
                            const newTripId = e.target.value || null;
                            handleUpdateItem(media.id, {
                              trip_id: newTripId,
                              day_id: null, // reset day if trip changes
                            });
                          }}
                          className="bg-studio-elevated border border-studio-border rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-amber-400 max-w-[130px]"
                        >
                          <option value="">Set Trip...</option>
                          {trips.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.title}
                            </option>
                          ))}
                        </select>

                        {/* Inline Day Picker (filtered to trip) */}
                        <select
                          disabled={!media.trip_id}
                          value={media.day_id || ''}
                          onChange={(e) => {
                            const newDayId = e.target.value || null;
                            handleUpdateItem(media.id, { day_id: newDayId });
                          }}
                          className="bg-studio-elevated border border-studio-border rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-amber-400 max-w-[120px] disabled:opacity-40"
                        >
                          <option value="">Set Day...</option>
                          {daysForTrip.map((d) => (
                            <option key={d.id} value={d.id}>
                              Day {d.day_number}: {d.title || 'Untitled'}
                            </option>
                          ))}
                        </select>

                        {/* Inline Place Picker */}
                        <select
                          value={media.place_id || ''}
                          onChange={(e) => {
                            const newPlaceId = e.target.value || null;
                            handleUpdateItem(media.id, { place_id: newPlaceId });
                          }}
                          className="bg-studio-elevated border border-studio-border rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-amber-400 max-w-[120px]"
                        >
                          <option value="">Set Place...</option>
                          {places.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>

                        {/* Confirm Curated Button */}
                        {media.curation_status !== 'CURATED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateItem(media.id, { curation_status: 'CURATED' })}
                            className="text-[11px] h-7 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                            title="Confirm editorial metadata"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Curate
                          </Button>
                        )}

                        {/* Publish Button */}
                        {media.visibility === 'PRIVATE' && (
                          <Button
                            size="sm"
                            disabled={!readiness.isReady}
                            onClick={() => handlePublishItem(media.id)}
                            className="text-[11px] h-7 bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-40 disabled:hover:bg-sky-600"
                            title={readiness.isReady ? 'Publish item' : 'Cannot publish: resolve required fields first'}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Publish
                          </Button>
                        )}

                        {/* Archive Button */}
                        {media.curation_status !== 'ARCHIVED' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleArchiveItem(media.id)}
                            className="text-[11px] h-7 text-studio-muted hover:text-white"
                            title="Archive item non-destructively"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DUPLICATE DETECTION */}
      {activeTab === 'DUPLICATES' && (
        <div className="space-y-6">
          <div className="bg-studio-surface border border-studio-border p-4 rounded-lg flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Copy className="w-4 h-4 text-amber-400" />
                SHA-256 Exact Duplicate Detection
              </h2>
              <p className="text-xs text-studio-muted mt-0.5">
                Groups media sharing identical binary content hashes. Side-by-side comparison ensures zero data loss.
              </p>
            </div>
            <Badge variant="outline" className="border-rose-500/30 text-rose-400 bg-rose-500/5">
              {duplicateGroups.length} Duplicate {duplicateGroups.length === 1 ? 'Group' : 'Groups'}
            </Badge>
          </div>

          {duplicateGroups.length === 0 ? (
            <div className="bg-studio-surface border border-studio-border rounded-lg p-16 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-semibold text-white">No Duplicate Media Found</h3>
              <p className="text-xs text-studio-muted">
                Every media item in your archive has a unique content hash. The archive is clean and deduplicated.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {duplicateGroups.map((group) => {
                const canonical = group.canonicalMedia;
                const duplicates = group.duplicateMedia;
                const duplicateIds = duplicates.map((d) => d.id);

                return (
                  <div
                    key={group.contentHash}
                    className="bg-studio-surface border border-studio-border rounded-lg p-5 space-y-4"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-studio-border pb-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">Duplicate Group</span>
                          <span className="text-[10px] font-mono text-studio-muted bg-studio-elevated px-2 py-0.5 rounded">
                            SHA: {group.contentHash.slice(0, 16)}...
                          </span>
                          <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">
                            {group.totalCount} copies
                          </Badge>
                        </div>
                      </div>

                      {/* Resolution actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResolveDuplicates('keep_both', duplicateIds)}
                          className="text-xs border-studio-border bg-studio-elevated text-studio-text hover:text-white"
                        >
                          Keep Both Copies
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleResolveDuplicates('archive_duplicates', duplicateIds)}
                          className="text-xs bg-amber-600 hover:bg-amber-500 text-white font-medium"
                        >
                          <Archive className="w-3.5 h-3.5 mr-1" />
                          Archive Duplicates
                        </Button>
                      </div>
                    </div>

                    {/* Side-by-side comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Canonical Item */}
                      <div className="p-3 bg-studio-elevated/40 border border-emerald-500/30 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-emerald-600 text-white text-[10px]">
                            Canonical Primary (Earliest Upload)
                          </Badge>
                          <span className="text-[10px] font-mono text-studio-muted">
                            {new Date(canonical.created_at).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-24 h-24 rounded bg-black/50 border border-studio-border overflow-hidden shrink-0 relative">
                            <ImageFrame
                              src={getNormalizedImageUrl(canonical.thumbnail_url || canonical.storage_url)}
                              alt={canonical.filename}
                              fill
                              className="object-cover"
                            />
                          </div>

                          <div className="space-y-1 text-xs min-w-0 flex-1">
                            <p className="font-semibold text-white truncate" title={canonical.filename}>
                              {canonical.filename}
                            </p>
                            <p className="text-[11px] text-studio-muted">
                              Dimensions: {canonical.width} × {canonical.height}
                            </p>
                            <p className="text-[11px] text-studio-muted">
                              Date: {canonical.taken_at ? new Date(canonical.taken_at).toLocaleDateString() : 'None'}
                            </p>
                            <div className="flex gap-1.5 pt-1">
                              <Badge variant="outline" className="text-[9px] border-studio-border">
                                {canonical.curation_status}
                              </Badge>
                              <Badge variant="outline" className="text-[9px] border-studio-border">
                                {canonical.visibility}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Duplicate Item(s) */}
                      <div className="space-y-2">
                        {duplicates.map((dup) => (
                          <div
                            key={dup.id}
                            className="p-3 bg-studio-elevated/20 border border-rose-500/20 rounded-lg space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="border-rose-500/40 text-rose-400 text-[10px]">
                                Duplicate Asset
                              </Badge>
                              <span className="text-[10px] font-mono text-studio-muted">
                                {new Date(dup.created_at).toLocaleString()}
                              </span>
                            </div>

                            <div className="flex items-start gap-3">
                              <div className="w-24 h-24 rounded bg-black/50 border border-studio-border overflow-hidden shrink-0 relative">
                                <ImageFrame
                                  src={getNormalizedImageUrl(dup.thumbnail_url || dup.storage_url)}
                                  alt={dup.filename}
                                  fill
                                  className="object-cover"
                                />
                              </div>

                              <div className="space-y-1 text-xs min-w-0 flex-1">
                                <p className="font-semibold text-white truncate" title={dup.filename}>
                                  {dup.filename}
                                </p>
                                <p className="text-[11px] text-studio-muted">
                                  Dimensions: {dup.width} × {dup.height}
                                </p>
                                <p className="text-[11px] text-studio-muted">
                                  Date: {dup.taken_at ? new Date(dup.taken_at).toLocaleDateString() : 'None'}
                                </p>
                                <div className="flex gap-1.5 pt-1">
                                  <Badge variant="outline" className="text-[9px] border-studio-border">
                                    {dup.curation_status}
                                  </Badge>
                                  <Badge variant="outline" className="text-[9px] border-studio-border">
                                    {dup.visibility}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: READINESS INVARIANTS */}
      {activeTab === 'READINESS' && (
        <div className="space-y-6">
          <div className="bg-studio-surface border border-studio-border p-6 rounded-lg space-y-4">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Publication Readiness Rules & Archival Invariants
              </h2>
              <p className="text-xs text-studio-muted mt-1">
                The Jayant Diaries enforces strict archival standards. An imported media asset is only ready to be
                published to the public documentary when all criteria below are verified.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-studio-elevated/40 border border-studio-border rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <Check className="w-4 h-4" />
                  <span>1. Capture Date Timestamp (taken_at)</span>
                </div>
                <p className="text-[11px] text-studio-muted">
                  Every photo/video must have a valid temporal coordinate for chronological timeline placement and
                  journey reconstruction.
                </p>
              </div>

              <div className="p-4 bg-studio-elevated/40 border border-studio-border rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <Check className="w-4 h-4" />
                  <span>2. Geometric Dimensions (width & height)</span>
                </div>
                <p className="text-[11px] text-studio-muted">
                  Photos must have extracted dimensions to ensure responsive lightbox rendering, aspect ratio
                  preservation, and zero layout shift.
                </p>
              </div>

              <div className="p-4 bg-studio-elevated/40 border border-studio-border rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <Check className="w-4 h-4" />
                  <span>3. Relational Hierarchy (Trip & Day)</span>
                </div>
                <p className="text-[11px] text-studio-muted">
                  The media must be attached to a specific trip and a day belonging to that trip. Orphaned media items
                  are barred from public visibility.
                </p>
              </div>

              <div className="p-4 bg-studio-elevated/40 border border-studio-border rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <Check className="w-4 h-4" />
                  <span>4. Geographic Anchor (Place ID)</span>
                </div>
                <p className="text-[11px] text-studio-muted">
                  A place must be assigned to plot the media on the interactive atlas and geographic journey map.
                </p>
              </div>

              <div className="p-4 bg-studio-elevated/40 border border-studio-border rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <Check className="w-4 h-4" />
                  <span>5. Human Editorial Confirmation (CURATED status)</span>
                </div>
                <p className="text-[11px] text-studio-muted">
                  AI and automated tools propose metadata, but Jayant&apos;s explicit editorial confirmation is required
                  before publishing.
                </p>
              </div>

              <div className="p-4 bg-studio-elevated/40 border border-studio-border rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <Check className="w-4 h-4" />
                  <span>6. Duplicate Free</span>
                </div>
                <p className="text-[11px] text-studio-muted">
                  Non-canonical duplicate items cannot be published until deduplication resolves whether to archive or
                  keep both.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-studio-border flex justify-end">
              <Button
                onClick={() => {
                  setSelectedStatus('REVIEW_REQUIRED');
                  setActiveTab('QUEUE');
                }}
                className="text-xs bg-amber-600 hover:bg-amber-500 text-white font-medium"
              >
                Go to Review Queue & Resolve Unready Items
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
