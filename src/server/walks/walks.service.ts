import type { WalkDiary, CreateWalkDiaryInput, FootprintEntry } from '@/types/diary';
import { getLocalToday, parseLocalDate } from '@/utils/date';

import { notificationsService } from '../notifications/notifications.service';
import { storageService } from '../storage';
import type { FootprintEntryRow } from '../types/database.types';
import { walksRepository, type WalkWithEntries } from './walks.repository';

/** 원격(http) URL만 추려낸다 — 로컬 미업로드 항목 제외 */
const remoteUrls = (urls: readonly string[] | null | undefined): string[] =>
  (urls ?? []).filter((u) => typeof u === 'string' && u.startsWith('http'));

// ─── Row → Domain Type 변환 ────────────────────────────

const toFootprintEntry = (row: FootprintEntryRow & { profiles?: { nickname: string } | null }): FootprintEntry => ({
  id: row.id,
  userId: row.user_id,
  nickname: row.profiles?.nickname ?? '',
  memo: row.memo,
  photos: row.photos,
  locationName: row.location_name ?? '',
  locationCoords:
    row.location_lat != null && row.location_lng != null
      ? { lat: row.location_lat, lng: row.location_lng }
      : undefined,
  locationAddress: row.location_address ?? undefined,
  locationSource: row.location_source ?? undefined,
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
    locationCoords:
      row.location_lat != null && row.location_lng != null
        ? { lat: row.location_lat, lng: row.location_lng }
        : undefined,
    locationAddress: row.location_address ?? undefined,
    locationSource: row.location_source ?? undefined,
    kind: row.kind ?? 'together',
    myEntry: myEntry ? toFootprintEntry(myEntry) : undefined,
    partnerEntry: partnerEntry ? toFootprintEntry(partnerEntry) : undefined,
    isRevealed: row.is_revealed,
    createdAt: row.created_at,
  };
};

// ─── 연속 산책 계산 ─────────────────────────────────────

const calculateStreak = (dates: string[]): number => {
  if (dates.length === 0) return 0;

  const today = getLocalToday();
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
  const a = parseLocalDate(dateA).getTime();
  const b = parseLocalDate(dateB).getTime();
  return Math.round(Math.abs(b - a) / (1000 * 60 * 60 * 24));
};

const throwWalkEntryReason = (reason?: string): never => {
  switch (reason) {
    case 'already_entered':
      throw new Error('같은 종류의 기록은 하루에 하나만 남길 수 있어요');
    case 'no_couple':
      throw new Error('커플 연결이 필요합니다');
    case 'forbidden':
    case 'not_found':
      throw new Error('이 기록에 접근할 수 없어요');
    case 'invalid_kind':
      throw new Error('지원하지 않는 기록 종류예요');
    default:
      throw new Error('기록 저장에 실패했어요');
  }
};

// ─── Walks Service (비즈니스 로직) ──────────────────────

