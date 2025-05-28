// ───────────────────────────────────────────────────────────────
// PURPOSE: Skia-native grid overlay using safe derived values
//          to avoid .value in React render (JS thread).
//          Only Skia uses direct .value reads (UI thread safe).
//
// DEPENDENCIES: Skia Group, Line, useDerivedValue, useAnimatedReaction, runOnJS
// PERSISTENCE: React state stores safe values, Skia renders instantly
// ───────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { Group, Line as SkiaLine } from '@shopify/react-native-skia';
import { useDerivedValue, useAnimatedReaction, runOnJS } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { getGridSpacingMm } from '../../../utils/gridUtils';
import type { UserSettings } from '../../../settings/userSettings';

interface Props {
  pan: SharedValue<{ x: number; y: number }>;
  scale: SharedValue<number>;
  canvasWidth: number;
  canvasHeight: number;
  settings: UserSettings;
}

const SkiaGridOverlay: React.FC<Props> = ({
  pan,
  scale,
  canvasWidth,
  canvasHeight,
  settings,
}) => {
  if (!settings.gridEnabled) return null;

  // Determine grid spacing in mm (imperial or metric)
  const gridSpacing = getGridSpacingMm(settings);

  // ─── Skia transform matrix for the grid (SAFE to read .value here)
  const transform = useDerivedValue(() => [
    { translateX: pan.value.x },
    { translateY: pan.value.y },
    { scale: scale.value },
  ], [pan, scale]);

  // ─── Skia grid parameters (SAFE to read .value in useDerivedValue)
  const gridParams = useDerivedValue(() => {
    const panX = pan.value.x;
    const panY = pan.value.y;
    const scaleVal = scale.value;

    const worldLeft = -panX / scaleVal;
    const worldRight = (canvasWidth - panX) / scaleVal;
    const worldTop = -panY / scaleVal;
    const worldBottom = (canvasHeight - panY) / scaleVal;

    const startX = Math.floor(worldLeft / gridSpacing) * gridSpacing;
    const endX = Math.ceil(worldRight / gridSpacing) * gridSpacing;
    const startY = Math.floor(worldTop / gridSpacing) * gridSpacing;
    const endY = Math.ceil(worldBottom / gridSpacing) * gridSpacing;

    // ─── Dynamic opacity fade based on zoom
    const fadeStart = 0.1;
    const fadeEnd = 0.01;
    const baseColor = 238;
    const maxOpacity = 255;
    let opacity = maxOpacity;
    if (scaleVal <= fadeEnd) {
      opacity = 0;
    } else if (scaleVal < fadeStart) {
      const t = (scaleVal - fadeEnd) / (fadeStart - fadeEnd);
      opacity = Math.floor(t * maxOpacity);
    }
    const color = `rgba(${baseColor}, ${baseColor}, ${baseColor}, ${opacity / 255})`;

    return { startX, endX, startY, endY, color, scaleVal };
  }, [pan, scale, canvasWidth, canvasHeight, gridSpacing]);

  // ─── Store safe grid parameters for React-side usage
  const [params, setParams] = useState({
    startX: 0,
    endX: 0,
    startY: 0,
    endY: 0,
    color: 'rgba(238, 238, 238, 1)',
    scaleVal: 1,
  });

  // ─── Bridge gridParams from Reanimated to React state safely
  useAnimatedReaction(
    () => gridParams.value,
    (val) => {
      runOnJS(setParams)(val);
    },
    []
  );

  // ─── Create Skia grid lines (SAFE to read values in Skia rendering!)
  const verticalLines = Array.from(
    { length: Math.ceil((params.endX - params.startX) / gridSpacing) + 1 },
    (_, i) => {
      const x = params.startX + i * gridSpacing;
      return (
        <SkiaLine
          key={`v-${x}`}
          p1={{ x, y: params.startY }}
          p2={{ x, y: params.endY }}
          color={params.color}
          strokeWidth={1 / params.scaleVal}
        />
      );
    }
  );

  const horizontalLines = Array.from(
    { length: Math.ceil((params.endY - params.startY) / gridSpacing) + 1 },
    (_, i) => {
      const y = params.startY + i * gridSpacing;
      return (
        <SkiaLine
          key={`h-${y}`}
          p1={{ x: params.startX, y }}
          p2={{ x: params.endX, y }}
          color={params.color}
          strokeWidth={1 / params.scaleVal}
        />
      );
    }
  );

  // ─── SAFE: Skia Group transform uses UI thread values directly
  return (
    <Group transform={transform.value}>
      {verticalLines}
      {horizontalLines}
    </Group>
  );
};

export default SkiaGridOverlay;
