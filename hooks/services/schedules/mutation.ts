import { useMutation, useQueryClient } from '@tanstack/react-query';

import { schedulesService } from '@/server/schedules';
import { usePartnerDerivation } from '@/hooks/usePartnerDerivation';
import type {
  CreateSchedulePayload,
  UpdateSchedulePayload,
} from '@/types/schedule';

const SCHEDULE_ROOT_KEY = ['schedule'];

const invalidateScheduleQueries = (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  queryClient.invalidateQueries({ queryKey: SCHEDULE_ROOT_KEY });
};

/**
 * 일정 생성.
 */
export const useCreateScheduleMutation = () => {
  const queryClient = useQueryClient();
  const { me, couple, isCoupleConnected } = usePartnerDerivation();

  return useMutation({
    mutationFn: async (payload: CreateSchedulePayload) => {
      if (!isCoupleConnected || !couple?.id || !me?.id) {
        throw new Error('no_couple');
      }
      const result = await schedulesService.create(couple.id, me.id, payload);
      if (!result) throw new Error('create_failed');
      return result;
    },
    onSuccess: () => {
      invalidateScheduleQueries(queryClient);
    },
  });
};

/**
 * 일정 수정.
 */
export const useUpdateScheduleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateSchedulePayload) => {
      const result = await schedulesService.update(payload);
      if (!result) throw new Error('update_failed');
      return result;
    },
    onSuccess: () => {
      invalidateScheduleQueries(queryClient);
    },
  });
};

/**
 * 일정 삭제.
 */
export const useDeleteScheduleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const ok = await schedulesService.remove(id);
      if (!ok) throw new Error('delete_failed');
      return id;
    },
    onSuccess: () => {
      invalidateScheduleQueries(queryClient);
    },
  });
};
