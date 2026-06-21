# walkToo API Specification

> **Base URL**: Supabase 직접 호출 (현재) → `https://api.walktoo.app/v1` (NestJS 마이그레이션 후)
>
> **인증**: `Authorization: Bearer <access_token>` (Supabase JWT)
>
> **공통 에러 응답**:
> ```json
> { "error": { "code": "NOT_FOUND", "message": "리소스를 찾을 수 없습니다" } }
> ```

---

## 1. Auth — 인증

### `POST /auth/signup`

회원가입 + 프로필 생성

**Request**
```json
{
  "email": "user@example.com",
  "password": "securePass123",
  "nickname": "산책러",
  "phone": "010-1234-5678"
}
```

**Response** `201 Created`
```json
{
  "user": {
    "id": "uuid-user-1",
    "email": "user@example.com"
  },
  "profile": {
    "id": "uuid-user-1",
    "nickname": "산책러",
    "phone": "010-1234-5678",
    "profileImageUrl": null,
    "coupleId": null,
    "totalWalks": 0,
    "totalSteps": 0,
    "createdAt": "2026-03-15T09:00:00Z",
    "updatedAt": "2026-03-15T09:00:00Z"
  },
  "session": {
    "accessToken": "eyJ...",
    "refreshToken": "abc..."
  }
}
```

| Status | 설명 |
|--------|------|
| `201` | 가입 성공 |
| `409` | 이미 존재하는 이메일 |
| `422` | 유효하지 않은 입력 (비밀번호 6자 미만 등) |

---

### `POST /auth/signin`

로그인

**Request**
```json
{
  "email": "user@example.com",
  "password": "securePass123"
}
```

**Response** `200 OK`
```json
{
  "user": {
    "id": "uuid-user-1",
    "email": "user@example.com"
  },
  "session": {
    "accessToken": "eyJ...",
    "refreshToken": "abc...",
    "expiresAt": 1710500400
  }
}
```

| Status | 설명 |
|--------|------|
| `200` | 로그인 성공 |
| `401` | 이메일 또는 비밀번호 불일치 |

---

### `POST /auth/signout`

로그아웃 (세션 무효화)

🔒 **인증 필요**

**Response** `204 No Content`

---

### `GET /auth/session`

현재 세션 확인

🔒 **인증 필요**

**Response** `200 OK`
```json
{
  "session": {
    "accessToken": "eyJ...",
    "refreshToken": "abc...",
    "expiresAt": 1710500400,
    "user": {
      "id": "uuid-user-1",
      "email": "user@example.com"
    }
  }
}
```

| Status | 설명 |
|--------|------|
| `200` | 유효한 세션 |
| `401` | 만료/무효 세션 |

---

## 2. Users — 프로필

### `GET /users/me`

내 프로필 조회

🔒 **인증 필요**

**Response** `200 OK`
```json
{
  "id": "uuid-user-1",
  "nickname": "산책러",
  "phone": "010-1234-5678",
  "profileImageUrl": "https://storage.walktoo.app/avatars/uuid-user-1.jpg",
  "coupleId": "uuid-couple-1",
  "partnerNickname": "자기",
  "totalWalks": 12,
  "totalSteps": 84200,
  "createdAt": "2026-01-15T09:00:00Z",
  "updatedAt": "2026-03-15T09:00:00Z"
}
```

---

### `PATCH /users/me`

프로필 수정 (부분 업데이트)

🔒 **인증 필요**

**Request**
```json
{
  "nickname": "걷기왕",
  "phone": "010-9876-5432",
  "profileImageUrl": "https://storage.walktoo.app/avatars/new.jpg"
}
```

> 모든 필드 선택적 — 변경할 필드만 포함

**Response** `200 OK`
```json
{
  "id": "uuid-user-1",
  "nickname": "걷기왕",
  "phone": "010-9876-5432",
  "profileImageUrl": "https://storage.walktoo.app/avatars/new.jpg",
  "coupleId": "uuid-couple-1",
  "totalWalks": 12,
  "totalSteps": 84200,
  "createdAt": "2026-01-15T09:00:00Z",
  "updatedAt": "2026-03-15T10:30:00Z"
}
```

