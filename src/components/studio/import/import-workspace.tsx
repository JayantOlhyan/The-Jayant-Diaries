/* eslint-disable @next/next/no-img-element */
'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Sparkles,
  Shield,
  Trash2,
  Copy,
  ChevronRight,
  Filter,
  Check,
  X,
  RefreshCw,
  FolderPlus,
  Layers,
  Info,
  ExternalLink,
  Eye,
  SlidersHorizontal,
  History,
  ChevronLeft,
} from 'lucide-react';
import { TripRow, DayRow, PlaceRow } from '@/types/entities';
import {
  IngestionItem,
  IngestionItemStatus,
  DuplicateStatus,
  ReviewStatus,
  ArchiveBatchItemInput,
  ArchiveBatchResult,
} from '@/types/ingestion';
import { extractMediaMetadata } from '@/lib/ingestion/metadata-extractor';
import { generateSuggestions, groupItemsByDate } from '@/lib/ingestion/suggestion-engine';
import {
  checkExistingDuplicatesAction,
  archiveApprovedMediaBatchAction,
  archiveSingleMediaAction,
  createImportSessionAction,
  finalizeImportSessionAction,
} from '@/server/actions/ingestion-actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface ImportWorkspaceProps {
  trips: TripRow[];
  days: DayRow[];
  places: PlaceRow[];
}

