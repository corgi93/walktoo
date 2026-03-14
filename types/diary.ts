// ─── Walk Diary ─────────────────────────────────────────

export interface WalkDiary {
  id: string;
  coupleId: string;
  date: string;
  locationName: string;
  memo?: string;
  photos: string[];
  steps: number;
  createdAt: string;
}

export interface CreateWalkDiaryInput {
  locationName: string;
  memo?: string;
  photos?: string[];
  steps: number;
}