---

## 3. Couples — 커플

### `POST /couples/invite`

초대코드 생성 (커플 만들기)

🔒 **인증 필요**

**Response** `201 Created`
```json
{
  "coupleId": "uuid-couple-1",
  "inviteCode": "A3X9K2"
}
```

| Status | 설명 |
|--------|------|
| `201` | 초대코드 생성 성공 |
| `409` | 이미 커플 연결된 유저 |

---

### `POST /couples/join`

초대코드로 커플 연결

🔒 **인증 필요**

**Request**
```json
{
  "inviteCode": "A3X9K2"
}
```

**Response** `200 OK`
```json
{
  "coupleId": "uuid-couple-1"
}
```

| Status | 설명 |
|--------|------|
| `200` | 커플 연결 성공 |
| `400` | 본인의 초대코드 |
| `404` | 유효하지 않은 초대코드 |
| `409` | 이미 커플 연결된 유저 |

---

### `GET /couples/:coupleId`

커플 프로필 조회 (통계 포함)

🔒 **인증 필요**

**Response** `200 OK`
```json
{
  "id": "uuid-couple-1",
  "user1": {
    "id": "uuid-user-1",
    "nickname": "산책러",
    "profileImageUrl": "https://storage.walktoo.app/avatars/user1.jpg"
  },
  "user2": {
    "id": "uuid-user-2",
    "nickname": "자기",
    "profileImageUrl": null
  },
  "startDate": "2026-01-20",
  "totalWalks": 12,
  "currentStreak": 5
}
```

---

### `GET /couples/:coupleId/stats`

커플 산책 통계

🔒 **인증 필요**

**Response** `200 OK`
```json
{
  "totalWalks": 12,
  "totalSteps": 84200,
  "currentStreak": 5
}
```

---

### `DELETE /couples/:coupleId`

커플 연결 해제

🔒 **인증 필요**

**Request**
```json
{
  "user1Id": "uuid-user-1",
  "user2Id": "uuid-user-2"
}
```

**Response** `204 No Content`

| Status | 설명 |
|--------|------|
| `204` | 해제 성공 |
| `403` | 본인 커플이 아님 |

---

## 4. Walks — 산책 (발자취)

### `GET /walks`

산책 목록 조회 (페이지네이션)

🔒 **인증 필요**

**Query Parameters**

| Param | Type | Required | Default | 설명 |
|-------|------|----------|---------|------|
| `coupleId` | string | ✅ | — | 커플 ID |
| `page` | number | — | `1` | 페이지 번호 |
| `limit` | number | — | `20` | 페이지 크기 |

**Response** `200 OK`
```json
[
  {
    "id": "uuid-walk-1",
    "coupleId": "uuid-couple-1",
    "date": "2026-03-15",
    "locationName": "한강공원 여의도",
    "steps": 8420,
    "myEntry": {
      "userId": "uuid-user-1",
      "nickname": "산책러",
      "memo": "날씨가 너무 좋아서 한강까지 걸었다 🍗",
      "photos": [
        "https://storage.walktoo.app/footprints/couple1/walk1/001.jpg"
      ],
      "writtenAt": "2026-03-15T18:30:00Z"
    },
    "partnerEntry": {
      "userId": "uuid-user-2",
      "nickname": "자기",
      "memo": "오늘 한강 너무 좋았어~ 😋",
      "photos": [
        "https://storage.walktoo.app/footprints/couple1/walk1/002.jpg"
      ],
      "writtenAt": "2026-03-15T19:00:00Z"
    },
    "isRevealed": true,
    "createdAt": "2026-03-15T18:30:00Z"
  },
  {
    "id": "uuid-walk-2",
    "coupleId": "uuid-couple-1",
    "date": "2026-03-14",
    "locationName": "경복궁",
    "steps": 6210,
    "myEntry": {
      "userId": "uuid-user-1",
      "nickname": "산책러",
      "memo": "한복 입고 산책했는데 너무 더웠다 ㅋㅋ",
      "photos": [],
      "writtenAt": "2026-03-14T15:00:00Z"
    },
    "partnerEntry": null,
    "isRevealed": false,
    "createdAt": "2026-03-14T15:00:00Z"
  }
]
```

