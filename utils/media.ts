export type MediaKind = 'image' | 'video';

const VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'm4v', 'webm']);
const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic']);

export const MAX_SHORT_VIDEO_DURATION_MS = 5_000;
export const MAX_SHORT_VIDEO_BYTES = 20 * 1024 * 1024;
export const OPTIMIZED_IMAGE_MAX_WIDTH = 1600;
export const OPTIMIZED_IMAGE_QUALITY = 0.78;

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
