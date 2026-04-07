import type { WalkDiary, CreateWalkDiaryInput, FootprintEntry } from '@/types/diary';

import { notificationsService } from '../notifications/notifications.service';
import type { FootprintEntryRow } from '../types/database.types';
import { walksRepository, type WalkWithEntries } from './walks.repository';

// ─── Row → Domain Type 변환 ────────────────────────────

const toFootprintEntry = (row: FootprintEntryRow & { profiles?: { nickname: string } | null }): FootprintEntry => ({
  id: row.id,
  userId: row.user_id,
  nickname: row.profiles?.nickname ?? '',
  memo: row.memo,
  photos: row.photos,
  writtenAt: row.written_at,
  diaryQuestionId: row.diary_question_id ?? undefined,
  diaryAnswer: row.diary_answer || undefined,
  coupleQuestionId: row.couple_question_id ?? undefined,
  coupleAnswer: row.couple_answer || undefined,
});

const toWalkDiary = (
  row: WalkWithEntries,
  currentUserId: string,
): WalkDiary => {
  const myEntry = row.footprint_entries.find((e) => e.user_id === currentUserId);
  const partnerEntry = row.footprint_entries.find(
    (e) => e.user_id !== currentUserId,
  );

  return {
    id: row.id,
    coupleId: row.couple_id,
    date: row.date,
    locationName: row.location_name,
    myEntry: myEntry ? toFootprintEntry(myEntry) : undefined,
    partnerEntry: partnerEntry ? toFootprintEntry(partnerEntry) : undefined,
    isRevealed: row.is_revealed,
    createdAt: row.created_at,
  };
};

// ─── 연속 산책 계산 ─────────────────────────────────────

const calculateStreak = (dates: string[]): number => {
  if (dates.length === 0) return 0;

  const today = new Date().toISOString().split('T')[0];
  const sorted = [...new Set(dates)].sort().reverse(); // 최신 순

  // 가장 최근 산책이 오늘 또는 어제가 아니면 streak 0
  const latest = sorted[0];
  const diffFromToday = dayDiff(latest, today);
  if (diffFromToday > 1) return 0;

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = dayDiff(sorted[i], sorted[i - 1]);
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};

const dayDiff = (dateA: string, dateB: string): number => {
  const a = new Date(dateA).getTime();
  const b = new Date(dateB).getTime();
  return Math.round(Math.abs(b - a) / (1000 * 60 * 60 * 24));
};

// ─── Walks Service (비즈니스 로직) ──────────────────────

