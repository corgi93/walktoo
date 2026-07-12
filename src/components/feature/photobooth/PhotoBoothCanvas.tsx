import React from 'react';
import { View } from 'react-native';

import { getFrameColor } from '@/lib/photobooth/filters';
import { getTemplate } from '@/lib/photobooth/templates';
import { usePhotoBoothStore } from '@/stores/photoBoothStore';

import TemplateFrame from './TemplateFrame';

interface PhotoBoothCanvasProps {
  canvasWidth: number;
  dateLabel: string;
  onAddPhoto?: (slotIndex: number) => void;
}

const PhotoBoothCanvas = React.forwardRef<View, PhotoBoothCanvasProps>(
  ({ canvasWidth, dateLabel, onAddPhoto }, ref) => {
    const { photos, templateId, filterId, frameColorId, bwCache } =
      usePhotoBoothStore();
    const template = getTemplate(templateId);
    const fc = getFrameColor(frameColorId);

    // 흑백 필터: 캐시된 URI 사용
    const displayPhotos =
      filterId === 'bw'
        ? photos.map((uri) => bwCache[uri] ?? uri)
        : photos;

    return (
      <View
        ref={ref}
        collapsable={false}
        style={{ alignSelf: 'center' }}
      >
        <TemplateFrame
          template={template}
          photos={displayPhotos}
          filterId={filterId}
          frameColor={fc.color}
          textColor={fc.isLight ? '#2C2C2E' : '#FFFFFF'}
          canvasWidth={canvasWidth}
          dateLabel={dateLabel}
          onAddPhoto={onAddPhoto}
        />
      </View>
    );
  },
);

PhotoBoothCanvas.displayName = 'PhotoBoothCanvas';

export default PhotoBoothCanvas;
