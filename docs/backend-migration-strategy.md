# Backend Migration Strategy

walkToo는 현재 Supabase를 직접 백엔드로 사용한다. 다만 코드 구조는 이후 NestJS + AWS로 옮길 수 있도록 `server/` 레이어를 먼저 둔 상태다. 이 문서는 현재 구조 진단, 보완 과제, 그리고 실제 마이그레이션 순서를 정리한다.

## 결론

방향은 맞다. 화면과 훅 대부분은 `@/server` 또는 도메인별 service를 호출하고, `server/README.md`에 적힌 Repository → Service 분리 원칙도 잡혀 있다. 이 구조 덕분에 앱 화면 전체가 Supabase 쿼리 문법에 직접 묶이는 상황은 상당히 피했다.

하지만 아직 "Repository만 교체하면 AWS 백엔드로 전환된다"는 상태는 아니다. 일부 도메인은 Service 안에서 Supabase를 직접 호출하고, 앱 코드 일부도 `@/server/client`를 직접 import한다. 서비스가 잘 되어 백엔드 분리가 필요해질 때를 대비하려면 Supabase 의존성을 더 안쪽으로 밀어 넣는 보완 작업이 필요하다.

## 현재 잘한 점

- `server/` 폴더가 앱 내부 Backend Facade 역할을 한다.
- `auth`, `couples`, `walks`, `storage`, `notifications`는 Service/Repository 패턴이 비교적 잘 분리되어 있다.
- 화면과 React Query hooks는 대부분 Service를 통해 데이터를 가져온다.
- 앱 도메인 타입은 `types/`에 있고, Supabase row 타입은 `server/types/database.types.ts`에 있어 방향성이 좋다.
- Supabase Auth 세션 저장은 `server/client.ts`에서 Expo SecureStore adapter로 캡슐화되어 있다.
- `server/API.md`에 REST API 전환 후의 endpoint 초안이 이미 있다.
- `supabase/schema.sql`이 idempotent 형태라 초기 AWS PostgreSQL 스키마 이관 기준점으로 쓸 수 있다.

## 현재 부족한 점

### 1. 일부 Service가 Supabase를 직접 호출한다

아래 파일은 Repository 없이 Service에서 `supabase.from()` 또는 `supabase.rpc()`를 직접 사용한다.

- `server/daily-steps/daily-steps.service.ts`
- `server/reflections/reflections.service.ts`
- `server/schedules/schedules.service.ts`
- `server/memory-stamps/memory-stamps.service.ts`
- `server/entitlements/entitlements.service.ts`
- `server/packs/packs.service.ts`

이 상태에서는 NestJS/API 전환 시 Service까지 같이 고쳐야 한다. 단기적으로는 동작에 문제 없지만, 마이그레이션 비용을 낮추려면 각 도메인에 Repository를 추가하는 편이 좋다.

### 2. 앱 코드가 Supabase client를 직접 import하는 곳이 있다

- `app/login.tsx`
- `hooks/useBackgroundStepSync.ts`
- `server/index.ts`의 `export { supabase } from './client'`

`app/login.tsx`는 Google web OAuth fallback에서 `supabase.auth.signInWithOAuth()`와 `exchangeCodeForSession()`을 직접 호출한다. 이 로직은 `authService` 또는 `authRepository`로 이동시키는 것이 좋다.

`hooks/useBackgroundStepSync.ts`는 백그라운드 task 안에서 Supabase auth와 `daily_steps` upsert를 직접 수행한다. 최소한 현재 유저 조회는 `authService`, 걸음수 저장은 `dailyStepsService`를 통해 호출하게 바꾸는 것이 좋다.

`server/index.ts`에서 `supabase`를 공개 export하면 이후 코드에서 Supabase 직접 접근이 퍼질 수 있다. 디버깅 목적이 아니라면 공개 export를 제거하거나 `server/client.ts`를 내부 전용으로 취급한다.

### 3. Supabase RPC에 비즈니스 로직이 많이 들어가 있다

현재 RPC는 RLS 우회와 원자적 처리를 위해 유용하다. 다만 장기적으로 NestJS로 옮길 때는 다음 함수들이 API/service 로직으로 이전 대상이다.

- `get_partner_steps`
- `get_or_create_reflection`
- `save_reflection_answers`
- `get_reflection_progress`
- `get_total_stamps`
- `claim_memory_stamp`
- `start_trial_if_needed`
- `mark_premium_purchased`
- `mark_pack_purchased`

