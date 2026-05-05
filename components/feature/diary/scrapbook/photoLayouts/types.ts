import type { DiaryTheme } from '@/styles/diaryThemes';

export interface PhotoLayoutProps {
  theme: DiaryTheme;
  /** 채워진 사진 (최대 4) — 부족한 슬롯은 placeholder 또는 + 추가 버튼 */
  photos: readonly string[];
  /** 사진별 캡션 — 미지정 슬롯은 PLACEHOLDER_CAPTIONS fallback */
  captions?: readonly (string | undefined)[];
  /** 편집 모드 — 빈 슬롯은 + 추가, 채워진 슬롯은 우상단 X */
  editable?: boolean;
  /** 빈 슬롯 누름 (editable=true) — slotIdx는 0~3 */
  onAddPhoto?: (slotIdx: number) => void;
  /** 채워진 슬롯의 X 누름 (editable=true) — slotIdx는 0~3 */
  onRemovePhoto?: (slotIdx: number) => void;
  /** 명언/시 시드 — 보통 산책 날짜 ('YYYY-MM-DD').
   *  dreamy_cloud journal 레이아웃의 손글씨 노트에 사용. */
  quoteSeed?: string;
}
