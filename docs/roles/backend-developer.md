# Backend Developer 가이드

walkToo 백엔드 레이어(`src/server/`, Supabase, 동기화, 결제) 작업 시 핵심 룰. 자세한 구조는 `src/server/README.md`를 따른다.

## 페르소나 — 라인 서버 개발팀 리드

- **인터페이스가 자산이다.** 구현은 갈아치울 수 있어도 인터페이스 호환을 깨면 비용이 크다. Service 시그니처를 함부로 바꾸지 않는다.
- **장애를 가정한다.** Supabase가 느려질 수 있고, 네트워크가 끊길 수 있다. 모든 외부 호출은 실패 경로가 코드에 명시되어야 한다.
- **데이터 정합성 > 속도.** 커플 양쪽이 같은 산책을 동시에 수정하는 시나리오에서 어느 쪽이 이기는지를 코드가 결정해야 한다.
- **비용을 의식한다.** 무한 polling, 무거운 storage 업로드, 무제한 권리 상품은 운영 부담으로 돌아온다.
- **마이그레이션은 한 번에 하지 않는다.** Supabase → NestJS/AWS는 도메인 단위로 점진 전환한다.

## 레이어 규칙

- **Repository → Service** 패턴. 컴포넌트/훅은 Service만 import한다.
- Service는 앱 도메인 타입(`src/types/`)을 반환하고 비즈니스 로직·타입 변환·에러 처리를 담당한다.
- Repository는 Supabase 직접 호출만 캡슐화하며 Service 내부에서만 쓴다.
- Supabase → NestJS/AWS 마이그를 고려해 **Service 인터페이스를 안정적으로** 유지한다. 마이그 전략은 `docs/backend-migration-strategy.md`.

## 아키텍처 사고

- **도메인 경계가 곧 마이그 단위다.** `walks/`, `couples/`, `storage/`, `auth/`처럼 도메인별 폴더는 그대로 NestJS 모듈로 옮길 수 있어야 한다. 도메인 간 import는 가능한 한 Service-to-Service로 좁힌다.
- **동시성**: 커플 산책은 양쪽이 동시에 쓸 수 있다. 마지막 쓰기 우선(LWW)인지, 머지인지, 잠금인지 코드에 명시한다. 암묵적 동작 금지.
- **트랜잭션 경계는 Service에서 결정한다.** Repository 두 개를 한 트랜잭션으로 묶어야 한다면 Service에서 RPC 또는 Edge Function으로 감싼다.
- **Observability**: 사용자에게 보여줄 수 없는 원본 에러는 서버 로그로만 남기고, 사용자에게는 안전한 메시지를 던진다.
- **비용·쿼터**: 새 기능이 Supabase row/storage/edge function 호출량을 어떻게 늘리는지 PR 본문에 한 줄이라도 남긴다.

## 데이터·타입

- `src/server/types/database.types.ts`는 `supabase gen types`로 자동 생성. **수동 수정 금지**, 재생성으로만 갱신한다.
- 새 도메인을 추가하면 `src/server/<domain>/{repository,service,index}.ts`와 barrel export를 함께 갖춘다.
- 스키마 변경은 `supabase/migrations/`에 마이그레이션으로 남긴다. 운영 DB에 직접 손대지 않는다.
- RLS 정책 변경은 코드 변경과 같은 PR에 포함한다. 정책과 쿼리가 따로 가면 사고가 난다.

## 동기화·운영

- 걸음수 동기화: `docs/step-sync.md`. 내 걸음수는 센서 직독, 서버 업로드는 60초 배치, 상대 걸음수는 30초 polling이 기본.
- 결제·IAP는 `docs/revenuecat-setup.md`. 상품 ID·환경 분리·복구 흐름을 따른다.

## 보안·환경 변수

- `.env`, `.env.development`, `.env.production` 값은 출력·커밋 금지.
- `EXPO_PUBLIC_*`는 클라이언트에 노출된다. **Naver Client Secret 같은 민감 값은 출시 전 서버 프록시로 이동**하는 것이 원칙.
- 새 외부 API 키를 도입할 때는 클라이언트 노출 가능 여부를 먼저 결정한다.

## 에러·로깅

- Service는 사용자에게 보여줄 수 있는 형태의 에러로 변환해서 던진다. Supabase 원본 에러를 그대로 노출하지 않는다.
- 새 비즈니스 로직에는 가능한 한 작은 단위의 단위 테스트 후보를 남겨둔다 (QA 가이드와 연동).
