import { Prayer, AudioSource } from '../../types';

/**
 * Shacharit (Morning Prayer) order — Nusach Ashkenaz.
 *
 * Sefaria references follow the format:
 *   Siddur Ashkenaz, Weekday, Shacharit, {Section}, {SubSection}
 *
 * Returns prayer metadata; actual text content is loaded via Sefaria API.
 */

interface PrayerDefinition {
  id: string;
  sefariaRef: string;
  nameHebrew: string;
  nameEnglish: string;
  nameTransliteration: string;
  audioSource: AudioSource;
  instructions?: string;
}

const SHACHARIT_PRAYERS: PrayerDefinition[] = [
  {
    id: 'modeh_ani',
    sefariaRef: 'Siddur Ashkenaz, Weekday, Shacharit, Preparatory Prayers, Modeh Ani',
    nameHebrew: 'מודה אני',
    nameEnglish: 'Modeh Ani',
    nameTransliteration: 'Modeh Ani',
    audioSource: 'recorded',
    instructions: 'Said immediately upon waking, before washing hands.',
  },
  {
    id: 'netilat_yadayim',
    sefariaRef: 'Siddur Ashkenaz, Weekday, Shacharit, Preparatory Prayers, Netilat Yadayim',
    nameHebrew: 'נטילת ידיים',
    nameEnglish: 'Washing of the Hands',
    nameTransliteration: 'Netilat Yadayim',
    audioSource: 'recorded',
    instructions: 'Wash hands alternating three times, then say the blessing.',
  },
  {
    id: 'asher_yatzar',
    sefariaRef: 'Siddur Ashkenaz, Weekday, Shacharit, Preparatory Prayers, Asher Yatzar',
    nameHebrew: 'אשר יצר',
    nameEnglish: 'Asher Yatzar',
    nameTransliteration: 'Asher Yatzar',
    audioSource: 'recorded',
    instructions: 'Blessing acknowledging the body\'s functioning.',
  },
  {
    id: 'elokai_neshama',
    sefariaRef: 'Siddur Ashkenaz, Weekday, Shacharit, Preparatory Prayers, Elokai Neshama',
    nameHebrew: 'אלהי נשמה',
    nameEnglish: 'Elokai Neshama',
    nameTransliteration: 'Elokai Neshama',
    audioSource: 'recorded',
    instructions: 'Blessing for the soul.',
  },
  {
    id: 'birchot_hatorah',
    sefariaRef: 'Siddur Ashkenaz, Weekday, Shacharit, Preparatory Prayers, Torah Blessings',
    nameHebrew: 'ברכות התורה',
    nameEnglish: 'Torah Blessings',
    nameTransliteration: 'Birchot HaTorah',
    audioSource: 'recorded',
    instructions: 'Blessings before Torah study, includes the priestly blessing.',
  },
  {
    id: 'birchot_hashachar',
    sefariaRef: 'Siddur Ashkenaz, Weekday, Shacharit, Preparatory Prayers, Morning Blessings',
    nameHebrew: 'ברכות השחר',
    nameEnglish: 'Morning Blessings',
    nameTransliteration: 'Birchot HaShachar',
    audioSource: 'recorded',
    instructions: 'Series of blessings thanking God for daily gifts.',
  },
  {
    id: 'akedah',
    sefariaRef: 'Siddur Ashkenaz, Weekday, Shacharit, Preparatory Prayers, Akedah',
    nameHebrew: 'עקידה',
    nameEnglish: 'The Binding of Isaac',
    nameTransliteration: 'Akedah',
    audioSource: 'recorded',
  },
  {
    id: 'korbanot',
    sefariaRef: 'Siddur Ashkenaz, Weekday, Shacharit, Preparatory Prayers, Korbanot, Korban HaTamid',
    nameHebrew: 'קרבנות',
    nameEnglish: 'Sacrificial Passages',
    nameTransliteration: 'Korbanot',
    audioSource: 'recorded',
    instructions: 'Passages about the Temple sacrifices.',
  },
  {
    id: 'pesukei_dezimrah',
    sefariaRef: 'Siddur Ashkenaz, Weekday, Shacharit, Pesukei Dezimrah',
    nameHebrew: 'פסוקי דזמרה',
    nameEnglish: 'Verses of Praise',
    nameTransliteration: "Pesukei D'Zimrah",
    audioSource: 'recorded',
    instructions: 'Begins with Baruch She\'Amar, ends with Yishtabach. Includes Ashrei and Psalms 146-150.',
  },
  {
    id: 'shema',
    sefariaRef: 'Siddur Ashkenaz, Weekday, Shacharit, Blessings of the Shema, Shema',
    nameHebrew: 'שמע',
    nameEnglish: 'Shema and its Blessings',
    nameTransliteration: 'Shema',
    audioSource: 'recorded',
    instructions: 'The central declaration of faith. Cover eyes for first line. Includes Yotzer Or, Ahavah Rabbah.',
  },
  {
    id: 'amidah',
    sefariaRef: 'Siddur Ashkenaz, Weekday, Shacharit, Amidah',
    nameHebrew: 'עמידה',
    nameEnglish: 'Amidah (Standing Prayer)',
    nameTransliteration: 'Amidah',
    audioSource: 'recorded',
    instructions: 'Stand with feet together, facing Jerusalem. Take three steps forward to begin. The 19-blessing silent prayer.',
  },
  {
    id: 'tachanun',
    sefariaRef: 'Siddur Ashkenaz, Weekday, Shacharit, Post Amidah, Tachanun, Nefilat Apayim',
    nameHebrew: 'תחנון',
    nameEnglish: 'Tachanun (Supplication)',
    nameTransliteration: 'Tachanun',
    audioSource: 'recorded',
    instructions: 'Lean head on arm. Omitted on certain days (holidays, Rosh Chodesh, etc.).',
  },
  {
    id: 'ashrei_uva_letziyon',
    sefariaRef: 'Siddur Ashkenaz, Weekday, Shacharit, Concluding Prayers, Ashrei',
    nameHebrew: 'אשרי / ובא לציון',
    nameEnglish: "Ashrei / U'va L'Tziyon",
    nameTransliteration: "Ashrei / U'va L'Tziyon",
    audioSource: 'recorded',
  },
  {
    id: 'aleinu',
    sefariaRef: 'Siddur Ashkenaz, Weekday, Shacharit, Concluding Prayers, Alenu',
    nameHebrew: 'עלינו',
    nameEnglish: 'Aleinu',
    nameTransliteration: 'Aleinu',
    audioSource: 'recorded',
    instructions: 'Concluding prayer. Bow at "va-anachnu kor\'im".',
  },
  {
    id: 'shir_shel_yom',
    sefariaRef: 'Siddur Ashkenaz, Weekday, Shacharit, Concluding Prayers, Song of the Day',
    nameHebrew: 'שיר של יום',
    nameEnglish: 'Psalm of the Day',
    nameTransliteration: 'Shir Shel Yom',
    audioSource: 'recorded',
    instructions: 'The daily psalm varies by day of the week.',
  },
];

/**
 * Returns the full Shacharit prayer list as Prayer objects.
 * Text content (sections/lines) is initially empty — loaded via prayerTextService.
 */
export function getShacharitPrayers(): Prayer[] {
  return SHACHARIT_PRAYERS.map((def) => ({
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

/**
 * Returns the Sefaria ref for the Shir Shel Yom (daily psalm) based on day of week.
 * Sunday=24, Monday=48, Tuesday=82, Wednesday=94, Thursday=81, Friday=93, Shabbat=92
 */
export function getShirShelYomRef(dayOfWeek: number): string {
  const psalms: Record<number, number> = {
    0: 24, // Sunday
    1: 48, // Monday
    2: 82, // Tuesday
    3: 94, // Wednesday
    4: 81, // Thursday
    5: 93, // Friday
    6: 92, // Shabbat
  };
  const psalm = psalms[dayOfWeek] ?? 24;
  return `Psalms ${psalm}`;
}
