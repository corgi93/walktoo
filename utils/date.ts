/**
 * 날짜/로케일 유틸 (TZ-safe + i18n 인지)
 *
 * 핵심 원칙:
 * - "YYYY-MM-DD" 문자열은 절대 `new Date(str)`로 파싱하지 않는다 (UTC로 해석되어 음수 TZ에서 하루 밀림)
 * - 화면 표시 포맷팅은 i18next.language 기준
 * - "오늘"의 정의는 디바이스 로컬 시간대 기준
 */

import i18n from '@/lib/i18n';

// ─── 파싱 ────────────────────────────────────────────────

/**
 * "YYYY-MM-DD" 문자열을 로컬 자정으로 안전하게 파싱.
 * `new Date('2026-04-07')`는 UTC 자정으로 해석되어 음수 오프셋 TZ에서
 * `getDate()`가 6을 반환할 수 있다. 이 함수는 항상 로컬 자정을 보장한다.
 */
export const parseLocalDate = (yyyyMmDd: string): Date => {
  const [year, month, day] = yyyyMmDd.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
};

// ─── 오늘 ────────────────────────────────────────────────

/**
 * 디바이스 로컬 타임존 기준 "오늘"을 "YYYY-MM-DD" 형태로 반환.
 */
export const getLocalToday = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// ─── 포맷팅 ──────────────────────────────────────────────

/**
 * Intl.DateTimeFormat을 i18next 현재 언어로 호출.
 * `Date | string` 모두 받음. 문자열일 경우 `parseLocalDate`를 거친다.
 */
export const formatDate = (
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {},
): string => {
  const d = typeof date === 'string' ? parseLocalDate(date) : date;
  // i18next.language는 'ko', 'en', 'ja' 등 ISO 639-1 코드.
  // Intl은 'ko-KR' 같은 BCP 47도 받지만, 단순 코드로도 충분.
  return new Intl.DateTimeFormat(i18n.language || 'ko', options).format(d);
};

/**
 * 현재 로케일로 숫자를 천단위 포맷.
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat(i18n.language || 'ko').format(value);
};

// ─── 도메인 헬퍼 ────────────────────────────────────────

/**
 * 디데이 ("D+N") — i18n 키 home:dday.format을 사용해 다국어 대응.
 * 음수가 나오면 0으로 고정.
 */
export const formatDday = (startDate: string): string => {
  const start = parseLocalDate(startDate);
  const now = new Date();
  // 두 날짜 모두 로컬 자정 기준으로 정규화 후 일수 차이 계산
  const startMid = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const nowMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.max(
    0,
    Math.floor((nowMid.getTime() - startMid.getTime()) / 86_400_000),
  );
  return i18n.t('home:dday.format', { days: diff });
};

/**
 * 걸음수 천단위 포맷 (현재 로케일).
 */
export const formatSteps = (steps: number): string => {
  return formatNumber(steps);
};

// ─── 월 네비게이션 / 그리드 헬퍼 ─────────────────────────

/**
 * 해당 연/월의 일수. month는 1-based (1~12).
 */
export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month, 0).getDate();
};

/**
 * 해당 월 1일의 요일. 0=일요일, 6=토요일.
 */
export const getFirstDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month - 1, 1).getDay();
};

/**
 * "2026-04" 형태의 월 키. 캐시/비교 용도.
 */
export const getMonthKey = (year: number, month: number): string => {
  return `${year}-${String(month).padStart(2, '0')}`;
};

/**
 * 현재 연/월 (디바이스 로컬).
 */
export const getCurrentYearMonth = (): { year: number; month: number } => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
};

/**
 * 주어진 연/월에 delta 만큼 월을 더한다. 음수 delta도 OK.
 * 반환된 month는 1-based.
 */
export const addMonths = (
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } => {
  const base = new Date(year, month - 1 + delta, 1);
  return { year: base.getFullYear(), month: base.getMonth() + 1 };
};

/**
 * 월의 첫날 / 마지막날을 "YYYY-MM-DD" 문자열로 반환.
 * Supabase `date BETWEEN` 쿼리에 사용.
 */
export const getMonthRange = (
  year: number,
  month: number,
): { start: string; end: string } => {
  const lastDay = getDaysInMonth(year, month);
  const mm = String(month).padStart(2, '0');
  return {
    start: `${year}-${mm}-01`,
    end: `${year}-${mm}-${String(lastDay).padStart(2, '0')}`,
  };
};
