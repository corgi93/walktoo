import React from "react";

import { CollageLayout } from "./CollageLayout";
import { FilmStripLayout } from "./FilmStripLayout";
import { GridLayout } from "./GridLayout";
import { JournalSpreadLayout } from "./JournalSpreadLayout";
import { ScrapbookLayout } from "./ScrapbookLayout";
import type { PhotoLayoutProps } from "./types";

/**
 * 테마별 사진 레이아웃 디스패처.
 *
 * - 읽기 모드: editable 미지정 → 디자인 fidelity 풀 표시 (placeholder 포함)
 * - 입력 모드: editable=true + onAddPhoto/onRemovePhoto → 빈 슬롯은 + Tap, 채워진 슬롯은 X
 *
 * 두 사람이 합쳐서 4슬롯 공유 — diary-detail에서는 [...mine, ...partner].slice(0,4),
 * footprint-create에서는 mine.photos만 (partner=0).
 */
export function PhotoPage(props: PhotoLayoutProps) {
  switch (props.theme.layout) {
    case "collage":
      return <CollageLayout {...props} />;
    case "filmstrip":
      return <FilmStripLayout {...props} />;
    case "grid":
      return <GridLayout {...props} />;
    case "journal":
      return <JournalSpreadLayout {...props} />;
    case "scrapbook":
      return <ScrapbookLayout {...props} />;
    default:
      return <CollageLayout {...props} />;
  }
}
