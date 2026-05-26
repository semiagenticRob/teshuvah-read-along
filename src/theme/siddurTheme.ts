// src/theme/siddurTheme.ts
export const INK = {
  strong: '#2a1d12',
  soft:   '#5a4835',
  faint:  '#8a7a64',
} as const;

export const PARCHMENT = '#f6e9d2';

export const FONTS = {
  hebrew: 'FrankRuhlLibre_500Medium',
  serifBody: 'EBGaramond_400Regular',
  serifBodyItalic: 'EBGaramond_400Regular_Italic',
  display: 'CormorantGaramond_500Medium',
  displayItalic: 'CormorantGaramond_500Medium_Italic',
} as const;

// Timing (ms) — baseline 1× reading cadence.
// Real tick interval = (CADENCE_MIN + random * CADENCE_JITTER) / speed
export const TIMING = {
  CADENCE_MIN: 757,
  CADENCE_JITTER: 378,
  INITIAL_DELAY: 585,
  HALO_CRESCENDO_AVG: 946 * 0.78,
  HALO_DECRESCENDO_AVG: 946 * 4.0,
  SPEED_MIN: 0.5,
  SPEED_MAX: 2.0,
  SPEED_STEP: 0.1,
  SPEED_DEFAULT: 1.0,
};