export const walksService = {
  /** 산책 목록 조회 */
  getList: async (
    coupleId: string,
    currentUserId: string,
    page = 1,
    kind?: WalkDiary['kind'],
  ) => {
    const { data, error } = await walksRepository.findByCoupleId(
      coupleId,
      page,
      20,
      kind,
    );
    if (error) throw error;
    return (data ?? []).map((row) => toWalkDiary(row, currentUserId));
  },

  /** 특정 월(연/월)의 산책 목록 — 캘린더 뷰용 */
  listByMonth: async (
    coupleId: string,
    currentUserId: string,
    startDate: string,
    endDate: string,
  ) => {
    const { data, error } = await walksRepository.findByCoupleIdAndMonth(
      coupleId,
      startDate,
      endDate,
    );
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
    const { data: result, error } = await walksRepository.createWithEntry({
      p_couple_id: coupleId,
      p_date: input.date,
      p_kind: input.kind,
      p_walk_location_name: input.kind === 'together' ? input.locationName : '',
      p_walk_location_lat:
        input.kind === 'together' ? (input.locationCoords?.lat ?? null) : null,
      p_walk_location_lng:
        input.kind === 'together' ? (input.locationCoords?.lng ?? null) : null,
      p_walk_location_address:
        input.kind === 'together' ? (input.locationAddress ?? null) : null,
      p_walk_location_source:
        input.kind === 'together' ? (input.locationSource ?? null) : null,
      p_memo: input.memo,
      p_photos: input.photos,
      p_entry_location_name: input.kind === 'each' ? input.locationName : '',
      p_entry_location_lat:
        input.kind === 'each' ? (input.locationCoords?.lat ?? null) : null,
      p_entry_location_lng:
        input.kind === 'each' ? (input.locationCoords?.lng ?? null) : null,
      p_entry_location_address:
        input.kind === 'each' ? (input.locationAddress ?? null) : null,
      p_entry_location_source:
        input.kind === 'each' ? (input.locationSource ?? null) : null,
      p_diary_question_id: input.diaryQuestionId,
      p_diary_answer: input.diaryAnswer,
      p_couple_question_id: input.coupleQuestionId,
      p_couple_answer: input.coupleAnswer,
    });

    if (error) throw error;
    if (!result?.success || !result.walk_id) {
      throwWalkEntryReason(result?.reason);
    }
    const walkId = result.walk_id!;

    if (result.created_walk) {
      // 상대방에게 알림 (비동기, 실패해도 무시)
      walksService._notifyPartnerWalkCreated(
        coupleId,
        currentUserId,
        walkId,
        input.locationName,
      ).catch(() => {});
    }

    if (result.just_revealed) {
      walksService._notifyWalkRevealed(walkId).catch(() => {});
    }

    return walkId;
  },

  /** 발자취 엔트리 추가 (상대방 작성 시 → reveal 체크) */
  addEntry: async (
    walkId: string,
    _userId: string,
    memo: string,
    photos: string[],
    questionData?: {
      diaryQuestionId?: number;
      diaryAnswer?: string;
      coupleQuestionId?: number;
      coupleAnswer?: string;
    },
    locationName?: string,
  ) => {
    const { data: result, error } = await walksRepository.addEntryToWalk({
      p_walk_id: walkId,
      p_memo: memo,
      p_photos: photos,
      p_entry_location_name: locationName ?? '',
      p_entry_location_lat: null,
      p_entry_location_lng: null,
      p_entry_location_address: null,
      p_entry_location_source: null,
      p_diary_question_id: questionData?.diaryQuestionId ?? null,
      p_diary_answer: questionData?.diaryAnswer ?? '',
      p_couple_question_id: questionData?.coupleQuestionId ?? null,
      p_couple_answer: questionData?.coupleAnswer ?? '',
    });
    if (error) throw error;
    if (!result?.success) {
      throwWalkEntryReason(result?.reason);
    }
    if (result.just_revealed) {
      walksService._notifyWalkRevealed(walkId).catch(() => {});
    }
  },

  /** 발자취 엔트리 수정 */
  updateEntry: async (
    entryId: string,
    memo: string,
    photos: string[],
    answerData?: {
      locationName?: string;
      diaryAnswer?: string;
      coupleAnswer?: string;
    },
  ) => {
    // 교체 전 사진 목록을 확보해 둔다 (제거된 파일을 Storage에서 정리하려고)
    const { data: before } = await walksRepository.findEntryPhotos(entryId);

    const { error } = await walksRepository.updateEntry(entryId, {
      memo,
      photos,
      ...(answerData?.locationName !== undefined && {
        location_name: answerData.locationName,
      }),
      ...(answerData?.diaryAnswer !== undefined && { diary_answer: answerData.diaryAnswer }),
      ...(answerData?.coupleAnswer !== undefined && { couple_answer: answerData.coupleAnswer }),
    });
    if (error) throw error;

    // 새 목록에서 빠진 원격 사진을 Storage에서 삭제 (best-effort)
    const removed = remoteUrls(before?.photos).filter(
      (url) => !photos.includes(url),
    );
    if (removed.length > 0) {
      await storageService.deletePhotos(removed);
    }
  },

  /** 산책 삭제 — DB 삭제 후 연결된 미디어를 Storage에서 정리 */
  remove: async (walkId: string) => {
    // 삭제 전 모든 엔트리 사진 URL을 모은다 (DB 삭제 후엔 못 가져옴)
    let mediaUrls: string[] = [];
    try {
      const { data } = await walksRepository.findById(walkId);
      mediaUrls = remoteUrls(
        (data?.footprint_entries ?? []).flatMap((e) => e.photos ?? []),
      );
    } catch {
      // 조회 실패해도 삭제는 진행 — 남은 파일은 cleanup이 회수
    }

    const { error } = await walksRepository.delete(walkId);
    if (error) throw error;

    // DB가 지워진 뒤에만 Storage 정리 (best-effort)
    if (mediaUrls.length > 0) {
      await storageService.deletePhotos(mediaUrls);
    }
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
    const [countResult, datesResult, stepsSumResult] = await Promise.all([
      walksRepository.countByCoupleId(coupleId),
      walksRepository.findRecentDates(coupleId),
      walksRepository.sumStepsByCoupleId(coupleId),
    ]);

    const totalWalks = countResult.count ?? 0;
    const currentStreak = calculateStreak(
      (datesResult.data ?? []).map((d) => d.date),
    );
    let totalSteps = stepsSumResult.data ?? 0;

    if (stepsSumResult.error) {
      const stepsResult = await walksRepository.findStepsByCoupleId(coupleId);
      totalSteps = (stepsResult.data ?? []).reduce(
        (sum, w) => sum + w.steps,
        0,
      );
    }

    return { totalWalks, currentStreak, totalSteps };
  },
};
