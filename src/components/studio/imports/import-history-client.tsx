'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  History,
  FolderPlus,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Layers,
  ChevronRight,
  Filter,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { ImportSessionWithDetails } from '@/types/entities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface ImportHistoryClientProps {
  initialSessions: ImportSessionWithDetails[];
}

export function ImportHistoryClient({ initialSessions }: ImportHistoryClientProps) {
  const [sessions, setSessions] = React.useState<ImportSessionWithDetails[]>(initialSessions);
  const [filterStatus, setFilterStatus] = React.useState<string>('ALL');

  const stats = React.useMemo(() => {
    const totalSessions = sessions.length;
    let totalFiles = 0;
    let totalSuccess = 0;
    let totalDuplicates = 0;
    let totalFailed = 0;

    for (const s of sessions) {
      totalFiles += s.total_files || 0;
      totalSuccess += s.successful_files || 0;
      totalDuplicates += s.duplicate_files || 0;
      totalFailed += s.failed_files || 0;
    }

    return { totalSessions, totalFiles, totalSuccess, totalDuplicates, totalFailed };
  }, [sessions]);

  const filteredSessions = React.useMemo(() => {
    if (filterStatus === 'ALL') return sessions;
    return sessions.filter((s) => s.status === filterStatus);
  }, [sessions, filterStatus]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-amber-400 border-amber-500/30 bg-amber-500/10">
              Operational Archive Pipeline
            </Badge>
            <span className="text-xs text-stone-400">Phase 11 Capture & Import</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif text-stone-100 tracking-wide">
            Import History & Sessions
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Deterministic audit record of all batch media captures, item processing outcomes, and
            journey assignments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/studio/import">
            <Button className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-medium text-xs sm:text-sm flex items-center gap-2">
              <FolderPlus className="w-4 h-4" />
              New Import Session
            </Button>
          </Link>
        </div>
      </div>

      {/* Aggregate Statistics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card
          onClick={() => setFilterStatus('ALL')}
          className={`p-3.5 bg-stone-900/60 border cursor-pointer transition-colors ${
            filterStatus === 'ALL' ? 'border-amber-500' : 'border-stone-800 hover:border-stone-700'
          }`}
        >
          <div className="text-xs text-stone-400">Total Sessions</div>
          <div className="text-2xl font-serif text-stone-100 mt-1">{stats.totalSessions}</div>
        </Card>

        <Card className="p-3.5 bg-stone-900/60 border border-stone-800">
          <div className="text-xs text-stone-400">Total Files Handled</div>
          <div className="text-2xl font-serif text-stone-100 mt-1">{stats.totalFiles}</div>
        </Card>

        <Card
          onClick={() => setFilterStatus('COMPLETED')}
          className={`p-3.5 bg-stone-900/60 border cursor-pointer transition-colors ${
            filterStatus === 'COMPLETED'
              ? 'border-emerald-500'
              : 'border-stone-800 hover:border-stone-700'
          }`}
        >
          <div className="text-xs text-emerald-400">Archived Media</div>
          <div className="text-2xl font-serif text-emerald-400 mt-1">{stats.totalSuccess}</div>
        </Card>

        <Card className="p-3.5 bg-stone-900/60 border border-stone-800">
          <div className="text-xs text-amber-400">Duplicates Filtered</div>
          <div className="text-2xl font-serif text-amber-400 mt-1">{stats.totalDuplicates}</div>
        </Card>

        <Card
          onClick={() => setFilterStatus('REVIEW_REQUIRED')}
          className={`p-3.5 bg-stone-900/60 border cursor-pointer transition-colors ${
            filterStatus === 'REVIEW_REQUIRED'
              ? 'border-red-500'
              : 'border-stone-800 hover:border-stone-700'
          }`}
        >
          <div className="text-xs text-red-400">Needs Review / Failed</div>
          <div className="text-2xl font-serif text-red-400 mt-1">{stats.totalFailed}</div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-800/80 pb-2 overflow-x-auto text-xs">
        <span className="text-stone-400 flex items-center gap-1 mr-2">
          <Filter className="w-3.5 h-3.5" />
          Status Filter:
        </span>
        {['ALL', 'COMPLETED', 'REVIEW_REQUIRED', 'PROCESSING', 'FAILED'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-2.5 py-1 rounded transition-colors ${
              filterStatus === status
                ? 'bg-stone-800 text-amber-400 font-medium'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <div className="text-center py-16 bg-stone-900/30 rounded-xl border border-stone-800/60">
          <History className="w-10 h-10 text-stone-600 mx-auto mb-3" />
          <h3 className="text-base font-serif text-stone-300">No Import Sessions Found</h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto mt-1 mb-4">
            {filterStatus === 'ALL'
              ? 'No media batches have been captured into the archive yet. Start an import to create your first session.'
              : `No import sessions currently match status "${filterStatus}".`}
          </p>
          <Link href="/studio/import">
            <Button size="sm" className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-medium text-xs">
              Open Smart Ingestion
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              className="bg-stone-900/60 border border-stone-800 hover:border-stone-700/90 rounded-xl p-4 transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              {/* Left Details */}
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-serif text-stone-100 font-medium text-sm sm:text-base truncate">
                    {session.name || `Session #${session.id.slice(0, 8)}`}
                  </span>
                  <SessionStatusBadge status={session.status} />
                  {session.trip && (
                    <Badge variant="outline" className="text-stone-400 border-stone-700 text-[10px]">
                      Trip: {session.trip.title}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-stone-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-stone-400" />
                    {new Date(session.created_at).toLocaleString()}
                  </span>
                  <span>Operator: {session.created_by}</span>
                  {session.notes && (
                    <span className="text-stone-400 truncate max-w-xs" title={session.notes}>
                      Note: {session.notes}
                    </span>
                  )}
                </div>
              </div>

              {/* Counts & Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-stone-800/80">
                <div className="flex items-center gap-3 text-xs">
                  <div className="text-center px-2 py-1 bg-stone-950/60 rounded border border-stone-800">
                    <div className="text-[10px] text-stone-400 uppercase">Files</div>
                    <div className="font-mono text-stone-200">{session.total_files}</div>
                  </div>
                  <div className="text-center px-2 py-1 bg-emerald-950/20 rounded border border-emerald-900/30">
                    <div className="text-[10px] text-emerald-400 uppercase">Success</div>
                    <div className="font-mono text-emerald-400">{session.successful_files}</div>
                  </div>
                  <div className="text-center px-2 py-1 bg-amber-950/20 rounded border border-amber-900/30">
                    <div className="text-[10px] text-amber-400 uppercase">Dupes</div>
                    <div className="font-mono text-amber-400">{session.duplicate_files}</div>
                  </div>
                  {session.failed_files > 0 && (
                    <div className="text-center px-2 py-1 bg-red-950/20 rounded border border-red-900/30">
                      <div className="text-[10px] text-red-400 uppercase">Failed</div>
                      <div className="font-mono text-red-400">{session.failed_files}</div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/studio/imports/${session.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-stone-700 text-stone-300 hover:text-stone-100 text-xs flex items-center gap-1"
                    >
                      Details
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>

                  {session.trip_id && (
                    <Link href={`/studio/archive?trip=${session.trip_id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-amber-600/40 text-amber-400 hover:bg-amber-500/10 text-xs hidden md:flex items-center gap-1"
                        title="Curate in Archive"
                      >
                        <Layers className="w-3 h-3" />
                        Curate
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SessionStatusBadge({ status }: { status: string }) {
  if (status === 'COMPLETED') {
    return (
      <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] flex items-center gap-1">
        <CheckCircle2 className="w-2.5 h-2.5" />
        Completed
      </Badge>
    );
  }
  if (status === 'PROCESSING') {
    return (
      <Badge className="bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[10px] flex items-center gap-1">
        <RefreshCw className="w-2.5 h-2.5 animate-spin" />
        Processing
      </Badge>
    );
  }
  if (status === 'REVIEW_REQUIRED') {
    return (
      <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] flex items-center gap-1">
        <AlertCircle className="w-2.5 h-2.5" />
        Review Required
      </Badge>
    );
  }
  if (status === 'FAILED') {
    return (
      <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] flex items-center gap-1">
        <AlertCircle className="w-2.5 h-2.5" />
        Failed
      </Badge>
    );
  }
  if (status === 'CANCELLED') {
    return (
      <Badge className="bg-stone-800 text-stone-400 border border-stone-700 text-[10px]">
        Cancelled
      </Badge>
    );
  }
  return (
    <Badge className="bg-stone-800 text-stone-300 border border-stone-700 text-[10px]">
      Created
    </Badge>
  );
}
