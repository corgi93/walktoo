import { useQuery } from '@tanstack/react-query';

import { api } from '@/api';
import { QUERY_KEYS } from '@/constants/keys';

export const useGetMeQuery = () => {
  return useQuery({
    queryKey: QUERY_KEYS.user.me,
    queryFn: () => api.user.getMe(),
  });
};
