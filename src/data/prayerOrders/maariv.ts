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

const P = 'Siddur Ashkenaz, Weekday, Maariv';

const MAARIV_PRAYERS: PrayerDefinition[] = [
  {
    id: 'maariv_vehu_rachum',
    sefariaRef: `${P}, Vehu Rachum`,
    nameHebrew: 'והוא רחום',
    nameEnglish: 'Vehu Rachum',
    nameTransliteration: 'Vehu Rachum',
    audioSource: 'recorded',
    instructions: 'Opening verse of the evening service.',
  },
  {
    id: 'maariv_shema',
    sefariaRef: `${P}, Blessings of the Shema, Shema`,
    nameHebrew: 'שמע',
    nameEnglish: 'Shema and its Blessings',
    nameTransliteration: 'Shema',
    audioSource: 'recorded',
    instructions: 'The central declaration of faith. Cover eyes for first line.',
  },
  {
    id: 'maariv_amidah',
    sefariaRef: `${P}, Amidah, Patriarchs`,
    nameHebrew: 'עמידה',
    nameEnglish: 'Amidah (Standing Prayer)',
    nameTransliteration: 'Amidah',
    audioSource: 'recorded',
    instructions: 'Stand with feet together, facing Jerusalem. Take three steps forward to begin.',
  },
  {
    id: 'maariv_aleinu',
    sefariaRef: `${P}, Alenu`,
    nameHebrew: 'עלינו',
    nameEnglish: 'Aleinu',
    nameTransliteration: 'Aleinu',
    audioSource: 'recorded',
    instructions: 'Concluding prayer. Bow at "va-anachnu kor\'im".',
  },
];

export function getMaarivPrayers(): Prayer[] {
  return MAARIV_PRAYERS.map((def) => ({
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
