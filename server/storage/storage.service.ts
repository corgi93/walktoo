import { decode } from 'base64-arraybuffer';

import { storageRepository } from './storage.repository';

// ─── Helpers ────────────────────────────────────────────

/**
 * 로컬 파일 URI → Base64 문자열
 * expo-file-system을 우선 사용하고, 없으면 fetch/blob으로 fallback
 */
async function readFileAsBase64(uri: string): Promise<string> {
  try {
    // 방법 1: expo-file-system (네이티브, 가장 안정적)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// ─── Storage Service (파일 업로드 비즈니스 로직) ────────

export const storageService = {
  /** 발자취 사진 업로드 */
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

    const ext = uri.split('.').pop()?.split('?')[0] ?? 'jpg';
    const path = `${coupleId}/${walkId}/${Date.now()}_${index}.${ext}`;
    const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';

    const base64 = await readFileAsBase64(uri);

    const { error } = await storageRepository.upload(
      path,
      decode(base64),
      contentType,
    );
    if (error) throw error;

    const { data } = storageRepository.getPublicUrl(path);
    return data.publicUrl;
  },

  /** 여러 사진 업로드 */
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

  /** 사진 삭제 */
  deletePhoto: async (url: string) => {
    const path = url.split('/footprints/').pop();
    if (!path) return;
    await storageRepository.remove([path]);
  },
};
