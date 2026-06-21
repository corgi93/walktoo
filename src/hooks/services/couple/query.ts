import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/keys';
import { couplesService, walksService } from '@/server';
import type { CoupleProfile, QueryConfig } from '@/types';
import { useGetMeQuery } from '../user/query';

// ─── useGetCoupleQuery ──────────────────────────────────

export const useGetCoupleQuery = (
  config?: QueryConfig<CoupleProfile, CoupleProfile>,
) => {
  const { data: me } = useGetMeQuery();

  return useQuery({
    queryKey: QUERY_KEYS.couple.profile,
    queryFn: () => couplesService.getCoupleProfile(me!.coupleId!),
    enabled: !!me?.coupleId,
    ...config,
  });
};

// ─── useCoupleStatsQuery ────────────────────────────────

export const useCoupleStatsQuery = () => {
  const { data: me } = useGetMeQuery();

  return useQuery({
    queryKey: QUERY_KEYS.couple.stats,
    queryFn: () => walksService.getStats(me!.coupleId!),
    enabled: !!me?.coupleId,
  });
};
