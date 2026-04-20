import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/keys';
import { expandOwnedPacks } from '@/constants/decoration-packs';
import { packsService } from '@/server/packs';
import { usePartnerDerivation } from '@/hooks/usePartnerDerivation';

/**
 * 커플이 보유 중인 pack_id 목록 (DB 레코드 그대로).
 */
export const useOwnedPackEntitlementsQuery = () => {
  const { couple } = usePartnerDerivation();
  const coupleId = couple?.id;

  return useQuery({
    queryKey: [...QUERY_KEYS.packs.owned, coupleId],
    queryFn: () => packsService.listOwnedPacks(coupleId!),
    enabled: !!coupleId,
    staleTime: 60_000,
  });
};

/**
 * 접근 가능한(=unlock된) pack_id Set.
 * - lifetime 보유 → 모든 single+bundle id 포함
 * - bundle 보유   → 해당 번들의 includes 모두 포함
 * - single 보유   → 그 id 하나
 */
export const useUnlockedPacks = () => {
  const { data, isLoading } = useOwnedPackEntitlementsQuery();

  const unlocked = useMemo(
    () => expandOwnedPacks((data ?? []).map((e) => e.packId)),
    [data],
  );

  return { unlocked, isLoading };
};

/**
 * 특정 팩의 잠금 해제 여부 체크.
 * @example const canUsePolaroid = useOwnsPack('polaroid');
 */
export const useOwnsPack = (packId: string): boolean => {
  const { unlocked } = useUnlockedPacks();
  return unlocked.has(packId);
};
