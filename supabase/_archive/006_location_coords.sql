-- ─── 006: 산책 장소 좌표 (lat/lng + address + source) ──
--
-- 컨텍스트: 산책 기록 시 텍스트 입력만 가능했음 → 지도 검색 결과(좌표)도 저장.
-- Provider abstraction (lib/location/) — 한국=네이버 지역검색, 글로벌=Google Places.
--
-- 적용 대상:
--   - walks (kind='together'일 때 공용 장소)
--   - footprint_entries (kind='each'일 때 각자 장소)
--
-- 모두 NULL 허용 — 텍스트만 입력한 기록은 좌표 없이 저장.

ALTER TABLE public.walks
  ADD COLUMN IF NOT EXISTS location_lat       DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS location_lng       DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS location_address   TEXT,
  ADD COLUMN IF NOT EXISTS location_source    TEXT  -- 'naver' | 'google'
    CHECK (location_source IS NULL OR location_source IN ('naver', 'google'));

ALTER TABLE public.footprint_entries
  ADD COLUMN IF NOT EXISTS location_lat       DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS location_lng       DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS location_address   TEXT,
  ADD COLUMN IF NOT EXISTS location_source    TEXT
    CHECK (location_source IS NULL OR location_source IN ('naver', 'google'));

-- 좌표 기반 검색 인덱스 (선택사항, 추후 "주변 산책" 기능 등에서 사용)
-- CREATE INDEX IF NOT EXISTS idx_walks_location_coords
--   ON public.walks(location_lat, location_lng)
--   WHERE location_lat IS NOT NULL AND location_lng IS NOT NULL;

COMMENT ON COLUMN public.walks.location_lat IS '위도 (WGS84). NULL = 텍스트만 입력';
COMMENT ON COLUMN public.walks.location_lng IS '경도 (WGS84). NULL = 텍스트만 입력';
COMMENT ON COLUMN public.walks.location_source IS 'naver | google — 어떤 provider에서 picked 됐는지';
