'use client';

import { useState } from 'react';
import {
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  ShieldCheck,
  RefreshCw,
  HardDrive,
  Database,
  Layers,
  MapPin,
  Camera,
  BookOpen,
  Calendar,
  Tag,
  History,
} from 'lucide-react';
import {
  generateArchiveExportAction,
  verifyArchivePayloadAction,
  restoreArchivePayloadAction,
} from '@/server/actions/archive-actions';
import { ArchivePackagePayload } from '@/server/services/archive-export-service';
import { ArchiveVerificationReport } from '@/server/services/archive-verification-service';

interface ArchiveExportClientProps {
  initialCounts: {
    trips: number;
    days: number;
    places: number;
    memories: number;
    media: number;
    stories: number;
    tags: number;
    imports: number;
  };
}

export function ArchiveExportClient({ initialCounts }: ArchiveExportClientProps) {
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const [archiveJsonInput, setArchiveJsonInput] = useState<string>('');
  const [verifying, setVerifying] = useState(false);
  const [verificationReport, setVerificationReport] = useState<ArchiveVerificationReport | null>(null);
  const [parsedPayload, setParsedPayload] = useState<ArchivePackagePayload | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [restoreMode, setRestoreMode] = useState<'NEW_ONLY' | 'MERGE'>('NEW_ONLY');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<any | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  // Handle Export Download
  const handleExportDownload = async () => {
    setExporting(true);
    setExportError(null);
    setExportSuccess(false);

    try {
      const res = await generateArchiveExportAction();
      if (!res.success || !res.payload) {
        setExportError(res.error || 'Failed to generate archive export.');
        setExporting(false);
        return;
      }

      const jsonString = JSON.stringify(res.payload, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `jayant-diaries-archive-${timestamp}.json`;

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
    } catch (err: any) {
      setExportError(err.message || 'An unexpected error occurred during export.');
    } finally {
      setExporting(false);
    }
  };

  // Handle File Upload for Verification
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVerifyError(null);
    setVerificationReport(null);
    setParsedPayload(null);
    setRestoreResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        setArchiveJsonInput(text);
        const parsed = JSON.parse(text);
        setParsedPayload(parsed);
      } catch (err: any) {
        setVerifyError(`Invalid JSON file format: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Run Verification
  const handleVerify = async () => {
    if (!parsedPayload) {
      setVerifyError('Please select a valid JSON archive file first.');
      return;
    }

    setVerifying(true);
    setVerifyError(null);

    try {
      const res = await verifyArchivePayloadAction(parsedPayload);
      if (!res.success || !res.report) {
        setVerifyError(res.error || 'Failed to verify archive payload.');
      } else {
        setVerificationReport(res.report);
      }
    } catch (err: any) {
      setVerifyError(err.message || 'Verification exception occurred.');
    } finally {
      setVerifying(false);
    }
  };

  // Execute Restore
  const handleExecuteRestore = async () => {
    if (!parsedPayload || !verificationReport?.isValid) return;

    setRestoring(true);
    setRestoreError(null);

    try {
      const res = await restoreArchivePayloadAction(parsedPayload, restoreMode);
      if (!res.success || !res.result) {
        setRestoreError(res.error || 'Restore failed.');
      } else {
        setRestoreResult(res.result);
        setShowConfirmModal(false);
      }
    } catch (err: any) {
      setRestoreError(err.message || 'Restore exception occurred.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif tracking-wide text-stone-100 flex items-center gap-2">
          <HardDrive className="w-6 h-6 text-amber-500" />
          Archive Backup, Export & Portability
        </h1>
        <p className="text-sm text-stone-400 mt-1">
          Export full deterministic archive snapshots, verify cryptographic integrity (SHA-256), and safely restore data without lock-in.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Export Card */}
        <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-stone-800 pb-4">
            <div>
              <h2 className="text-lg font-medium text-stone-200 flex items-center gap-2">
                <Download className="w-5 h-5 text-amber-500" />
                Archive Export
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">Generate a complete, portable JSON archive snapshot</p>
            </div>
            <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">
              v1 Manifest Format
            </span>
          </div>

          {/* Entity Counts Grid */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3 block">
              Current Archive Content
            </span>
            <div className="grid grid-cols-4 gap-2.5">
              <div className="bg-stone-950 p-2.5 rounded-lg border border-stone-800/60 text-center">
                <Layers className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" />
                <span className="text-sm font-semibold text-stone-200 block">{initialCounts.trips}</span>
                <span className="text-[10px] text-stone-500">Trips</span>
              </div>

              <div className="bg-stone-950 p-2.5 rounded-lg border border-stone-800/60 text-center">
                <Calendar className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" />
                <span className="text-sm font-semibold text-stone-200 block">{initialCounts.days}</span>
                <span className="text-[10px] text-stone-500">Days</span>
              </div>

              <div className="bg-stone-950 p-2.5 rounded-lg border border-stone-800/60 text-center">
                <MapPin className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" />
                <span className="text-sm font-semibold text-stone-200 block">{initialCounts.places}</span>
                <span className="text-[10px] text-stone-500">Places</span>
              </div>

              <div className="bg-stone-950 p-2.5 rounded-lg border border-stone-800/60 text-center">
                <BookOpen className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" />
                <span className="text-sm font-semibold text-stone-200 block">{initialCounts.memories}</span>
                <span className="text-[10px] text-stone-500">Memories</span>
              </div>

              <div className="bg-stone-950 p-2.5 rounded-lg border border-stone-800/60 text-center">
                <Camera className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" />
                <span className="text-sm font-semibold text-stone-200 block">{initialCounts.media}</span>
                <span className="text-[10px] text-stone-500">Media</span>
              </div>

              <div className="bg-stone-950 p-2.5 rounded-lg border border-stone-800/60 text-center">
                <Database className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" />
                <span className="text-sm font-semibold text-stone-200 block">{initialCounts.stories}</span>
                <span className="text-[10px] text-stone-500">Stories</span>
              </div>

              <div className="bg-stone-950 p-2.5 rounded-lg border border-stone-800/60 text-center">
                <Tag className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" />
                <span className="text-sm font-semibold text-stone-200 block">{initialCounts.tags}</span>
                <span className="text-[10px] text-stone-500">Tags</span>
              </div>

              <div className="bg-stone-950 p-2.5 rounded-lg border border-stone-800/60 text-center">
                <History className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" />
                <span className="text-sm font-semibold text-stone-200 block">{initialCounts.imports}</span>
                <span className="text-[10px] text-stone-500">Imports</span>
              </div>
            </div>
          </div>

          {/* Guarantees Box */}
          <div className="bg-stone-950 p-3 rounded-lg border border-stone-800/80 space-y-1.5 text-xs text-stone-400">
            <div className="flex items-center gap-1.5 text-amber-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              Export Guarantees & Privacy
            </div>
            <p className="text-[11px] leading-relaxed">
              Contains machine-readable schema manifests, SHA-256 entity file hashes, relational mapping, and curation ordering. Service-role keys, database secrets, and environment tokens are strictly excluded.
            </p>
          </div>

          {/* Action Button */}
          <div>
            <button
              type="button"
              onClick={handleExportDownload}
              disabled={exporting}
              className="w-full py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {exporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating Archive Package...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Generate & Download Archive Snapshot (.json)
                </>
              )}
            </button>

            {exportSuccess && (
              <p className="text-xs text-emerald-400 flex items-center gap-1.5 mt-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Archive export generated and downloaded successfully.
              </p>
            )}

            {exportError && (
              <p className="text-xs text-red-400 flex items-center gap-1.5 mt-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                {exportError}
              </p>
            )}
          </div>
        </div>

        {/* Restore Card */}
        <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-stone-800 pb-4">
            <div>
              <h2 className="text-lg font-medium text-stone-200 flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-400" />
                Archive Verification & Restore
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">Pre-validate SHA-256 checksums and restore safely</p>
            </div>
          </div>

          {/* Step 1: File Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 block">
              1. Select Archive File
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="w-full text-xs text-stone-400 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-stone-800 file:text-stone-200 hover:file:bg-stone-700 bg-stone-950 p-2 rounded-lg border border-stone-800 cursor-pointer"
            />
          </div>

          {/* Step 2: Verification Action */}
          {parsedPayload && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleVerify}
                disabled={verifying}
                className="w-full py-2 px-3 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium text-xs transition-colors flex items-center justify-center gap-2"
              >
                {verifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                    Validating SHA-256 Checksums...
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    Inspect & Verify Archive Integrity
                  </>
                )}
              </button>
            </div>
          )}

          {verifyError && (
            <p className="text-xs text-red-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              {verifyError}
            </p>
          )}

          {/* Verification Report */}
          {verificationReport && (
            <div className="bg-stone-950 p-4 rounded-lg border border-stone-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-300">Verification Audit Report</span>
                {verificationReport.isValid ? (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                    ✓ PASSED PRE-VALIDATION
                  </span>
                ) : (
                  <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-mono">
                    ✕ FAILED AUDIT
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-stone-400">Format:</span>
                  <span className={verificationReport.formatValid ? 'text-emerald-400 font-mono' : 'text-red-400'}>
                    {verificationReport.formatValid ? 'Valid (v1)' : 'Invalid'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-stone-400">Checksums:</span>
                  <span className={verificationReport.checksumsValid ? 'text-emerald-400 font-mono' : 'text-red-400'}>
                    {verificationReport.checksumsValid ? 'SHA-256 Match' : 'Mismatch'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-stone-400">New Records:</span>
                  <span className="text-stone-200 font-mono">{verificationReport.summary.newRecordsCount}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-stone-400">Existing Records:</span>
                  <span className="text-stone-200 font-mono">{verificationReport.summary.existingRecordsCount}</span>
                </div>
              </div>

              {verificationReport.warnings.length > 0 && (
                <div className="text-[11px] text-amber-400/90 bg-amber-500/10 p-2 rounded border border-amber-500/20 space-y-1">
                  {verificationReport.warnings.map((w, idx) => (
                    <div key={idx}>⚠️ {w}</div>
                  ))}
                </div>
              )}

              {/* Restore Controls */}
              {verificationReport.isValid && (
                <div className="pt-3 border-t border-stone-800 space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-stone-400 block mb-1.5">
                      Select Restore Mode:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRestoreMode('NEW_ONLY')}
                        className={`py-1.5 px-2.5 rounded text-xs border text-left transition-colors ${
                          restoreMode === 'NEW_ONLY'
                            ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-medium'
                            : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        <div className="font-semibold">New Records Only</div>
                        <div className="text-[10px] text-stone-500">Skip existing records</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRestoreMode('MERGE')}
                        className={`py-1.5 px-2.5 rounded text-xs border text-left transition-colors ${
                          restoreMode === 'MERGE'
                            ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-medium'
                            : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        <div className="font-semibold">Merge Records</div>
                        <div className="text-[10px] text-stone-500">Safe update missing fields</div>
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(true)}
                    className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Restore Archive ({restoreMode})
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Restore Result Summary */}
          {restoreResult && (
            <div className="bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-lg space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Restore Completed Successfully
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] text-stone-300 font-mono">
                <div>Places: {restoreResult.restoredCounts.places || 0}</div>
                <div>Trips: {restoreResult.restoredCounts.trips || 0}</div>
                <div>Days: {restoreResult.restoredCounts.days || 0}</div>
                <div>Memories: {restoreResult.restoredCounts.memories || 0}</div>
                <div>Media: {restoreResult.restoredCounts.media || 0}</div>
                <div>Stories: {restoreResult.restoredCounts.stories || 0}</div>
              </div>
            </div>
          )}

          {restoreError && (
            <p className="text-xs text-red-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              {restoreError}
            </p>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-medium text-base">
              <AlertTriangle className="w-5 h-5" />
              Confirm Archive Restoration
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              You are about to restore an archive snapshot in <strong className="text-amber-400 font-mono">{restoreMode}</strong> mode. This action will write validated records directly into your database storage.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="py-1.5 px-3 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                disabled={restoring}
                className="py-1.5 px-3 rounded bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-semibold text-xs transition-colors flex items-center gap-1.5"
              >
                {restoring ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Restoring Archive...
                  </>
                ) : (
                  'Confirm & Execute Restore'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
