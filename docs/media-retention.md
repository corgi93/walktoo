# walkToo 미디어 보관 정책

산책 다이어리의 사진/영상은 Supabase Storage(`footprints` 버킷)에 저장된다.
이 문서는 **무엇을, 얼마나, 언제까지 보관하고 어떻게 정리하는지** 정한다.
영구 무제한 저장을 약속하지 않는다 (`docs/bm-policy.md` 2장 원칙).

## 1. 무엇을 저장하나

| 종류 | 위치 | 비고 |
| --- | --- | --- |
| 사진 | `footprints/{coupleId}/{walkId}/{ts}_{idx}.jpg` | 1600px·JPEG 0.78로 리사이즈 후 업로드 |
| 영상 | `footprints/{coupleId}/{walkId}/{ts}_{idx}.mp4` | `each`(각자) 기록 + 빠른 캡처에서만 |

엔트리(`footprint_entries.photos`)는 public URL 배열이고 사진/영상이 같이 들어간다.

## 2. 용량·개수 상한 (`src/utils/media.ts`)

| 항목 | 값 | 강제 위치 |
| --- | --- | --- |
| 영상 길이 | 무료 3초 / 업그레이드 5초 | 캡처 `maxDuration`, 선택 후 `duration` 재검증 |
| 영상 용량 | **12MB** (`MAX_SHORT_VIDEO_BYTES`) | 캡처·선택 시 파일 크기 검증 → 초과 시 거부 |
| 엔트리당 영상 | **1개** (`MAX_VIDEOS_PER_ENTRY`) | diary-detail 선택 시 합산 캡 |
| 사진 매수 | 무료 4장 / 업그레이드 8장 | `PREMIUM.PHOTO_LIMIT_*` |
| 사진 해상도 | 긴 변 1600px | 업로드 직전 리사이즈 |

영상은 720p로 압축하면 5초가 보통 1~3MB라 12MB 상한은 넉넉하다. 압축이 꺼져 있어도
(아래 4.2 참고) 상한이 raw 영상의 폭주를 막는 최후 방어선이다.

## 3. 보관 기간 & 삭제 (retention)

기본 원칙: **미디어는 그 기록이 살아있는 동안만 보관한다.** 시간 기반 만료는 없다
(추억을 임의로 지우지 않는다). 대신 기록이 사라지면 파일도 같이 정리한다.

코드로 강제하는 삭제 트리거 (`src/server/walks/walks.service.ts`):

| 트리거 | 동작 |
| --- | --- |
| 산책 삭제 (`remove`) | DB 삭제 전 엔트리 사진 URL 수집 → DB 삭제 → Storage 파일 삭제 (best-effort) |
| 엔트리 사진 교체 (`updateEntry`) | 교체 전 사진과 비교해 빠진 원격 파일을 Storage에서 삭제 |

- 삭제는 **best-effort** — 실패해도 본 작업(기록 삭제)은 막지 않는다.
- DB가 source of truth. 항상 **DB 삭제 후** Storage를 지운다. 그 사이 앱이 죽으면
  파일이 고아로 남지만, 아래 cleanup이 회수한다.
- 삭제 진입점은 `storageService.deletePhotos(urls)` 한 곳으로 모았다.

### 3.1 고아 파일(orphan) 정리 — 운영 작업

클라이언트 best-effort 삭제가 놓친 파일(네트워크 실패, 결제 직후 크래시 등)은
주기적으로 회수한다. **아직 자동화되어 있지 않다 — 운영에서 붙여야 한다.**

권장: Supabase **Edge Function** + `pg_cron` 주 1회. `storage.objects`(버킷 `footprints`)를
훑어 `footprint_entries.photos` 어디에도 참조되지 않는 객체를 삭제한다.

```ts
// supabase/functions/cleanup-orphan-media/index.ts (스케치)
// 1. storage.from('footprints').list() 로 전체 객체 경로 수집 (페이지네이션)
// 2. footprint_entries.photos 전체를 모아 referenced Set<path> 구성
//    (URL → '/footprints/' 뒤 경로로 정규화)
// 3. 객체 중 referenced에 없고 24h 이상 된 것만 remove() (방금 업로드된 것 보호)
// 4. 삭제 건수 로깅
```

- 24시간 유예: 업로드 직후 아직 DB에 안 붙은 파일을 지우지 않기 위함.
- 안전장치: dry-run 모드로 먼저 삭제 후보 수만 로깅하고, 임계치 초과 시 중단.

## 4. Expo 최적화

### 4.1 업로드 (구현됨)

- **사진**: 1600px·JPEG 0.78 리사이즈(`optimizeImageForUpload`) 후 base64→ArrayBuffer 업로드.
  리사이즈로 보통 장당 수백 KB라 base64 메모리 부담이 작다.
- **영상**: `tryStreamUpload` — `expo-file-system`의 `uploadAsync`로 디스크에서 Supabase
  Storage REST 엔드포인트로 **바이너리 직접 스트리밍**. base64로 JS 힙에 통째로 올리지
  않는다(20MB 영상 = base64 ~27MB 문자열 회피). 미지원 환경·인증/네트워크 실패 시
  base64 경로로 자동 폴백하므로 업로드는 절대 깨지지 않는다.

### 4.2 영상 압축 (활성화 필요 — 네이티브)

`src/utils/media.ts`의 `compressVideoForUpload`는 현재 **패스스루(no-op)**다.
720p 트랜스코딩으로 용량을 크게 줄이려면:

1. `pnpm add react-native-compressor`
2. `compressVideoForUpload`의 주석 블록을 해제 (이미 `VIDEO_COMPRESS_MAX_DIMENSION` 사용)
3. **dev client 재빌드** (네이티브 모듈 — Expo Go 불가)

압축이 켜지면 5초 영상이 보통 1~3MB로 줄어 스토리지·전송량(egress)·업로드 시간이 모두 준다.

### 4.3 썸네일 (Phase 2 제안)

지금은 다이어리 카드/그리드에서 영상에 플레이 배지만 표시하고, 전체 화면(`media-viewer`)에서만
재생한다. 목록에서 영상 원본을 받지 않아 egress가 새지는 않는다.
더 줄이려면 `expo-video-thumbnails`로 포스터(첫 프레임) 이미지를 만들어 함께 저장하고
목록에서 포스터만 보여주면 된다. (네이티브 — 재빌드 필요, 스키마에 poster URL 저장 위치 필요)

## 5. 비용 감각 (대략)

압축 켠 기준, 한 기록 = 사진 4~8장(각 ~300KB) + 영상 1개(~2MB) ≈ **3~5MB**.
커플당 주 2회 기록이면 월 ~30~40MB, 연 ~0.5GB. 커플 1만 쌍 ≈ 연 5TB 규모.

- Supabase 기본 스토리지/egress 한도를 넘기 전에 압축(4.2)과 cleanup(3.1)을 반드시 켠다.
- 압축을 끄면(현재 기본) 영상 1개가 최대 12MB라 같은 규모에서 스토리지가 수 배로 뛴다.
  → **출시 전 압축 활성화 권장.**

## 6. 관련 코드

- 상한 상수: `src/utils/media.ts`
- 업로드/삭제: `src/server/storage/storage.service.ts`, `storage.repository.ts`
- 삭제 트리거: `src/server/walks/walks.service.ts` (`remove`, `updateEntry`)
- 영상 선택·캡: `src/app/diary-detail.tsx`, 캡처: `src/app/quick-capture.tsx`
