// ===== Prayer Data Types =====

export type Nusach = 'ashkenaz' | 'sefard' | 'edot_hamizrach';

export type AudioSource = 'recorded' | 'tts';

export type DisplayMode = 'hebrew' | 'hebrew_translit' | 'hebrew_english' | 'all';

export type TextSize = 'small' | 'medium' | 'large' | 'xlarge';

export type PlaybackSpeed = number;

export const MIN_PLAYBACK_SPEED = 0.25;
export const MAX_PLAYBACK_SPEED = 4.0;
export const DEFAULT_PLAYBACK_SPEED = 1.0;
export const SPEED_STEP = 0.25;

/** Preset speeds for Settings screen */
export const PLAYBACK_SPEED_PRESETS: number[] = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0, 4.0];

export interface WordTiming {
  /** Individual Hebrew word */
  hebrew: string;
  /** Transliteration of this word */
  transliteration: string;
  /** Audio start time in milliseconds */
  startTime: number;
  /** Audio end time in milliseconds */
  endTime: number;
}

export interface Footnote {
  /** Footnote number as displayed in text */
  marker: string;
  /** Footnote body text */
  text: string;
}

export interface PrayerLine {
  /** Full Hebrew line */
  hebrew: string;
  /** English translation (footnotes stripped) */
  english: string;
  /** Transliteration of the full line */
  transliteration: string;
  /** Word-level data for audio sync */
  words: WordTiming[];
  /** Footnotes extracted from the English translation */
  footnotes?: Footnote[];
}

export interface PrayerSection {
  id: string;
  title?: {
    hebrew: string;
    english: string;
  };
  lines: PrayerLine[];
}

export interface Prayer {
  /** Unique identifier, e.g. "modeh_ani" */
  id: string;
  /** Sefaria API reference string */
  sefariaRef: string;
  /** Display names */
  name: {
    hebrew: string;
    english: string;
    transliteration: string;
  };
  /** Prayer content organized in sections */
  sections: PrayerSection[];
  /** Whether this prayer uses pre-recorded audio or TTS */
  audioSource: AudioSource;
  /** Path to bundled audio file (if pre-recorded) */
  audioFile?: string;
  /** Instructional notes for the user (e.g., "Stand for this prayer") */
  instructions?: string;
}

export interface PrayerService {
  /** Service identifier, e.g. "shacharit" */
  id: string;
  /** Display name */
  name: {
    hebrew: string;
    english: string;
  };
  /** Which nusach this service follows */
  nusach: Nusach;
  /** Ordered list of prayers in this service */
  prayers: Prayer[];
}

// ===== Sefaria API Types =====

export interface SefariaTextResponse {
  ref: string;
  he: string | string[];
  text: string | string[];
  sectionNames: string[];
  titleVariants: string[];
  heTitle: string;
}

// ===== Navigation Types =====

export type RootStackParamList = {
  Home: undefined;
  PrayerList: { serviceId: string };
  ReadAlong: { serviceId: string; prayerIndex: number };
  Settings: undefined;
  About: undefined;
};

// ===== Day of Week (for varying prayers) =====

export type DayOfWeek =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'shabbat';
