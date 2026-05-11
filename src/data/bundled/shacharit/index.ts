/**
 * Index of bundled Shacharit prayer text data.
 * Sefaria-sourced today; Feigenbaum-sourced after V1 content migration.
 */

export type CommentaryTone =
  | 'kavanah'
  | 'halacha'
  | 'historical'
  | 'translation-help'
  | 'faq';

export interface BundledCommentary {
  lineIndex: number;
  wordIndex?: number;
  marker: string;
  text: string;
  audioUri?: string;
  tone?: CommentaryTone;
  estimatedReadMs?: number;
}

export type VariantTag =
  | 'tachanun-skip'
  | 'rosh-chodesh'
  | 'aseret-ymei-teshuva'
  | 'fast';

export interface BundledPrayerSegment {
  lineIndex: number;
  variantTag?: VariantTag;
  variantMode?: 'omit' | 'include-only';
  simplifiedOmit?: boolean;
}

export type PrayerSource = 'sefaria' | 'feigenbaum';

/**
 * Typed paragraph kind for the English commentary lane. Feigenbaum's
 * pedagogy threads section titles, interjections, FAQs, and "Instant
 * Insight" callouts through the prose; rendering them with the same
 * style as body text loses the structure. textBlocks carries the kind
 * per paragraph so PrayerBlock can render each distinctively.
 */
export type TextBlockKind = 'body' | 'heading' | 'subheading' | 'faq' | 'callout';

export interface TextBlock {
  kind: TextBlockKind;
  text: string;
}

export interface BundledPrayerText {
  ref: string;
  he: string[];
  /** Typed English paragraphs. Optional only to support loader fallback for
   *  legacy JSONs; new extractions always emit it. */
  textBlocks?: TextBlock[];
  commentary?: BundledCommentary[];
  segments?: BundledPrayerSegment[];
  source?: PrayerSource;
  heTitle: string;
}

const bundledShacharit: Record<string, BundledPrayerText> = {
  modeh_ani: require('./modeh_ani.json'),
  netilat_yadayim: require('./netilat_yadayim.json'),
  asher_yatzar: require('./asher_yatzar.json'),
  elokai_neshama: require('./elokai_neshama.json'),
  birchot_hatorah: require('./birchot_hatorah.json'),
  birchot_hashachar: require('./birchot_hashachar.json'),
  akedah: require('./akedah.json'),
  korbanot: require('./korbanot.json'),
  pesukei_dezimrah: require('./pesukei_dezimrah.json'),
  shema: require('./shema.json'),
  amidah: require('./amidah.json'),
  tachanun: require('./tachanun.json'),
  ashrei_uva_letziyon: require('./ashrei_uva_letziyon.json'),
  aleinu: require('./aleinu.json'),
  shir_shel_yom: require('./shir_shel_yom.json'),
  pitum_haketores: require('./pitum_haketores.json'),
  shesh_zechiros: require('./shesh_zechiros.json'),
};

export function getBundledPrayerText(prayerId: string): BundledPrayerText | undefined {
  return bundledShacharit[prayerId];
}
