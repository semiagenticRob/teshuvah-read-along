// src/theme/shacharitTheme.ts
export type SectionId = 'birchot' | 'pesukei' | 'shema' | 'concluding';

export const INK = {
  strong: '#2a1d12',
  soft:   '#5a4835',
  faint:  '#8a7a64',
} as const;

export const PARCHMENT = '#f6e9d2';

export const SECTIONS: Record<SectionId, {
  label: string;
  roman: string;
  hebrew: string;
  english: string;
  accent: string;
  accentHi: string;
  accentLow: string;
  gradient: [string, string, string, string];
  gradientStops: [number, number, number, number];
}> = {
  birchot: {
    label: 'Section One',
    roman: 'I',
    hebrew: 'בִּרְכוֹת הַשַּׁחַר',
    english: 'Morning Blessings — the first words of the day',
    accent: '#b07a1c',
    accentHi: '#d9a24a',
    accentLow: 'rgba(176,122,28,0.14)',
    gradient: ['#f2e2ba', '#ecd197', '#ecd197', '#e7c88a'],
    gradientStops: [0, 0.10, 0.86, 1.0],
  },
  pesukei: {
    label: 'Section Two',
    roman: 'II',
    hebrew: 'פְּסוּקֵי דְּזִמְרָה',
    english: "Verses of Praise — the ascent begins",
    accent: '#c9831a',
    accentHi: '#eaae4c',
    accentLow: 'rgba(201,131,26,0.13)',
    gradient: ['#e7c88a', '#e4c17d', '#e4c17d', '#d6ccaa'],
    gradientStops: [0, 0.10, 0.84, 1.0],
  },
  shema: {
    label: 'Section Three',
    roman: 'III',
    hebrew: 'קְרִיאַת שְׁמַע',
    english: "The Shema and Its Blessings — the heart of the service",
    accent: '#1d4a7a',
    accentHi: '#3f77aa',
    accentLow: 'rgba(29,74,122,0.16)',
    gradient: ['#d6ccaa', '#c3d0e1', '#c3d0e1', '#ccd4c1'],
    gradientStops: [0, 0.18, 0.84, 1.0],
  },
  concluding: {
    label: 'Section Four',
    roman: 'IV',
    hebrew: 'עָלֵינוּ',
    english: 'Concluding Prayers — carrying the service back into the day',
    accent: '#5c6b2f',
    accentHi: '#8ea051',
    accentLow: 'rgba(92,107,47,0.14)',
    gradient: ['#ccd4c1', '#d1d7b6', '#d1d7b6', '#d1d7b6'],
    gradientStops: [0, 0.12, 0.88, 1.0],
  },
};

export const SECTION_ORDER: SectionId[] = ['birchot', 'pesukei', 'shema', 'concluding'];

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
