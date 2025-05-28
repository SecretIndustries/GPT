// PURPOSE: Calculates initial scale and provides canvas dimensions based on world size
// DEPENDENCIES: userSettings (unit system, worldSize), Dimensions
// PERSISTENCE: Values recompute if screen size or settings change
// TODO: Add maxZoom, minZoom logic later based on world size
// DO NOT: Hardcode world width/height; always read from settings

import { Dimensions } from 'react-native';
import { useUserSettings } from '../settings/useUserSettings';
import { getActiveCanvasSizes } from '../utils/canvaSizeService';

export const useDrawingScale = () => {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const { settings } = useUserSettings();

  // ─── World size (clamped to max in mm) ───
  //const maxWorldWidth = settings.maxWorldSize?.width ?? 50000;
  //const maxWorldHeight = settings.maxWorldSize?.height ?? 50000;

  // Grab world size from user settings (in mm)
  //const worldWidth = settings.worldSize?.width ?? 5000;
  //const worldHeight = settings.worldSize?.height ?? 5000;

  const { defaultSize, maxSize } = getActiveCanvasSizes(settings);

  // Determine unit scaling — could support imperial in future
  //const unitsPerMeter = settings.unitSystem === 'metric' ? 1000 : 304.8;
  //const unitsPerMeter = settings.unitSystem === 'imperial' ? 1000 : 304.8;

  // Determine logical size in meters (optional future override)
  const defaultLogicalSize = settings.defaultLogicalSize ?? 20;

  // Set initial scale (how many canvas pixels per world mm)
  const initialScale = screenWidth / defaultSize.width;

  return {
    screenWidth,
    screenHeight,
    worldWidth: defaultSize.width,
    worldHeight: defaultSize.height,
    maxWorldWidth: maxSize.width,
    maxWorldHeight: maxSize.height,
    //unitsPerMeter,
    defaultLogicalSize,
    initialScale,
  };
};