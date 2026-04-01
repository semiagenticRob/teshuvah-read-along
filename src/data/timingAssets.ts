/**
 * Timing data for word-level audio sync.
 * Extracted from readalongsiddur.com's data-begin/data-dur attributes.
 */

/* eslint-disable @typescript-eslint/no-var-requires */
const TIMING_ASSETS: Record<string, { words: { startTime: number; endTime: number }[] }[]> = {
  modeh_ani: require('../../assets/timing/shacharit/modeh_ani.json'),
  netilat_yadayim: require('../../assets/timing/shacharit/netilat_yadayim.json'),
  asher_yatzar: require('../../assets/timing/shacharit/asher_yatzar.json'),
  elokai_neshama: require('../../assets/timing/shacharit/elokai_neshama.json'),
  birchot_hatorah: require('../../assets/timing/shacharit/birchot_hatorah.json'),
  birchot_hashachar: require('../../assets/timing/shacharit/birchot_hashachar.json'),
  pesukei_dezimrah: require('../../assets/timing/shacharit/pesukei_dezimrah.json'),
  shema: require('../../assets/timing/shacharit/shema.json'),
  amidah: require('../../assets/timing/shacharit/amidah.json'),
  ashrei_uva_letziyon: require('../../assets/timing/shacharit/ashrei_uva_letziyon.json'),
  aleinu: require('../../assets/timing/shacharit/aleinu.json'),
};

export function getTimingData(prayerId: string): { words: { startTime: number; endTime: number }[] }[] | undefined {
  return TIMING_ASSETS[prayerId];
}
