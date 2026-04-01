/**
 * Index of bundled Shacharit prayer text data.
 * Pre-fetched from Sefaria API — no network required for these prayers.
 */

interface BundledPrayerText {
  ref: string;
  he: string[];
  text: string[];
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
