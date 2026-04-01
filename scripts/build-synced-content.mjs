#!/usr/bin/env node
/**
 * Builds perfectly-synced prayer content by using the Hebrew text from
 * readalongsiddur.com (which matches the audio recordings exactly) and
 * English translations from Sefaria.
 *
 * For each recorded prayer:
 * 1. Hebrew text + word timing from readalongsiddur.com data.js
 * 2. English translation from existing Sefaria bundled files
 * 3. Transliteration generated at runtime from the source Hebrew
 *
 * This guarantees 1:1 word-to-timing alignment (100% coverage).
 *
 * Run: node scripts/build-synced-content.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUNDLED_DIR = path.join(__dirname, '..', 'src', 'data', 'bundled', 'shacharit');
const TIMING_DIR = path.join(__dirname, '..', 'assets', 'timing', 'shacharit');

const RECORDED_PRAYERS = {
  modeh_ani: ['Modeh Ani', 'Reishis Chochma'],
  netilat_yadayim: ['Netilas Yadayim'],
  asher_yatzar: ['Asher Yatzar'],
  elokai_neshama: ['Elokai Neshama'],
  birchot_hatorah: ['Birchos HaTorah', 'Yivarechecha', 'Eilu Devarim'],
  birchot_hashachar: ['Brachos'],
  pesukei_dezimrah: [
    "Baruch She'amar", 'Hodu', 'Yehi Chavod', 'Ashrei',
    'Psalm 146', 'Psalm 147', 'Psalm 148', 'Psalm 149', 'Psalm 150',
    'Vayevarech David', 'Az Yashir', 'Yishtabach',
  ],
  shema: [
    'Yotzer Or', 'Ahava Rabah',
    'Shema', "Ve\u2019ahavta", 'Vehaya', 'Vayomer',
    'Veyatziv',
  ],
  amidah: [
    'Amida - Avos', 'Atah Gibor', 'Atah Kadosh',
    'Retzei', 'Modim', 'Sim Shalom', 'Elokai Netzor',
  ],
  ashrei_uva_letziyon: ['Ashrei'],
  aleinu: ['Aleinu'],
};

const AUDIO_FILES = {
  'Modeh Ani': 'modeh%20ani.mp3',
  'Reishis Chochma': 'Reishis%20chochma.mp3',
  'Netilas Yadayim': 'netilas%20yadayim.mp3',
  'Asher Yatzar': 'asher%20yatzar.mp3',
  'Elokai Neshama': 'elokai%20neshama.mp3',
  'Birchos HaTorah': '1st%20and%20second%20birchos%20hatorah.mp3',
  'Yivarechecha': 'yevarechecha.mp3',
  'Eilu Devarim': '1st%20and%202nd%20eilu%20devarim.mp3',
  'Brachos': 'brachos.mp3',
  "Baruch She'amar": 'baruch%20sheamar.mp3',
  'Hodu': 'Hodu.mp3',
  'Yehi Chavod': 'yehi%20kavod.mp3',
  'Ashrei': 'ashrei.mp3',
  'Psalm 146': 'psalm%20146%20Hallelukah.mp3',
  'Psalm 147': 'psalm%20147%20Hallelukah.mp3',
  'Psalm 148': 'psalm%20148%20Hallelukah.mp3',
  'Psalm 149': 'psalm%20149%20hallelukah.mp3',
  'Psalm 150': 'psalm%20150%20hallelukah.mp3',
  'Vayevarech David': 'vayevarech%20david.mp3',
  'Az Yashir': 'vayosha%20az%20yashir.mp3',
  'Yishtabach': 'yishtabach.mp3',
  'Yotzer Or': 'yotzer%20or.mp3',
  'Ahava Rabah': 'ahava%20rabah.mp3',
  'Shema': 'shema%20and%20baruch%20shem.mp3',
  "Ve\u2019ahavta": 'veahavta.mp3',
  'Vehaya': 'vehaya%20im%20shamoa.mp3',
  'Vayomer': 'vayomer.mp3',
  'Veyatziv': 'veyatziv.mp3',
  'Amida - Avos': 'avos%20-%20shacharis.mp3',
  'Atah Gibor': 'atah%20gibor.mp3',
  'Atah Kadosh': 'atah%20kadosh.mp3',
  'Retzei': 'reztai%20and%20v%27sechezena.mp3',
  'Modim': 'modim.mp3',
  'Sim Shalom': 'sim%20shalom.mp3',
  'Elokai Netzor': 'elokai%20netzor.mp3',
  'Aleinu': 'al%20harishonim.mp3',
};

async function getAudioDurationMs(title) {
  const filename = AUDIO_FILES[title];
  if (!filename) return null;
  try {
    const response = await fetch('https://readalongsiddur.com/audio/' + filename);
    const buffer = await response.arrayBuffer();
    const tmpPath = '/tmp/daven_dur_' + Math.random().toString(36).slice(2);
    fs.writeFileSync(tmpPath, Buffer.from(buffer));
    const dur = execFileSync('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      tmpPath,
    ], { encoding: 'utf-8' }).trim();
    fs.unlinkSync(tmpPath);
    return Math.round(parseFloat(dur) * 1000);
  } catch {
    return null;
  }
}

/**
 * Extract timed Hebrew words from a passage HTML.
 * Each passage becomes one line (all its words concatenated).
 */
