import { type Ionicons } from '@expo/vector-icons';

// ─── Permission Types ───────────────────────────────

/** 앱에서 관리하는 권한 목록 */
export type PermissionType = 'location' | 'pedometer' | 'notifications';

/** iOS·Android 통합 권한 상태 */
export type PermissionStatus =
  | 'undetermined' // 아직 요청하지 않음
  | 'granted' // 허용됨
  | 'denied' // 거부됨 (재요청 가능)
  | 'blocked'; // 영구 거부 (설정에서 직접 변경 필요)

// ─── Permission Config ──────────────────────────────

/** 권한 레지스트리 항목. 사용자 표시 문자열은 i18n에서 가져옴. */
export interface PermissionConfig {
  type: PermissionType;
  icon: keyof typeof Ionicons.glyphMap;
  /** 앱 핵심 기능에 필수인지 여부 */
  required: boolean;
}

// ─── Permission State ───────────────────────────────

/** Store에 저장되는 단일 권한 상태 */
export interface PermissionState {
  status: PermissionStatus;
  lastCheckedAt: number | null;
}

/** 전체 권한 상태 맵 */
export type PermissionStates = Record<PermissionType, PermissionState>;
