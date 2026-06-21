export type MediaKind = 'image' | 'video';

const VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'm4v', 'webm']);
const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic']);

export const MAX_SHORT_VIDEO_DURATION_FREE_MS = 3_000;
export const MAX_SHORT_VIDEO_DURATION_PREMIUM_MS = 5_000;
export const MAX_SHORT_VIDEO_DURATION_MS = MAX_SHORT_VIDEO_DURATION_PREMIUM_MS;

/**
 * 업로드 허용 영상 용량 상한 (압축 후 검증). 보관 비용을 통제하려고
 * 20MB → 12MB로 낮췄다. 720p로 압축되면 5초 영상이 보통 1~3MB라 넉넉하다.
 * 압축 라이브러리가 없는 환경(미리빌드 dev client 등)에서는 원본이 이 값을
 * 넘으면 업로드를 막는다. 자세한 정책은 docs/media-retention.md 참고.
 */
export const MAX_SHORT_VIDEO_BYTES = 12 * 1024 * 1024;

/** 엔트리(한 기록)당 영상 첨부 한도. 비용 상한 — "짧은 모먼트" 한 컷. */
export const MAX_VIDEOS_PER_ENTRY = 1;

export const OPTIMIZED_IMAGE_MAX_WIDTH = 1600;
export const OPTIMIZED_IMAGE_QUALITY = 0.78;

/** 영상 압축 타깃 — 긴 변 기준(px). 720p급. */
export const VIDEO_COMPRESS_MAX_DIMENSION = 1280;

export function getMediaExtension(uri: string): string {
  const path = uri.split('?')[0] ?? uri;
  return path.split('.').pop()?.toLowerCase() ?? '';
}

export function getMediaKind(uri: string): MediaKind {
  const ext = getMediaExtension(uri);
  if (VIDEO_EXTENSIONS.has(ext)) return 'video';
  return 'image';
}

export function isVideoUri(uri?: string): boolean {
  return !!uri && getMediaKind(uri) === 'video';
}

export function isImageUri(uri?: string): boolean {
  if (!uri) return false;
  const ext = getMediaExtension(uri);
  return IMAGE_EXTENSIONS.has(ext) || getMediaKind(uri) === 'image';
}

export function getMediaContentType(uri: string): string {
  const ext = getMediaExtension(uri);
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'heic':
      return 'image/heic';
    case 'mp4':
    case 'm4v':
      return 'video/mp4';
    case 'mov':
      return 'video/quicktime';
    case 'webm':
      return 'video/webm';
    default:
      return 'image/jpeg';
  }
}

export async function getLocalFileSize(uri: string): Promise<number | null> {
  try {
    const FileSystem = await import('expo-file-system');
    const fs = FileSystem.default ?? FileSystem;
    const info = await fs.getInfoAsync(uri);
    return info.exists ? (info.size ?? null) : null;
  } catch {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return blob.size;
    } catch {
      return null;
    }
  }
}

export async function optimizeImageForUpload(uri: string): Promise<string> {
  if (uri.startsWith('http://') || uri.startsWith('https://')) return uri;
  if (isVideoUri(uri)) return uri;

  try {
    const ImageManipulator = await import('expo-image-manipulator');
    const manipulator = ImageManipulator.default ?? ImageManipulator;
    const result = await manipulator.manipulateAsync(
      uri,
      [{ resize: { width: OPTIMIZED_IMAGE_MAX_WIDTH } }],
      {
        compress: OPTIMIZED_IMAGE_QUALITY,
        format: manipulator.SaveFormat.JPEG,
      },
    );
    return result.uri;
  } catch {
    return uri;
  }
}
