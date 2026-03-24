import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/keys';
import { storageService, walksService } from '@/server';
import type { CreateWalkDiaryInput } from '@/types';
import { useGetMeQuery } from '../user/query';

// ─── useCreateDiaryMutation ─────────────────────────────
// 산책 생성 + 사진 업로드 + 발자취 엔트리

export const useCreateDiaryMutation = () => {
  const queryClient = useQueryClient();
  const { data: me } = useGetMeQuery();

  return useMutation({
    mutationFn: async (input: CreateWalkDiaryInput) => {
      if (!me?.coupleId) throw new Error('커플 연결이 필요합니다');

      // 1. 사진이 있으면 먼저 업로드
      let photoUrls: string[] = [];
      if (input.photos.length > 0) {
        const tempId = Date.now().toString();
        photoUrls = await storageService.uploadPhotos(
          me.coupleId,
          tempId,
          input.photos,
        );
      }

      // 2. 산책 + 엔트리 생성 (업로드된 URL로)
      const walkId = await walksService.create(me.coupleId, me.id, {
        ...input,
        photos: photoUrls.length > 0 ? photoUrls : input.photos,
      });

      return walkId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.diary.list });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.couple.stats });
    },
  });
};

// ─── useAddEntryMutation ────────────────────────────────
// 상대방 발자취 엔트리 추가 (reveal 트리거)

export const useAddEntryMutation = () => {
  const queryClient = useQueryClient();
  const { data: me } = useGetMeQuery();

  return useMutation({
    mutationFn: async ({
      walkId,
      memo,
      photos,
      diaryQuestionId,
      diaryAnswer,
      coupleQuestionId,
      coupleAnswer,
    }: {
      walkId: string;
      memo: string;
      photos: string[];
      diaryQuestionId?: number;
      diaryAnswer?: string;
      coupleQuestionId?: number;
      coupleAnswer?: string;
    }) => {
      if (!me?.coupleId) throw new Error('커플 연결이 필요합니다');

      // 1. 사진 업로드
      let photoUrls: string[] = [];
      if (photos.length > 0) {
        photoUrls = await storageService.uploadPhotos(
          me.coupleId,
          walkId,
          photos,
        );
      }

      // 2. 엔트리 추가 (둘 다 작성 → reveal)
      await walksService.addEntry(
        walkId,
        me.id,
        memo,
        photoUrls.length > 0 ? photoUrls : photos,
        { diaryQuestionId, diaryAnswer, coupleQuestionId, coupleAnswer },
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.diary.list });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.diary.detail(variables.walkId),
      });
    },
  });
};

// ─── useUpdateEntryMutation ─────────────────────────────
// 내 발자취 엔트리 수정

export const useUpdateEntryMutation = () => {
  const queryClient = useQueryClient();
  const { data: me } = useGetMeQuery();

  return useMutation({
    mutationFn: async ({
      walkId,
      entryId,
      memo,
      photos,
      diaryAnswer,
      coupleAnswer,
    }: {
      walkId: string;
      entryId: string;
      memo: string;
      photos: string[];
      diaryAnswer?: string;
      coupleAnswer?: string;
    }) => {
      if (!me?.coupleId) throw new Error('커플 연결이 필요합니다');

      // 새로 추가된 로컬 사진만 업로드 (이미 URL인 건 스킵)
      const localPhotos = photos.filter((p) => !p.startsWith('http'));
      const existingUrls = photos.filter((p) => p.startsWith('http'));

      let newUrls: string[] = [];
      if (localPhotos.length > 0) {
        newUrls = await storageService.uploadPhotos(
          me.coupleId,
          walkId,
          localPhotos,
        );
      }

      const allPhotos = [...existingUrls, ...newUrls];

      await walksService.updateEntry(entryId, memo, allPhotos, {
        diaryAnswer,
        coupleAnswer,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.diary.list });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.diary.detail(variables.walkId),
      });
    },
  });
};

// ─── useDeleteDiaryMutation ─────────────────────────────

export const useDeleteDiaryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (walkId: string) => walksService.remove(walkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.diary.list });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.couple.stats });
    },
  });
};