> `isRevealed: false`일 때 `partnerEntry`는 `null` — 클라이언트에서 "상대방이 아직 작성하지 않았어요" 표시

---

### `GET /walks/:id`

산책 상세 조회

🔒 **인증 필요**

**Response** `200 OK` — 단일 산책 객체 (목록과 동일한 구조)

---

### `POST /walks`

산책 생성 + 내 발자취 엔트리

🔒 **인증 필요**

**Request**
```json
{
  "date": "2026-03-15",
  "locationName": "서울숲",
  "steps": 5430,
  "memo": "벚꽃이 피기 시작했다 🌸",
  "photos": [
    "https://storage.walktoo.app/footprints/couple1/walk3/001.jpg"
  ]
}
```

**Response** `201 Created`
```json
{
  "walkId": "uuid-walk-3"
}
```

> 사진은 먼저 `POST /storage/photos`로 업로드 후 URL을 전달합니다.

| Status | 설명 |
|--------|------|
| `201` | 생성 성공 |
| `400` | 필수 필드 누락 |
| `403` | 커플 미연결 |

---

### `POST /walks/:walkId/entries`

발자취 엔트리 추가 (상대방 작성)

🔒 **인증 필요**

**Request**
```json
{
  "memo": "나도 서울숲 좋았어! 사슴이 귀여웠다 🦌",
  "photos": [
    "https://storage.walktoo.app/footprints/couple1/walk3/002.jpg"
  ]
}
```

**Response** `201 Created`
```json
{
  "isRevealed": true
}
```

> 둘 다 작성 완료 시 `isRevealed: true`로 자동 변경 — 서로의 발자취가 공개됩니다.

| Status | 설명 |
|--------|------|
| `201` | 엔트리 추가 성공 |
| `400` | 이미 작성한 엔트리 |
| `404` | 산책을 찾을 수 없음 |

---

### `DELETE /walks/:id`

산책 삭제

🔒 **인증 필요**

**Response** `204 No Content`

| Status | 설명 |
|--------|------|
| `204` | 삭제 성공 |
| `403` | 삭제 권한 없음 |
| `404` | 산책을 찾을 수 없음 |

---

## 5. Storage — 파일 업로드

### `POST /storage/photos`

발자취 사진 업로드 (멀티파일)

🔒 **인증 필요**

**Request** `multipart/form-data`

| Field | Type | Required | 설명 |
|-------|------|----------|------|
| `coupleId` | string | ✅ | 커플 ID |
| `walkId` | string | ✅ | 산책 ID (또는 임시 ID) |
| `photos` | File[] | ✅ | 이미지 파일 (최대 5장, 10MB/장) |

**Response** `201 Created`
```json
{
  "urls": [
    "https://storage.walktoo.app/footprints/couple1/walk3/1710500400_0.jpg",
    "https://storage.walktoo.app/footprints/couple1/walk3/1710500400_1.jpg"
  ]
}
```

> 저장 경로: `{coupleId}/{walkId}/{timestamp}_{index}.{ext}`

---

### `DELETE /storage/photos`

사진 삭제

🔒 **인증 필요**

**Request**
```json
{
  "url": "https://storage.walktoo.app/footprints/couple1/walk3/1710500400_0.jpg"
}
```

**Response** `204 No Content`

---

## 데이터 모델

### UserResponse (프로필)
```
id            string      UUID
nickname      string      닉네임
phone         string      전화번호
profileImageUrl  string?  프로필 사진 URL
coupleId      string?     연결된 커플 ID
partnerNickname  string?  상대방 닉네임
totalWalks    number      총 산책 횟수
totalSteps    number      총 걸음수
createdAt     string      ISO 8601
updatedAt     string      ISO 8601
```

