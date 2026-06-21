import { useCallback, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';

/**
 * 스테이지(레이아웃 컨테이너) 폭을 측정해서 스케일 팩터 계산.
 *
 * 디자인 JSX는 360-340px stage 기준으로 좌표가 짜여있어서, 실제 컨테이너 폭이
 * 다르면 사진이 겹치거나 잘려나감. 이 훅으로 모든 좌표·크기를 비례 축소/확대.
 *
 * 사용:
 * ```tsx
 * const { scale, stageWidth, onLayout } = useStageScale(340);
 * <View onLayout={onLayout} style={{ width: '100%', height: BASE_H * scale }}>
 *   <Polaroid width={170 * scale} left={8 * scale} ... />
 * </View>
 * ```
 *
 * - 첫 렌더는 `referenceWidth` 기준 (점핑 방지)
 * - onLayout 콜백 한 번 호출 후 정확한 폭으로 재렌더
 * - 최대 스케일 1.1 (태블릿에서 너무 커지지 않게)
 */
export function useStageScale(referenceWidth = 340): {
  scale: number;
  stageWidth: number;
  onLayout: (e: LayoutChangeEvent) => void;
} {
  const [stageWidth, setStageWidth] = useState(referenceWidth);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - stageWidth) > 0.5) {
      setStageWidth(w);
    }
  }, [stageWidth]);

  const scale = Math.min(stageWidth / referenceWidth, 1.1);

  return { scale, stageWidth, onLayout };
}
