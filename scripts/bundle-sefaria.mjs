#!/usr/bin/env node
/**
 * Fetches prayer text from Sefaria API and saves as bundled JSON files.
 * Run: node scripts/bundle-sefaria.mjs
 *
 * For composite prayers (Amidah, Shema, etc.), fetches multiple sub-sections
 * and combines them into a single bundled file.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEFARIA_BASE = 'https://www.sefaria.org/api';
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'data', 'bundled', 'shacharit');

// Prefix all refs with "Siddur Ashkenaz, "
const P = 'Siddur Ashkenaz, Weekday, Shacharit,';

// Each prayer maps to one or more Sefaria refs.
// Multi-ref prayers are fetched individually and combined.
const SHACHARIT_PRAYERS = [
  { id: 'modeh_ani', refs: [`${P} Preparatory Prayers, Modeh Ani`] },
  { id: 'netilat_yadayim', refs: [`${P} Preparatory Prayers, Netilat Yadayim`] },
  { id: 'asher_yatzar', refs: [`${P} Preparatory Prayers, Asher Yatzar`] },
  { id: 'elokai_neshama', refs: [`${P} Preparatory Prayers, Elokai Neshama`] },
  { id: 'birchot_hatorah', refs: [`${P} Preparatory Prayers, Torah Blessings`] },
  { id: 'birchot_hashachar', refs: [`${P} Preparatory Prayers, Morning Blessings`] },
  { id: 'akedah', refs: [`${P} Preparatory Prayers, Akedah`] },
  {
    id: 'korbanot',
    refs: [
      `${P} Preparatory Prayers, Korbanot, Kiyor`,
      `${P} Preparatory Prayers, Korbanot, Terumat HaDeshen`,
      `${P} Preparatory Prayers, Korbanot, Korban HaTamid`,
      `${P} Preparatory Prayers, Korbanot, Ketoret`,
      `${P} Preparatory Prayers, Korbanot, Baraita of Rabbi Yishmael`,
    ],
  },
  {
    id: 'pesukei_dezimrah',
    refs: [
      `${P} Pesukei Dezimra, Barukh She'amar`,
      `${P} Pesukei Dezimra, Hodu`,
      `${P} Pesukei Dezimra, Ashrei`,
      `${P} Pesukei Dezimra, Psalm 146`,
      `${P} Pesukei Dezimra, Psalm 147`,
      `${P} Pesukei Dezimra, Psalm 148`,
      `${P} Pesukei Dezimra, Psalm 149`,
      `${P} Pesukei Dezimra, Psalm 150`,
      `${P} Pesukei Dezimra, Vayevarech David`,
      `${P} Pesukei Dezimra, Az Yashir`,
      `${P} Pesukei Dezimra, Yishtabach`,
    ],
  },
  {
    id: 'shema',
    refs: [
      `${P} Blessings of the Shema, Barchu`,
      `${P} Blessings of the Shema, First Blessing before Shema`,
      `${P} Blessings of the Shema, Second Blessing before Shema`,
      `${P} Blessings of the Shema, Shema`,
      `${P} Blessings of the Shema, Blessing after Shema`,
    ],
  },
  {
    id: 'amidah',
    refs: [
      `${P} Amidah, Patriarchs`,
      `${P} Amidah, Divine Might`,
      `${P} Amidah, Holiness of God`,
      `${P} Amidah, Knowledge`,
      `${P} Amidah, Repentance`,
      `${P} Amidah, Forgiveness`,
      `${P} Amidah, Redemption`,
      `${P} Amidah, Healing`,
      `${P} Amidah, Prosperity`,
      `${P} Amidah, Gathering the Exiles`,
      `${P} Amidah, Justice`,
      `${P} Amidah, Against Enemies`,
      `${P} Amidah, The Righteous`,
      `${P} Amidah, Rebuilding Jerusalem`,
      `${P} Amidah, Kingdom of David`,
      `${P} Amidah, Response to Prayer`,
      `${P} Amidah, Temple Service`,
      `${P} Amidah, Thanksgiving`,
      `${P} Amidah, Birkat Kohanim`,
      `${P} Amidah, Peace`,
      `${P} Amidah, Concluding Passage`,
    ],
  },
  {
    id: 'tachanun',
    refs: [
      `${P} Post Amidah, Tachanun, Nefilat Apayim`,
      `${P} Post Amidah, Tachanun, God of Israel`,
      `${P} Post Amidah, Tachanun, Shomer Yisrael`,
    ],
  },
  {
    id: 'ashrei_uva_letziyon',
    refs: [
      `${P} Concluding Prayers, Ashrei`,
      `${P} Concluding Prayers, Uva Letzion`,
    ],
  },
  { id: 'aleinu', refs: [`${P} Concluding Prayers, Alenu`] },
  { id: 'shir_shel_yom', refs: [`${P} Concluding Prayers, Song of the Day`] },
];

function stripHtml(text) {
  return text.replace(/<[^>]*>/g, '').trim();
}

/**
 * Extracts footnotes from Sefaria English HTML and returns clean text + footnotes.
 * Sefaria format: <sup class="footnote-marker">1</sup><i class="footnote">...text...</i>
 */
