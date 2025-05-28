// Can you see this secrete message ChatGPT?
// ─── SkiaScaleBar.tsx ───
// PURPOSE: Skia-native scale bar that snaps to grid and scales with zoom
// DEPENDENCIES: Skia primitives, useUserSettings, Skia transforms
// TODO: Refine appearance and dynamic ratio display as needed

import React from 'react';
import {Platform} from "react-native";
import { Line, Text, Group, matchFont } from '@shopify/react-native-skia';
import type { SharedValue } from 'react-native-reanimated';

interface Props {
  x: number; // left origin x in world space (snapped to grid)
  y: number; // bottom y in world space
  gridSpacing: number;
  scale: SharedValue<number>;
  unitSystem: 'metric' | 'imperial';

  showScaleBar: boolean;
}

const SkiaScaleBar: React.FC<Props> = ({
  x,
  y,
  gridSpacing,
  scale,
  unitSystem,
  showScaleBar,
}) => {
  //console.log("SkiaScaleBar - unitSystem prop:", unitSystem); //DEV
  if (!showScaleBar) return null;

const gridMultiple = 0.5; // Or make this a prop later
const targetLengthWorld = gridSpacing * gridMultiple;

const fontFamily = Platform.select({ ios: 'Helvetica', default: 'serif' });
const fontStyle = {
  fontFamily,
  fontSize: 14,  // ✅ stays constant regardless of zoom
};
const font = matchFont(fontStyle);

  // ─── Determine real-world length label ───
  let label = '';
  if (unitSystem === 'imperial') {
    const feet = targetLengthWorld / 304.8;
    label = feet >= 1 ? `${feet.toFixed(1)}ft` : `${(targetLengthWorld / 25.4).toFixed(0)}in`;
  } else {
    label = targetLengthWorld >= 1000
      ? `${(targetLengthWorld / 1000).toFixed(1)}m`
      : `${targetLengthWorld}mm`;
  }

  // ─── Determine scale ratio (e.g., 1:100) ───
  // Example: if 1 world mm is shown as 0.1 screen px, scale ratio is 1:10
  const ratio = 1 / scale.value;
  const ratioLabel = `1:${Math.round(ratio)}`;

  // ─── Positioning ───
  const tickHeight = gridSpacing * 0.05; // dynamic tick height
  const textY = y - gridSpacing * 0.5;

  return (
    <Group>
      {/* Vertical ticks */}
      <Line
        p1={{ x, y: y - tickHeight }}
        p2={{ x, y }}
        color="#888"
        strokeWidth={1 / scale.value}
      />
      <Line
        p1={{ x: x + targetLengthWorld, y: y - tickHeight }}
        p2={{ x: x + targetLengthWorld, y }}
        color="#888"
        strokeWidth={1 / scale.value}
      />

      {/* Horizontal scale line */}
      <Line
        p1={{ x, y }}
        p2={{ x: x + targetLengthWorld, y }}
        color="#888"
        strokeWidth={1 / scale.value}
      />

      {/* Measurement label */}
      <Text
        x={x + targetLengthWorld / 2 - 20}
        y={textY}
        text={label}
        font={font}
        color="#888"
      />

      {/* Optional: Ratio label */}
      <Text
        x={x + targetLengthWorld / 2 - 20}
        y={textY - gridSpacing * 0.5}
        text={ratioLabel}
        font={font}
        color="#888"
      />
    </Group>
  );
};

export default SkiaScaleBar;
