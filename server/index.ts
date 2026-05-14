// ─── Server Layer Barrel Export ─────────────────────────
//
// 사용법: import { authService, walksService } from '@/server';
//
// 레이어 구조 (NestJS 스타일):
//   Repository → Supabase 직접 호출 (데이터 접근)
//   Service    → 비즈니스 로직 (변환, 검증, 에러 처리)
//
// 컴포넌트/훅에서는 항상 Service만 import하세요.
// Repository는 Service 내부에서만 사용합니다.

export { authService } from './auth';
export { walksService } from './walks';
export { couplesService } from './couples';
export { storageService } from './storage';
export { notificationsService } from './notifications';
export { memoryStampsService } from './memory-stamps';
export { reflectionsService } from './reflections';
export { entitlementsService } from './entitlements';
export type { EntitlementStatus } from './entitlements';

// Supabase client (직접 접근이 필요한 경우)
export { supabase } from './client';
