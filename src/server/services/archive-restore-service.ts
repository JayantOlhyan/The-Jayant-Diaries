import { ArchiveVerificationService, ArchiveVerificationReport } from './archive-verification-service';
import { ArchiveRepository } from '../repositories/archive-repository';
import { ArchivePackagePayload } from './archive-export-service';

export interface ArchiveRestoreResult {
  success: boolean;
  mode: 'NEW_ONLY' | 'MERGE';
  verificationReport: ArchiveVerificationReport;
  restoredCounts: Record<string, number>;
  errors: string[];
  restoredAt: string;
}

export class ArchiveRestoreService {
  /**
   * Executes a verified restore operation in the selected restore mode.
   */
  static async restoreArchivePackage(
    payload: any,
    mode: 'NEW_ONLY' | 'MERGE' = 'NEW_ONLY'
  ): Promise<ArchiveRestoreResult> {
    // 1. Mandatory Pre-validation Gate
    const verificationReport = await ArchiveVerificationService.verifyPackagePayload(payload);

    if (!verificationReport.isValid) {
      return {
        success: false,
        mode,
        verificationReport,
        restoredCounts: {},
        errors: [
          'Pre-validation gate failed. Cannot restore corrupt or invalid archive package.',
          ...verificationReport.errors,
        ],
        restoredAt: new Date().toISOString(),
      };
    }

    const { entities } = payload as ArchivePackagePayload;

    // 2. Execute Restoration
    try {
      const { restoredCounts, errors } = await ArchiveRepository.restoreEntityCollection(entities, mode);

      const success = errors.length === 0;

      return {
        success,
        mode,
        verificationReport,
        restoredCounts,
        errors,
        restoredAt: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        success: false,
        mode,
        verificationReport,
        restoredCounts: {},
        errors: [`Uncaught restore exception: ${err?.message || 'Unknown error'}`],
        restoredAt: new Date().toISOString(),
      };
    }
  }
}
