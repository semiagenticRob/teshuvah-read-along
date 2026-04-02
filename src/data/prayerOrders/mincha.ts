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

const P = 'Siddur Ashkenaz, Weekday, Minchah';

const MINCHA_PRAYERS: PrayerDefinition[] = [
  {
    id: 'mincha_ashrei',
    sefariaRef: `${P}, Ashrei`,
    nameHebrew: 'אשרי',
    nameEnglish: 'Ashrei',
    nameTransliteration: 'Ashrei',
    audioSource: 'recorded',
    instructions: 'Psalm 145 with surrounding verses. Said while seated.',
  },
  {
    id: 'mincha_amidah',
    sefariaRef: `${P}, Amida, Patriarchs`,
    nameHebrew: 'עמידה',
    nameEnglish: 'Amidah (Standing Prayer)',
    nameTransliteration: 'Amidah',
    audioSource: 'recorded',
    instructions: 'Stand with feet together, facing Jerusalem. Take three steps forward to begin.',
  },
  {
    id: 'mincha_tachanun',
    sefariaRef: `${P}, Post Amidah, Tachanun, Nefilat Appayim`,
    nameHebrew: 'תחנון',
    nameEnglish: 'Tachanun (Supplication)',
    nameTransliteration: 'Tachanun',
    audioSource: 'recorded',
    instructions: 'Lean head on arm. Omitted on certain days.',
  },
  {
    id: 'mincha_aleinu',
    sefariaRef: `${P}, Concluding Prayers, Alenu`,
    nameHebrew: 'עלינו',
    nameEnglish: 'Aleinu',
    nameTransliteration: 'Aleinu',
    audioSource: 'recorded',
    instructions: 'Concluding prayer. Bow at "va-anachnu kor\'im".',
  },
];

export function getMinchaPrayers(): Prayer[] {
  return MINCHA_PRAYERS.map((def) => ({
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
