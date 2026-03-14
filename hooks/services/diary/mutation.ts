import { useMutation, useQueryClient } from '@tanstack/react-query';

import api from '@/api/api';
import { QUERY_KEYS } from '@/constants/keys';
import { CreateWalkDiaryInput } from '@/types';

// ─── useCreateDiaryMutation ─────────────────────────────

export const useCreateDiaryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWalkDiaryInput) => api.diary.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.diary.list });
    },
  });
};
