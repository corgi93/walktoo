import { notificationsService } from '@/server/notifications';
import { supabase } from '../client';

interface SendNudgeResult {
  success: boolean;
  reason?: 'already_nudged';
}

export const nudgeService = {
  sendNudge: async (
    senderId: string,
    recipientId: string,
    coupleId: string,
    senderName: string,
  ): Promise<SendNudgeResult> => {
    const { data, error } = await supabase.rpc('send_nudge', {
      p_sender_id: senderId,
      p_recipient_id: recipientId,
      p_couple_id: coupleId,
    });

    if (error) throw error;

    const result = data as SendNudgeResult;
    if (!result.success) return result;

    // DB insert 성공 후 푸시 — 실패해도 DB 기록은 유지
    try {
      await notificationsService.notifyNudge(
        recipientId,
        senderId,
        coupleId,
        senderName,
        '',
      );
    } catch (pushError) {
      console.warn('[nudgeService] push failed (nudge still saved)', pushError);
    }

    return result;
  },
};
