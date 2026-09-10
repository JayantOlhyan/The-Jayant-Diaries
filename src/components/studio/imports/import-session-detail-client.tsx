'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Layers,
  Clock,
  FileText,
  Shield,
  Filter,
  Copy,
  FolderPlus,
} from 'lucide-react';
import { ImportSessionWithDetails, ImportSessionItemRow } from '@/types/entities';
import { retryFailedSessionItemsAction } from '@/server/actions/ingestion-actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface ImportSessionDetailClientProps {
  session: ImportSessionWithDetails;
}

export function ImportSessionDetailClient({ session: initialSession }: ImportSessionDetailClientProps) {
  const [session, setSession] = React.useState<ImportSessionWithDetails>(initialSession);
  const [itemFilter, setItemFilter] = React.useState<string>('ALL');
  const [isRetrying, setIsRetrying] = React.useState(false);
  const [retryMessage, setRetryMessage] = React.useState<string | null>(null);

  const filteredItems = React.useMemo(() => {
    const list = session.items || [];
    if (itemFilter === 'ALL') return list;
    return list.filter((i) => i.status === itemFilter);
  }, [session.items, itemFilter]);

  const handleRetryFailed = async () => {
    setIsRetrying(true);
    setRetryMessage(null);
    try {
      const res = await retryFailedSessionItemsAction(session.id);
      if (res.success) {
        setRetryMessage(`Successfully queued ${res.retriedCount} item(s) for retry.`);
        // Optimistically update session item statuses in UI
        setSession((prev) => ({
          ...prev,
          status: 'PROCESSING',
          failed_files: 0,
          items: (prev.items || []).map((item) =>
            item.status === 'FAILED' ? { ...item, status: 'QUEUED', error_message: null } : item
          ),
        }));
      } else {
        setRetryMessage(res.error || 'Failed to retry items');
      }
    } catch (err: any) {
      setRetryMessage(err.message || 'Error executing retry');
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-stone-400">
        <Link href="/studio/imports" className="hover:text-stone-200 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Import History
        </Link>
        <span>/</span>
        <span className="text-stone-300">Session Details</span>
      </div>

      {/* Header Banner */}
      <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-serif text-stone-100 font-medium">
                {session.name || `Import Session #${session.id.slice(0, 8)}`}
              </h1>
              <SessionStatusBadge status={session.status} />
            </div>
            <p className="text-xs text-stone-400">
              Session ID: <code className="font-mono text-stone-300">{session.id}</code>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {session.failed_files > 0 && (
              <Button
                onClick={handleRetryFailed}
                disabled={isRetrying}
                className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-medium text-xs flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                Retry Failed ({session.failed_files})
              </Button>
            )}

            {session.trip_id ? (
              <Link href={`/studio/archive?trip=${session.trip_id}`}>
                <Button
                  variant="outline"
                  className="border-emerald-600/40 text-emerald-400 hover:bg-emerald-500/10 text-xs flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5" />
                  Curate in Archive
                </Button>
              </Link>
            ) : (
              <Link href="/studio/archive">
                <Button
                  variant="outline"
                  className="border-stone-700 text-stone-300 text-xs flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5" />
                  Open Archive Curation
                </Button>
              </Link>
            )}
          </div>
        </div>

        {retryMessage && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>{retryMessage}</span>
          </div>
        )}

        {/* Metadata Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-stone-800/80 text-xs">
          <div>
            <span className="text-stone-400 block text-[11px]">Capture Timestamp</span>
            <span className="text-stone-200 font-medium flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3 text-stone-400" />
              {new Date(session.created_at).toLocaleString()}
            </span>
          </div>

          <div>
            <span className="text-stone-400 block text-[11px]">Operator</span>
            <span className="text-stone-200 font-medium mt-0.5 block">{session.created_by}</span>
          </div>

          <div>
            <span className="text-stone-400 block text-[11px]">Target Trip</span>
            <span className="text-stone-200 font-medium mt-0.5 block">
              {session.trip ? session.trip.title : 'Unassigned'}
            </span>
          </div>

          <div>
            <span className="text-stone-400 block text-[11px]">Target Day</span>
            <span className="text-stone-200 font-medium mt-0.5 block">
              {session.day ? `Day ${session.day.day_number}: ${session.day.title || session.day.date}` : 'Unassigned'}
            </span>
          </div>
        </div>
      </div>

      {/* Outcome Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card
          onClick={() => setItemFilter('ALL')}
          className={`p-3.5 bg-stone-900/60 border cursor-pointer transition-colors ${
            itemFilter === 'ALL' ? 'border-amber-500' : 'border-stone-800 hover:border-stone-700'
          }`}
        >
          <div className="text-xs text-stone-400">Total Items in Batch</div>
          <div className="text-2xl font-serif text-stone-100 mt-1">{session.total_files}</div>
        </Card>

        <Card
          onClick={() => setItemFilter('SUCCESS')}
          className={`p-3.5 bg-stone-900/60 border cursor-pointer transition-colors ${
            itemFilter === 'SUCCESS' ? 'border-emerald-500' : 'border-stone-800 hover:border-stone-700'
          }`}
        >
          <div className="text-xs text-emerald-400">Persisted to Archive</div>
          <div className="text-2xl font-serif text-emerald-400 mt-1">{session.successful_files}</div>
        </Card>

        <Card
          onClick={() => setItemFilter('DUPLICATE')}
          className={`p-3.5 bg-stone-900/60 border cursor-pointer transition-colors ${
            itemFilter === 'DUPLICATE' ? 'border-amber-500' : 'border-stone-800 hover:border-stone-700'
          }`}
        >
          <div className="text-xs text-amber-400">Duplicates Detected</div>
          <div className="text-2xl font-serif text-amber-400 mt-1">{session.duplicate_files}</div>
        </Card>

        <Card
          onClick={() => setItemFilter('FAILED')}
          className={`p-3.5 bg-stone-900/60 border cursor-pointer transition-colors ${
            itemFilter === 'FAILED' ? 'border-red-500' : 'border-stone-800 hover:border-stone-700'
          }`}
        >
          <div className="text-xs text-red-400">Failures Encountered</div>
          <div className="text-2xl font-serif text-red-400 mt-1">{session.failed_files}</div>
        </Card>
      </div>

      {/* Item Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-800 pb-2 text-xs">
        <span className="text-stone-400 flex items-center gap-1 mr-2">
          <Filter className="w-3.5 h-3.5" />
          Filter Items:
        </span>
        {['ALL', 'SUCCESS', 'DUPLICATE', 'FAILED', 'QUEUED'].map((f) => (
          <button
            key={f}
            onClick={() => setItemFilter(f)}
            className={`px-2.5 py-1 rounded transition-colors ${
              itemFilter === f
                ? 'bg-stone-800 text-amber-400 font-medium'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Item-level Processing Results Table */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-stone-900/30 rounded-xl border border-stone-800/60 text-xs text-stone-400">
          No items found matching filter &ldquo;{itemFilter}&rdquo;.
        </div>
      ) : (
        <div className="bg-stone-900/50 border border-stone-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-800 bg-stone-950/40 text-stone-400 font-medium">
                  <th className="py-3 px-4">Filename</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">SHA-256 Hash</th>
                  <th className="py-3 px-4">Outcome / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-stone-200 font-medium">
                      {item.filename}
                    </td>

                    <td className="py-3 px-4">
                      <ItemStatusBadge status={item.status} />
                    </td>

                    <td className="py-3 px-4 text-stone-400 font-mono">
                      {item.file_size_bytes
                        ? item.file_size_bytes > 1024 * 1024
                          ? `${(item.file_size_bytes / (1024 * 1024)).toFixed(1)} MB`
                          : `${Math.round(item.file_size_bytes / 1024)} KB`
                        : 'Unknown'}
                    </td>

                    <td className="py-3 px-4 text-stone-400 font-mono">
                      {item.mime_type || 'Unknown'}
                    </td>

                    <td className="py-3 px-4">
                      {item.content_hash ? (
                        <span
                          className="font-mono text-[10px] text-stone-400 truncate max-w-[120px] block"
                          title={item.content_hash}
                        >
                          {item.content_hash.slice(0, 12)}…
                        </span>
                      ) : (
                        <span className="text-stone-400">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {item.status === 'FAILED' && (
                        <div className="text-red-400 text-[11px] font-medium flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{item.error_message || 'Storage or database rejection'}</span>
                        </div>
                      )}

                      {item.status === 'DUPLICATE' && (
                        <div className="text-amber-400 text-[11px] flex items-center gap-1.5">
                          <span>Exact duplicate skipped</span>
                          {item.media_id && (
                            <code className="text-[10px] text-stone-400 bg-stone-950 px-1 py-0.5 rounded">
                              ID: {item.media_id.slice(0, 8)}
                            </code>
                          )}
                        </div>
                      )}

                      {item.status === 'SUCCESS' && (
                        <div className="text-emerald-400 text-[11px] flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Archived (Private Draft)</span>
                          {item.media_id && (
                            <code className="text-[10px] text-stone-400 bg-stone-950 px-1 py-0.5 rounded">
                              {item.media_id.slice(0, 8)}
                            </code>
                          )}
                        </div>
                      )}

                      {item.status === 'QUEUED' && (
                        <span className="text-stone-400 text-[11px]">Queued for retry</span>
                      )}

                      {item.status === 'PROCESSING' && (
                        <span className="text-sky-400 text-[11px] flex items-center gap-1">
                          <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Processing
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function SessionStatusBadge({ status }: { status: string }) {
  if (status === 'COMPLETED') {
    return (
      <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] flex items-center gap-1">
        <CheckCircle2 className="w-2.5 h-2.5" /> Completed
      </Badge>
    );
  }
  if (status === 'PROCESSING') {
    return (
      <Badge className="bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[10px] flex items-center gap-1">
        <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Processing
      </Badge>
    );
  }
  if (status === 'REVIEW_REQUIRED') {
    return (
      <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] flex items-center gap-1">
        <AlertCircle className="w-2.5 h-2.5" /> Review Required
      </Badge>
    );
  }
  if (status === 'FAILED') {
    return (
      <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] flex items-center gap-1">
        <AlertCircle className="w-2.5 h-2.5" /> Failed
      </Badge>
    );
  }
  return <Badge className="bg-stone-800 text-stone-300 text-[10px]">Created</Badge>;
}

function ItemStatusBadge({ status }: { status: string }) {
  if (status === 'SUCCESS') {
    return <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">SUCCESS</Badge>;
  }
  if (status === 'DUPLICATE') {
    return <Badge className="bg-amber-500/20 text-amber-400 text-[10px]">DUPLICATE</Badge>;
  }
  if (status === 'FAILED') {
    return <Badge className="bg-red-500/20 text-red-400 text-[10px]">FAILED</Badge>;
  }
  if (status === 'QUEUED') {
    return <Badge className="bg-stone-800 text-stone-400 text-[10px]">QUEUED</Badge>;
  }
  return <Badge className="bg-sky-500/20 text-sky-400 text-[10px]">PROCESSING</Badge>;
}
