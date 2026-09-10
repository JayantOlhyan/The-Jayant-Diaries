import crypto from 'crypto';
import { ArchivePackagePayload } from './archive-export-service';
import { ArchiveRepository } from '../repositories/archive-repository';

export interface ArchiveVerificationReport {
  isValid: boolean;
  formatValid: boolean;
  versionSupported: boolean;
  checksumsValid: boolean;
  relationshipsValid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    totalEntitiesInArchive: number;
    newRecordsCount: number;
    existingRecordsCount: number;
    conflictRecordsCount: number;
    duplicateContentHashesCount: number;
    brokenReferencesCount: number;
  };
  recordCounts: Record<string, number>;
}

export class ArchiveVerificationService {
  /**
   * Evaluates an archive payload without mutating any database state.
   */
  static async verifyPackagePayload(payload: any): Promise<ArchiveVerificationReport> {
    const errors: string[] = [];
    const warnings: string[] = [];

    let formatValid = false;
    let versionSupported = false;
    let checksumsValid = false;
    let relationshipsValid = true;

    // 1. Format & Manifest Check
    if (!payload || typeof payload !== 'object') {
      return {
        isValid: false,
        formatValid: false,
        versionSupported: false,
        checksumsValid: false,
        relationshipsValid: false,
        errors: ['Invalid archive payload: Expected object payload.'],
        warnings: [],
        summary: {
          totalEntitiesInArchive: 0,
          newRecordsCount: 0,
          existingRecordsCount: 0,
          conflictRecordsCount: 0,
          duplicateContentHashesCount: 0,
          brokenReferencesCount: 0,
        },
        recordCounts: {},
      };
    }

    const { manifest, checksums, entities } = payload as ArchivePackagePayload;

    if (manifest && manifest.format === 'the-jayant-diaries-archive') {
      formatValid = true;
    } else {
      errors.push('Manifest format mismatch: Expected "the-jayant-diaries-archive".');
    }

    if (manifest && manifest.version === 1) {
      versionSupported = true;
    } else {
      errors.push(`Unsupported archive version: ${manifest?.version ?? 'Unknown'}.`);
    }

    if (!entities || typeof entities !== 'object') {
      errors.push('Archive payload missing valid entities collection.');
    }

    // 2. Checksum Verification
    if (checksums && typeof checksums === 'object' && entities) {
      const computeHash = (data: any): string => {
        const jsonString = JSON.stringify(data || [], null, 2);
        return crypto.createHash('sha256').update(jsonString).digest('hex');
      };

      const fileMap: Record<string, any> = {
        'trips.json': entities.trips,
        'days.json': entities.days,
        'places.json': entities.places,
        'memories.json': entities.memories,
        'media.json': entities.media,
        'stories.json': entities.stories,
        'instagram.json': entities.instagram,
        'tags.json': entities.tags,
        'import_sessions.json': entities.import_sessions,
        'import_session_items.json': entities.import_session_items,
      };

      let allMatch = true;
      for (const [filename, content] of Object.entries(fileMap)) {
        if (checksums[filename]) {
          const expected = checksums[filename];
          const actual = computeHash(content);
          if (expected !== actual) {
            allMatch = false;
            errors.push(`Checksum mismatch for ${filename}: Expected ${expected}, got ${actual}.`);
          }
        }
      }
      checksumsValid = allMatch;
    } else {
      errors.push('Archive missing valid checksums dictionary.');
    }

    // 3. Foreign Key & Relationship Validation
    const tripIds = new Set<string>((entities?.trips || []).map((t) => t.id));
    const dayIds = new Set<string>((entities?.days || []).map((d) => d.id));
    const placeIds = new Set<string>((entities?.places || []).map((p) => p.id));
    const memoryIds = new Set<string>((entities?.memories || []).map((m) => m.id));

    let brokenReferencesCount = 0;

    for (const d of entities?.days || []) {
      if (d.trip_id && !tripIds.has(d.trip_id)) {
        warnings.push(`Day "${d.id}" references trip_id "${d.trip_id}" not present in archive.`);
        brokenReferencesCount++;
      }
    }

    for (const m of entities?.memories || []) {
      if (m.trip_id && !tripIds.has(m.trip_id)) {
        warnings.push(`Memory "${m.id}" references trip_id "${m.trip_id}" not present in archive.`);
        brokenReferencesCount++;
      }
      if (m.day_id && !dayIds.has(m.day_id)) {
        warnings.push(`Memory "${m.id}" references day_id "${m.day_id}" not present in archive.`);
        brokenReferencesCount++;
      }
      if (m.place_id && !placeIds.has(m.place_id)) {
        warnings.push(`Memory "${m.id}" references place_id "${m.place_id}" not present in archive.`);
        brokenReferencesCount++;
      }
    }

    for (const med of entities?.media || []) {
      if (med.trip_id && !tripIds.has(med.trip_id)) {
        brokenReferencesCount++;
      }
      if (med.day_id && !dayIds.has(med.day_id)) {
        brokenReferencesCount++;
      }
      if (med.place_id && !placeIds.has(med.place_id)) {
        brokenReferencesCount++;
      }
      if (med.memory_id && !memoryIds.has(med.memory_id)) {
        brokenReferencesCount++;
      }
    }

    if (brokenReferencesCount > 0) {
      warnings.push(`Found ${brokenReferencesCount} broken cross-entity references in archive.`);
    }

    // 4. Conflict Analysis Against Existing State
    const existing = await ArchiveRepository.exportAllEntities();
    const existingTripIds = new Set(existing.trips.map((t) => t.id));
    const existingPlaceIds = new Set(existing.places.map((p) => p.id));
    const existingMediaHashes = new Set(
      existing.media.map((m) => m.content_hash).filter((h): h is string => Boolean(h))
    );

    let newRecordsCount = 0;
    let existingRecordsCount = 0;
    let conflictRecordsCount = 0;
    let duplicateContentHashesCount = 0;

    for (const t of entities?.trips || []) {
      if (existingTripIds.has(t.id)) {
        existingRecordsCount++;
      } else {
        newRecordsCount++;
      }
    }

    for (const p of entities?.places || []) {
      if (existingPlaceIds.has(p.id)) {
        existingRecordsCount++;
      } else {
        newRecordsCount++;
      }
    }

    for (const med of entities?.media || []) {
      if (med.content_hash && existingMediaHashes.has(med.content_hash)) {
        duplicateContentHashesCount++;
      }
    }

    const totalEntitiesInArchive =
      (entities?.trips?.length || 0) +
      (entities?.days?.length || 0) +
      (entities?.places?.length || 0) +
      (entities?.memories?.length || 0) +
      (entities?.media?.length || 0) +
      (entities?.stories?.length || 0) +
      (entities?.instagram?.length || 0) +
      (entities?.tags?.length || 0) +
      (entities?.import_sessions?.length || 0) +
      (entities?.import_session_items?.length || 0);

    const isValid = formatValid && versionSupported && checksumsValid && errors.length === 0;

    return {
      isValid,
      formatValid,
      versionSupported,
      checksumsValid,
      relationshipsValid,
      errors,
      warnings,
      summary: {
        totalEntitiesInArchive,
        newRecordsCount,
        existingRecordsCount,
        conflictRecordsCount,
        duplicateContentHashesCount,
        brokenReferencesCount,
      },
      recordCounts: manifest?.recordCounts || {},
    };
  }
}
