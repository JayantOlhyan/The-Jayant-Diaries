import { supabase, isSupabaseConfigured } from '@/lib/db/client';
import { Database, ImportSessionStatus, ImportSessionItemStatus } from '@/types/database';
import { ImportSessionRow, ImportSessionItemRow, ImportSessionWithDetails } from '@/types/entities';
import { TripRepository } from './trip-repository';
import { DayRepository } from './day-repository';

export type ImportSessionInsert = Database['public']['Tables']['import_sessions']['Insert'];
export type ImportSessionUpdate = Database['public']['Tables']['import_sessions']['Update'];
export type ImportSessionItemInsert = Database['public']['Tables']['import_session_items']['Insert'];
export type ImportSessionItemUpdate = Database['public']['Tables']['import_session_items']['Update'];

let inMemorySessions: ImportSessionRow[] = [];
let inMemorySessionItems: ImportSessionItemRow[] = [];

export class ImportSessionRepository {
  /**
   * Reset in-memory store (useful for test isolation).
   */
  static _resetInMemorySessions(): void {
    inMemorySessions = [];
    inMemorySessionItems = [];
  }

  /**
   * Access in-memory sessions (useful for tests).
   */
  static _getInMemorySessions(): ImportSessionRow[] {
    return inMemorySessions;
  }

  /**
   * Access in-memory session items (useful for tests).
   */
  static _getInMemorySessionItems(): ImportSessionItemRow[] {
    return inMemorySessionItems;
  }

  /**
   * Creates a new import session.
   */
  static async createSession(data: ImportSessionInsert): Promise<ImportSessionRow> {
    const id = data.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const record: ImportSessionRow = {
      id,
      created_at: data.created_at || now,
      updated_at: data.updated_at || now,
      created_by: data.created_by || 'studio-admin',
      name: data.name || null,
      trip_id: data.trip_id || null,
      day_id: data.day_id || null,
      status: (data.status as ImportSessionStatus) || 'CREATED',
      total_files: data.total_files ?? 0,
      processed_files: data.processed_files ?? 0,
      successful_files: data.successful_files ?? 0,
      duplicate_files: data.duplicate_files ?? 0,
      failed_files: data.failed_files ?? 0,
      notes: data.notes || null,
    };

    if (!isSupabaseConfigured) {
      inMemorySessions.unshift(record);
      return record;
    }

    try {
      const { data: created, error } = await (supabase
        .from('import_sessions') as any)
        .insert(record)
        .select()
        .single();

      if (error || !created) {
        // Fallback to in-memory on error
        inMemorySessions.unshift(record);
        return record;
      }
      return created as ImportSessionRow;
    } catch {
      inMemorySessions.unshift(record);
      return record;
    }
  }

  /**
   * Retrieves an import session by ID along with its items and associated trip/day.
   */
  static async getSessionById(id: string): Promise<ImportSessionWithDetails | null> {
    let session: ImportSessionRow | null = null;
    let items: ImportSessionItemRow[] = [];

    if (!isSupabaseConfigured) {
      session = inMemorySessions.find((s) => s.id === id) || null;
      if (session) {
        items = inMemorySessionItems.filter((i) => i.session_id === id);
      }
    } else {
      try {
        const { data, error } = await supabase
          .from('import_sessions')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
          session = data as ImportSessionRow;
          const { data: itemRows } = await supabase
            .from('import_session_items')
            .select('*')
            .eq('session_id', id)
            .order('created_at', { ascending: true });
          items = (itemRows as ImportSessionItemRow[]) || [];
        } else {
          session = inMemorySessions.find((s) => s.id === id) || null;
          if (session) {
            items = inMemorySessionItems.filter((i) => i.session_id === id);
          }
        }
      } catch {
        session = inMemorySessions.find((s) => s.id === id) || null;
        if (session) {
          items = inMemorySessionItems.filter((i) => i.session_id === id);
        }
      }
    }

