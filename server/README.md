# server/ — 백엔드 레이어

PairWalk의 서버 통신 레이어입니다. NestJS 스타일의 **Repository → Service** 패턴을 사용합니다.

## 구조

```
server/
├── client.ts                     # Supabase 클라이언트 초기화
├── index.ts                      # barrel export
│
├── auth/                         # 인증 도메인
│   ├── auth.repository.ts        #   └ Supabase Auth API 직접 호출
│   ├── auth.service.ts           #   └ 로그인/회원가입 비즈니스 로직
│   └── index.ts
│
├── walks/                        # 산책/발자취 도메인
│   ├── walks.repository.ts       #   └ walks, footprint_entries 테이블 쿼리
│   ├── walks.service.ts          #   └ 산책 CRUD, reveal 로직
│   └── index.ts
│
├── couples/                      # 커플 도메인
│   ├── couples.repository.ts     #   └ couples, profiles 테이블 쿼리
│   ├── couples.service.ts        #   └ 초대코드, 커플연결, 프로필 관리
│   └── index.ts
│
├── storage/                      # 파일 스토리지
│   ├── storage.repository.ts     #   └ Supabase Storage API 직접 호출
│   ├── storage.service.ts        #   └ 사진 업로드/삭제
│   └── index.ts
│
└── types/
    └── database.types.ts         # supabase gen types 자동 생성
```

## 레이어 규칙

```
  화면/훅 (app/, hooks/)
        │
        ▼
  ┌─────────────┐
  │   Service    │  ← 비즈니스 로직, 타입 변환, 에러 처리
  └──────┬──────┘
         │
  ┌──────▼──────┐
  │ Repository  │  ← Supabase 직접 호출 (순수 데이터 접근)
  └─────────────┘
```

- **Service**: 컴포넌트/훅에서 import하는 유일한 레이어. 앱 도메인 타입(`types/`)을 반환합니다.
- **Repository**: Service 내부에서만 사용. Supabase 응답 타입을 그대로 반환합니다.

```typescript
// ✅ 올바른 사용
import { walksService } from '@/server';
const walks = await walksService.getList(coupleId, userId);

// ❌ 컴포넌트에서 repository 직접 호출 금지
import { walksRepository } from '@/server/walks';
```

## 환경 변수

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## DB 타입 자동 생성

```bash
npx supabase gen types typescript \
  --project-id <your-project-id> \
  > server/types/database.types.ts
```

---

## 마이그레이션 전략: Supabase → NestJS + AWS

### Phase 1: 현재 (Supabase)

- MAU 0 ~ 50만까지 Supabase Pro로 운영
- `server/` 레이어가 Supabase 의존성을 캡슐화
- 컴포넌트/훅은 Service 인터페이스에만 의존

### Phase 2: 전환 결정 시점

다음 중 하나에 해당하면 마이그레이션을 검토합니다:

- MAU 50만 이상 (Supabase Team 플랜 필요)
- 복잡한 서버사이드 로직 (결제, 배치 처리 등)
- 멀티 리전 배포 필요

### Phase 3: 마이그레이션 실행

```
[Supabase]                    [AWS]

Auth         ──pg_dump──→     NestJS + Passport (JWT)
PostgreSQL   ──AWS DMS──→     RDS PostgreSQL
Storage      ──s3 sync──→     S3
Realtime     ──────────→      WebSocket (Socket.io)
Edge Func    ──────────→      Lambda
RLS          ──────────→      NestJS Guards
```

#### 단계별 진행

1. **DB 마이그레이션** (다운타임 최소)
   - AWS DMS로 실시간 복제 설정
   - 복제 완료 후 DNS 컷오버

2. **백엔드 서버 구축**
   - NestJS 프로젝트 생성 (별도 레포)
   - 동일한 도메인별 Module/Service/Repository 구조
   - REST API 엔드포인트 구현

3. **프론트 전환** (변경 최소화)
   - `server/client.ts`만 Supabase → axios/fetch로 교체
   - Repository 레이어만 수정 (Supabase 쿼리 → REST API 호출)
   - **Service 인터페이스 유지 → 컴포넌트 변경 0**

4. **Auth 전환**
   - Supabase Auth → NestJS + Passport
   - 기존 비밀번호 해시(bcrypt) export 가능
   - SecureStore 토큰 관리 로직은 그대로 유지

5. **Storage 전환**
   - Supabase Storage (S3 호환) → AWS S3 직접 사용
   - URL 형식만 변경, 업로드 로직 동일

### 핵심 원칙

> **Repository만 바꾸면 된다.**
>
> Service 인터페이스가 동일하므로 컴포넌트/훅 코드는 변경하지 않습니다.
> 이것이 레이어를 나누는 이유입니다.
