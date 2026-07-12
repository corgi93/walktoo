import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/keys';
import { coupleMemosService } from '@/server/couple-memos';
import { usePartnerDerivation } from '@/hooks/usePartnerDerivation';
import { useFieldCrypto } from '@/hooks/useCrypto';

export const useUpdateCoupleMemoMutation = () => {
  const queryClient = useQueryClient();
  const { me, couple, isCoupleConnected } = usePartnerDerivation();
  const { encrypt } = useFieldCrypto();

  return useMutation({
    mutationFn: async (content: string) => {
      if (!isCoupleConnected || !couple?.id || !me?.id) {
        throw new Error('no_couple');
      }
      const result = await coupleMemosService.upsert(couple.id, me.id, encrypt(content));
      if (!result) throw new Error('save_failed');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.coupleMemo.detail });
    },
  });
};