    if (!session) return null;

    const [trip, day] = await Promise.all([
      session.trip_id ? TripRepository.getTripById(session.trip_id) : Promise.resolve(null),
      session.day_id ? DayRepository.getDayById(session.day_id) : Promise.resolve(null),
    ]);

    return {
      ...session,
      trip,
      day,
      items,
    };
  }

  /**
   * Retrieves all import sessions, ordered newest first.
   */
  static async getAllSessions(limit = 50, offset = 0): Promise<ImportSessionWithDetails[]> {
    let sessions: ImportSessionRow[] = [];

    if (!isSupabaseConfigured) {
      sessions = inMemorySessions.slice(offset, offset + limit);
    } else {
      try {
        const { data, error } = await supabase
          .from('import_sessions')
          .select('*')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (!error && data) {
          sessions = data as ImportSessionRow[];
        } else {
          sessions = inMemorySessions.slice(offset, offset + limit);
        }
      } catch {
        sessions = inMemorySessions.slice(offset, offset + limit);
      }
    }

    // Attach trip details where available
    const trips = await TripRepository.getAllStudioTrips();
    const tripMap = new Map(trips.map((t) => [t.id, t]));

    return sessions.map((s) => ({
      ...s,
      trip: s.trip_id ? tripMap.get(s.trip_id) || null : null,
    }));
  }

  /**
   * Updates an existing import session.
   */
  static async updateSession(id: string, update: ImportSessionUpdate): Promise<ImportSessionRow> {
    const now = new Date().toISOString();
    const updateData = { ...update, updated_at: now };

    if (!isSupabaseConfigured) {
      const idx = inMemorySessions.findIndex((s) => s.id === id);
      if (idx !== -1) {
        inMemorySessions[idx] = { ...inMemorySessions[idx], ...updateData } as ImportSessionRow;
        return inMemorySessions[idx];
      }
      throw new Error(`Import session ${id} not found`);
    }

    try {
      const { data, error } = await (supabase
        .from('import_sessions') as any)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error || !data) {
        const idx = inMemorySessions.findIndex((s) => s.id === id);
        if (idx !== -1) {
          inMemorySessions[idx] = { ...inMemorySessions[idx], ...updateData } as ImportSessionRow;
          return inMemorySessions[idx];
        }
        throw new Error(error?.message || `Failed to update session ${id}`);
      }
      return data as ImportSessionRow;
    } catch (err: any) {
      const idx = inMemorySessions.findIndex((s) => s.id === id);
      if (idx !== -1) {
        inMemorySessions[idx] = { ...inMemorySessions[idx], ...updateData } as ImportSessionRow;
        return inMemorySessions[idx];
      }
      throw err;
    }
  }

  /**
   * Adds an item to an import session.
   */
  static async addSessionItem(data: ImportSessionItemInsert): Promise<ImportSessionItemRow> {
    const id = data.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const record: ImportSessionItemRow = {
      id,
      session_id: data.session_id,
      filename: data.filename,
      file_size_bytes: data.file_size_bytes ?? null,
      mime_type: data.mime_type ?? null,
      content_hash: data.content_hash ?? null,
      status: (data.status as ImportSessionItemStatus) || 'QUEUED',
      error_message: data.error_message || null,
      media_id: data.media_id || null,
      metadata: data.metadata || null,
      created_at: data.created_at || now,
      updated_at: data.updated_at || now,
    };

    if (!isSupabaseConfigured) {
      inMemorySessionItems.push(record);
      return record;
    }

    try {
      const { data: created, error } = await (supabase
        .from('import_session_items') as any)
        .insert(record)
        .select()
        .single();

      if (error || !created) {
        inMemorySessionItems.push(record);
        return record;
      }
      return created as ImportSessionItemRow;
    } catch {
      inMemorySessionItems.push(record);
      return record;
    }
  }

  /**
   * Updates an import session item (e.g. status transition or error reason).
   */
  static async updateSessionItem(
    id: string,
    update: ImportSessionItemUpdate
  ): Promise<ImportSessionItemRow> {
    const now = new Date().toISOString();
    const updateData = { ...update, updated_at: now };

    if (!isSupabaseConfigured) {
      const idx = inMemorySessionItems.findIndex((i) => i.id === id);
      if (idx !== -1) {
        inMemorySessionItems[idx] = { ...inMemorySessionItems[idx], ...updateData } as ImportSessionItemRow;
        return inMemorySessionItems[idx];
      }
      throw new Error(`Import session item ${id} not found`);
    }

    try {
      const { data, error } = await (supabase
        .from('import_session_items') as any)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error || !data) {
        const idx = inMemorySessionItems.findIndex((i) => i.id === id);
        if (idx !== -1) {
          inMemorySessionItems[idx] = { ...inMemorySessionItems[idx], ...updateData } as ImportSessionItemRow;
          return inMemorySessionItems[idx];
        }
        throw new Error(error?.message || `Failed to update session item ${id}`);
      }
      return data as ImportSessionItemRow;
    } catch (err: any) {
      const idx = inMemorySessionItems.findIndex((i) => i.id === id);
      if (idx !== -1) {
        inMemorySessionItems[idx] = { ...inMemorySessionItems[idx], ...updateData } as ImportSessionItemRow;
        return inMemorySessionItems[idx];
      }
      throw err;
    }
  }

  /**
   * Retrieves all items for a given session.
   */
  static async getSessionItems(
    sessionId: string,
    statusFilter?: string
  ): Promise<ImportSessionItemRow[]> {
    if (!isSupabaseConfigured) {
      let items = inMemorySessionItems.filter((i) => i.session_id === sessionId);
      if (statusFilter && statusFilter !== 'ALL') {
        items = items.filter((i) => i.status === statusFilter);
      }
      return items;
    }

    try {
      let query = supabase
        .from('import_session_items')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (statusFilter && statusFilter !== 'ALL') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (!error && data) {
        return data as ImportSessionItemRow[];
      }
      let items = inMemorySessionItems.filter((i) => i.session_id === sessionId);
      if (statusFilter && statusFilter !== 'ALL') {
        items = items.filter((i) => i.status === statusFilter);
      }
      return items;
    } catch {
      let items = inMemorySessionItems.filter((i) => i.session_id === sessionId);
      if (statusFilter && statusFilter !== 'ALL') {
        items = items.filter((i) => i.status === statusFilter);
      }
      return items;
    }
  }

  /**
   * Retrieves all failed items for a session.
   */
  static async getFailedSessionItems(sessionId: string): Promise<ImportSessionItemRow[]> {
    return this.getSessionItems(sessionId, 'FAILED');
  }

  /**
   * Increments session counters.
   */
  static async incrementSessionCounts(
    sessionId: string,
    deltas: {
      processed?: number;
      successful?: number;
      duplicate?: number;
      failed?: number;
    }
  ): Promise<ImportSessionRow> {
    const session = await this.getSessionById(sessionId);
    if (!session) {
      throw new Error(`Import session ${sessionId} not found`);
    }

    const processed_files = (session.processed_files || 0) + (deltas.processed || 0);
    const successful_files = (session.successful_files || 0) + (deltas.successful || 0);
    const duplicate_files = (session.duplicate_files || 0) + (deltas.duplicate || 0);
    const failed_files = (session.failed_files || 0) + (deltas.failed || 0);

    let status: ImportSessionStatus = session.status;
    if (processed_files >= session.total_files && session.total_files > 0) {
      status = failed_files > 0 ? 'REVIEW_REQUIRED' : 'COMPLETED';
    } else if (processed_files > 0) {
      status = 'PROCESSING';
    }

    return this.updateSession(sessionId, {
      processed_files,
      successful_files,
      duplicate_files,
      failed_files,
      status,
    });
  }
}
