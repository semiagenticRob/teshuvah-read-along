/**
 * Timing data for word-level audio sync.
 * Generated via ElevenLabs v3 API character-level timestamps, aggregated to word level.
 */

/* eslint-disable @typescript-eslint/no-var-requires */
const TIMING_ASSETS: Record<string, { words: { startTime: number; endTime: number }[] }[]> = {
  // Shacharit
  modeh_ani: require('../../assets/timing/shacharit/modeh_ani.json'),
  netilat_yadayim: require('../../assets/timing/shacharit/netilat_yadayim.json'),
  asher_yatzar: require('../../assets/timing/shacharit/asher_yatzar.json'),
  elokai_neshama: require('../../assets/timing/shacharit/elokai_neshama.json'),
  birchot_hatorah: require('../../assets/timing/shacharit/birchot_hatorah.json'),
  birchot_hashachar: require('../../assets/timing/shacharit/birchot_hashachar.json'),
  akedah: require('../../assets/timing/shacharit/akedah.json'),
  korbanot: require('../../assets/timing/shacharit/korbanot.json'),
  pesukei_dezimrah: require('../../assets/timing/shacharit/pesukei_dezimrah.json'),
  shema: require('../../assets/timing/shacharit/shema.json'),
  amidah: require('../../assets/timing/shacharit/amidah.json'),
  tachanun: require('../../assets/timing/shacharit/tachanun.json'),
  ashrei_uva_letziyon: require('../../assets/timing/shacharit/ashrei_uva_letziyon.json'),
  aleinu: require('../../assets/timing/shacharit/aleinu.json'),
  shir_shel_yom: require('../../assets/timing/shacharit/shir_shel_yom.json'),
  // Mincha
  mincha_ashrei: require('../../assets/timing/mincha/mincha_ashrei.json'),
  mincha_amidah: require('../../assets/timing/mincha/mincha_amidah.json'),
  mincha_tachanun: require('../../assets/timing/mincha/mincha_tachanun.json'),
  mincha_aleinu: require('../../assets/timing/mincha/mincha_aleinu.json'),
  // Maariv
  maariv_vehu_rachum: require('../../assets/timing/maariv/maariv_vehu_rachum.json'),
  maariv_shema: require('../../assets/timing/maariv/maariv_shema.json'),
  maariv_amidah: require('../../assets/timing/maariv/maariv_amidah.json'),
  maariv_aleinu: require('../../assets/timing/maariv/maariv_aleinu.json'),
  // Birkat Hamazon
  bh_zimmun: require('../../assets/timing/birkatHamazon/bh_zimmun.json'),
  bh_hazan: require('../../assets/timing/birkatHamazon/bh_hazan.json'),
  bh_haaretz: require('../../assets/timing/birkatHamazon/bh_haaretz.json'),
  bh_yerushalayim: require('../../assets/timing/birkatHamazon/bh_yerushalayim.json'),
  bh_hatov: require('../../assets/timing/birkatHamazon/bh_hatov.json'),
};

export function getTimingData(prayerId: string): { words: { startTime: number; endTime: number }[] }[] | undefined {
  return TIMING_ASSETS[prayerId];
}
