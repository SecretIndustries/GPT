// hooks/useDisplayMeasurement.ts
// PURPOSE: Provides a single, unified way to format lengths (in mm) to the user’s preferred display units
// DEPENDENCIES: useUserSettings for unit system and display mode
// USAGE: const { format } = useDisplayMeasurement(); const label = format(lengthInMm);

import { useUserSettings } from '../settings/useUserSettings';

function formatImperial(mm: number, displayMode: 'inches' | 'feetInches'): string {
  const inchesTotal = mm / 25.4;
  const feet = Math.floor(inchesTotal / 12);
  const remainingInches = inchesTotal - feet * 12;

  const wholeInches = Math.floor(remainingInches);
  const fractionInch = remainingInches - wholeInches;

  // Nearest 1/32"
  const denominator = 32;
  const numerator = Math.round(fractionInch * denominator);

  let fractionString = '';
  let finalWholeInches = wholeInches;
  if (numerator === denominator) {
    finalWholeInches += 1;
  } else if (numerator > 0) {
    fractionString = `${numerator}/${denominator}`;
  }

  let inchDisplay = '';
  if (fractionString && finalWholeInches > 0) {
    inchDisplay = `${finalWholeInches} ${fractionString}"`;
  } else if (fractionString) {
    inchDisplay = `${fractionString}"`;
  } else {
    inchDisplay = `${finalWholeInches}"`;
  }

  if (displayMode === 'feetInches' && feet > 0) {
    return `${feet}' ${inchDisplay}`;
  } else {
    return inchDisplay;
  }
}

function formatMetric(mm: number): string {
  if (mm >= 1000) {
    return `${(mm / 1000).toFixed(2)}m`;
  }
  return `${Math.round(mm)}mm`;
}

export function useDisplayMeasurement() {
  const { settings } = useUserSettings();

  const format = (mm: number): string => {
    if (settings.unitSystem === 'imperial') {
      return formatImperial(mm, settings.imperialDisplayMode ?? 'feetInches');
    } else {
      return formatMetric(mm);
    }
  };

  return { format };
}