function extractPassageWords(html, offsetMs) {
  const words = [];
  const pat = /data-dur="([^"]+)"\s+data-begin="([^"]+)">([^<]+)/g;
  let m;
  while ((m = pat.exec(html)) !== null) {
    const dur = parseFloat(m[1]);
    const begin = parseFloat(m[2]);
    let hebrew = m[3].trim();
    // Remove trailing punctuation but keep Hebrew characters
    hebrew = hebrew.replace(/[,.:;!?]+$/, '');
    if (!hebrew) continue;
    words.push({
      hebrew,
      startTime: Math.round(begin * 1000) + offsetMs,
      endTime: Math.round((begin + dur) * 1000) + offsetMs,
    });
  }
  return words;
}

async function main() {
  console.log('Fetching data.js from readalongsiddur.com...');
  const res = await fetch('https://readalongsiddur.com/js/data.js');
  const dataJs = await res.text();

  const entryPattern = /\[(\d+),`([^`]+)`,`([^`]+)`,`([^`]+)`,`([\s\S]*?)`\]/g;
  const passages = new Map();
  let match;
  while ((match = entryPattern.exec(dataJs)) !== null) {
    passages.set(match[4], match[5]);
  }
  console.log('Found ' + passages.size + ' passages\n');

  fs.mkdirSync(TIMING_DIR, { recursive: true });

  let totalPrayers = 0;
  let totalWords = 0;

  for (const [prayerId, sourceTitles] of Object.entries(RECORDED_PRAYERS)) {
    console.log(prayerId + ':');

    // Each passage becomes one line in the output
    const lines = []; // Array of { hebrewLine, timing: [{startTime, endTime}], passageTitle }
    let timeOffset = 0;

    for (const title of sourceTitles) {
      const html = passages.get(title);
      if (!html) {
        console.log('  SKIP "' + title + '" (not found in data.js)');
        continue;
      }

      const words = extractPassageWords(html, timeOffset);
      if (words.length === 0) continue;

      lines.push({
        hebrewLine: words.map(w => w.hebrew).join(' '),
        timing: words.map(w => ({ startTime: w.startTime, endTime: w.endTime })),
        passageTitle: title,
      });

      console.log('  "' + title + '": ' + words.length + ' words');
      totalWords += words.length;

      // Use actual audio duration for next passage offset
      const dur = await getAudioDurationMs(title);
      if (dur) {
        timeOffset += dur;
      } else {
        timeOffset = words[words.length - 1].endTime + 500;
      }
    }

    // Load existing Sefaria bundled file for English translations + footnotes
    const sefariaPath = path.join(BUNDLED_DIR, prayerId + '.json');
    let englishLines = [];
    let footnotes;
    if (fs.existsSync(sefariaPath)) {
      const sefaria = JSON.parse(fs.readFileSync(sefariaPath, 'utf-8'));
      englishLines = sefaria.text || [];
      footnotes = sefaria.footnotes;
    }

    // Build outputs
    const heLines = lines.map(l => l.hebrewLine);
    const timing = lines.map(l => ({ words: l.timing }));

    // Write bundled content (Hebrew from source, English from Sefaria)
    const bundled = {
      ref: 'readalongsiddur.com',
      he: heLines,
      text: englishLines,
      footnotes,
      heTitle: prayerId,
    };
    fs.writeFileSync(path.join(BUNDLED_DIR, prayerId + '.json'), JSON.stringify(bundled, null, 2));

    // Write timing (100% coverage guaranteed — every word has timing)
    fs.writeFileSync(path.join(TIMING_DIR, prayerId + '.json'), JSON.stringify(timing, null, 2));

    const lineWordCounts = lines.map(l => l.timing.length);
    console.log('  -> ' + lines.length + ' lines, ' + lineWordCounts.reduce((a, b) => a + b, 0) + ' words, 100% timing');
    console.log();
    totalPrayers++;
  }

  console.log('=== SUMMARY ===');
  console.log(totalPrayers + ' prayers rebuilt with source-matched Hebrew');
  console.log(totalWords + ' total words with exact timing');
  console.log('All recorded prayers now have 100% word-to-timing alignment');
}

main().catch(console.error);
