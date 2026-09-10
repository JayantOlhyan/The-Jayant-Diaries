import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ArchiveExportService } from '../../services/archive-export-service';
import { ArchiveVerificationService } from '../../services/archive-verification-service';
import { ArchiveRestoreService } from '../../services/archive-restore-service';
import { TripRepository } from '../trip-repository';
import { PlaceRepository } from '../place-repository';
import { MemoryRepository } from '../memory-repository';
import { MediaRepository } from '../media-repository';
import {
  generateArchiveExportAction,
  verifyArchivePayloadAction,
  restoreArchivePayloadAction,
} from '../../actions/archive-actions';

describe('Phase 12: Archive Backup, Export & Portability', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.TEST_AUTH_OVERRIDE = 'authenticated';
  });

  it('exports a valid versioned archive package with manifest and SHA-256 checksums', async () => {
    const pkg = await ArchiveExportService.createExportPackage();

    expect(pkg).toBeDefined();
    expect(pkg.manifest.format).toBe('the-jayant-diaries-archive');
    expect(pkg.manifest.version).toBe(1);
    expect(pkg.manifest.checksumAlgorithm).toBe('sha256');
    expect(pkg.manifest.recordCounts).toBeDefined();
    expect(pkg.manifest.exportedAt).toBeDefined();

    expect(pkg.checksums['trips.json']).toBeDefined();
    expect(pkg.checksums['days.json']).toBeDefined();
    expect(pkg.checksums['places.json']).toBeDefined();
    expect(pkg.checksums['media.json']).toBeDefined();

    expect(Array.isArray(pkg.entities.trips)).toBe(true);
    expect(Array.isArray(pkg.entities.places)).toBe(true);
  });

  it('passes pre-validation for a freshly generated archive package', async () => {
    const pkg = await ArchiveExportService.createExportPackage();
    const report = await ArchiveVerificationService.verifyPackagePayload(pkg);

    expect(report.isValid).toBe(true);
    expect(report.formatValid).toBe(true);
    expect(report.versionSupported).toBe(true);
    expect(report.checksumsValid).toBe(true);
    expect(report.errors).toHaveLength(0);
  });

  it('fails pre-validation when manifest format is invalid', async () => {
    const pkg = await ArchiveExportService.createExportPackage();
    const corrupted = {
      ...pkg,
      manifest: {
        ...pkg.manifest,
        format: 'invalid-format-string',
      },
    };

    const report = await ArchiveVerificationService.verifyPackagePayload(corrupted);
    expect(report.isValid).toBe(false);
    expect(report.formatValid).toBe(false);
    expect(report.errors.some((e) => e.includes('Manifest format mismatch'))).toBe(true);
  });

  it('fails pre-validation when manifest version is unsupported', async () => {
    const pkg = await ArchiveExportService.createExportPackage();
    const corrupted = {
      ...pkg,
      manifest: {
        ...pkg.manifest,
        version: 99,
      },
    };

    const report = await ArchiveVerificationService.verifyPackagePayload(corrupted);
    expect(report.isValid).toBe(false);
    expect(report.versionSupported).toBe(false);
    expect(report.errors.some((e) => e.includes('Unsupported archive version'))).toBe(true);
  });

  it('fails pre-validation when SHA-256 checksum is corrupted', async () => {
    const pkg = await ArchiveExportService.createExportPackage();
    const corrupted = {
      ...pkg,
      checksums: {
        ...pkg.checksums,
        'trips.json': '0000000000000000000000000000000000000000000000000000000000000000',
      },
    };

    const report = await ArchiveVerificationService.verifyPackagePayload(corrupted);
    expect(report.isValid).toBe(false);
    expect(report.checksumsValid).toBe(false);
    expect(report.errors.some((e) => e.includes('Checksum mismatch for trips.json'))).toBe(true);
  });

  it('flags warnings when cross-entity foreign key references are missing', async () => {
    const pkg = await ArchiveExportService.createExportPackage();
    const payloadWithOrphan = {
      ...pkg,
      entities: {
        ...pkg.entities,
        days: [
          ...pkg.entities.days,
          {
            id: 'orphan-day-id',
            trip_id: 'non-existent-trip-id',
            day_number: 99,
            date: '2026-09-11',
            title: 'Orphan Day',
            description: null,
            journal: null,
            cover_media_id: null,
            created_at: '2026-09-11T00:00:00Z',
            updated_at: '2026-09-11T00:00:00Z',
          },
        ],
      },
    };

    // Recalculate checksums so checksum validation passes
    const crypto = await import('crypto');
    payloadWithOrphan.checksums['days.json'] = crypto
      .createHash('sha256')
      .update(JSON.stringify(payloadWithOrphan.entities.days, null, 2))
      .digest('hex');

    const report = await ArchiveVerificationService.verifyPackagePayload(payloadWithOrphan);
    expect(report.warnings.some((w) => w.includes('references trip_id'))).toBe(true);
  });

  it('restores new entities accurately in NEW_ONLY mode', async () => {
    const pkg = await ArchiveExportService.createExportPackage();
    const newPlace = {
      id: 'place-restore-test-1',
      name: 'Restored Peak',
      slug: 'restored-peak',
      country: 'India',
      state: 'Ladakh',
      city: 'Leh',
      latitude: 34.15,
      longitude: 77.57,
      description: 'Test place for restoration',
      cover_media_id: null,
      created_at: '2026-09-11T00:00:00Z',
      updated_at: '2026-09-11T00:00:00Z',
    };

    pkg.entities.places.push(newPlace);

    const crypto = await import('crypto');
    pkg.checksums['places.json'] = crypto
      .createHash('sha256')
      .update(JSON.stringify(pkg.entities.places, null, 2))
      .digest('hex');

    const res = await ArchiveRestoreService.restoreArchivePackage(pkg, 'NEW_ONLY');
    expect(res.success).toBe(true);
    expect(res.restoredCounts.places).toBeGreaterThan(0);

    const fetched = await PlaceRepository.getPlaceById('place-restore-test-1');
    expect(fetched).toBeDefined();
    expect(fetched?.name).toBe('Restored Peak');
  });

  it('aborts restore execution when pre-validation gate fails', async () => {
    const invalidPayload = { invalid: true };
    const res = await ArchiveRestoreService.restoreArchivePackage(invalidPayload, 'NEW_ONLY');

    expect(res.success).toBe(false);
    expect(res.errors.some((e) => e.includes('Pre-validation gate failed'))).toBe(true);
  });

  it('server actions enforce Studio authentication', async () => {
    process.env.TEST_AUTH_OVERRIDE = 'unauthorized';
    vi.stubEnv('NODE_ENV', 'production');

    const exportRes = await generateArchiveExportAction();
    expect(exportRes.success).toBe(false);
    expect(exportRes.error).toBe('Unauthorized: Studio session required');

    const verifyRes = await verifyArchivePayloadAction({});
    expect(verifyRes.success).toBe(false);
    expect(verifyRes.error).toBe('Unauthorized: Studio session required');

    const restoreRes = await restoreArchivePayloadAction({});
    expect(restoreRes.success).toBe(false);
    expect(restoreRes.error).toBe('Unauthorized: Studio session required');
  });
});
