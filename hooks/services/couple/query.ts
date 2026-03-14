import { useQuery } from '@tanstack/react-query';

import api from '@/api/api';
import { QUERY_KEYS } from '@/constants/keys';
import { CoupleProfile, QueryConfig } from '@/types';

// ─── useGetCoupleQuery ──────────────────────────────────

export const useGetCoupleQuery = (
  config?: QueryConfig<CoupleProfile, CoupleProfile>,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.couple.profile,
    queryFn: api.couple.getProfile,
    ...config,
  });
};
