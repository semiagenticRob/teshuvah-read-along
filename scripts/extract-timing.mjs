#!/usr/bin/env node
/**
 * Extracts word-level timing data from readalongsiddur.com's data.js
 * and aligns it to our bundled Sefaria text.
 *
 * Strategy: For each audio passage, find the best starting position in the
 * bundled text by searching for the first few words as an anchor, then
 * align sequentially from that anchor point.
 *
 * Run: node scripts/extract-timing.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TIMING_DIR = path.join(__dirname, '..', 'assets', 'timing', 'shacharit');

// Map source titles to their audio filenames for duration probing
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

/**
 * Get the duration of an audio file from readalongsiddur.com in milliseconds.
 * Uses ffprobe on a downloaded temp copy.
 */
async function getAudioDurationMs(title) {
  const filename = AUDIO_FILES[title];
  if (!filename) return null;

  const url = 'https://readalongsiddur.com/audio/' + filename;
  const tmpPath = '/tmp/daven_probe_' + filename.replace(/%20/g, '_');

  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(tmpPath, Buffer.from(buffer));

    const { execSync } = await import('child_process');
    const dur = execSync(
      'ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ' +
      JSON.stringify(tmpPath),
      { encoding: 'utf-8' }
    ).trim();
    fs.unlinkSync(tmpPath);
    return Math.round(parseFloat(dur) * 1000);
  } catch {
    return null;
  }
}

