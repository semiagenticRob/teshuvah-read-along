#!/usr/bin/env node
/**
 * Stage 10 — Assemble final SiddurSection JSON into src/data/siddur/
 *
 * Reads every *.learn.json from intermediate/sections/ and every *.json from
 * intermediate/essays/, applies all required type-conformance fixes, writes the
 * final JSON to src/data/siddur/{cardId}/{sectionId}.json (with optional
 * .translit.json sidecar), and generates per-card index.ts files plus the main
 * src/data/siddur/index.ts dispatcher.
 *
 * AUTO-GENERATED output files — re-run this script to regenerate.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const SECTIONS_DIR = join(REPO_ROOT, 'content', 'feigenbaum-2026', 'intermediate', 'sections');
const ESSAYS_DIR = join(REPO_ROOT, 'content', 'feigenbaum-2026', 'intermediate', 'essays');
const OUTPUT_DIR = join(REPO_ROOT, 'src', 'data', 'siddur');

// ─── Hebrew month mapping (Nisan-based, 1=Nisan) ─────────────────────────────

const HEBREW_MONTHS = {
  1: 'nisan',
  2: 'iyar',
  3: 'sivan',
  4: 'tammuz',
  5: 'av',
  6: 'elul',
  7: 'tishrei',
  8: 'cheshvan',
  9: 'kislev',
  10: 'tevet',
  11: 'shvat',
  12: 'adar',
};

// ─── SpecialDay normalization map ─────────────────────────────────────────────
// Pipeline may emit day names not in the SpecialDay union. Map to the closest
// valid value, or null to drop from the list.

const SPECIAL_DAY_MAP = {
  // Exact matches — pass through
  rosh_chodesh: 'rosh_chodesh',
  chanukah: 'chanukah',
  purim: 'purim',
  shushan_purim: 'shushan_purim',
  chol_hamoed_pesach: 'chol_hamoed_pesach',
  chol_hamoed_sukkos: 'chol_hamoed_sukkos',
  isru_chag: 'isru_chag',
  tu_bav: 'tu_bav',
  tu_bshvat: 'tu_bshvat',
  pesach_sheni: 'pesach_sheni',
  lag_bomer: 'lag_bomer',
  erev_rh: 'erev_rh',
  erev_yk: 'erev_yk',
  erev_pesach: 'erev_pesach',
  erev_shavuos: 'erev_shavuos',
  aseres_yemei_teshuva: 'aseres_yemei_teshuva',
  rest_of_tishrei_after_yk: 'rest_of_tishrei_after_yk',
  tisha_bav_mincha: 'tisha_bav_mincha',
  day_of_bris_in_shul: 'day_of_bris_in_shul',

  // Pipeline-only names → mapped to closest valid SpecialDay
  rosh_hashana: 'erev_rh',        // closest: erev Rosh Hashana context; use as placeholder
  yom_kippur: 'erev_yk',          // closest: erev Yom Kippur context
  sukkos: 'chol_hamoed_sukkos',   // Sukkos itself → chol hamoed sukkos is closest
  shmini_atzeres: 'isru_chag',    // Shmini Atzeres → closest is isru_chag
  simchas_torah: 'isru_chag',     // Simchas Torah → closest is isru_chag
  purim_katan: 'purim',           // Purim Katan → closest is purim
  tu_bishvat: 'tu_bshvat',        // alternate spelling
  lag_baomer: 'lag_bomer',        // alternate spelling
  pesach: 'chol_hamoed_pesach',   // Pesach (whole) → chol hamoed pesach
  shavuos: 'erev_shavuos',        // Shavuos → closest is erev_shavuos context
  erev_yom_tov: 'erev_rh',        // generic erev yom tov → use erev_rh as representative
  chol_hamoed: 'chol_hamoed_pesach', // generic chol hamoed → pesach (will duplicate for sukkos context but acceptable)
};

// ─── Title derivation from sectionId ─────────────────────────────────────────

const SECTION_TITLES = {
  // shacharit
  hashkamas_haboker: { he: 'הַשְׁכָּמַת הַבֹּקֶר', en: 'Waking Up in the Morning' },
  birchos_hashachar: { he: 'בִּרְכוֹת הַשַּׁחַר', en: 'Morning Blessings' },
  pesukei_dzimrah: { he: 'פְּסוּקֵי דְזִמְרָה', en: 'Verses of Praise' },
  birchos_krias_shema_shacharit: { he: 'בִּרְכוֹת קְרִיאַת שְׁמַע', en: 'Blessings of the Shema' },
  shemoneh_esrei_shacharit: { he: 'שְׁמוֹנֶה עֶשְׂרֵה', en: 'Shemoneh Esrei' },
  tachanun_shacharit: { he: 'תַּחֲנוּן', en: 'Tachanun' },
  hallel: { he: 'הַלֵּל', en: 'Hallel' },
  krias_hatorah: { he: 'קְרִיאַת הַתּוֹרָה', en: 'Torah Reading' },
  mussaf_rosh_chodesh: { he: 'מוּסַף רֹאשׁ חֹדֶשׁ', en: 'Mussaf for Rosh Chodesh' },
  mussaf_chol_hamoed: { he: 'מוּסַף חֹל הַמּוֹעֵד', en: 'Mussaf for Chol Hamoed' },
  shir_shel_yom: { he: 'שִׁיר שֶׁל יוֹם', en: 'Psalm of the Day' },
  pitum_haketores: { he: 'פִּטּוּם הַקְּטֹרֶת', en: 'Pitum HaKetores' },
  shesh_zechiros: { he: 'שֵׁשׁ זְכִירוֹת', en: 'Six Remembrances' },
  aleinu_shacharit: { he: 'עָלֵינוּ', en: 'Aleinu' },
  barchi_nafshi: { he: 'בָּרְכִי נַפְשִׁי', en: 'Barchi Nafshi' },
  barchu: { he: 'בָּרְכוּ', en: 'Barchu' },
  ldovid_hashem_shacharit: { he: 'לְדָוִד ה׳', en: "L'David Hashem" },
  shloshah_asar_ikarim: { he: 'שְׁלֹשָׁה עָשָׂר עִקָּרִים', en: 'Thirteen Principles of Faith' },
  avinu_malkeinu_shacharit: { he: 'אָבִינוּ מַלְכֵּנוּ', en: 'Avinu Malkeinu' },
  // mincha
  mincha_ashrei: { he: 'אַשְׁרֵי', en: 'Ashrei' },
  shemoneh_esrei_mincha: { he: 'שְׁמוֹנֶה עֶשְׂרֵה', en: 'Shemoneh Esrei' },
  tachanun_mincha: { he: 'תַּחֲנוּן', en: 'Tachanun' },
  aleinu_mincha: { he: 'עָלֵינוּ', en: 'Aleinu' },
  avinu_malkeinu_mincha: { he: 'אָבִינוּ מַלְכֵּנוּ', en: 'Avinu Malkeinu' },
  // maariv
  maariv_opening: { he: 'מַעֲרִיב', en: 'Maariv Opening' },
  birchos_krias_shema_maariv: { he: 'בִּרְכוֹת קְרִיאַת שְׁמַע', en: 'Blessings of the Shema' },
  shemoneh_esrei_maariv: { he: 'שְׁמוֹנֶה עֶשְׂרֵה', en: 'Shemoneh Esrei' },
  aleinu_maariv: { he: 'עָלֵינוּ', en: 'Aleinu' },
  ldovid_hashem_maariv: { he: 'לְדָוִד ה׳', en: "L'David Hashem" },
  maariv_motzaei_shabbos: { he: 'מַעֲרִיב מוֹצָאֵי שַׁבָּת', en: 'Maariv — Motzaei Shabbos' },
  // birkat_hamazon
  birchas_hamazon: { he: 'בִּרְכַּת הַמָּזוֹן', en: 'Birkas Hamazon' },
  al_hamichyah: { he: 'עַל הַמִּחְיָה', en: 'Al HaMichyah' },
  borei_nefashos: { he: 'בּוֹרֵא נְפָשׁוֹת', en: 'Borei Nefashos' },
  // tefillos
  krias_shema_al_hamitah: { he: 'קְרִיאַת שְׁמַע עַל הַמִּטָּה', en: 'Krias Shema al HaMitah' },
  sefiras_haomer: { he: 'סְפִירַת הָעֹמֶר', en: 'Sefiras HaOmer' },
  netilas_lulav: { he: 'נְטִילַת לוּלָב', en: 'Netilas Lulav' },
  tefillas_haderech: { he: 'תְּפִלַּת הַדֶּרֶךְ', en: 'Tefillas HaDerech' },
};

function deriveTitleFromId(sectionId) {
  if (SECTION_TITLES[sectionId]) return SECTION_TITLES[sectionId];
  // Fallback: convert snake_case to Title Case
  const en = sectionId
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return { he: '', en };
}

// ─── ConditionalRule normalization ────────────────────────────────────────────

function normalizeConditionalRule(rule) {
  if (!rule) return null;

  switch (rule.type) {
    case 'date_window': {
      // Convert start/end to from/to with kind:"month_day" and HebrewMonth names
      const fromMonth = HEBREW_MONTHS[rule.start.month];
      const toMonth = HEBREW_MONTHS[rule.end.month];
      if (!fromMonth || !toMonth) {
        console.warn(`Unknown month number in date_window: ${JSON.stringify(rule)}`);
        return null;
      }
      return {
        type: 'date_window',
        from: { kind: 'month_day', month: fromMonth, day: rule.start.day },
        to: { kind: 'month_day', month: toMonth, day: rule.end.day },
      };
    }

    case 'hallel':
      // Add variant: 'half' (most common weekday Hallel context)
      return { type: 'hallel', variant: 'half' };

    case 'days_of_week_only': {
      // Map "monday" → "mon", "thursday" → "thu"
      const dayMap = { monday: 'mon', thursday: 'thu' };
      const mappedDays = (rule.days || [])
        .map((d) => dayMap[d] || d)
        .filter((d) => d === 'mon' || d === 'thu');
      return { type: 'days_of_week_only', days: mappedDays };
    }

    case 'skip_on': {
      const mappedDays = (rule.days || [])
        .map((d) => SPECIAL_DAY_MAP[d] || null)
        .filter(Boolean)
        // Deduplicate
        .filter((d, i, arr) => arr.indexOf(d) === i);
      return { type: 'skip_on', days: mappedDays };
    }

    case 'sukkos_only':
      // Not a valid ConditionalRule type; map to chol_hamoed_only with festival: sukkos
      return { type: 'chol_hamoed_only', festival: 'sukkos' };

    // Pass-through cases that match the type union exactly
    case 'rosh_chodesh_only':
    case 'chanukah_only':
    case 'purim_only':
    case 'sefirah_only':
    case 'motzaei_shabbos_only':
    case 'fast_day_only':
    case 'amidah_winter':
    case 'amidah_summer':
    case 'amidah_geshem_only':
      return rule;

    case 'chol_hamoed_only':
      // Pass through, optionally with festival field
      return rule;

    case 'community_minhag':
      return rule;

    default:
      console.warn(`Unknown conditionalRule type: ${rule.type} — dropping`);
      return null;
  }
}

// ─── Block processing ─────────────────────────────────────────────────────────

/**
 * Processes a single block, returning the cleaned block (for main JSON) and
 * the translit data (if any) for the sidecar.
 *
 * Returns { block, translit: TranslitLine[] | null }
 */