RPC는 지금은 괜찮지만, 마이그레이션 시 "Postgres 함수에 남길 로직"과 "NestJS service로 옮길 로직"을 분리해야 한다.

### 4. RLS가 인증/권한의 중심이다

Supabase에서는 RLS가 안전장치 역할을 한다. NestJS + AWS로 옮기면 RLS와 같은 권한 검사를 API guard/service에서 직접 구현해야 한다.

예를 들어 "같은 커플의 데이터만 접근 가능", "본인 엔트리만 수정 가능", "커플 중 한 명이 구매하면 양쪽에 권한 부여" 같은 규칙은 NestJS guard, policy 함수, service invariant로 옮겨야 한다.

### 5. Storage URL 모델이 Supabase Storage에 묶여 있다

`storageService`가 업로드 자체는 캡슐화하고 있지만, photo URL이 public URL 형태로 앱 데이터에 저장된다. S3/CloudFront로 옮길 때 URL 형식이 바뀔 수 있다.

장기적으로는 DB에는 절대 public URL보다 object key를 저장하고, 앱에는 API나 CDN base URL을 통해 URL을 만들어 주는 방식이 더 유리하다.

## 먼저 해두면 좋은 보완 작업

마이그레이션을 지금 시작하지 않더라도 아래는 서비스 성장 전에 해두면 비용이 낮다.

1. `server/index.ts`에서 `supabase` 공개 export 제거
2. `app/login.tsx`의 web OAuth 직접 호출을 `authService`로 이동
3. `hooks/useBackgroundStepSync.ts`의 direct Supabase upsert를 `dailyStepsService`로 이동
4. Repository 없는 도메인에 Repository 추가
5. Supabase RPC 목록을 `server/API.md` 또는 별도 문서에 "API 전환 대상"으로 정리
6. 각 Service 메서드의 input/output 타입을 명시적으로 export
7. Storage는 새 저장부터 `photoKey` 또는 `objectKey` 중심으로 저장하는 방향 검토
8. `server/API.md`를 실제 앱 Service 메서드 기준으로 최신화

## 권장 목표 구조

현재 앱 내부 구조:

```txt
app/components/hooks
  -> hooks/services/*
  -> server/*Service
  -> server/*Repository
  -> Supabase client
```

마이그레이션 전 준비 완료 구조:

```txt
app/components/hooks
  -> hooks/services/*
  -> server/*Service
  -> server/*Repository interface
  -> Supabase repository implementation
```

AWS 전환 후 구조:

```txt
app/components/hooks
  -> hooks/services/*
  -> server/*Service
  -> HTTP API client repository
  -> NestJS API on AWS
  -> RDS/S3/etc.
```

핵심은 앱 화면과 React Query hook을 바꾸지 않고, `server/` 내부 구현만 교체하는 것이다.

## AWS 목표 아키텍처

초기 AWS 전환 시 과하게 복잡하게 시작하지 않는다.

```txt
Mobile App
  -> HTTPS
CloudFront / Route 53
  -> ALB or API Gateway
NestJS API
  -> RDS PostgreSQL
  -> S3 + CloudFront
  -> ElastiCache Redis (필요 시)
  -> EventBridge / SQS (비동기 작업)
  -> SES/SNS/Expo Push Provider
```

권장 선택:

- API: NestJS
- Compute: App Runner 또는 ECS Fargate
- DB: RDS PostgreSQL
- File: S3 + CloudFront
- Secrets: AWS Secrets Manager or SSM Parameter Store
- Async jobs: EventBridge Scheduler + SQS
- Observability: CloudWatch Logs, metrics, alarms
- IaC: Terraform, AWS CDK, or SST 중 하나로 고정

처음부터 EKS는 필요 없다. 운영 복잡도 대비 이득이 작다.

## 단계별 마이그레이션 계획

### Phase 0. 현재 Supabase 운영 안정화

목표: 지금 제품을 빠르게 검증하되, 나중에 발목 잡을 결합만 줄인다.

- direct Supabase import를 `server/` 내부로 제한
- Repository 없는 Service에 Repository 추가
- 모든 Service 메서드의 request/response 타입을 명시
- `server/API.md`를 현재 Service 기능과 맞춘다
- Supabase SQL 함수, trigger, RLS 정책을 목록화한다
- DB schema는 `supabase/schema.sql` 하나로 재현 가능하게 유지한다

완료 기준:

- `app/`, `components/`, `hooks/`에서 `@/server/client` import가 없다
- `server/client.ts`는 repository 구현에서만 import한다
- `rg "supabase\\." app components hooks` 결과가 0에 가깝다

