import type { Coords, ProviderId } from '@/lib/location';

// ─── Footprint Entry (각 사람의 기록) ───────────────────

export interface FootprintEntry {
  id: string;
  userId: string;
  nickname: string;
  memo: string;
  photos: string[];
  /** kind='each'일 때 각자 장소 (회사/카페/집 등). 'together'일 때는 빈 문자열 */
  locationName: string;
  /** 좌표 (옵션) — 지도 마커로 선택했을 때만. 텍스트만 입력 시 undefined */
  locationCoords?: Coords;
  /** 도로명/지번 주소 (옵션) — 검색 결과에서 채워짐 */
  locationAddress?: string;
  /** 어떤 provider에서 picked 됐는지 (naver/google) */
  locationSource?: ProviderId;
  writtenAt: string;
  /** 다이어리 질문 인덱스 (0~14) */
  diaryQuestionId?: number;
  /** 다이어리 질문 답변 */
  diaryAnswer?: string;
  /** 커플 질문 인덱스 (0~59) */
  coupleQuestionId?: number;
  /** 커플 질문 답변 */
  coupleAnswer?: string;
}

// ─── Walk Diary (커플 발자취) ────────────────────────────

/** 하루 기록 종류: 함께 보낸 날 vs 각자의 일상 */
export type WalkKind = 'together' | 'each';

/**
 * 표시용 장소 요약
 * - together: walk.locationName (공용 장소)
 * - each: 내/상대 장소 병기 (둘 다 있으면 "A · B")
 */
export function getWalkLocationSummary(walk: {
  kind: WalkKind;
  locationName: string;
  myEntry?: { locationName: string };
  partnerEntry?: { locationName: string };
}): string {
  if (walk.kind === 'together') return walk.locationName;
  const mine = walk.myEntry?.locationName?.trim() || '';
  const partner = walk.partnerEntry?.locationName?.trim() || '';
  if (mine && partner) return `${mine} · ${partner}`;
  return mine || partner || walk.locationName;
}

export interface WalkDiary {
  id: string;
  coupleId: string;
  date: string;
  locationName: string;
  /** 좌표 — together일 때 walk-level 좌표 (옵션) */
  locationCoords?: Coords;
  /** 주소 (옵션) */
  locationAddress?: string;
  /** Provider attribution */
  locationSource?: ProviderId;
  /** together=함께 보낸 날, each=각자의 하루 */
  kind: WalkKind;
  /** 내 기록 */
  myEntry?: FootprintEntry;
  /** 상대방 기록 */
  partnerEntry?: FootprintEntry;
  /** 둘 다 작성 완료 시 true */
  isRevealed: boolean;
  createdAt: string;
}

// ─── Input ──────────────────────────────────────────────

export interface CreateWalkDiaryInput {
  date: string;
  locationName: string;
  /** 좌표 (옵션) — 검색 결과에서 선택했을 때만 */
  locationCoords?: Coords;
  /** 주소 (옵션) */
  locationAddress?: string;
  /** Provider attribution */
  locationSource?: ProviderId;
  /** together=함께 보낸 날, each=각자의 하루 */
  kind: WalkKind;
  memo: string;
  photos: string[];
  /** 다이어리 질문 */
  diaryQuestionId: number;
  diaryAnswer: string;
  /** 커플 질문 */
  coupleQuestionId: number;
  coupleAnswer: string;
}
