import type { SectionId } from '../../theme/shacharitTheme';

export interface SectionSpec {
  id: SectionId;
  prayerIds: string[];
}

// Each prayerId below corresponds to a bundled JSON filename in
// src/data/bundled/shacharit/ (filename minus the .json extension).
// Order = the order a worshipper experiences Shacharit top-to-bottom.
//
// Canonical prayers NOT present in bundled files (omitted):
//   Birchot HaShachar: HaNoten LaYa'ef Ko'ach
//   Pesukei D'Zimra: Mizmor L'Todah, Yishtabach (folded into pesukei_dezimrah)
//   Shema section: Barchu, V'Ahavta, Emet V'Yatziv (folded into shema)
//   Concluding: Kaddish Yatom, Ein Keloheinu, Adon Olam
export const SHACHARIT_STRUCTURE: SectionSpec[] = [
  {
    id: 'birchot',
    prayerIds: [
      'modeh_ani',        // Modeh Ani
      'netilat_yadayim',  // Netilat Yadayim
      'asher_yatzar',     // Asher Yatzar
      'elokai_neshama',   // Elohai Neshamah
      'birchot_hashachar',// Birchot HaShachar (morning blessings block)
      'birchot_hatorah',  // Birchot HaTorah
      'akedah',           // Akedah
      'korbanot',         // Korbanot
    ],
  },
  {
    id: 'pesukei',
    prayerIds: [
      'pesukei_dezimrah', // Pesukei D'Zimra block: Baruch She'Amar → Ashrei → Yishtabach
    ],
  },
  {
    id: 'shema',
    prayerIds: [
      'shema', // Blessings of the Shema block: Yotzer Or → Shema → V'Ahavta → Emet V'Yatziv
    ],
  },
  {
    id: 'concluding',
    prayerIds: [
      'amidah',             // Amidah (Shemoneh Esrei)
      'tachanun',           // Tachanun
      'ashrei_uva_letziyon',// Ashrei + U'Va L'Tziyon (post-Amidah)
      'aleinu',             // Aleinu
      'shir_shel_yom',      // Shir Shel Yom (Song of the Day)
    ],
  },
];
