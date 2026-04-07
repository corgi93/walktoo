import i18n from '@/lib/i18n';

import type { NotificationRow } from '../types/database.types';
import { notificationsRepository } from './notifications.repository';

// ─── Notification Types ──────────────────────────────────

export type NotificationType =
  | 'couple_joined'    // 커플 연결 완료
  | 'walk_created'     // 상대방이 산책 기록 생성
  | 'walk_revealed'    // 둘 다 작성 → 공개
  | 'nudge'            // 톡톡 (기록 요청)
  | 'stamp_claimed';   // 추억의 발자국 획득

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
    // 1. DB에 알림 저장 (실패해도 Push는 시도)
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
      // DB 실패해도 Push는 계속 진행
    }

    // 2. Push 발송 (Expo Push API)
    try {
      const { data: tokenData } =
        await notificationsRepository.getPushToken(recipientId);
      const pushToken = tokenData?.push_token;

      if (!pushToken) {
        console.warn(
          `[Notification] 상대방(${recipientId})의 push_token이 없습니다. 알림 권한을 확인하세요.`,
        );
        return;
      }

      await sendExpoPush(pushToken, title, body, data);
    } catch (pushError) {
      console.warn('[Notification] Push 발송 실패:', pushError);
    }
  },

  // ─── 시나리오별 편의 메서드 ─────────────────────────────

  /**
   * 커플 연결 완료 알림 (user1에게)
   * 푸시 본문은 발신자 클라이언트 로케일로 생성됨.
   * (백엔드 푸시로 옮길 때 수신자 로케일 기반 재생성 예정)
   */
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
      title: i18n.t('notification:push.couple-joined.title'),
      body: i18n.t('notification:push.couple-joined.body', { name: partnerName }),
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
      title: i18n.t('notification:push.walk-created.title'),
      body: i18n.t('notification:push.walk-created.body', {
        name: senderName,
        location: locationName,
      }),
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
      title: i18n.t('notification:push.walk-revealed.title'),
      body: i18n.t('notification:push.walk-revealed.body', { location: locationName }),
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
      title: i18n.t('notification:push.nudge.title'),
      body: i18n.t('notification:push.nudge.body', { name: senderName }),
      data: { walkId, coupleId },
    });
  },

  /** 추억의 발자국 획득 알림 (커플 양쪽에게) */
  notifyStampClaimed: async (
    recipientId: string,
    senderId: string,
    coupleId: string,
    count: number,
    senderName: string,
  ) => {
    await notificationsService.send({
      recipientId,
      senderId,
      coupleId,
      type: 'stamp_claimed',
      title: i18n.t('notification:push.stamp-claimed.title'),
      body: i18n.t('notification:push.stamp-claimed.body', {
        name: senderName,
        count,
      }),
      data: { coupleId, count },
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
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
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
        channelId: 'default',
      }),
    });

    const result = await response.json();

    // Expo Push API 응답 확인
    if (result.data?.status === 'error') {
      console.warn(
        '[ExpoPush] 발송 에러:',
        result.data.message,
        '| details:', result.data.details,
      );
    } else {
      console.log('[ExpoPush] 발송 성공:', result.data?.id);
    }
  } catch (error) {
    console.warn('[ExpoPush] 발송 실패:', error);
  }
}
