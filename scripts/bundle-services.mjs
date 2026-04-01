#!/usr/bin/env node
/**
 * Bundles Mincha, Ma'ariv, and Birkat Hamazon prayer text from Sefaria.
 * Run: node scripts/bundle-services.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEFARIA_BASE = 'https://www.sefaria.org/api';
const BUNDLED_ROOT = path.join(__dirname, '..', 'src', 'data', 'bundled');

function stripHtml(text) {
  return text.replace(/<[^>]*>/g, '').trim();
}

function extractFootnotes(html) {
  const footnotes = [];
  const fp = /<sup[^>]*class="footnote-marker"[^>]*>(\d+)<\/sup>\s*<i[^>]*class="footnote"[^>]*>([\s\S]*?)<\/i>/g;
  let match;
  while ((match = fp.exec(html)) !== null) {
    footnotes.push({ marker: match[1], text: stripHtml(match[2]) });
  }
  const cleanHtml = html
    .replace(/<sup[^>]*class="footnote-marker"[^>]*>(\d+)<\/sup>\s*<i[^>]*class="footnote"[^>]*>[\s\S]*?<\/i>/g, '\u207D$1\u207E')
    .replace(/<sup[^>]*class="footnote-marker"[^>]*>(\d+)<\/sup>/g, '\u207D$1\u207E');
  return { text: stripHtml(cleanHtml), footnotes: footnotes.length > 0 ? footnotes : undefined };
}

function flattenTextArray(text) {
  if (typeof text === 'string') return [text];
  if (!text) return [];
  const result = [];
  for (const item of text) {
    if (Array.isArray(item)) result.push(...flattenTextArray(item));
    else if (item) result.push(item);
  }
  return result;
}

function isMinyanOnlyLine(he, en) {
  const h = (he || '').trim();
  const e = (en || '').toLowerCase().trim();
  if (/^(שליח ציבור|שליח צבור):?$/.test(h)) return true;
  if (/^בחזרת הש"ץ/.test(h)) return true;
  if (/^כשיגיע שליח צ/.test(h)) return true;
  if (/^to be said by the chazzan/i.test(e)) return true;
  if (/^\(when the chazzan/i.test(e)) return true;
  if (/^ועונין הקהל/.test(h)) return true;
  if (/^ואומר שליח צ/.test(h)) return true;
  if (/^\(בתענית ציבור/.test(h)) return true;
  if (/^הטעם שתקנו לברך/.test(h)) return true;
  return false;
}

async function fetchRef(ref) {
  const encoded = encodeURIComponent(ref).replace(/%2C/g, ',');
  const url = SEFARIA_BASE + '/texts/' + encoded + '?context=0&pad=0';
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('Sefaria ' + res.status + ' for "' + ref + '"');
  return res.json();
}

async function bundlePrayer(prayerId, refs, outputDir) {
  const allHe = [];
  const allText = [];
  const allFootnotes = [];

  for (const ref of refs) {
    const raw = await fetchRef(ref);
    const he = flattenTextArray(raw.he).map(stripHtml).filter(Boolean);
    const rawText = flattenTextArray(raw.text).filter(Boolean);

    const maxLen = Math.max(he.length, rawText.length);
    for (let i = 0; i < maxLen; i++) {
      const heLine = he[i] || '';
      const rawEnLine = rawText[i] || '';
      const { text: cleanText, footnotes } = extractFootnotes(rawEnLine);
      if (isMinyanOnlyLine(heLine, cleanText)) continue;
      if (heLine) allHe.push(heLine);
      if (cleanText) {
        allText.push(cleanText);
        if (footnotes) allFootnotes.push({ lineIndex: allText.length - 1, footnotes });
      }
    }
    await new Promise(function(r) { setTimeout(r, 300); });
  }

  const data = {
    ref: refs[0],
    he: allHe,
    text: allText,
    footnotes: allFootnotes.length > 0 ? allFootnotes : undefined,
    heTitle: prayerId,
  };
  fs.writeFileSync(path.join(outputDir, prayerId + '.json'), JSON.stringify(data, null, 2));
  return data.he.length;
}

const M = 'Siddur Ashkenaz, Weekday, Minchah';
const E = 'Siddur Ashkenaz, Weekday, Maariv';

const SERVICES = [
  {
    name: 'mincha',
    prayers: [
      { id: 'mincha_ashrei', refs: [M + ', Ashrei'] },
      {
        id: 'mincha_amidah',
        refs: [
          M+', Amida, Patriarchs', M+', Amida, Divine Might', M+', Amida, Holiness of God',
          M+', Amida, Knowledge', M+', Amida, Repentance', M+', Amida, Forgiveness',
          M+', Amida, Redemption', M+', Amida, Healing', M+', Amida, Prosperity',
          M+', Amida, Gathering the Exiles', M+', Amida, Justice', M+', Amida, Against Enemies',
          M+', Amida, The Righteous', M+', Amida, Rebuilding Jerusalem',
          M+', Amida, Kingdom of David', M+', Amida, Response to Prayer',
          M+', Amida, Temple Service', M+', Amida, Thanksgiving',
          M+', Amida, Peace', M+', Amida, Concluding Passage',
        ],
      },
      { id: 'mincha_tachanun', refs: [M+', Post Amidah, Tachanun, Nefilat Appayim', M+', Post Amidah, Tachanun, Shomer Yisrael'] },
      { id: 'mincha_aleinu', refs: [M+', Concluding Prayers, Alenu'] },
    ],
  },
  {
    name: 'maariv',
    prayers: [
      { id: 'maariv_vehu_rachum', refs: [E+', Vehu Rachum'] },
      {
        id: 'maariv_shema',
        refs: [
          E+', Blessings of the Shema, First Blessing before Shema',
          E+', Blessings of the Shema, Second Blessing before Shema',
          E+', Blessings of the Shema, Shema',
          E+', Blessings of the Shema, First Blessing after Shema',
          E+', Blessings of the Shema, Second Blessing after Shema',
          E+', Blessings of the Shema, Third Blessing after Shema',
        ],
      },
      {
        id: 'maariv_amidah',
        refs: [
          E+', Amidah, Patriarchs', E+', Amidah, Divine Might', E+', Amidah, Holiness of God',
          E+', Amidah, Knowledge', E+', Amidah, Repentance', E+', Amidah, Forgiveness',
          E+', Amidah, Redemption', E+', Amidah, Healing', E+', Amidah, Prosperity',
          E+', Amidah, Gathering the Exiles', E+', Amidah, Justice', E+', Amidah, Against Enemies',
          E+', Amidah, The Righteous', E+', Amidah, Rebuilding Jerusalem',
          E+', Amidah, Kingdom of David', E+', Amidah, Response to Prayer',
          E+', Amidah, Temple Service', E+', Amidah, Thanksgiving',
          E+', Amidah, Peace', E+', Amidah, Concluding Passage',
        ],
      },
      { id: 'maariv_aleinu', refs: [E+', Alenu'] },
    ],
  },
  {
    name: 'birkatHamazon',
    prayers: [
      { id: 'bh_zimmun', refs: ['Birkat Hamazon, Zimmun'] },
      { id: 'bh_hazan', refs: ['Birkat Hamazon, Blessing on the Food'] },
      { id: 'bh_haaretz', refs: ['Birkat Hamazon, Blessing on the Land'] },
      { id: 'bh_yerushalayim', refs: ['Birkat Hamazon, Blessing on Jerusalem'] },
      { id: 'bh_hatov', refs: ['Birkat Hamazon, Hatov Vehametiv'] },
    ],
  },
];

async function main() {
  for (const service of SERVICES) {
    const outputDir = path.join(BUNDLED_ROOT, service.name);
    fs.mkdirSync(outputDir, { recursive: true });
    console.log('\n=== ' + service.name.toUpperCase() + ' ===');
    let succeeded = 0;
    for (const prayer of service.prayers) {
      process.stdout.write('  ' + prayer.id + ' (' + prayer.refs.length + ' refs)... ');
      try {
        const lines = await bundlePrayer(prayer.id, prayer.refs, outputDir);
        console.log('OK (' + lines + ' lines)');
        succeeded++;
      } catch (err) {
        console.log('FAILED: ' + err.message);
      }
      await new Promise(function(r) { setTimeout(r, 500); });
    }
    console.log('  ' + succeeded + '/' + service.prayers.length + ' succeeded');
  }
  console.log('\nDone!');
}

main().catch(console.error);
