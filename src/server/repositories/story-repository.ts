import { supabase, isSupabaseConfigured } from '@/lib/db/client';
import { Database, StoryStatus } from '@/types/database';
import {
  StoryRow,
  StoryWithDetails,
  StoryBlock,
  StoryReadinessResult,
  PlaceRow,
} from '@/types/entities';
import { MediaRepository } from './media-repository';
import { PlaceRepository } from './place-repository';
import { MemoryRepository } from './memory-repository';
import { TripRepository } from './trip-repository';

export type StoryInsert = Database['public']['Tables']['stories']['Insert'];
export type StoryUpdate = Database['public']['Tables']['stories']['Update'];

let inMemoryStories: StoryRow[] = [
  {
    id: 'story-pangong-lake-2026',
    title: 'The Road to Pangong',
    slug: 'the-road-to-pangong',
    subtitle: 'A journey across high passes to the turquoise waters of Pangong Tso.',
    content: JSON.stringify([
      {
        id: 'block-1',
        type: 'TEXT',
        order: 0,
        text: 'Crossing Chang La pass at 17,590 feet was both grueling and breathtaking. As the road wound down into the valley, the first glimpse of Pangong Lake appeared like a blue mirror framed by jagged barren mountains.',
      },
      {
        id: 'block-2',
        type: 'MEDIA',
        order: 1,
        media_id: 'm1111111-1111-4111-a111-111111111111',
        caption: 'Pangong Tso reflecting the afternoon sky.',
      },
      {
        id: 'block-3',
        type: 'MEMORY',
        order: 2,
        memory_id: '44444444-4444-4444-a444-444444444444',
      },
    ]),
    trip_id: '11111111-1111-4111-a111-111111111111',
    cover_media_id: 'm1111111-1111-4111-a111-111111111111',
    featured: true,
    visibility: 'PUBLIC',
    status: 'PUBLISHED',
    published_at: '2026-06-15T00:00:00Z',
    created_at: '2026-06-15T00:00:00Z',
    updated_at: '2026-06-15T00:00:00Z',
  },
];

export class StoryRepository {
  static _resetInMemoryStories(): void {
    inMemoryStories = [
      {
        id: 'story-pangong-lake-2026',
        title: 'The Road to Pangong',
        slug: 'the-road-to-pangong',
        subtitle: 'A journey across high passes to the turquoise waters of Pangong Tso.',
        content: JSON.stringify([
          {
            id: 'block-1',
            type: 'TEXT',
            order: 0,
            text: 'Crossing Chang La pass at 17,590 feet was both grueling and breathtaking.',
          },
          {
            id: 'block-2',
            type: 'MEDIA',
            order: 1,
            media_id: 'm1111111-1111-4111-a111-111111111111',
            caption: 'Pangong Tso reflecting the afternoon sky.',
          },
        ]),
        trip_id: '11111111-1111-4111-a111-111111111111',
        cover_media_id: 'm1111111-1111-4111-a111-111111111111',
        featured: true,
        visibility: 'PUBLIC',
        status: 'PUBLISHED',
        published_at: '2026-06-15T00:00:00Z',
        created_at: '2026-06-15T00:00:00Z',
        updated_at: '2026-06-15T00:00:00Z',
      },
    ];
  }

