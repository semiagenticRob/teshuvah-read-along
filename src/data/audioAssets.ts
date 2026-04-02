/**
 * Audio asset map for bundled prayer recordings.
 * Generated via ElevenLabs v3 API with word-level timestamps.
 *
 * Prayers not listed here fall back to TTS (expo-speech).
 */

/* eslint-disable @typescript-eslint/no-var-requires */
const AUDIO_ASSETS: Record<string, number> = {
  // Shacharit
  modeh_ani: require('../../assets/audio/shacharit/modeh_ani.mp3'),
  netilat_yadayim: require('../../assets/audio/shacharit/netilat_yadayim.mp3'),
  asher_yatzar: require('../../assets/audio/shacharit/asher_yatzar.mp3'),
  elokai_neshama: require('../../assets/audio/shacharit/elokai_neshama.mp3'),
  birchot_hatorah: require('../../assets/audio/shacharit/birchot_hatorah.mp3'),
  birchot_hashachar: require('../../assets/audio/shacharit/birchot_hashachar.mp3'),
  akedah: require('../../assets/audio/shacharit/akedah.mp3'),
  korbanot: require('../../assets/audio/shacharit/korbanot.mp3'),
  pesukei_dezimrah: require('../../assets/audio/shacharit/pesukei_dezimrah.mp3'),
  shema: require('../../assets/audio/shacharit/shema.mp3'),
  amidah: require('../../assets/audio/shacharit/amidah.mp3'),
  tachanun: require('../../assets/audio/shacharit/tachanun.mp3'),
  ashrei_uva_letziyon: require('../../assets/audio/shacharit/ashrei_uva_letziyon.mp3'),
  aleinu: require('../../assets/audio/shacharit/aleinu.mp3'),
  shir_shel_yom: require('../../assets/audio/shacharit/shir_shel_yom.mp3'),
  // Mincha
  mincha_ashrei: require('../../assets/audio/mincha/mincha_ashrei.mp3'),
  mincha_amidah: require('../../assets/audio/mincha/mincha_amidah.mp3'),
  mincha_tachanun: require('../../assets/audio/mincha/mincha_tachanun.mp3'),
  mincha_aleinu: require('../../assets/audio/mincha/mincha_aleinu.mp3'),
  // Maariv
  maariv_vehu_rachum: require('../../assets/audio/maariv/maariv_vehu_rachum.mp3'),
  maariv_shema: require('../../assets/audio/maariv/maariv_shema.mp3'),
  maariv_amidah: require('../../assets/audio/maariv/maariv_amidah.mp3'),
  maariv_aleinu: require('../../assets/audio/maariv/maariv_aleinu.mp3'),
  // Birkat Hamazon
  bh_zimmun: require('../../assets/audio/birkatHamazon/bh_zimmun.mp3'),
  bh_hazan: require('../../assets/audio/birkatHamazon/bh_hazan.mp3'),
  bh_haaretz: require('../../assets/audio/birkatHamazon/bh_haaretz.mp3'),
  bh_yerushalayim: require('../../assets/audio/birkatHamazon/bh_yerushalayim.mp3'),
  bh_hatov: require('../../assets/audio/birkatHamazon/bh_hatov.mp3'),
};

/**
 * Returns the bundled audio asset for a prayer, or undefined if none exists.
 */
export function getAudioAsset(prayerId: string): number | undefined {
  return AUDIO_ASSETS[prayerId];
}
