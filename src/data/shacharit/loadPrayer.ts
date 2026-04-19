export interface BundledPrayer {
  englishName: string;
  hebrewName: string;
  hebrewText: string;
  translitText: string;
  englishText: string;
}

// Lazy require thunks. Metro still bundles every JSON (static require paths are
// mandatory for bundling), but the JSON is NOT parsed until the thunk is called.
// This means navigating to Shacharit no longer forces 15 JSONs (~320 KB) to be
// parsed up front — each prayer pays its own parse cost the first time it renders.
const bundledLoaders: Record<string, () => any> = {
  modeh_ani:           () => require('../bundled/shacharit/modeh_ani.json'),
  netilat_yadayim:     () => require('../bundled/shacharit/netilat_yadayim.json'),
  asher_yatzar:        () => require('../bundled/shacharit/asher_yatzar.json'),
  elokai_neshama:      () => require('../bundled/shacharit/elokai_neshama.json'),
  birchot_hashachar:   () => require('../bundled/shacharit/birchot_hashachar.json'),
  birchot_hatorah:     () => require('../bundled/shacharit/birchot_hatorah.json'),
  akedah:              () => require('../bundled/shacharit/akedah.json'),
  korbanot:            () => require('../bundled/shacharit/korbanot.json'),
  pesukei_dezimrah:    () => require('../bundled/shacharit/pesukei_dezimrah.json'),
  shema:               () => require('../bundled/shacharit/shema.json'),
  amidah:              () => require('../bundled/shacharit/amidah.json'),
  tachanun:            () => require('../bundled/shacharit/tachanun.json'),
  ashrei_uva_letziyon: () => require('../bundled/shacharit/ashrei_uva_letziyon.json'),
  aleinu:              () => require('../bundled/shacharit/aleinu.json'),
  shir_shel_yom:       () => require('../bundled/shacharit/shir_shel_yom.json'),
};

const translitLoaders: Record<string, () => any> = {
  modeh_ani:           () => require('../bundled/shacharit/modeh_ani.translit.json'),
  netilat_yadayim:     () => require('../bundled/shacharit/netilat_yadayim.translit.json'),
  asher_yatzar:        () => require('../bundled/shacharit/asher_yatzar.translit.json'),
  elokai_neshama:      () => require('../bundled/shacharit/elokai_neshama.translit.json'),
  birchot_hashachar:   () => require('../bundled/shacharit/birchot_hashachar.translit.json'),
  birchot_hatorah:     () => require('../bundled/shacharit/birchot_hatorah.translit.json'),
  akedah:              () => require('../bundled/shacharit/akedah.translit.json'),
  korbanot:            () => require('../bundled/shacharit/korbanot.translit.json'),
  pesukei_dezimrah:    () => require('../bundled/shacharit/pesukei_dezimrah.translit.json'),
  shema:               () => require('../bundled/shacharit/shema.translit.json'),
  amidah:              () => require('../bundled/shacharit/amidah.translit.json'),
  tachanun:            () => require('../bundled/shacharit/tachanun.translit.json'),
  ashrei_uva_letziyon: () => require('../bundled/shacharit/ashrei_uva_letziyon.translit.json'),
  aleinu:              () => require('../bundled/shacharit/aleinu.translit.json'),
  shir_shel_yom:       () => require('../bundled/shacharit/shir_shel_yom.translit.json'),
};

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

function englishNameFromRef(ref: string, fallback: string): string {
  if (!ref) return fallback;
  const parts = ref.split(',');
  const last = parts[parts.length - 1].trim();
  return last || fallback;
}

const cache = new Map<string, BundledPrayer>();

export function loadBundledPrayer(prayerId: string): BundledPrayer {
  const cached = cache.get(prayerId);
  if (cached) return cached;

  const loader = bundledLoaders[prayerId];
  if (!loader) {
    throw new Error(`Unknown prayer id: ${prayerId}`);
  }
  const raw = loader();

  const englishName = englishNameFromRef(raw.ref ?? '', prayerId);
  const hebrewName  = HEBREW_NAMES[prayerId] ?? '';

  const heLines: string[] = Array.isArray(raw.he)   ? raw.he   : [];
  const enLines: string[] = Array.isArray(raw.text) ? raw.text : [];

  let trLines: string[] = [];
  try {
    const trLoader = translitLoaders[prayerId];
    if (trLoader) {
      const trRaw = trLoader();
      if (Array.isArray(trRaw.translit)) trLines = trRaw.translit;
    }
  } catch {
    trLines = [];
  }

  // Pad translit to match he-line count so whitespace-based word alignment works.
  // Missing/unvoweled lines become empty strings → no translit rendered for those words.
  const paddedTranslit = heLines.map((_, i) => trLines[i] ?? '');

  const hebrewText   = heLines.join('\n').trim();
  const englishText  = enLines.join('\n').trim();
  const translitText = paddedTranslit.join('\n').trim();

  const result: BundledPrayer = { englishName, hebrewName, hebrewText, translitText, englishText };
  cache.set(prayerId, result);
  return result;
}

// Lightweight metadata loader: returns word count + names without forcing a full load.
// Used to populate scroll bounds before prayers are actually rendered.
export interface PrayerStub {
  id: string;
  englishName: string;
  hebrewName: string;
  wordCount: number;
}

const wordCountCache = new Map<string, number>();

export function getPrayerWordCount(prayerId: string): number {
  const cached = wordCountCache.get(prayerId);
  if (cached !== undefined) return cached;
  // First call triggers a load; subsequent calls hit cache.
  const p = loadBundledPrayer(prayerId);
  const count = p.hebrewText.trim().split(/\s+/).filter(Boolean).length;
  wordCountCache.set(prayerId, count);
  return count;
}
