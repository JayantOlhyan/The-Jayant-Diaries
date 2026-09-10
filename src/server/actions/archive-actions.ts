'use server';

import { revalidatePath } from 'next/cache';
import { verifyStudioAuth } from '@/lib/auth/server';
import { ArchiveExportService, ArchivePackagePayload } from '../services/archive-export-service';
import { ArchiveVerificationService, ArchiveVerificationReport } from '../services/archive-verification-service';
import { ArchiveRestoreService, ArchiveRestoreResult } from '../services/archive-restore-service';

export interface ExportActionResult {
  success: boolean;
  payload?: ArchivePackagePayload;
  error?: string;
}

export interface VerifyActionResult {
  success: boolean;
  report?: ArchiveVerificationReport;
  error?: string;
}

export interface RestoreActionResult {
  success: boolean;
  result?: ArchiveRestoreResult;
  error?: string;
}

/**
 * Creates a versioned, SHA-256 verified archive export payload.
 */
export async function generateArchiveExportAction(): Promise<ExportActionResult> {
  const auth = await verifyStudioAuth();
  if (!auth.authenticated) {
    return { success: false, error: 'Unauthorized: Studio session required' };
  }

  try {
    const payload = await ArchiveExportService.createExportPackage();
    return { success: true, payload };
  } catch (err: any) {
    console.error('generateArchiveExportAction error:', err);
    return { success: false, error: err.message || 'Failed to generate archive export' };
  }
}

/**
 * Pre-validates an archive payload without modifying database state.
 */
export async function verifyArchivePayloadAction(payload: any): Promise<VerifyActionResult> {
  const auth = await verifyStudioAuth();
  if (!auth.authenticated) {
    return { success: false, error: 'Unauthorized: Studio session required' };
  }

  try {
    const report = await ArchiveVerificationService.verifyPackagePayload(payload);
    return { success: true, report };
  } catch (err: any) {
    console.error('verifyArchivePayloadAction error:', err);
    return { success: false, error: err.message || 'Failed to verify archive payload' };
  }
}

/**
 * Restores a pre-validated archive package safely in the specified restore mode.
 */
export async function restoreArchivePayloadAction(
  payload: any,
  mode: 'NEW_ONLY' | 'MERGE' = 'NEW_ONLY'
): Promise<RestoreActionResult> {
  const auth = await verifyStudioAuth();
  if (!auth.authenticated) {
    return { success: false, error: 'Unauthorized: Studio session required' };
  }

  try {
    const result = await ArchiveRestoreService.restoreArchivePackage(payload, mode);

    try {
      revalidatePath('/studio');
      revalidatePath('/studio/archive');
      revalidatePath('/studio/archive/export');
      revalidatePath('/studio/trips');
      revalidatePath('/studio/places');
      revalidatePath('/studio/media');
    } catch {
      // Ignored in test environments
    }

    return { success: result.success, result };
  } catch (err: any) {
    console.error('restoreArchivePayloadAction error:', err);
    return { success: false, error: err.message || 'Failed to restore archive payload' };
  }
}
