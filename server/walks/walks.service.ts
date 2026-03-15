import type { WalkDiary, CreateWalkDiaryInput, FootprintEntry } from '@/types/diary';

import type { FootprintEntryRow } from '../types/database.types';
import { walksRepository, type WalkWithEntries } from './walks.repository';

// ─── Row → Domain Type 변환 ────────────────────────────

const toFootprintEntry = (row: FootprintEntryRow): FootprintEntry => ({
  userId: row.user_id,
  nickname: '', // profiles join으로 채움
  memo: row.memo,
  photos: row.photos,
  writtenAt: row.written_at,
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
    steps: row.steps,
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
    // 1. 산책 레코드 생성
    const { data: walk, error: walkError } = await walksRepository.create({
      couple_id: coupleId,
      date: input.date,
      location_name: input.locationName,
      steps: input.steps,
    });
    if (walkError) throw walkError;

    // 2. 내 발자취 엔트리 생성
    const { error: entryError } = await walksRepository.createEntry({
      walk_id: walk.id,
      user_id: currentUserId,
      memo: input.memo,
      photos: input.photos,
    });
    if (entryError) throw entryError;

    return walk.id;
  },

  /** 발자취 엔트리 추가 (상대방 작성 시 → reveal 체크) */
  addEntry: async (
    walkId: string,
    userId: string,
    memo: string,
    photos: string[],
  ) => {
    const { error: entryError } = await walksRepository.createEntry({
      walk_id: walkId,
      user_id: userId,
      memo,
      photos,
    });
    if (entryError) throw entryError;

    // 둘 다 작성했으면 reveal
    const { count } = await walksRepository.countEntries(walkId);
    if (count && count >= 2) {
      await walksRepository.update(walkId, { is_revealed: true });
    }
  },

  /** 산책 삭제 */
  remove: async (walkId: string) => {
    const { error } = await walksRepository.delete(walkId);
    if (error) throw error;
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
