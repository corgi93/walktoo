import { decode } from 'base64-arraybuffer';

import {
  compressVideoForUpload,
  getMediaContentType,
  getMediaExtension,
  isVideoUri,
  optimizeImageForUpload,
} from '@/utils/media';

import { storageRepository } from './storage.repository';

// ─── Helpers ────────────────────────────────────────────

/**
 * 로컬 파일 URI → Base64 문자열
 * expo-file-system을 우선 사용하고, 없으면 fetch/blob으로 fallback
 */
async function readFileAsBase64(uri: string): Promise<string> {
  try {
    // 방법 1: expo-file-system (네이티브, 가장 안정적)
    const FileSystem: any = await import('expo-file-system');
    const fs = FileSystem?.default ?? FileSystem;
    if (fs?.EncodingType?.Base64) {
      return await fs.readAsStringAsync(uri, {
        encoding: fs.EncodingType.Base64,
      });
    }
  } catch {
    // expo-file-system 사용 불가 → fallback
  }

  // 방법 2: fetch → blob → base64 (Expo Go / 웹 호환)
  const response = await fetch(uri);
  const blob = await response.blob();

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      // data:image/jpeg;base64,XXXX → XXXX 부분만 추출
      const base64 = dataUrl.split(',')[1];
      if (base64) {
        resolve(base64);
      } else {
        reject(new Error('Base64 변환 실패'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * base64 → ArrayBuffer 업로드 (작은 파일/이미지용, 그리고 스트리밍 실패 시 폴백).
 * 큰 영상에는 메모리 부담이 있어 가급적 스트리밍을 먼저 시도한다.
 */
async function uploadViaBase64(
  path: string,
  uri: string,
  contentType: string,
): Promise<void> {
  const base64 = await readFileAsBase64(uri);
  const { error } = await storageRepository.upload(
    path,
    decode(base64),
    contentType,
  );
  if (error) throw error;
}

/**
 * 디스크 → Supabase Storage 직접 스트리밍 업로드 (base64로 JS 힙에 올리지 않음).
 * expo-file-system uploadAsync가 없거나(미지원 환경) 인증/네트워크 실패 시 null을
 * 반환해 호출부가 base64 경로로 폴백하게 한다.
 */
async function tryStreamUpload(
  path: string,
  uri: string,
  contentType: string,
): Promise<boolean> {
  try {
    const FileSystem: any = await import('expo-file-system');
    const fs = FileSystem?.default ?? FileSystem;
    const uploadAsync = fs?.uploadAsync;
    const binaryType = fs?.FileSystemUploadType?.BINARY_CONTENT;
    if (!uploadAsync || binaryType == null) return false;

    const token = await storageRepository.streamUpload.getAccessToken();
    if (!token) return false;

    const res = await uploadAsync(
      storageRepository.streamUpload.endpoint(path),
      uri,
      {
        httpMethod: 'POST',
        uploadType: binaryType,
        headers: {
          authorization: `Bearer ${token}`,
          apikey: storageRepository.streamUpload.anonKey,
          'content-type': contentType,
          'x-upsert': 'false',
          'cache-control': '3600',
        },
      },
    );
    return typeof res?.status === 'number' && res.status >= 200 && res.status < 300;
  } catch {
    return false;
  }
}

// ─── Storage Service (파일 업로드 비즈니스 로직) ────────

export const storageService = {
  /** 발자취 미디어 업로드 */
  uploadPhoto: async (
    coupleId: string,
    walkId: string,
    uri: string,
    index: number,
  ): Promise<string> => {
    // 이미 원격 URL이면 그대로 반환
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      return uri;
    }

    // 영상: 압축 → 스트리밍 업로드(실패 시 base64 폴백)
    if (isVideoUri(uri)) {
      const compressed = await compressVideoForUpload(uri);
      const ext = getMediaExtension(compressed) || 'mp4';
      const path = `${coupleId}/${walkId}/${Date.now()}_${index}.${ext}`;
      const contentType = getMediaContentType(compressed);

      const streamed = await tryStreamUpload(path, compressed, contentType);
      if (!streamed) {
        await uploadViaBase64(path, compressed, contentType);
      }
      return storageRepository.getPublicUrl(path).data.publicUrl;
    }

    // 이미지: 리사이즈 → base64 업로드 (작아서 힙 부담 없음)
    const uploadUri = await optimizeImageForUpload(uri);
    const ext = getMediaExtension(uploadUri) || 'jpg';
    const path = `${coupleId}/${walkId}/${Date.now()}_${index}.${ext}`;
    const contentType = getMediaContentType(uploadUri);

    await uploadViaBase64(path, uploadUri, contentType);
    return storageRepository.getPublicUrl(path).data.publicUrl;
  },

  /** 여러 미디어 업로드 */
  uploadPhotos: async (
    coupleId: string,
    walkId: string,
    uris: string[],
  ): Promise<string[]> => {
    const uploads = uris.map((uri, i) =>
      storageService.uploadPhoto(coupleId, walkId, uri, i),
    );
    return Promise.all(uploads);
  },

  /** 사진 삭제 (단일) */
  deletePhoto: async (url: string) => {
    const path = urlToStoragePath(url);
    if (!path) return;
    await storageRepository.remove([path]);
  },

  /**
   * 여러 미디어 삭제 (다이어리/엔트리 삭제·사진 교체 시 고아 파일 정리).
   * 원격 URL이 아닌 항목은 무시한다. best-effort — 실패해도 throw하지 않는다.
   */
  deletePhotos: async (urls: string[]) => {
    const paths = urls
      .map((u) => urlToStoragePath(u))
      .filter((p): p is string => !!p);
    if (paths.length === 0) return;
    try {
      await storageRepository.remove(paths);
    } catch {
      // 삭제 실패해도 본 작업(다이어리 삭제 등)은 막지 않는다.
      // 남은 고아 파일은 주기적 cleanup이 회수한다 (docs/media-retention.md).
    }
  },
};

/** 업로드된 public URL → 버킷 내부 경로. 로컬/비정상 URL이면 null. */
function urlToStoragePath(url: string): string | null {
  if (!url || !url.startsWith('http')) return null;
  const path = url.split('/footprints/').pop();
  if (!path || path === url) return null;
  return path.split('?')[0];
}
