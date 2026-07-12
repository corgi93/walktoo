import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/keys';
import { coupleMemosService } from '@/server/couple-memos';
import { usePartnerDerivation } from '@/hooks/usePartnerDerivation';
import { useFieldCrypto } from '@/hooks/useCrypto';

export const useCoupleMemoQuery = () => {
  const { couple, isCoupleConnected } = usePartnerDerivation();
  const { decrypt } = useFieldCrypto();
  const coupleId = isCoupleConnected ? couple?.id : undefined;

  return useQuery({
    queryKey: [...QUERY_KEYS.coupleMemo.detail, coupleId],
    queryFn: () => coupleMemosService.get(coupleId!),
    enabled: !!coupleId,
    staleTime: 30_000,
    select: (data) => {
      if (!data) return data;
      return { ...data, content: decrypt(data.content) };
    },
  });
};