export function ImportWorkspace({ trips, days, places }: ImportWorkspaceProps) {
  const [items, setItems] = React.useState<IngestionItem[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = React.useState<'GRID' | 'CHRONO' | 'TABLE'>('GRID');
  const [filterStatus, setFilterStatus] = React.useState<
    'ALL' | 'READY' | 'NEEDS_REVIEW' | 'DUPLICATES' | 'APPROVED' | 'FAILED'
  >('ALL');
  const [activeDetailItem, setActiveDetailItem] = React.useState<IngestionItem | null>(null);
  const [isConfirmArchiveOpen, setIsConfirmArchiveOpen] = React.useState(false);
  const [isArchiving, setIsArchiving] = React.useState(false);
  const [archivalResult, setArchivalResult] = React.useState<ArchiveBatchResult | null>(null);
  const [isProcessingQueue, setIsProcessingQueue] = React.useState(false);

  // Phase 11 Import Session & Context States
  const [sessionName, setSessionName] = React.useState('');
  const [defaultTripId, setDefaultTripId] = React.useState('');
  const [defaultDayId, setDefaultDayId] = React.useState('');
  const [activeSessionId, setActiveSessionId] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [groupingMode, setGroupingMode] = React.useState<'NONE' | 'PLACE' | 'TYPE' | 'STATUS'>('NONE');
  const ITEMS_PER_PAGE = 48;

  const availableDefaultDays = React.useMemo(() => {
    return defaultTripId ? days.filter((d) => d.trip_id === defaultTripId) : [];
  }, [days, defaultTripId]);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // File drag & drop handlers
  const [isDragging, setIsDragging] = React.useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelected(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const handleFilesSelected = (files: File[]) => {
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'mp4', 'mov'];
    const validFiles = files.filter((f) => {
      const ext = f.name.split('.').pop()?.toLowerCase() || '';
      return validExtensions.includes(ext);
    });

    if (validFiles.length === 0) return;

    const newItems: IngestionItem[] = validFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      status: 'QUEUED',
      progress: 0,
      reviewStatus: 'PENDING',
      duplicateStatus: 'UNIQUE',
    }));

    setItems((prev) => [...prev, ...newItems]);
    processFiles(newItems);
  };

  // Process files sequentially or in small parallel batches
  const processFiles = async (itemsToProcess: IngestionItem[]) => {
    setIsProcessingQueue(true);

    const processedList: IngestionItem[] = [];

    for (const item of itemsToProcess) {
      // Update status to processing
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'PROCESSING', progress: 20 } : i))
      );

      try {
        const metadata = await extractMediaMetadata(item.file);
        const suggestions = generateSuggestions(metadata, trips, days, places);

        const assigned_trip_id = defaultTripId || suggestions.suggested_trip?.trip.id || null;
        let assigned_day_id: string | null = null;
        if (defaultTripId && defaultDayId) {
          assigned_day_id = defaultDayId;
        } else if (assigned_trip_id) {
          assigned_day_id = suggestions.suggested_day?.day.id || null;
        }
        const assigned_place_id = suggestions.suggested_place?.place.id || null;

        const hasNeedsReview = !(metadata.takenAt || (metadata as any).taken_at) || !assigned_trip_id;
        const status: IngestionItemStatus = hasNeedsReview ? 'NEEDS_REVIEW' : 'READY';

        const updatedItem: IngestionItem = {
          ...item,
          status,
          progress: 100,
          metadata,
          suggestions,
          assigned_trip_id,
          assigned_day_id,
          assigned_place_id,
          reviewStatus: status === 'READY' ? 'APPROVED' : 'PENDING',
        };

        processedList.push(updatedItem);

        setItems((prev) => prev.map((i) => (i.id === item.id ? updatedItem : i)));
      } catch (err: any) {
        const failedItem: IngestionItem = {
          ...item,
          status: 'FAILED',
          progress: 100,
          error: err.message || 'Failed to process metadata',
        };
        processedList.push(failedItem);
        setItems((prev) => prev.map((i) => (i.id === item.id ? failedItem : i)));
      }
    }

    // Now check duplicates across batch and against archive database
    await checkDuplicates(processedList);
    setIsProcessingQueue(false);
  };

  const checkDuplicates = async (batchItems: IngestionItem[]) => {
    const hashes = batchItems
      .map((i) => i.metadata?.content_hash)
      .filter((h): h is string => Boolean(h));

    if (hashes.length === 0) return;

    // 1. Check intra-batch duplicates
    const hashCounts = new Map<string, number>();
    for (const h of hashes) {
      hashCounts.set(h, (hashCounts.get(h) || 0) + 1);
    }

    // 2. Check canonical database duplicates via server action
    const { success, duplicates } = await checkExistingDuplicatesAction(hashes);

    setItems((prev) =>
      prev.map((item) => {
        const hash = item.metadata?.content_hash;
        if (!hash) return item;

        if (success && duplicates[hash]) {
          return {
            ...item,
            duplicateStatus: 'EXACT_DUPLICATE',
            existingMediaId: duplicates[hash],
            status: 'NEEDS_REVIEW',
            reviewStatus: 'REJECTED',
          };
        }

        if ((hashCounts.get(hash) || 0) > 1) {
          return {
            ...item,
            duplicateStatus: 'BATCH_DUPLICATE',
            status: 'NEEDS_REVIEW',
          };
        }

        return item;
      })
    );
  };

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllVisible = (visibleIds: string[]) => {
    setSelectedIds((prev) => {
      const allSelected = visibleIds.every((id) => prev.has(id));
      if (allSelected) {
        const next = new Set(prev);
        for (const id of visibleIds) next.delete(id);
        return next;
      } else {
        const next = new Set(prev);
        for (const id of visibleIds) next.add(id);
        return next;
      }
    });
  };

  // Batch actions
  const handleBatchApprove = () => {
    setItems((prev) =>
      prev.map((i) => (selectedIds.has(i.id) ? { ...i, reviewStatus: 'APPROVED' } : i))
    );
  };

  const handleBatchReject = () => {
    setItems((prev) =>
      prev.map((i) => (selectedIds.has(i.id) ? { ...i, reviewStatus: 'REJECTED' } : i))
    );
  };

  const handleBatchAssignTrip = (tripId: string) => {
    setItems((prev) =>
      prev.map((i) => {
        if (!selectedIds.has(i.id)) return i;
        // Verify if existing assigned day belongs to new trip, if not clear day
        const dayValid = days.some((d) => d.id === i.assigned_day_id && d.trip_id === tripId);
        return {
          ...i,
          assigned_trip_id: tripId,
          assigned_day_id: dayValid ? i.assigned_day_id : null,
          status: 'READY',
        };
      })
    );
  };

  const handleBatchAssignDay = (dayId: string) => {
    const selectedDay = days.find((d) => d.id === dayId);
    setItems((prev) =>
      prev.map((i) => {
        if (!selectedIds.has(i.id)) return i;
        return {
          ...i,
          assigned_day_id: dayId,
          assigned_trip_id: selectedDay ? selectedDay.trip_id : i.assigned_trip_id,
          status: 'READY',
        };
      })
    );
  };

  const handleBatchAssignPlace = (placeId: string) => {
    setItems((prev) =>
      prev.map((i) => {
        if (!selectedIds.has(i.id)) return i;
        return {
          ...i,
          assigned_place_id: placeId,
          status: 'READY',
        };
      })
    );
  };

  const handleApplyAllSuggestions = () => {
    setItems((prev) =>
      prev.map((i) => {
        if (!i.suggestions) return i;
        const tripId = i.suggestions.suggested_trip?.trip.id || i.assigned_trip_id;
        const dayId = i.suggestions.suggested_day?.day.id || i.assigned_day_id;
        const placeId = i.suggestions.suggested_place?.place.id || i.assigned_place_id;
        return {
          ...i,
          assigned_trip_id: tripId,
          assigned_day_id: dayId,
          assigned_place_id: placeId,
          status: tripId ? 'READY' : i.status,
          reviewStatus: 'APPROVED',
        };
      })
    );
  };

  const handleBatchRemove = () => {
    setItems((prev) => prev.filter((i) => !selectedIds.has(i.id)));
    setSelectedIds(new Set());
  };

  const handleOverrideDuplicate = (id: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              duplicateStatus: 'OVERRIDE',
              reviewStatus: 'APPROVED',
              status: 'READY',
            }
          : i
      )
    );
  };

  // Helper to upload and archive a single item with its binary File
  const archiveItem = async (item: IngestionItem, sessionId?: string | null) => {
    const formData = new FormData();
    formData.append('file', item.file);

    const metadata = {
      id: item.archivedMediaId || item.id,
      itemId: item.id,
      filename: item.file.name,
      mimeType: item.metadata?.mime_type || item.file.type,
      width: item.metadata?.dimensions?.width,
      height: item.metadata?.dimensions?.height,
      duration: item.metadata?.duration,
      fileSizeBytes: item.metadata?.file_size_bytes,
      contentHash: item.metadata?.content_hash,
      takenAt: item.metadata?.taken_at || item.metadata?.takenAt,
      latitude: item.metadata?.gps?.latitude,
      longitude: item.metadata?.gps?.longitude,
      tripId: item.assigned_trip_id,
      dayId: item.assigned_day_id,
      placeId: item.assigned_place_id,
      caption: item.caption,
      altText: item.alt_text,
      overrideDuplicate: item.duplicateStatus === 'OVERRIDE',
      sessionId: sessionId || undefined,
    };

    if (sessionId) {
      formData.append('sessionId', sessionId);
    }
    formData.append('metadata', JSON.stringify(metadata));
    return await archiveSingleMediaAction(formData);
  };

  // Commit Archival with real persistent storage upload and session tracking
  const handleConfirmArchive = async () => {
    const approvedItems = items.filter(
      (i) => i.reviewStatus === 'APPROVED' && !i.archivedMediaId && i.status !== 'ARCHIVED'
    );
    if (approvedItems.length === 0) return;

    setIsArchiving(true);

    let sessionId: string | null = null;
    try {
      const sessRes = await createImportSessionAction({
        name: sessionName.trim() || `Capture ${new Date().toLocaleDateString()}`,
        tripId: defaultTripId || null,
        dayId: defaultDayId || null,
        totalFiles: approvedItems.length,
      });
      if (sessRes.success && sessRes.session) {
        sessionId = sessRes.session.id;
        setActiveSessionId(sessionId);
      }
    } catch {
      // Proceed without failing archival if session creation fails
    }

    let archivedCount = 0;
    let duplicateCount = 0;
    let failedCount = 0;
    const errors: { itemId?: string; filename?: string; reason: string }[] = [];
    const itemResults: any[] = [];
    const createdIds: string[] = [];

    for (const item of approvedItems) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'UPLOADING' } : i))
      );

      try {
        const res = await archiveItem(item, sessionId);
        itemResults.push(res);

        if (res.status === 'ARCHIVED') {
          archivedCount++;
          if (res.mediaId) createdIds.push(res.mediaId);
          setItems((prev) =>
            prev.map((i) =>
              i.id === item.id
                ? {
                    ...i,
                    status: 'ARCHIVED',
                    archivedMediaId: res.mediaId,
                    errorMessage: undefined,
                  }
                : i
            )
          );
        } else if (res.status === 'DUPLICATE') {
          duplicateCount++;
          setItems((prev) =>
            prev.map((i) =>
              i.id === item.id
                ? {
                    ...i,
                    status: 'NEEDS_REVIEW',
                    duplicateStatus: 'EXACT_DUPLICATE',
                    errorMessage: res.reason,
                  }
                : i
            )
          );
          errors.push({ itemId: item.id, filename: item.file.name, reason: res.reason || 'Exact duplicate' });
        } else {
          failedCount++;
          setItems((prev) =>
            prev.map((i) =>
              i.id === item.id
                ? {
                    ...i,
                    status: 'FAILED',
                    errorMessage: res.reason,
                  }
                : i
            )
          );
          errors.push({ itemId: item.id, filename: item.file.name, reason: res.reason || 'Archive failed' });
        }
      } catch (err: any) {
        failedCount++;
        const reason = err.message || 'Network or upload error';
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: 'FAILED',
                  errorMessage: reason,
                }
              : i
          )
        );
        errors.push({ itemId: item.id, filename: item.file.name, reason });
      }
    }

    if (sessionId) {
      await finalizeImportSessionAction(sessionId).catch(() => {});
    }

    const batchResult: ArchiveBatchResult = {
      success: archivedCount > 0 && failedCount === 0,
      count: approvedItems.length,
      total: approvedItems.length,
      archivedCount,
      duplicateCount,
      failedCount,
      createdIds,
      items: itemResults,
      errors,
      error: failedCount > 0 ? `${failedCount} item(s) failed to archive` : undefined,
    };

    setArchivalResult(batchResult);
    setIsArchiving(false);
  };

  // Single item retry handler
  const handleRetryItem = async (item: IngestionItem) => {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: 'UPLOADING', errorMessage: undefined } : i))
    );

    try {
      const res = await archiveItem(item);
      setItems((prev) =>
        prev.map((i) => {
          if (i.id !== item.id) return i;
          if (res.status === 'ARCHIVED') {
            return {
              ...i,
              status: 'ARCHIVED',
              archivedMediaId: res.mediaId,
              reviewStatus: 'APPROVED',
              errorMessage: undefined,
            };
          }
          if (res.status === 'DUPLICATE') {
            return {
              ...i,
              status: 'NEEDS_REVIEW',
              duplicateStatus: 'EXACT_DUPLICATE',
              errorMessage: res.reason,
            };
          }
          return {
            ...i,
            status: 'FAILED',
            errorMessage: res.reason,
          };
        })
      );
    } catch (err: any) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, status: 'FAILED', errorMessage: err.message || 'Retry failed' }
            : i
        )
      );
    }
  };

  // Filtered items
  const filteredItems = React.useMemo(() => {
    return items.filter((item) => {
      if (filterStatus === 'READY') return item.status === 'READY';
      if (filterStatus === 'NEEDS_REVIEW') return item.status === 'NEEDS_REVIEW';
      if (filterStatus === 'DUPLICATES')
        return (
          item.duplicateStatus === 'EXACT_DUPLICATE' || item.duplicateStatus === 'BATCH_DUPLICATE'
        );
      if (filterStatus === 'APPROVED') return item.reviewStatus === 'APPROVED';
      if (filterStatus === 'FAILED') return item.status === 'FAILED';
      return true;
    });
  }, [items, filterStatus]);

  // Real Counts
  const stats = React.useMemo(() => {
    const total = items.length;
    const ready = items.filter((i) => i.status === 'READY').length;
    const needsReview = items.filter((i) => i.status === 'NEEDS_REVIEW').length;
    const duplicates = items.filter(
      (i) => i.duplicateStatus === 'EXACT_DUPLICATE' || i.duplicateStatus === 'BATCH_DUPLICATE'
    ).length;
    const approved = items.filter((i) => i.reviewStatus === 'APPROVED' && !i.archivedMediaId).length;
    const failed = items.filter((i) => i.status === 'FAILED').length;
    const archived = items.filter((i) => i.status === 'ARCHIVED' || i.archivedMediaId).length;
    return { total, ready, needsReview, duplicates, approved, failed, archived };
  }, [items]);

  const dateGroups = React.useMemo(() => {
    return groupItemsByDate(filteredItems);
  }, [filteredItems]);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 p-6 md:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-amber-400 border-amber-500/30 bg-amber-500/10">
              Smart Ingestion Pipeline
            </Badge>
            <span className="text-xs text-stone-400 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Strict Private Storage Defaults
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif tracking-wide text-stone-100">
            Batch Media Ingestion & Organization
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Deterministic EXIF inspection, content-hash deduplication, and mathematical journey
            assignment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/studio/imports">
            <Button
              variant="outline"
              className="border-stone-700 text-stone-300 hover:text-white text-xs px-3 py-2 flex items-center gap-1.5"
            >
              <History className="w-3.5 h-3.5 text-amber-400" />
              Import History
            </Button>
          </Link>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            multiple
            accept=".jpg,.jpeg,.png,.webp,.heic,.mp4,.mov"
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-medium px-4 py-2 flex items-center gap-2 shadow-lg shadow-amber-950/20"
          >
            <FolderPlus className="w-4 h-4" />
            Select Media Files
          </Button>

          {stats.approved > 0 && (
            <Button
              onClick={() => setIsConfirmArchiveOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-medium px-4 py-2 flex items-center gap-2 shadow-lg shadow-emerald-950/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              Archive Approved ({stats.approved})
            </Button>
          )}
        </div>
      </div>

      {/* Session Pre-Import Context Bar */}
      <div className="bg-stone-900/60 border border-stone-800/80 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-300">
              Session Context (Optional Pre-Import Defaults)
            </span>
          </div>
          <span className="text-[11px] text-stone-400">
            Files added will automatically inherit these coordinates.
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-stone-400 mb-1 text-[11px]">Session Name</label>
            <input
              type="text"
              placeholder="e.g. Ladakh — Day 3"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5 text-stone-200 focus:outline-none focus:border-amber-500 text-xs"
            />
          </div>
          <div>
            <label className="block text-stone-400 mb-1 text-[11px]">Default Trip Target</label>
            <select
              value={defaultTripId}
              onChange={(e) => {
                setDefaultTripId(e.target.value);
                setDefaultDayId('');
              }}
              className="w-full bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5 text-stone-200 focus:outline-none focus:border-amber-500 text-xs"
            >
              <option value="">-- No Default Trip --</option>
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-stone-400 mb-1 text-[11px]">Default Day Target</label>
            <select
              value={defaultDayId}
              onChange={(e) => setDefaultDayId(e.target.value)}
              disabled={!defaultTripId}
              className="w-full bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5 text-stone-200 focus:outline-none focus:border-amber-500 text-xs disabled:opacity-40"
            >
              <option value="">-- No Default Day --</option>
              {availableDefaultDays.map((d) => (
                <option key={d.id} value={d.id}>
                  Day {d.day_number}: {d.title || d.date}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Upload Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-amber-500 bg-amber-500/10'
            : 'border-stone-800 hover:border-stone-700 bg-stone-900/40 hover:bg-stone-900/60'
        }`}
      >
        <div className="max-w-md mx-auto flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-stone-800/80 flex items-center justify-center mb-3 text-stone-300">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-stone-200 font-medium text-base mb-1">
            Drag and drop travel media batches here
          </p>
          <p className="text-xs text-stone-400 mb-3">
            Supports JPG, PNG, WEBP, HEIC, MP4, and MOV with embedded EXIF & GPS
          </p>
          <span className="inline-block text-xs text-stone-400 bg-stone-800/80 px-2.5 py-1 rounded border border-stone-700">
            Click to browse files
          </span>
        </div>
      </div>

      {/* Summary Statistics Bar */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card
            onClick={() => setFilterStatus('ALL')}
            className={`p-3.5 bg-stone-900/60 border cursor-pointer transition-colors ${
              filterStatus === 'ALL' ? 'border-amber-500' : 'border-stone-800 hover:border-stone-700'
            }`}
          >
            <div className="text-xs text-stone-400">Total in Queue</div>
            <div className="text-2xl font-serif text-stone-100 mt-1">{stats.total}</div>
          </Card>

          <Card
            onClick={() => setFilterStatus('READY')}
            className={`p-3.5 bg-stone-900/60 border cursor-pointer transition-colors ${
              filterStatus === 'READY'
                ? 'border-emerald-500'
                : 'border-stone-800 hover:border-stone-700'
            }`}
          >
            <div className="text-xs text-emerald-400">Ready to Archive</div>
            <div className="text-2xl font-serif text-emerald-400 mt-1">{stats.ready}</div>
          </Card>

          <Card
            onClick={() => setFilterStatus('NEEDS_REVIEW')}
            className={`p-3.5 bg-stone-900/60 border cursor-pointer transition-colors ${
              filterStatus === 'NEEDS_REVIEW'
                ? 'border-amber-500'
                : 'border-stone-800 hover:border-stone-700'
            }`}
          >
            <div className="text-xs text-amber-400">Needs Review</div>
            <div className="text-2xl font-serif text-amber-400 mt-1">{stats.needsReview}</div>
          </Card>

          <Card
            onClick={() => setFilterStatus('DUPLICATES')}
            className={`p-3.5 bg-stone-900/60 border cursor-pointer transition-colors ${
              filterStatus === 'DUPLICATES'
                ? 'border-red-500'
                : 'border-stone-800 hover:border-stone-700'
            }`}
          >
            <div className="text-xs text-red-400">Duplicates Detected</div>
            <div className="text-2xl font-serif text-red-400 mt-1">{stats.duplicates}</div>
          </Card>

          <Card
            onClick={() => setFilterStatus('APPROVED')}
            className={`p-3.5 bg-stone-900/60 border cursor-pointer transition-colors ${
              filterStatus === 'APPROVED'
                ? 'border-emerald-500'
                : 'border-stone-800 hover:border-stone-700'
            }`}
          >
            <div className="text-xs text-stone-400">Approved for Archival</div>
            <div className="text-2xl font-serif text-stone-100 mt-1">{stats.approved}</div>
          </Card>
        </div>
      )}

      {/* Ingestion Workspace Toolbar & Controls */}
      {items.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-stone-900/40 p-4 rounded-xl border border-stone-800">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSelectAllVisible(filteredItems.map((i) => i.id))}
              className="text-xs border-stone-700 text-stone-300"
            >
              {filteredItems.every((i) => selectedIds.has(i.id)) && filteredItems.length > 0
                ? 'Deselect Visible'
                : `Select Visible (${filteredItems.length})`}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleApplyAllSuggestions}
              className="text-xs border-amber-600/40 text-amber-400 hover:bg-amber-500/10 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Apply All Suggestions
            </Button>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-stone-400 mr-1">View:</span>
            <div className="inline-flex rounded-md bg-stone-900 p-1 border border-stone-800">
              <button
                onClick={() => setActiveTab('GRID')}
                className={`px-2.5 py-1 text-xs rounded transition-colors ${
                  activeTab === 'GRID'
                    ? 'bg-stone-800 text-amber-400 font-medium'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setActiveTab('CHRONO')}
                className={`px-2.5 py-1 text-xs rounded transition-colors ${
                  activeTab === 'CHRONO'
                    ? 'bg-stone-800 text-amber-400 font-medium'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Timeline
              </button>
              <button
                onClick={() => setActiveTab('TABLE')}
                className={`px-2.5 py-1 text-xs rounded transition-colors ${
                  activeTab === 'TABLE'
                    ? 'bg-stone-800 text-amber-400 font-medium'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-4 z-30 bg-stone-900/95 backdrop-blur border border-amber-500/40 rounded-xl p-3 shadow-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
              {selectedIds.size} selected
            </span>
            <span className="text-xs text-stone-400 hidden sm:inline">Bulk assignments:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Bulk Assign Trip */}
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBatchAssignTrip(e.target.value);
                  e.target.value = '';
                }
              }}
              className="bg-stone-950 border border-stone-700 text-xs rounded px-2.5 py-1.5 text-stone-200 focus:outline-none focus:border-amber-500"
              defaultValue=""
            >
              <option value="" disabled>
                Assign Trip...
              </option>
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>

            {/* Bulk Assign Day */}
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBatchAssignDay(e.target.value);
                  e.target.value = '';
                }
              }}
              className="bg-stone-950 border border-stone-700 text-xs rounded px-2.5 py-1.5 text-stone-200 focus:outline-none focus:border-amber-500"
              defaultValue=""
            >
              <option value="" disabled>
                Assign Day...
              </option>
              {days.map((d) => (
                <option key={d.id} value={d.id}>
                  Day {d.day_number}: {d.title || d.date}
                </option>
              ))}
            </select>

            {/* Bulk Assign Place */}
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBatchAssignPlace(e.target.value);
                  e.target.value = '';
                }
              }}
              className="bg-stone-950 border border-stone-700 text-xs rounded px-2.5 py-1.5 text-stone-200 focus:outline-none focus:border-amber-500"
              defaultValue=""
            >
              <option value="" disabled>
                Assign Place...
              </option>
              {places.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <Button
              size="sm"
              onClick={handleBatchApprove}
              className="bg-emerald-600 hover:bg-emerald-500 text-stone-950 text-xs font-medium px-2.5 py-1 flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              Approve
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleBatchReject}
              className="border-stone-700 text-stone-300 text-xs px-2.5 py-1 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Reject
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={handleBatchRemove}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs px-2 py-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Main View Display */}
      {items.length === 0 ? (
        <div className="text-center py-16 text-stone-400 border border-stone-800/80 rounded-xl bg-stone-900/20">
          <Layers className="w-12 h-12 mx-auto text-stone-400 mb-3" />
          <p className="text-stone-300 font-medium">No media in ingestion queue</p>
          <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
            Select files above or drag and drop to extract EXIF timestamps, GPS coordinates, and
            detect duplicates.
          </p>
        </div>
      ) : activeTab === 'CHRONO' ? (
        /* Timeline Chronological Grouping View */
        <div className="space-y-8">
          {dateGroups.map((group) => (
            <div key={group.dateKey} className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <h2 className="text-base font-medium text-stone-200">
                    {group.dateLabel}
                  </h2>
                  <Badge variant="outline" className="text-xs text-stone-400 border-stone-800">
                    {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const groupIds = group.items.map((i) => i.id);
                      setSelectedIds((prev) => {
                        const next = new Set(prev);
                        for (const id of groupIds) next.add(id);
                        return next;
                      });
                    }}
                    className="text-xs text-stone-400 hover:text-stone-200"
                  >
                    Select Group
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {group.items.map((item) => (
                  <MediaItemCard
                    key={item.id}
                    item={item}
                    isSelected={selectedIds.has(item.id)}
                    onToggleSelect={() => handleToggleSelect(item.id)}
                    onOpenDetail={() => setActiveDetailItem(item)}
                    trips={trips}
                    days={days}
                    places={places}
                    onOverrideDuplicate={() => handleOverrideDuplicate(item.id)}
                    onRetry={() => handleRetryItem(item)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === 'TABLE' ? (
        /* Table View */
        <div className="overflow-x-auto rounded-xl border border-stone-800 bg-stone-900/30">
          <table className="w-full text-left text-xs text-stone-300">
            <thead className="bg-stone-900/80 text-stone-400 uppercase tracking-wider text-[10px] border-b border-stone-800">
              <tr>
                <th className="p-3 w-10">
                  <input
                    type="checkbox"
                    checked={
                      filteredItems.length > 0 &&
                      filteredItems.every((i) => selectedIds.has(i.id))
                    }
                    onChange={() => handleSelectAllVisible(filteredItems.map((i) => i.id))}
                    className="rounded bg-stone-950 border-stone-700 text-amber-500 focus:ring-0"
                  />
                </th>
                <th className="p-3">Media</th>
                <th className="p-3">Capture Date</th>
                <th className="p-3">GPS Location</th>
                <th className="p-3">Assigned Trip / Day</th>
                <th className="p-3">Assigned Place</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60">
              {filteredItems.map((item) => {
                const assignedTrip = trips.find((t) => t.id === item.assigned_trip_id);
                const assignedDay = days.find((d) => d.id === item.assigned_day_id);
                const assignedPlace = places.find((p) => p.id === item.assigned_place_id);
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-stone-800/30 transition-colors ${
                      selectedIds.has(item.id) ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => handleToggleSelect(item.id)}
                        className="rounded bg-stone-950 border-stone-700 text-amber-500 focus:ring-0"
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-stone-800 overflow-hidden flex-shrink-0 relative">
                          {item.metadata?.preview_url ? (
                            <img
                              src={item.metadata.preview_url}
                              alt={item.file.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-400">
                              <FileText className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="truncate max-w-[180px]">
                          <div className="font-medium text-stone-200 truncate">
                            {item.file.name}
                          </div>
                          <div className="text-[10px] text-stone-400">
                            {item.metadata?.file_size_bytes
                              ? `${(item.metadata.file_size_bytes / (1024 * 1024)).toFixed(2)} MB`
                              : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      {item.metadata?.taken_at ? (
                        <div className="text-stone-300">
                          {new Date(item.metadata.taken_at).toLocaleString()}
                        </div>
                      ) : (
                        <span className="text-stone-400 italic">Undated</span>
                      )}
                    </td>
                    <td className="p-3">
                      {item.metadata?.gps ? (
                        <div className="flex items-center gap-1 text-emerald-400">
                          <MapPin className="w-3 h-3" />
                          <span>
                            {item.metadata.gps.latitude.toFixed(4)},{' '}
                            {item.metadata.gps.longitude.toFixed(4)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-stone-400">No GPS</span>
                      )}
                    </td>
                    <td className="p-3">
                      {assignedTrip ? (
                        <div>
                          <div className="text-stone-200 font-medium">{assignedTrip.title}</div>
                          {assignedDay && (
                            <div className="text-[10px] text-stone-400">
                              Day {assignedDay.day_number}: {assignedDay.title || assignedDay.date}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-amber-400/80 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="p-3">
                      {assignedPlace ? (
                        <span className="text-stone-200">{assignedPlace.name}</span>
                      ) : (
                        <span className="text-stone-400 italic">None</span>
                      )}
                    </td>
                    <td className="p-3">
                      <ItemStatusBadge item={item} />
                    </td>
                    <td className="p-3 text-right space-x-2">
                      {item.status === 'FAILED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRetryItem(item)}
                          className="text-xs border-red-700/50 text-red-400 hover:bg-red-500/10 h-7 px-2"
                        >
                          Retry
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setActiveDetailItem(item)}
                        className="text-xs text-amber-400 hover:text-amber-300 h-7 px-2"
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Card Grid View (Default) */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <MediaItemCard
              key={item.id}
              item={item}
              isSelected={selectedIds.has(item.id)}
              onToggleSelect={() => handleToggleSelect(item.id)}
              onOpenDetail={() => setActiveDetailItem(item)}
              trips={trips}
              days={days}
              places={places}
              onOverrideDuplicate={() => handleOverrideDuplicate(item.id)}
              onRetry={() => handleRetryItem(item)}
            />
          ))}
        </div>
      )}

      {/* Item Detail & Metadata Drawer / Modal */}
      {activeDetailItem && (
        <ItemDetailModal
          item={activeDetailItem}
          trips={trips}
          days={days}
          places={places}
          onClose={() => setActiveDetailItem(null)}
          onSave={(updated) => {
            setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
            setActiveDetailItem(null);
          }}
          onOverrideDuplicate={() => {
            handleOverrideDuplicate(activeDetailItem.id);
            setActiveDetailItem(null);
          }}
        />
      )}

      {/* Confirmation Modal Before Archival */}
      {isConfirmArchiveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-stone-900 border border-stone-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-serif text-stone-100">
                  Confirm Canonical Batch Archival
                </h3>
                <p className="text-xs text-stone-400 mt-1">
                  You are committing {stats.approved} approved media items to the permanent database
                  archive.
                </p>
              </div>
              <button
                onClick={() => setIsConfirmArchiveOpen(false)}
                className="text-stone-400 hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Strict Privacy Guarantee Callout */}
            <div className="bg-stone-950/80 border border-emerald-500/30 rounded-lg p-3 text-xs text-stone-300 flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-emerald-400 block mb-0.5">
                  Archival Invariant Guaranteed
                </span>
                All {stats.approved} items will be archived with{' '}
                <code className="bg-stone-900 text-emerald-300 px-1 py-0.5 rounded">
                  visibility = &apos;PRIVATE&apos;
                </code>{' '}
                by default. Uploading does not publish to public routes or feeds.
              </div>
            </div>

            {archivalResult && (
              <div className="space-y-3">
                <div
                  className={`p-3 rounded-lg text-xs ${
                    archivalResult.failedCount === 0
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                      : 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                  }`}
                >
                  <div className="font-semibold mb-1 text-sm">
                    {archivalResult.failedCount === 0
                      ? 'Archive Complete'
                      : 'Archive Complete (Partial Issues Detected)'}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-stone-300 mt-2">
                    <div>
                      Total selected:{' '}
                      <span className="font-semibold text-white">
                        {archivalResult.total || archivalResult.count}
                      </span>
                    </div>
                    <div>
                      Archived:{' '}
                      <span className="font-semibold text-emerald-400">
                        {archivalResult.archivedCount}
                      </span>
                    </div>
                    <div>
                      Duplicates:{' '}
                      <span className="font-semibold text-amber-400">
                        {archivalResult.duplicateCount || 0}
                      </span>
                    </div>
                    <div>
                      Failed:{' '}
                      <span className="font-semibold text-red-400">
                        {archivalResult.failedCount}
                      </span>
                    </div>
                  </div>
                  {archivalResult.error && (
                    <div className="mt-2 text-red-400 font-mono text-[11px]">
                      {archivalResult.error}
                    </div>
                  )}
                </div>

                {archivalResult.errors && archivalResult.errors.length > 0 && (
                  <div className="max-h-32 overflow-y-auto space-y-1 bg-stone-950 p-2.5 rounded border border-stone-800 text-[11px]">
                    <div className="text-stone-400 font-medium mb-1">Issue Details:</div>
                    {archivalResult.errors.map((err, idx) => (
                      <div key={idx} className="text-red-400 truncate">
                        • <span className="font-semibold text-stone-300">{err.filename}</span>:{' '}
                        {err.reason}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              {archivalResult ? (
                <>
                  {archivalResult.failedCount > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFilterStatus('FAILED');
                        setIsConfirmArchiveOpen(false);
                      }}
                      className="border-red-700/60 text-red-300 hover:bg-red-500/10 text-xs"
                    >
                      Review Failed
                    </Button>
                  )}
                  <Link href="/studio/media">
                    <Button className="bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs">
                      View in Media Manager →
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setArchivalResult(null);
                      setIsConfirmArchiveOpen(false);
                    }}
                    className="border-stone-700 text-stone-300 text-xs"
                  >
                    Done
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsConfirmArchiveOpen(false)}
                    disabled={isArchiving}
                    className="border-stone-700 text-stone-300 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirmArchive}
                    disabled={isArchiving}
                    className="bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-medium text-xs flex items-center gap-2"
                  >
                    {isArchiving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Archiving to Storage...
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Commit to Archive
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Media Item Card Component
interface MediaItemCardProps {
  item: IngestionItem;
  isSelected: boolean;
  onToggleSelect: () => void;
  onOpenDetail: () => void;
  trips: TripRow[];
  days: DayRow[];
  places: PlaceRow[];
  onOverrideDuplicate: () => void;
  onRetry?: () => void;
}

function MediaItemCard({
  item,
  isSelected,
  onToggleSelect,
  onOpenDetail,
  trips,
  days,
  places,
  onOverrideDuplicate,
  onRetry,
}: MediaItemCardProps) {
  const assignedTrip = trips.find((t) => t.id === item.assigned_trip_id);
  const assignedPlace = places.find((p) => p.id === item.assigned_place_id);

  const isDuplicate =
    item.duplicateStatus === 'EXACT_DUPLICATE' || item.duplicateStatus === 'BATCH_DUPLICATE';

  return (
    <div
      className={`group relative rounded-xl border bg-stone-900/50 overflow-hidden flex flex-col transition-all duration-150 ${
        isSelected
          ? 'border-amber-500 ring-1 ring-amber-500/50 bg-stone-900/80'
          : isDuplicate
          ? 'border-red-500/40'
          : item.status === 'FAILED'
          ? 'border-red-600/50'
          : 'border-stone-800 hover:border-stone-700'
      }`}
    >
      {/* Thumbnail Aspect Ratio */}
      <div className="relative aspect-video bg-stone-950 overflow-hidden cursor-pointer">
        {item.metadata?.preview_url ? (
          <img
            src={item.metadata.preview_url}
            alt={item.file.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onClick={onOpenDetail}
          />
        ) : (
          <div
            onClick={onOpenDetail}
            className="w-full h-full flex flex-col items-center justify-center text-stone-400"
          >
            <FileText className="w-8 h-8 mb-1" />
            <span className="text-[10px]">{item.file.name}</span>
          </div>
        )}

        {/* Top Checkbox */}
        <div className="absolute top-2 left-2 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="w-4 h-4 rounded bg-stone-950/80 border-stone-600 text-amber-500 focus:ring-0 cursor-pointer"
          />
        </div>

        {/* Top Right Status Badge */}
        <div className="absolute top-2 right-2 z-10">
          <ItemStatusBadge item={item} />
        </div>

        {/* Type / Duration Badge */}
        {item.metadata?.type === 'VIDEO' && (
          <div className="absolute bottom-2 left-2 z-10 bg-stone-950/80 px-1.5 py-0.5 rounded text-[10px] text-stone-300 font-mono">
            VIDEO {item.metadata.duration ? `• ${Math.round(item.metadata.duration)}s` : ''}
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-3 flex-1 flex flex-col justify-between space-y-2 text-xs">
        <div>
          <div className="flex items-center justify-between gap-1 mb-1">
            <span
              onClick={onOpenDetail}
              className="font-medium text-stone-200 truncate cursor-pointer hover:text-amber-400"
              title={item.file.name}
            >
              {item.file.name}
            </span>
          </div>

          {/* Timestamp & Location */}
          <div className="text-[11px] text-stone-400 space-y-0.5">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-stone-400" />
              <span>
                {item.metadata?.taken_at
                  ? new Date(item.metadata.taken_at).toLocaleDateString()
                  : 'Undated (Needs Review)'}
              </span>
            </div>

            {item.metadata?.gps ? (
              <div className="flex items-center gap-1 text-emerald-400/90 truncate">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">
                  {item.metadata.gps.latitude.toFixed(3)}, {item.metadata.gps.longitude.toFixed(3)}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-stone-400">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span>No GPS in EXIF</span>
              </div>
            )}
          </div>
        </div>

        {/* Assigned Targets */}
        <div className="pt-2 border-t border-stone-800/60 space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-stone-400">Trip:</span>
            <span className="font-medium text-stone-300 truncate max-w-[120px]">
              {assignedTrip ? assignedTrip.title : <span className="text-amber-400">None</span>}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-stone-400">Place:</span>
            <span className="font-medium text-stone-300 truncate max-w-[120px]">
              {assignedPlace ? assignedPlace.name : <span className="text-stone-400">None</span>}
            </span>
          </div>
        </div>

        {/* Failed Error Message & Retry Action */}
        {item.status === 'FAILED' && (
          <div className="pt-2 border-t border-red-900/40 space-y-1.5">
            {item.errorMessage && (
              <p className="text-[10px] text-red-400 line-clamp-2" title={item.errorMessage}>
                {item.errorMessage}
              </p>
            )}
            {onRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetry}
                className="w-full text-[10px] h-6 border-red-600/50 text-red-400 hover:bg-red-500/10 flex items-center justify-center gap-1"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                Retry
              </Button>
            )}
          </div>
        )}

        {/* Duplicate Override Action */}
        {isDuplicate && (
          <div className="pt-1">
            <Button
              size="sm"
              variant="outline"
              onClick={onOverrideDuplicate}
              className="w-full text-[10px] h-6 border-amber-600/40 text-amber-400 hover:bg-amber-500/10"
            >
              Keep Both (Override Duplicate)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ItemStatusBadge({ item }: { item: IngestionItem }) {
  if (item.status === 'UPLOADING') {
    return (
      <Badge className="bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[10px] flex items-center gap-1">
        <RefreshCw className="w-2.5 h-2.5 animate-spin" />
        Uploading…
      </Badge>
    );
  }
  if (item.status === 'PROCESSING') {
    return (
      <Badge className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] flex items-center gap-1">
        <RefreshCw className="w-2.5 h-2.5 animate-spin" />
        Processing metadata…
      </Badge>
    );
  }
  if (item.status === 'ARCHIVED' || item.archivedMediaId) {
    return (
      <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]">
        Archived (Private Draft)
      </Badge>
    );
  }
  if (item.status === 'FAILED') {
    return (
      <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px]">
        Archive failed
      </Badge>
    );
  }
  if (item.duplicateStatus === 'EXACT_DUPLICATE') {
    return (
      <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px]">
        Exact duplicate
      </Badge>
    );
  }
  if (item.duplicateStatus === 'BATCH_DUPLICATE') {
    return (
      <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px]">
        Batch duplicate
      </Badge>
    );
  }
  if (item.status === 'NEEDS_REVIEW') {
    return (
      <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px]">
        Needs Review
      </Badge>
    );
  }
  if (item.reviewStatus === 'APPROVED') {
    return (
      <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]">
        Ready to archive
      </Badge>
    );
  }
  return (
    <Badge className="bg-stone-800 text-stone-300 border border-stone-700 text-[10px]">
      Ready to archive
    </Badge>
  );
}

// Item Detail & Raw EXIF Inspection Modal
interface ItemDetailModalProps {
  item: IngestionItem;
  trips: TripRow[];
  days: DayRow[];
  places: PlaceRow[];
  onClose: () => void;
  onSave: (updated: IngestionItem) => void;
  onOverrideDuplicate: () => void;
}

function ItemDetailModal({
  item,
  trips,
  days,
  places,
  onClose,
  onSave,
  onOverrideDuplicate,
}: ItemDetailModalProps) {
  const [tripId, setTripId] = React.useState(item.assigned_trip_id || '');
  const [dayId, setDayId] = React.useState(item.assigned_day_id || '');
  const [placeId, setPlaceId] = React.useState(item.assigned_place_id || '');
  const [caption, setCaption] = React.useState(item.caption || '');
  const [altText, setAltText] = React.useState(item.alt_text || '');
  const [reviewStatus, setReviewStatus] = React.useState<ReviewStatus>(item.reviewStatus);

  const availableDays = React.useMemo(() => {
    return tripId ? days.filter((d) => d.trip_id === tripId) : days;
  }, [days, tripId]);

  const handleSave = () => {
    const updated: IngestionItem = {
      ...item,
      assigned_trip_id: tripId || null,
      assigned_day_id: dayId || null,
      assigned_place_id: placeId || null,
      caption: caption || undefined,
      alt_text: altText || undefined,
      reviewStatus,
      status: tripId ? 'READY' : item.status,
    };
    onSave(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-stone-900 border border-stone-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-stone-800 pb-4">
          <div>
            <h3 className="text-lg font-serif text-stone-100">{item.file.name}</h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Technical EXIF metadata inspection and canonical assignment
            </p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Preview & EXIF Technical Table */}
          <div className="space-y-4">
            <div className="aspect-video bg-stone-950 rounded-lg overflow-hidden border border-stone-800 flex items-center justify-center">
              {item.metadata?.preview_url ? (
                <img
                  src={item.metadata.preview_url}
                  alt={item.file.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <FileText className="w-12 h-12 text-stone-400" />
              )}
            </div>

            <div className="bg-stone-950/60 rounded-lg p-3 border border-stone-800 space-y-2 text-xs">
              <span className="font-semibold text-stone-300 block border-b border-stone-800/80 pb-1">
                EXIF & Camera Metadata
              </span>
              <div className="grid grid-cols-2 gap-y-1.5 text-[11px]">
                <span className="text-stone-400">Capture Date:</span>
                <span className="text-stone-200">
                  {item.metadata?.taken_at
                    ? new Date(item.metadata.taken_at).toLocaleString()
                    : 'None (Missing)'}
                </span>

                <span className="text-stone-400">Dimensions:</span>
                <span className="text-stone-200 font-mono">
                  {item.metadata?.dimensions
                    ? `${item.metadata.dimensions.width} × ${item.metadata.dimensions.height}`
                    : 'Unknown'}
                </span>

                <span className="text-stone-400">Camera / Model:</span>
                <span className="text-stone-200">
                  {item.metadata?.camera?.make || item.metadata?.camera?.model
                    ? `${item.metadata.camera?.make || ''} ${
                        item.metadata.camera?.model || ''
                      }`.trim()
                    : 'Unknown'}
                </span>

                <span className="text-stone-400">Lens / Settings:</span>
                <span className="text-stone-200">
                  {item.metadata?.camera?.focal_length
                    ? `${item.metadata.camera.focal_length}mm`
                    : ''}{' '}
                  {item.metadata?.camera?.f_number ? `f/${item.metadata.camera.f_number}` : ''}{' '}
                  {item.metadata?.camera?.iso ? `ISO ${item.metadata.camera.iso}` : ''}
                </span>

                <span className="text-stone-400">GPS Coordinates:</span>
                <span className="text-stone-200 font-mono">
                  {item.metadata?.gps
                    ? `${item.metadata.gps.latitude.toFixed(5)}, ${item.metadata.gps.longitude.toFixed(
                        5
                      )}`
                    : 'None'}
                </span>

                <span className="text-stone-400">Content Hash:</span>
                <span
                  className="text-stone-400 font-mono truncate text-[10px]"
                  title={item.metadata?.content_hash}
                >
                  {item.metadata?.content_hash || 'Uncomputed'}
                </span>
              </div>
            </div>

            {/* Suggestions Audit Box */}
            {item.suggestions && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs space-y-1.5">
                <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Deterministic Suggestion Audit
                </span>
                {item.suggestions.suggested_trip && (
                  <p className="text-[11px] text-stone-300">
                    <strong>Trip:</strong> {item.suggestions.suggested_trip.reason}
                  </p>
                )}
                {item.suggestions.suggested_day && (
                  <p className="text-[11px] text-stone-300">
                    <strong>Day:</strong> {item.suggestions.suggested_day.reason}
                  </p>
                )}
                {item.suggestions.suggested_place && (
                  <p className="text-[11px] text-stone-300">
                    <strong>Place:</strong> {item.suggestions.suggested_place.reason}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right: Assignments & Overrides */}
          <div className="space-y-4 text-xs">
            {/* Trip Selector */}
            <div>
              <label className="block text-stone-300 font-medium mb-1">Assigned Trip</label>
              <select
                value={tripId}
                onChange={(e) => {
                  setTripId(e.target.value);
                  setDayId('');
                }}
                className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-stone-200 focus:outline-none focus:border-amber-500 text-xs"
              >
                <option value="">-- Select Trip --</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Day Selector */}
            <div>
              <label className="block text-stone-300 font-medium mb-1">Assigned Day</label>
              <select
                value={dayId}
                onChange={(e) => setDayId(e.target.value)}
                disabled={!tripId}
                className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-stone-200 focus:outline-none focus:border-amber-500 text-xs disabled:opacity-50"
              >
                <option value="">-- Select Day --</option>
                {availableDays.map((d) => (
                  <option key={d.id} value={d.id}>
                    Day {d.day_number}: {d.title || d.date}
                  </option>
                ))}
              </select>
            </div>

            {/* Place Selector */}
            <div>
              <label className="block text-stone-300 font-medium mb-1">Assigned Place</label>
              <select
                value={placeId}
                onChange={(e) => setPlaceId(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-stone-200 focus:outline-none focus:border-amber-500 text-xs"
              >
                <option value="">-- Select Place --</option>
                {places.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Caption */}
            <div>
              <label className="block text-stone-300 font-medium mb-1">Caption</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={2}
                placeholder="Optional caption..."
                className="w-full bg-stone-950 border border-stone-800 rounded p-2 text-stone-200 focus:outline-none focus:border-amber-500 text-xs"
              />
            </div>

            {/* Alt Text */}
            <div>
              <label className="block text-stone-300 font-medium mb-1">Alt Text</label>
              <input
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Descriptive accessibility text..."
                className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-stone-200 focus:outline-none focus:border-amber-500 text-xs"
              />
            </div>

            {/* Review Status Toggle */}
            <div className="pt-2">
              <label className="block text-stone-300 font-medium mb-1">Review Decision</label>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  type="button"
                  variant={reviewStatus === 'APPROVED' ? 'primary' : 'outline'}
                  onClick={() => setReviewStatus('APPROVED')}
                  className={
                    reviewStatus === 'APPROVED'
                      ? 'bg-emerald-600 text-stone-950 font-medium text-xs'
                      : 'border-stone-700 text-stone-300 text-xs'
                  }
                >
                  <Check className="w-3.5 h-3.5 mr-1" /> Approved
                </Button>

                <Button
                  size="sm"
                  type="button"
                  variant={reviewStatus === 'REJECTED' ? 'danger' : 'outline'}
                  onClick={() => setReviewStatus('REJECTED')}
                  className={
                    reviewStatus === 'REJECTED'
                      ? 'bg-red-600 text-stone-950 font-medium text-xs'
                      : 'border-stone-700 text-stone-300 text-xs'
                  }
                >
                  <X className="w-3.5 h-3.5 mr-1" /> Rejected
                </Button>
              </div>
            </div>

            {item.duplicateStatus === 'EXACT_DUPLICATE' && (
              <div className="pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onOverrideDuplicate}
                  className="w-full text-xs border-amber-600/50 text-amber-400 hover:bg-amber-500/10"
                >
                  Override Duplicate & Approve
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-stone-800 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-stone-700 text-stone-300 text-xs"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-medium text-xs"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