  /**
   * Retrieves all stories for the Studio workspace.
   */
  static async getAllStories(): Promise<StoryRow[]> {
    if (!isSupabaseConfigured) {
      return [...inMemoryStories].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return [...inMemoryStories];
      }
      return data || [];
    } catch {
      return [...inMemoryStories];
    }
  }

  /**
   * Alias for studio stories query.
   */
  static async getStudioStories(): Promise<StoryRow[]> {
    return this.getAllStories();
  }

  /**
   * Retrieves published public stories for the public frontend.
   */
  static async getPublicStories(): Promise<StoryRow[]> {
    if (!isSupabaseConfigured) {
      return inMemoryStories.filter(
        (s) => s.visibility === 'PUBLIC' && s.status === 'PUBLISHED'
      );
    }
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('visibility', 'PUBLIC')
        .eq('status', 'PUBLISHED')
        .order('published_at', { ascending: false });

      if (error) {
        return inMemoryStories.filter(
          (s) => s.visibility === 'PUBLIC' && s.status === 'PUBLISHED'
        );
      }
      return data || [];
    } catch {
      return inMemoryStories.filter(
        (s) => s.visibility === 'PUBLIC' && s.status === 'PUBLISHED'
      );
    }
  }

  /**
   * Retrieves published public stories with populated details.
   */
  static async getPublishedStories(): Promise<StoryWithDetails[]> {
    const rawStories = await this.getPublicStories();
    const populated = await Promise.all(rawStories.map((s) => this._populateStoryDetails(s)));
    return populated;
  }

  /**
   * Retrieves a single story by ID with populated details.
   */
  static async getStoryById(id: string): Promise<StoryWithDetails | null> {
    let row: StoryRow | null = null;

    if (!isSupabaseConfigured) {
      row = inMemoryStories.find((s) => s.id === id) || null;
    } else {
      try {
        const { data, error } = await supabase
          .from('stories')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
          row = data as StoryRow;
        } else {
          row = inMemoryStories.find((s) => s.id === id) || null;
        }
      } catch {
        row = inMemoryStories.find((s) => s.id === id) || null;
      }
    }

    if (!row) return null;
    return this._populateStoryDetails(row);
  }

  /**
   * Retrieves a published public story by slug with populated details.
   */
  static async getPublishedStoryBySlug(slug: string): Promise<StoryWithDetails | null> {
    let row: StoryRow | null = null;

    if (!isSupabaseConfigured) {
      row =
        inMemoryStories.find(
          (s) => s.slug === slug && s.visibility === 'PUBLIC' && s.status === 'PUBLISHED'
        ) || null;
    } else {
      try {
        const { data, error } = await supabase
          .from('stories')
          .select('*')
          .eq('slug', slug)
          .eq('visibility', 'PUBLIC')
          .eq('status', 'PUBLISHED')
          .single();

        if (!error && data) {
          row = data as StoryRow;
        } else {
          row =
            inMemoryStories.find(
              (s) => s.slug === slug && s.visibility === 'PUBLIC' && s.status === 'PUBLISHED'
            ) || null;
        }
      } catch {
        row =
          inMemoryStories.find(
            (s) => s.slug === slug && s.visibility === 'PUBLIC' && s.status === 'PUBLISHED'
          ) || null;
      }
    }

    if (!row) return null;
    return this._populateStoryDetails(row);
  }

  /**
   * Alias for public story query by slug.
   */
  static async getPublicStoryBySlug(slug: string): Promise<StoryWithDetails | null> {
    return this.getPublishedStoryBySlug(slug);
  }

  /**
   * Retrieves published stories linked to a specific trip ID.
   */
  static async getPublishedStoriesByTripId(tripId: string): Promise<StoryWithDetails[]> {
    const allPublished = await this.getPublishedStories();
    return allPublished.filter((s) => s.trip_id === tripId);
  }

  /**
   * Retrieves stories linked to a specific trip.
   */
  static async getStoriesByTripId(tripId: string): Promise<StoryRow[]> {
    if (!isSupabaseConfigured) {
      return inMemoryStories.filter((s) => s.trip_id === tripId);
    }
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });

      if (error) return inMemoryStories.filter((s) => s.trip_id === tripId);
      return data || [];
    } catch {
      return inMemoryStories.filter((s) => s.trip_id === tripId);
    }
  }

  /**
   * Creates a new story draft.
   */
  static async createStory(payload: StoryInsert): Promise<StoryRow> {
    const now = new Date().toISOString();
    const newStory: StoryRow = {
      id: payload.id || crypto.randomUUID(),
      title: payload.title,
      slug: payload.slug,
      subtitle: payload.subtitle || null,
      content: payload.content || '[]',
      trip_id: payload.trip_id || null,
      cover_media_id: payload.cover_media_id || null,
      featured: payload.featured ?? false,
      visibility: payload.visibility || 'PRIVATE',
      status: (payload.status as StoryStatus) || 'DRAFT',
      published_at: payload.published_at || null,
      created_at: payload.created_at || now,
      updated_at: payload.updated_at || now,
    };

    if (!isSupabaseConfigured) {
      inMemoryStories.unshift(newStory);
      return newStory;
    }

    try {
      const { data, error } = await supabase
        .from('stories')
        .insert(newStory as any)
        .select()
        .single();

      if (!error && data) {
        inMemoryStories.unshift(data as StoryRow);
        return data as StoryRow;
      }
    } catch {
      // Fallback to memory
    }

    inMemoryStories.unshift(newStory);
    return newStory;
  }

  /**
   * Updates an existing story.
   */
  static async updateStory(id: string, payload: Partial<StoryRow>): Promise<StoryRow | null> {
    const now = new Date().toISOString();
    const updates = { ...payload, updated_at: now };

    if (!isSupabaseConfigured) {
      const idx = inMemoryStories.findIndex((s) => s.id === id);
      if (idx === -1) return null;
      inMemoryStories[idx] = { ...inMemoryStories[idx], ...updates };
      return inMemoryStories[idx];
    }

    try {
      const { data, error } = await (supabase.from('stories') as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        const idx = inMemoryStories.findIndex((s) => s.id === id);
        if (idx !== -1) inMemoryStories[idx] = data as StoryRow;
        return data as StoryRow;
      }
    } catch {
      // Fallback to memory
    }

    const idx = inMemoryStories.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    inMemoryStories[idx] = { ...inMemoryStories[idx], ...updates };
    return inMemoryStories[idx];
  }

  /**
   * Updates story status (DRAFT, READY, PUBLISHED, ARCHIVED).
   */
  static async updateStoryStatus(id: string, status: StoryStatus): Promise<StoryRow> {
    const now = new Date().toISOString();
    const updates: Partial<StoryRow> = {
      status,
      updated_at: now,
    };
    if (status === 'PUBLISHED') {
      updates.published_at = now;
      updates.visibility = 'PUBLIC';
    }

    const updated = await this.updateStory(id, updates);
    if (!updated) {
      throw new Error(`Failed to update story status: Story ID ${id} not found.`);
    }
    return updated;
  }

  /**
   * Updates story content blocks.
   */
  static async updateStoryContent(id: string, blocks: StoryBlock[]): Promise<StoryWithDetails> {
    const content = JSON.stringify(blocks);
    const updated = await this.updateStory(id, { content });
    if (!updated) {
      throw new Error(`Failed to update story content: Story ID ${id} not found.`);
    }
    const withDetails = await this.getStoryById(id);
    return withDetails!;
  }

  /**
   * Deletes a story by ID.
   */
  static async deleteStory(id: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      const initial = inMemoryStories.length;
      inMemoryStories = inMemoryStories.filter((s) => s.id !== id);
      return inMemoryStories.length < initial;
    }

    try {
      const { error } = await supabase.from('stories').delete().eq('id', id);
      inMemoryStories = inMemoryStories.filter((s) => s.id !== id);
      return !error;
    } catch {
      inMemoryStories = inMemoryStories.filter((s) => s.id !== id);
      return true;
    }
  }

  /**
   * Deterministic readiness checker for story publication.
   */
  static async checkStoryReadiness(id: string): Promise<StoryReadinessResult> {
    const story = await this.getStoryById(id);
    const reasons: string[] = [];

    if (!story) {
      return {
        isReady: false,
        hasTitle: false,
        hasSlug: false,
        hasContent: false,
        hasCover: false,
        isCoverPublic: false,
        areMediaPublic: false,
        arePlacesPublic: false,
        isTripPublishable: false,
        reasons: ['Story not found.'],
      };
    }

    const hasTitle = Boolean(story.title && story.title.trim().length > 0);
    if (!hasTitle) reasons.push('Story title is missing.');

    const hasSlug = Boolean(story.slug && story.slug.trim().length > 0);
    if (!hasSlug) reasons.push('Story slug is missing.');

    const blocks: StoryBlock[] = story.blocks || story.parsedContent || [];
    const hasContent = blocks.length > 0;
    if (!hasContent) reasons.push('Story content blocks are empty.');

    const hasCover = Boolean(story.cover_media_id && (story.coverMedia || story.cover_media));
    if (!hasCover) reasons.push('Missing cover media');

    const coverObj = story.coverMedia || story.cover_media;
    const isCoverPublic = Boolean(coverObj && coverObj.visibility === 'PUBLIC');
    if (hasCover && !isCoverPublic) reasons.push('Story cover media is PRIVATE or UNLISTED.');

    // Check referenced media visibility
    const mediaBlocks = blocks.filter((b) => b.type === 'MEDIA' && b.media_id);
    const referencedMediaIds = mediaBlocks.map((b) => b.media_id!).filter(Boolean);
    const mediaItems = await MediaRepository.getMediaByIds(referencedMediaIds);

    const privateMedia = mediaItems.filter((m) => m.visibility !== 'PUBLIC');
    const areMediaPublic = privateMedia.length === 0;
    if (!areMediaPublic) {
      reasons.push(`Contains ${privateMedia.length} non-public media items.`);
    }

    // Check referenced place visibility
    const placeBlocks = blocks.filter((b) => b.type === 'PLACE' && b.place_id);
    const referencedPlaceIds = placeBlocks.map((b) => b.place_id!).filter(Boolean);
    const placePromises = referencedPlaceIds.map((pid) => PlaceRepository.getPlaceById(pid));
    const placeItems = (await Promise.all(placePromises)).filter((p): p is PlaceRow => Boolean(p));

    const privatePlaces = placeItems.filter((p) => (p as any).visibility === 'PRIVATE');
    const arePlacesPublic = privatePlaces.length === 0;
    if (!arePlacesPublic) {
      reasons.push(`Contains ${privatePlaces.length} private place references.`);
    }

    // Check trip publication status if story is linked to a trip
    let isTripPublishable = true;
    if (story.trip_id) {
      const trip = await TripRepository.getTripById(story.trip_id);
      if (!trip || trip.visibility !== 'PUBLIC' || trip.status !== 'PUBLISHED') {
        isTripPublishable = false;
        reasons.push('Associated trip is not publicly published.');
      }
    }

    const isReady =
      hasTitle &&
      hasSlug &&
      hasContent &&
      hasCover &&
      isCoverPublic &&
      areMediaPublic &&
      arePlacesPublic &&
      isTripPublishable;

    return {
      isReady,
      hasTitle,
      hasSlug,
      hasContent,
      hasCover,
      isCoverPublic,
      areMediaPublic,
      arePlacesPublic,
      isTripPublishable,
      reasons,
    };
  }

  /**
   * Helper method to parse block structures and populate relational details.
   */
  private static async _populateStoryDetails(row: StoryRow): Promise<StoryWithDetails> {
    let blocks: StoryBlock[] = [];
    try {
      if (typeof row.content === 'string') {
        blocks = JSON.parse(row.content);
      }
    } catch {
      blocks = [];
    }

    const coverMediaPromise = row.cover_media_id
      ? MediaRepository.getMediaById(row.cover_media_id)
      : Promise.resolve(null);
    const tripPromise = row.trip_id ? TripRepository.getTripById(row.trip_id) : Promise.resolve(null);

    const [coverMedia, trip] = await Promise.all([coverMediaPromise, tripPromise]);

    // Populate media/memory/place objects inside blocks
    const populatedBlocks = await Promise.all(
      blocks.map(async (block) => {
        if (block.type === 'MEDIA' && block.media_id) {
          const media = await MediaRepository.getMediaById(block.media_id);
          return { ...block, media: media || undefined };
        }
        if (block.type === 'MEMORY' && block.memory_id) {
          const memory = await MemoryRepository.getMemoryById(block.memory_id);
          return { ...block, memory: memory || undefined };
        }
        if (block.type === 'PLACE' && block.place_id) {
          const place = await PlaceRepository.getPlaceById(block.place_id);
          return { ...block, place: place || undefined };
        }
        return block;
      })
    );

    return {
      ...row,
      trip,
      coverMedia,
      cover_media: coverMedia,
      blocks: populatedBlocks,
      parsedContent: populatedBlocks,
    };
  }
}