function extractFootnotes(html) {
  const footnotes = [];
  const footnotePattern = /<sup[^>]*class="footnote-marker"[^>]*>(\d+)<\/sup>\s*<i[^>]*class="footnote"[^>]*>([\s\S]*?)<\/i>/g;
  let match;
  while ((match = footnotePattern.exec(html)) !== null) {
    footnotes.push({
      marker: match[1],
      text: stripHtml(match[2]),
    });
  }

  // Remove footnote bodies but keep markers as superscript-style indicators
  const cleanHtml = html
    .replace(/<sup[^>]*class="footnote-marker"[^>]*>(\d+)<\/sup>\s*<i[^>]*class="footnote"[^>]*>[\s\S]*?<\/i>/g, '⁽$1⁾')
    .replace(/<sup[^>]*class="footnote-marker"[^>]*>(\d+)<\/sup>/g, '⁽$1⁾');

  const cleanText = stripHtml(cleanHtml);
  return { text: cleanText, footnotes: footnotes.length > 0 ? footnotes : undefined };
}

function flattenTextArray(text) {
  if (typeof text === 'string') return [text];
  if (!text) return [];
  const result = [];
  for (const item of text) {
    if (Array.isArray(item)) {
      result.push(...flattenTextArray(item));
    } else if (item) {
      result.push(item);
    }
  }
  return result;
}

async function fetchRef(ref) {
  const encoded = encodeURIComponent(ref).replace(/%2C/g, ',');
  const url = `${SEFARIA_BASE}/texts/${encoded}?context=0&pad=0`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Sefaria ${res.status} for "${ref}" — ${body.slice(0, 200)}`);
  }
  return res.json();
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let succeeded = 0;
  let failed = 0;

  for (const prayer of SHACHARIT_PRAYERS) {
    process.stdout.write(`Fetching ${prayer.id} (${prayer.refs.length} ref(s))... `);
    try {
      const allHe = [];
      const allText = [];

      const allFootnotes = [];

      for (const ref of prayer.refs) {
        const raw = await fetchRef(ref);
        const he = flattenTextArray(raw.he).map(stripHtml).filter(Boolean);
        const rawText = flattenTextArray(raw.text).filter(Boolean);

        // Process each English line: extract footnotes, strip remaining HTML
        for (let i = 0; i < rawText.length; i++) {
          const { text: cleanText, footnotes } = extractFootnotes(rawText[i]);
          if (cleanText) {
            allText.push(cleanText);
            if (footnotes) {
              allFootnotes.push({ lineIndex: allText.length - 1, footnotes });
            }
          }
        }

        allHe.push(...he);
        // Small delay between sub-fetches
        await new Promise((r) => setTimeout(r, 300));
      }

      const data = {
        ref: prayer.refs.length === 1 ? prayer.refs[0] : prayer.refs[0].replace(/,[^,]+$/, ''),
        he: allHe,
        text: allText,
        footnotes: allFootnotes.length > 0 ? allFootnotes : undefined,
        heTitle: prayer.id,
      };

      const outPath = path.join(OUTPUT_DIR, `${prayer.id}.json`);
      fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
      console.log(`OK (${data.he.length} lines)`);
      succeeded++;
    } catch (err) {
      console.log(`FAILED: ${err.message}`);
      failed++;
    }

    // Delay between prayers
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\nDone: ${succeeded} succeeded, ${failed} failed`);
}

main().catch(console.error);
