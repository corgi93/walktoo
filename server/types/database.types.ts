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
          character_type: string;
          has_premium: boolean;
          premium_trial_ends_at: string | null;
          premium_purchased_at: string | null;
          revenuecat_user_id: string | null;
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
          character_type?: string;
          has_premium?: boolean;
          premium_trial_ends_at?: string | null;
          premium_purchased_at?: string | null;
          revenuecat_user_id?: string | null;
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
          character_type?: string;
          has_premium?: boolean;
          premium_trial_ends_at?: string | null;
          premium_purchased_at?: string | null;
          revenuecat_user_id?: string | null;
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
          has_premium: boolean;
          premium_purchaser_id: string | null;
          created_at: string;
        };
        Insert: {
          user1_id: string;
          invite_code: string;
          start_date?: string;
          first_met_date?: string | null;
          has_premium?: boolean;
          premium_purchaser_id?: string | null;
        };
        Update: {
          user2_id?: string | null;
          start_date?: string;
          first_met_date?: string | null;
          has_premium?: boolean;
          premium_purchaser_id?: string | null;
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
          location_lat: number | null;
          location_lng: number | null;
          location_address: string | null;
          location_source: 'naver' | 'google' | null;
          steps: number;
          is_revealed: boolean;
          kind: 'together' | 'each';
          created_at: string;
        };
        Insert: {
          couple_id: string;
          date: string;
          location_name: string;
          location_lat?: number | null;
          location_lng?: number | null;
          location_address?: string | null;
          location_source?: 'naver' | 'google' | null;
          steps: number;
          is_revealed?: boolean;
          kind?: 'together' | 'each';
        };
        Update: {
          location_name?: string;
          location_lat?: number | null;
          location_lng?: number | null;
          location_address?: string | null;
          location_source?: 'naver' | 'google' | null;
          steps?: number;
          is_revealed?: boolean;
          kind?: 'together' | 'each';
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
          location_name: string;
          location_lat: number | null;
          location_lng: number | null;
          location_address: string | null;
          location_source: 'naver' | 'google' | null;
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
          location_name?: string;
          location_lat?: number | null;
          location_lng?: number | null;
          location_address?: string | null;
          location_source?: 'naver' | 'google' | null;
          diary_question_id?: number;
          diary_answer?: string;
          couple_question_id?: number;
          couple_answer?: string;
        };
        Update: {
          memo?: string;
          photos?: string[];
          location_name?: string;
          location_lat?: number | null;
          location_lng?: number | null;
          location_address?: string | null;
          location_source?: 'naver' | 'google' | null;
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
      monthly_reflections: {
        Row: {
          id: string;
          couple_id: string;
          year: number;
          month: number;
          question_ids: number[];
          is_revealed: boolean;
          created_at: string;
          revealed_at: string | null;
        };
        Insert: {
          couple_id: string;
          year: number;
          month: number;
          question_ids: number[];
          is_revealed?: boolean;
        };
        Update: {
          is_revealed?: boolean;
          revealed_at?: string | null;
        };
        Relationships: [];
      };
      reflection_answers: {
        Row: {
          id: string;
          reflection_id: string;
          user_id: string;
          question_id: number;
          answer: string;
          updated_at: string;
        };
        Insert: {
          reflection_id: string;
          user_id: string;
          question_id: number;
          answer: string;
        };
        Update: {
          answer?: string;
        };
        Relationships: [];
      };
      couple_book_credits: {
        Row: {
          couple_id: string;
          credits_remaining: number;
          stamps_redeemed_year: number;
          last_redemption_year: number | null;
          updated_at: string;
        };
        Insert: {
          couple_id: string;
          credits_remaining?: number;
          stamps_redeemed_year?: number;
          last_redemption_year?: number | null;
        };
        Update: {
          credits_remaining?: number;
          stamps_redeemed_year?: number;
          last_redemption_year?: number | null;
        };
        Relationships: [];
      };
      couple_pack_entitlements: {
        Row: {
          id: string;
          couple_id: string;
          pack_id: string;
          purchased_by: string | null;
          revenuecat_product_id: string | null;
          purchased_at: string;
        };
        Insert: {
          couple_id: string;
          pack_id: string;
          purchased_by?: string | null;
          revenuecat_product_id?: string | null;
        };
        Update: {
          revenuecat_product_id?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_partner_steps: {
        Args: { p_partner_id: string; p_date: string };
        Returns: number;
      };
      claim_memory_stamp: {
        Args: { p_date: string; p_count?: number };
        Returns: {
          success: boolean;
          reason?: 'no_couple' | 'already_claimed';
          stamp_id?: string;
          count?: number;
        };
      };
      get_total_stamps: {
        Args: Record<string, never>;
        Returns: number;
      };
      get_or_create_reflection: {
        Args: {
          p_year: number;
          p_month: number;
          p_question_ids: number[];
        };
        Returns: {
          id?: string;
          question_ids?: number[];
          is_revealed?: boolean;
          error?: string;
        };
      };
      save_reflection_answers: {
        Args: {
          p_reflection_id: string;
          p_answers: { question_id: number; answer: string }[];
        };
        Returns: {
          success: boolean;
          reason?: string;
          revealed?: boolean;
          just_revealed?: boolean;
        };
      };
      get_reflection_progress: {
        Args: {
          p_reflection_id: string;
        };
        Returns: {
          total?: number;
          my_answered?: number;
          partner_answered?: number;
          has_partner?: boolean;
          is_revealed?: boolean;
          error?: string;
        };
      };
      start_trial_if_needed: {
        Args: Record<string, never>;
        Returns: {
          started: boolean;
          trial_ends_at: string | null;
        };
      };
      mark_premium_purchased: {
        Args: { p_revenuecat_user_id: string };
        Returns: {
          success: boolean;
        };
      };
      mark_pack_purchased: {
        Args: { p_pack_id: string; p_revenuecat_product_id: string };
        Returns: {
          success: boolean;
          reason?: 'no_couple';
          id?: string;
        };
      };
      get_book_credits: {
        Args: Record<string, never>;
        Returns: {
          credits: number;
          redeemed_this_year: number;
        };
      };
      add_book_credits: {
        Args: { p_count: number };
        Returns: {
          success: boolean;
          reason?: 'no_couple' | 'invalid_count';
        };
      };
      redeem_stamps_for_book: {
        Args: Record<string, never>;
        Returns: {
          success: boolean;
          reason?: 'no_couple' | 'annual_cap_reached' | 'insufficient_stamps';
          required?: number;
          current?: number;
        };
      };
      consume_book_credit: {
        Args: Record<string, never>;
        Returns: {
          success: boolean;
          reason?: 'no_couple' | 'no_credits';
        };
      };
      is_entitled: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
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
