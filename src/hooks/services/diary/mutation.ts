import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/keys';
import { storageService, walksService } from '@/server';
import type { CreateWalkDiaryInput } from '@/types';
import { useFieldCrypto } from '@/hooks/useCrypto';
import { useGetMeQuery } from '../user/query';

// ─── useCreateDiaryMutation ─────────────────────────────
// 산책 생성 + 사진 업로드 + 발자취 엔트리

export const useCreateDiaryMutation = () => {
  const queryClient = useQueryClient();
  const { data: me } = useGetMeQuery();
  const { encrypt } = useFieldCrypto();

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

      // 2. 산책 + 엔트리 생성 (업로드된 URL로, 텍스트 필드 암호화)
      const walkId = await walksService.create(me.coupleId, me.id, {
        ...input,
        memo: encrypt(input.memo),
        diaryAnswer: input.diaryAnswer ? encrypt(input.diaryAnswer) : input.diaryAnswer,
        coupleAnswer: input.coupleAnswer ? encrypt(input.coupleAnswer) : input.coupleAnswer,
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
  const { encrypt } = useFieldCrypto();

  return useMutation({
    mutationFn: async ({
      walkId,
      memo,
      photos,
      locationName,
      diaryQuestionId,
      diaryAnswer,
      coupleQuestionId,
      coupleAnswer,
    }: {
      walkId: string;
      memo: string;
      photos: string[];
      /** kind='each' 인 walk에 조인할 때 내 장소 */
      locationName?: string;
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

      // 2. 엔트리 추가 (둘 다 작성 → reveal, 텍스트 필드 암호화)
      await walksService.addEntry(
        walkId,
        me.id,
        encrypt(memo),
        photoUrls.length > 0 ? photoUrls : photos,
        {
          diaryQuestionId,
          diaryAnswer: diaryAnswer ? encrypt(diaryAnswer) : diaryAnswer,
          coupleQuestionId,
          coupleAnswer: coupleAnswer ? encrypt(coupleAnswer) : coupleAnswer,
        },
        locationName,
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
  const { encrypt } = useFieldCrypto();

  return useMutation({
    mutationFn: async ({
      walkId,
      entryId,
      memo,
      photos,
      locationName,
      diaryAnswer,
      coupleAnswer,
    }: {
      walkId: string;
      entryId: string;
      memo: string;
      photos: string[];
      /** 'each' walk의 내 장소 수정 시 */
      locationName?: string;
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

      await walksService.updateEntry(entryId, encrypt(memo), allPhotos, {
        locationName,
        diaryAnswer: diaryAnswer ? encrypt(diaryAnswer) : diaryAnswer,
        coupleAnswer: coupleAnswer ? encrypt(coupleAnswer) : coupleAnswer,
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
