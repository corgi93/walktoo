import { supabase } from '../client';

// ─── Storage Repository (Supabase Storage 직접 호출) ───

const BUCKET = 'footprints';

/** 큰 파일(영상) 스트리밍 업로드용 REST 엔드포인트 base */
const STORAGE_OBJECT_BASE = `${process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''}/storage/v1/object/${BUCKET}`;
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const storageRepository = {
  /** 파일 업로드 */
  upload: (path: string, file: Blob | ArrayBuffer, contentType: string) =>
    supabase.storage.from(BUCKET).upload(path, file, {
      contentType,
      upsert: false,
    }),

  /**
   * 디스크에서 직접 스트리밍 업로드(expo-file-system uploadAsync)할 때 쓰는
   * Supabase Storage REST 정보. 영상처럼 큰 파일을 base64로 JS 힙에 올리지 않기
   * 위해 사용한다. anonKey + 사용자 access token으로 인증한다.
   */
  streamUpload: {
    endpoint: (path: string) => `${STORAGE_OBJECT_BASE}/${path}`,
    anonKey: ANON_KEY,
    getAccessToken: async (): Promise<string | null> => {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    },
  },

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
