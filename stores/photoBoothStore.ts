import { create } from 'zustand';

interface PhotoBoothStore {
  /** 원본 사진 URI 목록 */
  photos: string[];
  /** 선택된 템플릿 ID */
  templateId: string;
  /** 선택된 필터 ID */
  filterId: string;
  /** 선택된 프레임 배경색 ID */
  frameColorId: string;
  /** 흑백 변환 캐시: originalUri → grayscaleUri */
  bwCache: Record<string, string>;
  /** 캡처 결과 URI (footprint-create로 전달) */
  resultUri: string | null;

  setPhotos: (uris: string[]) => void;
  setTemplate: (id: string) => void;
  setFilter: (id: string) => void;
  setFrameColor: (id: string) => void;
  cacheBw: (originalUri: string, bwUri: string) => void;
  setResult: (uri: string) => void;
  reset: () => void;
}

export const usePhotoBoothStore = create<PhotoBoothStore>((set) => ({
  photos: [],
  templateId: 'single-frame',
  filterId: 'original',
  frameColorId: 'white',
  bwCache: {},
  resultUri: null,

  setPhotos: (uris) => set({ photos: uris }),
  setTemplate: (id) => set({ templateId: id }),
  setFilter: (id) => set({ filterId: id }),
  setFrameColor: (id) => set({ frameColorId: id }),
  cacheBw: (originalUri, bwUri) =>
    set((s) => ({ bwCache: { ...s.bwCache, [originalUri]: bwUri } })),
  setResult: (uri) => set({ resultUri: uri }),
  reset: () =>
    set({
      photos: [],
      templateId: 'single-frame',
      filterId: 'original',
      frameColorId: 'white',
      bwCache: {},
      resultUri: null,
    }),
}));
