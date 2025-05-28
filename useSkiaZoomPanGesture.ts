import { useSharedValue, useDerivedValue, runOnJS } from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';
import { useMemo, useState } from 'react';
import { log } from '../utils/devLog';
import { useUserSettings } from '../settings/useUserSettings';
import { useDrawingScale } from './useDrawingScale';

export function useSkiaZoomPanGesture(
  initialScale: number,
  drawingScale: ReturnType<typeof useDrawingScale>
) {
  // ─── SYSTEM SETTINGS ─────────────────────────────────────
  const { screenWidth, screenHeight, worldWidth, worldHeight } = drawingScale;
  const { settings } = useUserSettings();
  const zoomSensitivity = settings.zoomSensitivity ?? 0.08; //  ?? Override value if userSettings isn't read

  // Use world-aware scale limit instead of generic MIN_SCALE
  const minScaleX = screenWidth / worldWidth;
  const minScaleY = screenHeight / worldHeight;
  const MIN_SCALE = Math.min(minScaleX, minScaleY);

  const MAX_SCALE = initialScale * 100;
  
  const THROTTLE_MS = 100; // Dev/debug use only

  // ─── SHARED VALUES (UI THREAD) ───────────────────────────
  const pan = useSharedValue({ x: 0, y: 0 });
  const scale = useSharedValue(initialScale);

  const startPan = useSharedValue({ x: 0, y: 0 });
  const startScale = useSharedValue(initialScale);

  const isZooming = useSharedValue(false);
  let lastZoomLog = Date.now();
  let lastPanSync = Date.now();

  // ─── JS THREAD STATE (REACT UI) ──────────────────────────
  const [panJS, setPanJS] = useState({ x: 0, y: 0 });
  const [scaleJS, setScaleJS] = useState(initialScale);

  // Keep JS state in sync
useDerivedValue(() => {
  if (Date.now() - lastPanSync > THROTTLE_MS) {  //Throttle
    runOnJS(setPanJS)(pan.value);
    lastPanSync = Date.now();
  }
}, [pan]);

  useDerivedValue(() => {
    if (Date.now() - lastZoomLog > THROTTLE_MS){ // Throttle
    runOnJS(setScaleJS)(scale.value);
    lastZoomLog = Date.now();
    }
  }, [scale]);

  const gesture = useMemo(() => {
    // Pan gesture (two fingers)
    const panGesture = Gesture.Pan()
      .minPointers(2)
      .minDistance(10)
      .onStart(() => {
        startPan.value = { ...pan.value };
        startScale.value = scale.value;

        if (__DEV__) {
          const sp = startPan.value;
          const sc = startScale.value;
          runOnJS(log)(`[Pan] onStart → startPan = x:${sp.x}, y:${sp.y}, scale=${sc.toFixed(3)}`);
        }
      })
      .onUpdate((e) => {
        if(!isZooming.value){
        const sx = startPan.value.x;
        const sy = startPan.value.y;

        pan.value = {
          x: sx + e.translationX,
          y: sy + e.translationY,
        };
      }
      })
      .onEnd(() => {
        const currentPan = { ...pan.value };
        if (__DEV__) {
          runOnJS(log)(`[Pan] Ended at x=${currentPan.x.toFixed(1)} y=${currentPan.y.toFixed(1)}`);
        }
      });

    // Pinch gesture (zoom)
    
    const pinchGesture = Gesture.Pinch()
      .onStart(() => {
        isZooming.value = true;
        startScale.value = scale.value;

        if (__DEV__) {
          runOnJS(log)(`[Zoom] onStart → startScale = ${startScale.value.toFixed(3)}`);
        }
      })
      .onUpdate((e) => {
        const dynamicSensitivity = zoomSensitivity / scale.value;
        const delta = (e.scale - 1) * dynamicSensitivity;
        const unclamped = startScale.value * (1 + delta);
        const clamped = Math.max(MIN_SCALE, Math.min(MAX_SCALE, unclamped));
        scale.value = Math.max(clamped, 0.01); // 🔐 Prevent divide-by-zero or canvas collapse

        if (__DEV__) {
          runOnJS(log)(`[Zoom] scale=${clamped.toFixed(3)}`);
        }
          if (__DEV__ && Date.now() - lastZoomLog > THROTTLE_MS) {
          runOnJS(log)(`[Zoom] scale=${clamped.toFixed(3)}`);
          lastZoomLog = Date.now();
  }
      })
      .onEnd(() => {
        isZooming.value = false;
        if (__DEV__) {
          runOnJS(log)(`[Zoom] Ended → scale=${scale.value.toFixed(3)}`);
        }
      });

    return Gesture.Simultaneous(panGesture, pinchGesture);
  }, []);

  return {
    pan,
    scale,
    panJS,
    scaleJS,
    gesture,
  };
}
