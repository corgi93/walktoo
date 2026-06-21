import { useMutation } from '@tanstack/react-query';

import { nudgeService } from '@/server/nudge';
import { useGetMeQuery } from '../user/query';

interface SendNudgeInput {
  recipientId: string;
  coupleId: string;
  senderName: string;
}

export const useSendNudgeMutation = () => {
  const { data: me } = useGetMeQuery();

  return useMutation({
    mutationFn: async ({ recipientId, coupleId, senderName }: SendNudgeInput) => {
      if (!me?.id) throw new Error('로그인이 필요합니다');
      return nudgeService.sendNudge(me.id, recipientId, coupleId, senderName);
    },
  });
};
