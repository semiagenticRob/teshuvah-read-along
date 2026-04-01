/**
 * Audio asset map for bundled prayer recordings.
 * Audio sourced from readalongsiddur.com with permission from Adam Moskowitz.
 * Recordings by Ari Hoffman and Shimon Stroll.
 *
 * Prayers not listed here fall back to TTS (expo-speech).
 */

/* eslint-disable @typescript-eslint/no-var-requires */
const AUDIO_ASSETS: Record<string, number> = {
  modeh_ani: require('../../assets/audio/shacharit/modeh_ani.mp3'),
  netilat_yadayim: require('../../assets/audio/shacharit/netilat_yadayim.mp3'),
  asher_yatzar: require('../../assets/audio/shacharit/asher_yatzar.mp3'),
  elokai_neshama: require('../../assets/audio/shacharit/elokai_neshama.mp3'),
  birchot_hatorah: require('../../assets/audio/shacharit/birchot_hatorah.mp3'),
  birchot_hashachar: require('../../assets/audio/shacharit/birchot_hashachar.mp3'),
  pesukei_dezimrah: require('../../assets/audio/shacharit/pesukei_dezimrah.mp3'),
  shema: require('../../assets/audio/shacharit/shema.mp3'),
  amidah: require('../../assets/audio/shacharit/amidah.mp3'),
  ashrei_uva_letziyon: require('../../assets/audio/shacharit/ashrei_uva_letziyon.mp3'),
  aleinu: require('../../assets/audio/shacharit/aleinu.mp3'),
};

/**
 * Returns the bundled audio asset for a prayer, or undefined if none exists.
 */
export function getAudioAsset(prayerId: string): number | undefined {
  return AUDIO_ASSETS[prayerId];
}