### CoupleProfile
```
id            string      UUID
user1         CouplePartner
user2         CouplePartner
startDate     string      커플 시작일 (YYYY-MM-DD)
totalWalks    number      총 산책 횟수 (집계)
currentStreak number      연속 산책 일수
```

### CouplePartner
```
id            string      UUID
nickname      string      닉네임
profileImageUrl  string?  프로필 사진 URL
```

### WalkDiary (산책)
```
id            string      UUID
coupleId      string      커플 ID
date          string      산책 날짜 (YYYY-MM-DD)
locationName  string      장소 이름
steps         number      걸음수
myEntry       FootprintEntry?   내 발자취
partnerEntry  FootprintEntry?   상대방 발자취
isRevealed    boolean     둘 다 작성 완료 여부
createdAt     string      ISO 8601
```

### FootprintEntry (발자취 엔트리)
```
userId        string      작성자 UUID
nickname      string      작성자 닉네임
memo          string      메모/이야기
photos        string[]    사진 URL 배열
writtenAt     string      작성 시각 (ISO 8601)
```

### WalkStats (통계)
```
totalWalks    number      총 산책 횟수
totalSteps    number      총 걸음수
currentStreak number      연속 산책 일수
```

---

## 서비스 → API 매핑

현재 Supabase 서비스와 향후 REST API 엔드포인트 매핑:

| REST Endpoint | HTTP | 현재 서비스 메서드 | Hook |
|--------------|------|------------------|------|
| `/auth/signup` | POST | `authService.signUp()` | `useSignUpMutation` |
| `/auth/signin` | POST | `authService.signIn()` | `useLoginMutation` |
| `/auth/signout` | POST | `authService.signOut()` | `useLogoutMutation` |
| `/auth/session` | GET | `authService.getSession()` | — |
| `/users/me` | GET | `couplesService.getMyProfile()` | `useGetMeQuery` |
| `/users/me` | PATCH | `couplesService.updateProfile()` | `useUpdateProfileMutation` |
| `/couples/invite` | POST | `couplesService.createInvite()` | `useCreateInviteMutation` |
| `/couples/join` | POST | `couplesService.joinByCode()` | `useJoinCoupleMutation` |
| `/couples/:id` | GET | `couplesService.getCoupleProfile()` | `useGetCoupleQuery` |
| `/couples/:id` | DELETE | `couplesService.disconnect()` | `useDisconnectCoupleMutation` |
| `/couples/:id/stats` | GET | `walksService.getStats()` | `useCoupleStatsQuery` |
| `/walks` | GET | `walksService.getList()` | `useDiaryListQuery` |
| `/walks/:id` | GET | `walksService.getDetail()` | `useDiaryDetailQuery` |
| `/walks` | POST | `walksService.create()` | `useCreateDiaryMutation` |
| `/walks/:id/entries` | POST | `walksService.addEntry()` | `useAddEntryMutation` |
| `/walks/:id` | DELETE | `walksService.remove()` | `useDeleteDiaryMutation` |
| `/storage/photos` | POST | `storageService.uploadPhotos()` | — (mutation 내부) |
| `/storage/photos` | DELETE | `storageService.deletePhoto()` | — |

---

## 비즈니스 규칙

### 발자취 공개 (Reveal)
1. 산책 생성 시 `isRevealed = false`
2. 한 명이 엔트리를 작성해도 상대방 엔트리는 비공개
3. **두 명 모두 엔트리를 작성하면** 자동으로 `isRevealed = true`
4. 공개 후 양쪽 모두 서로의 메모와 사진 확인 가능

### 연속 산책 (Streak)
1. `isRevealed = true`인 산책만 연속 산책 계산에 포함
2. 가장 최근 산책이 오늘 또는 어제가 아니면 streak = 0
3. 연속된 날짜의 산책을 카운트
4. 같은 날 여러 산책은 1회로 계산 (중복 제거)

### 초대코드
1. 6자리 영숫자 랜덤 생성 (대문자)
2. user2가 없는 커플만 초대코드로 조회 가능
3. 본인이 만든 초대코드로는 참여 불가
4. 연결 시 양쪽 프로필의 `coupleId`가 자동 업데이트
