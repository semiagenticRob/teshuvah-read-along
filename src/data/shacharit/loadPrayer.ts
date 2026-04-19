export interface BundledPrayer {
  englishName: string;
  hebrewName: string;
  hebrewText: string;
  translitText: string;
  englishText: string;
}

// The require() mapping below is critical — Metro bundles JSONs via require()
// so we need a static mapping for each prayer id. Do NOT use dynamic require with
// a string variable — Metro won't bundle that.
const bundled: Record<string, any> = {
  modeh_ani:           require('../bundled/shacharit/modeh_ani.json'),
  netilat_yadayim:     require('../bundled/shacharit/netilat_yadayim.json'),
  asher_yatzar:        require('../bundled/shacharit/asher_yatzar.json'),
  elokai_neshama:      require('../bundled/shacharit/elokai_neshama.json'),
  birchot_hashachar:   require('../bundled/shacharit/birchot_hashachar.json'),
  birchot_hatorah:     require('../bundled/shacharit/birchot_hatorah.json'),
  akedah:              require('../bundled/shacharit/akedah.json'),
  korbanot:            require('../bundled/shacharit/korbanot.json'),
  pesukei_dezimrah:    require('../bundled/shacharit/pesukei_dezimrah.json'),
  shema:               require('../bundled/shacharit/shema.json'),
  amidah:              require('../bundled/shacharit/amidah.json'),
  tachanun:            require('../bundled/shacharit/tachanun.json'),
  ashrei_uva_letziyon: require('../bundled/shacharit/ashrei_uva_letziyon.json'),
  aleinu:              require('../bundled/shacharit/aleinu.json'),
  shir_shel_yom:       require('../bundled/shacharit/shir_shel_yom.json'),
};

// Actual Hebrew names for each prayer id.
// The bundled JSONs have heTitle = the id string, not real Hebrew, so we supply them here.
const HEBREW_NAMES: Record<string, string> = {
  modeh_ani:           'מוֹדֶה אֲנִי',
  netilat_yadayim:     'נְטִילַת יָדַיִם',
  asher_yatzar:        'אַשֶּׁר יָצַר',
  elokai_neshama:      'אֱלֹהַי נְשָׁמָה',
  birchot_hashachar:   'בִּרְכוֹת הַשַּׁחַר',
  birchot_hatorah:     'בִּרְכוֹת הַתּוֹרָה',
  akedah:              'עֲקֵדָה',
  korbanot:            'קָרְבָּנוֹת',
  pesukei_dezimrah:    'פְּסוּקֵי דְזִמְרָה',
  shema:               'שְׁמַע יִשְׂרָאֵל',
  amidah:              'עֲמִידָה',
  tachanun:            'תַּחֲנוּן',
  ashrei_uva_letziyon: 'אַשְׁרֵי וּבָא לְצִיּוֹן',
  aleinu:              'עָלֵינוּ',
  shir_shel_yom:       'שִׁיר שֶׁל יוֹם',
};

// Derive a clean English name from the `ref` field.
// Example ref: "Siddur Ashkenaz, Weekday, Shacharit, Preparatory Prayers, Modeh Ani"
// → last segment after the final comma, trimmed.
function englishNameFromRef(ref: string, fallback: string): string {
  if (!ref) return fallback;
  const parts = ref.split(',');
  const last = parts[parts.length - 1].trim();
  return last || fallback;
}

export function loadBundledPrayer(prayerId: string): BundledPrayer {
  const raw = bundled[prayerId];
  if (!raw) {
    throw new Error(`Unknown prayer id: ${prayerId}`);
  }

  // Actual JSON shape (confirmed by inspection):
  //   raw.ref    — "Siddur Ashkenaz, Weekday, Shacharit, ..., <English Name>"
  //   raw.heTitle — the prayer id string (NOT usable Hebrew name)
  //   raw.he     — string[]  (parallel array of Hebrew paragraphs)
  //   raw.text   — string[]  (parallel array of English paragraphs)
  //   No translit field exists in the bundled data.

  const englishName = englishNameFromRef(raw.ref ?? '', prayerId);
  const hebrewName  = HEBREW_NAMES[prayerId] ?? '';

  const heLines:  string[] = Array.isArray(raw.he)   ? raw.he   : [];
  const enLines:  string[] = Array.isArray(raw.text) ? raw.text : [];

  const hebrewText   = heLines.join('\n').trim();
  const englishText  = enLines.join('\n').trim();
  const translitText = ''; // No transliteration data in bundled JSONs

  return { englishName, hebrewName, hebrewText, translitText, englishText };
}
