// ───────────────────────────────────────────────────────────────
// PURPOSE: Main drawing canvas for the app using Skia, with
//          safe transform usage and direct .value reads in Skia.
//
// DEPENDENCIES: Skia Canvas, Group, Line, GridOverlayWrapper,
//                useDerivedValue, useUserSettings
// PERSISTENCE: Skia handles drawing state; React-side props
//              trigger updates.
// ───────────────────────────────────────────────────────────────

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas, Line as SkiaLine, useCanvasRef, Group } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { Point, LineSegment } from '../../../types/drawing';
import { useDrawingScale } from '../../../hooks/useDrawingScale';
import { useUserSettings } from '../../../settings/useUserSettings';
import SkiaGridOverlay from './SkiaGridOverlay';
import SkiaScaleBar from './SkiaScalebar';
import { getGridSpacingMm } from '../../../utils/gridUtils';

interface DrawRoomCanvasProps {
  points: Point[];               // JS thread props for snapping/render context
  lines: LineSegment[];          // Room lines to render
  pan: SharedValue<{ x: number; y: number }>;
  scale: SharedValue<number>;    // UI thread gesture state
  gridEnabled?: boolean;
}

const DrawRoomCanvas: React.FC<DrawRoomCanvasProps> = ({
  points,
  lines,
  pan,
  scale,
  gridEnabled = true,
}) => {
  
  const { settings } = useUserSettings();
  //console.log("DrawRoomCanvas - settings.unitSystem:", settings.unitSystem);  //DEV
  const {
    screenWidth: canvasWidth,
    screenHeight: canvasHeight,
  } = useDrawingScale();
  const canvasRef = useCanvasRef();
  const SCALE_BAR_PADDING = 100; // mm in world units

  // ─── Skia transform matrix for pan/zoom ───
  // ─── SAFE: Skia Group transform uses UI thread SharedValues directly ───
  const transform = useDerivedValue(() => [
    { translateX: pan.value.x },
    { translateY: pan.value.y },
    { scale: scale.value },
  ], [pan, scale]);

  // ─── Prepare Skia-rendered room lines ───
  const renderedLines = useMemo(() => {
    return lines.map((line) => (
      <SkiaLine
        key={line.id}
        p1={{ x: line.start.x, y: line.start.y }}
        p2={{ x: line.end.x, y: line.end.y }}
        color="blue"
        strokeWidth={2}
      />
    ));
  }, [lines]);

  return (
    <View style={styles.container}>
      <Canvas
        ref={canvasRef}
        style={{ width: canvasWidth, height: canvasHeight }}
      >
        {/* ─── Grid rendered with Skia-native lines ─── */}
        <SkiaGridOverlay
          pan={pan}
          scale={scale}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          settings={settings}
        />

        {/* ─── Room lines and active drawing layers ─── */}
        {/* ─── SAFE: Skia Group transform uses direct .value reads from UI thread ─── */}
        <Group transform={transform}>{renderedLines}</Group>

        {/* Scale bar */}
<SkiaScaleBar
  x={SCALE_BAR_PADDING}
  y={canvasHeight - SCALE_BAR_PADDING}
  gridSpacing={getGridSpacingMm(settings)}
  scale={scale}
  unitSystem={settings.unitSystem}
  showScaleBar={settings.showScaleBar}
/>
      </Canvas>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  canvas: {
    flex: 1,
  },
});

export default DrawRoomCanvas;