export const walksService = {
  /** 산책 목록 조회 */
  getList: async (coupleId: string, currentUserId: string, page = 1) => {
    const { data, error } = await walksRepository.findByCoupleId(coupleId, page);
    if (error) throw error;
    return (data ?? []).map((row) => toWalkDiary(row, currentUserId));
  },

  /** 산책 상세 조회 */
  getDetail: async (id: string, currentUserId: string) => {
    const { data, error } = await walksRepository.findById(id);
    if (error) throw error;
    return toWalkDiary(data!, currentUserId);
  },

  /** 산책 생성 + 내 발자취 엔트리 작성 */
  create: async (
    coupleId: string,
    currentUserId: string,
    input: CreateWalkDiaryInput,
  ) => {
    // 0. 같은 날짜에 이미 산책 기록이 있는지 확인
    const { data: existing } = await walksRepository.findByDate(coupleId, input.date);
    if (existing && existing.length > 0) {
      throw new Error('하루에 하나의 산책 기록만 남길 수 있어요');
    }

    // 1. 산책 레코드 생성
    const { data: walk, error: walkError } = await walksRepository.create({
      couple_id: coupleId,
      date: input.date,
      location_name: input.locationName,
      steps: 0, // legacy 컬럼 (더 이상 사용하지 않음)
    });
    if (walkError) throw walkError;

    // 2. 내 발자취 엔트리 생성
    const { error: entryError } = await walksRepository.createEntry({
      walk_id: walk.id,
      user_id: currentUserId,
      memo: input.memo,
      photos: input.photos,
      diary_question_id: input.diaryQuestionId,
      diary_answer: input.diaryAnswer,
      couple_question_id: input.coupleQuestionId,
      couple_answer: input.coupleAnswer,
    });
    if (entryError) throw entryError;

    // 상대방에게 알림 (비동기, 실패해도 무시)
    walksService._notifyPartnerWalkCreated(
      coupleId,
      currentUserId,
      walk.id,
      input.locationName,
    ).catch(() => {});

    return walk.id;
  },

  /** 발자취 엔트리 추가 (상대방 작성 시 → reveal 체크) */
  addEntry: async (
    walkId: string,
    userId: string,
    memo: string,
    photos: string[],
    questionData?: {
      diaryQuestionId?: number;
      diaryAnswer?: string;
      coupleQuestionId?: number;
      coupleAnswer?: string;
    },
  ) => {
    const { error: entryError } = await walksRepository.createEntry({
      walk_id: walkId,
      user_id: userId,
      memo,
      photos,
      diary_question_id: questionData?.diaryQuestionId,
      diary_answer: questionData?.diaryAnswer ?? '',
      couple_question_id: questionData?.coupleQuestionId,
      couple_answer: questionData?.coupleAnswer ?? '',
    });
    if (entryError) throw entryError;

    // 둘 다 작성했으면 reveal
    const { count } = await walksRepository.countEntries(walkId);
    if (count && count >= 2) {
      await walksRepository.update(walkId, { is_revealed: true });

      // 양쪽에 reveal 알림 (비동기)
      walksService._notifyWalkRevealed(walkId).catch(() => {});
    }
  },

  /** 발자취 엔트리 수정 */
  updateEntry: async (
    entryId: string,
    memo: string,
    photos: string[],
    answerData?: { diaryAnswer?: string; coupleAnswer?: string },
  ) => {
    const { error } = await walksRepository.updateEntry(entryId, {
      memo,
      photos,
      ...(answerData?.diaryAnswer !== undefined && { diary_answer: answerData.diaryAnswer }),
      ...(answerData?.coupleAnswer !== undefined && { couple_answer: answerData.coupleAnswer }),
    });
    if (error) throw error;
  },

  /** 산책 삭제 */
  remove: async (walkId: string) => {
    const { error } = await walksRepository.delete(walkId);
    if (error) throw error;
  },

  /** 내부: 산책 생성 시 상대방에게 알림 */
  _notifyPartnerWalkCreated: async (
    coupleId: string,
    senderId: string,
    walkId: string,
    locationName: string,
  ) => {
    const { supabase } = await import('../client');
    // 커플의 상대방 찾기
    const { data: couple } = await supabase
      .from('couples')
      .select('user1_id, user2_id')
      .eq('id', coupleId)
      .single();
    if (!couple) return;

    const recipientId =
      couple.user1_id === senderId ? couple.user2_id : couple.user1_id;
    if (!recipientId) return;

    // 발신자 닉네임
    const { data: sender } = await supabase
      .from('profiles')
      .select('nickname')
      .eq('id', senderId)
      .single();

    await notificationsService.notifyWalkCreated(
      recipientId,
      senderId,
      coupleId,
      sender?.nickname ?? '연인',
      walkId,
      locationName,
    );
  },

  /** 내부: reveal 시 양쪽에 알림 */
  _notifyWalkRevealed: async (walkId: string) => {
    const { data: walk } = await walksRepository.findById(walkId);
    if (!walk) return;

    const { supabase } = await import('../client');
    const { data: couple } = await supabase
      .from('couples')
      .select('user1_id, user2_id')
      .eq('id', walk.couple_id)
      .single();
    if (!couple) return;

    const recipients = [couple.user1_id, couple.user2_id].filter(Boolean);
    for (const recipientId of recipients) {
      if (recipientId) {
        notificationsService
          .notifyWalkRevealed(
            recipientId,
            walk.couple_id,
            walkId,
            walk.location_name,
          )
          .catch(() => {});
      }
    }
  },

  /** 커플 산책 통계 (총 횟수, 총 걸음수, 연속 산책) */
  getStats: async (coupleId: string) => {
    const [countResult, datesResult, stepsResult] = await Promise.all([
      walksRepository.countByCoupleId(coupleId),
      walksRepository.findRecentDates(coupleId),
      walksRepository.findStepsByCoupleId(coupleId),
    ]);

    const totalWalks = countResult.count ?? 0;
    const currentStreak = calculateStreak(
      (datesResult.data ?? []).map((d) => d.date),
    );
    const totalSteps = (stepsResult.data ?? []).reduce(
      (sum, w) => sum + w.steps,
      0,
    );

    return { totalWalks, currentStreak, totalSteps };
  },
};
