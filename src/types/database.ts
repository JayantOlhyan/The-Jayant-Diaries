export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type VisibilityType = 'PUBLIC' | 'UNLISTED' | 'PRIVATE';
export type TripStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type MediaType = 'PHOTO' | 'VIDEO' | 'REEL' | 'STORY' | 'AUDIO' | 'DOCUMENT';
export type InstagramType = 'POST' | 'REEL' | 'CAROUSEL';
export type CurationStatus = 'IMPORTED' | 'REVIEW_REQUIRED' | 'CURATED' | 'ARCHIVED';
export type ImportSessionStatus =
  | 'CREATED'
  | 'PROCESSING'
  | 'REVIEW_REQUIRED'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';
export type ImportSessionItemStatus =
  | 'QUEUED'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'DUPLICATE'
  | 'FAILED';

export interface Database {
  public: {
    Tables: {
      places: {
        Row: {
          id: string;
          name: string;
          slug: string;
          country: string;
          state: string | null;
          city: string | null;
          latitude: number | null;
          longitude: number | null;
          description: string | null;
          cover_media_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          country?: string;
          state?: string | null;
          city?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          description?: string | null;
          cover_media_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          country?: string;
          state?: string | null;
          city?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          description?: string | null;
          cover_media_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      trips: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string | null;
          cover_media_id: string | null;
          start_date: string | null;
          end_date: string | null;
          status: TripStatus;
          featured: boolean;
          visibility: VisibilityType;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description?: string | null;
          cover_media_id?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          status?: TripStatus;
          featured?: boolean;
          visibility?: VisibilityType;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          description?: string | null;
          cover_media_id?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          status?: TripStatus;
          featured?: boolean;
          visibility?: VisibilityType;
          created_at?: string;
          updated_at?: string;
        };
      };
      days: {
        Row: {
          id: string;
          trip_id: string;
          day_number: number;
          date: string | null;
          title: string | null;
          description: string | null;
          journal: string | null;
          cover_media_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          day_number: number;
          date?: string | null;
          title?: string | null;
          description?: string | null;
          journal?: string | null;
          cover_media_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          day_number?: number;
          date?: string | null;
          title?: string | null;
          description?: string | null;
          journal?: string | null;
          cover_media_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      memories: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          journal: string | null;
          date: string | null;
          trip_id: string | null;
          day_id: string | null;
          place_id: string | null;
          featured: boolean;
          visibility: VisibilityType;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          journal?: string | null;
          date?: string | null;
          trip_id?: string | null;
          day_id?: string | null;
          place_id?: string | null;
          featured?: boolean;
          visibility?: VisibilityType;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          journal?: string | null;
          date?: string | null;
          trip_id?: string | null;
          day_id?: string | null;
          place_id?: string | null;
          featured?: boolean;
          visibility?: VisibilityType;
          created_at?: string;
          updated_at?: string;
        };
      };
      media: {
        Row: {
          id: string;
          filename: string;
          storage_path: string;
          storage_url: string;
          thumbnail_url: string | null;
          type: MediaType;
          mime_type: string;
          width: number | null;
          height: number | null;
          duration: number | null;
          file_size_bytes: number | null;
          content_hash: string | null;
          taken_at: string | null;
          latitude: number | null;
          longitude: number | null;
          trip_id: string | null;
          day_id: string | null;
          place_id: string | null;
          memory_id: string | null;
          caption: string | null;
          alt_text: string | null;
          position: number;
          visibility: VisibilityType;
          curation_status: CurationStatus;
          import_session_id?: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          filename: string;
          storage_path: string;
          storage_url: string;
          thumbnail_url?: string | null;
          type?: MediaType;
          mime_type: string;
          width?: number | null;
          height?: number | null;
          duration?: number | null;
          file_size_bytes?: number | null;
          content_hash?: string | null;
          taken_at?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          trip_id?: string | null;
          day_id?: string | null;
          place_id?: string | null;
          memory_id?: string | null;
          caption?: string | null;
          alt_text?: string | null;
          position?: number;
          visibility?: VisibilityType;
          curation_status?: CurationStatus;
          import_session_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          filename?: string;
          storage_path?: string;
          storage_url?: string;
          thumbnail_url?: string | null;
          type?: MediaType;
          mime_type?: string;
          width?: number | null;
          height?: number | null;
          duration?: number | null;
          file_size_bytes?: number | null;
          content_hash?: string | null;
          taken_at?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          trip_id?: string | null;
          day_id?: string | null;
          place_id?: string | null;
          memory_id?: string | null;
          caption?: string | null;
          alt_text?: string | null;
          position?: number;
          visibility?: VisibilityType;
          curation_status?: CurationStatus;
          import_session_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      instagram_content: {
        Row: {
          id: string;
          instagram_url: string;
          shortcode: string;
          type: InstagramType;
          caption: string | null;
          published_at: string | null;
          thumbnail_url: string | null;
          trip_id: string | null;
          day_id: string | null;
          place_id: string | null;
          featured: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          instagram_url: string;
          shortcode: string;
          type?: InstagramType;
          caption?: string | null;
          published_at?: string | null;
          thumbnail_url?: string | null;
          trip_id?: string | null;
          day_id?: string | null;
          place_id?: string | null;
          featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          instagram_url?: string;
          shortcode?: string;
          type?: InstagramType;
          caption?: string | null;
          published_at?: string | null;
          thumbnail_url?: string | null;
          trip_id?: string | null;
          day_id?: string | null;
          place_id?: string | null;
          featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      tags: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
        };
      };
      stories: {
        Row: {
          id: string;
          title: string;
          slug: string;
          subtitle: string | null;
          content: string;
          cover_media_id: string | null;
          featured: boolean;
          visibility: VisibilityType;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          subtitle?: string | null;
          content: string;
          cover_media_id?: string | null;
          featured?: boolean;
          visibility?: VisibilityType;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          subtitle?: string | null;
          content?: string;
          cover_media_id?: string | null;
          featured?: boolean;
          visibility?: VisibilityType;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      import_sessions: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          created_by: string;
          name: string | null;
          trip_id: string | null;
          day_id: string | null;
          status: ImportSessionStatus;
          total_files: number;
          processed_files: number;
          successful_files: number;
          duplicate_files: number;
          failed_files: number;
          notes: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          created_by?: string;
          name?: string | null;
          trip_id?: string | null;
          day_id?: string | null;
          status?: ImportSessionStatus;
          total_files?: number;
          processed_files?: number;
          successful_files?: number;
          duplicate_files?: number;
          failed_files?: number;
          notes?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          created_by?: string;
          name?: string | null;
          trip_id?: string | null;
          day_id?: string | null;
          status?: ImportSessionStatus;
          total_files?: number;
          processed_files?: number;
          successful_files?: number;
          duplicate_files?: number;
          failed_files?: number;
          notes?: string | null;
        };
      };
      import_session_items: {
        Row: {
          id: string;
          session_id: string;
          filename: string;
          file_size_bytes: number | null;
          mime_type: string | null;
          content_hash: string | null;
          status: ImportSessionItemStatus;
          error_message: string | null;
          media_id: string | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          filename: string;
          file_size_bytes?: number | null;
          mime_type?: string | null;
          content_hash?: string | null;
          status?: ImportSessionItemStatus;
          error_message?: string | null;
          media_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          filename?: string;
          file_size_bytes?: number | null;
          mime_type?: string | null;
          content_hash?: string | null;
          status?: ImportSessionItemStatus;
          error_message?: string | null;
          media_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
