import { supabase } from '../client';

// ─── Storage Repository (Supabase Storage 직접 호출) ───

const BUCKET = 'footprints';

export const storageRepository = {
  /** 파일 업로드 */
  upload: (path: string, file: Blob | ArrayBuffer, contentType: string) =>
    supabase.storage.from(BUCKET).upload(path, file, {
      contentType,
      upsert: false,
    }),

  /** 파일 삭제 */
  remove: (paths: string[]) =>
    supabase.storage.from(BUCKET).remove(paths),

  /** Public URL 생성 */
  getPublicUrl: (path: string) =>
    supabase.storage.from(BUCKET).getPublicUrl(path),

  /** Signed URL 생성 (만료 시간 포함) */
  getSignedUrl: (path: string, expiresIn = 3600) =>
    supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn),
};