const PRAYER_MAPPING = {
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

function normalizeHebrew(word) {
  return word
    .replace(/[\u0590-\u05CF]/g, '')
    .replace(/[\u05BE]/g, ' ')
    .replace(/[,.:;!?\-"'()]/g, '')
    .trim();
}

function extractTimedWords(html, offsetMs) {
  const words = [];
  const pat = /data-dur="([^"]+)"\s+data-begin="([^"]+)">([^<]+)/g;
  let m;
  while ((m = pat.exec(html)) !== null) {
    const dur = parseFloat(m[1]);
    const begin = parseFloat(m[2]);
    words.push({
      normalized: normalizeHebrew(m[3].trim()),
      startTime: Math.round(begin * 1000) + offsetMs,
      endTime: Math.round((begin + dur) * 1000) + offsetMs,
    });
  }
  return words;
}

/**
 * Find the best anchor position in flatBundled for a passage's words.
 * Tries 3-word, 2-word, then 1-word anchors (using words 3-5 for single
 * to avoid common opening words like ברוך, הללויה).
 */
function findAnchor(passageWords, flatBundled, searchStart) {
  if (passageWords.length === 0) return -1;

  // Try 3-word anchor first
  for (let anchorLen = Math.min(3, passageWords.length); anchorLen >= 2; anchorLen--) {
    const anchor = passageWords.slice(0, anchorLen).map(w => w.normalized);
    for (let i = searchStart; i < flatBundled.length - anchorLen + 1; i++) {
      let match = true;
      for (let j = 0; j < anchorLen; j++) {
        if (flatBundled[i + j].parts[0] !== anchor[j] && flatBundled[i + j].norm !== anchor[j]) {
          match = false;
          break;
        }
      }
      if (match) return i;
    }
  }

  // Try single distinctive words (skip first few which may be common)
  // Try words at positions 3, 4, 5 as they're more distinctive
  for (const offset of [3, 4, 5, 2, 1, 0]) {
    if (offset >= passageWords.length) continue;
    const target = passageWords[offset].normalized;
    if (target.length <= 2) continue; // skip very short words
    for (let i = searchStart; i < flatBundled.length; i++) {
      if (flatBundled[i].parts[0] === target || flatBundled[i].norm === target) {
        // Verify by checking the next word too if available
        if (offset + 1 < passageWords.length && i + 1 < flatBundled.length) {
          const nextTarget = passageWords[offset + 1].normalized;
          const nextBundled = flatBundled[i + 1];
          if (nextBundled.parts[0] === nextTarget || nextBundled.norm === nextTarget) {
            return Math.max(searchStart, i - offset); // back up to estimated start
          }
        } else {
          return Math.max(searchStart, i - offset);
        }
      }
    }
  }

  return -1;
}

/**
 * Align a single passage's timed words to the bundled text starting from anchorIdx.
 * Returns the number of bundled words consumed.
 */
function alignPassage(timedWords, flatBundled, bundledTiming, anchorIdx) {
  let bIdx = anchorIdx;
  let matched = 0;

  for (let sIdx = 0; sIdx < timedWords.length; sIdx++) {
    const src = timedWords[sIdx];

    // Look ahead up to 15 positions in bundled text for a match
    let found = false;
    for (let look = 0; look <= 15 && bIdx + look < flatBundled.length; look++) {
      const b = flatBundled[bIdx + look];

      if (b.parts[0] === src.normalized || b.norm === src.normalized) {
        // Handle maqaf: bundled word may consume multiple source words
        if (b.parts.length > 1 && b.parts[0] === src.normalized) {
          const startTime = src.startTime;
          let endTime = src.endTime;
          for (let p = 1; p < b.parts.length && sIdx + 1 < timedWords.length; p++) {
            if (timedWords[sIdx + 1].normalized === b.parts[p]) {
              sIdx++;
              endTime = timedWords[sIdx].endTime;
            }
          }
          bundledTiming[bIdx + look] = { startTime, endTime };
        } else {
          bundledTiming[bIdx + look] = { startTime: src.startTime, endTime: src.endTime };
        }
        bIdx = bIdx + look + 1;
        matched++;
        found = true;
        break;
      }
    }
    // If not found within 15 words, skip this source word (variant/extra in source)
  }

  return matched;
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
  console.log('Found ' + passages.size + ' passages');

  fs.mkdirSync(TIMING_DIR, { recursive: true });

  for (const [prayerId, sourceTitles] of Object.entries(PRAYER_MAPPING)) {
    console.log('\n' + prayerId + ':');

    const bundledPath = path.join(__dirname, '..', 'src', 'data', 'bundled', 'shacharit', prayerId + '.json');
    if (!fs.existsSync(bundledPath)) continue;
    const bundled = JSON.parse(fs.readFileSync(bundledPath, 'utf-8'));

    // Flatten bundled words
    const flatBundled = [];
    for (let li = 0; li < bundled.he.length; li++) {
      const words = bundled.he[li].split(/\s+/).filter(Boolean);
      for (let wi = 0; wi < words.length; wi++) {
        const norm = normalizeHebrew(words[wi]);
        const parts = norm.split(/\s+/).filter(Boolean);
        flatBundled.push({ lineIdx: li, wordIdx: wi, norm, parts });
      }
    }

    const bundledTiming = new Array(flatBundled.length).fill(null);
    let searchStart = 0;
    let timeOffset = 0;
    let totalSourceWords = 0;
    let totalMatched = 0;

    for (const title of sourceTitles) {
      const html = passages.get(title);
      if (!html) {
        console.log('  WARNING: "' + title + '" not found');
        continue;
      }

      const timedWords = extractTimedWords(html, timeOffset);
      totalSourceWords += timedWords.length;

      if (timedWords.length === 0) continue;

      // Find anchor point in bundled text
      const anchor = findAnchor(timedWords, flatBundled, searchStart);
      if (anchor === -1) {
        console.log('  "' + title + '": ' + timedWords.length + ' words — NO ANCHOR FOUND (skipping)');
      } else {
        const matched = alignPassage(timedWords, flatBundled, bundledTiming, anchor);
        totalMatched += matched;
        console.log('  "' + title + '": ' + timedWords.length + ' source -> ' + matched + ' matched (anchor at word ' + anchor + ')');
        for (let i = flatBundled.length - 1; i >= anchor; i--) {
          if (bundledTiming[i] !== null) {
            searchStart = i + 1;
            break;
          }
        }
      }

      // Use actual audio file duration to set offset for next passage
      const audioDur = await getAudioDurationMs(title);
      if (audioDur) {
        timeOffset += audioDur;
      } else if (timedWords.length > 0) {
        // Fallback: use last word end time + small gap
        timeOffset = timedWords[timedWords.length - 1].endTime + 500;
      }
    }

    // Build per-line timing with interpolation for gaps
    const timing = [];
    let flatIdx = 0;
    let lastKnownTime = 0;

    for (let li = 0; li < bundled.he.length; li++) {
      const lineWordCount = bundled.he[li].split(/\s+/).filter(Boolean).length;
      const lineTiming = [];

      for (let wi = 0; wi < lineWordCount; wi++) {
        const t = bundledTiming[flatIdx];
        if (t) {
          lineTiming.push(t);
          lastKnownTime = t.endTime;
        } else {
          lineTiming.push({ startTime: lastKnownTime, endTime: lastKnownTime });
        }
        flatIdx++;
      }

      timing.push({ words: lineTiming });
    }

    const outPath = path.join(TIMING_DIR, prayerId + '.json');
    fs.writeFileSync(outPath, JSON.stringify(timing, null, 2));
    console.log('  TOTAL: ' + totalMatched + '/' + totalSourceWords + ' source words matched across ' + flatBundled.length + ' bundled words');
  }

  console.log('\nDone!');
}

main().catch(console.error);
