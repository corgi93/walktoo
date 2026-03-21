import type { NotificationRow } from '../types/database.types';
import { notificationsRepository } from './notifications.repository';

// ─── Notification Types ──────────────────────────────────

export type NotificationType =
  | 'couple_joined'    // 커플 연결 완료
  | 'walk_created'     // 상대방이 산책 기록 생성
  | 'walk_revealed'    // 둘 다 작성 → 공개
  | 'nudge';           // 톡톡 (기록 요청)

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  isRead: boolean;
  senderId: string | null;
  createdAt: string;
}

// ─── Row → Domain 변환 ──────────────────────────────────

const toAppNotification = (row: NotificationRow): AppNotification => ({
  id: row.id,
  type: row.type as NotificationType,
  title: row.title,
  body: row.body,
  data: row.data,
  isRead: row.is_read,
  senderId: row.sender_id,
  createdAt: row.created_at,
});

// ─── Notifications Service ──────────────────────────────

export const notificationsService = {
  /** 알림 목록 조회 */
  getList: async (userId: string, page = 1) => {
    const { data, error } = await notificationsRepository.findByRecipientId(
      userId,
      page,
    );
    if (error) throw error;
    return (data ?? []).map(toAppNotification);
  },

  /** 읽지 않은 알림 수 */
  getUnreadCount: async (userId: string) => {
    const { count, error } = await notificationsRepository.countUnread(userId);
    if (error) throw error;
    return count ?? 0;
  },

  /** 알림 읽음 처리 */
  markAsRead: async (notificationId: string) => {
    const { error } = await notificationsRepository.markAsRead(notificationId);
    if (error) throw error;
  },

  /** 모든 알림 읽음 처리 */
  markAllAsRead: async (userId: string) => {
    const { error } = await notificationsRepository.markAllAsRead(userId);
    if (error) throw error;
  },

  /** push token 저장 */
  savePushToken: async (userId: string, token: string) => {
    const { error } = await notificationsRepository.savePushToken(userId, token);
    if (error) throw error;
  },

  /** 알림 생성 + Push 발송 */
  send: async ({
    recipientId,
    senderId,
    coupleId,
    type,
    title,
    body,
    data = {},
  }: {
    recipientId: string;
    senderId?: string;
    coupleId?: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }) => {
    // 1. DB에 알림 저장
    const { error } = await notificationsRepository.create({
      recipient_id: recipientId,
      sender_id: senderId ?? null,
      couple_id: coupleId ?? null,
      type,
      title,
      body,
      data,
    });
    if (error) {
      console.warn('[Notification] DB 저장 실패:', error.message);
      return;
    }

    // 2. Push 발송 (Expo Push API)
    try {
      const { data: tokenData } =
        await notificationsRepository.getPushToken(recipientId);
      const pushToken = tokenData?.push_token;

      if (pushToken) {
        await sendExpoPush(pushToken, title, body, data);
      }
    } catch (pushError) {
      console.warn('[Notification] Push 발송 실패:', pushError);
    }
  },

  // ─── 시나리오별 편의 메서드 ─────────────────────────────

  /** 커플 연결 완료 알림 (user1에게) */
  notifyCoupleJoined: async (
    recipientId: string,
    senderId: string,
    coupleId: string,
    partnerName: string,
  ) => {
    await notificationsService.send({
      recipientId,
      senderId,
      coupleId,
      type: 'couple_joined',
      title: '커플 연결 완료!',
      body: `${partnerName}님이 초대를 수락했어요. 이제 함께 걸어볼까요?`,
      data: { coupleId },
    });
  },

  /** 산책 기록 생성 알림 (상대방에게) */
  notifyWalkCreated: async (
    recipientId: string,
    senderId: string,
    coupleId: string,
    senderName: string,
    walkId: string,
    locationName: string,
  ) => {
    await notificationsService.send({
      recipientId,
      senderId,
      coupleId,
      type: 'walk_created',
      title: '새 산책 기록이 도착했어요!',
      body: `${senderName}님이 ${locationName}에서의 하루를 남겼어요. 나도 기록해볼까요?`,
      data: { walkId, coupleId, locationName },
    });
  },

  /** 산책 공개 알림 (양쪽 모두에게) */
  notifyWalkRevealed: async (
    recipientId: string,
    coupleId: string,
    walkId: string,
    locationName: string,
  ) => {
    await notificationsService.send({
      recipientId,
      coupleId,
      type: 'walk_revealed',
      title: '서로의 하루가 공개됐어요!',
      body: `${locationName}에서의 둘의 이야기를 확인해보세요`,
      data: { walkId, coupleId, locationName },
    });
  },

  /** 톡톡 (넛지) 알림 */
  notifyNudge: async (
    recipientId: string,
    senderId: string,
    coupleId: string,
    senderName: string,
    walkId: string,
  ) => {
    await notificationsService.send({
      recipientId,
      senderId,
      coupleId,
      type: 'nudge',
      title: '톡톡! 두드림이 왔어요',
      body: `${senderName}님이 오늘의 기록을 기다리고 있어요`,
      data: { walkId, coupleId },
    });
  },
};

// ─── Expo Push API ──────────────────────────────────────

async function sendExpoPush(
  pushToken: string,
  title: string,
  body: string,
  data: Record<string, unknown>,
) {
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        to: pushToken,
        title,
        body,
        data,
        sound: 'default',
        priority: 'high',
      }),
    });
  } catch (error) {
    console.warn('[ExpoPush] 발송 실패:', error);
  }
}
