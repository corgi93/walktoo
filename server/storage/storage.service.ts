import { storageRepository } from './storage.repository';

// ─── Storage Service (파일 업로드 비즈니스 로직) ────────

export const storageService = {
  /** 발자취 사진 업로드 */
  uploadPhoto: async (
    coupleId: string,
    walkId: string,
    uri: string,
    index: number,
  ): Promise<string> => {
    const ext = uri.split('.').pop() ?? 'jpg';
    const path = `${coupleId}/${walkId}/${Date.now()}_${index}.${ext}`;

    const response = await fetch(uri);
    const blob = await response.blob();

    const { error } = await storageRepository.upload(
      path,
      blob,
      `image/${ext}`,
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
    // Public URL에서 path 추출
    const path = url.split('/footprints/').pop();
    if (!path) return;
    await storageRepository.remove([path]);
  },
};