### Phase 1. API 계약 고정

목표: 실제 NestJS를 만들기 전에 앱이 기대하는 계약을 고정한다.

- `server/API.md`를 OpenAPI로 승격하거나, 최소한 endpoint별 request/response를 최신화한다
- 기존 Service 메서드를 API endpoint와 1:1 또는 기능 단위로 매핑한다
- 에러 코드를 통일한다: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `VALIDATION_ERROR`
- pagination, date range, timezone 기준을 문서화한다
- file upload 정책을 정한다: API proxy upload vs presigned URL

완료 기준:

- 앱의 모든 Service 메서드가 REST endpoint로 표현 가능하다
- RPC가 담당하던 작업의 새 API 위치가 정해져 있다

### Phase 2. NestJS 백엔드 병행 구축

목표: Supabase와 같은 PostgreSQL schema를 대상으로 NestJS API를 먼저 만든다.

- NestJS 프로젝트 생성
- 모듈 구조:
  - `auth`
  - `users`
  - `couples`
  - `walks`
  - `daily-steps`
  - `reflections`
  - `schedules`
  - `notifications`
  - `entitlements`
  - `storage`
- ORM은 Prisma 또는 Drizzle 중 하나로 고정한다
- Supabase RLS 정책을 NestJS guard/policy로 재구현한다
- Supabase RPC는 NestJS service transaction으로 옮긴다
- RevenueCat webhook은 서버에서 처리하도록 추가한다

완료 기준:

- Supabase DB를 그대로 바라보는 NestJS API가 staging에서 동작한다
- 모바일 앱은 feature flag로 Supabase repository와 HTTP repository를 바꿀 수 있다

### Phase 3. Dual Read / Shadow Write

목표: 전환 전 데이터 정합성을 검증한다.

선택지는 두 가지다.

1. 같은 Supabase Postgres를 NestJS가 직접 읽고 쓰는 방식
   - 전환 검증이 가장 쉽다
   - DB 이전은 뒤로 미룬다

2. Supabase Postgres에서 RDS PostgreSQL로 복제하는 방식
   - AWS 전환까지 한 번에 검증 가능하다
   - 운영 난이도는 더 높다

권장 순서:

- 먼저 NestJS가 Supabase Postgres를 바라보게 한다
- 앱 일부 기능만 HTTP repository로 전환한다
- 로그로 Supabase 직접 결과와 API 결과를 비교한다
- 문제가 없으면 RDS 복제를 별도 단계로 진행한다

완료 기준:

- 핵심 화면 조회 결과가 Supabase 직접 호출과 API 호출에서 동일하다
- 쓰기 작업의 race condition, 권한 체크, transaction 처리가 검증됐다

### Phase 4. DB 이전

목표: Supabase PostgreSQL에서 RDS PostgreSQL로 무중단 또는 짧은 점검 전환을 수행한다.

- RDS PostgreSQL 생성
- schema 적용
- extension, index, constraint, trigger, function 확인
- 초기 데이터 dump/restore
- 증분 복제는 AWS DMS 또는 logical replication 검토
- 전환 직전 쓰기 동결 또는 maintenance window 설정
- sequence, UUID, timezone, enum/check constraint 확인
- RLS 의존 로직은 API guard로 대체했는지 확인

완료 기준:

- RDS에서 NestJS API 전체 테스트 통과
- 데이터 count, foreign key integrity, 핵심 aggregate 값이 일치한다
- rollback 계획이 문서화되어 있다

### Phase 5. Storage 이전

목표: Supabase Storage에서 S3 + CloudFront로 파일을 옮긴다.

- 기존 photo URL 목록 추출
- S3 bucket 구조 설계: `couples/{coupleId}/walks/{walkId}/...`
- 객체 복사
- DB의 photo URL을 object key 또는 CloudFront URL로 변환
- 새 업로드는 S3 presigned URL 또는 API upload endpoint 사용
- CloudFront cache policy와 signed URL 필요 여부 결정

완료 기준:

- 기존 다이어리 사진이 새 CDN에서 정상 표시된다
- 신규 업로드/삭제가 S3 기준으로 동작한다

### Phase 6. Auth 이전

Auth는 가장 조심해서 옮긴다. 가능하면 DB/API 이전 후 마지막에 진행한다.

선택지:

1. Supabase Auth 유지
   - 가장 안정적
   - NestJS는 Supabase JWT를 검증
   - 초기 AWS 전환에서는 이 방식을 권장

