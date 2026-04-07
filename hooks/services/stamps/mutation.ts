import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/keys';
import { STAMP } from '@/constants/game-config';
import { memoryStampsService } from '@/server/memory-stamps';
import { notificationsService } from '@/server/notifications';

interface ClaimStampParams {
  count?: number;
  coupleId?: string;
  myId?: string;
  partnerId?: string;
  myName?: string;
}

/**
 * 오늘의 스탬프 획득 (하루 1회)
 * 성공 시 커플 양쪽에게 알림센터에 기록 추가
 */
export const useClaimStampMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: ClaimStampParams) => {
      const result = await memoryStampsService.claimTodayStamp(params.count);

      // 성공 시 양쪽 알림센터에 기록 (실패해도 무시)
      if (result.success && params.coupleId && params.myId && params.myName) {
        const stampCount = result.count ?? params.count ?? STAMP.DAILY_REWARD;
        const recipients = [params.myId, params.partnerId].filter(
          (id): id is string => !!id,
        );
        await Promise.all(
          recipients.map((recipientId) =>
            notificationsService
              .notifyStampClaimed(
                recipientId,
                params.myId!,
                params.coupleId!,
                stampCount,
                params.myName!,
              )
              .catch(() => {}),
          ),
        );
      }

      return result;
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stamps.today });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stamps.total });
        queryClient.invalidateQueries({
          queryKey: ['notification'],
        });
      }
    },
  });
};
