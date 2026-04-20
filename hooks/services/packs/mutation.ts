import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/keys';
import { findPack } from '@/constants/decoration-packs';
import { packsService } from '@/server/packs';

/**
 * RevenueCat 결제 성공 후 호출.
 *
 * - 단일 팩   → mark_pack_purchased 한 번
 * - 번들      → includes 각 sub-pack_id에 대해 여러 번 호출 (+ 번들 자체도 기록)
 * - 평생팩    → 'lifetime' 하나만 기록 (클라이언트에서 '*' 전개)
 */
export const useMarkPackPurchasedMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      packId,
      revenuecatProductId,
    }: {
      packId: string;
      revenuecatProductId: string;
    }) => {
      const pack = findPack(packId);
      if (!pack) {
        return { success: false, reason: 'unknown_pack' as const };
      }

      // 번들은 sub-pack 까지 전개해서 저장 (UI에서 단일/번들 어느 쪽으로 체크해도 맞게)
      if (pack.kind === 'bundle' && Array.isArray(pack.includes)) {
        for (const subId of pack.includes) {
          await packsService.markPackPurchased(subId, revenuecatProductId);
        }
      }

      // lifetime/single 또는 bundle 자체도 기록
      const result = await packsService.markPackPurchased(
        packId,
        revenuecatProductId,
      );
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.packs.owned });
    },
  });
};