2. Cognito 또는 자체 Auth로 이전
   - 장기 독립성은 높음
   - 사용자 migration, 소셜 로그인, refresh token, 계정 복구를 모두 새로 검증해야 함

권장:

- 1차 AWS 전환에서는 Supabase Auth를 유지한다
- 이후 비용/운영/정책상 필요할 때 Cognito 또는 자체 Auth 이전을 별도 프로젝트로 분리한다

완료 기준:

- 기존 사용자가 재로그인 또는 세션 갱신으로 자연스럽게 전환된다
- Apple/Google 로그인 redirect URI가 새 도메인에서 검증됐다

### Phase 7. Cutover

목표: 앱이 Supabase repository 대신 HTTP API repository를 기본 사용하게 한다.

- 앱에 API base URL env 추가
- remote config 또는 feature flag로 사용자 일부만 전환
- 에러율, latency, DB connection, push/notification 처리 확인
- 점진적으로 10% → 50% → 100% 전환
- Supabase 직접 쓰기는 read-only 또는 fallback 전용으로 축소

완료 기준:

- 새 API 경로에서 핵심 플로우가 안정적으로 동작한다
- Supabase direct path를 제거해도 앱이 동작한다

## 도메인별 이전 메모

### Auth

- 현재 Supabase Auth 의존도가 높다.
- web OAuth fallback 직접 호출은 `authService`로 이동한다.
- NestJS 초기 버전은 Supabase JWT 검증 방식으로 시작한다.

### Couples / Profiles

- Repository 분리가 잘 되어 있다.
- 초대코드 생성은 random collision 대응이 약하므로 DB unique violation 재시도 로직을 추가하면 좋다.
- 연결/해제는 transaction으로 묶어야 한다.

### Walks / Entries

- 핵심 도메인이고 구조가 가장 중요하다.
- 생성, entry 추가, reveal 처리는 transaction으로 옮겨야 한다.
- 알림 발송은 API transaction 이후 async event로 분리하는 것이 좋다.

### Daily Steps

- 현재 Service에서 Supabase 직접 upsert한다.
- `daily-steps.repository.ts`를 추가한다.
- background sync에서도 같은 service/repository를 재사용한다.
- Android/iOS 날짜 기준을 API와 맞춰야 한다.

### Reflections

- RPC 의존도가 높다.
- `get_or_create_reflection`, `save_reflection_answers`, `get_reflection_progress`는 NestJS transaction + policy로 이전한다.

### Entitlements / Packs

- RevenueCat 결과를 클라이언트 RPC에만 의존하면 race condition과 위변조 검증이 약하다.
- AWS/NestJS 전환 전에도 RevenueCat webhook을 서버에서 받아 DB를 갱신하는 구조가 좋다.

### Notifications

- 저장은 Repository로 분리되어 있다.
- 실제 push 전송은 서버 비동기 작업으로 옮기는 것이 좋다.
- API 전환 후에는 앱이 직접 상대방 알림을 생성하기보다 서버 이벤트에서 생성하게 한다.

### Storage

- 현재 Storage service가 있어 전환 지점은 좋다.
- 장기적으로 DB에는 URL보다 object key 저장을 권장한다.

## 마이그레이션 전 체크리스트

- [ ] `app/`, `components/`, `hooks/`에서 Supabase client 직접 import 제거
- [ ] 모든 도메인에 Repository 또는 API client adapter 추가
- [ ] `server/API.md` 최신화
- [ ] Supabase RPC 목록과 대체 NestJS service 메서드 매핑
- [ ] RLS 정책을 API authorization policy로 매핑
- [ ] Storage object key 전략 결정
- [ ] RevenueCat webhook 서버 처리 추가
- [ ] DB dump/restore 리허설
- [ ] rollback 계획 작성
- [ ] 앱 feature flag로 Supabase/API 경로 전환 가능하게 구성

## 판단 기준

지금 당장 AWS로 옮길 필요는 없다. Supabase로 빠르게 제품 검증을 하는 선택은 합리적이다. 다만 서비스가 잘 될 가능성에 대비한 "확장가능한 바이브코딩"이라고 보려면, Supabase 의존성이 앱 화면과 hook으로 새지 않게 계속 관리해야 한다.

가장 중요한 기준은 이거다.

> 앱 화면은 Supabase를 몰라야 한다. 앱 화면은 walkToo 도메인 Service만 알아야 한다.

이 기준을 지키면 AWS/NestJS 전환은 큰 재작성보다 adapter 교체와 서버 구현 프로젝트에 가까워진다.