function processBlock(block) {
  const { conditionalTags: _blockCT, ...rest } = block;

  switch (block.kind) {
    case 'learn_link': {
      // Rename label → promptText
      const { label, essayId, kind } = block;
      const result = { kind, essayId };
      if (label !== undefined) result.promptText = label;
      return { block: result, translit: null };
    }

    case 'rubric': {
      // Ensure italic field exists (always true), ensure text.en format
      let text = block.text;
      if (block.rawText && !text) {
        text = { en: block.rawText };
      }
      if (!text) text = { en: '' };
      return {
        block: { kind: 'rubric', text, italic: true },
        translit: null,
      };
    }

    case 'callout':
    case 'instant_insight':
    case 'faq': {
      // Strip rawText — body is already in correct EnglishParagraph[] format
      const { rawText: _rt, conditionalTags: _ct, ...faqRest } = block;
      return { block: faqRest, translit: null };
    }

    case 'prayer': {
      // Extract translit sidecar
      const { translit, conditionalTags: _ct, ...prayerRest } = block;
      return {
        block: prayerRest,  // translit removed from main block
        translit: translit || null,
      };
    }

    case 'minyan_only': {
      // Extract translit sidecar
      const { translit, conditionalTags: _ct, ...minyanRest } = block;
      return {
        block: minyanRest,
        translit: translit || null,
      };
    }

    case 'heading':
    case 'subsection': {
      const { conditionalTags: _ct, ...headingRest } = block;
      return { block: headingRest, translit: null };
    }

    case 'variant': {
      const { conditionalTags: _ct, ...variantRest } = block;
      return { block: variantRest, translit: null };
    }

    case 'omer_count': {
      const { conditionalTags: _ct, ...omerRest } = block;
      return { block: omerRest, translit: null };
    }

    default: {
      // Pass through unknown blocks, stripping conditionalTags
      const { conditionalTags: _ct, ...unknownRest } = block;
      return { block: unknownRest, translit: null };
    }
  }
}

