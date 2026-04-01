import { Prayer, AudioSource } from '../../types';

interface PrayerDefinition {
  id: string;
  sefariaRef: string;
  nameHebrew: string;
  nameEnglish: string;
  nameTransliteration: string;
  audioSource: AudioSource;
  instructions?: string;
}

const BIRKAT_HAMAZON_PRAYERS: PrayerDefinition[] = [
  {
    id: 'bh_zimmun',
    sefariaRef: 'Birkat Hamazon, Zimmun',
    nameHebrew: 'זימון',
    nameEnglish: 'Zimmun (Invitation)',
    nameTransliteration: 'Zimmun',
    audioSource: 'tts',
    instructions: 'Call to say grace together. Requires 3 or more people.',
  },
  {
    id: 'bh_hazan',
    sefariaRef: 'Birkat Hamazon, Blessing on the Food',
    nameHebrew: 'ברכת הזן',
    nameEnglish: 'Blessing on the Food',
    nameTransliteration: 'Birkat HaZan',
    audioSource: 'tts',
    instructions: 'First blessing — thanking God for providing food.',
  },
  {
    id: 'bh_haaretz',
    sefariaRef: 'Birkat Hamazon, Blessing on the Land',
    nameHebrew: 'ברכת הארץ',
    nameEnglish: 'Blessing on the Land',
    nameTransliteration: 'Birkat HaAretz',
    audioSource: 'tts',
    instructions: 'Second blessing — thanking God for the Land of Israel.',
  },
  {
    id: 'bh_yerushalayim',
    sefariaRef: 'Birkat Hamazon, Blessing on Jerusalem',
    nameHebrew: 'בונה ירושלים',
    nameEnglish: 'Blessing on Jerusalem',
    nameTransliteration: 'Bonei Yerushalayim',
    audioSource: 'tts',
    instructions: 'Third blessing — prayer for the rebuilding of Jerusalem.',
  },
  {
    id: 'bh_hatov',
    sefariaRef: 'Birkat Hamazon, Hatov Vehametiv',
    nameHebrew: 'הטוב והמטיב',
    nameEnglish: 'The Good and Beneficent',
    nameTransliteration: 'HaTov VeHaMeitiv',
    audioSource: 'tts',
    instructions: 'Fourth blessing — acknowledging God\'s goodness.',
  },
];

export function getBirkatHamazonPrayers(): Prayer[] {
  return BIRKAT_HAMAZON_PRAYERS.map((def) => ({
    id: def.id,
    sefariaRef: def.sefariaRef,
    name: {
      hebrew: def.nameHebrew,
      english: def.nameEnglish,
      transliteration: def.nameTransliteration,
    },
    sections: [],
    audioSource: def.audioSource,
    instructions: def.instructions,
  }));
}
