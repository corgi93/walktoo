import { supabase } from '../client';
import type { Database, NotificationRow } from '../types/database.types';

type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];

// ─── Notifications Repository ────────────────────────────

export const notificationsRepository = {
  /** 알림 목록 조회 (최신순, 페이지네이션) */
  findByRecipientId: (recipientId: string, page: number, limit = 20) =>
    supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', recipientId)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)
      .returns<NotificationRow[]>(),

  /** 읽지 않은 알림 수 */
  countUnread: (recipientId: string) =>
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', recipientId)
      .eq('is_read', false),

  /** 알림 생성 */
  create: (data: NotificationInsert) =>
    supabase
      .from('notifications')
      .insert(data as never)
      .select()
      .single<NotificationRow>(),

  /** 알림 읽음 처리 */
  markAsRead: (notificationId: string) =>
    supabase
      .from('notifications')
      .update({ is_read: true } as never)
      .eq('id', notificationId),

  /** 모든 알림 읽음 처리 */
  markAllAsRead: (recipientId: string) =>
    supabase
      .from('notifications')
      .update({ is_read: true } as never)
      .eq('recipient_id', recipientId)
      .eq('is_read', false),

  /** 상대방 push_token 조회 */
  getPushToken: (userId: string) =>
    supabase
      .from('profiles')
      .select('push_token')
      .eq('id', userId)
      .single<{ push_token: string | null }>(),

  /** push_token 저장 */
  savePushToken: (userId: string, token: string) =>
    supabase
      .from('profiles')
      .update({ push_token: token } as never)
      .eq('id', userId),
};