// ─── Section assembly ─────────────────────────────────────────────────────────

function assembleSection(raw) {
  const {
    sectionId,
    cardId,
    pageStart,
    pageEnd,
    blocks: rawBlocks,
    conditionalRule: rawConditionalRule,
  } = raw;

  const title = deriveTitleFromId(sectionId);

  // Process blocks: clean each block and collect translit sidecars + hoisted conditionalTags
  const cleanBlocks = [];
  const translitSidecar = [];   // [{ blockIndex, translit }]
  const hoistedConditionalTags = []; // [{ blockIndex, rule }]

  for (let i = 0; i < (rawBlocks || []).length; i++) {
    const rawBlock = rawBlocks[i];

    // Collect block-level conditionalTags to hoist to section level
    const blockCTs = rawBlock.conditionalTags || [];
    for (const ct of blockCTs) {
      const normalizedRule = normalizeConditionalRule(ct);
      if (normalizedRule) {
        hoistedConditionalTags.push({ blockIndex: i, rule: normalizedRule });
      }
    }

    const { block, translit } = processBlock(rawBlock);
    cleanBlocks.push(block);

    if (translit) {
      translitSidecar.push({ blockIndex: i, translit });
    }
  }

  // Build the final SiddurSection
  const section = {
    id: sectionId,
    cardId,
    title,
    source: 'feigenbaum',
    sourcePages: [pageStart ?? 0, pageEnd ?? 0],
    blocks: cleanBlocks,
  };

  // Add conditionalRule (section-level) if present
  if (rawConditionalRule) {
    const normalizedRule = normalizeConditionalRule(rawConditionalRule);
    if (normalizedRule) {
      section.conditionalRule = normalizedRule;
    }
  }

  // Add hoisted conditionalTags if any
  if (hoistedConditionalTags.length > 0) {
    section.conditionalTags = hoistedConditionalTags;
  }

  return { section, translitSidecar };
}

