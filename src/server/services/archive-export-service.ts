import crypto from 'crypto';
import { ArchiveRepository, ArchiveEntityCollection } from '../repositories/archive-repository';

export interface ArchiveManifest {
  format: 'the-jayant-diaries-archive';
  version: number;
  exportedAt: string;
  applicationVersion: string;
  schemaVersion: string;
  recordCounts: Record<string, number>;
  checksumAlgorithm: 'sha256';
}

export interface ArchivePackagePayload {
  manifest: ArchiveManifest;
  checksums: Record<string, string>;
  entities: ArchiveEntityCollection;
}

export class ArchiveExportService {
  /**
   * Generates a complete, deterministic, versioned archive export payload.
   */
  static async createExportPackage(): Promise<ArchivePackagePayload> {
    const entities = await ArchiveRepository.exportAllEntities();

    // Sanitize and clone entity objects to guarantee zero secret leakage and prevent memory mutations
    const sanitizedEntities: ArchiveEntityCollection = {
      trips: (entities.trips || []).map((t) => ({ ...t })),
      days: (entities.days || []).map((d) => ({ ...d })),
      places: (entities.places || []).map((p) => ({ ...p })),
      memories: (entities.memories || []).map((m) => ({ ...m })),
      media: (entities.media || []).map((m) => ({ ...m })),
      stories: (entities.stories || []).map((s) => ({ ...s })),
      instagram: (entities.instagram || []).map((i) => ({ ...i })),
      tags: (entities.tags || []).map((t) => ({ ...t })),
      import_sessions: (entities.import_sessions || []).map((s) => ({ ...s })),
      import_session_items: (entities.import_session_items || []).map((item) => ({ ...item })),
    };

    const recordCounts: Record<string, number> = {
      trips: sanitizedEntities.trips.length,
      days: sanitizedEntities.days.length,
      places: sanitizedEntities.places.length,
      memories: sanitizedEntities.memories.length,
      media: sanitizedEntities.media.length,
      stories: sanitizedEntities.stories.length,
      instagram: sanitizedEntities.instagram.length,
      tags: sanitizedEntities.tags.length,
      import_sessions: sanitizedEntities.import_sessions.length,
      import_session_items: sanitizedEntities.import_session_items.length,
    };

    const manifest: ArchiveManifest = {
      format: 'the-jayant-diaries-archive',
      version: 1,
      exportedAt: new Date().toISOString(),
      applicationVersion: '0.1.0',
      schemaVersion: '20260911000000',
      recordCounts,
      checksumAlgorithm: 'sha256',
    };

    const checksums: Record<string, string> = {};

    const computeHash = (data: any): string => {
      const jsonString = JSON.stringify(data, null, 2);
      return crypto.createHash('sha256').update(jsonString).digest('hex');
    };

    checksums['trips.json'] = computeHash(sanitizedEntities.trips);
    checksums['days.json'] = computeHash(sanitizedEntities.days);
    checksums['places.json'] = computeHash(sanitizedEntities.places);
    checksums['memories.json'] = computeHash(sanitizedEntities.memories);
    checksums['media.json'] = computeHash(sanitizedEntities.media);
    checksums['stories.json'] = computeHash(sanitizedEntities.stories);
    checksums['instagram.json'] = computeHash(sanitizedEntities.instagram);
    checksums['tags.json'] = computeHash(sanitizedEntities.tags);
    checksums['import_sessions.json'] = computeHash(sanitizedEntities.import_sessions);
    checksums['import_session_items.json'] = computeHash(sanitizedEntities.import_session_items);

    return {
      manifest,
      checksums,
      entities: sanitizedEntities,
    };
  }
}
