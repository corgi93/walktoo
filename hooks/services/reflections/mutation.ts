import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/keys';
import { reflectionsService } from '@/server/reflections';
import type { ReflectionAnswer } from '@/types/reflection';

interface SaveAnswersParams {
  reflectionId: string;
  answers: ReflectionAnswer[];
}

/**
 * 회고 답변 저장 (3개 한번에)
 */
export const useSaveReflectionAnswersMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: SaveAnswersParams) =>
      reflectionsService.saveAnswers(params.reflectionId, params.answers),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.reflection.detail(variables.reflectionId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.reflection.current,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.reflection.list,
      });
    },
  });
};
