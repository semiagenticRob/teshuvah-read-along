import type { SectionId } from '../../theme/shacharitTheme';

export interface SectionSpec {
  id: SectionId;
  prayerIds: string[];
  /**
   * Optional transition text rendered as a standalone block BETWEEN prayers
   * (after the listed prayerId, before the next prayer in the section).
   * Keyed by the prayerId the subheader follows.
   *
   * Feigenbaum uses these as pedagogical bridges between prayers — short
   * declarative lines that frame the next prayer's purpose. Rendered in the
   * section's accent color with italic display type.
   */
  subheadersAfter?: Record<string, string>;
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
      'reishis_chochmah', // Reishis Chochmah ("The Root of Gaining")
      'netilat_yadayim',  // Netilat Yadayim
      'asher_yatzar',     // Asher Yatzar
      'elokai_neshama',   // Elohai Neshamah
      'birchot_hashachar',// Birchot HaShachar (morning blessings block)
      'birchot_hatorah',  // Birchot HaTorah
      'akedah',           // Akedah
      'korbanot',         // Korbanot
    ],
    subheadersAfter: {
      modeh_ani: "OK — but I can’t climb to the next rung if I don’t understand what to do!",
      reishis_chochmah: "OK — but I need “tools” in order to apply all this wisdom and accomplish my goals!",
    },
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
      'pitum_haketores',    // Pitum Ha'Ketores (incense recitation)
      'shesh_zechiros',     // Shesh Zechiros (six remembrances)
    ],
  },
];
