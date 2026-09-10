import { isSupabaseConfigured, createAdminClient } from '@/lib/db/client';
import { getStoragePath, getPublicMediaUrl } from '@/lib/storage/paths';

export interface UploadMediaOptions {
  mediaId: string;
  fileBuffer: Buffer | Uint8Array;
  mimeType: string;
  extension?: string;
  bucket?: string;
}

export interface UploadMediaResult {
  storagePath: string;
  storageUrl: string;
}

export interface DeleteStorageOptions {
  storagePath: string;
  bucket?: string;
}

export interface DeleteStorageResult {
  success: boolean;
  error?: string;
}

export class StorageConfigurationError extends Error {
  constructor(
    message = 'Supabase Storage is not configured. Persistent binary upload requires valid Supabase environment variables.'
  ) {
    super(message);
    this.name = 'StorageConfigurationError';
  }
}

// In-memory storage simulator for isolated unit tests
interface InMemoryStoredObject {
  bucket: string;
  buffer: Buffer | Uint8Array;
  mimeType: string;
  createdAt: string;
}

let inMemoryStorage = new Map<string, InMemoryStoredObject>();
let simulateUploadFailure = false;
let simulateCleanupFailure = false;

export class StorageService {
  /**
   * Resets in-memory storage and simulation flags (for test isolation).
   */
  static _resetInMemoryStorage(): void {
    inMemoryStorage.clear();
    simulateUploadFailure = false;
    simulateCleanupFailure = false;
  }

  /**
   * Test hook to simulate storage upload failure.
   */
  static _setSimulateUploadFailure(simulate: boolean): void {
    simulateUploadFailure = simulate;
  }

  /**
   * Test hook to simulate storage cleanup (deletion) failure.
   */
  static _setSimulateCleanupFailure(simulate: boolean): void {
    simulateCleanupFailure = simulate;
  }

  /**
   * Checks if an object exists in in-memory storage (for test assertion).
   */
  static _hasStoredObject(storagePath: string): boolean {
    return inMemoryStorage.has(storagePath);
  }

  /**
   * Gets an object from in-memory storage (for test assertion).
   */
  static _getStoredObject(storagePath: string): InMemoryStoredObject | undefined {
    return inMemoryStorage.get(storagePath);
  }

  /**
   * Persists a binary media file to canonical Supabase Storage or test store.
   * Uses deterministic storage paths: media/{mediaId}/original.{ext}
   */
  static async upload({
    mediaId,
    fileBuffer,
    mimeType,
    extension = 'jpg',
    bucket = 'media-private',
  }: UploadMediaOptions): Promise<UploadMediaResult> {
    if (simulateUploadFailure) {
      throw new Error('Simulated storage upload network failure');
    }

    const cleanExt = extension.replace(/^\./, '');
    const storagePath = getStoragePath({
      mediaId,
      variant: 'original',
      extension: cleanExt,
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';

    // Unit test environment fallback
    if (!isSupabaseConfigured) {
      if (process.env.NODE_ENV === 'test') {
        inMemoryStorage.set(storagePath, {
          bucket,
          buffer: fileBuffer,
          mimeType,
          createdAt: new Date().toISOString(),
        });
        const storageUrl = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/authenticated/${bucket}/${storagePath}`;
        return { storagePath, storageUrl };
      }
      throw new StorageConfigurationError(
        'Supabase Storage is not configured. Persistent binary upload requires valid Supabase environment variables.'
      );
    }

    try {
      const adminClient = createAdminClient();
      const { error: uploadError } = await adminClient.storage
        .from(bucket)
        .upload(storagePath, fileBuffer, {
          contentType: mimeType,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Supabase Storage upload failed: ${uploadError.message}`);
      }

      let storageUrl: string;
      if (bucket === 'media-public') {
        storageUrl = getPublicMediaUrl(supabaseUrl, bucket, storagePath);
      } else {
        storageUrl = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/authenticated/${bucket}/${storagePath}`;
      }

      return { storagePath, storageUrl };
    } catch (error: any) {
      throw new Error(error.message || 'Storage upload failed');
    }
  }

  /**
   * Alias for upload()
   */
  static async uploadMediaFile(options: UploadMediaOptions): Promise<UploadMediaResult> {
    return this.upload(options);
  }

  /**
   * Deletes a storage object. Used for failure safety cleanup when database insertion fails.
   */
  static async remove({
    storagePath,
    bucket = 'media-private',
  }: DeleteStorageOptions): Promise<DeleteStorageResult> {
    if (simulateCleanupFailure) {
      return {
        success: false,
        error: 'Simulated storage cleanup permission failure',
      };
    }

    if (!isSupabaseConfigured) {
      if (process.env.NODE_ENV === 'test') {
        inMemoryStorage.delete(storagePath);
        return { success: true };
      }
      return {
        success: false,
        error: 'Supabase Storage is not configured.',
      };
    }

    try {
      const adminClient = createAdminClient();
      const { error } = await adminClient.storage.from(bucket).remove([storagePath]);
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Storage cleanup failed' };
    }
  }

  /**
   * Alias for remove()
   */
  static async deleteStorageObject(options: DeleteStorageOptions): Promise<DeleteStorageResult> {
    return this.remove(options);
  }

  /**
   * Generates a signed URL for private bucket access.
   */
  static async createSignedUrl(
    storagePath: string,
    expiresIn = 3600,
    bucket = 'media-private'
  ): Promise<string> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';

    if (!isSupabaseConfigured) {
      if (process.env.NODE_ENV === 'test') {
        return `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/sign/${bucket}/${storagePath}?token=mock-token`;
      }
      throw new StorageConfigurationError('Supabase Storage is not configured.');
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient.storage
      .from(bucket)
      .createSignedUrl(storagePath, expiresIn);

    if (error || !data) {
      throw new Error(`Failed to create signed URL: ${error?.message || 'Unknown error'}`);
    }

    return data.signedUrl;
  }
}
