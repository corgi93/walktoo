/**
 * Supabase Database Types
 *
 * 이 파일은 `supabase gen types typescript` 명령으로 자동 생성됩니다.
 * 수동으로 수정하지 마세요.
 *
 * 사용법:
 *   npx supabase gen types typescript --project-id <project-id> > server/types/database.types.ts
 *
 * 아래는 walkToo 스키마 기반 placeholder입니다.
 * Supabase 프로젝트 연결 후 자동 생성된 파일로 교체하세요.
 */

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nickname: string;
          phone: string;
          profile_image_url: string | null;
          birthday: string | null;
          couple_id: string | null;
          is_profile_complete: boolean;
          total_walks: number;
          total_steps: number;
          push_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nickname: string;
          phone: string;
          profile_image_url?: string | null;
          birthday?: string | null;
          couple_id?: string | null;
          is_profile_complete?: boolean;
          total_walks?: number;
          total_steps?: number;
          push_token?: string | null;
        };
        Update: {
          nickname?: string;
          phone?: string;
          profile_image_url?: string | null;
          birthday?: string | null;
          couple_id?: string | null;
          is_profile_complete?: boolean;
          total_walks?: number;
          total_steps?: number;
          push_token?: string | null;
        };
        Relationships: [];
      };
      couples: {
        Row: {
          id: string;
          user1_id: string;
          user2_id: string | null;
          invite_code: string;
          start_date: string;
          first_met_date: string | null;
          created_at: string;
        };
        Insert: {
          user1_id: string;
          invite_code: string;
          start_date?: string;
          first_met_date?: string | null;
        };
        Update: {
          user2_id?: string | null;
          start_date?: string;
          first_met_date?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'couples_user1_id_fkey';
            columns: ['user1_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'couples_user2_id_fkey';
            columns: ['user2_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      walks: {
        Row: {
          id: string;
          couple_id: string;
          date: string;
          location_name: string;
          steps: number;
          is_revealed: boolean;
          created_at: string;
        };
        Insert: {
          couple_id: string;
          date: string;
          location_name: string;
          steps: number;
          is_revealed?: boolean;
        };
        Update: {
          location_name?: string;
          steps?: number;
          is_revealed?: boolean;
        };
        Relationships: [];
      };
      footprint_entries: {
        Row: {
          id: string;
          walk_id: string;
          user_id: string;
          memo: string;
          photos: string[];
          written_at: string;
          diary_question_id: number | null;
          diary_answer: string;
          couple_question_id: number | null;
          couple_answer: string;
        };
        Insert: {
          walk_id: string;
          user_id: string;
          memo: string;
          photos?: string[];
          diary_question_id?: number;
          diary_answer?: string;
          couple_question_id?: number;
          couple_answer?: string;
        };
        Update: {
          memo?: string;
          photos?: string[];
          diary_answer?: string;
          couple_answer?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          recipient_id: string;
          sender_id: string | null;
          couple_id: string | null;
          type: string;
          title: string;
          body: string;
          data: Record<string, unknown>;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          recipient_id: string;
          sender_id?: string | null;
          couple_id?: string | null;
          type: string;
          title: string;
          body: string;
          data?: Record<string, unknown>;
          is_read?: boolean;
        };
        Update: {
          is_read?: boolean;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// ─── Convenience Type Aliases ───────────────────────────

type Tables = Database['public']['Tables'];

export type ProfileRow = Tables['profiles']['Row'];
export type CoupleRow = Tables['couples']['Row'];
export type WalkRow = Tables['walks']['Row'];
export type FootprintEntryRow = Tables['footprint_entries']['Row'];
export type NotificationRow = Tables['notifications']['Row'];
