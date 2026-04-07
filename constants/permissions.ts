import { PermissionConfig, PermissionType } from '@/types/permission';

// ─── Permission Registry ────────────────────────────

/**
 * 앱에서 사용하는 모든 권한의 메타데이터.
 * 사용자 노출 문자열은 i18n(`permission.{type}.{title|description}`)에서 가져온다.
 * 새 권한 추가 시 여기에 항목 하나만 추가하고 locales 키도 함께 업데이트.
 */
export const PERMISSION_CONFIGS: Record<PermissionType, PermissionConfig> = {
  pedometer: {
    type: 'pedometer',
    icon: 'footsteps-outline',
    required: true,
  },
  location: {
    type: 'location',
    icon: 'location-outline',
    required: true,
  },
  notifications: {
    type: 'notifications',
    icon: 'notifications-outline',
    required: false,
  },
};

/** 온보딩 권한 요청 순서 (필수 → 선택) */
export const PERMISSION_ORDER: PermissionType[] = [
  'pedometer',
  'location',
  'notifications',
];
