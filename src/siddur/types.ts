// src/siddur/types.ts

export type CardId =
  | 'shacharit'
  | 'birkat_hamazon'
  | 'mincha'
  | 'maariv'
  | 'tefillos'
  | 'learn';

export interface SiddurCard {
  id: CardId;
  title: { he: string; en: string };
  kind: 'karaoke' | 'reading';
  sections: SectionRef[];
}

export interface SectionRef {
  id: string;
  title: { he: string; en: string };
  pagePdf: number;
}

// ============================================================
// Section
// ============================================================

export interface SiddurSection {
  id: string;
  cardId: CardId;
  title: { he: string; en: string };
  source: 'feigenbaum';
  sourcePages: [number, number];

  blocks: SiddurBlock[];
  conditionalRule?: ConditionalRule;
  conditionalTags?: ConditionalTag[];
}

// ============================================================
// Block union
// ============================================================

export type SiddurBlock =
  | PrayerBlock
  | HeadingBlock
  | RubricBlock
  | FaqBlock
  | MinyanOnlyBlock
  | LearnCrossLinkBlock
  | VariantBlock
  | OmerCountBlock;

export interface PrayerBlock {
  kind: 'prayer';
  he: HebrewLine[];
  en: EnglishParagraph[];
  translit?: TranslitLine[];
  wordIndexStart: number;
  wordIndexEnd: number;
}

export interface HebrewLine {
  lineIndex: number;
  words: HebrewWord[];
}

export interface HebrewWord {
  globalIndex: number;
  text: string;
}

export interface EnglishParagraph {
  spans: EnglishSpan[];
  anchorLine?: number;
}

export interface EnglishSpan {
  text: string;
  style?: 'italic' | 'bold';
}

export interface TranslitLine {
  lineIndex: number;
  words: TranslitWord[];
  source: 'sefaria-ported' | 'feigenbaum-pdf' | 'missing';
}

export interface TranslitWord {
  text: string | null;
}

export interface HeadingBlock {
  kind: 'heading' | 'subsection';
  he?: string;
  en: string;
}

export interface RubricBlock {
  kind: 'rubric';
  text: { he?: string; en: string };
  italic: boolean;
}

export interface FaqBlock {
  kind: 'faq' | 'callout' | 'instant_insight';
  title?: string;
  body: EnglishParagraph[];
}

export interface MinyanOnlyBlock {
  kind: 'minyan_only';
  reason:
    | 'kaddish'
    | 'barchu'
    | 'kedushah'
    | 'birkas_cohanim'
    | 'krias_hatorah'
    | 'other';
  he: HebrewLine[];
  en: EnglishParagraph[];
  translit?: TranslitLine[];
}

export interface LearnCrossLinkBlock {
  kind: 'learn_link';
  essayId: string;
  promptText?: string;
}

export interface VariantBlock {
  kind: 'variant';
  primaryVariantIndex: number;
  variants: VariantOption[];
}

export interface VariantOption {
  label: string;
  rule: ConditionalRule;
  he?: HebrewLine[];
  en?: EnglishParagraph[];
  translit?: TranslitLine[];
}

export interface OmerCountBlock {
  kind: 'omer_count';
  he: HebrewLine[];
  en: EnglishParagraph[];
}

// ============================================================
// Conditional rules
// ============================================================

export type ConditionalRule =
  | { type: 'skip_on'; days: SpecialDay[] }
  | { type: 'rosh_chodesh_only' }
  | { type: 'chanukah_only' }
  | { type: 'purim_only' }
  | { type: 'chol_hamoed_only'; festival?: 'pesach' | 'sukkos' }
  | { type: 'sefirah_only' }
  | { type: 'motzaei_shabbos_only' }
  | { type: 'fast_day_only' }
  | { type: 'days_of_week_only'; days: ('mon' | 'thu')[] }
  | { type: 'date_window'; from: HebrewDateRef; to: HebrewDateRef }
  | { type: 'amidah_winter' }
  | { type: 'amidah_summer' }
  | { type: 'amidah_geshem_only' }
  | { type: 'hallel'; variant: 'full' | 'half' }
  | { type: 'community_minhag'; key: string };

export type SpecialDay =
  | 'rosh_chodesh'
  | 'chanukah'
  | 'purim'
  | 'shushan_purim'
  | 'chol_hamoed_pesach'
  | 'chol_hamoed_sukkos'
  | 'isru_chag'
  | 'tu_bav'
  | 'tu_bshvat'
  | 'pesach_sheni'
  | 'lag_bomer'
  | 'erev_rh'
  | 'erev_yk'
  | 'erev_pesach'
  | 'erev_shavuos'
  | 'aseres_yemei_teshuva'
  | 'rest_of_tishrei_after_yk'
  | 'tisha_bav_mincha'
  | 'day_of_bris_in_shul';

export type HebrewMonth =
  | 'tishrei' | 'cheshvan' | 'kislev' | 'tevet'
  | 'shvat' | 'adar_i' | 'adar_ii' | 'adar'
  | 'nisan' | 'iyar' | 'sivan' | 'tammuz'
  | 'av' | 'elul';

export type HebrewDateRef =
  | { kind: 'month_day'; month: HebrewMonth; day: number }
  | { kind: 'before_holiday'; holiday: SpecialDay; daysBefore: number }
  | { kind: 'first_day_of'; holiday: SpecialDay };

export interface ConditionalTag {
  blockIndex: number;
  rule: ConditionalRule;
}

// ============================================================
// Learn essay
// ============================================================

export interface LearnEssay {
  id: string;
  essayKind: 'appendix' | 'personal_note' | 'introduction' | 'glossary';
  title: { he?: string; en: string };
  source: 'feigenbaum';
  sourcePages: [number, number];
  body: EnglishParagraph[];
  anchoredFrom: { cardId: CardId; sectionId: string }[];
}
