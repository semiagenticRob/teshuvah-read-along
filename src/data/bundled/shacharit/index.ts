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
  minyanOnly?: boolean;
  minyanLabel?: string;
  variantTag?: VariantTag;
  variantMode?: 'omit' | 'include-only';
  simplifiedOmit?: boolean;
}

export type PrayerSource = 'sefaria' | 'feigenbaum';

export interface BundledPrayerText {
  ref: string;
  he: string[];
  text: string[];
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
};

export function getBundledPrayerText(prayerId: string): BundledPrayerText | undefined {
  return bundledShacharit[prayerId];
}
