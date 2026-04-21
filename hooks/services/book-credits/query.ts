import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/keys';
import { bookCreditsService } from '@/server/book-credits';
import { usePartnerDerivation } from '@/hooks/usePartnerDerivation';

export const useBookCreditsQuery = () => {
  const { couple } = usePartnerDerivation();
  return useQuery({
    queryKey: [...QUERY_KEYS.bookCredits.status, couple?.id],
    queryFn: () => bookCreditsService.getStatus(),
    enabled: !!couple?.id,
    staleTime: 30_000,
  });
};