// ─── Essay assembly ───────────────────────────────────────────────────────────

function assembleEssay(raw) {
  const { id, essayKind, title, body, anchoredFrom, pageStart, pageEnd } = raw;

  // Strip position from anchoredFrom entries
  const cleanedAnchoredFrom = (anchoredFrom || []).map(({ cardId, sectionId }) => ({
    cardId,
    sectionId,
  }));

  return {
    id,
    essayKind,
    title,
    source: 'feigenbaum',
    sourcePages: [pageStart ?? 0, pageEnd ?? 0],
    body: body || [],
    anchoredFrom: cleanedAnchoredFrom,
  };
}

// ─── File writing helpers ─────────────────────────────────────────────────────

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

function writeJSON(filePath, data) {
  writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

// ─── Main: Process sections ───────────────────────────────────────────────────

const sectionFiles = readdirSync(SECTIONS_DIR).filter((f) => f.endsWith('.learn.json'));
// Track sections by cardId
const cardSections = {}; // { cardId: [sectionId, ...] }

for (const filename of sectionFiles) {
  const raw = JSON.parse(readFileSync(join(SECTIONS_DIR, filename), 'utf8'));
  const { section, translitSidecar } = assembleSection(raw);

  const { cardId, id: sectionId } = section;

  const cardDir = join(OUTPUT_DIR, cardId);
  ensureDir(cardDir);

  // Write main JSON (without translit in prayer blocks)
  writeJSON(join(cardDir, `${sectionId}.json`), section);

  // Write translit sidecar if any prayer blocks have translit
  if (translitSidecar.length > 0) {
    writeJSON(join(cardDir, `${sectionId}.translit.json`), translitSidecar);
  }

  // Track for index generation
  if (!cardSections[cardId]) cardSections[cardId] = [];
  cardSections[cardId].push(sectionId);

  console.log(`  [section] ${cardId}/${sectionId} (${section.blocks.length} blocks)`);
}

// ─── Main: Process essays ─────────────────────────────────────────────────────

const essayFiles = readdirSync(ESSAYS_DIR).filter((f) => f.endsWith('.json'));
const essayIds = [];
const learnDir = join(OUTPUT_DIR, 'learn');
ensureDir(learnDir);

for (const filename of essayFiles) {
  const raw = JSON.parse(readFileSync(join(ESSAYS_DIR, filename), 'utf8'));
  const essay = assembleEssay(raw);

  writeJSON(join(learnDir, `${essay.id}.json`), essay);
  essayIds.push(essay.id);
  console.log(`  [essay] ${essay.id} (${essay.body.length} paragraphs)`);
}

// ─── Generate per-card index.ts files ─────────────────────────────────────────

for (const [cardId, sections] of Object.entries(cardSections)) {
  const lines = [
    `// AUTO-GENERATED by scripts/siddur/10_assemble.mjs — do not edit`,
    `import type { SiddurSection } from '../../../siddur/types';`,
    `export const SECTIONS = {`,
  ];

  for (const sectionId of sections.sort()) {
    lines.push(`  ${sectionId}: () => require('./${sectionId}.json') as SiddurSection,`);
  }

  lines.push(`} as const;`);
  lines.push(`export type SectionKey = keyof typeof SECTIONS;`);
  lines.push('');

  const indexPath = join(OUTPUT_DIR, cardId, 'index.ts');
  writeFileSync(indexPath, lines.join('\n'), 'utf8');
  console.log(`  [index] ${cardId}/index.ts (${sections.length} sections)`);
}

// ─── Generate learn/index.ts ──────────────────────────────────────────────────

{
  const lines = [
    `// AUTO-GENERATED by scripts/siddur/10_assemble.mjs — do not edit`,
    `import type { LearnEssay } from '../../../siddur/types';`,
    `export const ESSAYS = {`,
  ];

  for (const essayId of essayIds.sort()) {
    lines.push(`  ${essayId}: () => require('./${essayId}.json') as LearnEssay,`);
  }

  lines.push(`} as const;`);
  lines.push(`export type EssayKey = keyof typeof ESSAYS;`);
  lines.push('');

  writeFileSync(join(learnDir, 'index.ts'), lines.join('\n'), 'utf8');
  console.log(`  [index] learn/index.ts (${essayIds.length} essays)`);
}

// ─── Generate main src/data/siddur/index.ts ───────────────────────────────────

{
  const allCardIds = ['shacharit', 'birkat_hamazon', 'mincha', 'maariv', 'tefillos'];
  const presentCardIds = allCardIds.filter((id) => cardSections[id]?.length > 0);

  const importLines = presentCardIds.map(
    (id) => `import { SECTIONS as ${id.toUpperCase().replace('_', '_')} } from './${id}';`
  );

  // Build import aliases per card
  const aliasMap = {};
  for (const id of presentCardIds) {
    // e.g. birkat_hamazon → BIRKAT_HAMAZON
    aliasMap[id] = id.toUpperCase().split('').map((c, i, a) => c).join('');
  }

  const lines = [
    `// AUTO-GENERATED by scripts/siddur/10_assemble.mjs — do not edit`,
    `import type { CardId, SiddurSection } from '../../siddur/types';`,
    ...presentCardIds.map((id) => {
      const alias = id.toUpperCase();
      return `import { SECTIONS as ${alias} } from './${id}';`;
    }),
    ``,
    `const REGISTRY: Record<string, Record<string, () => SiddurSection>> = {`,
    ...presentCardIds.map((id) => `  ${id}: ${id.toUpperCase()},`),
    // Cards with no sections get empty registries
    ...allCardIds
      .filter((id) => !presentCardIds.includes(id))
      .map((id) => `  ${id}: {},`),
    `  learn: {},`,
    `};`,
    ``,
    `export function getSiddurSection(cardId: CardId, sectionId: string): SiddurSection | null {`,
    `  const loader = REGISTRY[cardId]?.[sectionId];`,
    `  if (!loader) return null;`,
    `  return loader();`,
    `}`,
    ``,
    `export function listSectionIds(cardId: CardId): string[] {`,
    `  return Object.keys(REGISTRY[cardId] ?? {});`,
    `}`,
    ``,
  ];

  writeFileSync(join(OUTPUT_DIR, 'index.ts'), lines.join('\n'), 'utf8');
  console.log(`  [index] src/data/siddur/index.ts (${presentCardIds.length} cards)`);
}

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log('\n=== Stage 10 complete ===');
for (const [cardId, sections] of Object.entries(cardSections)) {
  console.log(`  ${cardId}: ${sections.length} sections`);
}
console.log(`  learn: ${essayIds.length} essays`);
